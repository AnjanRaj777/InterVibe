# InterVibe — Voice-First AI Mock Interview Copilot

Practice any job interview by talking to an AI interviewer that knows your resume and the job description.

Upload your resume, paste the JD, hit **Start** — InterVibe diagnoses what you know, trains your gaps (including intro and storytelling, if you want), runs a live voice mock interview, scores every answer with evidence, and either builds you a re-training plan or hands you a practice document.

Built for the [Meta Global AI Developer Hackathon](https://cerebralvalley.ai/e/meta-ai-developer-hackathon) — Indie track, **Build for Your World**.

## How it works

```text
Sign in → one setup screen (resume + JD + Start)
   → Diagnose (adaptive skill check vs JD must-haves)
   → Prep plan (ordered modules per gap)
   → Optional: intro / communication / storytelling training
   → Teach + drill (FAANG-depth follow-ups, per-answer scores)
   → Live voice mock (timed, adaptive difficulty)
   → Scored report → pass: practice document | fail: re-training plan + re-test
```

One setup screen, one **Start** button. No multi-upload maze.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js App Router (TypeScript) + Astryx components only |
| Backend | Custom TypeScript API service (owns all model keys, session state machine, scoring) |
| Data | PostgreSQL + S3-compatible storage (assumed, swappable behind a repository layer) |
| LLM | Muse Spark 1.3 (`muse-spark-1.3`) via Meta Model API, Standard mode |
| Speech-to-text | Muse Voice Transcribe (`muse-voice-transcribe-1.0`), realtime WebSocket, native endpointing |
| Text-to-speech | Kokoro, on-device in the browser (`kokoro-js`, WebGPU/WASM), zero TTS API cost |

Key engineering calls: keys live server-side only; turn detection comes from the Transcribe model's native endpointing (no hand-rolled VAD); every machine-read artifact (profile, diagnosis, plan, scores, report) is a structured JSON-schema output; long sessions stay cheap via Meta prefix caching plus summary compaction after ~6k tokens / 12 turns.

## Status

Planning complete — see [architecture.md](architecture.md) for the full phase-by-phase build plan (Phases 0–7, Oct 26 → Nov 4). Implementation starts at Phase 0.

## Getting started (Phase 0 target)

```powershell
$env:MODEL_API_KEY = "<your-meta-model-api-key>"
npm install
npm run dev        # frontend
npm run dev:api    # backend service
```

Copy `.env.example` to `.env` and fill in database, storage, and auth values. Never commit real keys.

## Docs

- [architecture.md](architecture.md) — production plan, state machine, prompts, cost controls, validation gates

## License

TBD
