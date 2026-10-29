import type { SessionState } from "@intervibe/contracts";

export interface SessionRow {
  id: string;
  userId: string;
  state: SessionState;
}

export interface DocumentRow {
  id: string;
  sessionId: string;
  kind: "resume" | "jd";
  storageKey: string;
  contentType: string;
  parsedJson: unknown | null;
}

/** Session + document persistence. Postgres in prod, memory in tests. */
export interface SessionStore {
  /** The user's open session, or a fresh one in `setup` state. */
  currentSession(userId: string): Promise<SessionRow>;
  getSession(sessionId: string): Promise<SessionRow | null>;
  setState(sessionId: string, state: SessionState): Promise<void>;
  addDocument(args: {
    userId: string;
    sessionId: string;
    kind: "resume" | "jd";
    storageKey: string;
    contentType: string;
  }): Promise<DocumentRow>;
  getDocument(docId: string): Promise<DocumentRow | null>;
  listDocuments(sessionId: string): Promise<DocumentRow[]>;
  saveParsed(docId: string, parsed: unknown): Promise<void>;
  /** Phase 2 bundle (questions, answers, diagnostic, plan). Survives reload via sessions.config. */
  loadBundle(sessionId: string): Promise<Record<string, unknown> | null>;
  saveBundle(sessionId: string, bundle: Record<string, unknown>): Promise<void>;
}

/** Test/CI store. Never used in production. */
export function createMemorySessionStore(): SessionStore {
  const sessions = new Map<string, SessionRow>();
  const docs = new Map<string, DocumentRow>();
  const bundles = new Map<string, Record<string, unknown>>();
  let seq = 0;
  const nid = (p: string) => `${p}-${++seq}`;

  return {
    async currentSession(userId) {
      for (const s of sessions.values()) {
        if (s.userId === userId && s.state !== "scored" && s.state !== "document_ready") return s;
      }
      const s = { id: nid("sess"), userId, state: "setup" as SessionState };
      sessions.set(s.id, s);
      return s;
    },
    async getSession(id) {
      return sessions.get(id) ?? null;
    },
    async setState(id, state) {
      const s = sessions.get(id);
      if (s) s.state = state;
    },
    async addDocument({ sessionId, kind, storageKey, contentType }) {
      const d = { id: nid("doc"), sessionId, kind, storageKey, contentType, parsedJson: null };
      docs.set(d.id, d);
      return d;
    },
    async getDocument(id) {
      return docs.get(id) ?? null;
    },
    async listDocuments(sessionId) {
      return [...docs.values()].filter((d) => d.sessionId === sessionId);
    },
    async saveParsed(id, parsed) {
      const d = docs.get(id);
      if (d) d.parsedJson = parsed;
    },
    async loadBundle(id) {
      return bundles.get(id) ?? null;
    },
    async saveBundle(id, bundle) {
      bundles.set(id, bundle);
    },
  };
}
