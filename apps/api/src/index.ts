import "./env.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { loadConfig } from "./config.js";
import { getPool } from "./db/pool.js";
import { buildAuthApp } from "./auth/routes.js";
import { createPgStore } from "./auth/pg-store.js";
import { buildSessionApp } from "./sessions/routes.js";
import { createPgSessionStore } from "./sessions/pg-store.js";
import { createS3Storage } from "./storage/s3.js";
import { sparkChat, transcribeAudio } from "./meta/client.js";
import { synthesizeGroqSpeech } from "./tts/groq.js";
import { setupVoiceWebSocketRelay } from "./voice/realtime.js";

const config = loadConfig();
const app = new Hono();

app.onError((err, c) => {
  console.error(`[api] ${c.req.method} ${c.req.path} -> 500`);
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  return c.json({ error: "Something went wrong on our side. Try again." }, 500);
});

app.get("/health", (c) =>
  c.json({ status: "ok", version: "0.2.0", env: config.NODE_ENV }),
);

app.post("/tts", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return c.json({ error: "Missing 'text' in request body." }, 400);
    }
    const voice = typeof body.voice === "string" ? body.voice : undefined;
    const model = typeof body.model === "string" ? body.model : undefined;

    const { audio, contentType } = await synthesizeGroqSpeech({
      apiKey: config.GROQ_API_KEY,
      text,
      voice,
      model,
    });

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS synthesis failed";
    const status = message.includes("GROQ_API_KEY is not configured") ? 503 : 500;
    return c.json({ error: message }, status);
  }
});

const authStore = createPgStore(getPool(config.DATABASE_URL));

app.route(
  "/auth",
  buildAuthApp({
    store: authStore,
    appUrl: config.APP_URL,
    isProd: config.NODE_ENV === "production",
    sendLink: (email, link) => {
      if (config.NODE_ENV === "production") {
        throw new Error("No mail sender configured for production yet (Phase 6).");
      }
      console.log(`[auth] sign-in link for ${email}: ${link}`);
    },
  }),
);

const sessionStore = createPgSessionStore(getPool(config.DATABASE_URL));

app.route(
  "/sessions",
  buildSessionApp({
    authStore,
    sessions: sessionStore,
    storage: createS3Storage({
      endpoint: config.STORAGE_ENDPOINT,
      bucket: config.STORAGE_BUCKET,
      region: config.STORAGE_REGION,
      accessKey: config.STORAGE_ACCESS_KEY,
      secretKey: config.STORAGE_SECRET_KEY,
      forcePathStyle: config.STORAGE_FORCE_PATH_STYLE,
    }),
    maxUploadBytes: config.MAX_UPLOAD_BYTES,
    chat: ({ messages, jsonSchema, promptCacheKey }) =>
      sparkChat({ apiKey: config.MODEL_API_KEY, messages, jsonSchema, promptCacheKey }),
    transcribe: (audioBytes, contentType) =>
      transcribeAudio({ apiKey: config.MODEL_API_KEY, audioBytes, contentType }),
  }),
);

const server = serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  console.log(`api listening on :${info.port}`);
  console.log(
    `[api] storage: endpoint=${config.STORAGE_ENDPOINT} bucket=${config.STORAGE_BUCKET} region=${config.STORAGE_REGION} pathStyle=${config.STORAGE_FORCE_PATH_STYLE}`,
  );
  console.log(`[api] voice realtime relay initialized on /sessions/:id/voice-stream`);
});

setupVoiceWebSocketRelay({
  server: server as unknown as import("node:http").Server,
  authStore,
  sessionStore,
  apiKey: config.MODEL_API_KEY,
});
