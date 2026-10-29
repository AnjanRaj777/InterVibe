import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractText, ExtractionError } from "../src/ingest/extract.js";
import { parseJD, parseResume, ParseError } from "../src/ingest/parse.js";

const dir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("extractText", () => {
  it("reads txt", async () => {
    const r = await extractText(new TextEncoder().encode("  hello world  "), "text/plain");
    expect(r).toEqual({ text: "hello world", truncated: false });
  });

  it("reads the pdf fixture", async () => {
    const bytes = await readFile(join(dir, "sample.pdf"));
    const r = await extractText(bytes, "application/pdf");
    expect(r.text).toContain("Priya Nair");
    expect(r.text).toContain("Postgres");
  });

  it("reads the docx fixture", async () => {
    const bytes = await readFile(join(dir, "sample.docx"));
    const r = await extractText(bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(r.text).toContain("Rahul Verma");
    expect(r.text).toContain("Amplitude");
  });

  it("rejects empty and unsupported files", async () => {
    await expect(extractText(new Uint8Array(0), "text/plain")).rejects.toThrowError(ExtractionError);
    await expect(extractText(new TextEncoder().encode("x"), "image/png")).rejects.toThrowError(
      /PDF, DOCX, or TXT/,
    );
  });

  it("truncates over-long text and says so", async () => {
    const r = await extractText(new TextEncoder().encode("abcdefghij"), "text/plain", 4);
    expect(r).toEqual({ text: "abcd", truncated: true });
  });
});

const resumeJson = JSON.stringify({
  name: "Priya Nair",
  skills: ["Java", "Spring Boot", "Postgres"],
  experience: [],
  education: [],
  metrics: ["40k rps"],
  notes: [],
});

describe("parseResume / parseJD", () => {
  it("validates good model output", async () => {
    const p = await parseResume("...", async () => ({ text: resumeJson }));
    expect(p.name).toBe("Priya Nair");
    expect(p.skills).toContain("Postgres");
  });

  it("fails loudly on bad model output", async () => {
    await expect(parseResume("...", async () => ({ text: "not json" }))).rejects.toThrowError(ParseError);
    await expect(
      parseResume("...", async () => ({ text: JSON.stringify({ skills: [] }) })),
    ).rejects.toThrowError(ParseError);
    await expect(
      parseJD("...", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrowError(ParseError);
  });
});
