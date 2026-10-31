'use client';

import React from 'react';
import { FileText, CheckCircle2, Sparkles, UserCheck, Cpu } from 'lucide-react';

export default function CalibrationIllustration() {
  return (
    <div className="w-full h-full relative rounded-xl border border-white/10 bg-[#0c100e]/80 p-3.5 flex flex-col justify-between overflow-hidden select-none font-sans text-xs shadow-inner">
      {/* Background ambient glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] text-white/90 font-medium tracking-wide">
            RESUME &amp; CONTEXT INGESTION
          </span>
        </div>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          PARSED 100%
        </span>
      </div>

      {/* Uploaded File Pill */}
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <FileText className="size-3.5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">alex_chen_senior_cv.pdf</p>
            <p className="text-[10px] text-white/50 font-mono">4.8 KB • 3,420 tokens extracted</p>
          </div>
        </div>
        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
      </div>

      {/* Extracted Role & Calibrated Tags */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
          <span>EXTRACTED SPECIALTIES</span>
          <span className="text-emerald-400">SENIORITY: STAFF / L5+</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/80 text-[10px] font-mono">
            Redis Lua Scripts
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/80 text-[10px] font-mono">
            Distributed Queues
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono">
            50k req/s Throughput
          </span>
        </div>
      </div>

      {/* Persona Calibrated Match */}
      <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="size-8 rounded-full overflow-hidden border border-emerald-500/40 bg-neutral-800">
              <img 
                src="/avatars/emma.webp" 
                alt="Emma Watson" 
                className="size-full object-cover" 
              />
            </div>
            <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-400 border border-[#0c100e]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white text-xs font-semibold">Emma Watson</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-emerald-300">
                AI LEAD
              </span>
            </div>
            <p className="text-[10px] text-white/50 font-mono">DeepMind • Strict Architecture Bar</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
          <Sparkles className="size-3" /> Ready
        </span>
      </div>
    </div>
  );
}
