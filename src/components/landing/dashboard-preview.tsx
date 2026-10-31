'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  SlidersHorizontal, 
  Share2, 
  RotateCcw, 
  Volume2, 
  Send 
} from 'lucide-react';

// Dynamic import with ssr: false for Three.js WebGL 3D Avatar
const InteractiveAvatar = dynamic(
  () => import('@/components/avatar/interactive-avatar').then((mod) => mod.InteractiveAvatar),
  {
    ssr: false,
    loading: () => (
      <div className="w-[340px] h-[370px] md:w-[440px] md:h-[430px] flex flex-col items-center justify-center gap-3">
        <div className="size-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-neutral-400">Loading 3D Human Avatar...</span>
      </div>
    ),
  }
);

export function DashboardPreview() {
  const [activeState, setActiveState] = useState<'speaking' | 'thinking' | 'listening'>('listening');
  const [avatarMode, setAvatarMode] = useState<'3d' | '2d'>('3d');
  const [isRecording, setIsRecording] = useState(false);

  const sarahPersona = {
    name: 'Sarah Chen',
    title: 'Sarah — Friendly HR • 3 yrs at Linear',
    latency: '320ms',
    voice: 'Muse',
    avatar: '/avatars/sarah.webp',
    auraVoice: 'aura-asteria-en',
    model: '/avatars/sarah.glb'
  };

  return (
    <div className="w-[calc(100vw-32px)] md:w-[1160px] mx-auto">
      {/* Outer Glow & Elevated Frame from pointer-ai */}
      <div className="bg-[#78fcd6]/30 dark:bg-[#78fcd6]/20 rounded-2xl p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        
        {/* Main Mock Interview Room Canvas */}
        <div className="rounded-xl bg-[#090c0a] border border-white/15 overflow-hidden text-left relative shadow-2xl flex flex-col justify-between select-none">
          
          {/* Subtle Grid Pattern inside the room */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#34d399_1px,transparent_1px),linear-gradient(to_bottom,#34d399_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* TOP SESSION HEADER BAR */}
          <div className="relative z-10 px-4 md:px-6 py-3 bg-[#0d120f]/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
            
            {/* Left: Role & Recruiter Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-full overflow-hidden border border-white/20 bg-neutral-800">
                  <img 
                    src="/avatars/sarah.webp" 
                    alt="Sarah Chen" 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-[#0d120f]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs sm:text-sm font-semibold tracking-tight">
                    Senior Full Stack Developer
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400">
                    MOCK • 00:39
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-mono">
                  Sarah — Friendly HR • 3 yrs at Linear
                </p>
              </div>
            </div>

            {/* Right: Controls & End Interview */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
              <button 
                type="button"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/10 bg-white/5 text-neutral-300 hover:text-white transition-colors"
              >
                <SlidersHorizontal className="size-3 text-neutral-400" />
                <span>Config</span>
              </button>

              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-neutral-300 text-[11px]">
                <span className="hidden sm:inline">Voice Mode</span>
                <span className="h-4 w-7 rounded-full bg-emerald-500 flex items-center justify-end px-0.5">
                  <span className="h-3 w-3 rounded-full bg-white shadow-xs" />
                </span>
              </div>

              <button 
                type="button"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md border border-white/10 bg-white/5 text-neutral-300 hover:text-white transition-colors"
              >
                <Share2 className="size-3 text-neutral-400" />
                <span>Share</span>
              </button>

              <button 
                type="button"
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-xs transition-colors"
              >
                <span className="size-2 rounded-full bg-white animate-pulse" />
                <span>End Interview</span>
              </button>
            </div>
          </div>

          {/* TOP CENTER STATUS PILLS */}
          <div className="relative z-10 pt-4 flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setActiveState('speaking')}
                className={`px-3 py-0.5 rounded-full transition-colors cursor-pointer ${
                  activeState === 'speaking' ? 'bg-white/15 text-white font-bold border border-white/20' : 'text-neutral-500 hover:text-white'
                }`}
              >
                SPEAKING
              </button>
              <button
                type="button"
                onClick={() => setActiveState('thinking')}
                className={`px-3 py-0.5 rounded-full transition-colors cursor-pointer ${
                  activeState === 'thinking' ? 'bg-white/15 text-white font-bold border border-white/20' : 'text-neutral-500 hover:text-white'
                }`}
              >
                THINKING
              </button>
              <button
                type="button"
                onClick={() => setActiveState('listening')}
                className={`px-3 py-0.5 rounded-full transition-colors cursor-pointer ${
                  activeState === 'listening' ? 'bg-white/15 text-white font-bold border border-white/20' : 'text-neutral-500 hover:text-white'
                }`}
              >
                LISTENING
              </button>
              <button 
                type="button" 
                onClick={() => setActiveState('listening')}
                className="px-1.5 text-neutral-400 hover:text-white cursor-pointer" 
                title="Reset State"
              >
                <RotateCcw className="size-3" />
              </button>
            </div>
          </div>

          {/* CENTER 3D AVATAR & TELEMETRY STAGE */}
          <div className="relative z-10 py-2 sm:py-4 px-6 flex flex-col items-center justify-center text-center">
            
            {/* Floating Right Telemetry Widgets (Desktop) */}
            <div className="hidden lg:flex flex-col gap-3 absolute right-8 top-12 text-left font-mono">
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md space-y-1 w-44">
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">AUDIO</span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300">Input</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                    16kHz
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md space-y-1 w-44">
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">CONTEXT</span>
                <p className="text-[10px] text-neutral-300 leading-tight">
                  React, Node, System Design — tailored prompts active
                </p>
              </div>
            </div>

            {/* REAL 3D HUMAN AVATAR ENGINE (Three.js + GLTFLoader with Sarah.glb) */}
            <div className="relative my-1 w-full max-w-xl mx-auto flex flex-col items-center justify-center">
              <InteractiveAvatar
                persona={sarahPersona}
                activeState={activeState}
                isRecording={isRecording}
                audioPlaying={activeState === 'speaking'}
                avatarMode={avatarMode}
                onToggleMode={setAvatarMode}
              />
            </div>

            {/* Subtitles & Recruiter Name */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-400 tracking-wider font-semibold">
                <span className={`size-1.5 rounded-full ${
                  activeState === 'speaking' ? 'bg-cyan-400 animate-pulse' :
                  activeState === 'thinking' ? 'bg-yellow-400 animate-pulse' :
                  'bg-emerald-400 animate-pulse'
                }`} />
                <span>
                  {activeState === 'speaking' ? 'INTERVIEWER IS SPEAKING...' :
                   activeState === 'thinking' ? 'INTERVIEWER IS THINKING (META MUSE SPARK)...' :
                   'LISTENING...'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">Sarah Chen</h3>
              <p className="text-xs font-mono text-neutral-400">
                Sarah — Friendly HR • 3 yrs at Linear • Latency 320ms • Voice: Muse
              </p>
            </div>
          </div>

          {/* BOTTOM TRANSCRIPT & SUBTITLES */}
          <div className="relative z-10 border-t border-white/10 bg-[#0c100e]/95 backdrop-blur-md p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
              <span className="tracking-widest uppercase">
                TRANSCRIPT • SUBTITLES • AUTO-SCROLL
              </span>
              <div className="flex items-center gap-3">
                <button type="button" className="hover:text-white transition-colors">Clear</button>
                <button type="button" className="hover:text-white transition-colors">Copy</button>
              </div>
            </div>

            {/* AI Prompt Dialogue */}
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed font-sans">
              <span className="font-mono text-neutral-500 text-[11px] shrink-0 mt-0.5">00:02</span>
              <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-[10px] font-mono text-neutral-300 font-bold shrink-0 mt-0.5">
                AI
              </span>
              <p>
                <strong className="text-white">Sarah:</strong> Hello! Welcome to your interview today. I have reviewed your resume for the Senior Full Stack Developer position. Let&apos;s get started. To kick things off, could you briefly introduce yourself and highlight a recent challenging technical project you led?
              </p>
            </div>

            {/* BOTTOM INPUT & VOICE TRIGGER BAR */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono">
              
              {/* Push-to-Talk Button */}
              <button 
                type="button"
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => setIsRecording(false)}
                onTouchStart={() => setIsRecording(true)}
                onTouchEnd={() => setIsRecording(false)}
                className={`font-semibold text-xs px-4 py-2 rounded-full flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer transition-colors ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-white hover:bg-neutral-200 text-black'
                }`}
              >
                <span className={`size-2 rounded-full ${isRecording ? 'bg-white' : 'bg-emerald-500 animate-pulse'}`} />
                <span className="font-bold">{isRecording ? 'Recording (Release to Send)' : 'Tap to Speak'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  isRecording ? 'bg-red-700 text-white' : 'bg-neutral-200 text-black'
                }`}>
                  SPACE
                </span>
              </button>

              {/* Text fallback input */}
              <div className="flex-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-400 flex items-center">
                <span>Voice mode active (or type response here)...</span>
              </div>

              {/* Right indicators */}
              <div className="flex items-center justify-end gap-3 text-xs text-neutral-400 shrink-0">
                <Volume2 className="size-3.5 text-neutral-400" />
                <button type="button" className="px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1 transition-colors cursor-pointer">
                  <span>Send</span>
                  <Send className="size-2.5" />
                </button>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  128kbps
                </span>
                <span className="text-[10px] text-neutral-500">EN</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
