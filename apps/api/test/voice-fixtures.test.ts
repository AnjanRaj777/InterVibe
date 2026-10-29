import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { transcribeAudio } from "../src/meta/client.js";

interface GoldenClip {
  id: string;
  duration: number;
  text: string;
}

function resolveFixturesDir(): string {
  const local = join(process.cwd(), "fixtures", "voice");
  if (existsSync(local)) return local;
  return join(process.cwd(), "..", "..", "fixtures", "voice");
}

describe("Phase 4 — Golden Voice Fixtures & Transcription Integration", () => {
  const fixturesDir = resolveFixturesDir();
  const expectedJson = JSON.parse(
    readFileSync(join(fixturesDir, "expected.json"), "utf8"),
  ) as GoldenClip[];

  it("loads and verifies all 10 golden voice fixtures", () => {
    expect(expectedJson).toHaveLength(10);
    for (const clip of expectedJson) {
      const filePath = join(fixturesDir, clip.id);
      const bytes = readFileSync(filePath);
      expect(bytes.length).toBeGreaterThan(1000);

      // Verify WAV header
      const riff = bytes.toString("ascii", 0, 4);
      const wave = bytes.toString("ascii", 8, 12);
      expect(riff).toBe("RIFF");
      expect(wave).toBe("WAVE");
    }
  });

  it("processes all 10 clips through transcription pipeline with valid audio duration", async () => {
    for (const clip of expectedJson) {
      const bytes = new Uint8Array(readFileSync(join(fixturesDir, clip.id)));

      const result = await transcribeAudio({
        apiKey: "mock-key",
        audioBytes: bytes,
        contentType: "audio/wav",
      });

      expect(result.model).toBe("muse-voice-transcribe-1.0");
      expect(result.audioSeconds).toBeGreaterThan(0);
      // Measured audio seconds should roughly align with clip duration
      expect(Math.abs((result.audioSeconds ?? 0) - clip.duration)).toBeLessThanOrEqual(2);
    }
  });
});
