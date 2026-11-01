# System Architecture & Component Blueprint: InterVibe AI Verbal Mock Interview Platform

> **Comprehensive Technical Architecture, End-to-End Audio DSP Pipeline, 3D WebGL Avatar Engine, Security Hardening, and Reproduction Blueprint**  
> *Engineered for the Meta AI Developer Hackathon*  
> **Stack**: Next.js 16.2.6 (App Router) • React 19.2.4 • TypeScript 5.7 • Three.js WebGL • Supabase SSR & PostgreSQL • Tailwind CSS v4 • Meta Muse Spark 1.3 • Deepgram Aura

---

## 📑 Table of Contents

1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [End-to-End Real-Time Verbal Loop & Lifecycle](#2-end-to-end-real-time-verbal-loop--lifecycle)
3. [Complete Component & Route Inventory](#3-complete-component--route-inventory)
4. [Photorealistic 3D Avatar Engine & Cloud Streaming](#4-photorealistic-3d-avatar-engine--cloud-streaming)
5. [Push-to-Talk Audio DSP & Resampling Pipeline](#5-push-to-talk-audio-dsp--resampling-pipeline)
6. [Post-Interview Diagnostics & Telemetry Engine](#6-post-interview-diagnostics--telemetry-engine)
7. [Security Architecture & Threat Mitigation Matrix](#7-security-architecture--threat-mitigation-matrix)
8. [Supabase Database Schema & Data Models](#8-supabase-database-schema--data-models)
9. [10 Switchable Design Themes System](#9-10-switchable-design-themes-system)
10. [Production & Hackathon Recreation Blueprint](#10-production--hackathon-recreation-blueprint)

---

## 1. High-Level System Architecture

InterVibe is architected as an enterprise-grade, decoupled real-time system combining client-side Web Audio DSP, client-side Three.js WebGL 3D rendering, server-side Next.js 16 Edge Route Proxy (`src/proxy.ts`), secure serverless API Route Handlers, a Supabase PostgreSQL persistence tier, and a multi-cloud AI inference mesh.

```mermaid
flowchart TD
    subgraph ClientTier ["1. Client Browser (Next.js 16 / React 19)"]
        UI["Interview Studio UI\n(src/app/dashboard/interview/page.tsx)"]
        Mic["Microphone\n(Web Audio API - 32-bit Float)"]
        DSP["Client-Side DSP Resampler\n(float32To16kMonoWav - 16kHz s16le)"]
        ThreeCanvas["Three.js 3D WebGL Engine\n(ARKit Blendshapes + Dynamic Lighting)"]
        HTMLAudio["HTML5 Audio Playback Node\n(Audio Amplitude Normalization)"]
        ZustandStores["Zustand Client Stores\n(auth-store & session-store)"]
    end

    subgraph SecurityBoundary ["2. Server-Side Security & Routing Boundary"]
        Middleware["Next.js 16 Edge Route Proxy\n(src/proxy.ts - Session Refresh & Route Guards)"]
        SecHeaders["HTTP Security Headers\n(next.config.ts: CSP, HSTS, X-Frame-Options)"]
    end

    subgraph ServerAPIs ["3. Next.js Serverless Route Handlers (src/app/api)"]
        ResumeParser["POST /api/extract-resume\n(pdf2json, 5MB Ceiling, %PDF- Magic Byte)"]
        STTRoute["POST /api/stt\n(Meta Muse Transcribe / RIFF Validator)"]
        ChatRoute["POST /api/chat\n(Meta Muse Spark 1.3 LLM / Model Allowlist)"]
        TTSRoute["POST /api/tts\n(Deepgram Aura Streaming / Voice Allowlist)"]
        EvalRoute["POST /api/analyze-interview\n(Meta Muse Evaluator / JSON Schema Guard)"]
        PerxonaRoute["GET /api/perxona/session\n(XRSPACE Perxona Cloud Bridge)"]
    end

    subgraph PersistenceLayer ["4. Supabase Backend Infrastructure"]
        SupaAuth["Supabase GoTrue Auth\n(SSR Cookie Validation & OAuth)"]
        DBProfiles["PostgreSQL: public.profiles\n(Tiers, Credits, Role Settings)"]
        DBSessions["PostgreSQL: public.interview_sessions\n(Scores, Metrics, Transcripts)"]
        DBMessages["PostgreSQL: public.session_messages\n(Granular Conversation Turns)"]
        InterService["Supabase Interview Service\n(src/lib/supabase/interview-service.ts)"]
    end

    subgraph ExternalAIMesh ["5. External AI Cloud Mesh"]
        MetaSpark["Meta Muse Spark 1.3 Contributor\n(Low-Latency LLM Inference)"]
        MetaTranscribe["Meta Muse Voice Transcribe 1.0\n(16kHz Mono Speech-to-Text)"]
        DeepgramAura["Deepgram Aura Neural TTS\n(Asteria, Orion, Luna Streams)"]
        GroqFailover["Groq Cloud Failover\n(Whisper Large v3 / LLaMA 3.3 70B)"]
        PerxonaCloud["XRSPACE Perxona Cloud\n(Interactive Video Stream)"]
    end

    %% Client and Middleware flow
    UI -->|"Session Request"| Middleware
    Middleware -->|"Authenticated"| UI
    Middleware -->|"Validate Cookies"| SupaAuth

    %% Audio Recording Pipeline
    Mic -->|"Raw 44.1k/48k Audio"| DSP
    DSP -->|"16kHz Mono WAV Blob"| STTRoute
    STTRoute -->|"Signed Request"| MetaTranscribe
    MetaTranscribe -.->|"Automatic Failover"| GroqFailover
    STTRoute -->|"Transcript String"| UI

    %% Dialogue Generation Pipeline
    UI -->|"History + Resume + JD"| ChatRoute
    ChatRoute -->|"Signed Request"| MetaSpark
    MetaSpark -.->|"Automatic Failover"| GroqFailover
    ChatRoute -->|"Interviewer Response"| UI

    %% Audio Playback & Lip Sync
    UI -->|"Response Text"| TTSRoute
    TTSRoute -->|"Streaming Call"| DeepgramAura
    TTSRoute -->|"MPEG Audio Stream"| HTMLAudio
    HTMLAudio -->|"Amplitude Telemetry"| ThreeCanvas

    %% Document Parsing
    UI -->|"PDF Resume"| ResumeParser

    %% Diagnostic & Persistence Pipeline
    UI -->|"End Session (Transcript)"| EvalRoute
    EvalRoute -->|"JSON Diagnostic Schema"| MetaSpark
    EvalRoute -->|"Parsed Analysis"| UI
    UI -->|"Persist Session"| InterService
    InterService -->|"IDOR Verified Insert"| DBSessions
    InterService -->|"Insert Turns"| DBMessages
    ZustandStores -->|"Local Cache Backup"| UI
```

---

## 2. End-to-End Real-Time Verbal Loop & Lifecycle

The platform's flagship capability is its conversational verbal loop that mirrors a live technical cross-examination by an engineering manager or recruiter.

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate
    participant Browser as Browser Client (Studio)
    participant DSP as Web Audio Resampler
    participant ThreeAvatar as 3D WebGL Avatar
    participant Middleware as Next.js 16 Edge Proxy (src/proxy.ts)
    participant Server as Next.js API Routes
    participant MetaAI as Meta Model API
    participant Deepgram as Deepgram Aura
    participant Supabase as Supabase DB

    Note over Candidate, Supabase: Phase 1: Onboarding, Document Parsing & Persona Config
    Candidate->>Browser: Selects Resume (PDF) & Configures Role / Seniority
    Browser->>Server: POST /api/extract-resume (multipart/form-data)
    Server->>Server: Validate 5MB ceiling & %PDF- magic bytes
    Server-->>Browser: Return raw extracted resume text
    Candidate->>Browser: Selects Interviewer (Sarah / Michael / Emma) and Clicks Start

    Note over Candidate, ThreeAvatar: Phase 2: Session Initialization & Welcome Greeting
    Browser->>Server: POST /api/chat (Initial system prompt with candidate memory)
    Server->>MetaAI: Request opening question (temperature: 0.1)
    MetaAI-->>Server: "Hello Alex, welcome! Could you describe a challenging project..."
    Server-->>Browser: Assistant text response
    Browser->>Server: POST /api/tts (Greeting text)
    Server->>Deepgram: Stream TTS (Aura Asteria / Orion / Luna)
    Deepgram-->>Server: audio/mpeg stream
    Server-->>Browser: Audio buffer stream
    Browser->>ThreeAvatar: Play audio + Drive ARKit blendshapes (mouthOpen, breathing)
    ThreeAvatar-->>Candidate: Candidate hears natural voice and sees animated avatar speak

    Note over Candidate, DSP: Phase 3: Push-to-Talk Speech & In-Browser Audio DSP
    Candidate->>Browser: Holds Spacebar (Starts Push-to-Talk)
    Browser->>ThreeAvatar: Transition state to 'listening' (head tilt, attentive eyes)
    Candidate->>Browser: Speaks architectural explanation...
    Candidate->>Browser: Releases Spacebar
    Browser->>DSP: Flush 32-bit float audio buffer
    DSP->>DSP: Linear downsampling to 16,000 Hz 16-bit mono WAV

    Note over Browser, MetaAI: Phase 4: Sub-Second STT & Adaptive Conversational Reasoning
    Browser->>Server: POST /api/stt (WAV payload)
    Server->>Server: Verify Supabase auth cookie & RIFF headers
    Server->>MetaAI: Transcribe via Meta Muse Voice Transcribe 1.0
    MetaAI-->>Server: Transcript: "We implemented Redis Lua scripts for idempotency..."
    Server-->>Browser: Return transcript
    Browser->>ThreeAvatar: Transition state to 'thinking' (contemplative animation)
    Browser->>Server: POST /api/chat (History + latest answer)
    Server->>MetaAI: Generate follow-up challenge with Meta Muse Spark 1.3
    MetaAI-->>Server: "That covers idempotency. But what happens during a network partition?"
    Server-->>Browser: AI follow-up response

    Note over Browser, Deepgram: Phase 5: Voice Stream Synthesis & Loop Continuation
    Browser->>Server: POST /api/tts (AI response text)
    Server->>Deepgram: Stream synthesized voice
    Deepgram-->>Server: audio/mpeg
    Server-->>Browser: Play audio through HTML5 Audio node
    Browser->>ThreeAvatar: Transition state to 'speaking' (lip-sync blendshapes)
    ThreeAvatar-->>Candidate: Candidate hears interviewer challenge

    Note over Candidate, Supabase: Phase 6: Post-Interview Diagnostic Evaluation & Sync
    Candidate->>Browser: Clicks "End Interview"
    Browser->>Server: POST /api/analyze-interview (Full transcript + JD + duration)
    Server->>MetaAI: Execute strict diagnostic evaluation JSON schema
    MetaAI-->>Server: Returns Scores (Overall, Depth, Clarity, Architecture), Strengths, Drills
    Server-->>Browser: Diagnostic payload
    Browser->>Browser: Open Diagnostics Dialog Modal
    Browser->>Supabase: interview-service.ts -> Persist session & turns (IDOR verified)
```

---

## 3. Complete Component & Route Inventory

### A. Client-Side Pages & Route Handlers

| Route | Source File | Core Capabilities & UI Elements |
| :--- | :--- | :--- |
| `/` | [`src/app/page.tsx`](file:///src/app/page.tsx) | **Modern Landing Page**: Dark neon aesthetic (`#0f1211`), dynamic Bento Grid (6 illustrations), interactive pricing matrix, social proof badges, live interview room preview card, and Framer Motion viewport reveals. |
| `/auth/login` | [`src/app/auth/login/page.tsx`](file:///src/app/auth/login/page.tsx) | **Authentication Portal**: Email/password sign-in, OAuth providers (GitHub & Google), session cookie exchange via `@supabase/ssr`, remember-me state, and redirect validation. |
| `/auth/signup` | [`src/app/auth/signup/page.tsx`](file:///src/app/auth/signup/page.tsx) | **Candidate Onboarding**: Name, email, password, target job role, and seniority level initialization synced to Supabase `public.profiles`. |
| `/auth/callback` | [`src/app/auth/callback/route.ts`](file:///src/app/auth/callback/route.ts) | **OAuth & Auth Callback**: Server-side exchange of OAuth code for persistent session cookies with open-redirect defense and host-header sanitization. |
| `/dashboard/overview` | [`src/app/dashboard/overview/page.tsx`](file:///src/app/dashboard/overview/page.tsx) | **Performance Telemetry Dashboard**: Aggregate KPI cards (Interviews Completed, Avg Verbal Score, Practice Speaking Time, Readiness Index), competency progress bars, and historical session logs with transcript inspection. |
| `/dashboard/interview` | [`src/app/dashboard/interview/page.tsx`](file:///src/app/dashboard/interview/page.tsx) | **Interactive Interview Studio**: 3-step state machine (`upload` → `configure` → `interview`), Push-to-Talk (Spacebar), 3D WebGL avatar viewport, live chat transcript feed, and post-session evaluation diagnostics modal. |
| `/dashboard/billing` | [`src/app/dashboard/billing/page.tsx`](file:///src/app/dashboard/billing/page.tsx) | **Monetization & Plans**: 4 tiers (Free Starter, Hustler, Pro Unlimited, Teams Enterprise), billing cycle toggle (monthly/annual), interactive invoice ledger dialog, and one-click CSV export. |
| `/dashboard/profile` | [`src/app/dashboard/profile/page.tsx`](file:///src/app/dashboard/profile/page.tsx) | **Profile & Appearance Settings**: Candidate role configuration, seniority adjustment, 10 switchable design theme presets, light/dark mode switch, avatar selection, and session storage management. |

---

### B. Backend API Route Handlers

All API route handlers are located in [`src/app/api/`](file:///src/app/api/) and enforce server-side authentication through Supabase session cookie validation (`createClient()` from `@/lib/supabase/server`).

#### 1. Resume Parser (`POST /api/extract-resume`)
- **File**: [`src/app/api/extract-resume/route.ts`](file:///src/app/api/extract-resume/route.ts)
- **Security**: Bound by a strict **5MB ceiling** (`MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024`), MIME verification (`application/pdf`), and magic-byte header validation (`%PDF-`).
- **Processing**: Streams file into memory, invokes `pdf2json` in single-pass mode (`new PDFParser(null, 1)`), cleans URI-encoded text entities, and returns structured resume text.
- **Output**: `{ status: 'success', text: string }`.

#### 2. Speech-to-Text (`POST /api/stt`)
- **File**: [`src/app/api/stt/route.ts`](file:///src/app/api/stt/route.ts)
- **Security**: 10MB payload ceiling, RIFF/WAVE header chunk parsing, and audio format validation.
- **Processing**:
  - Validates PCM audio samples.
  - Automatically resamples non-conforming audio buffers to 16,000Hz mono s16le via `resampleWavTo16kMono()`.
  - Dispatches to **Meta Muse Voice Transcribe 1.0** via `POST /v1/audio/transcriptions`.
  - Automatic fallback to **Groq Whisper Large v3** if primary fails.
- **Output**: `{ transcription: string, provider: string }`.

#### 3. LLM Dialogue Engine (`POST /api/chat`)
- **File**: [`src/app/api/chat/route.ts`](file:///src/app/api/chat/route.ts)
- **Security**: Model allowlisting (`ALLOWED_MODELS`), message count bounding (max 40 turns), and 4,000 character turn caps.
- **Processing**: Calls **Meta Muse Spark 1.3 Contributor** (`https://api.meta.ai/v1/chat/completions`) with temperature 0.1 and max tokens 1500. Automatic fallback to Groq LLaMA 3.3 70B if needed.
- **Output**: `{ response: string, provider: string, model: string }`.

#### 4. Neural Voice Synthesis (`POST /api/tts`)
- **File**: [`src/app/api/tts/route.ts`](file:///src/app/api/tts/route.ts)
- **Security**: Voice allowlist (`ALLOWED_TTS_MODELS`: Asteria, Orion, Luna, etc.) and text sanitization (stripping code blocks, markdown symbols, and capping at 1200 characters).
- **Processing**: Direct authenticated streaming proxy to Deepgram Aura (`https://api.deepgram.com/v1/speak?model=aura-asteria-en`).
- **Output**: Streamed binary `audio/mpeg` response.

#### 5. Diagnostic Evaluation Engine (`POST /api/analyze-interview`)
- **File**: [`src/app/api/analyze-interview/route.ts`](file:///src/app/api/analyze-interview/route.ts)
- **Security**: Transcript character ceiling (25,000 chars) and strict JSON structure validation.
- **Processing**: Analyzes candidate answers against target job description and seniority bar using Meta Muse Spark 1.3.
- **Output**: Evaluated JSON payload with 4 quantified scores, executive summary, strengths, improvements, and actionable drills.

#### 6. XRSPACE Perxona Cloud Bridge (`GET /api/perxona/session`)
- **File**: [`src/app/api/perxona/session/route.ts`](file:///src/app/api/perxona/session/route.ts)
- **Processing**: Securely generates presentation session tickets against `PERXONA_API_BASE_URL` using server-side secret keys without exposing credentials to the client.

---

## 4. Photorealistic 3D Avatar Engine & Cloud Streaming

The avatar rendering system operates in [`src/components/avatar/interactive-avatar.tsx`](file:///src/components/avatar/interactive-avatar.tsx) with a three-layer fallback hierarchy:

```
[XRSPACE Perxona Connect Cloud Stream] ──(Fallback)──► [Local Three.js WebGL 3D Rig] ──(Fallback)──► [2D Reactive Portrait]
```

### A. Three.js WebGL 3D Avatar Engine
- **Renderer Settings**: ACESFilmic tone mapping (`exposure: 1.05`), alpha transparency, anti-aliasing, and pixel ratio clamping (`Math.min(devicePixelRatio, 2)`).
- **Studio 3-Point Lighting Rig**:
  - Diffused warm ambient light (`0xfff5ea`, intensity 1.3).
  - High-angle key light (`0xffffff`, intensity 1.8, position `[1.2, 2.5, 1.8]`).
  - Cool fill light (`0xe2e8f0`, intensity 1.1, position `[-1.4, 1.8, 1.4]`).
  - Electric rim light (`0x38bdf8`, intensity 1.6, position `[0, 2.2, -1.5]`).
- **ARKit Facial Blendshapes**:
  - `mouthOpen`: Driven in real time by speech audio playback amplitude.
  - `mouthSmile` / `mouthSmileLeft` / `mouthSmileRight`: Base smile configured per persona (e.g., Sarah: 0.18, Michael: 0.05).
  - `eyeBlinkLeft` / `eyeBlinkRight`: Natural blinks triggered procedurally every 3-5 seconds.
- **Procedural Kinematics**:
  - Spine breathing motion (`Math.sin(elapsed * 1.5) * 0.015`).
  - Conversational head tilt and nod during speech.
  - Attentive head angle shift when candidate is speaking (`activeState === 'listening'`).

### B. Personas & Character Configurations

| Persona | Archetype & Experience | GLTF Model | Voice Engine & Model | Blendshape Character |
| :--- | :--- | :--- | :--- | :--- |
| **Sarah Chen** | Senior Recruiter • 3 yrs Linear | `/avatars/sarah.glb` | Deepgram Aura Asteria (`aura-asteria-en`) | Warm smile, frequent empathetic head nods |
| **Michael Vance** | Strict EM • 6 yrs Stripe | `/avatars/michael.glb` | Deepgram Aura Orion (`aura-orion-en`) | Stern expression, micro-nods, analytical gaze |
| **Emma Watson** | Tech Lead • 4 yrs DeepMind | `/avatars/emma.glb` | Deepgram Aura Luna (`aura-luna-en`) | Balanced smile, contemplative head tilts |

---

## 5. Push-to-Talk Audio DSP & Resampling Pipeline

Traditional Voice Activity Detection (VAD) fails in complex technical interviews because candidates pause for several seconds while calculating distributed systems trade-offs or concurrency models. InterVibe implements **Direct Push-to-Talk with Client-Side Downsampling**:

### A. Client-Side Linear Downsampler (`float32To16kMonoWav`)

Located directly in [`src/app/dashboard/interview/page.tsx`](file:///src/app/dashboard/interview/page.tsx#L63-L114):

```typescript
function float32To16kMonoWav(samples: Float32Array, sampleRate: number): Blob {
  let finalSamples = samples;
  let finalRate = sampleRate;

  // Linear resample to 16,000 Hz if hardware uses 44.1kHz or 48kHz
  if (sampleRate !== 16000 && sampleRate > 0) {
    const ratio = sampleRate / 16000;
    const newLen = Math.floor(samples.length / ratio);
    const resampled = new Float32Array(newLen);
    for (let i = 0; i < newLen; i++) {
      const idx = i * ratio;
      const lo = Math.floor(idx);
      const hi = Math.min(lo + 1, samples.length - 1);
      const frac = idx - lo;
      resampled[i] = samples[lo] + frac * (samples[hi] - samples[lo]);
    }
    finalSamples = resampled;
    finalRate = 16000;
  }

  // Generates 44-byte standard RIFF PCM header with 16-bit mono encoding
  const dataLength = finalSamples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  // Writes RIFF, WAVE, fmt (16, PCM=1, Mono=1, 16000Hz, 32000 byte-rate, 16-bit), data chunk
  // Clamps and writes signed 16-bit integers
  return new Blob([buffer], { type: 'audio/wav' });
}
```

### B. Server-Side Fallback Resampler (`resampleWavTo16kMono`)
In [`src/app/api/stt/route.ts`](file:///src/app/api/stt/route.ts#L13-L100), incoming binary buffers are parsed at the RIFF chunk level. If an un-downsampled buffer arrives, the server performs float interpolation on the PCM samples and repacks a clean 44-byte 16,000Hz mono WAV before forwarding to Meta Muse Voice Transcribe.

---

## 6. Post-Interview Diagnostics & Telemetry Engine

Upon session termination, [`/api/analyze-interview`](file:///src/app/api/analyze-interview/route.ts) invokes Meta Muse Spark 1.3 with a constrained JSON schema:

```json
{
  "overallScore": 88,
  "technicalDepthScore": 90,
  "clarityScore": 86,
  "architectureScore": 89,
  "executiveSummary": "Candidate demonstrated Staff-level grasp of distributed event streams and idempotency guarantees using Redis Lua scripts.",
  "strengths": [
    "Precise articulation of Redis Lua scripts for atomic state changes",
    "Quantified throughput metrics (50k events/sec) and failover recovery"
  ],
  "improvements": [
    "Clarify split-brain consensus handling during network partitions",
    "Incorporate distributed trace instrumentation (OpenTelemetry)"
  ],
  "actionPlan": [
    "Execute drill: Designing multi-region active-active database replication",
    "Review Raft consensus state machine edge-cases"
  ]
}
```

This telemetry is rendered immediately in the post-interview dialog modal and persisted directly to the candidate's Supabase dashboard.

---

## 7. Security Architecture & Threat Mitigation Matrix

Following an exhaustive security audit (detailed in [`AUDIT_REPORT.md`](file:///AUDIT_REPORT.md) and [`SECURITY.md`](file:///SECURITY.md)), InterVibe implements comprehensive defensive controls:

| Security Vector | Threat Scenario | Applied Mitigation | Relevant File |
| :--- | :--- | :--- | :--- |
| **API Quota Protection** | Unauthenticated bots draining Meta AI & Deepgram quotas | Supabase SSR session cookie check (`supabase.auth.getUser()`) before processing | `src/app/api/chat/route.ts`<br>`src/app/api/stt/route.ts`<br>`src/app/api/tts/route.ts` |
| **Route Authorization** | Direct URL access to `/dashboard/*` without active session | Next.js 16 Edge Route Proxy (`src/proxy.ts`, replacing deprecated `middleware.ts`) redirecting unauthenticated users to `/auth/login` | [`src/proxy.ts`](file:///src/proxy.ts) |
| **IDOR Protection** | Malicious users querying or modifying other candidates' sessions | Session ownership verification (`auth.uid() === userId`) on all persistence calls | [`src/lib/supabase/interview-service.ts`](file:///src/lib/supabase/interview-service.ts) |
| **Malicious PDF DoS** | Massive files or polyglot exploits crashing `pdf2json` | 5MB size ceiling, MIME verification, and `%PDF-` magic-byte verification | [`src/app/api/extract-resume/route.ts`](file:///src/app/api/extract-resume/route.ts) |
| **Audio Memory Flooding** | High-memory PCM resampler exhaustion | 10MB upload cap and RIFF chunk boundary validation | [`src/app/api/stt/route.ts`](file:///src/app/api/stt/route.ts) |
| **Open Redirects** | Phishing redirect via `?next=//evil.com` query parameter | Strict single-slash relative path validation rejecting scheme and authority injection | [`src/app/auth/callback/route.ts`](file:///src/app/auth/callback/route.ts) |
| **Clickjacking & XSS** | Hostile frame embedding and content sniffing | Enforced `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and HSTS | [`next.config.ts`](file:///next.config.ts) |
| **Information Leakage** | Leaking provider API keys or stack traces in error bodies | Sanitized client error responses; technical errors logged server-side only | All API Route Handlers |
| **Model Spoofing** | Passing unverified or expensive model identifiers | Strict allowlists for permitted LLM and TTS model identifiers | `src/app/api/chat/route.ts`<br>`src/app/api/tts/route.ts` |

---

## 8. Supabase Database Schema & Data Models

InterVibe utilizes Supabase PostgreSQL for authentication, user profiles, interview telemetry, and conversation turn logs:

```sql
-- 1. Candidate Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    target_role TEXT DEFAULT 'Senior Full Stack Developer',
    seniority TEXT DEFAULT 'Senior / Staff (5-8+ yrs)',
    subscription_tier TEXT DEFAULT 'free',
    credits_remaining INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Interview Sessions Table
CREATE TABLE public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_role TEXT NOT NULL,
    interviewer_voice TEXT,
    duration_seconds INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0,
    overall_score INTEGER,
    technical_depth_score INTEGER,
    clarity_score INTEGER,
    architecture_score INTEGER,
    analysis JSONB,
    audio_recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Conversation Messages / Dialogue Turns Table
CREATE TABLE public.session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Candidates can only access their own data
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users view own sessions" ON public.interview_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.interview_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own session messages" ON public.session_messages 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_messages.session_id AND user_id = auth.uid())
);
CREATE POLICY "Users insert own session messages" ON public.session_messages 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_messages.session_id AND user_id = auth.uid())
);
```

---

## 9. 10 Switchable Design Themes System

InterVibe features 10 fully customized design themes accessible via the Profile & Settings menu, with native Light and Dark mode support:

| Preset Name | Identifier | Visual Identity & Color Palette |
| :--- | :--- | :--- |
| **▲ Vercel** | `vercel` | Ultra-clean minimalist monochrome with sharp border radii and grayscale accents |
| **⚡ Supabase** | `supabase` | Dark charcoal background with radiant emerald green (`#3ECF8E`) accents |
| ** Claude** | `claude` | Warm terracotta, soft amber, and natural parchment aesthetic inspired by Anthropic |
| **🧘 Zen** | `zen` | Calming slate, soft sage, and muted teal tones designed to reduce interview anxiety |
| **⬛ Mono** | `mono` | High-contrast brutalist pure black and stark white styling |
| **💬 WhatsApp** | `whatsapp` | Rich chat-focused emerald headers, subtle message bubble contrasts, and clean borders |
| **🚀 Astro Vista**| `astro-vista` | Galactic deep space aesthetic with neon purple and cosmic cyan highlights |
| **🌿 Light Green**| `light-green`| Fresh botanical mint and soft sage palette with organic contrast |
| **📐 Neobrutalism**| `neobrutualism`| Bold pop borders, vibrant retro cards, and expressive hard drop-shadows |
| **📝 Notebook** | `notebook` | Ruled paper background, warm sepia tones, and academic notebook styling |

---

## 10. Production & Hackathon Recreation Blueprint

To reproduce or deploy InterVibe from scratch:

### Step 1: Project Setup
```bash
npx create-next-app@latest intervibe --typescript --tailwind --app --eslint
cd intervibe
npm install @supabase/ssr @supabase/supabase-js three @types/three zustand sonner lucide-react framer-motion pdf2json class-variance-authority clsx tailwind-merge next-themes @tabler/icons-react
```

### Step 2: Environment Configuration
Create `.env.local` in the project root:
```env
# Meta AI Model API (Muse Spark 1.3 LLM & Muse Voice Transcribe STT)
MODEL_API_KEY=your_meta_model_api_key
META_API_BASE=https://api.meta.ai/v1
SPARK_MODEL_ID=muse-spark-1.3-contributor
TRANSCRIBE_MODEL_ID=muse-voice-transcribe-1.0
MUSE_API_KEY=your_meta_muse_api_key

# Deepgram Aura TTS
DEEPGRAM_API_KEY=your_deepgram_api_key

# Groq Cloud (Automated Failover)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

# Supabase Auth, PostgreSQL & Storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres

# App Metadata
NEXT_PUBLIC_APP_NAME=InterVibe
APP_URL=https://inter-vibe.vercel.app
AUTH_SECRET=your_32_character_auth_secret
```

### Step 3: Run Database Migrations
Copy the SQL schema from [Section 8](#8-supabase-database-schema--data-models) and execute it inside the Supabase SQL Editor.

### Step 4: Verification & Build
```bash
# Type check and lint
npm run lint

# Production build
npm run build

# Start production server
npm run start
```
