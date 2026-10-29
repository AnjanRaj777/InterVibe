import {
  CANDIDATE_PROFILE_JSON_SCHEMA,
  CandidateProfile,
  JD_PROFILE_JSON_SCHEMA,
  JDProfile,
} from "@intervibe/contracts";
import { sparkChat, type ChatMessage } from "../meta/client.js";

export type ChatFn = (args: {
  messages: ChatMessage[];
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  promptCacheKey?: string;
}) => Promise<{ text: string }>;

const defaultChat: ChatFn = ({ messages, jsonSchema }) =>
  sparkChat({
    apiKey: mustGetKey(),
    messages,
    jsonSchema,
    promptCacheKey: "intervibe-ingest-v1",
  });

function mustGetKey(): string {
  const key = process.env.MODEL_API_KEY;
  if (!key) throw new Error("MODEL_API_KEY is not set.");
  return key;
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

async function parseWith<T>(
  schemaName: string,
  jsonSchema: { name: string; schema: Record<string, unknown> },
  zodSchema: { safeParse: (v: unknown) => { success: boolean; data?: T } },
  system: string,
  text: string,
  chat: ChatFn,
): Promise<T> {
  let raw: string;
  try {
    ({ text: raw } = await chat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: text },
      ],
      jsonSchema,
    }));
  } catch (err) {
    console.error(`[api] model chat failed during ${schemaName} parse:`);
    console.error(err instanceof Error ? (err.stack ?? err.message) : err);
    throw new ParseError(`The AI service failed while reading this file. Try again. (${schemaName})`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ParseError("The AI returned an unreadable result. Try again.");
  }
  const result = zodSchema.safeParse(parsed);
  if (!result.success || result.data === undefined) {
    throw new ParseError("The AI returned an incomplete result. Try again.");
  }
  return result.data;
}

const RESUME_SYSTEM = `Extract the candidate's profile from this resume text into the CandidateProfile schema. Copy facts only — never invent skills, employers, or metrics that are not in the text. Put anything uncertain in notes, not in skills.`;
const JD_SYSTEM = `Extract the job description into the JDProfile schema. must_haves are hard requirements (years, tools, certifications). Put proper nouns, tools, and acronyms in keywords — they feed speech recognition later. Never invent requirements that are not in the text.`;

/** Resume text -> CandidateProfile. chat is injectable for tests. */
export function parseResume(text: string, chat: ChatFn = defaultChat): Promise<CandidateProfile> {
  return parseWith(
    "resume",
    CANDIDATE_PROFILE_JSON_SCHEMA as unknown as { name: string; schema: Record<string, unknown> },
    CandidateProfile,
    RESUME_SYSTEM,
    text,
    chat,
  );
}

/** JD text -> JDProfile. chat is injectable for tests. */
export function parseJD(text: string, chat: ChatFn = defaultChat): Promise<JDProfile> {
  return parseWith(
    "jd",
    JD_PROFILE_JSON_SCHEMA as unknown as { name: string; schema: Record<string, unknown> },
    JDProfile,
    JD_SYSTEM,
    text,
    chat,
  );
}
