import { createHash, randomBytes } from "node:crypto";

/** Persistence boundary for Phase 0 auth. Postgres in prod, memory in tests. */
export interface UserRow {
  id: string;
  email: string;
}

export interface AuthStore {
  findUserByEmail(email: string): Promise<UserRow | null>;
  createUser(email: string): Promise<UserRow>;
  saveMagicToken(args: {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  }): Promise<void>;
  consumeMagicToken(tokenHash: string): Promise<UserRow | null>;
  createSession(args: { userId: string; cookie: string; expiresAt: Date }): Promise<void>;
  findUserByCookie(cookie: string): Promise<UserRow | null>;
  deleteSession(cookie: string): Promise<void>;
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function newRawToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Test/CI store. Never used in production. */
export function createMemoryStore(): AuthStore {
  const users = new Map<string, UserRow>();
  const byEmail = new Map<string, UserRow>();
  const tokens = new Map<string, { userId: string; expiresAt: number; consumed: boolean }>();
  const sessions = new Map<string, { userId: string; expiresAt: number }>();
  let seq = 0;

  return {
    async findUserByEmail(email) {
      return byEmail.get(email.toLowerCase()) ?? null;
    },
    async createUser(email) {
      const row = { id: `user-${++seq}`, email: email.toLowerCase() };
      users.set(row.id, row);
      byEmail.set(row.email, row);
      return row;
    },
    async saveMagicToken({ tokenHash, userId, expiresAt }) {
      tokens.set(tokenHash, { userId, expiresAt: expiresAt.getTime(), consumed: false });
    },
    async consumeMagicToken(tokenHash) {
      const t = tokens.get(tokenHash);
      if (!t || t.consumed || t.expiresAt < Date.now()) return null;
      t.consumed = true;
      return users.get(t.userId) ?? null;
    },
    async createSession({ userId, cookie, expiresAt }) {
      sessions.set(cookie, { userId, expiresAt: expiresAt.getTime() });
    },
    async findUserByCookie(cookie) {
      const s = sessions.get(cookie);
      if (!s || s.expiresAt < Date.now()) return null;
      return users.get(s.userId) ?? null;
    },
    async deleteSession(cookie) {
      sessions.delete(cookie);
    },
  };
}
