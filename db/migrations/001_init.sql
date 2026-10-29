-- Phase 0 baseline schema. Append-only: new changes get new migration files.
CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       citext UNIQUE NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magic_link_tokens (
  token_hash  text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS magic_link_tokens_user_idx ON magic_link_tokens (user_id);

CREATE TABLE IF NOT EXISTS sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  cookie      text UNIQUE NOT NULL,
  state       text NOT NULL DEFAULT 'setup',
  config      jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_cookie_idx ON sessions (cookie);

CREATE TABLE IF NOT EXISTS documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  session_id  uuid REFERENCES sessions (id) ON DELETE SET NULL,
  kind        text NOT NULL CHECK (kind IN ('resume', 'jd')),
  storage_key text NOT NULL,
  parsed_json jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documents_user_idx ON documents (user_id);

CREATE TABLE IF NOT EXISTS turns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('interviewer', 'candidate', 'system')),
  transcript  text NOT NULL DEFAULT '',
  scores_json jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS turns_session_idx ON turns (session_id, created_at);

CREATE TABLE IF NOT EXISTS summaries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  summary     jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  report      jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid REFERENCES sessions (id) ON DELETE SET NULL,
  model           text NOT NULL,
  prompt_version  text,
  tokens_in       integer NOT NULL DEFAULT 0,
  cached_tokens   integer NOT NULL DEFAULT 0,
  tokens_out      integer NOT NULL DEFAULT 0,
  audio_seconds   integer NOT NULL DEFAULT 0,
  cost_usd        numeric(12, 6) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS usage_events_session_idx ON usage_events (session_id);
