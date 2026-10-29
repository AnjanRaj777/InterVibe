"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import {
  getSavedVoice,
  isKokoroReady,
  preloadKokoro,
  speakWithKokoro,
  stopKokoroAudio,
} from "./kokoro";
import {
  getSavedPiperVoice,
  isPiperReady,
  preloadPiper,
  speakWithPiper,
  stopPiperAudio,
} from "./piper";

// =============================================================================
// TTS Engine Configuration & Instant Fast Voice
// =============================================================================

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
  rate?: number;
  pitch?: number;
  voice?: string;
}

export type VoiceEngine = "piper" | "kokoro" | "instant" | "groq-orpheus";

export interface OrpheusVoice {
  id: string;
  name: string;
  gender: "female" | "male";
  description: string;
}

export const ORPHEUS_VOICES: OrpheusVoice[] = [
  { id: "autumn", name: "Autumn (Default)", gender: "female", description: "Warm, natural expressive female persona" },
  { id: "diana", name: "Diana", gender: "female", description: "Clear, articulate, professional female interviewer" },
  { id: "hannah", name: "Hannah", gender: "female", description: "Energetic, engaging, lively female persona" },
  { id: "austin", name: "Austin", gender: "male", description: "Calm, thoughtful, executive male tone" },
  { id: "daniel", name: "Daniel", gender: "male", description: "Articulate, measured, technical male interviewer" },
  { id: "troy", name: "Troy", gender: "male", description: "Authoritative, deep, confident male voice" },
];

export function getSavedOrpheusVoice(): string {
  if (typeof window === "undefined") return "autumn";
  try {
    return localStorage.getItem("intervibe_orpheus_voice") || "autumn";
  } catch {
    return "autumn";
  }
}

export function setSavedOrpheusVoice(voiceId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("intervibe_orpheus_voice", voiceId);
  } catch {
    // Ignore
  }
}

let activeOrpheusAudio: HTMLAudioElement | null = null;

export function stopOrpheusAudio(): void {
  if (activeOrpheusAudio) {
    try {
      activeOrpheusAudio.pause();
      activeOrpheusAudio.currentTime = 0;
    } catch {}
    activeOrpheusAudio = null;
  }
}

export async function speakWithGroqOrpheus(
  text: string,
  options: SpeakOptions = {},
): Promise<() => void> {
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    options.onEnd?.();
    return () => {};
  }

  stopSpeaking();

  let cancelled = false;
  const voice = options.voice ?? getSavedOrpheusVoice();

  const cancel = () => {
    cancelled = true;
    stopOrpheusAudio();
  };

  try {
    options.onStart?.();
    const blob = await api.synthesizeSpeech({
      text: cleaned,
      voice,
      model: "canopylabs/orpheus-v1-english",
    });

    if (cancelled) return cancel;

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    activeOrpheusAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      activeOrpheusAudio = null;
      if (!cancelled) options.onEnd?.();
    };

    audio.onerror = (e) => {
      URL.revokeObjectURL(audioUrl);
      activeOrpheusAudio = null;
      console.warn("[Voice] Groq Orpheus playback error, falling back to Web Speech:", e);
      if (!cancelled) {
        options.onError?.(e);
        fallbackWebSpeech(cleaned, options);
      }
    };

    await audio.play();
  } catch (err) {
    if (!cancelled) {
      console.warn("[Voice] Groq Orpheus TTS failed, falling back to Web Speech:", err);
      options.onError?.(err);
      fallbackWebSpeech(cleaned, options);
    }
  }

  return cancel;
}

export function getSavedVoiceEngine(): VoiceEngine {
  if (typeof window === "undefined") return "piper";
  try {
    return (localStorage.getItem("intervibe_tts_engine") as VoiceEngine) || "piper";
  } catch {
    return "piper";
  }
}

export function setSavedVoiceEngine(engine: VoiceEngine): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("intervibe_tts_engine", engine);
  } catch {
    // Ignore
  }
}

/** Active TTS engine description */
export const TTS_MODEL_NAME = "Piper Neural TTS (Natural on-device VITS)";
/** Active STT engine description */
export const STT_MODEL_NAME = "Meta Muse Voice Transcribe (muse-voice-transcribe-1.0)";
/** Flag confirming Meta Muse Voice Transcribe is the default STT model */
export const IS_MUSE_STT_DEFAULT = true;

/** Strips markdown syntax and special tokens so TTS sounds natural. */
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Bold **word**
    .replace(/\*([^*]+)\*/g, "$1") // Italic *word*
    .replace(/`([^`]+)`/g, "$1") // Inline code `code`
    .replace(/#+\s+/g, "") // Headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links [text](url)
    .replace(/[*_~`]/g, "") // Any leftover formatting
    .replace(/\s+/g, " ")
    .trim();
}

/** Cache available browser voices for fallback */
let cachedVoices: SpeechSynthesisVoice[] = [];

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  if (cachedVoices.length > 0) return cachedVoices;
  const list = window.speechSynthesis.getVoices();
  if (list.length > 0) cachedVoices = list;
  return list;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/** Persona Voice Configuration for cross-engine audio tuning and browser matching */
export interface PersonaVoiceConfig {
  name: string;
  gender: "male" | "female";
  locale: "en-US" | "en-GB";
  pitch: number;
  rate: number;
  preferredVoiceNames: string[];
  piperVoiceId: string;
  kokoroVoiceId: string;
}

export const PERSONA_CONFIGS: Record<string, PersonaVoiceConfig> = {
  alex: {
    name: "Alex",
    gender: "male",
    locale: "en-US",
    pitch: 0.88,
    rate: 0.98,
    preferredVoiceNames: ["guy", "christopher", "david", "mark", "male"],
    piperVoiceId: "en_US-danny-low",
    kokoroVoiceId: "am_eric",
  },
  cori: {
    name: "Cori",
    gender: "female",
    locale: "en-GB",
    pitch: 1.04,
    rate: 1.00,
    preferredVoiceNames: ["sonia", "libby", "maisie", "hazel", "susan", "female"],
    piperVoiceId: "en_GB-cori-medium",
    kokoroVoiceId: "bf_emma",
  },
  alan: {
    name: "Alan",
    gender: "male",
    locale: "en-GB",
    pitch: 0.92,
    rate: 0.98,
    preferredVoiceNames: ["ryan", "george", "oliver", "male"],
    piperVoiceId: "en_GB-alan-medium",
    kokoroVoiceId: "bm_george",
  },
  arthur: {
    name: "Arthur",
    gender: "male",
    locale: "en-GB",
    pitch: 0.86,
    rate: 0.96,
    preferredVoiceNames: ["george", "ryan", "oliver", "male"],
    piperVoiceId: "en_GB-northern_english_male-medium",
    kokoroVoiceId: "bm_fable",
  },
  alba: {
    name: "Alba",
    gender: "female",
    locale: "en-GB",
    pitch: 1.06,
    rate: 1.02,
    preferredVoiceNames: ["fiona", "sonia", "libby", "hazel", "female"],
    piperVoiceId: "en_GB-alba-medium",
    kokoroVoiceId: "bf_emma",
  },
  amy: {
    name: "Amy",
    gender: "female",
    locale: "en-US",
    pitch: 1.04,
    rate: 1.00,
    preferredVoiceNames: ["jenny", "aria", "zira", "samantha", "female"],
    piperVoiceId: "en_US-amy-medium",
    kokoroVoiceId: "af_bella",
  },
  joe: {
    name: "Joe",
    gender: "male",
    locale: "en-US",
    pitch: 0.95,
    rate: 1.02,
    preferredVoiceNames: ["guy", "christopher", "david", "male"],
    piperVoiceId: "en_US-joe-medium",
    kokoroVoiceId: "am_adam",
  },
  ryan: {
    name: "Ryan",
    gender: "male",
    locale: "en-US",
    pitch: 0.92,
    rate: 1.00,
    preferredVoiceNames: ["christopher", "guy", "david", "male"],
    piperVoiceId: "en_US-ryan-medium",
    kokoroVoiceId: "am_adam",
  },
  lessac: {
    name: "Lessac",
    gender: "female",
    locale: "en-US",
    pitch: 0.98,
    rate: 0.97,
    preferredVoiceNames: ["aria", "jenny", "zira", "female"],
    piperVoiceId: "en_US-lessac-medium",
    kokoroVoiceId: "af_sarah",
  },
  bryce: {
    name: "Bryce",
    gender: "male",
    locale: "en-US",
    pitch: 0.80,
    rate: 0.94,
    preferredVoiceNames: ["david", "guy", "mark", "male"],
    piperVoiceId: "en_US-bryce-medium",
    kokoroVoiceId: "am_michael",
  },
  bella: {
    name: "Bella",
    gender: "female",
    locale: "en-US",
    pitch: 1.03,
    rate: 1.00,
    preferredVoiceNames: ["jenny", "aria", "zira", "samantha", "female"],
    piperVoiceId: "en_US-amy-medium",
    kokoroVoiceId: "af_bella",
  },
  emma: {
    name: "Emma",
    gender: "female",
    locale: "en-GB",
    pitch: 1.03,
    rate: 1.00,
    preferredVoiceNames: ["sonia", "libby", "maisie", "hazel", "female"],
    piperVoiceId: "en_GB-cori-medium",
    kokoroVoiceId: "bf_emma",
  },
  george: {
    name: "George",
    gender: "male",
    locale: "en-GB",
    pitch: 0.90,
    rate: 0.98,
    preferredVoiceNames: ["ryan", "george", "oliver", "male"],
    piperVoiceId: "en_GB-alan-medium",
    kokoroVoiceId: "bm_george",
  },
  fable: {
    name: "Fable",
    gender: "male",
    locale: "en-GB",
    pitch: 0.88,
    rate: 0.96,
    preferredVoiceNames: ["george", "ryan", "oliver", "male"],
    piperVoiceId: "en_GB-northern_english_male-medium",
    kokoroVoiceId: "bm_fable",
  },
  sarah: {
    name: "Sarah",
    gender: "female",
    locale: "en-US",
    pitch: 0.98,
    rate: 0.98,
    preferredVoiceNames: ["aria", "jenny", "zira", "female"],
    piperVoiceId: "en_US-lessac-medium",
    kokoroVoiceId: "af_sarah",
  },
  adam: {
    name: "Adam",
    gender: "male",
    locale: "en-US",
    pitch: 0.93,
    rate: 1.00,
    preferredVoiceNames: ["guy", "christopher", "david", "male"],
    piperVoiceId: "en_US-joe-medium",
    kokoroVoiceId: "am_adam",
  },
  michael: {
    name: "Michael",
    gender: "male",
    locale: "en-US",
    pitch: 0.80,
    rate: 0.94,
    preferredVoiceNames: ["david", "guy", "mark", "male"],
    piperVoiceId: "en_US-bryce-medium",
    kokoroVoiceId: "am_michael",
  },
};

export function getPersonaConfig(voiceIdOrName?: string): PersonaVoiceConfig {
  if (!voiceIdOrName) return PERSONA_CONFIGS.alex;
  const raw = voiceIdOrName.toLowerCase();

  for (const [key, config] of Object.entries(PERSONA_CONFIGS)) {
    if (
      raw === key ||
      raw === config.piperVoiceId.toLowerCase() ||
      raw === config.kokoroVoiceId.toLowerCase() ||
      raw.includes(key) ||
      (key === "arthur" && raw.includes("northern")) ||
      (key === "alex" && (raw.includes("danny") || raw.includes("eric")))
    ) {
      return config;
    }
  }

  return PERSONA_CONFIGS.alex;
}

export function normalizeVoiceForEngine(voiceId: string, engine: VoiceEngine): string {
  const persona = getPersonaConfig(voiceId);
  if (engine === "piper") return persona.piperVoiceId;
  if (engine === "kokoro") return persona.kokoroVoiceId;
  return persona.piperVoiceId;
}

/** Fallback browser voice selector with strict exclusion of robotic legacy SAPI voices */
export function getPreferredVoice(): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (!voices.length) return null;

  const enVoices = voices.filter((v) => v.lang.startsWith("en"));
  if (!enVoices.length) return voices[0] ?? null;

  // Filter out robotic legacy desktop voices (e.g. "Microsoft David Desktop", "eSpeak", "SAPI")
  const nonRobotic = enVoices.filter(
    (v) =>
      !v.name.toLowerCase().includes("desktop") &&
      !v.name.toLowerCase().includes("espeak") &&
      !v.name.toLowerCase().includes("sapi"),
  );

  const pool = nonRobotic.length > 0 ? nonRobotic : enVoices;

  // 1. Edge Online Natural voices (Jenny, Guy, Aria, Christopher) - exceptionally human
  const natural = pool.find(
    (v) =>
      v.name.includes("Online (Natural)") ||
      v.name.includes("Natural") ||
      v.name.includes("Jenny") ||
      v.name.includes("Guy") ||
      v.name.includes("Aria"),
  );
  if (natural) return natural;

  // 2. Google Neural / Cloud voices
  const google = pool.find(
    (v) => v.name.includes("Google") || v.name.includes("Neural"),
  );
  if (google) return google;

  // 3. Apple Samantha / Daniel / Karen
  const apple = pool.find(
    (v) =>
      v.name.includes("Samantha") ||
      v.name.includes("Daniel") ||
      v.name.includes("Karen"),
  );
  if (apple) return apple;

  return pool[0] ?? voices[0] ?? null;
}

/** Finds the most appropriate browser synthesis voice matching a persona's gender and locale */
export function findMatchingBrowserVoice(voiceIdOrName?: string): {
  voice: SpeechSynthesisVoice | null;
  pitch: number;
  rate: number;
} {
  const persona = getPersonaConfig(voiceIdOrName);
  const voices = getAvailableVoices();
  if (!voices.length) {
    return { voice: null, pitch: persona.pitch, rate: persona.rate };
  }

  const enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = enVoices.length ? enVoices : voices;

  const nonRobotic = pool.filter(
    (v) =>
      !v.name.toLowerCase().includes("desktop") &&
      !v.name.toLowerCase().includes("espeak") &&
      !v.name.toLowerCase().includes("sapi"),
  );
  const searchPool = nonRobotic.length ? nonRobotic : pool;

  // 1. Check preferred voice names for this character
  for (const pref of persona.preferredVoiceNames) {
    const match = searchPool.find((v) => v.name.toLowerCase().includes(pref));
    if (match) {
      return { voice: match, pitch: persona.pitch, rate: persona.rate };
    }
  }

  // 2. Match by locale and gender
  const isMale = persona.gender === "male";
  const maleKeywords = ["male", "guy", "christopher", "david", "mark", "ryan", "george", "oliver", "daniel"];
  const femaleKeywords = ["female", "jenny", "aria", "zira", "samantha", "sonia", "libby", "maisie", "hazel", "susan"];
  const genderKeywords = isMale ? maleKeywords : femaleKeywords;

  const targetLang = persona.locale.toLowerCase().replace("_", "-");
  const langAndGenderMatch = searchPool.find((v) => {
    const nameLower = v.name.toLowerCase();
    const langLower = v.lang.toLowerCase().replace("_", "-");
    const matchesLang = langLower.includes(targetLang);
    const matchesGender = genderKeywords.some((k) => nameLower.includes(k));
    return matchesLang && matchesGender;
  });
  if (langAndGenderMatch) {
    return { voice: langAndGenderMatch, pitch: persona.pitch, rate: persona.rate };
  }

  // 3. Match by gender anywhere in English voices
  const genderMatch = searchPool.find((v) => {
    const nameLower = v.name.toLowerCase();
    return genderKeywords.some((k) => nameLower.includes(k));
  });
  if (genderMatch) {
    return { voice: genderMatch, pitch: persona.pitch, rate: persona.rate };
  }

  // 4. Default natural voice with persona pitch & rate
  const fallback = getPreferredVoice();
  return { voice: fallback, pitch: persona.pitch, rate: persona.rate };
}

/**
 * Primary TTS:
 * - "piper": On-device Piper Neural TTS (<25MB model, fast VITS ONNX in Web Worker)
 * - "kokoro": On-device Kokoro-82M in Web Worker
 * - "instant": High-quality natural browser speech synthesis
 */
export function speakText(text: string, options: SpeakOptions = {}): () => void {
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    options.onEnd?.();
    return () => {};
  }

  // Cancel any ongoing audio first
  stopSpeaking();

  const engine = getSavedVoiceEngine();

  // 0. Groq Canopy Labs Orpheus V1 TTS (Ultra-low latency LPU)
  if (engine === "groq-orpheus") {
    let cancelled = false;
    let cancelOrpheus: (() => void) | null = null;

    speakWithGroqOrpheus(cleaned, {
      voice: options.voice ?? getSavedOrpheusVoice(),
      onStart: () => {
        if (!cancelled) options.onStart?.();
      },
      onEnd: () => {
        if (!cancelled) options.onEnd?.();
      },
      onError: () => {
        if (cancelled) return;
        fallbackWebSpeech(cleaned, options);
      },
    })
      .then((cancelFn) => {
        cancelOrpheus = cancelFn;
      })
      .catch(() => {
        if (!cancelled) fallbackWebSpeech(cleaned, options);
      });

    return () => {
      cancelled = true;
      cancelOrpheus?.();
      stopSpeaking();
    };
  }

  // 1. Piper Neural TTS mode (VITS ONNX in Web Worker)
  if (engine === "piper") {
    let cancelled = false;
    let cancelPiper: (() => void) | null = null;

    speakWithPiper(cleaned, {
      voice: options.voice ?? getSavedPiperVoice(),
      onStart: () => {
        if (!cancelled) options.onStart?.();
      },
      onEnd: () => {
        if (!cancelled) options.onEnd?.();
      },
      onError: () => {
        if (cancelled) return;
        fallbackWebSpeech(cleaned, options);
      },
    })
      .then((cancelFn) => {
        cancelPiper = cancelFn;
      })
      .catch(() => {
        if (!cancelled) fallbackWebSpeech(cleaned, options);
      });

    return () => {
      cancelled = true;
      cancelPiper?.();
      stopSpeaking();
    };
  }

  // 2. Kokoro mode: on-device neural synthesis inside Web Worker
  if (engine === "kokoro") {
    let cancelled = false;
    let cancelKokoro: (() => void) | null = null;

    speakWithKokoro(cleaned, {
      voice: options.voice ?? getSavedVoice(),
      onStart: () => {
        if (!cancelled) options.onStart?.();
      },
      onEnd: () => {
        if (!cancelled) options.onEnd?.();
      },
      onError: () => {
        if (cancelled) return;
        fallbackWebSpeech(cleaned, options);
      },
    })
      .then((cancelFn) => {
        cancelKokoro = cancelFn;
      })
      .catch(() => {
        if (!cancelled) fallbackWebSpeech(cleaned, options);
      });

    return () => {
      cancelled = true;
      cancelKokoro?.();
      stopSpeaking();
    };
  }

  // 3. Instant mode: zero latency (<0.1s response), runs in browser native audio subsystem
  fallbackWebSpeech(cleaned, options);
  return () => {
    stopSpeaking();
  };
}

/** Instant fallback TTS using browser Web Speech Synthesis with persona voice matching */
function fallbackWebSpeech(cleaned: string, options: SpeakOptions) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    options.onError?.(new Error("No speech synthesis available"));
    options.onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleaned);
  const voiceTarget = options.voice || getSavedPiperVoice();
  const matched = findMatchingBrowserVoice(voiceTarget);

  if (matched.voice) {
    utterance.voice = matched.voice;
  }
  utterance.pitch = Math.max(0.6, Math.min(1.5, (options.pitch ?? 1.0) * matched.pitch));
  utterance.rate = Math.max(0.7, Math.min(1.4, (options.rate ?? 1.0) * matched.rate));

  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = (e) => {
    if (e.error === "interrupted" || e.error === "canceled") {
      options.onEnd?.();
      return;
    }
    options.onError?.(e);
    options.onEnd?.();
  };

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    options.onError?.(err);
    options.onEnd?.();
  }
}

/** Immediately cancels all active speech (Piper + Kokoro + Orpheus + Web Speech) for barge-in */
export function stopSpeaking(): void {
  stopPiperAudio();
  stopKokoroAudio();
  stopOrpheusAudio();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// =============================================================================
// WAV Audio Encoding (16-bit Mono PCM at 16kHz for Meta Muse Voice Transcribe)
// =============================================================================

/** Encodes Float32 PCM samples into a standard 16-bit Mono WAV Blob */
export function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true); // Subchunk2Size

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/** Downsamples Float32Array to 16,000 Hz if needed */
export function downsampleTo16k(samples: Float32Array, inputRate: number): Float32Array {
  if (inputRate === 16000) return samples;
  const targetRate = 16000;
  const ratio = inputRate / targetRate;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetSource = 0;
  while (offsetResult < result.length) {
    const nextOffsetSource = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetSource; i < nextOffsetSource && i < samples.length; i++) {
      accum += samples[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetSource = nextOffsetSource;
  }
  return result;
}

// =============================================================================
// Speech-To-Text (STT) Hook: Meta Muse Voice Transcribe (16kHz PCM WAV)
// =============================================================================

export interface UseVoiceInputOptions {
  sessionId?: string;
  onFinalTranscript?: (transcript: string) => void;
  onAutoSend?: (transcript: string) => void;
  continuous?: boolean;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEventShim extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionShim extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEventShim) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionShim;

export function isSTTSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition ||
    navigator.mediaDevices?.getUserMedia,
  );
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionShim | null>(null);
  const shouldListenRef = useRef(false);
  const transcriptRef = useRef("");
  const interimRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!options.sessionId || typeof window === "undefined") return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/sessions/${options.sessionId}/voice-stream`;

    let activeWs: WebSocket | null = null;
    try {
      activeWs = new WebSocket(wsUrl);
      wsRef.current = activeWs;

      activeWs.onopen = () => {
        console.info(`[Voice] Realtime STT WebSocket connected to ${wsUrl}`);
      };

      activeWs.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data));
          if (msg.type === "speech_start") {
            stopSpeaking();
            setIsSpeaking(true);
          } else if (msg.type === "partial_transcript" && typeof msg.transcript === "string") {
            setInterimTranscript(msg.transcript);
            interimRef.current = msg.transcript;
          } else if (msg.type === "speech_complete" && typeof msg.transcript === "string") {
            const final = msg.transcript.trim();
            if (final) {
              setTranscript(final);
              transcriptRef.current = final;
              optionsRef.current.onFinalTranscript?.(final);
              optionsRef.current.onAutoSend?.(final);
            }
          } else if (msg.type === "barge_in") {
            stopSpeaking();
          }
        } catch {
          // Ignore non-json frames
        }
      };

      activeWs.onerror = (e) => {
        console.info("[Voice] WebSocket relay notice, continuing with fallback audio capture:", e);
      };

      activeWs.onclose = () => {
        wsRef.current = null;
      };
    } catch {
      // Graceful fallback to HTTP transcribe
    }

    return () => {
      if (activeWs && activeWs.readyState === WebSocket.OPEN) {
        activeWs.close();
      }
      wsRef.current = null;
    };
  }, [options.sessionId]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    interimRef.current = interimTranscript;
  }, [interimTranscript]);

  const initRecognition = useCallback((): SpeechRecognitionShim | null => {
    if (typeof window === "undefined") return null;

    const Ctor =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;

    if (!Ctor) return null;

    try {
      const recognition = new Ctor();
      recognition.continuous = options.continuous ?? true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEventShim) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item?.[0]?.transcript ?? "";
          if (item?.isFinal) {
            final += text + " ";
          } else {
            interim += text;
          }
        }

        if (final) {
          setTranscript((prev) => {
            const next = (prev + " " + final).trim();
            transcriptRef.current = next;
            optionsRef.current.onFinalTranscript?.(next);
            return next;
          });
        }
        setInterimTranscript(interim);
        interimRef.current = interim;
      };

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === "no-speech" || e.error === "network") return;
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setError("Microphone access blocked. Please allow mic permissions in your browser.");
        }
      };

      recognition.onend = () => {
        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch {
            // Ignore
          }
        }
      };

      recognitionRef.current = recognition;
      return recognition;
    } catch {
      return null;
    }
  }, [options.continuous]);

  useEffect(() => {
    initRecognition();

    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.abort();
      void stopMicStream();
    };
  }, [initRecognition]);

  // Audio volume analyzer & MediaRecorder setup for Meta Muse Voice Transcribe
  const startMicStream = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      // Setup Web Audio Analyser for the live volume meter and glowing pill reactivity
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      await audioCtx.resume();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;
      source.connect(analyser);

      // Setup standard MediaRecorder to reliably capture audio chunks in all browsers
      recorderChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recorderChunksRef.current.push(e.data);
        }
      };

      recorder.start(100); // 100ms chunk slice ensures audio is immediately gathered

      // Realtime PCM streaming over WebSocket when available
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "start", languageBias: "en-US" }));
      }

      try {
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        processor.onaudioprocess = (e) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const input = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
              const s = Math.max(-1, Math.min(1, input[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            wsRef.current.send(pcm16.buffer);
          }
        };
        source.connect(processor);
        processor.connect(audioCtx.destination);
      } catch {
        // Fallback continues with MediaRecorder
      }

      // Animated equalizer meter loop to calculate real-time volume
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128);
        setVolume(normalized);
        setIsSpeaking(normalized > 0.04);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      console.warn("[Voice] getUserMedia error:", err);
      setError("Microphone permission needed. Please allow microphone access in your browser.");
    }
  }, []);

  const stopMicStream = useCallback(async (autoSend = false): Promise<string> => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Stop MediaRecorder and wait for final chunks
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        try {
          recorder.stop();
        } catch {
          resolve();
        }
      });
    }
    mediaRecorderRef.current = null;

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    setVolume(0);
    setIsSpeaking(false);

    // Process recorded audio chunks into 16kHz mono WAV for Meta Muse Voice Transcribe
    const chunks = recorderChunksRef.current;
    recorderChunksRef.current = [];

    const rawBlob = new Blob(chunks, { type: recorder?.mimeType || "audio/webm" });
    let finalTranscribed = "";

    if (rawBlob.size > 200) {
      setIsTranscribing(true);
      try {
        let wavBlob: Blob = rawBlob;
        try {
          // Native browser C++ decode of WebM audio into PCM Float32
          const arrayBuffer = await rawBlob.arrayBuffer();
          const decodeCtx = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
            sampleRate: 16000,
          });
          const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
          const channelData = audioBuffer.getChannelData(0);
          wavBlob = encodeWAV(channelData, 16000);
          await decodeCtx.close();
        } catch (decErr) {
          console.info("[Voice] decodeAudioData notice, sending raw audio to backend:", decErr);
        }

        console.info(`[Voice] Transcribing ${wavBlob.size} bytes (${wavBlob.type}) with default model: ${STT_MODEL_NAME}`);
        const res = await api.transcribe(wavBlob, optionsRef.current.sessionId);
        if (res.transcript && res.transcript.trim()) {
          finalTranscribed = res.transcript.trim();
        } else if (interimRef.current) {
          finalTranscribed = interimRef.current.trim();
        }
      } catch (err) {
        console.warn("[Voice] Muse Voice Transcribe request notice:", err);
        if (interimRef.current) {
          finalTranscribed = interimRef.current.trim();
        }
      } finally {
        setIsTranscribing(false);
      }
    } else if (interimRef.current) {
      finalTranscribed = interimRef.current.trim();
    }

    if (finalTranscribed) {
      setTranscript(finalTranscribed);
      transcriptRef.current = finalTranscribed;
      optionsRef.current.onFinalTranscript?.(finalTranscribed);
      if (autoSend) {
        optionsRef.current.onAutoSend?.(finalTranscribed);
      }
    }

    return finalTranscribed;
  }, []);

  const startListening = useCallback(() => {
    shouldListenRef.current = true;
    setError(null);
    setIsListening(true);
    // Barge-in: interrupt AI speech immediately
    stopSpeaking();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ action: "barge_in" }));
      } catch {}
    }

    void startMicStream();

    try {
      let rec = recognitionRef.current;
      if (!rec) {
        rec = initRecognition();
      }
      rec?.start();
    } catch {
      // Ignored if browser speech recognition is restricted; Web Audio captures audio
    }
  }, [initRecognition, startMicStream]);

  const stopListening = useCallback(
    async (autoSend = false): Promise<string> => {
      shouldListenRef.current = false;
      setIsListening(false);

      // Flush any pending interim speech into final transcript
      if (interimRef.current) {
        const combined = `${transcriptRef.current} ${interimRef.current}`.trim();
        setTranscript(combined);
        transcriptRef.current = combined;
        optionsRef.current.onFinalTranscript?.(combined);
      }

      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }

      const text = await stopMicStream(autoSend);
      setInterimTranscript("");
      interimRef.current = "";
      return text;
    },
    [stopMicStream],
  );

  /** Stops recording audio and immediately auto-sends it to the interviewer */
  const stopAndSend = useCallback(async (): Promise<string> => {
    return stopListening(true);
  }, [stopListening]);

  /** Cancels recording without transcribing or sending */
  const cancelListening = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {}
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    recorderChunksRef.current = [];
    setVolume(0);
    setIsSpeaking(false);
    setIsTranscribing(false);
    setInterimTranscript("");
    interimRef.current = "";
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      void stopListening(false);
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    transcriptRef.current = "";
    setInterimTranscript("");
    interimRef.current = "";
    recorderChunksRef.current = [];
  }, []);

  return {
    isListening,
    isSpeaking,
    isTranscribing,
    volume,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    stopAndSend,
    cancelListening,
    toggleListening,
    resetTranscript,
    setTranscript,
    sttModel: STT_MODEL_NAME,
    ttsModel: TTS_MODEL_NAME,
    isMuseDefault: IS_MUSE_STT_DEFAULT,
  };
}
