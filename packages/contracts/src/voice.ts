import { z } from "zod";
import { TurnEvaluation } from "./index.js";

/** Realtime Voice Protocol Events (Browser <-> API <-> Meta STT) */
export const VoiceEventType = z.enum([
  "speech_start",
  "partial_transcript",
  "speech_end",
  "speech_complete",
  "ai_start",
  "ai_chunk",
  "ai_complete",
  "barge_in",
  "mute",
  "unmute",
  "error",
]);
export type VoiceEventType = z.infer<typeof VoiceEventType>;

export const RealtimeVoiceEvent = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("speech_start"),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal("partial_transcript"),
    transcript: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal("speech_end"),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal("speech_complete"),
    turnId: z.string().min(1),
    transcript: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal("ai_start"),
    turnId: z.string().min(1),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal("ai_chunk"),
    turnId: z.string().min(1),
    chunkIndex: z.number().int().nonnegative(),
    text: z.string(),
    isFinal: z.boolean(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal("ai_complete"),
    turnId: z.string().min(1),
    fullText: z.string(),
    evaluation: z.lazy(() => TurnEvaluation).optional(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal("barge_in"),
    turnId: z.string().optional(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal("mute"),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal("unmute"),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
    code: z.string().optional(),
    recoverable: z.boolean().default(true),
    timestamp: z.number(),
  }),
]);
export type RealtimeVoiceEvent = z.infer<typeof RealtimeVoiceEvent>;

/** User/interviewer turn state */
export interface TurnState {
  status: "idle" | "listening" | "transcribing" | "ai_thinking" | "ai_speaking";
  activeTurnId: string | null;
  interimTranscript: string;
  committedTurns: Array<{
    turnId: string;
    userTranscript: string;
    aiResponse?: string;
    evaluation?: TurnEvaluation;
  }>;
  aiSpeakingTurnId: string | null;
  currentAiChunks: string[];
  isMuted: boolean;
  bargeInActive: boolean;
  lastError: string | null;
}

export function createInitialTurnState(): TurnState {
  return {
    status: "idle",
    activeTurnId: null,
    interimTranscript: "",
    committedTurns: [],
    aiSpeakingTurnId: null,
    currentAiChunks: [],
    isMuted: false,
    bargeInActive: false,
    lastError: null,
  };
}

/**
 * Pure turn event reducer.
 * Accurately handles out-of-order events, overlapping turns, late speechComplete,
 * and barge-ins without corrupted or dropped committed turns.
 */
export function turnEventReducer(state: TurnState, event: RealtimeVoiceEvent): TurnState {
  switch (event.type) {
    case "speech_start": {
      // If AI was speaking or thinking, speech_start triggers barge-in: AI halts immediately
      const wasAiBusy = state.status === "ai_thinking" || state.status === "ai_speaking";
      return {
        ...state,
        status: "listening",
        interimTranscript: "",
        aiSpeakingTurnId: null,
        currentAiChunks: [],
        bargeInActive: wasAiBusy,
        lastError: null,
      };
    }

    case "partial_transcript": {
      // Partials update live interim text while listening
      return {
        ...state,
        status: "listening",
        interimTranscript: event.transcript,
      };
    }

    case "speech_end": {
      return {
        ...state,
        status: state.status === "listening" ? "transcribing" : state.status,
      };
    }

    case "speech_complete": {
      // Look up if this turnId already exists (e.g. out-of-order delivery or retransmission)
      const existingIdx = state.committedTurns.findIndex((t) => t.turnId === event.turnId);
      let updatedTurns = [...state.committedTurns];

      if (existingIdx >= 0) {
        updatedTurns[existingIdx] = {
          ...updatedTurns[existingIdx],
          userTranscript: event.transcript,
        };
      } else {
        updatedTurns.push({
          turnId: event.turnId,
          userTranscript: event.transcript,
        });
      }

      // If user is not already speaking again in a new turn, we move to transcribing / ready for AI
      const isStillListeningNewTurn = state.status === "listening" && state.activeTurnId !== event.turnId;

      return {
        ...state,
        status: isStillListeningNewTurn ? "listening" : "transcribing",
        activeTurnId: event.turnId,
        interimTranscript: "",
        committedTurns: updatedTurns,
      };
    }

    case "ai_start": {
      // Barge-in active ignores or halts older AI start
      if (state.bargeInActive) {
        return state;
      }
      return {
        ...state,
        status: "ai_thinking",
        aiSpeakingTurnId: event.turnId,
        currentAiChunks: [],
      };
    }

    case "ai_chunk": {
      if (state.bargeInActive || state.aiSpeakingTurnId !== event.turnId) {
        return state;
      }
      return {
        ...state,
        status: "ai_speaking",
        currentAiChunks: [...state.currentAiChunks, event.text],
      };
    }

    case "ai_complete": {
      if (state.aiSpeakingTurnId !== event.turnId && !state.committedTurns.some((t) => t.turnId === event.turnId)) {
        return state;
      }

      const turns = state.committedTurns.map((t) => {
        if (t.turnId === event.turnId) {
          return {
            ...t,
            aiResponse: event.fullText,
            evaluation: event.evaluation ?? t.evaluation,
          };
        }
        return t;
      });

      return {
        ...state,
        status: state.status === "listening" ? "listening" : "idle",
        aiSpeakingTurnId: null,
        currentAiChunks: [],
        committedTurns: turns,
        bargeInActive: false,
      };
    }

    case "barge_in": {
      return {
        ...state,
        status: "listening",
        aiSpeakingTurnId: null,
        currentAiChunks: [],
        bargeInActive: true,
      };
    }

    case "mute": {
      return {
        ...state,
        isMuted: true,
        aiSpeakingTurnId: null,
        status: state.status === "ai_speaking" ? "idle" : state.status,
      };
    }

    case "unmute": {
      return {
        ...state,
        isMuted: false,
      };
    }

    case "error": {
      return {
        ...state,
        lastError: event.message,
        status: event.recoverable ? state.status : "idle",
      };
    }

    default:
      return state;
  }
}
