// Dedicated Web Worker for on-device Piper TTS
// Runs lightweight VITS ONNX neural speech synthesis completely off the main UI thread.
import { predict, download, stored, TtsSession } from "@mintplex-labs/piper-tts-web";

let currentLoadedVoice: string | null = null;

function resetSessionIfVoiceChanged(voice: string) {
  if (currentLoadedVoice && currentLoadedVoice !== voice) {
    try {
      // Clear the static singleton in piper-tts-web so that predict() creates
      // a fresh TtsSession with the new voice's ONNX model rather than reusing the old one.
      (TtsSession as unknown as { _instance: unknown })._instance = null;
    } catch {
      // Ignore
    }
  }
  currentLoadedVoice = voice;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, id, text, voiceId } = e.data || {};

  if (type === "preload" || type === "init") {
    try {
      const voice = voiceId || "en_US-amy-medium";
      resetSessionIfVoiceChanged(voice);
      const cached = await stored().catch(() => []);
      if (!cached.includes(voice)) {
        await download(voice);
      }
      self.postMessage({ type: "ready", id, success: true, voiceId: voice });
    } catch (err) {
      self.postMessage({ type: "error", id, error: String(err) });
    }
    return;
  }

  if (type === "generate") {
    try {
      const voice = voiceId || "en_US-amy-medium";
      resetSessionIfVoiceChanged(voice);
      const cached = await stored().catch(() => []);
      if (!cached.includes(voice)) {
        await download(voice);
      }
      const blob = await predict({
        text,
        voiceId: voice,
      });
      self.postMessage({ type: "audio", id, blob });
    } catch (err) {
      self.postMessage({ type: "error", id, error: String(err) });
    }
  }
};
