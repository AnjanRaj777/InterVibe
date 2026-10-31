'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb, ArrowRight, Compass } from 'lucide-react';

export default function ActionableGuidanceIllustration() {
  return (
    <div className="w-full h-full relative rounded-xl border border-white/10 bg-[#0c100e]/80 p-3.5 flex flex-col justify-between overflow-hidden select-none font-sans text-xs shadow-inner">
      {/* Background ambient glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/90">
          <Compass className="size-3.5 text-emerald-400" />
          <span>ACTIONABLE SUGGESTIONS</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
          3 VECTORS IDENTIFIED
        </span>
      </div>

      {/* 3 Structured Feedback Vectors */}
      <div className="space-y-2">
        {/* Vector 1: Observed Strength */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2 flex items-start gap-2">
          <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 block font-semibold">
              Observed Strength
            </span>
            <p className="text-white/80 text-[11px] leading-tight truncate">
              Clear atomic Lua execution &amp; 50k req/s metrics
            </p>
          </div>
        </div>

        {/* Vector 2: Area for Improvement */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-2 flex items-start gap-2">
          <AlertTriangle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 block font-semibold">
              Identified Blind Spot
            </span>
            <p className="text-white/80 text-[11px] leading-tight truncate">
              Omitted Redis cluster split-brain &amp; quorum failover
            </p>
          </div>
        </div>

        {/* Vector 3: Precision Coaching Instruction */}
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-2 flex items-start gap-2">
          <Lightbulb className="size-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-300 block font-semibold">
              Coaching Instruction
            </span>
            <p className="text-white/80 text-[11px] leading-tight truncate">
              Structure response with STAR: state RTO/RPO SLAs first
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Queue Banner into Drill Loop */}
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/60">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Blind spot queued for practice:</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold">
          <span>Drill Loop</span>
          <ArrowRight className="size-3" />
        </div>
      </div>
    </div>
  );
}
