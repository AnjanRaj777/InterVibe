import { createServer, type Server } from "node:http";
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { WebSocket, WebSocketServer } from "ws";
import { setupVoiceWebSocketRelay } from "../src/voice/realtime.js";
import { createMemoryStore } from "../src/auth/store.js";
import { createMemorySessionStore } from "../src/sessions/store.js";

function resolveFixturesDir(): string {
  const local = join(process.cwd(), "fixtures", "voice");
  if (existsSync(local)) return local;
  return join(process.cwd(), "..", "..", "fixtures", "voice");
}

function quantile(arr: number[], q: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return Math.round(sorted[base] + rest * (sorted[base + 1] - sorted[base]));
  }
  return Math.round(sorted[base]);
}

describe("Phase 4 — Voice Latency Benchmark & Gate Targets", () => {
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

    const user = await authStore.createUser("latency-tester@example.com");
    validCookie = "cookie-latency-test";
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
            title: "Performance & Scalability",
            goal: "Assess high-throughput architectures.",
            source: "JD must-have 'Scalability'",
            estimatedQuestions: 20,
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
      apiKey: "mock-key",
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

  it("measures 20 voice exchanges and meets Phase 4 p95 targets", async () => {
    const wsUrl = `ws://localhost:${port}/sessions/${validSessionId}/voice-stream`;
    const ws = new WebSocket(wsUrl, {
      headers: { Cookie: `intervibe_session=${validCookie}` },
    });

    await new Promise<void>((resolve) => ws.on("open", () => resolve()));

    const firstChunkLatencies: number[] = [];
    const bargeInLatencies: number[] = [];

    // Run 20 voice exchanges
    for (let i = 0; i < 20; i++) {
      const startSpeechComplete = Date.now();
      let firstChunkReceivedAt: number | null = null;

      const messageHandler = (data: Buffer | string) => {
        const msg = JSON.parse(String(data));
        if (msg.type === "ai_chunk" && firstChunkReceivedAt === null) {
          firstChunkReceivedAt = Date.now();
        }
      };

      ws.on("message", messageHandler);

      ws.send(
        JSON.stringify({
          action: "simulate_speech_complete",
          transcript: `Exchange ${i + 1}: We applied sharding and distributed consensus to keep latency low.`,
        }),
      );

      // Wait for first chunk
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (firstChunkReceivedAt !== null) {
            clearInterval(check);
            resolve();
          }
        }, 10);
      });

      const latencyMs = (firstChunkReceivedAt ?? Date.now()) - startSpeechComplete;
      firstChunkLatencies.push(latencyMs);

      // Now test barge-in responsiveness
      const bargeInStart = Date.now();
      let bargeInAckedAt: number | null = null;

      const bargeInHandler = (data: Buffer | string) => {
        const msg = JSON.parse(String(data));
        if (msg.type === "barge_in" && bargeInAckedAt === null) {
          bargeInAckedAt = Date.now();
        }
      };
      ws.on("message", bargeInHandler);
      ws.send(JSON.stringify({ action: "barge_in" }));

      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (bargeInAckedAt !== null) {
            clearInterval(check);
            resolve();
          }
        }, 5);
      });

      const bargeInMs = (bargeInAckedAt ?? Date.now()) - bargeInStart;
      bargeInLatencies.push(bargeInMs);

      ws.off("message", messageHandler);
      ws.off("message", bargeInHandler);

      // Brief gap between exchanges
      await new Promise((r) => setTimeout(r, 20));
    }

    ws.close();

    const firstChunkP50 = quantile(firstChunkLatencies, 0.5);
    const firstChunkP95 = quantile(firstChunkLatencies, 0.95);
    const bargeInP50 = quantile(bargeInLatencies, 0.5);
    const bargeInP95 = quantile(bargeInLatencies, 0.95);

    const report = {
      timestamp: new Date().toISOString(),
      sampleCount: 20,
      targets: {
        firstAudioMaxMs: 2500,
        bargeInMaxMs: 300,
      },
      results: {
        firstChunkLatenciesMs: firstChunkLatencies,
        firstAudioP50Ms: firstChunkP50,
        firstAudioP95Ms: firstChunkP95,
        bargeInLatenciesMs: bargeInLatencies,
        bargeInP50Ms: bargeInP50,
        bargeInP95Ms: bargeInP95,
      },
      gatePassed: firstChunkP95 < 2500 && bargeInP95 < 300,
    };

    const outPath = join(resolveFixturesDir(), "latency-report.json");
    writeFileSync(outPath, JSON.stringify(report, null, 2));

    expect(report.gatePassed).toBe(true);
    expect(firstChunkP95).toBeLessThan(2500);
    expect(bargeInP95).toBeLessThan(300);
  });
});
