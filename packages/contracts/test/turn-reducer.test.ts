import { describe, expect, it } from "vitest";
import {
  createInitialTurnState,
  turnEventReducer,
  type RealtimeVoiceEvent,
} from "../src/voice.js";

describe("Phase 4 — turnId Event Reducer & Overlapping Turns", () => {
  it("processes standard speech flow: speech_start -> partial -> speech_end -> speech_complete", () => {
    let state = createInitialTurnState();

    state = turnEventReducer(state, {
      type: "speech_start",
      timestamp: 1000,
    });
    expect(state.status).toBe("listening");

    state = turnEventReducer(state, {
      type: "partial_transcript",
      transcript: "I built a distributed",
      timestamp: 1100,
    });
    expect(state.interimTranscript).toBe("I built a distributed");

    state = turnEventReducer(state, {
      type: "speech_end",
      timestamp: 2000,
    });
    expect(state.status).toBe("transcribing");

    state = turnEventReducer(state, {
      type: "speech_complete",
      turnId: "turn-1",
      transcript: "I built a distributed key-value store using Raft.",
      timestamp: 2200,
    });
    expect(state.activeTurnId).toBe("turn-1");
    expect(state.committedTurns).toHaveLength(1);
    expect(state.committedTurns[0].turnId).toBe("turn-1");
    expect(state.committedTurns[0].userTranscript).toBe(
      "I built a distributed key-value store using Raft.",
    );
  });

  it("handles overlapping turns where speech_start for turn-2 arrives before speech_complete for turn-1", () => {
    let state = createInitialTurnState();

    // Turn 1 starts speaking
    state = turnEventReducer(state, { type: "speech_start", timestamp: 1000 });
    state = turnEventReducer(state, { type: "partial_transcript", transcript: "First answer", timestamp: 1200 });
    state = turnEventReducer(state, { type: "speech_end", timestamp: 1800 });

    // User starts talking again immediately (Turn 2 starts before Turn 1 speech_complete arrives from remote socket)
    state = turnEventReducer(state, { type: "speech_start", timestamp: 1900 });
    expect(state.status).toBe("listening");

    // Delayed speech_complete for turn-1 arrives
    state = turnEventReducer(state, {
      type: "speech_complete",
      turnId: "turn-1",
      transcript: "First answer completed.",
      timestamp: 1950,
    });

    // Committed turns must retain turn-1 without interrupting ongoing listening of turn-2
    expect(state.committedTurns).toHaveLength(1);
    expect(state.committedTurns[0].turnId).toBe("turn-1");
    expect(state.committedTurns[0].userTranscript).toBe("First answer completed.");
    expect(state.status).toBe("listening");

    // Turn 2 finishes
    state = turnEventReducer(state, { type: "speech_end", timestamp: 2500 });
    state = turnEventReducer(state, {
      type: "speech_complete",
      turnId: "turn-2",
      transcript: "Second answer completed.",
      timestamp: 2600,
    });

    expect(state.committedTurns).toHaveLength(2);
    expect(state.committedTurns[0].turnId).toBe("turn-1");
    expect(state.committedTurns[1].turnId).toBe("turn-2");
  });

  it("handles barge-in: speech_start interrupts AI speech immediately", () => {
    let state = createInitialTurnState();

    // AI is speaking response for turn-1
    state = turnEventReducer(state, { type: "ai_start", turnId: "turn-1", timestamp: 3000 });
    state = turnEventReducer(state, {
      type: "ai_chunk",
      turnId: "turn-1",
      chunkIndex: 0,
      text: "That sounds impressive.",
      isFinal: false,
      timestamp: 3200,
    });
    expect(state.status).toBe("ai_speaking");
    expect(state.aiSpeakingTurnId).toBe("turn-1");

    // User interrupts (barges in)
    state = turnEventReducer(state, { type: "speech_start", timestamp: 3500 });

    // AI speech must be immediately stopped and bargeInActive flagged
    expect(state.status).toBe("listening");
    expect(state.aiSpeakingTurnId).toBeNull();
    expect(state.bargeInActive).toBe(true);
    expect(state.currentAiChunks).toHaveLength(0);

    // Any stale late chunk for turn-1 must be discarded
    state = turnEventReducer(state, {
      type: "ai_chunk",
      turnId: "turn-1",
      chunkIndex: 1,
      text: "Can you elaborate on Raft log compaction?",
      isFinal: true,
      timestamp: 3600,
    });
    expect(state.currentAiChunks).toHaveLength(0);
  });
});
