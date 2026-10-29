/** Typed client for the API (same origin, cookie auth, via Next rewrites). */

export interface SessionSummary {
  session: {
    id: string;
    state: string;
    company?: string | null;
    role?: string | null;
    voice?: string | null;
  };
  documents: { id: string; kind: "resume" | "jd"; parsed: boolean; profile?: Record<string, unknown> | null }[];
}

export interface ParsedProfile {
  profile: Record<string, unknown>;
  truncated?: boolean;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Not signed in.");
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status}).`);
  return body as T;
}

export interface AutoDiagnoseOptions {
  commsWanted?: boolean;
  role?: string;
  company?: string;
  seniority?: string;
  voice?: string;
  focusArea?: string;
}

export const api = {
  currentSession: () => req<SessionSummary>("/api/sessions/current"),
  /** Uploads a file (or pasted text for JDs) and returns the parsed profile. */
  uploadDocument: (sessionId: string, kind: "resume" | "jd", file: File | string) => {
    const form = new FormData();
    form.append("kind", kind);
    if (typeof file === "string") form.append("text", file);
    else form.append("file", file, file.name);
    return req<{ documentId: string } & ParsedProfile>(
      `/api/sessions/${sessionId}/documents`,
      { method: "POST", body: form },
    );
  },
  saveProfile: (sessionId: string, documentId: string, parsed: unknown) =>
    req<ParsedProfile>(`/api/sessions/${sessionId}/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parsed }),
    }),
  confirm: (sessionId: string) =>
    req<{ session: { id: string; state: string } }>(`/api/sessions/${sessionId}/confirm`, {
      method: "POST",
    }),
  diagnose: (sessionId: string) =>
    req<{
      questions: { question: string; skillTag: string }[];
      lowConfidence: boolean;
      clarifyingQuestion?: string;
    }>(`/api/sessions/${sessionId}/diagnose`, { method: "POST" }),
  submitPlan: (
    sessionId: string,
    answers: { question: string; skillTag: string; answer: string }[],
    commsWanted: boolean,
  ) =>
    req<{ diagnostic: unknown; plan: Plan }>(`/api/sessions/${sessionId}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, commsWanted }),
    }),
  autoDiagnose: (sessionId: string, options: boolean | AutoDiagnoseOptions = true) => {
    const body = typeof options === "boolean" ? { commsWanted: options } : options;
    return req<{ diagnostic: unknown; plan: Plan }>(`/api/sessions/${sessionId}/auto-diagnose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  getPlan: (sessionId: string) =>
    req<{ diagnostic: unknown; plan: Plan }>(`/api/sessions/${sessionId}/plan`),
  startDrill: (sessionId: string, moduleIndex: number) =>
    req<DrillStart>(`/api/sessions/${sessionId}/drill/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex }),
    }),
  answerDrill: (
    sessionId: string,
    moduleIndex: number,
    answer: string,
    options?: { character?: string; voice?: string },
  ) =>
    req<DrillAnswer>(`/api/sessions/${sessionId}/drill/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleIndex,
        answer,
        character: options?.character,
        voice: options?.voice,
      }),
    }),
  getDrill: (sessionId: string, moduleIndex: number) =>
    req<DrillSnapshot>(`/api/sessions/${sessionId}/drill?module=${moduleIndex}`),
  /** Fetches system prompt for an interviewer character */
  getInterviewerPrompt: (sessionId: string, character: string = "Alex") =>
    req<{ character: string; prompt: string; characters: string[] }>(
      `/api/sessions/${sessionId}/interviewer/prompt?character=${encodeURIComponent(character)}`,
    ),
  /** Fetches list of all interviewer character personas */
  getInterviewerCharacters: () =>
    req<{ characters: { name: string; title: string; description: string; style: string }[] }>(
      `/api/sessions/interviewer/characters`,
    ),
  /** Transcribes speech recording via Meta Muse Voice Transcribe (muse-voice-transcribe-1.0) as default STT */
  transcribe: (firstArg: string | Blob, secondArg?: Blob | string) => {
    let audioBlob: Blob;
    let sessionId: string | undefined;

    if (firstArg instanceof Blob) {
      audioBlob = firstArg;
      sessionId = typeof secondArg === "string" ? secondArg : undefined;
    } else {
      sessionId = firstArg;
      audioBlob = secondArg as Blob;
    }

    const form = new FormData();
    form.append("audio", audioBlob, "speech.webm");
    const path = sessionId ? `/api/sessions/${sessionId}/transcribe` : `/api/sessions/transcribe`;
    return req<{ transcript: string; model: string }>(path, {
      method: "POST",
      body: form,
    });
  },
  /** Synthesizes speech using backend TTS (e.g. Groq Canopy Labs Orpheus V1) */
  synthesizeSpeech: async (params: { text: string; voice?: string; model?: string }): Promise<Blob> => {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || `TTS synthesis failed (${res.status})`);
    }
    return res.blob();
  },
};

export interface PlanModule {
  kind: string;
  title: string;
  goal: string;
  source: string;
  estimatedQuestions: number;
  passBar: string;
}

export interface Plan {
  modules: PlanModule[];
  commsIncluded: boolean;
  lowConfidence?: boolean;
}

export interface DrillDimension {
  dimension: string;
  score: number;
  evidence: string;
}

export interface DrillEvaluation {
  dimensions: DrillDimension[];
  overall: number;
  next_fix: string;
}

export interface DrillStart {
  moduleIndex: number;
  module: PlanModule;
  teach: string;
  question: string;
  promptVersion: string;
  status: "active" | "complete";
  turnsAsked: number;
}

export interface DrillAnswer {
  evaluation: DrillEvaluation;
  nextQuestion: string | null;
  spokenResponse?: string | null;
  character?: string;
  moduleComplete: boolean;
  completeReason: string;
  promptVersion: string;
  compaction: { active: boolean; contextTokens: number };
  turnsAsked: number;
}

export interface DrillTurn {
  question: string;
  answer: string;
  evaluation: DrillEvaluation;
  promptVersion: string;
}

export interface DrillSnapshot {
  moduleIndex: number;
  module: PlanModule;
  drill: {
    teach: string;
    turns: DrillTurn[];
    status: "active" | "complete";
    completeReason: string;
    summary: unknown;
    promptVersion: string;
  };
  nextQuestion: string | null;
}

const EXT_TO_TYPE: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

/** Map a File to an allowed content type, or null with a message when rejected. */
export function classifyFile(file: File): { contentType: string } | { error: string } {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const contentType = EXT_TO_TYPE[ext];
  if (!contentType) return { error: "Use a PDF, DOCX, or TXT file." };
  if (file.size === 0) return { error: "That file is empty." };
  if (file.size > 10 * 1024 * 1024) return { error: "Files must be under 10 MB." };
  return { contentType };
}
