'use client';

import React from 'react';
import { TrendingUp, Award, CheckCircle, Clock } from 'lucide-react';

export default function ReadinessTelemetryIllustration() {
  return (
    <div className="w-full h-full relative rounded-xl border border-white/10 bg-[#0c100e]/80 p-3.5 flex flex-col justify-between overflow-hidden select-none font-sans text-xs shadow-inner">
      {/* Background ambient glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/90">
          <TrendingUp className="size-3.5 text-emerald-400" />
          <span>OFFER-READY VELOCITY</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          4 SESSIONS EVALUATED
        </span>
      </div>

      {/* Trajectory Velocity Chart */}
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-white/60">VERBAL READINESS TRAJECTORY</span>
          <span className="text-emerald-400 font-bold">+21 PTS OVERALL</span>
        </div>

        {/* Step bars representing progress from Session 1 to 4 */}
        <div className="grid grid-cols-4 gap-2 items-end h-16 pt-2 pb-1">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono text-white/40">71%</span>
            <div className="w-full bg-white/10 rounded-t h-7" />
            <span className="text-[8px] font-mono text-white/40">S1</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono text-white/50">78%</span>
            <div className="w-full bg-white/20 rounded-t h-9" />
            <span className="text-[8px] font-mono text-white/50">S2</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono text-emerald-400/80">85%</span>
            <div className="w-full bg-emerald-500/40 rounded-t h-12" />
            <span className="text-[8px] font-mono text-emerald-400/80">S3</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono text-emerald-300 font-bold">92%</span>
            <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t h-16 shadow-lg shadow-emerald-500/20" />
            <span className="text-[8px] font-mono text-emerald-300 font-bold">S4</span>
          </div>
        </div>
      </div>

      {/* Target Benchmarks & Status */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-emerald-500/20 bg-emerald-950/20 px-2 py-1.5 flex items-center gap-1.5">
          <CheckCircle className="size-3 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[8px] font-mono text-white/40 block">STRIPE L5 BAR</span>
            <span className="text-[10px] font-mono font-semibold text-emerald-300 truncate">EXCEEDED (+4%)</span>
          </div>
        </div>

        <div className="rounded-md border border-emerald-500/20 bg-emerald-950/20 px-2 py-1.5 flex items-center gap-1.5">
          <CheckCircle className="size-3 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[8px] font-mono text-white/40 block">META E5 BAR</span>
            <span className="text-[10px] font-mono font-semibold text-emerald-300 truncate">CONFIRMED MET</span>
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between text-[10px] font-mono text-white/50 px-1 border-t border-white/5 pt-1.5">
        <div className="flex items-center gap-1 text-white/70">
          <Clock className="size-3 text-emerald-400" />
          <span>3.8 hrs Verbal Practice</span>
        </div>
        <span className="text-emerald-400 font-bold">Offer Probability: 94%</span>
      </div>
    </div>
  );
}
