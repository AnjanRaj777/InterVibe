import { z } from "zod";

/** Verdict for one skill after adaptive diagnosis. Evidence is required. */
export const SkillVerdict = z.object({
  skill: z.string().min(1),
  /** JD must-have or resume skill this verdict traces to. Required — no orphan verdicts. */
  source: z.string().min(1),
  verdict: z.enum(["verified", "shaky", "gap"]),
  /** Verbatim transcript excerpt supporting the verdict. Required. */
  evidence: z.string().min(1),
});
export type SkillVerdict = z.infer<typeof SkillVerdict>;

export const DiagnosticQuestion = z.object({
  question: z.string().min(1),
  /** Skill or must-have this question probes. */
  skillTag: z.string().min(1),
});
export type DiagnosticQuestion = z.infer<typeof DiagnosticQuestion>;

/** Result of the Phase 2 adaptive diagnosis (text-first, voice arrives in Phase 4). */
export const DiagnosticResult = z.object({
  verdicts: z.array(SkillVerdict).default([]),
  questionsAsked: z.array(DiagnosticQuestion).min(5).max(8),
  /** True when inputs were too thin to trust (e.g. no skills, no must-haves). */
  lowConfidence: z.boolean().default(false),
  /** Required when lowConfidence is true — the one question to unblock planning. */
  clarifyingQuestion: z.string().optional(),
}).refine(
  (v) => !v.lowConfidence || (v.clarifyingQuestion?.trim() ?? "") !== "",
  { message: "low-confidence results must ask a clarifying question", path: ["clarifyingQuestion"] },
);
export type DiagnosticResult = z.infer<typeof DiagnosticResult>;

export const PlanModuleKind = z.enum([
  "knowledge_drill",
  "jd_deep_dive",
  "resume_story",
  "comms",
]);
export type PlanModuleKind = z.infer<typeof PlanModuleKind>;

/** One ordered prep module. Source must name its diagnostic/JD origin. */
export const PlanModule = z.object({
  kind: PlanModuleKind,
  title: z.string().min(1),
  goal: z.string().min(1),
  /** Exact origin: e.g. "JD must-have 'X'" or "diagnostic answer on 'Y'". */
  source: z.string().min(1),
  estimatedQuestions: z.number().int().positive(),
  passBar: z.string().min(1),
});
export type PlanModule = z.infer<typeof PlanModule>;

/** Ordered prep plan. Module order: biggest JD-weighted gaps first. */
export const PrepPlan = z.object({
  modules: z.array(PlanModule).min(1),
  commsIncluded: z.boolean().default(false),
  lowConfidence: z.boolean().default(false),
  clarifyingQuestion: z.string().optional(),
}).refine(
  (v) => !v.lowConfidence || (v.clarifyingQuestion?.trim() ?? "") !== "",
  { message: "low-confidence plans must ask a clarifying question", path: ["clarifyingQuestion"] },
);
export type PrepPlan = z.infer<typeof PrepPlan>;

export const DIAGNOSTIC_RESULT_JSON_SCHEMA = {
  name: "DiagnosticResult",
  schema: {
    type: "object",
    properties: {
      verdicts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            skill: { type: "string" },
            source: { type: "string" },
            verdict: { type: "string", enum: ["verified", "shaky", "gap"] },
            evidence: { type: "string" },
          },
          required: ["skill", "source", "verdict", "evidence"],
          additionalProperties: false,
        },
      },
      questionsAsked: {
        type: "array",
        minItems: 5,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            skillTag: { type: "string" },
          },
          required: ["question", "skillTag"],
          additionalProperties: false,
        },
      },
      lowConfidence: { type: "boolean" },
      clarifyingQuestion: { type: "string" },
    },
    required: ["verdicts", "questionsAsked", "lowConfidence"],
    additionalProperties: false,
  },
} as const;

export const PREP_PLAN_JSON_SCHEMA = {
  name: "PrepPlan",
  schema: {
    type: "object",
    properties: {
      modules: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            kind: {
              type: "string",
              enum: ["knowledge_drill", "jd_deep_dive", "resume_story", "comms"],
            },
            title: { type: "string" },
            goal: { type: "string" },
            source: { type: "string" },
            estimatedQuestions: { type: "integer", minimum: 1 },
            passBar: { type: "string" },
          },
          required: ["kind", "title", "goal", "source", "estimatedQuestions", "passBar"],
          additionalProperties: false,
        },
      },
      commsIncluded: { type: "boolean" },
      lowConfidence: { type: "boolean" },
      clarifyingQuestion: { type: "string" },
    },
    required: ["modules", "commsIncluded", "lowConfidence"],
    additionalProperties: false,
  },
} as const;
