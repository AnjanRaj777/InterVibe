import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import {
  CandidateProfile,
  JDProfile,
  SessionState,
} from "@intervibe/contracts";
import type { AuthStore } from "../auth/store.js";
import { SESSION_COOKIE } from "../auth/routes.js";
import type { SessionStore } from "./store.js";
import type { Storage } from "../storage/index.js";
import { storageKey } from "../storage/index.js";
import { ALLOWED_CONTENT_TYPES, extractText, ExtractionError } from "../ingest/extract.js";
import { parseJD, parseResume, ParseError, type ChatFn } from "../ingest/parse.js";
import { autoDiagnose, buildDiagnostic, buildPlan, buildQuestions, synthesizeJD } from "../diagnose/diagnose.js";
import {
  assembleContext,
  buildSummary,
  followUpFor,
  moduleStatus,
  promptVersionFor,
  scoreAnswer,
  shouldCompact,
  startModule,
  type DrillState,
} from "../drill/drill.js";
import {
  buildInterviewerSystemPrompt,
  CHARACTER_PERSONAS,
  type InterviewerPromptContext,
} from "../drill/prompts.js";
import type { PrepPlan } from "@intervibe/contracts";

export interface SessionEnv {
  authStore: AuthStore;
  sessions: SessionStore;
  storage: Storage;
  /** Max accepted upload size in bytes. */
  maxUploadBytes: number;
  chat: ChatFn;
  transcribe?: (audioBytes: Uint8Array, contentType?: string) => Promise<{ transcript: string; model: string }>;
}

const TERMINAL: SessionState[] = ["scored", "document_ready"];

const EXT_TO_TYPE: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

/** Content type from the file's extension. Null when not allowed. */
function contentTypeFor(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_TYPE[ext] ?? null;
}

async function requireUser(env: SessionEnv, c: Parameters<Parameters<Hono["use"]>[1]>[0] & { json: (b: unknown, s?: number) => unknown }) {
  const cookie = getCookie(c, SESSION_COOKIE);
  if (!cookie) return null;
  return env.authStore.findUserByCookie(cookie);
}

export function buildSessionApp(env: SessionEnv): Hono {
  const app = new Hono();

  /** Current open session for the signed-in user (creates one in setup). */
  app.get("/current", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.currentSession(user.id);
    const documents = await env.sessions.listDocuments(session.id);
    const bundle = await env.sessions.loadBundle(session.id);
    return c.json({
      session: {
        id: session.id,
        state: session.state,
        company: (bundle?.["company"] as string) ?? null,
        role: (bundle?.["role"] as string) ?? null,
        voice: (bundle?.["voice"] as string) ?? null,
      },
      documents: documents.map((d) => ({
        id: d.id,
        kind: d.kind,
        parsed: d.parsedJson !== null,
        profile: d.parsedJson,
      })),
    });
  });

  /**
   * Upload + parse in one call. The browser POSTs multipart form data
   * (kind + file, or kind + text for pasted JDs); the API stores the bytes,
   * extracts text, parses with the model, and returns the profile.
   * Browsers never touch object storage directly, so no storage CORS is needed.
   */
  app.post("/:id/documents", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);
    if (session.state !== "setup") {
      return c.json({ error: "This session already moved past setup." }, 409);
    }
    let form: Record<string, string | File>;
    try {
      form = (await c.req.parseBody()) as Record<string, string | File>;
    } catch {
      return c.json({ error: "Send the file as multipart form data." }, 400);
    }
    const kind = form["kind"];
    if (kind !== "resume" && kind !== "jd") {
      return c.json({ error: "kind must be resume or jd." }, 400);
    }
    let bytes: Uint8Array;
    let contentType: string;
    const file = form["file"];
    if (file instanceof File) {
      contentType = contentTypeFor(file) ?? "";
      if (!(ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
        return c.json({ error: "Use a PDF, DOCX, or TXT file." }, 400);
      }
      const buf = new Uint8Array(await file.arrayBuffer());
      if (buf.length === 0) return c.json({ error: "That file is empty." }, 400);
      if (buf.length > env.maxUploadBytes) {
        return c.json({ error: "Files must be under 10 MB." }, 400);
      }
      bytes = buf;
    } else if (typeof form["text"] === "string" && form["text"].trim()) {
      contentType = "text/plain";
      bytes = new TextEncoder().encode(form["text"]);
    } else {
      return c.json({ error: "Attach a file or paste text." }, 400);
    }

    const doc = await env.sessions.addDocument({
      userId: user.id,
      sessionId: session.id,
      kind,
      storageKey: "derived",
      contentType,
    });
    // Key derives from server-minted ids only — the filename is never trusted.
    const key = storageKey(session.id, doc.id, contentType);
    try {
      await env.storage.putBytes(key, bytes, contentType);
    } catch (err) {
      console.error(`[api] storage putBytes failed for bucket key ${key}:`);
      console.error(err instanceof Error ? (err.stack ?? err.message) : err);
      return c.json({ error: "Could not store the file. Try again." }, 502);
    }
    let extracted;
    try {
      extracted = await extractText(bytes, contentType);
    } catch (err) {
      if (err instanceof ExtractionError) return c.json({ error: err.message }, 422);
      throw err;
    }
    try {
      const parsed =
        kind === "resume"
          ? await parseResume(extracted.text, env.chat)
          : await parseJD(extracted.text, env.chat);
      await env.sessions.saveParsed(doc.id, parsed);
      return c.json({ documentId: doc.id, profile: parsed, truncated: extracted.truncated });
    } catch (err) {
      if (err instanceof ParseError) return c.json({ error: err.message }, 502);
      throw err;
    }
  });

  /** Edit-as-text correction of a parsed profile. Re-validated against the schema. */
  app.patch("/:id/documents/:docId", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const doc = await env.sessions.getDocument(c.req.param("docId"));
    if (!doc || doc.sessionId !== c.req.param("id")) return c.json({ error: "Not found." }, 404);
    const session = await env.sessions.getSession(doc.sessionId);
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);
    const body = (await c.req.json().catch(() => ({}))) as { parsed?: unknown };
    const result =
      doc.kind === "resume" ? CandidateProfile.safeParse(body.parsed) : JDProfile.safeParse(body.parsed);
    if (!result.success) return c.json({ error: "That edit is not a valid profile." }, 400);
    await env.sessions.saveParsed(doc.id, result.data);
    return c.json({ profile: result.data });
  });

  /** Confirm both profiles: setup -> parsed. */
  app.post("/:id/confirm", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);
    if (session.state !== "setup") return c.json({ error: "Session already confirmed." }, 409);
    const docs = await env.sessions.listDocuments(session.id);
    const resume = docs.find((d) => d.kind === "resume" && d.parsedJson !== null);
    const jd = docs.find((d) => d.kind === "jd" && d.parsedJson !== null);
    if (!resume || !jd) {
      return c.json({ error: "Upload and parse both a resume and a job description first." }, 409);
    }
    await env.sessions.setState(session.id, "parsed");
    return c.json({ session: { id: session.id, state: "parsed" } });
  });

  /** Build 5–8 diagnostic questions from stored profiles: parsed -> diagnosing. */
  app.post("/:id/diagnose", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);
    if (session.state !== "parsed") return c.json({ error: "Confirm setup first." }, 409);
    const docs = await env.sessions.listDocuments(session.id);
    const resumeDoc = docs.find((d) => d.kind === "resume" && d.parsedJson !== null);
    const jdDoc = docs.find((d) => d.kind === "jd" && d.parsedJson !== null);
    if (!resumeDoc || !jdDoc) return c.json({ error: "Both profiles are required." }, 409);
    const resume = CandidateProfile.parse(resumeDoc.parsedJson);
    const jd = JDProfile.parse(jdDoc.parsedJson);
    const built = buildQuestions(resume, jd);
    await env.sessions.saveBundle(session.id, { questions: built.questions });
    await env.sessions.setState(session.id, "diagnosing");
    return c.json(built);
  });

  /** Score answers and build the ordered prep plan: diagnosing -> plan_ready. */
  app.post("/:id/plan", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);
    if (session.state !== "diagnosing") return c.json({ error: "Run diagnosis first." }, 409);
    const body = (await c.req.json().catch(() => ({}))) as {
      answers?: { question?: string; skillTag?: string; answer?: string }[];
      commsWanted?: boolean;
    };
    if (!Array.isArray(body.answers) || body.answers.length === 0) {
      return c.json({ error: "Answer the diagnostic questions first." }, 400);
    }
    const docs = await env.sessions.listDocuments(session.id);
    const resumeDoc = docs.find((d) => d.kind === "resume" && d.parsedJson !== null);
    const jdDoc = docs.find((d) => d.kind === "jd" && d.parsedJson !== null);
    if (!resumeDoc || !jdDoc) return c.json({ error: "Both profiles are required." }, 409);
    const bundle = await env.sessions.loadBundle(session.id);
    const questions = (bundle?.["questions"] as { question: string; skillTag: string }[] | undefined) ?? [];
    if (questions.length === 0) return c.json({ error: "Run diagnosis first." }, 409);
    const resume = CandidateProfile.parse(resumeDoc.parsedJson);
    const jd = JDProfile.parse(jdDoc.parsedJson);
    const answers = body.answers.map((a) => ({
      question: String(a.question ?? ""),
      skillTag: String(a.skillTag ?? ""),
      answer: String(a.answer ?? ""),
    }));
    const diagnostic = buildDiagnostic(questions, answers, resume, jd);
    const plan = buildPlan(resume, jd, diagnostic.verdicts, body.commsWanted === true);
    await env.sessions.saveBundle(session.id, { questions, answers, diagnostic, plan });
    await env.sessions.setState(session.id, "plan_ready");
    return c.json({ diagnostic, plan });
  });

  /** Automated diagnosis and prep plan: setup/parsed/diagnosing -> plan_ready. JD is optional. */
  app.post("/:id/auto-diagnose", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);

    const body = (await c.req.json().catch(() => ({}))) as {
      commsWanted?: boolean;
      role?: string;
      company?: string;
      seniority?: string;
      voice?: string;
      focusArea?: string;
    };

    const docs = await env.sessions.listDocuments(session.id);
    let resumeDoc = docs.find((d) => d.kind === "resume" && d.parsedJson !== null);
    if (!resumeDoc) {
      // Default candidate profile if no resume uploaded
      const defaultCandidate = CandidateProfile.parse({
        name: user.email.split("@")[0] || "Candidate",
        skills: ["Software Engineering", "System Design", "Problem Solving"],
        experience: [],
        education: [],
        metrics: [],
        notes: [],
      });
      const doc = await env.sessions.addDocument({
        userId: user.id,
        sessionId: session.id,
        kind: "resume",
        storageKey: `synthetic-resume-${session.id}`,
        contentType: "application/json",
      });
      await env.sessions.saveParsed(doc.id, defaultCandidate);
      resumeDoc = { ...doc, parsedJson: defaultCandidate };
    }

    let jdDoc = docs.find((d) => d.kind === "jd" && d.parsedJson !== null);
    let jd: JDProfile;

    if (jdDoc) {
      jd = JDProfile.parse(jdDoc.parsedJson);
      if (body.role?.trim()) jd.title = body.role.trim();
      if (body.company?.trim()) jd.company = body.company.trim();
      if (body.seniority?.trim()) jd.seniority = body.seniority.trim();
    } else {
      // JD is optional — synthesize JD from selected role, company, seniority, and focusArea!
      jd = synthesizeJD(body.role, body.company, body.seniority, body.focusArea);
      const doc = await env.sessions.addDocument({
        userId: user.id,
        sessionId: session.id,
        kind: "jd",
        storageKey: `synthetic-jd-${session.id}`,
        contentType: "application/json",
      });
      await env.sessions.saveParsed(doc.id, jd);
    }

    const resume = CandidateProfile.parse(resumeDoc.parsedJson);
    const commsWanted = body.commsWanted !== false; // Default true: starts with introduction!

    const { diagnostic, plan } = autoDiagnose(resume, jd, commsWanted);
    await env.sessions.saveBundle(session.id, {
      questions: diagnostic.questionsAsked,
      diagnostic,
      plan,
      voice: body.voice || "af_bella",
      company: jd.company,
      role: jd.title,
    });

    await env.sessions.setState(session.id, "plan_ready");
    return c.json({ diagnostic, plan });
  });

  /** Start (or resume) a drill module: plan_ready -> drilling. */
  app.post("/:id/drill/start", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);
    if (session.state !== "plan_ready" && session.state !== "drilling") {
      return c.json({ error: "Finish diagnosis and review your plan first." }, 409);
    }
    const body = (await c.req.json().catch(() => ({}))) as { moduleIndex?: unknown };
    const moduleIndex = typeof body.moduleIndex === "number" ? body.moduleIndex : 0;
    const bundle = await env.sessions.loadBundle(session.id);
    const plan = bundle?.["plan"] as PrepPlan | undefined;
    if (!plan || moduleIndex < 0 || moduleIndex >= plan.modules.length) {
      return c.json({ error: "Unknown module. Reload your plan and try again." }, 404);
    }
    const module = plan.modules[moduleIndex];
    const drills = (bundle?.["drills"] as Record<string, DrillState> | undefined) ?? {};
    let drill = drills[String(moduleIndex)];
    if (!drill) {
      const started = startModule(module);
      drill = {
        teach: started.teach,
        questions: [started.question],
        turns: [],
        status: "active",
        completeReason: "",
        summary: null,
        promptVersion: promptVersionFor(module),
      };
      drills[String(moduleIndex)] = drill;
      await env.sessions.saveBundle(session.id, { ...bundle, drills });
    }
    if (session.state === "plan_ready") await env.sessions.setState(session.id, "drilling");
    return c.json({
      moduleIndex,
      module,
      teach: drill.teach,
      question: drill.questions[drill.turns.length] ?? drill.questions[drill.questions.length - 1],
      promptVersion: drill.promptVersion,
      status: drill.status,
      turnsAsked: drill.turns.length,
    });
  });

  /** Score one drill answer and return the next question or module completion. */
  app.post("/:id/drill/answer", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);
    if (session.state !== "drilling") return c.json({ error: "Start a drill module first." }, 409);
    const body = (await c.req.json().catch(() => ({}))) as {
      moduleIndex?: unknown;
      answer?: unknown;
      character?: unknown;
      voice?: unknown;
    };
    // Empty/aborted answers score nothing and change no state.
    if (typeof body.answer !== "string" || body.answer.trim().length === 0) {
      return c.json({ error: "Write an answer first — empty answers are not scored." }, 400);
    }
    const moduleIndex = typeof body.moduleIndex === "number" ? body.moduleIndex : 0;
    const bundle = await env.sessions.loadBundle(session.id);
    const plan = bundle?.["plan"] as PrepPlan | undefined;
    const drills = (bundle?.["drills"] as Record<string, DrillState> | undefined) ?? {};
    const drill = drills[String(moduleIndex)];
    const module = plan?.modules[moduleIndex];
    if (!plan || !module || !drill) return c.json({ error: "Start this drill module first." }, 409);
    if (drill.status === "complete") return c.json({ error: "Module already complete." }, 409);

    const question = drill.questions[drill.turns.length];
    const evaluation = scoreAnswer(module, body.answer);
    drill.turns.push({
      question,
      answer: body.answer.trim(),
      evaluation,
      promptVersion: drill.promptVersion,
    });

    // Compaction: summarize turns that fall out of the live window.
    if (shouldCompact(drill.turns, drill.summary)) {
      drill.summary = buildSummary(drill.turns, module.source);
    }
    const compactionActive = drill.summary !== null;
    const docs = await env.sessions.listDocuments(session.id);
    const profiles = JSON.stringify(docs.map((d) => d.parsedJson));
    const { contextTokens } = assembleContext({
      system: drill.promptVersion,
      profiles,
      summary: drill.summary,
      recentTurns: drill.turns.slice(-4),
    });

    const status = moduleStatus(drill.turns, module.estimatedQuestions);
    let nextQuestion: string | null = null;
    if (status.complete) {
      drill.status = "complete";
      drill.completeReason = status.reason;
    } else {
      nextQuestion = followUpFor(module, drill.turns.length);
      drill.questions.push(nextQuestion);
    }

    // Determine character persona for spoken interviewer response
    const requestedChar =
      typeof body.character === "string" && body.character.trim()
        ? body.character.trim()
        : null;
    const voiceId =
      (typeof body.voice === "string" && body.voice) ||
      (bundle?.["voice"] as string) ||
      "";

    let characterName = requestedChar ?? (bundle?.["character"] as string) ?? "Alex";
    if (!requestedChar && voiceId) {
      const vLower = voiceId.toLowerCase();
      if (vLower.includes("cori")) characterName = "Cori";
      else if (vLower.includes("alan")) characterName = "Alan";
      else if (vLower.includes("arthur") || vLower.includes("northern")) characterName = "Arthur";
      else if (vLower.includes("alba")) characterName = "Alba";
      else if (vLower.includes("amy")) characterName = "Amy";
      else if (vLower.includes("joe")) characterName = "Joe";
      else if (vLower.includes("ryan")) characterName = "Ryan";
      else if (vLower.includes("lessac")) characterName = "Lessac";
      else if (vLower.includes("bryce")) characterName = "Bryce";
      else if (vLower.includes("bella")) characterName = "Bella";
      else if (vLower.includes("emma")) characterName = "Emma";
      else if (vLower.includes("george")) characterName = "George";
      else if (vLower.includes("fable")) characterName = "Fable";
      else if (vLower.includes("sarah")) characterName = "Sarah";
      else if (vLower.includes("adam")) characterName = "Adam";
      else if (vLower.includes("michael")) characterName = "Michael";
      else if (vLower.includes("eric") || vLower.includes("danny") || vLower.includes("alex")) characterName = "Alex";
    }

    const resumeDoc = docs.find((d) => d.kind === "resume");
    const candProfile = resumeDoc?.parsedJson as Record<string, unknown> | null;
    const candidateName = (candProfile?.name as string) || "Candidate";
    const roleTitle = (bundle?.["role"] as string) || "Software Engineer";
    const seniorityLevel = (bundle?.["seniority"] as string) || "Senior";
    const interviewType =
      module.kind === "comms"
        ? "behavioral"
        : module.kind === "resume_story"
        ? "mixed"
        : "technical";

    const systemPrompt = buildInterviewerSystemPrompt({
      characterName,
      role: roleTitle,
      interviewType,
      seniority: seniorityLevel,
      questionCount: module.estimatedQuestions ?? 4,
      candidateName,
      language: "English",
    });

    let spokenResponse: string | null = null;
    if (env.chat) {
      try {
        const recentTurns = drill.turns.slice(-3);
        const convMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: systemPrompt },
        ];
        for (const t of recentTurns) {
          convMessages.push({ role: "assistant", content: t.question });
          convMessages.push({ role: "user", content: t.answer });
        }
        const isLast = status.complete;
        const currentPhase = isLast ? "WRAP_UP" : drill.turns.length > 1 ? "FOLLOW_UP" : "QUESTIONING";
        convMessages.push({
          role: "system",
          content: `CURRENT PHASE: ${currentPhase}.
Candidate answered: "${body.answer.trim()}".
Respond out loud in 2-4 short sentences adhering strictly to all CRITICAL VOICE RULES.
Do not read numbers, scores, or formatting symbols. Plain text only. Use natural contractions.
${
  isLast
    ? "Acknowledge the candidate's answer warmly and state that this section is complete."
    : `Acknowledge the candidate's answer naturally (vary acknowledgements) and ask your follow-up question: "${nextQuestion}".`
}`,
        });

        const chatRes = await env.chat({
          messages: convMessages,
          promptCacheKey: `interviewer-v2-${characterName.toLowerCase()}`,
        });
        if (chatRes && typeof chatRes.text === "string" && chatRes.text.trim()) {
          // Strictly enforce voice rules: no asterisks, hashtags, backticks, emojis, bullet points
          spokenResponse = chatRes.text
            .replace(/[*#_`]/g, "")
            .replace(/[-•]\s+/g, "")
            .replace(/\n+/g, " ")
            .trim();
        }
      } catch {
        // Fallback gracefully in tests or offline
      }
    }

    const updatedBundle: Record<string, unknown> = { ...(bundle ?? {}), drills };
    if (voiceId) {
      updatedBundle["voice"] = voiceId;
      updatedBundle["character"] = characterName;
    }
    await env.sessions.saveBundle(session.id, updatedBundle);
    return c.json({
      evaluation,
      nextQuestion,
      spokenResponse,
      character: characterName,
      moduleComplete: status.complete,
      completeReason: status.reason,
      promptVersion: drill.promptVersion,
      compaction: { active: compactionActive, contextTokens },
      turnsAsked: drill.turns.length,
    });
  });

  /** Reload-safe drill state: current module progress plus the pending question. */
  app.get("/:id/drill", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);
    const moduleIndex = Number(c.req.query("module") ?? "0");
    const bundle = await env.sessions.loadBundle(session.id);
    const plan = bundle?.["plan"] as PrepPlan | undefined;
    const drills = (bundle?.["drills"] as Record<string, DrillState> | undefined) ?? {};
    const drill = drills[String(moduleIndex)];
    if (!plan?.modules[moduleIndex] || !drill) return c.json({ error: "No drill yet." }, 404);
    return c.json({
      moduleIndex,
      module: plan.modules[moduleIndex],
      drill: {
        teach: drill.teach,
        turns: drill.turns,
        status: drill.status,
        completeReason: drill.completeReason,
        summary: drill.summary,
        promptVersion: drill.promptVersion,
      },
      nextQuestion: drill.status === "active" ? drill.questions[drill.turns.length] : null,
    });
  });

  /** Reload-safe read of the saved diagnostic + plan. */
  app.get("/:id/plan", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);
    const bundle = await env.sessions.loadBundle(session.id);
    if (!bundle?.["plan"]) return c.json({ diagnostic: null, plan: null });
    return c.json({ diagnostic: bundle["diagnostic"] ?? null, plan: bundle["plan"] });
  });

  /** Transcribes user speech using Muse Voice Transcribe (muse-voice-transcribe-1.0) without requiring a specific session ID. */
  app.post("/transcribe", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);

    let form: Record<string, string | File>;
    try {
      form = (await c.req.parseBody()) as Record<string, string | File>;
    } catch {
      return c.json({ error: "Send audio as multipart form data." }, 400);
    }

    const file = form["audio"] ?? form["file"];
    if (!(file instanceof File)) {
      return c.json({ error: "audio file is required." }, 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (env.transcribe) {
      const res = await env.transcribe(bytes, file.type);
      return c.json(res);
    }

    return c.json({ transcript: "", model: "muse-voice-transcribe-1.0" });
  });

  /** Transcribes user speech using Muse Voice Transcribe (muse-voice-transcribe-1.0). */
  app.post("/:id/transcribe", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);

    let form: Record<string, string | File>;
    try {
      form = (await c.req.parseBody()) as Record<string, string | File>;
    } catch {
      return c.json({ error: "Send audio as multipart form data." }, 400);
    }

    const file = form["audio"] ?? form["file"];
    if (!(file instanceof File)) {
      return c.json({ error: "audio file is required." }, 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (env.transcribe) {
      const res = await env.transcribe(bytes, file.type);
      return c.json(res);
    }

    return c.json({ transcript: "", model: "muse-voice-transcribe-1.0" });
  });

  /** Returns all available interviewer character personas and their voice profiles. */
  app.get("/interviewer/characters", async (c) => {
    return c.json({
      characters: Object.values(CHARACTER_PERSONAS),
    });
  });

  /** Returns formatted system prompt for any character and session. */
  app.get("/:id/interviewer/prompt", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);
    const bundle = await env.sessions.loadBundle(session.id);
    const docs = await env.sessions.listDocuments(session.id);
    const resumeDoc = docs.find((d) => d.kind === "resume");
    const candProfile = resumeDoc?.parsedJson as Record<string, unknown> | null;

    const charQuery = c.req.query("character") || "Alex";
    const role = c.req.query("role") || (bundle?.["role"] as string) || "Software Engineer";
    const seniority = c.req.query("seniority") || (bundle?.["seniority"] as string) || "Senior";
    const interviewType = (c.req.query("type") as "behavioral" | "technical" | "system_design" | "mixed") || "technical";
    const candidateName = (candProfile?.name as string) || "Candidate";

    const prompt = buildInterviewerSystemPrompt({
      characterName: charQuery,
      role,
      interviewType,
      seniority,
      questionCount: 4,
      candidateName,
      language: "English",
    });

    return c.json({
      character: charQuery,
      prompt,
      characters: Object.keys(CHARACTER_PERSONAS),
    });
  });

  /** Direct conversational endpoint: generates a spoken response from the active character. */
  app.post("/:id/interviewer/respond", async (c) => {
    const user = await requireUser(env, c as never);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    const session = await env.sessions.getSession(c.req.param("id"));
    if (!session || session.userId !== user.id) return c.json({ error: "Not found." }, 404);

    const body = (await c.req.json().catch(() => ({}))) as {
      character?: string;
      answer?: string;
      question?: string;
      phase?: "GREETING" | "QUESTIONING" | "FOLLOW_UP" | "WRAP_UP" | "FEEDBACK";
    };

    const bundle = await env.sessions.loadBundle(session.id);
    const docs = await env.sessions.listDocuments(session.id);
    const resumeDoc = docs.find((d) => d.kind === "resume");
    const candProfile = resumeDoc?.parsedJson as Record<string, unknown> | null;

    const characterName = body.character || (bundle?.["character"] as string) || "Alex";
    const role = (bundle?.["role"] as string) || "Software Engineer";
    const seniority = (bundle?.["seniority"] as string) || "Senior";
    const candidateName = (candProfile?.name as string) || "Candidate";
    const phase = body.phase || "FOLLOW_UP";

    const systemPrompt = buildInterviewerSystemPrompt({
      characterName,
      role,
      interviewType: "technical",
      seniority,
      questionCount: 4,
      candidateName,
      language: "English",
      phase,
    });

    let spokenResponse = `Thank you for sharing that. Let's move on to our next technical area.`;
    if (env.chat) {
      try {
        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: systemPrompt },
        ];
        if (body.question) {
          messages.push({ role: "assistant", content: body.question });
        }
        if (body.answer) {
          messages.push({ role: "user", content: body.answer });
        }
        messages.push({
          role: "system",
          content: `CURRENT PHASE: ${phase}. Respond out loud in 2-4 short sentences adhering strictly to all CRITICAL VOICE RULES. Do not read numbers, scores, or markdown symbols. Use natural spoken contractions.`,
        });

        const chatRes = await env.chat({
          messages,
          promptCacheKey: `interviewer-v2-${characterName.toLowerCase()}`,
        });
        if (chatRes && typeof chatRes.text === "string" && chatRes.text.trim()) {
          spokenResponse = chatRes.text
            .replace(/[*#_`]/g, "")
            .replace(/[-•]\s+/g, "")
            .replace(/\n+/g, " ")
            .trim();
        }
      } catch {
        // Fallback gracefully
      }
    }

    return c.json({
      character: characterName,
      phase,
      spokenResponse,
    });
  });

  return app;
}
