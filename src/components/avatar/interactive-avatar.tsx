'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Radio, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface InteractiveAvatarProps {
  persona: {
    name: string;
    title: string;
    avatar: string;
    voice: string;
    auraVoice?: string;
  };
  activeState: 'speaking' | 'thinking' | 'listening' | 'idle';
  isRecording: boolean;
  audioPlaying: boolean;
  avatarMode: '3d' | '2d';
  onToggleMode: (mode: '3d' | '2d') => void;
}

export const InteractiveAvatar: React.FC<InteractiveAvatarProps> = ({
  persona,
  activeState,
  isRecording,
  audioPlaying,
  avatarMode,
  onToggleMode,
}) => {
  const [perxonaConfig, setPerxonaConfig] = useState<{
    enabled: boolean;
    publishableKey?: string;
    baseUrl?: string;
  } | null>(null);

  const [perxonaLoaded, setPerxonaLoaded] = useState(false);
  const presenterRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Check Perxona Connect configuration on mount
  useEffect(() => {
    let isMounted = true;
    async function checkPerxona() {
      try {
        const res = await fetch('/api/perxona/session');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPerxonaConfig(data);
          }
        }
      } catch (err) {
        console.warn('[Avatar] Perxona session check skipped:', err);
      }
    }
    checkPerxona();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Perxona Connect script if publishable key is present
  useEffect(() => {
    if (avatarMode !== '3d' || !perxonaConfig?.enabled || !perxonaConfig.publishableKey) {
      return;
    }

    if (document.getElementById('perxona-connect-script')) {
      setPerxonaLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'perxona-connect-script';
    script.type = 'module';
    script.src = `${perxonaConfig.baseUrl || 'https://console.perxona.ai/asia'}/sdk/connect/sv-presenter.js`;
    script.onload = () => {
      setPerxonaLoaded(true);
    };
    script.onerror = () => {
      console.warn('[Avatar] Failed to load remote Perxona SDK script. Falling back to internal 3D stage.');
    };
    document.body.appendChild(script);
  }, [avatarMode, perxonaConfig]);

  // 3. Sync avatar gestures with Deepgram Aura speech & candidate listening
  useEffect(() => {
    if (!presenterRef.current || !perxonaLoaded) return;

    try {
      if (activeState === 'speaking' || audioPlaying) {
        if (typeof presenterRef.current.playMotion === 'function') {
          presenterRef.current.playMotion('speak');
        }
      } else if (activeState === 'listening' || isRecording) {
        if (typeof presenterRef.current.playMotion === 'function') {
          presenterRef.current.playMotion('nod');
        }
      }
    } catch (e) {
      // Graceful ignore if motion is not found
    }
  }, [activeState, audioPlaying, isRecording, perxonaLoaded]);

  // 4. Fallback 3D Canvas rendering for smooth interactive visual effects
  useEffect(() => {
    if (avatarMode !== '3d' || (perxonaLoaded && perxonaConfig?.enabled)) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      angle += 0.02;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 100 + (activeState === 'speaking' ? Math.sin(angle * 4) * 8 : Math.sin(angle) * 3);

      // Draw futuristic orbital holographic rings
      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer Ring
      ctx.beginPath();
      ctx.ellipse(0, 0, radius + 30, (radius + 30) * 0.45, angle * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = activeState === 'speaking' 
        ? 'rgba(56, 189, 248, 0.4)' 
        : activeState === 'listening' 
        ? 'rgba(239, 68, 68, 0.4)' 
        : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner Counter Ring
      ctx.beginPath();
      ctx.ellipse(0, 0, radius + 15, (radius + 15) * 0.4, -angle * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = activeState === 'speaking' 
        ? 'rgba(99, 102, 241, 0.5)' 
        : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [avatarMode, activeState, perxonaLoaded, perxonaConfig]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-xl mx-auto">
      {/* Top Floating Controls: 3D vs 2D Mode Switch */}
      <div className="mb-4 flex items-center gap-2 p-1 rounded-full bg-[#141414] border border-[#262626] shadow-md z-20">
        <button
          type="button"
          onClick={() => onToggleMode('3d')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            avatarMode === '3d'
              ? 'bg-white text-black font-semibold shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>3D Avatar</span>
          {perxonaConfig?.enabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onToggleMode('2d')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            avatarMode === '2d'
              ? 'bg-white text-black font-semibold shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Radio className="w-3 h-3 text-zinc-400" />
          <span>2D Minimal</span>
        </button>
      </div>

      {/* 3D AVATAR VIEWPORT */}
      {avatarMode === '3d' ? (
        <div className="relative w-[320px] h-[340px] md:w-[380px] md:h-[400px] flex items-center justify-center">
          {perxonaLoaded && perxonaConfig?.enabled ? (
            /* Live XRSPACE Perxona <sv-presenter> Web Component */
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#181818]/60 to-[#0e0e0e]/80 border border-[#2b2b2b] shadow-2xl flex items-center justify-center">
              {/* @ts-ignore - custom web component from Perxona SDK */}
              <sv-presenter
                ref={presenterRef}
                class="w-full h-full"
                publishable-key={perxonaConfig.publishableKey}
                base-url={perxonaConfig.baseUrl}
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>XRSPACE Behavior AI™ • 60 FPS</span>
              </div>
            </div>
          ) : (
            /* Interactive 3D Holographic Stage with Deepgram Aura Voice Sync */
            <div className="relative flex flex-col items-center justify-center">
              <canvas
                ref={canvasRef}
                width={380}
                height={380}
                className="absolute inset-0 pointer-events-none z-10"
              />

              {/* 3D Depth Framed Avatar */}
              <div
                className="relative rounded-full p-[4px] bg-gradient-to-b from-cyan-500/30 via-zinc-800 to-black shadow-[0_0_50px_rgba(6,182,212,0.15)] transition-transform duration-500"
                style={{
                  transform:
                    activeState === 'speaking'
                      ? 'perspective(600px) rotateX(4deg) scale(1.03)'
                      : activeState === 'listening'
                      ? 'perspective(600px) rotateY(-6deg) scale(0.99)'
                      : 'perspective(600px) rotateX(0deg) scale(1)',
                }}
              >
                <div className="relative rounded-full p-[4px] bg-[#0d0d0d]">
                  <div className="h-[210px] w-[210px] md:h-[260px] md:w-[260px] rounded-full overflow-hidden bg-[#161616] relative">
                    <img
                      src={persona.avatar}
                      alt={persona.name}
                      className="h-full w-full object-cover scale-[1.03]"
                    />
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_50px_rgba(0,0,0,0.6)]" />
                    {activeState === 'speaking' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent" />
                    )}
                  </div>

                  {/* High-Tech Status Orb */}
                  <div
                    className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-[3px] border-[#121212] grid place-items-center transition-all duration-300 ${
                      activeState === 'speaking'
                        ? 'bg-[#06b6d4] scale-100 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                        : activeState === 'thinking'
                        ? 'bg-[#facc15] scale-100'
                        : isRecording
                        ? 'bg-[#ff4a3d] scale-100 animate-pulse'
                        : 'bg-[#22c55e] scale-90'
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full bg-white ${
                        activeState === 'speaking' || isRecording ? 'animate-pulse' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Holographic Badge */}
              <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-[#181818]/90 border border-[#2b2b2b] text-[11px] font-mono text-zinc-300 shadow">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>3D Aura Synthesizer • {persona.name}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2D MINIMAL RADAR AVATAR */
        <div className="relative flex flex-col items-center">
          {/* Animated Radar Pulse Rings */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {activeState === 'speaking' && (
              <>
                <div
                  className="absolute -inset-[30px] rounded-full border border-white/10"
                  style={{ animation: 'pulseRing 2.2s ease-out infinite' }}
                />
                <div
                  className="absolute -inset-[60px] rounded-full border border-white/[0.06]"
                  style={{ animation: 'pulseRing 2.2s 0.4s ease-out infinite' }}
                />
                <div
                  className="absolute -inset-[90px] rounded-full border border-white/[0.03]"
                  style={{ animation: 'pulseRing 2.2s 0.8s ease-out infinite' }}
                />
              </>
            )}
            {activeState === 'thinking' && (
              <div className="absolute -inset-[24px] rounded-full bg-white/[0.04] blur-[20px]" />
            )}
            {activeState === 'listening' && isRecording && (
              <div
                className="absolute -inset-[30px] rounded-full border border-red-500/20"
                style={{ animation: 'pulseRing 1.8s ease-out infinite' }}
              />
            )}
          </div>

          {/* Avatar Frame with Breathing Animation */}
          <div
            className="relative rounded-full p-[3px] bg-gradient-to-b from-[#2a2a2a] to-[#151515] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_20px_40px_-12px_rgba(0,0,0,0.9)]"
            style={{
              animation: activeState === 'speaking' ? 'avatarBreathe 1.6s ease-in-out infinite' : 'none',
            }}
          >
            <div className="relative rounded-full p-[4px] bg-[#0e0e0e]">
              <div className="h-[220px] w-[220px] md:h-[280px] md:w-[280px] rounded-full overflow-hidden bg-[#181818] relative">
                <img
                  src={persona.avatar}
                  alt={persona.name}
                  className="h-full w-full object-cover scale-[1.02]"
                />
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]" />
                {activeState === 'speaking' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                )}
              </div>

              {/* Corner Status Dot */}
              <div
                className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-[3px] border-[#121212] grid place-items-center transition-all duration-300 ${
                  activeState === 'speaking'
                    ? 'bg-[#ff4a3d] scale-100'
                    : activeState === 'thinking'
                    ? 'bg-[#facc15] scale-100'
                    : isRecording
                    ? 'bg-[#ff4a3d] scale-100'
                    : 'bg-[#22c55e] scale-90'
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full bg-white ${
                    activeState === 'speaking' || isRecording ? 'animate-pulse' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Equalizer Soundwave Bars (12 bars) */}
      <div className="mt-6 flex items-end gap-[4px] h-[32px]">
        {[...Array(12)].map((_, c) => {
          const isSpeaking = activeState === 'speaking' || audioPlaying;
          const isThinking = activeState === 'thinking';
          const isMicRecording = isRecording;
          const m = [0, 0.1, 0.2, 0.15, 0.05, 0.25, 0.12, 0.18, 0.08, 0.22, 0.11, 0.19];
          const speakHeights = [10, 18, 26, 14, 22, 30, 16, 24, 12, 20, 28, 14];

          let barHeight = '4px';
          let animStyle: React.CSSProperties = {};

          if (isSpeaking) {
            barHeight = `${speakHeights[c % speakHeights.length]}px`;
            animStyle = {
              animation: `waveDance 0.8s ease-in-out infinite alternate`,
              animationDelay: `${m[c % m.length]}s`,
            };
          } else if (isThinking) {
            barHeight = '8px';
            animStyle = {
              animation: `waveDance 1.6s ease-in-out infinite alternate`,
              animationDelay: `${c * 0.1}s`,
            };
          } else if (isMicRecording) {
            barHeight = `${12 + (c % 4) * 4}px`;
            animStyle = {
              animation: `waveDance 0.6s ease-in-out infinite alternate`,
              animationDelay: `${(11 - c) * 0.08}s`,
            };
          }

          return (
            <span
              key={c}
              className={`w-[3px] rounded-full transition-all duration-200 ${
                isSpeaking
                  ? avatarMode === '3d'
                    ? 'bg-gradient-to-t from-cyan-500 to-sky-200 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : 'bg-white'
                  : isThinking
                  ? 'bg-amber-400'
                  : isMicRecording
                  ? 'bg-red-500'
                  : 'bg-[#2a2a2a]'
              }`}
              style={{
                height: barHeight,
                ...animStyle,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
