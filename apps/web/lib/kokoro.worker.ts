// Dedicated Web Worker for on-device Kokoro TTS (Kokoro-82M ONNX)
// Offloads heavy neural matrix multiplications completely off the main UI thread.
import { KokoroTTS } from "kokoro-js";

let ttsInstance: any = null;
let loadPromise: Promise<any> | null = null;

async function getTTS(preferredDevice: "wasm" | "webgpu" = "wasm") {
  if (ttsInstance) return ttsInstance;
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        // Check if WebGPU adapter is actually available before requesting it
        let hasWebGPU = false;
        if (typeof navigator !== "undefined" && (navigator as any).gpu) {
          try {
            const adapter = await (navigator as any).gpu.requestAdapter();
            hasWebGPU = Boolean(adapter);
          } catch {
            hasWebGPU = false;
          }
        }

        if (hasWebGPU) {
          try {
            console.info("[KokoroWorker] WebGPU adapter detected. Initializing with WebGPU accelerator...");
            const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
              dtype: "fp32",
              device: "webgpu",
            });
            ttsInstance = tts;
            console.info("[KokoroWorker] Initialized with WebGPU accelerator.");
            return tts;
          } catch (gpuErr) {
            console.info("[KokoroWorker] WebGPU init failed, using WASM fallback:", gpuErr);
          }
        }

        // Standard quantized WASM device fallback
        const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
          dtype: "q8",
          device: "wasm",
        });
        ttsInstance = tts;
        console.info("[KokoroWorker] Initialized with WASM device.");
        return tts;
      } catch (err) {
        console.warn("[KokoroWorker] Failed to load Kokoro model:", err);
        return null;
      }
    })();
  }
  return loadPromise;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, id, text, voice, speed, device } = e.data || {};

  if (type === "init" || type === "preload") {
    try {
      const tts = await getTTS(device || "wasm");
      self.postMessage({ type: "ready", id, success: Boolean(tts) });
    } catch (err) {
      self.postMessage({ type: "error", id, error: String(err) });
    }
    return;
  }

  if (type === "generate") {
    try {
      const tts = await getTTS(device || "wasm");
      if (!tts) {
        self.postMessage({ type: "error", id, error: "Kokoro TTS engine failed to initialize" });
        return;
      }
      const rawAudio = await tts.generate(text, { voice, speed });
      const blob = rawAudio.toBlob();
      self.postMessage({ type: "audio", id, blob });
    } catch (err) {
      self.postMessage({ type: "error", id, error: String(err) });
    }
  }
};
