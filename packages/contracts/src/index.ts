import { z } from "zod";

/** Session lifecycle. The API enforces transitions; the UI only renders state. */
export const SessionState = z.enum([
  "setup",
  "parsed",
  "diagnosing",
  "plan_ready",
  "comms_training",
  "drilling",
  "live_mock",
  "scored",
  "retraining",
  "document_ready",
]);
export type SessionState = z.infer<typeof SessionState>;

/** Fixed scoring dimensions (0-100 each). A score without evidence is invalid. */
export const RubricDimension = z.enum([
  "correctness_depth",
  "structure",
  "communication_clarity",
  "jd_relevance",
  "evidence",
]);
export type RubricDimension = z.infer<typeof RubricDimension>;

export const DimensionScore = z.object({
  dimension: RubricDimension,
  score: z.number().min(0).max(100),
  /** Verbatim quote from the transcript supporting this score. Required. */
  evidence: z.string().min(1),
});
export type DimensionScore = z.infer<typeof DimensionScore>;

/** Per-answer evaluation recorded during drills and mocks. */
export const TurnEvaluation = z.object({
  dimensions: z.array(DimensionScore).min(1),
  overall: z.number().min(0).max(100),
  /** The single most actionable fix for the candidate. */
  next_fix: z.string().min(1),
});
export type TurnEvaluation = z.infer<typeof TurnEvaluation>;

/** Per-call usage row. Mirrors the usage_events table. */
export const UsageEvent = z.object({
  model: z.string().min(1),
  prompt_version: z.string().optional(),
  tokens_in: z.number().int().nonnegative(),
  cached_tokens: z.number().int().nonnegative(),
  tokens_out: z.number().int().nonnegative(),
  audio_seconds: z.number().int().nonnegative(),
  cost_usd: z.number().nonnegative(),
});
export type UsageEvent = z.infer<typeof UsageEvent>;

export * from "./profiles.js";
export * from "./diagnosis.js";
export * from "./chunker.js";
export * from "./voice.js";

/** Passing score for a mock interview. Config, tuned in Phase 5 calibration. */
export const PASS_THRESHOLD = 70;

/** Models this product may call. Contributor variants are banned for user data. */
export const SPARK_MODEL_ID = "muse-spark-1.3";
export const TRANSCRIBE_MODEL_ID = "muse-voice-transcribe-1.0";
export const META_API_BASE = "https://api.meta.ai/v1";
export const TRANSCRIBE_REALTIME_URL = "wss://api.meta.ai/v1/asr/realtime";

/** Throws when a model id would let Meta train on user content. */
export function assertStandardModel(modelId: string): void {
  if (modelId.includes("contributor")) {
    throw new Error(
      `Refusing Contributor-mode model "${modelId}": user PII must stay in Standard mode.`,
    );
  }
}
