export interface GroqTTSOptions {
  apiKey?: string;
  text: string;
  voice?: "autumn" | "diana" | "hannah" | "austin" | "daniel" | "troy" | string;
  model?: string;
  responseFormat?: "wav";
}

export const ORPHEUS_DEFAULT_MODEL = "canopylabs/orpheus-v1-english";
export const ORPHEUS_DEFAULT_VOICE = "autumn";

export const ORPHEUS_VOICES = [
  { id: "autumn", name: "Autumn (Default)", gender: "female", description: "Warm, natural expressive female persona" },
  { id: "diana", name: "Diana", gender: "female", description: "Clear, articulate, professional female interviewer" },
  { id: "hannah", name: "Hannah", gender: "female", description: "Energetic, engaging, lively female persona" },
  { id: "austin", name: "Austin", gender: "male", description: "Calm, thoughtful, executive male tone" },
  { id: "daniel", name: "Daniel", gender: "male", description: "Articulate, measured, technical male interviewer" },
  { id: "troy", name: "Troy", gender: "male", description: "Authoritative, deep, confident male voice" },
] as const;

/**
 * Synthesizes speech using Groq's ultra-low latency audio speech API with the
 * Canopy Labs Orpheus V1 model (`canopylabs/orpheus-v1-english`).
 */
export async function synthesizeGroqSpeech(
  options: GroqTTSOptions,
): Promise<{ audio: ArrayBuffer; contentType: string }> {
  const apiKey = options.apiKey?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured. Please add GROQ_API_KEY in .env.");
  }

  const model = options.model ?? ORPHEUS_DEFAULT_MODEL;
  const voice = options.voice ?? ORPHEUS_DEFAULT_VOICE;
  const responseFormat = options.responseFormat ?? "wav";

  const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: options.text,
      voice,
      response_format: responseFormat,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq TTS API error (${response.status}): ${errorBody}`);
  }

  const audio = await response.arrayBuffer();
  return {
    audio,
    contentType: response.headers.get("content-type") || "audio/wav",
  };
}
