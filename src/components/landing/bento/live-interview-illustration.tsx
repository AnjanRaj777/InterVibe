'use client';

import React from 'react';
import { Mic, Radio, Volume2 } from 'lucide-react';

export default function LiveInterviewIllustration() {
  return (
    <div className="w-full h-full relative rounded-xl border border-white/10 bg-[#0c100e]/80 p-3.5 flex flex-col justify-between overflow-hidden select-none font-sans text-xs shadow-inner">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -left-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Session Status Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[10px]">
            <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE REC • 04:18
          </span>
          <span className="text-[10px] font-mono text-white/40">16kHz PCM Direct</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
          <Radio className="size-3 animate-pulse" />
          <span>Meta Muse Spark 1.3</span>
        </div>
      </div>

      {/* Recruiter Persona & Question Bubble */}
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="size-7 rounded-full overflow-hidden border border-white/20 bg-neutral-800">
                <img 
                  src="/avatars/sarah.webp" 
                  alt="Sarah Chen" 
                  className="size-full object-cover" 
                />
              </div>
              <span className="absolute bottom-0 right-0 size-1.5 rounded-full bg-emerald-400" />
            </div>
            <div>
              <span className="text-white text-xs font-medium">Sarah Chen</span>
              <span className="text-[10px] text-white/40 font-mono ml-1.5">• Linear Recruiter</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-white/40">
            <Volume2 className="size-3 text-emerald-400" />
            <span>Aura Asteria</span>
          </div>
        </div>

        <p className="text-white/80 text-[11px] leading-relaxed italic bg-black/30 rounded-md p-2 border border-white/5">
          &ldquo;How did you handle backpressure and guarantee idempotency when retrying failed jobs in your queue?&rdquo;
        </p>
      </div>

      {/* Candidate Push-to-Talk Status & Audio Waveform */}
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-md bg-emerald-400 text-black flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
            <Mic className="size-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-mono text-[9px] font-bold tracking-wider">
                SPACEBAR HELD
              </span>
              <span className="text-white text-[10px] font-medium">Speaking...</span>
            </div>
            <p className="text-[10px] text-white/50 font-mono">Zero-delay push-to-talk stream</p>
          </div>
        </div>

        {/* Dynamic Equalizer Waveform Bars */}
        <div className="flex items-end gap-1 h-6 px-1">
          <span className="w-1 bg-emerald-400 rounded-full animate-[wave_1.1s_ease-in-out_infinite]" style={{ height: '60%' }} />
          <span className="w-1 bg-emerald-300 rounded-full animate-[wave2_0.9s_ease-in-out_infinite]" style={{ height: '90%' }} />
          <span className="w-1 bg-emerald-400 rounded-full animate-[wave_1.4s_ease-in-out_infinite]" style={{ height: '40%' }} />
          <span className="w-1 bg-emerald-300 rounded-full animate-[wave2_1.2s_ease-in-out_infinite]" style={{ height: '80%' }} />
          <span className="w-1 bg-emerald-400 rounded-full animate-[wave_0.8s_ease-in-out_infinite]" style={{ height: '50%' }} />
        </div>
      </div>
    </div>
  );
}
