'use client';

import React from 'react';
import { Repeat, Timer, CheckCircle, Zap, ShieldCheck } from 'lucide-react';

export default function DrillLoopIllustration() {
  return (
    <div className="w-full h-full relative rounded-xl border border-white/10 bg-[#0c100e]/80 p-3.5 flex flex-col justify-between overflow-hidden select-none font-sans text-xs shadow-inner">
      {/* Background ambient glow */}
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/90">
          <Repeat className="size-3.5 text-purple-400 animate-[spin_6s_linear_infinite]" />
          <span>TARGETED DRILL LOOP</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
          SPRINT 2 OF 3
        </span>
      </div>

      {/* Drill Scenario Prompt Card */}
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-purple-300 font-semibold flex items-center gap-1">
            <Zap className="size-3" /> FOCUSED WEAKNESS DRILL
          </span>
          <span className="text-white/40 flex items-center gap-1">
            <Timer className="size-3 text-amber-400" /> 01:14 REMAINING
          </span>
        </div>

        <p className="text-white/90 text-[11px] leading-relaxed italic bg-black/40 rounded p-2 border border-white/5">
          &ldquo;Redis nodes 1 &amp; 2 partition during peak traffic. Walk me through your quorum lease protocol.&rdquo;
        </p>
      </div>

      {/* Drill Feedback & Delta Gain */}
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white text-xs font-semibold">Drill Passed</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-bold">
                92% SCORE
              </span>
            </div>
            <p className="text-[10px] text-white/50 font-mono">Quorum consensus explained with zero hesitation</p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-emerald-400 font-bold text-xs">+14 pts</span>
          <span className="text-[9px] text-white/40 block">DELTA</span>
        </div>
      </div>

      {/* Looping Rule */}
      <div className="flex items-center justify-between text-[10px] font-mono text-white/40 px-1">
        <span>RULE: Repeat until 85%+ score is reflexive</span>
        <span className="text-purple-300 font-semibold flex items-center gap-1">
          <Repeat className="size-3" /> LOOP COMPLETE
        </span>
      </div>
    </div>
  );
}
