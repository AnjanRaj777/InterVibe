import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileCheck, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

export const metadata = {
  title: 'Terms of Use | InterVibe',
  description: 'InterVibe Terms of Service, Acceptable Use, Subscription limits, MIT License relationship, and Refund Policy.',
};

export default function TermsOfUsePage() {
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
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            <Scale className="size-3.5" />
            <span>User Agreement & Policies</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Terms of Use
          </h1>
          <p className="text-sm text-neutral-400">
            Last Updated: November 1, 2026 • Effective Date: November 1, 2026
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-8 text-neutral-300 text-sm leading-relaxed border-t border-white/10 pt-8">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileCheck className="size-4 text-cyan-400" />
              <span>1. Agreement & Acceptance</span>
            </h2>
            <p>
              By accessing or using the hosted InterVibe platform at <span className="text-cyan-400">inter-vibe.vercel.app</span>, you agree to comply with and be bound by these Terms of Use. If you do not agree with any part of these Terms, you may not access or use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. Dual Licensing: MIT Open-Source vs. Hosted Platform</h2>
            <div className="border border-neutral-800 bg-neutral-900/60 p-4 rounded-lg space-y-2">
              <p className="text-white font-medium text-xs">Clarification of Open-Source Rights & Commercial Cloud Services:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-300">
                <li>
                  <strong>Open-Source Repository (MIT License)</strong>: The raw codebase published in our public repository is released under the permissive MIT License. You may inspect, fork, modify, and self-host the code using your own infrastructure and private API keys.
                </li>
                <li>
                  <strong>Hosted Cloud Service (Commercial Terms)</strong>: These Terms of Use govern access to our official production application (<span className="text-emerald-400">inter-vibe.vercel.app</span>), our proprietary 3D avatar assets, managed cloud databases, and paid upstream AI inference compute (Meta Muse Spark 1.3 and Deepgram Aura). The MIT License does <em>not</em> grant free, unmetered access to our paid hosted cloud resources.
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. Subscription Tiers & Usage Limits</h2>
            <p>Usage quotas reset at the start of each monthly or annual billing cycle:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="border border-neutral-800 bg-neutral-900/50 p-3.5 rounded-lg space-y-1.5">
                <div className="font-semibold text-white">Free Starter</div>
                <div className="font-mono text-emerald-400 font-bold">₹0 / mo</div>
                <ul className="space-y-1 text-neutral-400 text-[11px]">
                  <li>• 3 interviews / month</li>
                  <li>• 30 minutes total</li>
                  <li>• Basic AI feedback</li>
                </ul>
              </div>
              <div className="border border-neutral-800 bg-neutral-900/50 p-3.5 rounded-lg space-y-1.5">
                <div className="font-semibold text-white">Hustler</div>
                <div className="font-mono text-cyan-400 font-bold">₹499 / mo</div>
                <ul className="space-y-1 text-neutral-400 text-[11px]">
                  <li>• 20 interviews / month</li>
                  <li>• 300 minutes total</li>
                  <li>• Resume analysis + full feedback</li>
                </ul>
              </div>
              <div className="border border-white/20 bg-neutral-900/80 p-3.5 rounded-lg space-y-1.5">
                <div className="font-semibold text-white">Pro (Most Popular)</div>
                <div className="font-mono text-white font-bold">₹1,499 / mo</div>
                <ul className="space-y-1 text-neutral-300 text-[11px]">
                  <li>• 100 interviews / month</li>
                  <li>• 1,200 minutes total</li>
                  <li>• All 3D avatars + PDF export</li>
                </ul>
              </div>
              <div className="border border-neutral-800 bg-neutral-900/50 p-3.5 rounded-lg space-y-1.5">
                <div className="font-semibold text-white">Teams / Enterprise</div>
                <div className="font-mono text-purple-400 font-bold">₹4,999 / seat</div>
                <ul className="space-y-1 text-neutral-400 text-[11px]">
                  <li>• 500 interviews / month</li>
                  <li>• 5,000 pooled minutes</li>
                  <li>• SSO + custom interviewers</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. Cancellation & 7-Day Refund Policy</h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-300">
              <li>
                <strong>Cancellation</strong>: You may cancel your subscription at any time via <code className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-300 font-mono text-xs">/dashboard/billing</code>. Your access remains active until the end of your prepaid period.
              </li>
              <li>
                <strong>7-Day Money-Back Guarantee (First-Time Paid Subscribers)</strong>: If you are dissatisfied with your first paid plan, you are entitled to a full refund within 7 calendar days of purchase, provided you have completed fewer than 3 interview loops and consumed less than 30 total minutes. Email <a href="mailto:billing@intervibe.ai" className="text-cyan-400 hover:underline">billing@intervibe.ai</a>.
              </li>
              <li>
                <strong>Renewals & Partial Use</strong>: Recurring renewal charges and mid-cycle cancellations are non-refundable.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">5. Prohibited Conduct & Violations</h2>
            <p>InterVibe enforces a zero-tolerance policy against:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-300">
              <li>Automated scraping, botting, or quota draining attacks against our AI routes (<code className="text-neutral-400 font-mono text-xs">/api/chat</code>, <code className="text-neutral-400 font-mono text-xs">/api/stt</code>, <code className="text-neutral-400 font-mono text-xs">/api/tts</code>).</li>
              <li>Prompt injection, jailbreaking, or adversarial attempts to force the AI interviewer to break character or emit toxic content.</li>
              <li>Uploading malicious PDF exploits or corrupt audio bombs.</li>
              <li>Sublicensing, sharing, or reselling candidate accounts across multiple users.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">6. Educational AI Disclaimer</h2>
            <div className="border border-amber-500/20 bg-amber-500/5 p-4 rounded-lg flex items-start gap-3 text-xs text-amber-300/90 leading-relaxed">
              <AlertTriangle className="size-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong>Simulation Notice:</strong> InterVibe is an educational interview practice tool. High diagnostic scores or passing simulated rounds do not guarantee actual employment, passing live employer loops, or receiving job offers. Heuristic scores represent probabilistic AI assessments.
              </div>
            </div>
          </section>
        </div>

        {/* Footer Link */}
        <div className="pt-8 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <Link href="/privacy" className="hover:text-white transition-colors">
            ← View Privacy Policy
          </Link>
          <span>© 2026 InterVibe. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
