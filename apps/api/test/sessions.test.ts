import { describe, expect, it } from "vitest";
import { buildAuthApp } from "../src/auth/routes.js";
import { createMemoryStore } from "../src/auth/store.js";
import { buildSessionApp } from "../src/sessions/routes.js";
import { createMemorySessionStore } from "../src/sessions/store.js";
import { createMemoryStorage } from "../src/storage/index.js";

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

type Authed = (path: string, init?: RequestInit) => Promise<Response>;

async function setup(spyUserIds?: unknown[]) {
  const authStore = createMemoryStore();
  const inner = createMemorySessionStore();
  const sessions = spyUserIds
    ? {
        ...inner,
        addDocument: async (args: Parameters<typeof inner.addDocument>[0]) => {
          spyUserIds.push(args.userId);
          return inner.addDocument(args);
        },
      }
    : inner;
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

  const user = await authStore.createUser("a@example.com");
  const { sha256Hex } = await import("../src/auth/store.js");
  const raw = `token-${Math.random()}`;
  await authStore.saveMagicToken({
    tokenHash: sha256Hex(raw),
    userId: user.id,
    expiresAt: new Date(Date.now() + 60_000),
  });
  const cb = await authApp.request(`/callback?token=${raw}`);
  const cookie = cb.headers.get("set-cookie")!.split(";")[0];

  const authed: Authed = async (path: string, init?: RequestInit) =>
    sessionApp.request(path, {
      ...init,
      headers: { ...(init?.headers ?? {}), Cookie: cookie },
    });

  const cur = (await (await authed("/current")).json()) as {
    session: { id: string; state: string };
  };
  return { sessionApp, authed, sessionId: cur.session.id, user };
}

function docForm(kind: "resume" | "jd", file: File | string): FormData {
  const form = new FormData();
  form.append("kind", kind);
  if (typeof file === "string") form.append("text", file);
  else form.append("file", file, file.name);
  return form;
}

describe("session ingestion flow", () => {
  it("setup -> parsed with resume file + pasted JD text", async () => {
    const { authed, sessionId } = await setup();
    const enc = new TextEncoder();

    const r = await authed(`/${sessionId}/documents`, {
      method: "POST",
      body: docForm("resume", new File([enc.encode("resume text")], "cv.txt", { type: "text/plain" })),
    });
    expect(r.status).toBe(200);
    const rBody = (await r.json()) as { documentId: string; profile: { name: string } };
    expect(rBody.profile.name).toBe("Priya Nair");
    expect(rBody.documentId).toBeTruthy();

    const j = await authed(`/${sessionId}/documents`, {
      method: "POST",
      body: docForm("jd", "Senior backend role. Must have Java and Postgres."),
    });
    expect(j.status).toBe(200);
    expect(((await j.json()) as { profile: { title: string } }).profile.title).toBe(
      "Senior Backend Engineer",
    );

    const done = await authed(`/${sessionId}/confirm`, { method: "POST" });
    expect(done.status).toBe(200);
    expect(((await done.json()) as { session: { state: string } }).session.state).toBe("parsed");
  });

  it("records the owner's user id on uploaded documents", async () => {
    // Regression: documents.user_id NOT NULL rejected every upload because
    // the route never passed the signed-in user's id to the store.
    const seen: unknown[] = [];
    const { authed, sessionId, user } = await setup(seen);
    const up = await authed(`/${sessionId}/documents`, {
      method: "POST",
      body: docForm("resume", new File([new TextEncoder().encode("x")], "cv.txt", { type: "text/plain" })),
    });
    expect(up.status).toBe(200);
    expect(seen).toEqual([user.id]);
  });

  it("confirm requires both profiles", async () => {
    const { authed, sessionId } = await setup();
    await authed(`/${sessionId}/documents`, {
      method: "POST",
      body: docForm("resume", new File([new TextEncoder().encode("x")], "cv.txt", { type: "text/plain" })),
    });
    const res = await authed(`/${sessionId}/confirm`, { method: "POST" });
    expect(res.status).toBe(409);
  });

  it("rejects bad kinds, bad types, and strangers", async () => {
    const { authed, sessionId, sessionApp } = await setup();
    const evil = new FormData();
    evil.append("kind", "cover-letter");
    evil.append("text", "x");
    const badKind = await authed(`/${sessionId}/documents`, { method: "POST", body: evil });
    expect(badKind.status).toBe(400);

    const badType = await authed(`/${sessionId}/documents`, {
      method: "POST",
      body: docForm(
        "resume",
        new File([new TextEncoder().encode("x")], "cv.png", { type: "image/png" }),
      ),
    });
    expect(badType.status).toBe(400);

    const empty = await authed(`/${sessionId}/documents`, {
      method: "POST",
      body: (() => {
        const f = new FormData();
        f.append("kind", "resume");
        return f;
      })(),
    });
    expect(empty.status).toBe(400);

    const anon = await sessionApp.request("/current");
    expect(anon.status).toBe(401);
    const missing = await authed("/nope/documents", { method: "POST", body: new FormData() });
    expect(missing.status).toBe(404);
  });

  it("validates profile edits against the schema", async () => {
    const { authed, sessionId } = await setup();
    const up = await authed(`/${sessionId}/documents`, {
      method: "POST",
      body: docForm("resume", new File([new TextEncoder().encode("x")], "cv.txt", { type: "text/plain" })),
    });
    const { documentId } = (await up.json()) as { documentId: string };

    const bad = await authed(`/${sessionId}/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parsed: { nope: true } }),
    });
    expect(bad.status).toBe(400);

    const good = await authed(`/${sessionId}/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parsed: { name: "Priya N.", skills: [], experience: [], education: [], metrics: [], notes: [] },
      }),
    });
    expect(good.status).toBe(200);
  });
});

describe("diagnosis + plan", () => {
  async function readySession(comms = false) {
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
    expect(questions.length).toBeGreaterThanOrEqual(2);
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
    return { authed, sessionId, plan: ((await p.json()) as { plan: { modules: { source: string; kind: string }[] } }).plan };
  }

  it("covers every JD must-have with exactly one module", async () => {
    const { plan } = await readySession();
    const sources = plan.modules.map((m) => m.source);
    expect(sources.filter((s) => s.includes("Java")).length).toBe(1);
    expect(sources.filter((s) => s.includes("Postgres")).length).toBe(1);
  });

  it("comms branch toggles the comms module and reload persists", async () => {
    const withComms = await readySession(true);
    expect(withComms.plan.modules.some((m) => m.kind === "comms")).toBe(true);
    const re = await withComms.authed(`/${withComms.sessionId}/plan`);
    expect(re.status).toBe(200);
    expect(((await re.json()) as { plan: { modules: unknown[] } }).plan.modules.length).toBe(
      withComms.plan.modules.length,
    );

    const without = await readySession(false);
    expect(without.plan.modules.some((m) => m.kind === "comms")).toBe(false);
  });

  it("auto-diagnose directly generates plan without questionnaire", async () => {
    const { authed, sessionId } = await setup();
    await authed(`/${sessionId}/documents`, {
      method: "POST",
      body: docForm("resume", new File([new TextEncoder().encode("cv")], "cv.txt", { type: "text/plain" })),
    });
    await authed(`/${sessionId}/documents`, {
      method: "POST",
      body: docForm("jd", new File([new TextEncoder().encode("jd")], "jd.txt", { type: "text/plain" })),
    });

    const res = await authed(`/${sessionId}/auto-diagnose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commsWanted: true }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { plan: { modules: { source: string; kind: string }[] } };
    expect(body.plan.modules.length).toBeGreaterThanOrEqual(2);
    expect(body.plan.modules.some((m) => m.kind === "comms")).toBe(true);

    const cur = (await (await authed("/current")).json()) as { session: { state: string } };
    expect(cur.session.state).toBe("plan_ready");
  });
});
