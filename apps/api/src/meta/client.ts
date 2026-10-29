import {
  META_API_BASE,
  TRANSCRIBE_MODEL_ID,
  TRANSCRIBE_REALTIME_URL,
  assertStandardModel,
  type UsageEvent,
} from "@intervibe/contracts";

export class MetaApiError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`Meta Model API error ${status}: ${body.slice(0, 300)}`);
    this.name = "MetaApiError";
    this.status = status;
    this.body = body;
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  text: string;
  usage: UsageEvent;
}

function usageOf(u: {
  input_tokens?: number;
  input_tokens_details?: { cached_tokens?: number };
  prompt_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
  output_tokens?: number;
  completion_tokens?: number;
}): UsageEvent {
  return {
    model: "",
    tokens_in: u.input_tokens ?? u.prompt_tokens ?? 0,
    cached_tokens: u.input_tokens_details?.cached_tokens ?? u.prompt_tokens_details?.cached_tokens ?? 0,
    tokens_out: u.output_tokens ?? u.completion_tokens ?? 0,
    audio_seconds: 0,
    cost_usd: 0,
  };
}

/**
 * Minimal Muse Spark chat call over the OpenAI-compatible Chat Completions API.
 * Optional json_schema response_format enables structured outputs (Phase 1+).
 */
export async function sparkChat(args: {
  apiKey: string;
  model?: string;
  messages: ChatMessage[];
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  promptCacheKey?: string;
  timeoutMs?: number;
}): Promise<ChatResult> {
  const model = args.model ?? "muse-spark-1.3";
  assertStandardModel(model);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs ?? 60_000);
  try {
    const res = await fetch(`${META_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: args.messages,
        ...(args.jsonSchema
          ? { response_format: { type: "json_schema", json_schema: args.jsonSchema } }
          : {}),
        ...(args.promptCacheKey ? { prompt_cache_key: args.promptCacheKey } : {}),
      }),
    });
    if (!res.ok) throw new MetaApiError(res.status, await res.text());
    const json = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage: Parameters<typeof usageOf>[0];
    };
    const text = json.choices[0]?.message?.content ?? "";
    return { text, usage: { ...usageOf(json.usage ?? {}), model } };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Streaming Muse Spark chat call. Yields incremental text tokens as they arrive.
 * Supports AbortSignal for immediate barge-in cancellation.
 */
export async function* sparkChatStream(args: {
  apiKey: string;
  model?: string;
  messages: ChatMessage[];
  promptCacheKey?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}): AsyncGenerator<string, { fullText: string; usage: UsageEvent }> {
  const model = args.model ?? "muse-spark-1.3";
  assertStandardModel(model);

  // If apiKey is mock or test, yield simulated tokens
  if (!args.apiKey || args.apiKey.startsWith("mock") || args.apiKey === "test") {
    const mockReply =
      "Good explanation. In production systems, measuring tail latency and isolating failure domains is critical. Let's dig deeper into your trade-off analysis.";
    const words = mockReply.split(" ");
    let full = "";
    for (const w of words) {
      if (args.signal?.aborted) throw new Error("AbortError");
      yield w + " ";
      full += w + " ";
      await new Promise((r) => setTimeout(r, 20));
    }
    return {
      fullText: full.trim(),
      usage: {
        model,
        tokens_in: 50,
        cached_tokens: 0,
        tokens_out: 25,
        audio_seconds: 0,
        cost_usd: 0,
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs ?? 60_000);

  const abortListener = () => controller.abort();
  if (args.signal) {
    args.signal.addEventListener("abort", abortListener);
  }

  try {
    const res = await fetch(`${META_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: args.messages,
        stream: true,
        ...(args.promptCacheKey ? { prompt_cache_key: args.promptCacheKey } : {}),
      }),
    });

    if (!res.ok) throw new MetaApiError(res.status, await res.text());
    if (!res.body) throw new Error("No response body received for streaming");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    try {
      while (true) {
        if (args.signal?.aborted) {
          await reader.cancel();
          throw new Error("AbortError");
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              fullText += delta;
              yield delta;
            }
          } catch {
            // Ignore partial SSE chunk
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      fullText,
      usage: {
        model,
        tokens_in: Math.ceil(args.messages.map((m) => m.content).join(" ").length / 4),
        cached_tokens: 0,
        tokens_out: Math.ceil(fullText.length / 4),
        audio_seconds: 0,
        cost_usd: 0,
      },
    };
  } finally {
    clearTimeout(timer);
    if (args.signal) {
      args.signal.removeEventListener("abort", abortListener);
    }
  }
}

export interface SttHandshake {
  sessionId: string;
  close: () => void;
}

export interface TranscribeResult {
  transcript: string;
  model: string;
  audioSeconds?: number;
}

/**
 * Transcribes audio using Meta Muse Voice Transcribe (POST /v1/asr/transcribe).
 * Uses model: muse-voice-transcribe-1.0
 */
export async function transcribeAudio(args: {
  apiKey: string;
  audioBytes: Uint8Array;
  contentType?: string;
  keywords?: string[];
  model?: string;
  timeoutMs?: number;
}): Promise<TranscribeResult> {
  const model = args.model ?? TRANSCRIBE_MODEL_ID;
  assertStandardModel(model);

  // If apiKey is empty or test/mock, return mock transcription
  if (!args.apiKey || args.apiKey.startsWith("mock") || args.apiKey === "test") {
    return {
      transcript: "",
      model,
      audioSeconds: Math.max(1, Math.round(args.audioBytes.length / (24000 * 2))),
    };
  }

  const form = new FormData();
  const requestConfig: Record<string, unknown> = {
    model,
    audioEncoding: "WAV",
    mode: "PUSH_TO_TALK",
  };
  if (args.keywords && args.keywords.length > 0) {
    requestConfig.keywords = args.keywords;
  }

  const reqBlob = new Blob([JSON.stringify(requestConfig)], { type: "application/json" });
  form.append("request", reqBlob);

  const audioBlob = new Blob([args.audioBytes], { type: args.contentType ?? "audio/wav" });
  form.append("audio", audioBlob, "audio.wav");

  const timeoutMs = args.timeoutMs ?? 30_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${META_API_BASE}/asr/transcribe`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
      },
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.warn(`[transcribeAudio] upstream ASR returned ${res.status}: ${errBody.slice(0, 300)}`);
      return {
        transcript: "",
        model,
        audioSeconds: Math.max(1, Math.round(args.audioBytes.length / (16000 * 2))),
      };
    }

    const data = (await res.json()) as {
      text?: string;
      transcript?: string;
      audioDurationMs?: number;
      duration?: number;
      turns?: { transcript?: string }[];
    };
    const transcript =
      data.transcript ??
      data.text ??
      data.turns?.map((t) => t.transcript).filter(Boolean).join(" ") ??
      "";
    const audioSeconds = data.audioDurationMs ? Math.round(data.audioDurationMs / 1000) : (data.duration ?? 0);
    return {
      transcript: transcript.trim(),
      model,
      audioSeconds,
    };
  } catch (err) {
    console.warn("[transcribeAudio] upstream ASR error or unreachable:", err);
    return {
      transcript: "",
      model,
      audioSeconds: Math.max(1, Math.round(args.audioBytes.length / (16000 * 2))),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Opens the realtime socket and completes the auth handshake.
 * Auth travels in the first frame; the Authorization header is ignored.
 */
export async function transcribeHandshake(args: {
  apiKey: string;
  timeoutMs?: number;
}): Promise<SttHandshake> {
  assertStandardModel(TRANSCRIBE_MODEL_ID);
  const ws = new WebSocket(TRANSCRIBE_REALTIME_URL);
  const timeoutMs = args.timeoutMs ?? 30_000;
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("STT handshake timed out")), timeoutMs);
      ws.addEventListener(
        "open",
        () => {
          ws.send(
            JSON.stringify({
              authorization: { accessToken: `Bearer ${args.apiKey}` },
              audioEncoding: "PCM_24KHZ",
              model: TRANSCRIBE_MODEL_ID,
              mode: "ENDPOINTING",
            }),
          );
        },
        { once: true },
      );
      ws.addEventListener(
        "message",
        (ev) => {
          try {
            const msg = JSON.parse(String((ev as MessageEvent).data));
            if (msg && typeof msg.sessionId === "string") {
              clearTimeout(timer);
              resolve();
            }
          } catch {
            /* wait for the handshake frame */
          }
        },
        { once: true },
      );
      ws.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error("STT socket error during handshake"));
      });
    });
    return { sessionId: "connected", close: () => ws.close() };
  } catch (err) {
    ws.close();
    throw err;
  }
}
