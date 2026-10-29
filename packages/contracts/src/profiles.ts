import { z } from "zod";

/** Parsed resume. Loose on purpose: any JD, any role, any format. */
export const CandidateProfile = z.object({
  name: z.string().min(1),
  skills: z.array(z.string()).default([]),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string().optional().default(""),
      duration: z.string().optional().default(""),
      bullets: z.array(z.string()).default([]),
    }),
  ).default([]),
  education: z.array(z.string()).default([]),
  /** Measurable claims mined from the resume ("cut latency 40%"). */
  metrics: z.array(z.string()).default([]),
  /** Gaps the model noticed relative to nothing yet — filled by the planner in Phase 2. */
  notes: z.array(z.string()).default([]),
});
export type CandidateProfile = z.infer<typeof CandidateProfile>;

/** Parsed job description. */
export const JDProfile = z.object({
  title: z.string().min(1),
  company: z.string().optional().default(""),
  seniority: z.string().optional().default(""),
  must_haves: z.array(z.string()).default([]),
  nice_to_haves: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  /** Proper nouns, tools, acronyms — doubles as STT keyword biasing in Phase 4. */
  keywords: z.array(z.string()).default([]),
});
export type JDProfile = z.infer<typeof JDProfile>;

/**
 * JSON Schema consts for Muse Spark structured outputs.
 * Kept in sync with the zod schemas by the contract tests below.
 */
export const CANDIDATE_PROFILE_JSON_SCHEMA = {
  name: "CandidateProfile",
  schema: {
    type: "object",
    properties: {
      name: { type: "string" },
      skills: { type: "array", items: { type: "string" } },
      experience: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            company: { type: "string" },
            duration: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
          },
          required: ["title", "company", "duration", "bullets"],
          additionalProperties: false,
        },
      },
      education: { type: "array", items: { type: "string" } },
      metrics: { type: "array", items: { type: "string" } },
      notes: { type: "array", items: { type: "string" } },
    },
    required: ["name", "skills", "experience", "education", "metrics", "notes"],
    additionalProperties: false,
  },
} as const;

export const JD_PROFILE_JSON_SCHEMA = {
  name: "JDProfile",
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      company: { type: "string" },
      seniority: { type: "string" },
      must_haves: { type: "array", items: { type: "string" } },
      nice_to_haves: { type: "array", items: { type: "string" } },
      responsibilities: { type: "array", items: { type: "string" } },
      keywords: { type: "array", items: { type: "string" } },
    },
    required: [
      "title",
      "company",
      "seniority",
      "must_haves",
      "nice_to_haves",
      "responsibilities",
      "keywords",
    ],
    additionalProperties: false,
  },
} as const;
