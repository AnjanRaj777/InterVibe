/**
 * Phase 0 smoke: one Spark chat call, one structured-output call,
 * one realtime STT handshake. Prints model IDs + usage.
 * Requires MODEL_API_KEY in env. Run: npm run smoke --workspace=@intervibe/api
 */
import "../env.js";
import { loadConfig } from "../config.js";
import { sparkChat, transcribeHandshake } from "./client.js";

const { MODEL_API_KEY } = loadConfig();

const chat = await sparkChat({
  apiKey: MODEL_API_KEY,
  messages: [{ role: "user", content: "Reply with exactly: smoke-ok" }],
  promptCacheKey: "intervibe-smoke",
});
console.log("chat:", JSON.stringify({ text: chat.text.trim(), usage: chat.usage }));

const structured = await sparkChat({
  apiKey: MODEL_API_KEY,
  messages: [{ role: "user", content: "The capital of France?" }],
  jsonSchema: {
    name: "SmokeAnswer",
    schema: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
      additionalProperties: false,
    },
  },
  promptCacheKey: "intervibe-smoke",
});
console.log("structured:", structured.text.trim());

const stt = await transcribeHandshake({ apiKey: MODEL_API_KEY });
console.log("stt: handshake ok");
stt.close();
console.log("smoke: ALL OK");
