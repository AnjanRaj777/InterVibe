import { describe, expect, it, vi } from "vitest";
import { synthesizeGroqSpeech } from "../src/tts/groq.js";

describe("Groq TTS (canopylabs/orpheus-v1-english)", () => {
  it("throws error when GROQ_API_KEY is not configured", async () => {
    await expect(
      synthesizeGroqSpeech({
        apiKey: undefined,
        text: "Hello world",
      }),
    ).rejects.toThrowError(/GROQ_API_KEY is not configured/);
  });

  it("calls Groq speech endpoint with correct payload and returns audio", async () => {
    const fakeAudioBytes = new Uint8Array([1, 2, 3, 4, 5]).buffer;

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "audio/wav" }),
      arrayBuffer: () => Promise.resolve(fakeAudioBytes),
    });

    vi.stubGlobal("fetch", mockFetch);

    const result = await synthesizeGroqSpeech({
      apiKey: "gsk_test123",
      text: "[cheerful] Welcome to your interview!",
      voice: "troy",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/audio/speech",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer gsk_test123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "canopylabs/orpheus-v1-english",
          input: "[cheerful] Welcome to your interview!",
          voice: "troy",
          response_format: "wav",
        }),
      }),
    );

    expect(result.contentType).toBe("audio/wav");
    expect(new Uint8Array(result.audio)).toEqual(new Uint8Array([1, 2, 3, 4, 5]));

    vi.unstubAllGlobals();
  });

  it("handles Groq API error response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve("Invalid voice specified"),
    });

    vi.stubGlobal("fetch", mockFetch);

    await expect(
      synthesizeGroqSpeech({
        apiKey: "gsk_test123",
        text: "Hello",
        voice: "invalid",
      }),
    ).rejects.toThrowError(/Groq TTS API error \(400\): Invalid voice specified/);

    vi.unstubAllGlobals();
  });
});
