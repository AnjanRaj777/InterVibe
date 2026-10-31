'use client';

import React from 'react';
import { Award, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';

export default function DiagnosticAnalysisIllustration() {
  return (
    <div className="w-full h-full relative rounded-xl border border-white/10 bg-[#0c100e]/80 p-3.5 flex flex-col justify-between overflow-hidden select-none font-sans text-xs shadow-inner">
      {/* Background ambient glow */}
      <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/90">
          <Award className="size-3.5 text-emerald-400" />
          <span>EXECUTIVE DIAGNOSTICS</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          META EVALUATOR
        </span>
      </div>

      {/* Main Score & Verdict Cockpit */}
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center size-12 rounded-full border-2 border-emerald-400/40 bg-emerald-950/40 shadow-lg shadow-emerald-500/10">
            <span className="text-base font-bold font-mono text-emerald-300">88%</span>
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin [animation-duration:8s]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white text-xs font-semibold">Overall Readiness</span>
            </div>
            <p className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle className="size-3" /> STRONG HIRE • L5 MET
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[9px] text-white/40 block">TARGET LEVEL</span>
          <span className="text-[11px] text-white font-semibold">Staff / Senior</span>
        </div>
      </div>

      {/* 3 Metric Progress Bars */}
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-white/70">Technical Depth &amp; Code Realism</span>
            <span className="text-emerald-300 font-bold">90%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full w-[90%]" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-white/70">System Architecture &amp; Scalability</span>
            <span className="text-emerald-300 font-bold">89%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full w-[89%]" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-white/70">Verbal Clarity &amp; STAR Structure</span>
            <span className="text-emerald-300 font-bold">86%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full w-[86%]" />
          </div>
        </div>
      </div>

      {/* Executive Feedback Snippet */}
      <div className="rounded-md border border-white/5 bg-black/40 px-2.5 py-1.5 text-[10px] text-white/60 font-mono truncate">
        <span className="text-emerald-400 font-bold">Evaluator: </span>
        &ldquo;Concrete Lua script atomicity &amp; backpressure rationale.&rdquo;
      </div>
    </div>
  );
}
