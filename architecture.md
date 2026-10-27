## Goal

Build an interview copilot for the Meta Global AI Developer Hackathon (remote, Oct 26–Nov 4, 2026; submissions due Nov 4, 9:00 PM ET): a voice-first web app where a user signs in, gives a resume + job description in one simple setup, and is then diagnosed, trained, mock-interviewed live by voice, scored, and either re-trained (low score) or given a generated practice document (pass). Track: **Indie developer**, theme **Build for Your World**. Scope (confirmed): **any job / any JD** — FAANG-style rigour is the calibration bar for question quality and scoring, not a scope limit.

## Success Criteria

- A new user goes from sign-in to a running mock interview in one setup screen: resume upload + JD (paste or upload) + one **Start** button. No second upload step anywhere.
- The full loop works end to end with real models, no mocks in the demo path: diagnose → skill-gap plan → optional communication training → teach/drill → live voice mock → score → re-train loop or practice document.
- Voice loop feels live: partial transcripts while speaking, interviewer reply streamed as speech on-device, user can interrupt (barge-in).
- Every score is explainable: per-dimension rubric scores with transcript evidence, never a bare number.
- Cost per session is measured and bounded: token/audio usage logged per session, prompt-cache hit rate visible.
- Submission-ready by Nov 3 EOD: deployed URL, demo video path, and a 3-minute scripted demo that survives one rehearsed failure (e.g. mic denied → text fallback).

## Approach

**Locked stack and models**

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (App Router, TypeScript) + **Astryx** components only | User said "Astrix"; the real Meta design system is **Astryx** (`@astryxdesign/core`, React + StyleX, beta). One theme, minimal custom CSS, no second component library. |
| Backend | Custom TypeScript API service (separate from Next.js) | Owns all Meta API keys, session state machine, scoring, and document generation. DB/auth/host were not specified — assumption below. |
| Data (assumed, reversible) | PostgreSQL + S3-compatible object storage | Tables in Phase 0; swap is contained behind a repository layer. Auth: email magic-link or OAuth via the custom backend, httpOnly session cookie. |
| LLM | Muse Spark 1.3 (`muse-spark-1.3`), Meta Model API `https://api.meta.ai/v1` | OpenAI-SDK-compatible. **Standard mode only** for resume/JD data — Contributor mode (`muse-spark-1.3-contributor`) lets Meta train on content, so it is banned for user PII. |
| STT | Muse Voice Transcribe (`muse-voice-transcribe-1.0`) realtime WebSocket `wss://api.meta.ai/v1/asr/realtime` | See VAD decision below. File endpoint `POST /v1/asr/transcribe` only for retry/repair. |
| TTS | Kokoro on-device in the browser (`kokoro-js`, ONNX/WebGPU with WASM fallback) | Runs in a Web Worker. No TTS API cost, no audio leaves the device for synthesis. Text fallback if model load fails. |

**Key decisions**

1. **Server-side model keys, always.** Browser talks only to the custom backend. The backend mints short-lived session grants and proxies/terminates the STT WebSocket (STT handshake auth is in the first frame; `Authorization` header is ignored on the realtime socket). No `MODEL_API_KEY` in client code or logs.
2. **VAD: do not build your own.** Muse Voice Transcribe has native endpointing/VAD. Use `mode: "ENDPOINTING"`, consume `speechStart` → partial `transcript` → `speechEnd` → final `speechComplete`, and key all state by `turnId` (turns can overlap; partials carry no `turnId`). Client-side audio work is limited to mic capture (24 kHz PCM frames), a speaking indicator, mute, and barge-in detection. Building a parallel VAD would fight the model's turn detection.
3. **One state machine owns the product.** `setup → parsed → diagnosing → plan_ready → comms_training? → drilling → live_mock → scored → (retraining → drilling/live_mock) | document_ready`. The backend enforces transitions; the UI only renders the current state. This is what keeps the "simple, don't bombard the user" requirement true as features grow.
4. **Strict system prompt + structured outputs for every decision.** The interviewer persona, rubric, and phase behaviour live in one versioned system prompt (stable prefix, see caching). Every machine-read result (profile, diagnosis, plan, per-turn evaluation, final report) is a Muse Spark structured output (`response_format: { type: "json_schema" }`, non-recursive schemas, depth ≤ 10). Free-text is only for what the user hears/reads.
5. **Two-layer token cost control.** (a) Meta prompt caching is automatic prefix caching: stable content first (system prompt, rubric, few-shot), variable content last, one shared `prompt_cache_key` per prompt version (never per-user — that kills hit rate); monitor `usage.prompt_tokens_details.cached_tokens` per call. (b) App-level mini-summary compaction: when a session's rolling context exceeds a threshold (default: ~6,000 tokens or 12 turns, configurable), the backend summarises older turns into a compact `session_summary` (strengths, gaps, evidence, scores so far) and thereafter sends `system + candidate/JD profile + session_summary + last 4 turns` only. Full transcript stays in DB for scoring/report, out of the live prompt.
6. **Generic rubric + JD-derived criteria (any-job scope).** Fixed dimensions scored 0–100: *Correctness/Depth, Structure, Communication clarity, JD relevance, Evidence/examples*. The planner derives JD-specific sub-criteria and question topics from the parsed JD + resume gaps. FAANG calibration = question depth, follow-up probing, and scoring strictness presets (`standard` default, `faang_strict` toggle in the plan, not a separate product).
7. **Kokoro in a worker, chunked by sentence.** Load once, cache model assets (Cache Storage), show a one-time "preparing voice" state during setup so first question is never blocked. Stream LLM text → split into sentences → synthesise/play sequentially. On playback error or unsupported browser: show captions and continue text-only; the interview never hard-fails on TTS.
8. **Scoring gate drives the ending.** Weighted overall score: `>= 70` → generate the practice document (strengths, model answers, STAR stories, drill list, JD keyword map) as an in-app document with Markdown/PDF export. `< 70` → motivational, specific feedback + a dated re-training plan (drills per weak dimension) and a "Re-test" that re-enters `drilling → live_mock`. Threshold and weights are config, tuned in Phase 5 with golden personas.
9. **Privacy by default.** Resume/JD are user data: encrypted at rest, deletable in one click (account + data), never sent to Contributor-mode models, retention stated on the setup screen. Audio is streamed for transcription; raw audio is not stored unless the user opts in for replay.

**Non-goals for v1:** video/avatar interviewer, code-execution judge (coding answers are spoken/explained; a plain text editor pane is a stretch goal only), multi-interviewer panels, payments, native mobile apps, fine-tuning.

## Steps

Dates are hackathon days (ET). Each phase ends at its exit gate; do not start the next phase's UI until the gate passes.

### Phase 0 — Foundations (Oct 26)
- Scaffold Next.js + Astryx (theme, layout shell, dark mode) and the custom backend service; CI, lint, typecheck, env schema (`MODEL_API_KEY`, DB, storage) with secrets server-side only.
- Data model: `users, documents(resume/JD, parsed_json), sessions(state, config), turns(transcript, scores), summaries, reports, usage_events(model, tokens_in, cached_tokens, tokens_out, audio_seconds, cost)`.
- Meta API smoke: one Spark chat call + one structured-output call + one realtime STT handshake from the backend; log `cached_tokens` and rate-limit headers.
- **Exit gate:** deployed hello-world (frontend + backend + DB) on the real host; smoke script prints model IDs and usage.

### Phase 1 — One-screen setup + ingestion (Oct 27)
- Sign-in, then a single setup card: resume upload (PDF/DOCX/TXT), JD paste-or-upload, target company/role optional text, one **Start**. Validate type/size; show parse progress inline — no wizard, no second upload.
- Backend parsing: extract resume text → `CandidateProfile` structured output (skills, experience, projects, metrics, gaps); JD → `JDProfile` (must-haves, responsibilities, keywords, seniority). Store parsed JSON + source file; surface a read-only "what we understood" summary with edit-as-text correction.
- **Exit gate:** 5 sample resume/JD pairs (SWE, PM, data, sales, healthcare) parse into schema-valid profiles; bad file → clear inline error, no dead end.

### Phase 2 — Diagnosis + preparation plan (Oct 28)
- Diagnostic: short adaptive check (5–8 questions, text or voice) verifying claimed skills against JD must-haves; per-skill `verified | shaky | gap` with evidence → `DiagnosticResult`.
- Planner: `PrepPlan` = ordered modules mapped to gaps (knowledge drills, JD deep-dives, resume-story mining), each with goal, questions, pass bar. This plan is the contract the rest of the app executes.
- Ask the branching question in-product: "Also train Introduction / Communication / Storytelling?" Yes → insert comms module (intro pitch, STAR storytelling, clarity drills); No → skip. Default suggestion based on diagnostic communication score.
- **Exit gate:** for the 5 golden personas, plan covers every JD must-have exactly once; no module without a diagnostic or JD source.

### Phase 3 — Training loops (Oct 29)
- Knowledge drilling: model teaches briefly, asks, probes follow-ups ("model skills: FAANG" = depth-first probing, trade-offs, metrics), scores per answer against the rubric, updates skill states.
- Comms training (if chosen): intro recording, STAR story builder from real resume bullets, pacing/clarity feedback from transcript (filler, structure, length) — transcript-based only; no emotion detection (model does not provide it).
- Mini-summary compaction and prompt-cache layout land here, before the live mock makes conversations long.
- **Exit gate:** a full train session completes with per-answer scores stored; token log shows cache hits > 0 after turn 1 and a compaction event on a forced long session.

### Phase 4 — Voice pipeline (Oct 30–31)
- Browser mic capture → backend-proxied Muse Voice Transcribe realtime socket, `ENDPOINTING` mode, `languageBias` from user locale, `keywords` = JD/resume proper nouns and acronyms (set at handshake; immutable per session). Render partials live; commit only `speechComplete` finals.
- LLM turn loop: session context assembly (system + profiles + summary + last turns) → streamed Spark reply → sentence chunker → Kokoro worker → sequential playback; barge-in (user `speechStart` while playing) stops playback and cancels the pending reply.
- Resilience: reconnect with turn-state resync, STT stream-limit awareness (256 concurrent streams/team), push-to-talk fallback button, text-input fallback, TTS-failed → captions mode.
- **Exit gate (highest-risk gate):** spoken question→answer→follow-up round-trip works in Chrome + one other browser; measured targets: first partial < 1 s after speech, interviewer first audio < 2.5 s after final transcript, barge-in stops audio < 300 ms.

### Phase 5 — Live mock interview + scoring (Nov 1)
- Full timed mock driven by `PrepPlan` (intro → knowledge/JD → behavioural/story → closing), difficulty adapts to answers, strict phase system-prompt enforced (no hints during mock, no score leaks mid-interview).
- Scoring: per-turn evaluations + final `SessionReport` (dimension scores, overall, evidence quotes, JD coverage map). Golden-persona calibration: 6 scripted candidates (strong/average/weak × tech/non-tech) must land in expected bands; tune rubric weights and the 70-point gate here, then freeze.
- Endings: pass → practice document generated (in-app view + Markdown/PDF export); fail → motivational report + re-training plan with scheduled drills and Re-test entry.
- **Exit gate:** calibration bands pass; every report field traces to transcript evidence; both endings reachable.

### Phase 6 — Production hardening (Nov 2)
- Budgets and limits: per-user session/token/audio quotas, exponential backoff with jitter on 429 (honour `Retry-After`), usage dashboard from `usage_events` (Spark Standard $1.25 in / $4.25 out per 1M, cached $0.15; STT $0.18/audio-hour — verify at build time, prices may change).
- Security/privacy pass: auth checks on every session route, signed upload URLs, PII log scrubbing, one-click delete, Standard-mode-only assertion in the model client.
- Accessibility and Astryx consistency sweep; empty/error/loading states for every screen; analytics on funnel (setup → start → mock → report) without transcript content.
- **Exit gate:** load sanity (10 concurrent voice sessions), quota/429 behaviour proven, delete flow verified end to end.

### Phase 7 — Submission (Nov 3–4)
- Freeze features Nov 3 noon. Demo script (3 min): one-screen setup → diagnosis insight → comms moment → live voice exchange with barge-in → scored report → practice document. Pre-recorded backup video using the same build.
- Submission pack: deployed URL, repo, model list (`muse-spark-1.3`, `muse-voice-transcribe-1.0`, Kokoro on-device), Indie track + Build for Your World framing, known-limitations note.
- Submit before Nov 4, 9:00 PM ET; keep Nov 4 as buffer only.

## Validation Plan

- **Per phase:** the exit gates above, run against the deployed build (not localhost) from Phase 1 on.
- **Contracts:** schema-validate every structured output in tests; a malformed model response must retry once then fail visibly, never crash a session.
- **Golden personas E2E:** 5 JD personas (Phase 1–2) + 6 calibration candidates (Phase 5) scripted end to end; re-run after any prompt or rubric change.
- **Voice checks:** Phase 4 latency targets measured with timestamps in `usage_events`/client telemetry on real mics, quiet + noisy room; mic-denied, TTS-load-failure, and STT-drop drills each end in a usable fallback.
- **Cost check:** one full session's logged cost (tokens, cached ratio, audio seconds) reported in Phase 6; alert threshold set from it.
- **Pre-submit:** fresh-account run of the exact demo script on the production URL, plus the backup video verified against the same build.

## Risks / Open Questions

- **Assumed, confirm or correct:** custom backend = TypeScript service, PostgreSQL, S3-compatible storage, magic-link/OAuth auth. You confirmed "Next.js + custom backend" without DB/auth/host detail; changing any of these re-opens Phase 0 only.
- **Astryx is beta** (open-sourced 2026): pin exact versions, keep components to the documented set, and keep custom CSS minimal so an Astryx upgrade or a single-component workaround stays cheap. If Astryx blocks a needed component, the fallback is the closest Astryx primitive — not a second UI library.
- **Any-job scope is the top quality risk:** generic rubrics can go shallow outside tech. Mitigation is Phase 2's JD-derived sub-criteria + Phase 5 cross-domain calibration; if bands fail for non-tech personas, narrow demo personas, not the architecture.
- **Kokoro first load** (model download in browser) can stall the first spoken reply: mitigated by loading during setup (Phase 4) and captions fallback; offline-after-first-load is a demo plus.
- **Team-shared rate limits:** Spark Standard 3,000 RPM / 4M TPM per team and 256 concurrent STT streams are comfortable for judging traffic, but quotas (Phase 6) protect the demo account on submission day.
- **Open question (non-blocking):** target demo persona for the submission video — default is a SWE candidate (FAANG-strict preset) because probing depth demos best, with one non-tech persona as the any-JD proof.

## Sources

- https://cerebralvalley.ai/e/meta-ai-developer-hackathon
- https://dev.meta.ai/docs/models
- https://dev.meta.ai/docs/quickstart
- https://dev.meta.ai/docs/speech-to-text
- https://dev.meta.ai/docs/structured-output
- https://dev.meta.ai/docs/prompt-caching
- https://dev.meta.ai/docs/pricing-rate-limits
- https://github.com/facebook/astryx
