# InterVibe Comprehensive Security & Architecture Audit Report

**Date**: November 3, 2026  
**Audit Branch**: `audit/security-perf-polish-20261103`  
**Auditor**: Senior Application Security Engineer & Performance Architect  
**Repository**: InterVibe (Next.js 16.2.6 / React 19 / Supabase / Dodo Payments)

---

## 1. Executive Summary

- **Dodo Payments & Subscription Hardening**: Full Dodo Payments (`dodopayments` SDK) integration across checkout (`/api/checkout/dodo`), webhook verification (`/api/webhooks/dodo`), and subscription management (`/api/subscription`), hardened against unverified upgrades, IDOR, and payment spoofing.
- **Database Column-Level Billing Protection**: Added a PostgreSQL `BEFORE INSERT OR UPDATE` trigger (`trg_protect_profile_billing` / `protect_profile_billing_columns()`) on `public.profiles` so client-side PostgREST (`authenticated` / `anon` role) cannot tamper with `subscription_tier`, `credits_remaining`, or `dodo_*` billing fields.
- **Account Takeover (ATO) Remediated in Auth Assist**: Eliminated password-overwrite on OAuth accounts in `/api/auth/assist` and required crypt-verified password ownership before confirming unconfirmed emails.
- **Server-Side Interview Credit Enforcement**: Enforced atomic PostgreSQL interview credit consumption (`consumeUserInterviewCredit`) on `/api/analyze-interview` and quota verification on `/api/chat` (`402 Payment Required`), closing the `localStorage` clearing loophole.
- **Server-Side API Route Protection Enforced**: All backend AI completion (`/api/chat`), speech-to-text (`/api/stt`), voice synthesis (`/api/tts`), resume parsing (`/api/extract-resume`), and Perxona session (`/api/perxona/session`) endpoints enforce authenticated Supabase sessions.

---

## 2. Security Findings & Remediation Log

| ID | Severity | Category | File | Issue | Applied Fix | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-20** | **Critical** | Account Takeover | `src/app/api/auth/assist/route.ts` | `action: 'confirm'` overwrote `encrypted_password` on OAuth accounts (`encrypted_password IS NULL`) and confirmed emails without verifying password ownership | Removed `encrypted_password` overwrite; enforced `encrypted_password = extensions.crypt(password, encrypted_password)` check before confirming email | **Fixed** |
| **SEC-21** | **Critical** | Privilege Escalation | `src/lib/db.ts`<br>`public.profiles` | Supabase RLS `UPDATE USING (auth.uid() = id)` allowed authenticated clients to update `subscription_tier = 'pro'` and `credits_remaining = 9999` directly via PostgREST | Created PostgreSQL trigger `trg_protect_profile_billing` rejecting client-role modifications to billing/quota columns; synced authoritative state to `auth.users.raw_app_meta_data` | **Fixed** |
| **SEC-22** | **Critical** | Payment Bypass / IDOR | `src/app/api/subscription/route.ts`<br>`src/app/api/checkout/dodo/route.ts` | Endpoints accepted arbitrary `userId`/`email` from request body/query and allowed unverified self-upgrades or unverified `session_id` activation | Enforced `supabase.auth.getUser()` session binding, verified `payment_status === 'succeeded'` / `sub.status === 'active'` and session ownership with Dodo Payments before activating | **Fixed** |
| **SEC-23** | **High** | Webhook Spoofing | `src/app/api/webhooks/dodo/route.ts` | Webhook fell back to `JSON.parse(rawBody)` if `DODO_PAYMENTS_WEBHOOK_KEY` was unset or verification was bypassed | Enforced strict `client.webhooks.unwrap` signature verification and rejected unverified webhooks in production or when Dodo API is active | **Fixed** |
| **SEC-24** | **High** | Quota Bypass | `src/app/api/analyze-interview/route.ts`<br>`src/app/api/chat/route.ts` | Interview quota (3 free interviews) was only checked in client `localStorage`, allowing unlimited free usage by clearing browser storage | Added atomic server-side `consumeUserInterviewCredit` in PostgreSQL on `/api/analyze-interview` and server credit check on `/api/chat` | **Fixed** |
| **SEC-25** | **Medium** | Prompt Injection | `src/app/api/chat/route.ts` | Any message in the `messages` array could specify `role: 'system'`, allowing mid-conversation system instruction override | Restricted `role: 'system'` strictly to index `0` of the message list | **Fixed** |
| **SEC-26** | **Medium** | Unauthenticated API | `src/app/api/perxona/session/route.ts` | `GET /api/perxona/session` minted Perxona Connect session tickets without verifying user authentication | Added `supabase.auth.getUser()` session guard | **Fixed** |
| **SEC-05** | **Critical** | Authorization | `src/app/api/chat/route.ts`<br>`src/app/api/tts/route.ts`<br>`src/app/api/stt/route.ts`<br>`src/app/api/analyze-interview/route.ts` | API routes were public, allowing anyone to exhaust paid Meta AI and Deepgram API quotas | Enforced Supabase session cookie validation (`supabase.auth.getUser()`) before execution | **Fixed** |
| **SEC-06** | **High** | Authorization | `src/proxy.ts` | Missing Next.js edge route guard; dashboard routes relied only on client-side React rendering guards | Added `src/proxy.ts` with Supabase SSR session validation and cookie refresh | **Fixed** |
| **SEC-10** | **High** | SSRF / Redirect | `src/app/auth/callback/route.ts` | Open Redirect via unvalidated `?next=` query parameter | Restricted `next` strictly to single-slash relative paths; blocked protocol and scheme injections | **Fixed** |
| **SEC-11** | **Medium** | Host Poisoning | `src/app/auth/callback/route.ts`<br>`src/app/api/checkout/dodo/route.ts` | Trusted unvalidated `x-forwarded-host` / `origin` header in callbacks and checkout URLs | Redirects and checkout return URLs strictly resolve against configured `APP_URL` in production | **Fixed** |
| **SEC-04** | **High** | Privilege Control | `src/store/auth-store.ts` | Client `localStorage` and `user_metadata` could override server `'free'` tier with `'pro'` | Server `/api/subscription` response is now the single source of truth when `remote.found` is true | **Fixed** |
| **SEC-12** | **High** | File Uploads | `src/app/api/extract-resume/route.ts` | Unbounded PDF upload without MIME or magic-byte checks (memory exhaustion risk) | Added 5MB limit, `application/pdf` MIME check, and `%PDF-` magic-byte verification | **Fixed** |
| **SEC-13** | **High** | File Uploads | `src/app/api/stt/route.ts` | Unbounded audio file upload triggering high-memory PCM resampling | Added 10MB upload ceiling and RIFF chunk bounds checking in resampler | **Fixed** |
| **SEC-15** | **Medium** | Info Disclosure | `src/app/api/chat/route.ts`<br>`src/app/api/tts/route.ts`<br>`src/app/api/stt/route.ts` | Upstream third-party API error bodies and stack messages leaked to clients | Sanitized client error responses; detailed technical errors logged server-side only | **Fixed** |
| **SEC-08** | **Low** | Validation | `src/app/api/chat/route.ts`<br>`src/app/api/tts/route.ts` | Unvalidated model names passed directly to external APIs | Implemented strict allowlists for permitted LLM and TTS model identifiers | **Fixed** |
| **SEC-07** | **Medium** | Authorization | `src/lib/supabase/interview-service.ts` | `userId` passed as raw client argument without session validation | Enforced `auth.uid() === userId` session verification across all persistence methods | **Fixed** |
| **SEC-09** | **Medium** | Headers | `next.config.ts` | Missing Clickjacking, HSTS, `nosniff`, and Permissions Policy headers | Added comprehensive security headers in `nextConfig.headers()` | **Fixed** |
| **SEC-02** | **Low** | Credentials | `src/lib/supabase/admin.ts` | Admin client fell back to public anon key if service role key was missing | Admin client now throws an explicit error if `SUPABASE_SERVICE_ROLE_KEY` is undefined | **Fixed** |
