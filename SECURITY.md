# InterVibe Security Policy & Threat Model

## 1. Threat Model

InterVibe is an AI-powered verbal interview platform executing real-time voice streaming, speech-to-text transcription, LLM conversation synthesis, and automated candidate evaluations.

### Assets & Boundaries
- **Primary Assets**:
  - LLM and speech API provider credentials (`MODEL_API_KEY`, `MUSE_API_KEY`, `DEEPGRAM_API_KEY`).
  - Candidate PII: Resumes (PDFs), voice audio recordings (`.wav`), transcript dialogue, and evaluative performance scores.
  - User accounts and billing entitlements stored in Supabase PostgreSQL (`public.profiles`, `public.interview_sessions`).
- **Threat Actors & Attack Vectors**:
  - **Unauthenticated Quota Draining**: Malicious actors sending automated requests to `/api/chat`, `/api/stt`, or `/api/tts` to consume API credits. *Mitigated by server-side Supabase authentication checks and payload rate limiting.*
  - **Memory Exhaustion / DoS via Uploads**: Uploading multi-gigabyte files to crash the Node.js event loop. *Mitigated by strict 5MB PDF and 10MB audio caps with magic-byte verification before buffer allocation.*
  - **Insecure Direct Object References (IDOR)**: Spoofing `userId` parameters to access other candidates' interviews. *Mitigated by strict session ownership enforcement (`auth.uid() === userId`).*
  - **Open Redirects**: Using callback URLs (`?next=`) to divert users to malicious sites post-authentication. *Mitigated by relative path validation preventing double-slash or foreign origin redirection.*
  - **Clickjacking & Frame Embedding**: Rendering authentication forms inside attacker-controlled iframes. *Mitigated by `X-Frame-Options: DENY` and CSP frame-ancestors headers.*

---

## 2. Secrets Management & Environment Isolation

- **Zero Secrets in Version Control**: API keys, service role keys, and database passwords must never be committed to Git. All secrets reside in `.env.local` (local development) or encrypted Vercel Environment Variables (production).
- **Client vs. Server Key Separation**:
  - Only variables prefixed with `NEXT_PUBLIC_` are bundled into client-side code.
  - `SUPABASE_SERVICE_ROLE_KEY`, `MODEL_API_KEY`, `MUSE_API_KEY`, and `DEEPGRAM_API_KEY` are restricted to server-side route handlers and middleware.
- **Fail-Safe Secret Validation**: Backend services must fail immediately with clear configuration errors rather than falling back to public or insecure keys.

---

## 3. Vulnerability Reporting

If you identify a security vulnerability in InterVibe, please notify the maintainers responsibly:

- **Email**: `security@intervibe.ai` (or open a confidential security advisory on GitHub).
- **Expected Details**:
  - Description of the vulnerability and its potential impact.
  - Step-by-step reproduction instructions or proof-of-concept payload.
  - Affected components or endpoints.
- **Response Timeline**:
  - Acknowledgment: Within 24 hours.
  - Assessment & Patch: Within 72 hours for Critical/High severity issues.
