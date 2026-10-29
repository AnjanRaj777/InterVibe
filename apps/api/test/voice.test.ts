import { createServer, type Server } from "node:http";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { WebSocket, WebSocketServer } from "ws";
import { setupVoiceWebSocketRelay } from "../src/voice/realtime.js";
import { createMemoryStore } from "../src/auth/store.js";
import { createMemorySessionStore } from "../src/sessions/store.js";
import { assembleContext, estimateTokens, type DrillTurn } from "../src/drill/drill.js";
import { TurnEvaluation } from "@intervibe/contracts";

describe("Phase 4 — Voice Pipeline Realtime WebSocket & Turn Loop", () => {
  let server: Server;
  let relayWss: WebSocketServer;
  let port: number;
  let authStore: ReturnType<typeof createMemoryStore>;
  let sessionStore: ReturnType<typeof createMemorySessionStore>;
  let validSessionId: string;
  let validCookie: string;

  beforeAll(async () => {
    authStore = createMemoryStore();
    sessionStore = createMemorySessionStore();

    const user = await authStore.createUser("voice-tester@example.com");
    validCookie = "test-session-cookie-123";
    await authStore.createSession({
      userId: user.id,
      cookie: validCookie,
      expiresAt: new Date(Date.now() + 3600_000),
    });

    const session = await sessionStore.currentSession(user.id);
    validSessionId = session.id;

    await sessionStore.saveBundle(validSessionId, {
      plan: {
        modules: [
          {
            kind: "knowledge_drill",
            title: "Distributed Systems Architecture",
            goal: "Assess consistency models and partitioning.",
            source: "JD must-have 'Distributed Systems'",
            estimatedQuestions: 4,
            passBar: "Score 75+",
          },
        ],
      },
    });

    server = createServer((_req, res) => {
      res.writeHead(200);
      res.end("ok");
    });

    relayWss = setupVoiceWebSocketRelay({
      server,
      authStore,
      sessionStore,
      apiKey: "mock-api-key",
      isTest: true,
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (typeof addr === "object" && addr) {
          port = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    for (const client of relayWss.clients) {
      client.terminate();
    }
    await new Promise<void>((resolve) => relayWss.close(() => resolve()));
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("rejects unauthenticated WebSocket connection with 401", async () => {
    const wsUrl = `ws://localhost:${port}/sessions/${validSessionId}/voice-stream`;
    const ws = new WebSocket(wsUrl);

    const err = await new Promise<string>((resolve) => {
      ws.on("error", (e) => resolve(e.message));
      ws.on("unexpected-response", (_req, res) => {
        resolve(`HTTP ${res.statusCode}`);
      });
    });

    expect(err).toContain("401");
  });

  it("connects successfully with valid session cookie", async () => {
    const wsUrl = `ws://localhost:${port}/sessions/${validSessionId}/voice-stream`;
    const ws = new WebSocket(wsUrl, {
      headers: {
        Cookie: `intervibe_session=${validCookie}`,
      },
    });

    await new Promise<void>((resolve, reject) => {
      ws.on("open", () => resolve());
      ws.on("error", reject);
    });

    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it("executes simulated speech turn loop: complete -> ai_start -> chunks -> ai_complete", async () => {
    const wsUrl = `ws://localhost:${port}/sessions/${validSessionId}/voice-stream`;
    const ws = new WebSocket(wsUrl, {
      headers: {
        Cookie: `intervibe_session=${validCookie}`,
      },
    });

    await new Promise<void>((resolve) => ws.on("open", () => resolve()));

    const receivedEvents: any[] = [];
    ws.on("message", (data) => {
      receivedEvents.push(JSON.parse(String(data)));
    });

    ws.send(
      JSON.stringify({
        action: "simulate_speech_complete",
        transcript:
          "I used Raft for consensus because it provided linearizable reads with leader leases at 50k rps.",
      }),
    );

    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (receivedEvents.some((e) => e.type === "ai_complete")) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });

    ws.close();

    const speechComplete = receivedEvents.find((e) => e.type === "speech_complete");
    expect(speechComplete).toBeDefined();
    expect(speechComplete.turnId).toBeDefined();
    expect(speechComplete.transcript).toContain("Raft");

    const aiStart = receivedEvents.find((e) => e.type === "ai_start");
    expect(aiStart).toBeDefined();

    const aiChunks = receivedEvents.filter((e) => e.type === "ai_chunk");
    expect(aiChunks.length).toBeGreaterThan(0);

    const aiComplete = receivedEvents.find((e) => e.type === "ai_complete");
    expect(aiComplete).toBeDefined();
    expect(aiComplete.evaluation).toBeDefined();
    expect(aiComplete.evaluation.overall).toBeGreaterThan(0);
  });

  it("barge-in cancels pending AI response immediately", async () => {
    const wsUrl = `ws://localhost:${port}/sessions/${validSessionId}/voice-stream`;
    const ws = new WebSocket(wsUrl, {
      headers: {
        Cookie: `intervibe_session=${validCookie}`,
      },
    });

    await new Promise<void>((resolve) => ws.on("open", () => resolve()));

    const receivedEvents: any[] = [];
    ws.on("message", (data) => {
      receivedEvents.push(JSON.parse(String(data)));
    });

    // Start simulated speech
    ws.send(
      JSON.stringify({
        action: "simulate_speech_complete",
        transcript: "Let me explain the consistency model.",
      }),
    );

    // Wait until ai_start is received
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (receivedEvents.some((e) => e.type === "ai_start")) {
          clearInterval(check);
          resolve();
        }
      }, 20);
    });

    // Immediately trigger barge-in from candidate
    ws.send(JSON.stringify({ action: "barge_in" }));

    await new Promise((r) => setTimeout(r, 100));
    ws.close();

    const bargeInEvent = receivedEvents.find((e) => e.type === "barge_in");
    expect(bargeInEvent).toBeDefined();
  });

  it("context assembler respects token budget with voice turns included", () => {
    const mockTurns: DrillTurn[] = Array.from({ length: 6 }, (_, i) => ({
      question: `Question ${i + 1}: How does Raft handle network partitions?`,
      answer: `Answer ${i + 1}: In partition scenarios, the minority quorum drops writes while the majority elects a leader.`,
      evaluation: TurnEvaluation.parse({
        dimensions: [
          { dimension: "correctness_depth", score: 85, evidence: "minority quorum drops writes" },
          { dimension: "structure", score: 80, evidence: "partition scenarios" },
          { dimension: "communication_clarity", score: 85, evidence: "majority elects leader" },
          { dimension: "jd_relevance", score: 90, evidence: "Raft handle network partitions" },
          { dimension: "evidence", score: 75, evidence: "drops writes" },
        ],
        overall: 83,
        next_fix: "Add quantitative metrics on recovery time.",
      }),
      promptVersion: "drill-v1",
    }));

    const result = assembleContext({
      system: "Strict FAANG interviewer system prompt with rubrics.",
      profiles: "Candidate: Senior Backend Engineer. JD: Distributed Systems.",
      summary: null,
      recentTurns: mockTurns.slice(-4),
    });

    expect(result.contextTokens).toBeLessThan(6000);
    expect(result.messages.length).toBe(4);
    expect(result.messages[3].content).toContain("Question 6");
    expect(result.messages[3].content).toContain("Answer 6");
  });
});
