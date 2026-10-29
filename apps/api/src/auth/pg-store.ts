import { Pool } from "pg";
import type { AuthStore, UserRow } from "./store.js";

function toUserRow(r: { id: string; email: string }): UserRow {
  return { id: r.id, email: r.email };
}

/** Production Postgres store. Tables come from db/migrations/001_init.sql. */
export function createPgStore(pool: Pool): AuthStore {
  return {
    async findUserByEmail(email) {
      const r = await pool.query("SELECT id, email FROM users WHERE email = $1", [email]);
      return r.rows[0] ? toUserRow(r.rows[0]) : null;
    },
    async createUser(email) {
      const r = await pool.query(
        "INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id, email",
        [email],
      );
      return toUserRow(r.rows[0]);
    },
    async saveMagicToken({ tokenHash, userId, expiresAt }) {
      await pool.query(
        "INSERT INTO magic_link_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
        [tokenHash, userId, expiresAt.toISOString()],
      );
    },
    async consumeMagicToken(tokenHash) {
      const r = await pool.query(
        `UPDATE magic_link_tokens SET consumed_at = now()
         WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > now()
         RETURNING user_id`,
        [tokenHash],
      );
      if (r.rows.length === 0) return null;
      const u = await pool.query("SELECT id, email FROM users WHERE id = $1", [
        r.rows[0].user_id,
      ]);
      return u.rows[0] ? toUserRow(u.rows[0]) : null;
    },
    async createSession({ userId, cookie, expiresAt }) {
      await pool.query(
        "INSERT INTO sessions (user_id, cookie, state, expires_at) VALUES ($1, $2, 'setup', $3)",
        [userId, cookie, expiresAt.toISOString()],
      );
    },
    async findUserByCookie(cookie) {
      const r = await pool.query(
        `SELECT u.id, u.email FROM users u
         JOIN sessions s ON s.user_id = u.id
         WHERE s.cookie = $1 AND s.expires_at > now()`,
        [cookie],
      );
      return r.rows[0] ? toUserRow(r.rows[0]) : null;
    },
    async deleteSession(cookie) {
      await pool.query("DELETE FROM sessions WHERE cookie = $1", [cookie]);
    },
  };
}
