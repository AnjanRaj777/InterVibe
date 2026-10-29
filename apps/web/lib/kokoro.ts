"use client";

/**
 * On-device Kokoro TTS integration (WebGPU / WASM).
 * Runs zero-API-cost speech synthesis inside a dedicated Web Worker so the main UI thread never freezes.
 */

export interface KokoroVoiceOption {
  id: string;
  name: string;
  gender: string;
  accent: string;
  desc: string;
}

export const KOKORO_VOICES: KokoroVoiceOption[] = [
  { id: "am_eric", name: "Alex", gender: "Male", accent: "American", desc: "Senior tech interviewer — warm, professional & realistic" },
  { id: "af_bella", name: "Bella", gender: "Female", accent: "American", desc: "Warm & conversational (Recommended)" },
  { id: "bf_emma", name: "Emma", gender: "Female", accent: "British", desc: "Polished & poised British accent" },
  { id: "bm_george", name: "George", gender: "Male", accent: "British", desc: "Articulate & engaging British accent" },
  { id: "bm_fable", name: "Fable", gender: "Male", accent: "British", desc: "Expressive & lively storytelling cadence" },
  { id: "af_sarah", name: "Sarah", gender: "Female", accent: "American", desc: "Professional & clear" },
  { id: "am_adam", name: "Adam", gender: "Male", accent: "American", desc: "Confident & technical" },
  { id: "am_michael", name: "Michael", gender: "Male", accent: "American", desc: "Deep & authoritative" },
];

/** Maps any input (Piper ID, character name, or Kokoro ID) to a guaranteed valid Kokoro VoiceId */
export function normalizeKokoroVoice(voiceId?: string): string {
  if (!voiceId) return getSavedVoice();
  if (KOKORO_VOICES.some((v) => v.id === voiceId)) return voiceId;

  const vLower = voiceId.toLowerCase();
  if (vLower.includes("eric") || vLower.includes("danny") || vLower.includes("alex")) return "am_eric";
  if (vLower.includes("bella") || vLower.includes("amy")) return "af_bella";
  if (vLower.includes("emma") || vLower.includes("cori") || vLower.includes("alba")) return "bf_emma";
  if (vLower.includes("george") || vLower.includes("alan")) return "bm_george";
  if (vLower.includes("fable") || vLower.includes("arthur") || vLower.includes("northern")) return "bm_fable";
  if (vLower.includes("sarah") || vLower.includes("lessac")) return "af_sarah";
  if (vLower.includes("adam") || vLower.includes("joe") || vLower.includes("ryan")) return "am_adam";
  if (vLower.includes("michael") || vLower.includes("bryce")) return "am_michael";

  return "af_bella";
}

export function getSavedVoice(): string {
  if (typeof window === "undefined") return "af_bella";
  try {
    return localStorage.getItem("intervibe_voice") || "af_bella";
  } catch {
    return "af_bella";
  }
}

export function setSavedVoice(voiceId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("intervibe_voice", voiceId);
  } catch {
    // Ignore
  }
}

export interface KokoroSpeakOptions {
  voice?: string;
  speed?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

let workerInstance: Worker | null = null;
let activeAudio: HTMLAudioElement | null = null;
let kokoroReady = false;
let kokoroPreloading = false;
let messageIdCounter = 0;
const pendingRequests = new Map<
  number,
  {
    resolve: (blob: Blob) => void;
    reject: (err: unknown) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();

function getWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL("./kokoro.worker.ts", import.meta.url), {
        type: "module",
      });

      workerInstance.onmessage = (e: MessageEvent) => {
        const { type, id, blob, error, success } = e.data || {};

        if (type === "ready") {
          kokoroReady = Boolean(success);
          kokoroPreloading = false;
        }

        if (type === "audio" && typeof id === "number") {
          const req = pendingRequests.get(id);
          if (req) {
            clearTimeout(req.timer);
            pendingRequests.delete(id);
            req.resolve(blob);
          }
        }

        if (type === "error" && typeof id === "number") {
          const req = pendingRequests.get(id);
          if (req) {
            clearTimeout(req.timer);
            pendingRequests.delete(id);
            req.reject(new Error(error || "Worker synthesis failed"));
          }
        }
      };

      workerInstance.onerror = (err) => {
        console.warn("[Kokoro] Worker error:", err);
      };
    } catch (err) {
      console.warn("[Kokoro] Failed to spawn worker:", err);
      return null;
    }
  }
  return workerInstance;
}

/** Returns true if Kokoro worker is initialized and ready */
export function isKokoroReady(): boolean {
  return kokoroReady && workerInstance !== null;
}

/** Preload Kokoro model in the Web Worker without blocking UI */
export function preloadKokoro(): void {
  if (typeof window === "undefined" || kokoroReady || kokoroPreloading) return;
  kokoroPreloading = true;
  const worker = getWorker();
  if (worker) {
    worker.postMessage({ type: "preload" });
  } else {
    kokoroPreloading = false;
  }
}

/**
 * Synthesizes and plays speech using the background Web Worker Kokoro model.
 * Never blocks the main browser thread.
 */
export async function speakWithKokoro(
  text: string,
  options: KokoroSpeakOptions = {},
): Promise<() => void> {
  // Cancel any currently playing audio
  stopKokoroAudio();

  const worker = getWorker();
  if (!worker) {
    throw new Error("Kokoro Web Worker is not available.");
  }

  const reqId = ++messageIdCounter;
  const voice = normalizeKokoroVoice(options.voice);
  const speed = options.speed ?? 1.0;

  // Synthesize in worker with safety timeout so user is never stuck
  const blobPromise = new Promise<Blob>((resolve, reject) => {
    // 4.5 second max generation timeout; if worker is too slow on low-end CPU, fallback immediately
    const timer = setTimeout(() => {
      pendingRequests.delete(reqId);
      reject(new Error("Kokoro synthesis timed out; falling back to instant browser synthesis."));
    }, 4500);

    pendingRequests.set(reqId, { resolve, reject, timer });
    worker.postMessage({
      type: "generate",
      id: reqId,
      text,
      voice,
      speed,
    });
  });

  const blob = await blobPromise;
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  activeAudio = audio;

  let cancelled = false;

  audio.onplay = () => {
    if (!cancelled) options.onStart?.();
  };

  audio.onended = () => {
    URL.revokeObjectURL(url);
    if (activeAudio === audio) activeAudio = null;
    if (!cancelled) options.onEnd?.();
  };

  audio.onerror = (e) => {
    URL.revokeObjectURL(url);
    if (activeAudio === audio) activeAudio = null;
    if (!cancelled) {
      options.onError?.(e);
      options.onEnd?.();
    }
  };

  await audio.play();

  return () => {
    cancelled = true;
    audio.pause();
    audio.currentTime = 0;
    URL.revokeObjectURL(url);
    if (activeAudio === audio) activeAudio = null;
  };
}

/** Stops any currently playing audio immediately (barge-in support) */
export function stopKokoroAudio(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    activeAudio = null;
  }
}
