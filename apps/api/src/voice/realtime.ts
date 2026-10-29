import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import {
  TRANSCRIBE_REALTIME_URL,
  TRANSCRIBE_MODEL_ID,
  createSentenceChunker,
  type TurnEvaluation,
  type PlanModule,
} from "@intervibe/contracts";
import type { AuthStore } from "../auth/store.js";
import type { SessionStore } from "../sessions/store.js";
import { sparkChatStream, type ChatMessage } from "../meta/client.js";
import {
  scoreAnswer,
  moduleStatus,
  followUpFor,
  type DrillState,
  type DrillTurn,
} from "../drill/drill.js";
import { promptForModuleKind } from "../drill/prompts.js";

export interface VoiceRelayOptions {
  server: Server;
  authStore: AuthStore;
  sessionStore: SessionStore;
  apiKey: string;
  isTest?: boolean;
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  for (const cookie of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = cookie.split("=");
    const key = rawKey?.trim();
    if (!key) continue;
    list[key] = decodeURIComponent(rawValue.join("=").trim());
  }
  return list;
}

export function setupVoiceWebSocketRelay(options: VoiceRelayOptions): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  options.server.on("upgrade", async (req, socket, head) => {
    const url = new URL(req.url ?? "", `http://${req.headers.host ?? "localhost"}`);
    const match = url.pathname.match(/^\/sessions\/([^/]+)\/voice-stream$/);

    if (!match) {
      // Not a voice stream path — ignore or allow other handlers
      return;
    }

    const sessionId = match[1];
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies["intervibe_session"];

    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const user = await options.authStore.findUserByCookie(token);
    if (!user) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const session = await options.sessionStore.getSession(sessionId);
    if (!session || session.userId !== user.id) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (clientWs) => {
      wss.emit("connection", clientWs, req, { sessionId, userId: user.id, session });
    });
  });

  wss.on("connection", (clientWs: WebSocket, _req: unknown, context: { sessionId: string; userId: string; session: any }) => {
    let metaWs: WebSocket | null = null;
    let turnCounter = 1;
    let currentAbortController: AbortController | null = null;
    let isConnected = true;

    function sendToClient(event: Record<string, unknown>) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(event));
      }
    }

    function cancelPendingAi() {
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
    }

    // Connect to Meta Muse Voice Transcribe realtime socket
    async function initMetaSocket(keywords: string[] = [], languageBias = "en-US") {
      if (!options.apiKey || options.apiKey.startsWith("mock") || options.apiKey === "test") {
        // Mock mode for local testing without live Meta API socket
        return;
      }

      try {
        metaWs = new WebSocket(TRANSCRIBE_REALTIME_URL);

        metaWs.on("open", () => {
          metaWs?.send(
            JSON.stringify({
              authorization: { accessToken: `Bearer ${options.apiKey}` },
              audioEncoding: "PCM_24KHZ",
              model: TRANSCRIBE_MODEL_ID,
              mode: "ENDPOINTING",
              languageBias,
              keywords,
            }),
          );
        });

        metaWs.on("message", async (data: Buffer | string) => {
          try {
            const msg = JSON.parse(String(data));

            if (msg.event === "speechStart") {
              cancelPendingAi();
              sendToClient({ type: "speech_start", timestamp: Date.now() });
            } else if (msg.event === "transcript" && typeof msg.text === "string") {
              sendToClient({ type: "partial_transcript", transcript: msg.text, timestamp: Date.now() });
            } else if (msg.event === "speechEnd") {
              sendToClient({ type: "speech_end", timestamp: Date.now() });
            } else if (msg.event === "speechComplete") {
              const turnId = `turn-${turnCounter++}`;
              const transcript = msg.text || "";
              sendToClient({ type: "speech_complete", turnId, transcript, timestamp: Date.now() });

              // Trigger AI turn loop
              await handleAiTurn(turnId, transcript);
            }
          } catch {
            // Ignore non-json or ping frames
          }
        });

        metaWs.on("error", (err) => {
          sendToClient({
            type: "error",
            message: `Realtime voice connection error: ${err.message}`,
            recoverable: true,
            timestamp: Date.now(),
          });
        });

        metaWs.on("close", () => {
          if (isConnected) {
            // Attempt transparent reconnection if client is still open
            setTimeout(() => {
              if (isConnected && clientWs.readyState === WebSocket.OPEN) {
                void initMetaSocket(keywords, languageBias);
              }
            }, 1000);
          }
        });
      } catch (err) {
        sendToClient({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to open STT socket",
          recoverable: true,
          timestamp: Date.now(),
        });
      }
    }

    async function handleAiTurn(turnId: string, userTranscript: string) {
      cancelPendingAi();
      const abortController = new AbortController();
      currentAbortController = abortController;

      sendToClient({ type: "ai_start", turnId, timestamp: Date.now() });

      try {
        const bundle = ((await options.sessionStore.loadBundle(context.sessionId)) ?? {}) as Record<string, unknown>;
        const plan = bundle["plan"] as { modules: PlanModule[] } | undefined;
        const currentModuleIdx = typeof bundle["currentModuleIndex"] === "number" ? bundle["currentModuleIndex"] : 0;
        const mod = plan?.modules?.[currentModuleIdx] ?? {
          kind: "knowledge_drill",
          title: "Technical Mock Question",
          goal: "Assess engineering depth, trade-offs, and failure modes.",
          source: "Technical interview",
          estimatedQuestions: 5,
          passBar: "Score 75+",
        };

        const evaluation = scoreAnswer(mod, userTranscript);
        const chunker = createSentenceChunker();
        let chunkIndex = 0;
        let fullAiText = "";

        const messages: ChatMessage[] = [
          { role: "system", content: promptForModuleKind(mod.kind).system },
          { role: "user", content: `Candidate answer: "${userTranscript}". Provide realistic interviewer feedback and follow-up question.` },
        ];

        const tokenStream = sparkChatStream({
          apiKey: options.apiKey,
          messages,
          signal: abortController.signal,
        });

        for await (const token of tokenStream) {
          if (abortController.signal.aborted) break;
          fullAiText += token;
          const chunks = chunker.push(token);
          for (const c of chunks) {
            sendToClient({
              type: "ai_chunk",
              turnId,
              chunkIndex: chunkIndex++,
              text: c,
              isFinal: false,
              timestamp: Date.now(),
            });
          }
        }

        if (!abortController.signal.aborted) {
          const finalChunks = chunker.flush();
          for (const c of finalChunks) {
            sendToClient({
              type: "ai_chunk",
              turnId,
              chunkIndex: chunkIndex++,
              text: c,
              isFinal: true,
              timestamp: Date.now(),
            });
          }

          sendToClient({
            type: "ai_complete",
            turnId,
            fullText: fullAiText.trim(),
            evaluation,
            timestamp: Date.now(),
          });
        }
      } catch (err: unknown) {
        if (abortController.signal.aborted) {
          // Normal barge-in abort
          return;
        }
        sendToClient({
          type: "error",
          message: err instanceof Error ? err.message : "AI response generation error",
          recoverable: true,
          timestamp: Date.now(),
        });
      } finally {
        if (currentAbortController === abortController) {
          currentAbortController = null;
        }
      }
    }

    clientWs.on("message", async (data: Buffer | string, isBinary: boolean) => {
      if (isBinary) {
        // Forward binary 24 kHz PCM audio directly to Meta STT socket
        if (metaWs && metaWs.readyState === WebSocket.OPEN) {
          metaWs.send(data);
        }
        return;
      }

      try {
        const msg = JSON.parse(String(data));

        if (msg.action === "start") {
          const keywords: string[] = Array.isArray(msg.keywords) ? msg.keywords : [];
          const locale: string = typeof msg.languageBias === "string" ? msg.languageBias : "en-US";
          await initMetaSocket(keywords, locale);
        } else if (msg.action === "barge_in" || msg.action === "cancel") {
          cancelPendingAi();
          sendToClient({ type: "barge_in", timestamp: Date.now() });
        } else if (
          msg.action === "simulate_speech_complete" &&
          (options.isTest || !options.apiKey || options.apiKey.startsWith("mock") || options.apiKey === "test")
        ) {
          // Test helper for integration testing without live microphone
          const turnId = `turn-${turnCounter++}`;
          sendToClient({ type: "speech_complete", turnId, transcript: msg.transcript, timestamp: Date.now() });
          await handleAiTurn(turnId, msg.transcript);
        }
      } catch {
        // Ignore unparseable frames
      }
    });

    clientWs.on("close", () => {
      isConnected = false;
      cancelPendingAi();
      if (metaWs && metaWs.readyState === WebSocket.OPEN) {
        metaWs.close();
      }
    });
  });

  return wss;
}
