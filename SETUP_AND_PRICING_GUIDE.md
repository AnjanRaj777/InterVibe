# InterVibe — API, Environment Variables & Plan Pricing Setup Guide

This guide covers how to configure **Dodo Payments**, **Supabase**, and **AI Voice/LLM APIs** in `.env.local` (and Vercel), along with unit economics, cost breakdowns, and recommended plan settings.

---

## 1. Dodo Payments Setup (Step-by-Step)

### Step A: Create Your 6 Subscription Products in Dodo Dashboard
1. Log in to [app.dodopayments.com](https://app.dodopayments.com).
   - Toggle **Test Mode** (top-left) while testing locally, or **Live Mode** when ready to accept real payments.
2. Navigate to **Products → Create Product** and create **6 Recurring Subscription** products matching `src/lib/dodo.ts`:

| Env Variable Name | Product Name in Dodo | Billing Type | Billing Interval | Price (INR) |
| :--- | :--- | :--- | :--- | :--- |
| `DODO_PRODUCT_HUSTLER_MONTHLY` | InterVibe Hustler (Monthly) | Recurring | Monthly (1 month) | **₹499** |
| `DODO_PRODUCT_HUSTLER_ANNUAL` | InterVibe Hustler (Annual) | Recurring | Yearly (1 year) | **₹4,188** (₹349 × 12) |
| `DODO_PRODUCT_PRO_MONTHLY` | InterVibe Pro (Monthly) | Recurring | Monthly (1 month) | **₹1,499** |
| `DODO_PRODUCT_PRO_ANNUAL` | InterVibe Pro (Annual) | Recurring | Yearly (1 year) | **₹12,588** (₹1,049 × 12) |
| `DODO_PRODUCT_TEAMS_MONTHLY` | InterVibe Teams (Monthly) | Recurring | Monthly (1 month) | **₹4,999** |
| `DODO_PRODUCT_TEAMS_ANNUAL` | InterVibe Teams (Annual) | Recurring | Yearly (1 year) | **₹41,988** (₹3,499 × 12) |

3. Copy each product's `pdt_...` ID into `.env.local` (and Vercel Environment Variables).

---

### Step B: Get Your Dodo API Key & Webhook Secret
1. **API Key**:
   - Go to **Developer → API Keys → Create API Key**.
   - Copy the key into `DODO_PAYMENTS_API_KEY`.
2. **Webhook Secret**:
   - Go to **Developer → Webhooks → Add Endpoint**.
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/dodo`
     *(For local testing with ngrok or cloudflared: `https://<your-tunnel>.ngrok-free.app/api/webhooks/dodo`)*
   - **Events to enable**:
     - `subscription.active`
     - `subscription.renewed`
     - `subscription.plan_changed`
     - `subscription.on_hold`
     - `subscription.cancelled`
     - `subscription.failed`
     - `subscription.expired`
     - `payment.succeeded`
   - Copy the **Signing Secret** (`whsec_...`) into `DODO_PAYMENTS_WEBHOOK_KEY`.

---

## 2. Complete `.env.local` / Vercel Environment Variables

Copy `.env.example` to `.env.local` and populate the following keys:

```env
# ==============================================================================
# 1. Dodo Payments (Subscriptions & Checkout)
# ==============================================================================
DODO_PAYMENTS_API_KEY=dodo_test_xxxxxxxxxxxxx          # Use live key when DODO_PAYMENTS_ENVIRONMENT=live_mode
DODO_PAYMENTS_WEBHOOK_KEY=whsec_xxxxxxxxxxxxx          # From Dodo Dashboard -> Developer -> Webhooks
DODO_PAYMENTS_ENVIRONMENT=test_mode                    # 'test_mode' or 'live_mode'
DODO_PAYMENTS_RETURN_URL=http://localhost:3000/dashboard/billing  # Set to https://your-domain.com/dashboard/billing in prod

# Dodo Payments Product IDs (from Dodo Dashboard -> Products)
DODO_PRODUCT_HUSTLER_MONTHLY=pdt_xxxxxxxxxxxxx
DODO_PRODUCT_HUSTLER_ANNUAL=pdt_xxxxxxxxxxxxx
DODO_PRODUCT_PRO_MONTHLY=pdt_xxxxxxxxxxxxx
DODO_PRODUCT_PRO_ANNUAL=pdt_xxxxxxxxxxxxx
DODO_PRODUCT_TEAMS_MONTHLY=pdt_xxxxxxxxxxxxx
DODO_PRODUCT_TEAMS_ANNUAL=pdt_xxxxxxxxxxxxx

# ==============================================================================
# 2. App Public Configuration
# ==============================================================================
NEXT_PUBLIC_APP_NAME=InterVibe
APP_URL=http://localhost:3000                          # Set to https://your-domain.com in production

# ==============================================================================
# 3. Supabase Auth, PostgreSQL & S3 Storage
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
DATABASE_URL=postgresql://postgres:your_password@db.your-project-id.supabase.co:5432/postgres

STORAGE_ENDPOINT=https://your-project-id.supabase.co/storage/v1/s3
STORAGE_BUCKET=intervibe-docs
STORAGE_REGION=us-east-1
STORAGE_FORCE_PATH_STYLE=true
STORAGE_ACCESS_KEY=your_storage_access_key
STORAGE_SECRET_KEY=your_storage_secret_key

# ==============================================================================
# 4. AI Interview Brain (LLM), Speech-to-Text (STT) & Voice Output (TTS)
# ==============================================================================
MODEL_API_KEY=your_meta_model_api_key_here             # Meta Muse Spark 1.3 LLM API Key
META_API_BASE=https://api.meta.ai/v1
SPARK_MODEL_ID=muse-spark-1.3-contributor

MUSE_API_KEY=your_meta_muse_api_key_here               # Meta Muse Voice Transcribe STT Key
TRANSCRIBE_MODEL_ID=muse-voice-transcribe-1.0

DEEPGRAM_API_KEY=your_deepgram_api_key_here            # Deepgram Aura TTS Voice Key

# Optional Fallback STT & LLM
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Optional: XRSPACE Perxona Connect (3D Talking Avatar Cloud Streaming)
PERXONA_API_BASE_URL=https://console.perxona.ai/asia
PERXONA_CONNECT_PUBLISHABLE_KEY=your_perxona_publishable_key_here
PERXONA_CONNECT_SECRET_KEY=your_perxona_secret_key_here
```

---

## 3. Plan Quotas & Cost Breakdown

### A. API Cost per 3 Free Interviews (30 Mins Total)

A typical 10-minute mock interview (~8–10 Q&A turns) consumes:

| Service | Usage per 3 Interviews (30 mins total) | Unit Cost | Cost per Free User (3 Interviews) |
| :--- | :--- | :--- | :--- |
| **Deepgram Aura TTS** (`/api/tts`) | ~12,000 characters (~4,000 chars/interview) | $0.015 / 1k chars | **~$0.18** (₹15.10) |
| **Speech-to-Text (STT)** (`/api/stt`) | ~15 mins of candidate speech audio | ~$0.004 / min | **~$0.06** (₹5.00) |
| **LLM Chat + Evaluation** (`/api/chat`, `/api/analyze-interview`) | ~60k input tokens + ~8k output tokens | ~$0.03 total | **~$0.03** (₹2.50) |
| **Supabase Auth & DB** | 1 user row + 3 session rows | Free tier / negligible | **~$0.00** |
| **Total per Free User** | **3 Interviews (30 mins total)** | — | **~$0.27 USD (~₹22.50 INR)** |

- **Cost per single 10-minute interview**: **~₹7.50 ($0.09)**.
- **Why Free Plan is 3 Lifetime Interviews (Not Monthly)**:
  - A one-time 3-interview trial costs **~₹22.50 ($0.27) once per signup**.
  - Deepgram provides **$200 in free starter credits**, which covers ~740 free users at zero out-of-pocket cost.

---


## 4. Best API & Payment Settings (Enforced in Code)

1. **TTS Character Cap (`src/app/api/tts/route.ts`)**:
   - Capped at `1,000` characters per AI response, and the interviewer prompt enforces **1–3 sentences per turn**. This reduces Deepgram TTS costs by ~65% and keeps voice latency under `350ms`.
2. **Chat Context Window (`src/app/api/chat/route.ts`)**:
   - Bounded to the last `40` messages (`max_tokens: 1500`, `temperature: 0.1`) so long interviews never cause token-cost spikes.
3. **Evaluation Transcript Cap (`src/app/api/analyze-interview/route.ts`)**:
   - Bounded to the last `50` turns (`25,000` characters max, `max_tokens: 2048`, `temperature: 0.2`) and atomically decrements 1 credit in PostgreSQL via `consumeUserInterviewCredit`.
4. **Database Trigger Protection (`src/lib/db.ts`)**:
   - PostgreSQL trigger `trg_protect_profile_billing` blocks client-side PostgREST (`authenticated` / `anon` roles) from modifying `subscription_tier`, `credits_remaining`, or `dodo_*` columns.
5. **Dodo Payments Dashboard Recommendations**:
   - Enable **UPI Autopay + Cards + NetBanking** in Dodo Dashboard for seamless Indian recurring checkouts.
   - Enable **Discount Codes** (already enabled in `/api/checkout/dodo`) for promotional campaigns.
