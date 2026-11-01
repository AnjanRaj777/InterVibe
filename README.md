# InterVibe 🎙️⚡

> **Next-Generation Real-Time AI Verbal Mock Interview Simulator & Performance Diagnostics Platform**  
> *Engineered for the Meta AI Developer Hackathon*

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL%203D-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-SSR%20&%20Postgres-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-14.9-FF0055?style=flat-square&logo=framer)](https://www.framer.com/motion/)
[![Meta Muse](https://img.shields.io/badge/Meta%20AI-Muse%20Spark%201.3-0668E1?style=flat-square&logo=meta)](https://ai.meta.com/)
[![Deepgram](https://img.shields.io/badge/Deepgram-Aura%20TTS-13EF93?style=flat-square)](https://deepgram.com/)
[![Groq](https://img.shields.io/badge/Groq-Failover%20Inference-F55036?style=flat-square)](https://groq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

---

## 📑 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🎭 Interviewer Personas](#-interviewer-personas)
- [🏗️ Architecture & Pipeline](#-architecture--pipeline)
- [📂 Repository Structure](#-repository-structure)
- [🎨 10 Switchable Design Presets](#-10-switchable-design-presets)
- [🛡️ Security Architecture & Hardening](#️-security-architecture--hardening)
- [🗄️ Supabase Database Schema & Setup](#️-supabase-database-schema--setup)
- [🚀 Getting Started](#-getting-started)
  - [⚡ One-Click Quick Start (Windows)](#-one-click-quick-start-windows)
  - [Manual Setup](#manual-setup)
  - [Environment Variables Configuration](#environment-variables-configuration)
- [🎯 How to Use InterVibe](#-how-to-use-intervibe)
- [🛠️ Tech Stack & Integrations](#️-tech-stack--integrations)
- [🏆 Hackathon Context & Innovation](#-hackathon-context--innovation)
- [📄 License](#-license)

---

## 🌟 Overview

**InterVibe** bridges the gap between passive technical interview preparation and high-stakes live verbal loops. Most interview candidates practice coding algorithms in silence or read text-based solutions, leaving them vulnerable to the verbal communication breakdowns, rapid architectural cross-examination, and pacing pressure of live recruiter and hiring manager loops.

InterVibe delivers a hyper-realistic, end-to-end simulated interview experience:
- Candidates speak naturally using zero-latency **Push-to-Talk audio streaming** with direct in-browser downsampling.
- Interactive **3D photorealistic human avatars** react with lip-syncing, idle breathing, and eye tracking.
- Frontier AI models (**Meta Muse Spark 1.3** and **Deepgram Aura**) emulate specialized technical recruiter and engineering manager personas.
- Candidates receive **instant qualitative diagnostics**, skill radar metrics, speaking telemetry, and personalized practice drills after every session.
- Cloud sessions, profiles, and historical evaluations sync securely to **Supabase PostgreSQL** protected by Row Level Security (RLS) and server-side Edge Middleware.

---

## ✨ Key Features

### 👤 Photorealistic 3D & 2D Talking Avatars
- **Three.js WebGL 3D Avatar Engine**: Renders high-fidelity 3D character avatars (`sarah.glb`, `michael.glb`, `emma.glb`) with realistic skin textures, studio 3-point lighting, idle chest breathing, realistic eye blinking, head tilt, and ARKit facial blendshapes for natural lip synchronization.
- **XRSPACE Perxona Connect Cloud Streaming**: Seamless integration and token negotiation (`/api/perxona/session`) for cloud-streamed talking avatar video loops.
- **2D Reactive Avatar Mode**: Lightweight 2D portrait mode with animated audio rings, state indicators (`Speaking`, `Thinking`, `Listening`, `Idle`), and dynamic soundwave equalizer bars.
- **Executive Framing**: Camera perspectives calibrated for professional webcam composition with balanced headroom.

### 🎙️ Direct 16kHz PCM Push-to-Talk Audio Stream
- **Zero Accidental Cutoffs**: Hold `Spacebar` to speak and release to process. Eliminates premature Voice Activity Detection (VAD) silences while thinking through complex distributed systems trade-offs.
- **Client-Side Resampling**: Web Audio API captures 32-bit float raw microphone audio and downsamples linearly in-browser (`float32To16kMonoWav`) to standard 16,000Hz 16-bit mono WAV before streaming to the STT API.
- **Server-Side RIFF Boundary Resampler**: Automated fallback resampler in `/api/stt` ensures full compliance with speech models.

### 🧠 Meta Muse Spark 1.3 LLM Reasoning
- Powered by **Meta Muse Spark 1.3 Contributor** via the Meta Model API.
- Implements strict persona roleplay, one-question-at-a-time verbal pacing discipline, conversational interruptions, and adaptive difficulty scaling based on candidate responses.
- **Automatic High-Availability Fallback**: Transparently fails over to Groq Cloud (LLaMA 3.3 70B Versatile / gpt-oss-120b) if the primary model reaches rate limits.

### 🗣️ Conversational Speech-to-Text & Neural TTS
- **STT**: **Meta Muse Voice Transcribe 1.0** with fallback to **Groq Whisper Large v3** for sub-second audio transcription.
- **TTS**: Low-latency neural speech synthesis via **Deepgram Aura** (`aura-asteria-en`, `aura-orion-en`, `aura-luna-en`) with automatic browser-native Web Speech API fallback.

### 📄 Contextual Resume Parsing & Memory Injection
- Server-side PDF extraction via `pdf2json` extracts work experience, project bullet points, and tech stacks directly into the interviewer’s system prompt memory.
- Protected by a strict **5MB upload limit** and `%PDF-` magic-byte verification.
- Cross-examines candidate claims against specific Job Description (JD) requirements and seniority expectations.

### 📊 Comprehensive Post-Session Diagnostics & Telemetry
- **Executive Evaluator Assessment**: High-level qualitative assessment of performance benchmarked against industry seniority bars (Junior, Mid, Senior, Staff/Lead).
- **Quantified Scoring**: Overall readiness index, technical depth score, communication clarity score, and architecture score (0–100).
- **Actionable Vectors**: Categorized breakdown of *Observed Strengths*, *Areas for Improvement*, and *Recommended Practice Drills*.
- **Session History Persistence**: Dual persistence across client-side Zustand stores (`localStorage`) and authenticated Supabase PostgreSQL tables.

### 🛡️ Enterprise Security & Route Protection
- **Edge Route Proxy**: Next.js proxy (`src/proxy.ts`) enforcing authenticated access to all `/dashboard/*` routes.
- **Server-Side API Authentication**: Authenticated Supabase session verification across all AI completion, audio processing, and parsing endpoints.
- **IDOR Prevention**: Session ownership checks (`auth.uid() === userId`) verify candidate permissions prior to any database read/write.
- **HTTP Security Headers**: Strict HSTS, X-Frame-Options, `nosniff`, and Permissions Policy configured in `next.config.ts`.

### 🌐 High-Conversion Modern Landing Page
- Engineered with dark neon aesthetic (`#0f1211` background, `#78fcd6` emerald/cyan accents).
- Interactive hero section with live dashboard preview and soundwave animation.
- Dynamic Bento Grid showcasing core platform capabilities:
  - *Actionable Guidance Illustration*
  - *Calibration Illustration*
  - *Diagnostic Analysis Illustration*
  - *Drill Loop Illustration*
  - *Readiness Telemetry Illustration*
  - *Live Interview Illustration*
- Interactive Pricing Matrix with monthly/annual billing toggle across 4 tiers (**Free**, **Hustler**, **Pro**, **Teams**).
- Testimonial grid, social proof badges, and interactive FAQ accordion powered by **Framer Motion**.

---

## 🎭 Interviewer Personas

| Persona | Role & Archetype | Voice Model | Target Tone & Behavior | 3D Asset |
| :--- | :--- | :--- | :--- | :--- |
| **Sarah Chen** | Senior Technical Recruiter (Linear) | Deepgram Aura Asteria (Female) | Warm, encouraging, behavioral STAR probing, culture alignment | `sarah.glb` / `sarah.webp` |
| **Michael Vance** | Strict Engineering Manager (Stripe) | Deepgram Aura Orion (Male) | Direct, rigorous, architectural trade-offs, edge-case pressure | `michael.glb` / `michael.webp` |
| **Emma Watson** | British Technical Lead (DeepMind) | Deepgram Aura Luna (Female) | Deep technical precision, distributed systems, clean code standards | `emma.glb` / `emma.webp` |

---

## 🏗️ Architecture & Pipeline

```mermaid
flowchart TD
    subgraph Client ["Client Browser (Next.js 16 + React 19)"]
        UI["Interview Studio UI"]
        Mic["Microphone\n(Web Audio API)"]
        Downsampler["Client-Side Resampler\n(32-bit Float to 16kHz WAV)"]
        ThreeAvatar["Three.js 3D Avatar Engine\n(ARKit Lip-Sync & Idle Breathing)"]
        AudioPlayer["Audio Playback Node\n(HTML5 Audio / Web Speech)"]
        Store["Zustand Client Stores\n(Auth & Sessions)"]
    end

    subgraph SecurityBoundary ["Edge Security & Middleware"]
        RouteGuard["Next.js Edge Middleware\n(Session Validation & Cookie Refresh)"]
        HeadersConfig["HTTP Security Headers\n(CSP, HSTS, X-Frame-Options)"]
    end

    subgraph ServerAPIs ["Next.js Server API Routes"]
        ResumeAPI["POST /api/extract-resume\n(pdf2json + Magic Byte Check)"]
        STTAPI["POST /api/stt\n(Meta Muse Voice Transcribe)"]
        ChatAPI["POST /api/chat\n(Meta Muse Spark 1.3 LLM)"]
        TTSAPI["POST /api/tts\n(Deepgram Aura Streaming)"]
        EvalAPI["POST /api/analyze-interview\n(Meta Muse Evaluator)"]
        PerxonaAPI["GET /api/perxona/session\n(Cloud Avatar Token)"]
    end

    subgraph BackendData ["Supabase Infrastructure"]
        SupaAuth["Supabase GoTrue Auth"]
        SupaDB["PostgreSQL Database\n(profiles, sessions, messages)"]
        InterviewService["Supabase Interview Service\n(IDOR Ownership Enforcement)"]
    end

    subgraph AICloud ["External AI Services"]
        MetaSTT["Meta Muse Voice Transcribe 1.0"]
        MetaLLM["Meta Muse Spark 1.3 Contributor"]
        GroqFallback["Groq Cloud Failover\n(Whisper Large v3 / LLaMA 3.3 70B)"]
        DeepgramAura["Deepgram Aura Neural TTS"]
        PerxonaCloud["XRSPACE Perxona Cloud"]
    end

    UI -->|"Access Request"| RouteGuard
    RouteGuard --> SupaAuth

    Mic -->|"Raw Audio"| Downsampler
    Downsampler -->|"16kHz Mono WAV"| STTAPI
    STTAPI --> MetaSTT
    MetaSTT -.->|"Failover"| GroqFallback
    STTAPI -->|"Transcript Text"| UI

    ResumeAPI -->|"Extracted Experience"| UI
    UI -->|"Chat History + Resume + JD"| ChatAPI
    ChatAPI --> MetaLLM
    MetaLLM -.->|"Failover"| GroqFallback
    ChatAPI -->|"Persona Response"| UI

    UI -->|"Response Text"| TTSAPI
    TTSAPI --> DeepgramAura
    TTSAPI -->|"MPEG Audio Stream"| AudioPlayer

    AudioPlayer -->|"Audio Amplitude"| ThreeAvatar
    PerxonaAPI --> PerxonaCloud

    UI -->|"Session Completed"| EvalAPI
    EvalAPI --> MetaLLM
    EvalAPI -->|"Scores & Drills"| UI

    UI -->|"Persist Session"| InterviewService
    InterviewService --> SupaDB
```

---

## 📂 Repository Structure

```
InterVibe/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze-interview/     # Meta Muse Spark session evaluation & scoring
│   │   │   ├── chat/                  # Meta Muse Spark 1.3 LLM conversational loop
│   │   │   ├── extract-resume/        # PDF resume parsing endpoint (pdf2json + %PDF- check)
│   │   │   ├── perxona/session/       # XRSPACE Perxona Connect token provider
│   │   │   ├── stt/                   # Meta Muse Voice Transcribe & Groq Whisper endpoint
│   │   │   └── tts/                   # Deepgram Aura text-to-speech audio streaming
│   │   ├── auth/
│   │   │   ├── callback/              # OAuth & token exchange callback with redirect safety
│   │   │   ├── login/                 # User authentication & OAuth triggers
│   │   │   └── signup/                # Candidate account onboarding & profile creation
│   │   ├── dashboard/
│   │   │   ├── billing/               # Plan tiers, invoice history & CSV export
│   │   │   ├── interview/             # Live Interview Room, Push-to-Talk, & 3D Avatar
│   │   │   ├── overview/              # Analytics dashboard, KPIs, & session history
│   │   │   └── profile/               # Appearance theme switcher, avatars & settings
│   │   ├── layout.tsx                 # Root layout with ThemeProvider & Sonner
│   │   └── page.tsx                   # High-converting modern landing page
│   ├── components/
│   │   ├── avatar/
│   │   │   └── interactive-avatar.tsx # Three.js WebGL 3D avatar & Perxona renderer
│   │   ├── landing/                   # Hero, Bento grid, Testimonials, FAQ & Pricing
│   │   │   ├── bento/                 # Feature illustrations and telemetry widgets
│   │   │   ├── animated-section.tsx   # Framer motion viewport trigger
│   │   │   ├── hero-section.tsx       # Landing hero with interactive CTA
│   │   │   ├── dashboard-preview.tsx  # Live mock interview preview card
│   │   │   ├── pricing-section.tsx    # Tier matrix with monthly/annual switch
│   │   │   └── faq-section.tsx        # Accordion FAQ
│   │   ├── layout/                    # Responsive sidebar, navigation & breadcrumbs
│   │   ├── themes/                    # Theme preset selector & dark/light toggle
│   │   └── ui/                        # shadcn/ui components (Radix primitives)
│   ├── config/                        # Navigation configuration & personas
│   ├── hooks/                         # Responsive hooks & theme state
│   ├── lib/
│   │   ├── supabase/                  # Supabase SSR client, server, admin & interview service
│   │   │   ├── admin.ts               # Privileged admin client with fail-safe guard
│   │   │   ├── client.ts              # Browser client & configuration helper
│   │   │   ├── interview-service.ts   # IDOR-verified database persistence service
│   │   │   ├── server.ts              # SSR cookie-based server client
│   │   │   └── types.ts               # Database TypeScript definitions
│   │   ├── api-client.ts              # Client API wrapper
│   │   └── utils.ts                   # Class name mergers & styling helpers
│   ├── proxy.ts                       # Edge session refresh & /dashboard/* route guards
│   ├── store/                         # Zustand state stores (Auth, Sessions, Telemetry)
│   └── styles/
│       ├── themes/                    # 10 custom CSS theme stylesheets
│       ├── globals.css                # Tailwind CSS v4 directives
│       └── theme.css                  # Theme injection root variables
├── public/
│   ├── avatars/                       # 3D GLTF models & webp textures (Sarah, Michael, Emma)
│   ├── images/                        # Landing page assets & Bento grid diagrams
│   └── logos/                         # Company logos for social proof banner
├── .env.example                       # Environment configuration template
├── AUDIT_REPORT.md                    # Comprehensive security and performance audit log
├── LICENSE                            # MIT License
├── next.config.ts                     # HTTP security headers & Next.js configuration
├── package.json                       # Next.js 16, React 19, Three.js, Supabase & dependencies
├── SECURITY.md                        # Threat model, secrets policy & disclosure guidelines
├── startup.bat                        # One-click Windows setup & launcher script
├── tsconfig.json                      # TypeScript configuration
└── vercel.json                        # Vercel deployment framework configuration
```

---

## 🎨 10 Switchable Design Presets

InterVibe features 10 fully customized design themes accessible from the Profile & Settings menu (`/dashboard/profile`), with complete support for both Light and Dark modes:

| Theme Preset | Identifier | Visual Identity & Style |
| :--- | :--- | :--- |
| **▲ Vercel** | `vercel` | Ultra-clean minimalist monochrome with sharp borders and subtle gray accents |
| **⚡ Supabase** | `supabase` | High-contrast dark charcoal with radiant emerald green (`#3ECF8E`) accents |
| ** Claude** | `claude` | Warm terracotta, soft amber, and natural parchment aesthetic inspired by Anthropic |
| **🧘 Zen** | `zen` | Calming slate, soft sage, and muted teal tones designed to reduce interview anxiety |
| **⬛ Mono** | `mono` | High-contrast brutalist pure black and stark white styling |
| **💬 WhatsApp** | `whatsapp` | Rich chat-focused emerald headers, subtle message bubble contrasts, and clean borders |
| **🚀 Astro Vista**| `astro-vista` | Galactic deep space aesthetic with neon purple and cosmic cyan highlights |
| **🌿 Light Green**| `light-green`| Fresh botanical mint and soft sage palette with organic contrast |
| **📐 Neobrutalism**| `neobrutualism`| Bold pop borders, vibrant retro cards, and expressive hard drop-shadows |
| **📝 Notebook** | `notebook` | Ruled paper background, warm sepia tones, and academic notebook styling |

---

## 🛡️ Security Architecture & Hardening

InterVibe enforces defense-in-depth across the entire request lifecycle (see [`AUDIT_REPORT.md`](AUDIT_REPORT.md) and [`SECURITY.md`](SECURITY.md)):

1. **Edge Route Proxy (`src/proxy.ts`)**: Enforces authenticated Supabase SSR session tokens across `/dashboard/*`. Unauthenticated users are redirected to `/auth/login?next=...`.
2. **Server-Side API Authentication**: Protects AI completion (`/api/chat`), voice synthesis (`/api/tts`), speech transcription (`/api/stt`), and evaluation (`/api/analyze-interview`) routes from unauthorized quota exhaustion.
3. **IDOR Prevention**: All session queries and persistence actions verify `auth.uid() === userId` before executing database queries in `interview-service.ts`.
4. **Strict File Upload Verification**:
   - Resume PDFs: Enforces a **5MB size cap**, `application/pdf` MIME check, and `%PDF-` magic-byte verification.
   - Audio Payloads: Enforces a **10MB upload ceiling** and RIFF chunk boundary validation.
5. **Open Redirect & Host Poisoning Protection**: Sanitizes OAuth callback redirection (`/auth/callback`) to strictly enforce relative paths.
6. **HTTP Security Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and strict `Permissions-Policy`.
7. **Error Sanitization**: Upstream third-party API error details and stack traces are logged server-side only; clients receive sanitized user-friendly error codes.

---

## 🗄️ Supabase Database Schema & Setup

To enable user accounts, session persistence, and analytics in Supabase, execute the following SQL in your **Supabase SQL Editor**:

```sql
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
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
CREATE TABLE IF NOT EXISTS public.interview_sessions (
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

-- 3. Conversation Messages Table
CREATE TABLE IF NOT EXISTS public.session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON public.interview_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.interview_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own session messages" ON public.session_messages 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_messages.session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own session messages" ON public.session_messages 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.interview_sessions WHERE id = session_messages.session_id AND user_id = auth.uid())
);
```

---

## 🚀 Getting Started

### ⚡ One-Click Quick Start (Windows)

On Windows, double-click `startup.bat` in the project root or run:

```cmd
startup.bat
```

The script will automatically:
1. Verify that **Node.js** and **npm** are installed.
2. Create `.env.local` from `.env.example` if it doesn't already exist.
3. Install dependencies (`npm install`) if `node_modules` is absent.
4. Launch the Next.js development server at [http://localhost:3000](http://localhost:3000) and open your default browser.

---

### Manual Setup

#### 1. Prerequisites
- **Node.js**: `18.18+` or `20+`
- **npm** or **pnpm**
- Modern Chromium-based browser (Chrome, Brave, Edge) with microphone permissions granted.

#### 2. Clone & Install

```bash
git clone https://github.com/your-username/intervibe.git
cd intervibe
npm install
```

#### 3. Environment Variables Configuration

Copy `.env.example` to create your local environment file:

```bash
cp .env.example .env.local
```

Configure your API keys in `.env.local`:

```env
# ==============================================================================
# InterVibe Environment Configuration
# ==============================================================================

# Meta AI Model API (Muse Spark 1.3 LLM)
MODEL_API_KEY=your_meta_model_api_key_here
META_API_BASE=https://api.meta.ai/v1
SPARK_MODEL_ID=muse-spark-1.3-contributor

# Meta Muse Voice Transcribe (Speech-to-Text)
TRANSCRIBE_MODEL_ID=muse-voice-transcribe-1.0
MUSE_API_KEY=your_meta_muse_api_key_here

# Deepgram Aura TTS (Primary Neural Audio)
DEEPGRAM_API_KEY=your_deepgram_aura_api_key_here

# Groq Cloud (High-Availability Fallback for STT & LLM)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# App Metadata
NEXT_PUBLIC_APP_NAME=InterVibe
APP_URL=https://inter-vibe.vercel.app

# Supabase Auth, PostgreSQL & Storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
DATABASE_URL=postgresql://postgres:your_password@db.your-project-id.supabase.co:5432/postgres

# S3 Compatible Storage (Supabase Storage)
STORAGE_ENDPOINT=https://your-project-id.supabase.co/storage/v1/s3
STORAGE_BUCKET=intervibe-docs
STORAGE_REGION=us-east-1
STORAGE_FORCE_PATH_STYLE=true
STORAGE_ACCESS_KEY=your_storage_access_key
STORAGE_SECRET_KEY=your_storage_secret_key

# Session & Auth Security
AUTH_SECRET=your_32_character_random_auth_secret_here

# XRSPACE Perxona Connect (Optional: Cloud-Streamed Talking Avatars)
PERXONA_API_BASE_URL=https://console.perxona.ai/asia
PERXONA_CONNECT_PUBLISHABLE_KEY=your_perxona_publishable_key_here
PERXONA_CONNECT_SECRET_KEY=your_perxona_secret_key_here
```

#### 4. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

#### 5. Verification & Production Build

```bash
npm run lint
npm run build
npm run start
```

---

## 🎯 How to Use InterVibe

```
[1. Setup Context] ──► [2. Select Persona] ──► [3. Verbal Interview Studio] ──► [4. Diagnostics Report]
   Upload Resume          Choose Sarah,             Hold Spacebar to speak         Readiness Index &
   & Paste JD             Michael, or Emma          Real-time 3D Avatar reacts     Actionable Drills
```

1. **Upload Resume & Set Target Role**: Upload your resume (`.pdf`) or click **Use Demo Resume**. InterVibe parses your past technical stack, notable projects, and career milestones with magic-byte validation.
2. **Configure Interview Focus**: Specify the target job title, job description, seniority level, and focus area (System Design, Behavioral / STAR, or Mixed).
3. **Select Your Interviewer**: Choose from Sarah Chen (Recruiter), Michael Vance (Strict EM), or Emma Watson (Tech Lead). Toggle between 3D photorealistic avatar and 2D mode.
4. **Conduct the Verbal Loop**:
   - Hold the **Spacebar** while answering.
   - Speak naturally into your microphone.
   - Release the **Spacebar** to send the downsampled 16kHz audio stream.
   - Listen to the interviewer reply with low-latency neural voice synthesis while watching the avatar lip-sync in real time.
5. **Review In-Depth Diagnostics**: End the session to generate your comprehensive evaluation report with quantified scoring (Readiness, Depth, Clarity, Architecture), filler word counts, radar skill charts, and personalized practice drills.

---

## 🛠️ Tech Stack & Integrations

| Layer | Technology / Library | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) | Server-side rendering, Edge middleware, and API route handlers |
| **Frontend Core** | [React 19](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/) | Concurrent React features, Server Components, and strict types |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS engine with CSS custom properties |
| **3D Avatar Engine** | [Three.js](https://threejs.org/) | WebGL rendering, GLTF loader, studio lighting, and ARKit blendshape lip-sync |
| **Database & Auth** | [Supabase](https://supabase.com/) (`@supabase/ssr`, PostgreSQL) | SSR cookie authentication, database persistence, and Row Level Security |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Viewport scroll reveals, landing transitions, and bento reveals |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide](https://lucide.dev/) | Accessible, composable UI building blocks |
| **Primary LLM** | [Meta Muse Spark 1.3 Contributor](https://ai.meta.com/) | Verbal interview reasoning, persona roleplay, and evaluations |
| **Primary STT** | [Meta Muse Voice Transcribe 1.0](https://ai.meta.com/) | Low-latency 16kHz speech transcription |
| **Neural TTS** | [Deepgram Aura](https://deepgram.com/) | Low-latency natural human voice synthesis (Asteria, Orion, Luna) |
| **Failover AI** | [Groq Cloud](https://groq.com/) | Whisper Large v3 STT & LLaMA 3.3 70B Versatile backup inference |
| **Cloud Avatars** | [XRSPACE Perxona Connect](https://console.perxona.ai/) | Cloud talking avatar streaming integration |
| **Document Parser** | `pdf2json` | Serverless binary PDF text extraction with magic-byte validation |
| **State Management**| [Zustand](https://github.com/pmndrs/zustand) | Client-side state and `localStorage` session persistence |
| **Toast Notifications** | [Sonner](https://sonner.emilkowal.ski/) | Non-intrusive alert and notification system |

---

## 🏆 Hackathon Context & Innovation

This project was built for the **Meta AI Developer Hackathon**, highlighting the real-world utility of Meta's frontier generative AI models (**Meta Muse Spark 1.3** and **Meta Muse Voice Transcribe 1.0**) combined with:
- **WebGL 3D Graphics**: Real-time facial blendshape animation and studio rendering directly in the browser without GPU streaming costs.
- **Client-Side Audio DSP**: In-browser linear PCM downsampling eliminating voice activity cutoffs and reducing server bandwidth by 66%.
- **Enterprise Security Hardening**: Edge middleware session guards, IDOR prevention, upload magic byte verification, and HTTP security headers.
- **Automated Multi-Cloud Failover**: Zero-downtime resilience bridging Meta AI with Groq Cloud backup inference.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
