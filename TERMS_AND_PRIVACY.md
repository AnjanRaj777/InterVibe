# InterVibe: Master Terms of Service, Privacy Policy & Subscription Agreement

**Last Updated**: November 1, 2026  
**Effective Date**: November 1, 2026  
**Platform URL**: [https://inter-vibe.vercel.app](https://inter-vibe.vercel.app) (and [https://www.intervibe.ai](https://www.intervibe.ai))  
**Entity**: InterVibe Platform Technologies ("InterVibe", "we", "us", or "our")

---

## 📑 Master Table of Contents

1. [Preamble & Agreement Overview](#1-preamble--agreement-overview)
2. [PART I: Privacy Policy & Data Protection](#part-i-privacy-policy--data-protection)
   - [1. Scope & Application](#1-scope--application)
   - [2. Information We Collect](#2-information-we-collect)
   - [3. How We Use Your Information & Lawful Bases](#3-how-we-use-your-information--lawful-bases)
   - [4. Third-Party AI Sub-Processors & Infrastructure](#4-third-party-ai-sub-processors--infrastructure)
   - [5. Cookies, Local Storage & Design Theme Presets](#5-cookies-local-storage--design-theme-presets)
   - [6. Data Retention Policy](#6-data-retention-policy)
   - [7. International Transfers & Server Locations](#7-international-transfers--server-locations)
   - [8. Security Safeguards & Technical Measures](#8-security-safeguards--technical-measures)
   - [9. Your Privacy Rights (GDPR, CCPA & Global Provisions)](#9-your-privacy-rights-gdpr-ccpa--global-provisions)
   - [10. Data Deletion Request Process](#10-data-deletion-request-process)
3. [PART II: Terms of Service & Acceptable Use](#part-ii-terms-of-service--acceptable-use)
   - [11. Eligibility & Account Registration](#11-eligibility--account-registration)
   - [12. Dual Licensing: MIT Open-Source Code vs. Hosted Platform](#12-dual-licensing-mit-open-source-code-vs-hosted-platform)
   - [13. Intellectual Property Rights & Ownership](#13-intellectual-property-rights--ownership)
   - [14. Prohibited Conduct, Abuse & Platform Violations](#14-prohibited-conduct-abuse--platform-violations)
   - [15. Account Suspension & Termination](#15-account-suspension--termination)
4. [PART III: Subscriptions, Billing & Refund Policy](#part-iii-subscriptions-billing--refund-policy)
   - [16. Subscription Tiers & Specific Usage Limits](#16-subscription-tiers--specific-usage-limits)
   - [17. Billing Cycles, Invoicing & Taxes](#17-billing-cycles-invoicing--taxes)
   - [18. Automatic Renewal & Cancellation Procedure](#18-automatic-renewal--cancellation-procedure)
   - [19. Refund & Dispute Policy](#19-refund--dispute-policy)
   - [20. Modification of Fees & Services](#20-modification-of-fees--services)
5. [PART IV: Disclaimers, Liability & Legal Governance](#part-iv-disclaimers-liability--legal-governance)
   - [21. AI Performance Diagnostics & Employment Disclaimer](#21-ai-performance-diagnostics--employment-disclaimer)
   - [22. Service Availability & Third-Party Dependencies](#22-service-availability--third-party-dependencies)
   - [23. Limitation of Liability](#23-limitation-of-liability)
   - [24. Indemnification](#24-indemnification)
   - [25. Governing Law, Jurisdiction & Dispute Resolution](#25-governing-law-jurisdiction--dispute-resolution)
   - [26. Severability, Survival & Contact Information](#26-severability-survival--contact-information)

---

## 1. Preamble & Agreement Overview

Welcome to **InterVibe**! InterVibe is a next-generation real-time artificial intelligence mock technical interview simulator, voice intelligence engine, and candidate diagnostic platform.

By registering for an account, accessing, browsing, or using the InterVibe web platform located at `https://inter-vibe.vercel.app` or any affiliated domains, APIs, or hosted software (collectively, the **"Platform"** or **"Service"**), you (**"User"**, **"Candidate"**, **"Customer"**, or **"You"**) acknowledge that you have read, understood, and agree to be bound by this unified Master Agreement, comprising our **Privacy Policy**, **Terms of Service**, **Acceptable Use Policy**, and **Subscription & Refund Policy**.

If you are entering into this Agreement on behalf of an employer, institution, or organization, you represent and warrant that you possess full legal authority to bind that entity to these terms. If you do not agree to these terms in their entirety, you must not access or use the Platform.

---

# PART I: Privacy Policy & Data Protection

## 1. Scope & Application

This Privacy Policy describes our practices concerning the collection, storage, use, disclosure, and protection of personal data and candidate audio/document telemetry when you access or interact with InterVibe.

We operate under key principles of data minimization, transparent AI usage, and strict privacy-by-design. We do **not** sell, rent, or trade your personal data, audio recordings, or resume information to third-party data brokers or marketing conglomerates.

---

## 2. Information We Collect

### A. Candidate Provided Data & Interview Materials
1. **Resume & Career History**: When you upload your curriculum vitae or resume (`.pdf`), our parser extracts plain text including employment history, technical stack proficiencies, project achievements, and educational background to seed the conversational interviewer persona.
2. **Target Role & Job Descriptions**: Job titles, industry levels (Junior, Mid, Senior, Staff/Lead), and employer job description requirements provided to contextualize the interview loop.
3. **Voice Audio & Microphonic Inputs**:
   - While operating Push-to-Talk (holding the Spacebar or on-screen button), your browser captures raw audio samples.
   - Audio is resampled client-side via the Web Audio API into 16,000Hz 16-bit mono PCM WAV buffers and streamed to our speech recognition endpoints for real-time transcription.
4. **Dialogue & Conversation Transcripts**: Complete verbatim textual dialogue exchanged between candidate and AI personas during mock interview rounds.
5. **Account Credentials & Profile Attributes**: Full name, email address, password hashes, preferred interview focus, target compensation/seniority tier, and selected user avatar.

### B. Automatically Collected Diagnostic & Technical Telemetry
1. **Verbal Telemetry & AI Diagnostic Outputs**: Quantitative readiness indices (0–100), technical depth scores, architectural competencies, communication clarity metrics, filler word frequencies, speaking pace, and practice speaking time.
2. **Device & Browser Logs**: IP address, browser type and version, operating system, referrer URL, timestamps, performance latencies (e.g. LLM round-trip tokens/second), and error diagnostic traces.
3. **Audio Playback Telemetry**: Normalized soundwave amplitudes used in real time to calculate ARKit facial blendshapes (`mouthOpen`, `mouthSmile`, `eyeBlink`) for the 3D WebGL avatar engine.

---

## 3. How We Use Your Information & Lawful Bases

Under the EU General Data Protection Regulation (**GDPR**, Art. 6) and comparable global data privacy frameworks, we process your personal data under the following legal bases:

| Category of Data | Processing Purpose | Lawful Basis (GDPR Art. 6) |
| :--- | :--- | :--- |
| **Account Info & Email** | Account provisioning, identity verification, session security, password resets, and critical service notifications. | **Contract Performance** (Art. 6(1)(b)) |
| **Resumes & Job Descriptions** | Ingesting context into system prompts to generate tailored, relevant interview questions. | **Contract Performance** (Art. 6(1)(b)) |
| **Voice Audio Streams** | Transcribing spoken candidate answers into text via speech-to-text inference. | **Explicit Consent** (Art. 6(1)(a)) / **Contract** |
| **Dialogue Transcripts** | Orchestrating multi-turn verbal reasoning and generating post-session diagnostics. | **Contract Performance** (Art. 6(1)(b)) |
| **Aggregated Telemetry** | Platform performance monitoring, audio latency benchmarking, model hallucination reduction, and security audits. | **Legitimate Interest** (Art. 6(1)(f)) |
| **Billing & Invoices** | Subscription fee collection, tax compliance, fraud prevention, and audit records. | **Legal Obligation** (Art. 6(1)(c)) |

---

## 4. Third-Party AI Sub-Processors & Infrastructure

To provide ultra-low-latency verbal loops, photorealistic avatars, and resilient infrastructure, InterVibe engages trusted sub-processors. Each sub-processor is bound by strict Data Processing Agreements (DPAs) and confidentiality obligations:

1. **Meta AI Model Platform**:
   - **Models**: Meta Muse Spark 1.3 Contributor (LLM) and Meta Muse Voice Transcribe 1.0 (STT).
   - **Purpose**: Conversational interview simulation, real-time audio transcription, and post-interview diagnostic scoring.
   - **Data Shared**: Ephemeral audio chunks and text transcripts. Zero candidate data is used to train public foundation models without explicit agreement.
2. **Deepgram (Aura Neural Speech Synthesis)**:
   - **Models**: `aura-asteria-en`, `aura-orion-en`, `aura-luna-en`.
   - **Purpose**: Low-latency neural streaming text-to-speech voice generation.
   - **Data Shared**: Sanitized assistant response text chunks.
3. **Groq Cloud (Failover Infrastructure)**:
   - **Models**: Groq Whisper Large v3 and LLaMA 3.3 70B Versatile / gpt-oss-120b.
   - **Purpose**: Automated high-availability failover inference if primary Meta AI endpoints experience upstream throttling or network partition.
4. **Supabase Inc.**:
   - **Purpose**: Authenticated user sessions (GoTrue Auth via `@supabase/ssr`), PostgreSQL database persistence (`profiles`, `interview_sessions`, `session_messages`), and secure S3-compatible document storage.
   - **Security**: Hardened with Row Level Security (RLS) enforcing strict per-user tenant boundaries.
5. **XRSPACE (Perxona Connect)**:
   - **Purpose**: Optional cloud-streamed photorealistic talking avatar video presentation fallback.
   - **Data Shared**: Server-side authorized session tickets and presentation tokens.
6. **Vercel Inc.**:
   - **Purpose**: Global Edge CDN delivery, Next.js 16 serverless compute execution, and edge request proxy routing.

---

## 5. Cookies, Local Storage & Design Theme Presets

InterVibe utilizes small text files (**"Cookies"**) and HTML5 browser storage (**"Local Storage"**) to optimize security and user experience:

1. **Strictly Necessary Cookies**: Managed by `@supabase/ssr` to securely maintain encrypted session tokens and refresh tokens across page navigations. Cannot be disabled without breaking authentication.
2. **Functional Local Storage**:
   - **Design Theme Selector**: Remembers your preferred styling preset (**▲ Vercel**, **⚡ Supabase**, ** Claude**, **🧘 Zen**, **⬛ Mono**, **💬 WhatsApp**, **🚀 Astro Vista**, **🌿 Light Green**, **📐 Neobrutalism**, or **📝 Notebook**).
   - **Light / Dark Mode State**: Stores active CSS class values to prevent visual flickering on page load.
   - **Offline Session Cache**: Caches recent mock interview records in `intervibe-sessions-storage` so candidates can inspect past scorecards without waiting for network calls.
3. **Analytics Cookies**: Minimal, anonymized performance metrics measuring asset loading speeds and Three.js WebGL framerate health. We do **not** deploy cross-site behavioral retargeting trackers or selling cookies.

---

## 6. Data Retention Policy

We retain personal data only for the duration necessary to deliver the Services or comply with legal requirements:

1. **Voice Audio Payloads**: Raw microphone PCM WAV streams sent to `/api/stt` are processed ephemerally in server memory and discarded immediately following transcription. We do **not** permanently archive your raw audio streams on storage disks unless you explicitly opt in to voice replay archiving.
2. **Session Transcripts & Diagnostic Reports**: Stored in your private Supabase profile for as long as your account remains active, allowing you to review historical skill progression.
3. **Candidate Resume Uploads**: Temporary extracted text is preserved in your session context during interview generation and retained for a maximum default duration of **one (1) year** from upload, unless deleted earlier by you.
4. **Account Inactivity & Archival**: Accounts inactive for more than twenty-four (24) continuous months may be scheduled for permanent anonymization and data purging after email notification.

---

## 7. International Transfers & Server Locations

InterVibe services are hosted in enterprise data centers primarily located in the **United States** and the **European Economic Area (EEA)** through Vercel and Supabase infrastructure.

If you access the Platform from outside the United States or the EEA, your information will be transferred to and maintained on systems governed by standard contractual clauses (SCCs) and rigorous encryption standards ensuring an adequate level of data protection in compliance with global standards.

---

## 8. Security Safeguards & Technical Measures

Following comprehensive application security architecture audits (documented in our [`SECURITY.md`](SECURITY.md) and [`AUDIT_REPORT.md`](AUDIT_REPORT.md)), InterVibe employs defense-in-depth safeguards:

1. **Next.js 16 Edge Route Proxy Guard**: [`src/proxy.ts`](src/proxy.ts) verifies authenticated Supabase SSR session cookies on all `/dashboard/*` pathways before serving sensitive candidate screens.
2. **Server-Side API Route Protection**: All AI execution routes ([`/api/chat`](src/app/api/chat/route.ts), [`/api/stt`](src/app/api/stt/route.ts), [`/api/tts`](src/app/api/tts/route.ts), [`/api/analyze-interview`](src/app/api/analyze-interview/route.ts)) validate active session tokens prior to consuming cloud AI quotas.
3. **Insecure Direct Object Reference (IDOR) Prevention**: Database operations in `interview-service.ts` rigorously enforce `auth.uid() === userId`, blocking unauthorized inspection or tampering with peer candidate evaluations.
4. **Strict File Upload & Memory Bounds**:
   - PDF uploads are capped at a strict **5MB ceiling**, verified for `application/pdf` MIME conformity, and validated against binary `%PDF-` magic-bytes.
   - Audio payloads are capped at **10MB** with RIFF boundary verification to prevent Node.js event-loop memory exhaustion.
5. **Open Redirect & Host Poisoning Defenses**: Callback handlers ([`/auth/callback`](src/app/auth/callback/route.ts)) reject non-relative URL targets and validate request origins against registered application domains.
6. **HTTP Security Headers**: Next.js automatically transmits `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and strict `Permissions-Policy` across all responses.
7. **Error Sanitization**: Server-side error logs conceal external API keys, bearer tokens, and internal stack traces from client responses.

---

## 9. Your Privacy Rights (GDPR, CCPA & Global Provisions)

Depending on your country or state of residence (e.g., EU/EEA, United Kingdom, California, Canada), you enjoy substantial privacy rights regarding your Personal Data:

- **Right of Access**: You have the right to request a copy of the personal data, interview transcripts, and performance ratings we hold about you.
- **Right to Rectification**: You can edit and update your candidate profile, target role, and seniority level directly inside `/dashboard/profile`.
- **Right to Erasure ("Right to be Forgotten")**: You may request permanent deletion of all stored transcripts, resumes, and user accounts.
- **Right to Data Portability**: You may export your interview scorecards and billing records via our one-click CSV export utility.
- **Right to Restrict or Object to Processing**: You may challenge processing based on legitimate interests or revoke consent for voice-based diagnostic simulations.
- **Non-Discrimination**: We will never discriminate against you, degrade your service quality, or alter pricing because you exercised your statutory privacy rights.

---

## 10. Data Deletion Request Process

To permanently delete your InterVibe account, transcripts, and all associated personal data:

1. **Self-Service Option**: Navigate to [`/dashboard/profile`](src/app/dashboard/profile/page.tsx) and select **"Clear Local Sessions & Cache"**, then click **"Delete Account"** in the Danger Zone.
2. **Written Request**: Send an email to **`privacy@intervibe.ai`** with the subject line:  
   `"Data Deletion Request - [Your Registered Email]"`
3. **Verification & Execution**: To protect account security, we will verify ownership of the registered email address. Valid requests are permanently expunged across active database tables within **thirty (30) calendar days**, except where retention is strictly required to comply with statutory accounting or legal obligations.

---

# PART II: Terms of Service & Acceptable Use

## 11. Eligibility & Account Registration

1. **Age Requirement**: You must be at least eighteen (18) years of age, or the age of legal majority in your jurisdiction, to create an account and use InterVibe. Individuals between sixteen (16) and eighteen (18) may only use the Platform under direct parental or legal guardian supervision.
2. **Account Integrity**: You agree to provide accurate, truthful, and up-to-date registration information. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account.
3. **Notification**: You must notify us immediately at `security@intervibe.ai` if you discover or suspect any unauthorized access or security breach involving your account.

---

## 12. Dual Licensing: MIT Open-Source Code vs. Hosted Platform

InterVibe operates under a transparent, explicit **Dual Licensing and Service Model**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INTERVIBE ARCHITECTURE                          │
├──────────────────────────────────┬─────────────────────────────────────┤
│   OPEN-SOURCE REPOSITORY CODE    │    HOSTED CLOUD PLATFORM & APIS     │
│       (Under MIT License)        │       (Under Commercial Terms)      │
├──────────────────────────────────┼─────────────────────────────────────┤
│ • Next.js Frontend Components    │ • Live Hosted Application at        │
│ • Tailwind CSS & Themes          │   inter-vibe.vercel.app             │
│ • Local 3D WebGL Avatar Logic    │ • Paid Meta Muse Spark 1.3 LLM APIs │
│ • Client-Side DSP Resamplers     │ • Deepgram Aura Streaming TTS APIs  │
│ • Self-Hosted Local Running      │ • Meta Voice Transcribe STT APIs    │
│                                  │ • Managed Supabase Cloud DB & Auth  │
│                                  │ • XRSPACE Cloud Video Presenter     │
└──────────────────────────────────┴─────────────────────────────────────┘
```

1. **The Open-Source Repository (MIT License)**:
   - The standalone software source code published in the official GitHub repository (`github.com/AnjanRaj777/InterVibe`) is licensed under the permissive **MIT License** (see [`LICENSE`](LICENSE)).
   - You are free to inspect, fork, modify, self-host, and run the code on your own private infrastructure, provided you supply your own API credentials (`MODEL_API_KEY`, `DEEPGRAM_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and include the original copyright notice.
2. **The Hosted Cloud Service (Commercial Terms)**:
   - These Terms of Service govern your access to the **official hosted service** (`inter-vibe.vercel.app`), proprietary avatar assets, our managed cloud databases, and our funded upstream third-party AI inference pipelines.
   - The MIT License governing the raw codebase **does not grant** you free, unrestricted, or unmetered access to our paid AI API endpoints, proxy servers, or hosted cloud resources without a valid subscription or authorized credit allotment.

---

## 13. Intellectual Property Rights & Ownership

1. **InterVibe IP**: The platform name, brand identity, InterVibe logo, custom soundwave visualizers, 3D character avatar models (`sarah.glb`, `michael.glb`, `emma.glb`), user interfaces, custom theme stylesheets, and proprietary evaluation prompts are the exclusive intellectual property of InterVibe Platform Technologies and its licensors.
2. **Candidate Data Ownership**: You retain 100% full ownership of your uploaded resumes, written statements, and interview responses.
3. **Limited Service License**: Subject to compliance with these Terms, InterVibe grants you a revocable, non-exclusive, non-transferable, non-sublicensable limited license to access and use the hosted Platform for your personal, non-commercial interview preparation (or internal organizational evaluation if subscribed to Teams).
4. **Candidate Feedback & Suggestions**: If you transmit ideas, feature recommendations, or improvements regarding the interview engine or avatars, you grant InterVibe an irrevocable, royalty-free, perpetual license to implement and commercialize such feedback without restriction or financial accounting.

---

## 14. Prohibited Conduct, Abuse & Platform Violations

To preserve platform reliability, protect expensive AI inference quotas, and foster a professional environment, the following actions are strictly prohibited (**"Violations"**):

### A. Infrastructure & API Abuse
- **Automated Scraping & Flooding**: Utilizing bots, scrapers, crawlers, or automated scripts to invoke API routes ([`/api/chat`](src/app/api/chat/route.ts), [`/api/stt`](src/app/api/stt/route.ts), [`/api/tts`](src/app/api/tts/route.ts), [`/api/analyze-interview`](src/app/api/analyze-interview/route.ts)) or extract data without express written permission.
- **Quota Draining & Denial of Service**: Intentionally transmitting oversized audio payloads, polyglot PDF bombs, or recursive requests intended to exhaust server memory, bypass rate limiters, or deplete our upstream API allowances.
- **Circumventing Access Controls**: Bypassing, spoofing, or tampering with Next.js edge route guards, session cookies, payment paywalls, or database Row Level Security policies.

### B. Adversarial AI & Prompt Injection
- **Jailbreaking & Persona Hijacking**: Attempting prompt injection, adversarial prefix attacks, or instruction override exploits designed to cause the Meta Muse Spark 1.3 model to break character, output malicious code, emit offensive diatribes, or divulge backend system instructions.
- **Model Probing**: Sending repetitive exploratory prompts designed to extract underlying system prompts, private recruiter calibration matrices, or proprietary prompt architecture.

### C. Content & Behavioral Misconduct
- **Offensive Content**: Speaking, inputting, or uploading content that is defamatory, racially hateful, sexually explicit, harassing, threatening, or infringing upon any third party’s intellectual property or privacy rights.
- **Account Sharing & Resale**: Reselling, sublicensing, leasing, or renting hosted cloud interview accounts, or sharing a single individual candidate license across multiple job seekers.

---

## 15. Account Suspension & Termination

1. **Termination by User**: You may terminate your account at any time by discontinuing use of the Service or selecting **"Delete Account"** in your Profile settings.
2. **Termination by InterVibe**: We reserve the right to immediately suspend, throttle, or terminate your account and revoke platform access without prior notice or liability if:
   - You commit a material breach of any provision of these Terms or Acceptable Use rules;
   - We detect fraudulent chargebacks, unauthorized credit card use, or payment delinquencies;
   - Your account is implicated in automated botting, malicious file uploads, or deliberate quota-draining attacks;
   - Continued provision of the Service to you would expose InterVibe to legal liability or regulatory sanction.
3. **Consequences of Termination**: Upon termination, your right to use the Platform ceases immediately. Sections covering Intellectual Property, Disclaimers, Limitation of Liability, and Indemnification shall survive termination.

---

# PART III: Subscriptions, Billing & Refund Policy

## 16. Subscription Tiers & Specific Usage Limits

InterVibe provides four distinct subscription tiers structured to match individual candidates, active job seekers, and hiring organizations. Usage allocations reset at the start of each periodic billing cycle:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              INTERVIBE SUBSCRIPTION MATRIX                             │
├──────────────┬──────────────────┬─────────────────┬─────────────────┬──────────────────┤
│ FEATURE /    │ FREE STARTER     │ HUSTLER         │ PRO (RECOMMENDED│ TEAMS / ORGS     │
│ METRIC       │                  │                 │ MOST POPULAR)   │ (ENTERPRISE)     │
├──────────────┼──────────────────┼─────────────────┼─────────────────┼──────────────────┤
│ Monthly Rate │ ₹0 / mo          │ ₹499 / mo       │ ₹1,499 / mo     │ ₹4,999 / seat/mo │
│ Annual Rate  │ ₹0 / mo          │ ₹349 / mo (-30%)│ ₹1,049/mo (-30%)│ ₹3,499/seat (-30%)
│ Monthly Runs │ 3 interviews     │ 20 interviews   │ 100 interviews  │ 500 pooled runs  │
│ Monthly Time │ 30 minutes total │ 300 minutes     │ 1,200 minutes   │ 5,000 pooled min │
│ AI Engine    │ Standard LLM     │ Muse Spark 1.3  │ Muse Spark 1.3  │ Muse Spark + Fine│
│ Voice Output │ Basic Voice      │ Deepgram Aura   │ Deepgram Aura   │ Aura + Custom    │
│ 3D Avatars   │ Sarah (Basic)    │ Sarah & Michael │ All 3D Avatars  │ Custom Avatars   │
│ Diagnostics  │ Basic Overall    │ Full Scorecard  │ Radar + Drills  │ Org Benchmark    │
│ Templates    │ 1 standard       │ 10 + Custom JDs │ Unlimited JDs   │ Unlimited Org    │
│ Data Export  │ View only        │ View only       │ PDF & Notion    │ CSV & API Webhook│
│ Support      │ Community        │ Standard Email  │ Priority Slack  │ Dedicated Rep    │
└──────────────┴──────────────────┴─────────────────┴─────────────────┴──────────────────┘
```

- **Quota Reset**: Unused interview counts or minutes do not roll over to subsequent billing cycles.
- **Fair Use Policy**: Accounts exceeding human conversational bounds (e.g., continuous automated 24/7 audio piping) are subject to speed throttling to preserve system resources for all candidates.

---

## 17. Billing Cycles, Invoicing & Taxes

1. **Billing Frequency**: Subscriptions are billed in advance on either a **Monthly** or **Annual** basis, commencing on the calendar date you first activate your paid subscription (**"Start Date"**).
2. **Payment Processing**: All financial transactions are encrypted and processed through certified third-party payment gateways (e.g. **Dodo Payments** / **Stripe**). InterVibe does not store your full raw credit/debit card numbers or CVV codes on our servers.
3. **Invoicing & Receipts**: Electronic invoices detailing plan tier, GST/VAT/sales tax, and transaction timestamps are generated automatically and accessible via [`/dashboard/billing`](src/app/dashboard/billing/page.tsx) with one-click CSV ledger export.
4. **Taxes**: All posted prices are exclusive of local sales tax, Value Added Tax (VAT), or Goods and Services Tax (GST) unless explicitly indicated otherwise. You are responsible for all applicable governmental assessments associated with your purchase.

---

## 18. Automatic Renewal & Cancellation Procedure

1. **Continuous Renewal**: To prevent unexpected interruptions during critical interview preparation periods, all paid subscriptions **automatically renew** at the conclusion of each billing cycle for the same duration and rate, unless cancelled prior to renewal.
2. **Cancellation Procedure**: You may cancel your subscription renewal at any time with zero penalty:
   - Navigate to [`/dashboard/billing`](src/app/dashboard/billing/page.tsx);
   - Click on your active plan settings and select **"Cancel Subscription"**;
   - Or email `billing@intervibe.ai` at least forty-eight (48) hours prior to your scheduled renewal date.
3. **Post-Cancellation Access**: When you cancel, your subscription remains active with full tier privileges until the conclusion of your current prepaid billing cycle. You will not be charged again, and your account will automatically downgrade to the **Free Starter** tier upon cycle expiration.

---

## 19. Refund & Dispute Policy

We take pride in delivering realistic interview loops, and we want you to be fully confident in your preparation:

### A. 7-Day Money-Back Guarantee (First-Time Subscriptions)
If you subscribe to a paid plan (**Hustler** or **Pro**) for the very first time and are not satisfied with the simulation quality, you are entitled to a **full 100% refund**, subject to the following fair-usage conditions:
1. The refund request is submitted in writing to `billing@intervibe.ai` within **seven (7) calendar days** of your initial transaction; and
2. You have completed **fewer than three (3) mock interview loops** and consumed **less than thirty (30) minutes** of total audio simulation time.

### B. Non-Refundable Scenarios
Except as provided in the 7-day guarantee or required by applicable statutory consumer protection laws:
- **Recurring Renewals**: Payments made for recurring renewals after the initial billing cycle are **non-refundable**.
- **Partial Use & Early Cancellation**: No partial, pro-rated refunds or credit balances are issued for mid-cycle cancellations or unused interview allocations.
- **Account Suspensions for Cause**: Accounts terminated due to violations of our Acceptable Use Policy (e.g., prompt injection attacks, API scraping, harassment) forfeit all remaining subscription balances and are ineligible for refunds.

### C. Chargeback & Billing Dispute Protocol
If you observe an unexpected charge, please contact our support team at `billing@intervibe.ai` before initiating a formal banking chargeback. We investigate and resolve legitimate billing discrepancies within two (2) business days.

---

## 20. Modification of Fees & Services

InterVibe reserves the right to modify subscription fees or adjust plan usage allocations at our discretion. Any pricing modifications will take effect **only at the end of your then-current billing cycle**.

We will provide at least **thirty (30) days advance notice** via email or prominent platform notification prior to any price increase, affording you full opportunity to review, upgrade, or cancel your subscription before new rates apply.

---

# PART IV: Disclaimers, Liability & Legal Governance

## 21. AI Performance Diagnostics & Employment Disclaimer

> [!IMPORTANT]
> **SIMULATION & EDUCATIONAL PURPOSE ONLY**:  
> InterVibe is an educational interview practice tool powered by generative artificial intelligence.

1. **No Employment Guarantee**: InterVibe does **not** represent an actual employer, executive recruiter, or hiring agency. Completing mock interview loops, achieving a high readiness index (e.g., 95/100), or mastering practice drills **does not guarantee** that you will receive job offers, pass third-party interview loops, or attain specific salary thresholds.
2. **Simulated Scoring**: Diagnostic evaluations, skill radar scores, filler word counts, and architectural assessments are generated probabilistically using Meta Muse Spark 1.3 models. They represent simulated heuristic feedback and should not be construed as definitive psychological, linguistic, or professional aptitude certifications.
3. **AI Hallucinations**: While our prompts enforce strict realism and one-question verbal discipline, large language models may occasionally generate inaccurate technical assertions or idiosyncratic evaluations. Candidates should independently verify distributed systems patterns and code algorithms.

---

## 22. Service Availability & Third-Party Dependencies

1. **Uptime Striving**: We strive to maintain continuous 99.9% platform availability. However, service access may occasionally be suspended or degraded due to emergency maintenance, hardware failure, upstream AI API latency (Meta, Deepgram, Groq), or telecommunications partitions.
2. **Third-Party Model Upstream**: InterVibe relies upon frontier cloud APIs. If a third-party AI provider ceases operations, alters API availability, or experiences outages, InterVibe will route traffic to failover providers (e.g. Groq Cloud Whisper and LLaMA 3.3) but cannot guarantee uninterrupted performance during major third-party cloud incidents.

---

## 23. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL INTERVIBE PLATFORM TECHNOLOGIES, NOR ITS FOUNDERS, OFFICERS, DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE FOR:
1. ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES;
2. LOSS OF PROFITS, REVENUE, DATA, GOODWILL, EMPLOYMENT OPPORTUNITIES, OR OTHER INTANGIBLE LOSSES;
3. DAMAGES ARISING FROM (I) YOUR ACCESS TO, USE OF, OR INABILITY TO USE THE PLATFORM; (II) ANY THIRD-PARTY CONDUCT OR UPSTREAM AI MODEL FAILURES; (III) BUGS, VIRUSES, TROJAN HORSES, OR TRANSMISSION INTERRUPTIONS; OR (IV) UNAUTHORIZED ACCESS OR ALTERATION OF YOUR RESUMES, AUDIO RECORDINGS, OR TRANSCRIPTS.

**MAXIMUM AGGREGATE LIABILITY**:  
IN NO EVENT SHALL INTERVIBE’S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE EXCEED THE TOTAL FEES ACTUALLY PAID BY YOU TO INTERVIBE IN THE **THREE (3) MONTHS IMMEDIATELY PRECEDING** THE EVENT GIVING RISE TO LIABILITY, OR **ONE HUNDRED US DOLLARS ($100.00 USD)**, WHICHEVER IS GREATER.

---

## 24. Indemnification

You agree to defend, indemnify, and hold harmless InterVibe, its affiliates, directors, officers, contractors, and agents from and against any and all claims, damages, liabilities, losses, costs, or expenses (including reasonable attorneys' fees and court costs) arising out of or related to:
1. Your misuse of the Platform or violation of these Terms;
2. Any candidate content, resume materials, or audio statements you upload or transmit that infringe upon any patent, copyright, trademark, trade secret, or privacy right of any third party;
3. Your violation of any applicable federal, state, national, or international statute or regulation.

---

## 25. Governing Law, Jurisdiction & Dispute Resolution

1. **Governing Law**: These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of the **State of Delaware, United States** (or, for users residing in the European Union, the mandatory consumer protection laws of your country of habitual residence), without regard to its conflict of law principles.
2. **Informal Dispute Resolution**: In the event of any controversy, controversy, or claim, you agree to first attempt to resolve the dispute informally by contacting **`legal@intervibe.ai`**. Both parties will make good-faith efforts to reach an amicable resolution within thirty (30) calendar days.
3. **Binding Arbitration / Exclusive Jurisdiction**: Any dispute that cannot be resolved informally shall be resolved by binding individual arbitration administered under the Commercial Arbitration Rules of the American Arbitration Association (AAA), or within the competent state or federal courts located in Delaware. **You agree to resolve all disputes on an individual basis and waive any right to participate in a class-action lawsuit or class-wide arbitration.**

---

## 26. Severability, Survival & Contact Information

1. **Entire Agreement**: These Terms, together with our Privacy Policy, Security Policy, and any signed enterprise order forms, constitute the entire agreement between you and InterVibe concerning the Platform.
2. **Severability**: If any provision of these Terms is found to be illegal, invalid, or unenforceable by a court of competent jurisdiction, that provision shall be modified to the minimum extent necessary to make it valid, and the remaining provisions shall remain in full force and effect.
3. **No Waiver**: Our failure to enforce any right or provision of these Terms shall not constitute a waiver of future enforcement of that right.
4. **Official Contact Information**:

For questions, feedback, privacy inquiries, or billing assistance:
- **General Inquiries & Support**: `support@intervibe.ai`
- **Data Privacy & GDPR Requests**: `privacy@intervibe.ai`
- **Billing & Subscription Inquiries**: `billing@intervibe.ai`
- **Security Vulnerability Reporting**: `security@intervibe.ai`
- **Official Repository**: [https://github.com/AnjanRaj777/InterVibe](https://github.com/AnjanRaj777/InterVibe)
