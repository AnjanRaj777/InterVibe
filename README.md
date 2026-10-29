# InterVibe 🎙️ — Voice-First AI Mock Interview Copilot

> Practice any job interview by conversing naturally with an AI interviewer calibrated to your resume and target job description.

[![CI Status](https://github.com/AnjanRaj777/InterVibe/actions/workflows/ci.yml/badge.svg)](https://github.com/AnjanRaj777/InterVibe/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-green?logo=node.js)
![Meta Model API](https://img.shields.io/badge/Meta%20AI-Muse%20Spark%201.3-8A2BE2)
![License](https://img.shields.io/badge/License-MIT-brightgreen)

InterVibe is an autonomous, voice-driven mock interview copilot engineered for the **Meta Global AI Developer Hackathon** (Indie Track · *Build for Your World*). 

Unlike generic interview bots with static question lists, InterVibe ingests your real resume and target Job Description (JD), diagnoses your skills against the role's must-haves, trains your gaps with FAANG-depth follow-up probing, conducts a timed voice interview with real-time barge-in capability, and provides rubric-backed scoring with verified transcript quotes.

---

## 🌟 Key Highlights

- **⚡ Zero-Friction Setup**: One single setup card for resume upload (PDF, DOCX, TXT), JD input, and a single **Start** button. No multi-screen onboarding maze.
- **🗣️ Natural Real-Time Voice Loop**: Built on bidirectional WebSockets with live partial transcription, sub-second latency, and native barge-in (interrupt the AI interviewer anytime you speak).
- **🎯 Precision Diagnosis & Prep Planner**: Dynamically extracts `CandidateProfile` and `JDProfile`, identifying verified strengths and skill gaps, then generates a tailored `PrepPlan`.
- **📊 Rubric-Backed Scoring Gate**: Evaluates answers across 5 core dimensions (*Depth/Correctness, Structure, Communication Clarity, JD Relevance, Evidence/Examples*). Every score references exact transcript quotes.
- **🔄 Dual Endings**: 
  - **Pass (≥ 70%)**: Instantly renders and exports a personalized Master Practice Document (STAR stories, model answers, keywords).
  - **Needs Work (< 70%)**: Delivers a motivational feedback report, targeted drill schedule, and seamless 1-click re-test entry.
- **🎧 High-Performance Synthesis**: Hybrid TTS architecture supporting zero-cost client-side synthesis via **Kokoro** (WebGPU/WASM) and Piper, plus cloud ultra-low latency streaming via **Groq Orpheus**.
- **🔒 Enterprise-Grade Privacy & Cost Control**: All model keys remain strictly server-side. Implements Meta prefix prompt caching and automatic context compaction after ~12 turns.

---

## 🏗️ System Architecture & Workflow

```text
 ┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
 │  Resume Upload  │  ───► │ Resume & JD     │  ───► │ Skill Diagnosis  │
 │  + Target JD    │       │ Parsing (JSON)  │       │ & Prep Planner   │
 └─────────────────┘       └─────────────────┘       └─────────┬────────┘
                                                               │
                                                               ▼
 ┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
 │  Dual Outcome:  │  ◄─── │ Multi-Dimension │  ◄─── │ Live Voice Mock  │
 │  Practice Doc   │       │ Scoring Gate    │       │ (Barge-in / STT) │
 │  or Re-training │       │ (70-pt bar)     │       │                  │
 └─────────────────┘       └─────────────────┘       └──────────────────┘
```

### Full State Machine
```text
setup ──► parsed ──► diagnosing ──► plan_ready ──► comms_training? ──► drilling ──► live_mock ──► scored
                                                                                                    │
                                                    ┌───────────────────────────────────────────────┴────────────────────────────┐
                                                    ▼ (Score >= 70)                                                              ▼ (Score < 70)
                                            document_ready                                                               retraining ──► re-test
```

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | **Next.js 16 (App Router)** | TypeScript, React 19, Turbopack, Dark Mode |
| **Design System** | **Astryx Design System** | `@astryxdesign/core`, `@astryxdesign/theme-neutral`, StyleX |
| **Backend API** | **Node.js + Hono** | High-performance custom TypeScript API service on port `8787` |
| **Contracts** | **`@intervibe/contracts`** | Shared strict TypeScript interfaces & Zod validation schemas |
| **Database** | **PostgreSQL** | Supabase connection pooling or local PostgreSQL |
| **Object Storage**| **S3-Compatible / MinIO** | Secure resume and document storage |
| **LLM Reasoning** | **Muse Spark 1.3** | Meta Model API (`muse-spark-1.3`) in **Standard Mode** |
| **Speech-to-Text**| **Muse Voice Transcribe**| `muse-voice-transcribe-1.0` realtime WebSocket with native endpointing |
| **Text-to-Speech**| **Kokoro / Groq / Piper** | On-device WebGPU/WASM worker (`kokoro-js`) + Groq Orpheus API |

---

## 📂 Monorepo Structure

```text
mock-interview/
├── apps/
│   ├── api/                   # Custom backend service (port 8787)
│   │   ├── src/
│   │   │   ├── auth/          # Authentication & session storage
│   │   │   ├── db/            # PostgreSQL migrations & connection pool
│   │   │   ├── diagnose/      # Adaptive skill check & gap diagnosis
│   │   │   ├── drill/         # Interactive question prompts & follow-ups
│   │   │   ├── ingest/        # Resume (PDF/DOCX/TXT) & JD parsing engine
│   │   │   ├── meta/          # Meta Model API client & prompt cache manager
│   │   │   ├── sessions/      # Interview session state machine
│   │   │   ├── storage/       # S3 storage layer
│   │   │   ├── tts/           # Groq TTS client
│   │   │   └── voice/         # Realtime WebSocket voice pipeline
│   │   └── test/              # Vitest unit & integration test suites
│   └── web/                   # Next.js web application (port 3000)
│       ├── app/
│       │   ├── diagnose/      # Diagnostic quiz interface
│       │   ├── mock/          # Live voice interview cockpit with barge-in
│       │   └── setup/         # Single-screen intake card
│       └── lib/               # Audio workers (Kokoro, Piper), WebRTC/WS clients
├── packages/
│   └── contracts/             # Shared Zod schemas, types, and chunking logic
├── db/
│   └── migrations/            # SQL migration files
├── fixtures/                  # Golden candidate personas & audio test clips
├── startup.bat                # Windows 1-click startup automation script
└── docker-compose.yml         # Local Postgres & MinIO containers
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v22.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Meta Model API Key**: For Muse Spark and Muse Voice Transcribe
- **PostgreSQL Database**: Local or hosted (e.g., Supabase)

### 1. Clone & Configure

```bash
git clone https://github.com/AnjanRaj777/InterVibe.git
cd InterVibe
```

Copy the example environment configuration:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```dotenv
# Meta Model API key (Standard mode only)
MODEL_API_KEY=your_meta_model_api_key

# PostgreSQL connection string
DATABASE_URL=postgres://user:password@localhost:5432/intervibe

# S3 / MinIO storage
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=intervibe-docs
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin

# Auth configuration
AUTH_SECRET=a_random_32_character_string_for_sessions
APP_URL=http://localhost:3000
PORT=8787

# Optional: Groq API key for low-latency cloud TTS
GROQ_API_KEY=your_groq_api_key
```

### 2. Fast Launch (Windows)

Double-click `startup.bat` or run:

```cmd
startup.bat
```

The script automatically:
1. Validates prerequisites and `.env` values.
2. Installs workspace dependencies.
3. Compiles the `@intervibe/contracts` package.
4. Applies PostgreSQL schema migrations.
5. Boots both the API (`http://localhost:8787`) and Web client (`http://localhost:3000`).

### 3. Manual Launch (Cross-Platform)

```bash
# Install dependencies and build shared contracts
npm install
npm run build --workspace=@intervibe/contracts

# Run DB migrations
npm run migrate --workspace=@intervibe/api

# Start backend service (terminal 1)
npm run dev --workspace=@intervibe/api

# Start frontend application (terminal 2)
npm run dev --workspace=@intervibe/web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Validation

InterVibe maintains a strict test-driven development workflow with automated CI verification:

```bash
# Typecheck all monorepo workspaces
npm run typecheck

# Execute unit and contract test suites (Vitest)
npm run test

# Lint code across workspaces
npm run lint

# Production build verification
npm run build
```

### Voice Pipeline Latency Benchmarks

Our test suite rigorously verifies voice exchange latencies against defined targets:
- **First Audio Response**: Measured $\le 2500\text{ ms}$ (p95 latency achieves $\sim 37\text{ ms}$ on local mock streams).
- **Barge-In Interruption Detection**: Measured $\le 300\text{ ms}$ (p95 latency achieves $\sim 1\text{ ms}$).

---

## 🛡️ Security & Privacy

- **Server-Side API Key Shield**: The browser never receives or stores `MODEL_API_KEY` or cloud credentials.
- **Meta Standard Mode**: Strictly runs in Standard Mode to guarantee user resumes, JDs, and transcripts are never retained or trained on by Meta models.
- **PII Scrubbing**: Document extraction isolates parsed data without recording or leaking PII in logs.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
