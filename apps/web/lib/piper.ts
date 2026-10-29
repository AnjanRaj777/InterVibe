"use client";

/**
 * On-device Piper Neural TTS integration (VITS ONNX in Web Worker).
 * Ultra-fast (<15-25MB models), natural human intonation, 0 API cost.
 */

export interface PiperVoiceOption {
  id: string;
  name: string;
  gender: string;
  accent: string;
  desc: string;
}

export const PIPER_VOICES: PiperVoiceOption[] = [
  { id: "en_US-danny-low", name: "Alex", gender: "Male", accent: "American", desc: "Senior tech interviewer — warm, professional & realistic (Default)" },
  { id: "en_GB-cori-medium", name: "Cori", gender: "Female", accent: "British (RP)", desc: "Polished, poised & lively British accent (Recommended)" },
  { id: "en_GB-alan-medium", name: "Alan", gender: "Male", accent: "British (London)", desc: "Articulate & engaging British accent" },
  { id: "en_GB-northern_english_male-medium", name: "Arthur", gender: "Male", accent: "British (Northern)", desc: "Lively Northern English regional cadence" },
  { id: "en_GB-alba-medium", name: "Alba", gender: "Female", accent: "Scottish", desc: "Expressive Scottish accent & intonation" },
  { id: "en_US-amy-medium", name: "Amy", gender: "Female", accent: "American", desc: "Warm, energetic & conversational" },
  { id: "en_US-joe-medium", name: "Joe", gender: "Male", accent: "American", desc: "Dynamic, upbeat & friendly recruiter" },
  { id: "en_US-ryan-medium", name: "Ryan", gender: "Male", accent: "American", desc: "Clear & articulate Silicon Valley recruiter" },
  { id: "en_US-lessac-medium", name: "Lessac", gender: "Female", accent: "American", desc: "Crisp & authoritative senior hiring manager" },
  { id: "en_US-bryce-medium", name: "Bryce", gender: "Male", accent: "American", desc: "Deep & resonant interviewer voice" },
];

/** Maps any input (Kokoro ID, character name, or Piper ID) to a guaranteed valid Piper VoiceId */
export function normalizePiperVoice(voiceId?: string): string {
  if (!voiceId) return getSavedPiperVoice();
  if (PIPER_VOICES.some((v) => v.id === voiceId)) return voiceId;

  const vLower = voiceId.toLowerCase();
  if (vLower.includes("danny") || vLower.includes("eric") || vLower.includes("alex")) return "en_US-danny-low";
  if (vLower.includes("cori") || vLower.includes("emma")) return "en_GB-cori-medium";
  if (vLower.includes("alan") || vLower.includes("george")) return "en_GB-alan-medium";
  if (vLower.includes("arthur") || vLower.includes("fable") || vLower.includes("northern")) return "en_GB-northern_english_male-medium";
  if (vLower.includes("alba") || vLower.includes("scottish")) return "en_GB-alba-medium";
  if (vLower.includes("amy") || vLower.includes("bella")) return "en_US-amy-medium";
  if (vLower.includes("joe") || vLower.includes("adam")) return "en_US-joe-medium";
  if (vLower.includes("ryan")) return "en_US-ryan-medium";
  if (vLower.includes("lessac") || vLower.includes("sarah")) return "en_US-lessac-medium";
  if (vLower.includes("bryce") || vLower.includes("michael")) return "en_US-bryce-medium";

  return "en_US-amy-medium";
}

export function getSavedPiperVoice(): string {
  if (typeof window === "undefined") return "en_US-amy-medium";
  try {
    return localStorage.getItem("intervibe_piper_voice") || "en_US-amy-medium";
  } catch {
    return "en_US-amy-medium";
  }
}

export function setSavedPiperVoice(voiceId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("intervibe_piper_voice", voiceId);
  } catch {
    // Ignore
  }
}

export interface PiperSpeakOptions {
  voice?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

let workerInstance: Worker | null = null;
let activeAudio: HTMLAudioElement | null = null;
let piperReady = false;
let piperPreloading = false;
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
      workerInstance = new Worker(new URL("./piper.worker.ts", import.meta.url), {
        type: "module",
      });

      workerInstance.onmessage = (e: MessageEvent) => {
        const { type, id, blob, error, success } = e.data || {};

        if (type === "ready") {
          piperReady = Boolean(success);
          piperPreloading = false;
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
            req.reject(new Error(error || "Piper synthesis failed"));
          }
        }
      };

      workerInstance.onerror = (err) => {
        console.warn("[PiperWorker] Worker encountered error:", err);
        piperReady = false;
        piperPreloading = false;
      };
    } catch (err) {
      console.warn("[PiperWorker] Failed to instantiate worker:", err);
      return null;
    }
  }
  return workerInstance;
}

/** Pre-warms Piper model in background worker so first interview turn doesn't wait */
export function preloadPiper(voiceId?: string): void {
  if (typeof window === "undefined" || piperReady || piperPreloading) return;
  const worker = getWorker();
  if (!worker) return;
  piperPreloading = true;
  worker.postMessage({
    type: "preload",
    id: ++messageIdCounter,
    voiceId: normalizePiperVoice(voiceId),
  });
}

export function isPiperReady(): boolean {
  return piperReady;
}

/** Halts any ongoing Piper audio playback immediately (for barge-in) */
export function stopPiperAudio(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = "";
    } catch {
      // Ignore
    }
    activeAudio = null;
  }
}

/**
 * Synthesizes and plays text using Piper Neural TTS in dedicated Web Worker.
 * Returns a cancel function for instant interruption (barge-in).
 */
export async function speakWithPiper(
  text: string,
  options: PiperSpeakOptions = {},
): Promise<() => void> {
  const worker = getWorker();
  if (!worker) {
    throw new Error("Web Workers unavailable for Piper TTS");
  }

  stopPiperAudio();

  const id = ++messageIdCounter;
  const voiceId = normalizePiperVoice(options.voice);

  const blobPromise = new Promise<Blob>((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error("Piper speech synthesis timed out (15s)"));
    }, 15000);

    pendingRequests.set(id, { resolve, reject, timer });
  });

  worker.postMessage({
    type: "generate",
    id,
    text,
    voiceId,
  });

  let cancelled = false;

  blobPromise
    .then((blob) => {
      if (cancelled) return;

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      activeAudio = audio;

      audio.onplay = () => {
        if (!cancelled) options.onStart?.();
      };

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (activeAudio === audio) activeAudio = null;
        if (!cancelled) options.onEnd?.();
      };

      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        if (activeAudio === audio) activeAudio = null;
        if (!cancelled) options.onError?.(e);
      };

      audio.play().catch((playErr) => {
        URL.revokeObjectURL(audioUrl);
        if (activeAudio === audio) activeAudio = null;
        if (!cancelled) options.onError?.(playErr);
      });
    })
    .catch((err) => {
      if (!cancelled) options.onError?.(err);
    });

  return () => {
    cancelled = true;
    stopPiperAudio();
  };
}
