import { describe, expect, it } from "vitest";
import { TurnEvaluation } from "@intervibe/contracts";
import { buildAuthApp } from "../src/auth/routes.js";
import { createMemoryStore } from "../src/auth/store.js";
import { buildSessionApp } from "../src/sessions/routes.js";
import { createMemorySessionStore } from "../src/sessions/store.js";
import { createMemoryStorage } from "../src/storage/index.js";
import {
  assembleContext,
  buildSummary,
  CONTEXT_TOKEN_BUDGET,
  COMPACTION_TURN_THRESHOLD,
  scoreAnswer,
  shouldCompact,
  type DrillTurn,
} from "../src/drill/drill.js";
import {
  buildInterviewerSystemPrompt,
  getCharacterPrompt,
  CHARACTER_PERSONAS,
  CHARACTER_PROMPTS,
} from "../src/drill/prompts.js";
import type { PlanModule } from "@intervibe/contracts";

const RESUME_JSON = JSON.stringify({
  name: "Priya Nair",
  skills: ["Java", "Postgres"],
  experience: [],
  education: [],
  metrics: ["40k rps"],
  notes: [],
});
const JD_JSON = JSON.stringify({
  title: "Senior Backend Engineer",
  company: "",
  seniority: "Senior",
  must_haves: ["Java", "Postgres"],
  nice_to_haves: [],
  responsibilities: [],
  keywords: ["ledger"],
});

const MODULE: PlanModule = {
  kind: "knowledge_drill",
  title: "Close the gap: Java",
  goal: "Answer Java questions with trade-offs, metrics, and failure modes.",
  source: "JD must-have 'Java'",
  estimatedQuestions: 6,
  passBar: "Score 75+ with transcript evidence on the next drill.",
};

const WEAK = "idk";
const AVERAGE =
  "I used Java for a year on a backend service with the team, handling requests and fixing bugs.";
const STRONG =
  "I used Java for two years to ship a ledger service at 40k rps. I chose virtual threads over a reactive stack because backpressure was simpler to validate with load tests; p99 fell from 220ms to 60ms. Situation was on-call pages for GC pauses, task was to cut tail latency, action was moving to G1 with a 32GB heap, result was zero pause-related pages for six months. At 10x scale the Postgres ledger table would break first, so I partitioned by month.";

async function setup() {
  const authStore = createMemoryStore();
  const sessions = createMemorySessionStore();
  const storage = createMemoryStorage();
  const authApp = buildAuthApp({
    store: authStore,
    appUrl: "http://web.test",
    isProd: false,
    sendLink: () => {},
  });
  const sessionApp = buildSessionApp({
    authStore,
    sessions,
    storage,
    maxUploadBytes: 10 * 1024 * 1024,
    chat: async ({ jsonSchema }) => ({
      text: jsonSchema?.name === "CandidateProfile" ? RESUME_JSON : JD_JSON,
    }),
  });
  const user = await authStore.createUser("drill@example.com");
  const { sha256Hex } = await import("../src/auth/store.js");
  const raw = `token-${Math.random()}`;
  await authStore.saveMagicToken({
    tokenHash: sha256Hex(raw),
    userId: user.id,
    expiresAt: new Date(Date.now() + 60_000),
  });
  const cb = await authApp.request(`/callback?token=${raw}`);
  const cookie = cb.headers.get("set-cookie")!.split(";")[0];
  const authed = async (path: string, init?: RequestInit) =>
    sessionApp.request(path, {
      ...init,
      headers: { ...(init?.headers ?? {}), Cookie: cookie },
    });
  const cur = (await (await authed("/current")).json()) as {
    session: { id: string; state: string };
  };
  return { authed, sessionId: cur.session.id };
}

function docForm(kind: "resume" | "jd", file: File | string): FormData {
  const form = new FormData();
  form.append("kind", kind);
  if (typeof file === "string") form.append("text", file);
  else form.append("file", file, file.name);
  return form;
}

/** Full flow to a plan_ready session with comms included. */
async function planReady(comms = false) {
  const { authed, sessionId } = await setup();
  const enc = new TextEncoder();
  await authed(`/${sessionId}/documents`, {
    method: "POST",
    body: docForm("resume", new File([enc.encode("resume text")], "cv.txt", { type: "text/plain" })),
  });
  await authed(`/${sessionId}/documents`, {
    method: "POST",
    body: docForm("jd", "Senior backend role. Must have Java and Postgres."),
  });
  await authed(`/${sessionId}/confirm`, { method: "POST" });
  const d = await authed(`/${sessionId}/diagnose`, { method: "POST" });
  expect(d.status).toBe(200);
  const { questions } = (await d.json()) as { questions: { question: string; skillTag: string }[] };
  const answers = questions.map((q) => ({
    question: q.question,
    skillTag: q.skillTag,
    answer: `I used ${q.skillTag} for two years to ship a service at 40k rps with Postgres tuning and on-call.`,
  }));
  const p = await authed(`/${sessionId}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers, commsWanted: comms }),
  });
  expect(p.status).toBe(200);
  const plan = ((await p.json()) as { plan: { modules: unknown[] } }).plan;
  return { authed, sessionId, plan };
}

describe("TurnEvaluation contract", () => {
  it("rejects scores without evidence or out of range", () => {
    const dims = [
      { dimension: "evidence", score: 50, evidence: "quote" },
    ] as const;
    expect(() =>
      TurnEvaluation.parse({ dimensions: [{ dimension: "evidence", score: 50, evidence: "" }], overall: 50, next_fix: "x" }),
    ).toThrow();
    expect(() =>
      TurnEvaluation.parse({ dimensions: [...dims], overall: 101, next_fix: "x" }),
    ).toThrow();
    expect(() =>
      TurnEvaluation.parse({ dimensions: [], overall: 50, next_fix: "x" }),
    ).toThrow();
  });
});

describe("drill scoring bands", () => {
  it("orders strong > average > weak on every dimension, 3 runs", () => {
    for (let run = 0; run < 3; run += 1) {
      const weak = scoreAnswer(MODULE, WEAK);
      const avg = scoreAnswer(MODULE, AVERAGE);
      const strong = scoreAnswer(MODULE, STRONG);
      expect(weak.dimensions.length).toBe(5);
      for (const dim of weak.dimensions) {
        const a = avg.dimensions.find((d) => d.dimension === dim.dimension)!;
        const s = strong.dimensions.find((d) => d.dimension === dim.dimension)!;
        expect(s.score).toBeGreaterThan(a.score);
        expect(a.score).toBeGreaterThan(dim.score);
        expect(s.evidence.length).toBeGreaterThan(0);
      }
      expect(strong.overall).toBeGreaterThan(avg.overall);
      expect(avg.overall).toBeGreaterThan(weak.overall);
      expect(strong.next_fix.length).toBeGreaterThan(0);
    }
  });
});

describe("compaction", () => {
  function longTurns(n: number): DrillTurn[] {
    return Array.from({ length: n }, (_, i) => {
      const evaluation = scoreAnswer(MODULE, `${STRONG} turn ${i}`);
      return { question: `q${i}`, answer: `${STRONG} turn ${i}`, evaluation, promptVersion: "drill-v1" };
    });
  }

  it("fires exactly past the turn threshold", () => {
    const at = longTurns(COMPACTION_TURN_THRESHOLD);
    expect(shouldCompact(at, null)).toBe(false);
    const over = longTurns(COMPACTION_TURN_THRESHOLD + 1);
    expect(shouldCompact(over, null)).toBe(true);
    expect(shouldCompact(over, buildSummary(over, "Java"))).toBe(false);
  });

  it("20-turn context keeps summary, drops raw early turns, stays in budget", () => {
    const turns = longTurns(20);
    const summary = buildSummary(turns, "Java");
    expect(summary.gaps.length + summary.strengths.length).toBeGreaterThan(0);
    expect(Object.keys(summary.scores)).toContain("Java");
    const { messages, contextTokens, compactionActive } = assembleContext({
      system: "drill-v1",
      profiles: "{}",
      summary,
      recentTurns: turns.slice(-4),
    });
    const live = messages.map((m) => m.content).join("\n");
    expect(compactionActive).toBe(true);
    expect(live).toContain("Java");
    expect(live).not.toContain("turn 0");
    expect(contextTokens).toBeLessThan(CONTEXT_TOKEN_BUDGET);
  });
});

describe("drill routes", () => {
  it("starts a module with teach + question on drill-v1", async () => {
    const { authed, sessionId } = await planReady();
    const r = await authed(`/${sessionId}/drill/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: 0 }),
    });
    expect(r.status).toBe(200);
    const body = (await r.json()) as {
      teach: string;
      question: string;
      promptVersion: string;
      status: string;
    };
    expect(body.teach.length).toBeGreaterThan(0);
    expect(body.question.length).toBeGreaterThan(0);
    expect(body.promptVersion).toBe("drill-v1");
    expect(body.status).toBe("active");
  });

  it("scores an answer with evidence and returns the next question", async () => {
    const { authed, sessionId } = await planReady();
    await authed(`/${sessionId}/drill/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: 0 }),
    });
    const r = await authed(`/${sessionId}/drill/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: 0, answer: AVERAGE }),
    });
    expect(r.status).toBe(200);
    const body = (await r.json()) as {
      evaluation: { overall: number; dimensions: { evidence: string }[]; next_fix: string };
      nextQuestion: string;
      promptVersion: string;
      moduleComplete: boolean;
    };
    expect(body.evaluation.dimensions.every((d) => d.evidence.length > 0)).toBe(true);
    expect(body.evaluation.next_fix.length).toBeGreaterThan(0);
    expect(body.nextQuestion.length).toBeGreaterThan(0);
    expect(body.promptVersion).toBe("drill-v1");
    expect(body.moduleComplete).toBe(false);
  });

  it("rejects empty answers without changing state", async () => {
    const { authed, sessionId } = await planReady();
    await authed(`/${sessionId}/drill/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: 0 }),
    });
    const bad = await authed(`/${sessionId}/drill/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: 0, answer: "   " }),
    });
    expect(bad.status).toBe(400);
    const re = (await (await authed(`/${sessionId}/drill?module=0`)).json()) as {
      drill: { turns: unknown[] };
    };
    expect(re.drill.turns.length).toBe(0);
  });

  it("completes the module on the pass bar and reloads the same question", async () => {
    const { authed, sessionId } = await planReady();
    await authed(`/${sessionId}/drill/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: 0 }),
    });
    await authed(`/${sessionId}/drill/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: 0, answer: STRONG }),
    });
    const second = await authed(`/${sessionId}/drill/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: 0, answer: STRONG }),
    });
    expect(second.status).toBe(200);
    const done = (await second.json()) as {
      moduleComplete: boolean;
      completeReason: string;
      nextQuestion: null;
    };
    expect(done.moduleComplete).toBe(true);
    expect(done.nextQuestion).toBeNull();

    // Reload lands on the completed module with the full transcript kept.
    const re = await authed(`/${sessionId}/drill?module=0`);
    expect(re.status).toBe(200);
    const state = (await re.json()) as {
      drill: { turns: unknown[]; status: string };
      nextQuestion: null;
    };
    expect(state.drill.turns.length).toBe(2);
    expect(state.drill.status).toBe("complete");
    expect(state.nextQuestion).toBeNull();
  });

  it("ends the module when the question budget runs out", async () => {
    const { authed, sessionId } = await planReady();
    await authed(`/${sessionId}/drill/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: 0 }),
    });
    let last: { moduleComplete: boolean; completeReason: string } | null = null;
    for (let i = 0; i < 6; i += 1) {
      const r = await authed(`/${sessionId}/drill/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleIndex: 0, answer: WEAK }),
      });
      expect(r.status).toBe(200);
      last = (await r.json()) as { moduleComplete: boolean; completeReason: string };
    }
    expect(last!.moduleComplete).toBe(true);
    expect(last!.completeReason).toMatch(/budget/);
  });

  it("reloads the pending question mid-module", async () => {
    const { authed, sessionId } = await planReady();
    const started = (await (await authed(`/${sessionId}/drill/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: 0 }),
    })).json()) as { question: string };
    const answered = (await (await authed(`/${sessionId}/drill/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: 0, answer: AVERAGE }),
    })).json()) as { nextQuestion: string };
    const re = (await (await authed(`/${sessionId}/drill?module=0`)).json()) as {
      nextQuestion: string;
      drill: { turns: { question: string }[] };
    };
    expect(re.nextQuestion).toBe(answered.nextQuestion);
    expect(re.drill.turns[0].question).toBe(started.question);
  });

  it("uses the comms prompt for comms modules", async () => {
    const { authed, sessionId, plan } = await planReady(true);
    const commsIndex = plan.modules.findIndex((m: unknown) => (m as { kind?: string })?.kind === "comms");
    expect(commsIndex).toBeGreaterThanOrEqual(0);
    const r = await authed(`/${sessionId}/drill/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleIndex: commsIndex }),
    });
    expect(r.status).toBe(200);
    expect(((await r.json()) as { promptVersion: string }).promptVersion).toBe("comms-v1");
  });
});

describe("interviewer system prompt & character personas", () => {
  it("builds the full voice-first system prompt with all critical sections", () => {
    const prompt = buildInterviewerSystemPrompt({
      characterName: "Alex",
      role: "Senior Distributed Systems Engineer",
      interviewType: "technical",
      seniority: "senior",
      questionCount: 4,
      candidateName: "Priya Nair",
      language: "English",
    });

    expect(prompt).toContain("# ROLE");
    expect(prompt).toContain("You are Alex, a senior interviewer at a well-known technology company");
    expect(prompt).toContain("# INTERVIEW CONTEXT");
    expect(prompt).toContain("Role being interviewed for: Senior Distributed Systems Engineer");
    expect(prompt).toContain("Interview type: technical");
    expect(prompt).toContain("Seniority level: senior");
    expect(prompt).toContain("Total main questions: 4");
    expect(prompt).toContain("Candidate's name: Priya Nair");
    expect(prompt).toContain("# CRITICAL VOICE RULES");
    expect(prompt).toContain("NEVER use markdown");
    expect(prompt).toContain("Keep every turn to 2–4 short sentences");
    expect(prompt).toContain("# INTERVIEW FLOW");
    expect(prompt).toContain("PHASE: GREETING");
    expect(prompt).toContain("PHASE: QUESTIONING");
    expect(prompt).toContain("PHASE: FOLLOW_UP");
    expect(prompt).toContain("PHASE: WRAP_UP");
    expect(prompt).toContain("PHASE: FEEDBACK");
    expect(prompt).toContain("# QUESTION STRATEGY BY INTERVIEW TYPE");
    expect(prompt).toContain("# HANDLING EDGE CASES");
    expect(prompt).toContain("# GUARDRAILS");
    expect(prompt).toContain("# TONE CALIBRATION BY SENIORITY");
    expect(prompt).toContain("# OUTPUT CHECKLIST");
  });

  it("builds unique system prompts for all 17 supported character personas", () => {
    const expectedChars = [
      "alex", "cori", "alan", "arthur", "alba", "amy", "joe",
      "ryan", "lessac", "bryce", "bella", "emma", "george",
      "fable", "sarah", "adam", "michael"
    ];

    for (const charKey of expectedChars) {
      expect(CHARACTER_PERSONAS[charKey]).toBeDefined();
      const prompt = getCharacterPrompt(charKey);
      expect(prompt).toContain(CHARACTER_PERSONAS[charKey].name);
      expect(prompt).toContain(CHARACTER_PERSONAS[charKey].title);
      expect(prompt).toContain("# CRITICAL VOICE RULES");
    }
  });

  it("exposes character list and session prompt via API endpoints", async () => {
    const { authed, sessionId } = await planReady();
    
    // Characters endpoint
    const charRes = await authed("/interviewer/characters");
    expect(charRes.status).toBe(200);
    const charBody = (await charRes.json()) as { characters: { name: string; title: string }[] };
    expect(charBody.characters.length).toBeGreaterThanOrEqual(17);
    expect(charBody.characters.some((c) => c.name === "Alex")).toBe(true);
    expect(charBody.characters.some((c) => c.name === "Cori")).toBe(true);

    // Prompt endpoint for session
    const promptRes = await authed(`/${sessionId}/interviewer/prompt?character=Cori`);
    expect(promptRes.status).toBe(200);
    const promptBody = (await promptRes.json()) as { character: string; prompt: string };
    expect(promptBody.character).toBe("Cori");
    expect(promptBody.prompt).toContain("You are Cori");
    expect(promptBody.prompt).toContain("# CRITICAL VOICE RULES");
  });
});
