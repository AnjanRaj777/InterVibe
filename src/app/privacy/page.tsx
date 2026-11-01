import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, FileText } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | InterVibe',
  description: 'InterVibe Master Privacy Policy, candidate data protections, audio stream retention, and GDPR rights.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0f1211] text-[#e7eceb] py-12 px-5 sm:px-8 font-sans selection:bg-[#78fcd6] selection:text-[#0d0f0e]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Shield className="size-3.5" />
            <span>GDPR & CCPA Compliant</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-neutral-400">
            Last Updated: November 1, 2026 • Effective Date: November 1, 2026
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-8 text-neutral-300 text-sm leading-relaxed border-t border-white/10 pt-8">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lock className="size-4 text-emerald-400" />
              <span>1. Overview & Data Minimization</span>
            </h2>
            <p>
              InterVibe Platform Technologies (&quot;InterVibe&quot;, &quot;we&quot;, &quot;us&quot;) operates the real-time AI mock interview platform at <span className="text-emerald-400">inter-vibe.vercel.app</span>. We believe in privacy-by-design: we do <strong>not</strong> sell, rent, or trade your personal data, audio recordings, or resume information to third-party data brokers or marketing advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-300">
              <li>
                <strong>Voice Audio Streams</strong>: During Push-to-Talk (holding Spacebar), microphone audio is captured and downsampled client-side to 16kHz mono 16-bit PCM WAV before being sent to our speech-to-text API. Audio is processed ephemerally in memory and discarded immediately following transcription.
              </li>
              <li>
                <strong>Resume Documents & Career Context</strong>: When you upload a resume (PDF), plain text is extracted to contextualize interviewer questions. Uploads are strictly bound to a 5MB limit and verified against binary <code className="bg-neutral-800 px-1 py-0.5 rounded text-emerald-300 font-mono text-xs">%PDF-</code> magic bytes.
              </li>
              <li>
                <strong>Interview Transcripts & Telemetry</strong>: Written dialogue turns and performance metrics (overall score, technical depth, clarity, architecture score, speaking time, and filler words) are saved to your private account profile.
              </li>
              <li>
                <strong>Account Credentials</strong>: Name, email address, hashed passwords, target role, and seniority level managed securely via Supabase SSR Authentication.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. Third-Party AI Sub-Processors</h2>
            <p>We work with enterprise AI providers under strict Data Processing Agreements (DPAs):</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="border border-neutral-800 bg-neutral-900/50 p-3.5 rounded-lg space-y-1">
                <div className="font-semibold text-white text-xs">Meta AI (Muse Spark & Voice Transcribe)</div>
                <p className="text-xs text-neutral-400">Real-time STT audio transcription, conversational interview reasoning, and diagnostic evaluations.</p>
              </div>
              <div className="border border-neutral-800 bg-neutral-900/50 p-3.5 rounded-lg space-y-1">
                <div className="font-semibold text-white text-xs">Deepgram Aura</div>
                <p className="text-xs text-neutral-400">Ultra-low-latency neural streaming text-to-speech voice generation (Asteria, Orion, Luna).</p>
              </div>
              <div className="border border-neutral-800 bg-neutral-900/50 p-3.5 rounded-lg space-y-1">
                <div className="font-semibold text-white text-xs">Supabase (PostgreSQL & Auth)</div>
                <p className="text-xs text-neutral-400">Isolated database storage with Row Level Security (RLS) enforcing candidate ownership.</p>
              </div>
              <div className="border border-neutral-800 bg-neutral-900/50 p-3.5 rounded-lg space-y-1">
                <div className="font-semibold text-white text-xs">Groq Cloud (Failover)</div>
                <p className="text-xs text-neutral-400">Automated fallback inference for Whisper Large v3 and LLaMA 3.3 during network anomalies.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. Cookies & Local Storage</h2>
            <p>
              We do not use tracking or advertising cookies. We use essential cookies strictly to maintain your authenticated login session, and browser Local Storage to remember your preferred UI design preset (e.g. Vercel, Supabase, Claude, Zen, Mono) and dark/light mode preference.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">5. Your Data Subject Rights (GDPR & CCPA)</h2>
            <p>
              Under GDPR and CCPA, you retain full rights to access, rectify, port, or permanently delete your personal information, interview transcripts, and resume data. You can export your data via the dashboard or trigger permanent account deletion.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">6. How to Request Data Deletion</h2>
            <p>
              To permanently purge your account and all associated transcripts, resumes, and telemetry from our database, email <a href="mailto:privacy@intervibe.ai" className="text-emerald-400 hover:underline">privacy@intervibe.ai</a> with the subject line <strong>&quot;Data Deletion Request&quot;</strong>. We verify your registered email and permanently expunge all records within 30 calendar days.
            </p>
          </section>
        </div>

        {/* Footer Link */}
        <div className="pt-8 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <Link href="/terms" className="hover:text-white transition-colors">
            View Terms of Use →
          </Link>
          <span>© 2026 InterVibe. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
