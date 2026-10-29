import { describe, expect, it } from "vitest";
import {
  createSentenceChunker,
  splitIntoSentenceChunks,
} from "../src/chunker.js";

describe("Phase 4 — Sentence Chunker for Voice Streaming", () => {
  it("yields exactly 3 chunks for a standard 3-sentence fixture", () => {
    const text =
      "Welcome to InterVibe! Today we will run your live technical interview. Let's start with your background.";
    const chunks = splitIntoSentenceChunks(text);
    expect(chunks).toEqual([
      "Welcome to InterVibe!",
      "Today we will run your live technical interview.",
      "Let's start with your background.",
    ]);
    expect(chunks).toHaveLength(3);
  });

  it("does not split on common abbreviations (e.g., vs., i.e., Dr.)", () => {
    const text =
      "We evaluated Kafka vs. RabbitMQ for our event bus, e.g. for high-throughput streaming. Dr. Smith approved the architecture.";
    const chunks = splitIntoSentenceChunks(text);
    expect(chunks).toEqual([
      "We evaluated Kafka vs. RabbitMQ for our event bus, e.g. for high-throughput streaming.",
      "Dr. Smith approved the architecture.",
    ]);
    expect(chunks).toHaveLength(2);
  });

  it("does not split on decimals and currency amounts", () => {
    const text =
      "The p99 latency dropped from 120.5ms to 3.14ms under load. We saved $1.25 million per quarter.";
    const chunks = splitIntoSentenceChunks(text);
    expect(chunks).toEqual([
      "The p99 latency dropped from 120.5ms to 3.14ms under load.",
      "We saved $1.25 million per quarter.",
    ]);
    expect(chunks).toHaveLength(2);
  });

  it("does not split on version numbers or code identifiers", () => {
    const text =
      "We upgraded to node.js v20.0 and next.js v14.2 for the frontend. The API was deployed at api.meta.ai/v1.";
    const chunks = splitIntoSentenceChunks(text);
    expect(chunks).toEqual([
      "We upgraded to node.js v20.0 and next.js v14.2 for the frontend.",
      "The API was deployed at api.meta.ai/v1.",
    ]);
    expect(chunks).toHaveLength(2);
  });

  it("handles streaming token-by-token chunks dynamically", () => {
    const chunker = createSentenceChunker();
    const tokens = ["First ", "thought ", "here. ", "Second ", "sentence ", "streaming!"];
    const collected: string[] = [];

    for (const tok of tokens) {
      const produced = chunker.push(tok);
      collected.push(...produced);
    }
    const finalChunks = chunker.flush();
    collected.push(...finalChunks);

    expect(collected).toEqual([
      "First thought here.",
      "Second sentence streaming!",
    ]);
  });
});
