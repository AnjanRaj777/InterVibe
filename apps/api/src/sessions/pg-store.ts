import { Pool } from "pg";
import { SessionState } from "@intervibe/contracts";
import type { DocumentRow, SessionRow, SessionStore } from "./store.js";

/** Production Postgres store. Tables come from db/migrations/001_init.sql. */
export function createPgSessionStore(pool: Pool): SessionStore {
  return {
    async currentSession(userId) {
      const open = await pool.query(
        `SELECT id, user_id AS "userId", state FROM sessions
         WHERE user_id = $1 AND state NOT IN ('scored', 'document_ready')
         ORDER BY updated_at DESC LIMIT 1`,
        [userId],
      );
      if (open.rows[0]) return open.rows[0] as SessionRow;
      const created = await pool.query(
        `INSERT INTO sessions (user_id, cookie, state, expires_at)
         VALUES ($1, gen_random_uuid()::text, 'setup', now() + interval '30 days')
         RETURNING id, user_id AS "userId", state`,
        [userId],
      );
      return created.rows[0] as SessionRow;
    },
    async getSession(id) {
      const r = await pool.query(
        `SELECT id, user_id AS "userId", state FROM sessions WHERE id = $1`,
        [id],
      );
      return (r.rows[0] as SessionRow | undefined) ?? null;
    },
    async setState(id, state: SessionState) {
      await pool.query(`UPDATE sessions SET state = $2, updated_at = now() WHERE id = $1`, [
        id,
        state,
      ]);
    },
    async addDocument({ userId, sessionId, kind, storageKey, contentType }) {
      const r = await pool.query(
        `INSERT INTO documents (user_id, session_id, kind, storage_key, content_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, session_id AS "sessionId", kind, storage_key AS "storageKey",
                   content_type AS "contentType", parsed_json AS "parsedJson"`,
        [userId, sessionId, kind, storageKey, contentType],
      );
      return r.rows[0] as DocumentRow;
    },
    async getDocument(id) {
      const r = await pool.query(
        `SELECT id, session_id AS "sessionId", kind, storage_key AS "storageKey",
                content_type AS "contentType", parsed_json AS "parsedJson"
         FROM documents WHERE id = $1`,
        [id],
      );
      return (r.rows[0] as DocumentRow | undefined) ?? null;
    },
    async listDocuments(sessionId) {
      const r = await pool.query(
        `SELECT id, session_id AS "sessionId", kind, storage_key AS "storageKey",
                content_type AS "contentType", parsed_json AS "parsedJson"
         FROM documents WHERE session_id = $1 ORDER BY created_at`,
        [sessionId],
      );
      return r.rows as DocumentRow[];
    },
    async saveParsed(id, parsed) {
      await pool.query(`UPDATE documents SET parsed_json = $2 WHERE id = $1`, [
        id,
        JSON.stringify(parsed),
      ]);
    },
    async loadBundle(sessionId) {
      const r = await pool.query(`SELECT config FROM sessions WHERE id = $1`, [sessionId]);
      return (r.rows[0]?.config as Record<string, unknown> | undefined) ?? null;
    },
    async saveBundle(sessionId, bundle) {
      await pool.query(`UPDATE sessions SET config = $2::jsonb, updated_at = now() WHERE id = $1`, [
        sessionId,
        JSON.stringify(bundle),
      ]);
    },
  };
}
