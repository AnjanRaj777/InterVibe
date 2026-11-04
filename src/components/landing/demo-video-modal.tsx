'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tv,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DemoVideoModalProps {
  className?: string;
  /**
   * URL or path to video (supports YouTube links like https://youtu.be/RlSbHkXWL0c or direct mp4/webm).
   */
  videoSrc?: string;
  posterSrc?: string;
}

/**
 * Parses a YouTube URL or video ID into an optimized privacy-friendly embed URL.
 */
function getYouTubeEmbedUrl(urlOrId?: string): string | null {
  if (!urlOrId) return null;

  // youtu.be/<id>
  const shortMatch = urlOrId.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) {
    return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  }

  // youtube.com/watch?v=<id> or /embed/<id>
  const longMatch =
    urlOrId.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
    urlOrId.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (longMatch) {
    return `https://www.youtube-nocookie.com/embed/${longMatch[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  }

  // Raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return `https://www.youtube-nocookie.com/embed/${urlOrId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  }

  return null;
}

export function DemoVideoButton({
  className,
  videoSrc = 'https://youtu.be/RlSbHkXWL0c',
  posterSrc,
}: DemoVideoModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Origin coordinates of the trigger button on screen
  const [origin, setOrigin] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({ x: 0, y: 0, width: 180, height: 44 });

  // YouTube embed detection
  const ytEmbedUrl = useMemo(() => getYouTubeEmbedUrl(videoSrc), [videoSrc]);
  const isYouTube = Boolean(ytEmbedUrl);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Simulation mode toggle if someone wants to peek at the interactive simulation
  const [forceSimulatedMode, setForceSimulatedMode] = useState(false);

  // Player state (for direct video or simulation)
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalDuration = 30; // 30s demo duration
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);

  // Set mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Capture button coordinates with precision
  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      });
    }
    setIframeLoaded(false);
    setIsPlaying(true);
    setIsOpen(true);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Lock body scroll & listen to Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (
        !isYouTube &&
        e.code === 'Space' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose, isYouTube]);

  // Simulated video playback timer when in simulation view
  useEffect(() => {
    if (!isOpen || !isPlaying || (videoSrc && !forceSimulatedMode)) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= totalDuration) {
          return 0; // Loop
        }
        return Math.min(totalDuration, prev + 0.1 * playbackSpeed);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, playbackSpeed, videoSrc, forceSimulatedMode]);

  // Sync native HTML5 video element if non-YouTube direct file is provided
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video || isYouTube || forceSimulatedMode) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, isYouTube, forceSimulatedMode]);

  useEffect(() => {
    const video = videoElementRef.current;
    if (!video || isYouTube || forceSimulatedMode) return;
    video.muted = isMuted;
  }, [isMuted, isYouTube, forceSimulatedMode]);

  useEffect(() => {
    const video = videoElementRef.current;
    if (!video || isYouTube || forceSimulatedMode) return;
    video.playbackRate = playbackSpeed;
  }, [playbackSpeed, isYouTube, forceSimulatedMode]);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercentage = (currentTime / totalDuration) * 100;

  // Viewport calculation for transform origin offset
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  const targetModalWidth = Math.min(windowWidth * 0.94, 1060);
  const targetModalHeight = Math.min(windowHeight * 0.88, 640);

  // Percentage transform origin directly on the button location relative to the centered modal
  const modalLeft = (windowWidth - targetModalWidth) / 2;
  const modalTop = (windowHeight - targetModalHeight) / 2;
  const originXPct = Math.max(10, Math.min(90, ((origin.x - modalLeft) / targetModalWidth) * 100));
  const originYPct = Math.max(10, Math.min(90, ((origin.y - modalTop) / targetModalHeight) * 100));

  // Natural start scale matching button width to modal width
  const startScale = Math.max(0.12, Math.min(0.24, origin.width / targetModalWidth));

  // Fluid Apple-tier easing curve for buttery smooth acceleration and landing
  const fluidEase = [0.16, 1, 0.3, 1] as const;

  // Active scenario segment for the interactive simulated demo
  const getDemoScenario = (time: number) => {
    if (time < 10) {
      return {
        stage: '01 • Voice Setup & Persona Match',
        speaker: 'Sarah (Staff ML Lead)',
        avatar: '/avatars/sarah.webp',
        question:
          '"Welcome to InterVibe! Let\'s start with your background. How did you architect the ultra-low latency audio pipeline in your previous project?"',
        metricTitle: 'Voice Latency',
        metricValue: '280ms (Real-time)',
        metricColor: 'text-emerald-400',
        badge: 'FAANG Interviewer Persona',
      };
    } else if (time < 20) {
      return {
        stage: '02 • Technical Deep-Dive & Follow-up',
        speaker: 'Sarah (Staff ML Lead)',
        avatar: '/avatars/sarah.webp',
        question:
          '"Interesting trade-off. How did you prevent backpressure when candidate responses hit peak audio bandwidth under network jitter?"',
        metricTitle: 'Muse Audio Clarity',
        metricValue: '96% (Optimal Pacing)',
        metricColor: 'text-cyan-400',
        badge: 'Dynamic Adaptive Questioning',
      };
    } else {
      return {
        stage: '03 • Instant Muse Feedback & Telemetry',
        speaker: 'Muse AI Evaluation Engine',
        avatar: '/avatars/sarah.webp',
        question:
          '"Strong technical depth. Strengths: Distributed buffering & zero-copy STT. Next drill: Elaborate on token economics in multi-agent routing."',
        metricTitle: 'Overall Readiness',
        metricValue: '93 / 100 (Offer Caliber)',
        metricColor: 'text-emerald-300',
        badge: 'Offer Prediction Score',
      };
    }
  };

  const currentScenario = getDemoScenario(currentTime);

  return (
    <>
      {/* TRIGGER BUTTON (Enhanced with fluid hover/tap physics) */}
      <motion.div
        whileHover={{ scale: 1.025, y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
        className="inline-block"
      >
        <Button
          ref={buttonRef}
          onClick={handleOpen}
          variant="outline"
          className={`relative group border-white/20 bg-white/5 hover:bg-white/10 text-foreground px-6 sm:px-7 py-3 rounded-full font-medium text-sm sm:text-base shadow-lg backdrop-blur-sm cursor-pointer transition-all duration-300 hover:border-emerald-300/40 hover:shadow-[0_0_24px_rgba(120,252,214,0.35)] flex items-center gap-2.5 overflow-hidden ${className || ''}`}
        >
          <span className="relative flex items-center justify-center size-6 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 group-hover:bg-emerald-400 group-hover:text-black transition-all duration-300 shadow-[0_0_12px_rgba(120,252,214,0.3)]">
            <Play className="size-3 fill-current ml-0.5" />
          </span>
          <span className="tracking-tight">Watch Demo</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
            30s
          </span>
        </Button>
      </motion.div>

      {/* EXPANDING VIDEO MODAL PORTAL */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-8"
                role="dialog"
                aria-modal="true"
                aria-label="InterVibe Demo Video"
              >
                {/* BACKDROP WITH SILKY SMOOTH BLUR & DIMMING */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.42, ease: fluidEase }}
                  className="fixed inset-0 bg-black/85 backdrop-blur-xl"
                  onClick={handleClose}
                />

                {/* 4 RADIAL EXPANSION ARROWS / BEAMS (Depicted in the user sketch) */}
                <motion.div
                  initial={{ opacity: 0.9, scale: 0.2 }}
                  animate={{ opacity: 0, scale: 1.25 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.52, ease: fluidEase }}
                  style={{ transformOrigin: `${originXPct}% ${originYPct}%` }}
                  className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line
                      x1={`${originXPct}`}
                      y1={`${originYPct}`}
                      x2="0"
                      y2="0"
                      stroke="rgba(120,252,214,0.5)"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />
                    <line
                      x1={`${originXPct}`}
                      y1={`${originYPct}`}
                      x2="100"
                      y2="0"
                      stroke="rgba(120,252,214,0.5)"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />
                    <line
                      x1={`${originXPct}`}
                      y1={`${originYPct}`}
                      x2="0"
                      y2="100"
                      stroke="rgba(120,252,214,0.5)"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />
                    <line
                      x1={`${originXPct}`}
                      y1={`${originYPct}`}
                      x2="100"
                      y2="100"
                      stroke="rgba(120,252,214,0.5)"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />
                  </svg>
                </motion.div>

                {/* EXPANDING CONTAINER: Flowers outward from the button's exact coordinates to center */}
                <motion.div
                  ref={playerContainerRef}
                  style={{
                    transformOrigin: `${originXPct}% ${originYPct}%`,
                    maxHeight: '92vh',
                  }}
                  initial={{
                    scale: startScale,
                    opacity: 0.7,
                    borderRadius: 9999,
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    borderRadius: 24,
                  }}
                  exit={{
                    scale: startScale,
                    opacity: 0,
                    borderRadius: 9999,
                  }}
                  transition={{
                    duration: 0.52,
                    ease: fluidEase,
                  }}
                  className="relative z-10 w-full max-w-5xl bg-[#0c0f0e] border border-emerald-400/30 rounded-2xl sm:rounded-3xl shadow-[0_0_90px_rgba(120,252,214,0.24),0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col will-change-transform"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* INNER CONTENT WRAPPER: Fades in smoothly to eliminate any squished subpixel jitter during initial expansion */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      delay: 0.1,
                      duration: 0.35,
                      ease: 'easeOut',
                    }}
                    className="flex flex-col w-full h-full"
                  >
                    {/* TOP HEADER / CONTROLS BAR */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="size-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <Sparkles className="size-3.5 text-emerald-400" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tracking-tight text-white">
                              InterVibe Demo Walkthrough
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Official Video
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground hidden md:inline-block">
                            See ultra-low latency voice AI, adaptive follow-ups, and instant Muse scoring
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <kbd className="hidden md:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 rounded">
                          ESC
                        </kbd>
                        <button
                          onClick={handleClose}
                          className="size-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/10 hover:border-emerald-400/40 cursor-pointer"
                          title="Close demo"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* VIDEO / SIMULATION VIEWPORT (16:9 ratio responsive) */}
                    <div className="relative w-full aspect-video bg-[#080a09] flex items-center justify-center overflow-hidden group">
                      {isYouTube && !forceSimulatedMode && ytEmbedUrl ? (
                        /* YOUTUBE EMBED PLAYER WITH SMOOTH FADE-IN */
                        <div className="relative w-full h-full bg-black">
                          {/* Smooth skeleton / poster loader while iframe initializes */}
                          <div
                            className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#090d0b] to-[#040605] transition-opacity duration-500 pointer-events-none ${
                              iframeLoaded ? 'opacity-0' : 'opacity-100'
                            }`}
                          >
                            <div className="size-12 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin mb-3" />
                            <span className="text-xs font-mono text-zinc-400">Loading Demo Video...</span>
                          </div>

                          <iframe
                            src={ytEmbedUrl}
                            title="InterVibe AI Mock Interview Demo Video"
                            className={`w-full h-full border-0 transition-opacity duration-300 ${
                              iframeLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            onLoad={() => setIframeLoaded(true)}
                          />
                        </div>
                      ) : videoSrc && !forceSimulatedMode ? (
                        /* DIRECT HTML5 VIDEO PLAYER (When an MP4/WebM file is provided) */
                        <video
                          ref={videoElementRef}
                          src={videoSrc}
                          poster={posterSrc || '/images/dashboard-preview.png'}
                          className="w-full h-full object-cover"
                          playsInline
                          onTimeUpdate={() => {
                            if (videoElementRef.current) {
                              setCurrentTime(videoElementRef.current.currentTime);
                            }
                          }}
                          onEnded={() => setIsPlaying(false)}
                          onClick={() => setIsPlaying(!isPlaying)}
                        />
                      ) : (
                        /* HIGH-FIDELITY INTERACTIVE DEMO STAGE (Interactive fallback / simulation) */
                        <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/25 via-[#090c0b] to-[#050706] pointer-events-none" />
                          <div
                            className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{
                              backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
                              backgroundSize: '24px 24px',
                            }}
                          />

                          {/* Top Stage Indicator Banner */}
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-md">
                              <Zap className="size-3.5 text-emerald-400" />
                              <span className="text-xs font-medium text-emerald-300">
                                {currentScenario.stage}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                              <span className="text-[11px] text-zinc-400">{currentScenario.metricTitle}:</span>
                              <span className={`text-xs font-semibold font-mono ${currentScenario.metricColor}`}>
                                {currentScenario.metricValue}
                              </span>
                            </div>
                          </div>

                          {/* Center Stage: Interviewer Avatar + Voice Aura + Live Captions */}
                          <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center px-4">
                            <div className="relative mb-4">
                              {isPlaying && (
                                <>
                                  <motion.div
                                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute -inset-4 rounded-full bg-emerald-400/20 blur-md pointer-events-none"
                                  />
                                  <motion.div
                                    animate={{ scale: [1, 1.45, 1], opacity: [0.3, 0.05, 0.3] }}
                                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                                    className="absolute -inset-8 rounded-full border border-emerald-400/25 pointer-events-none"
                                  />
                                </>
                              )}

                              <div className="relative size-20 sm:size-24 md:size-28 rounded-full overflow-hidden border-2 border-emerald-400/60 shadow-[0_0_30px_rgba(120,252,214,0.35)]">
                                <img
                                  src={currentScenario.avatar}
                                  alt={currentScenario.speaker}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/90 border border-emerald-400/40 text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                                {currentScenario.speaker}
                              </div>
                            </div>

                            <motion.div
                              key={currentScenario.stage}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35 }}
                              className="max-w-xl bg-black/70 border border-white/10 backdrop-blur-md rounded-xl p-3.5 sm:p-4 shadow-xl text-center"
                            >
                              <p className="text-sm sm:text-base md:text-lg font-medium text-white/95 leading-relaxed tracking-tight">
                                {currentScenario.question}
                              </p>
                            </motion.div>

                            {/* Dynamic Equalizer Waveform Bars */}
                            <div className="flex items-center gap-1 sm:gap-1.5 mt-4 h-6">
                              {[18, 36, 62, 44, 80, 52, 90, 70, 48, 85, 30, 65, 40, 22].map((height, idx) => (
                                <motion.div
                                  key={idx}
                                  animate={
                                    isPlaying
                                      ? {
                                          height: [
                                            `${Math.max(15, height * 0.3)}%`,
                                            `${height}%`,
                                            `${Math.max(20, height * 0.4)}%`,
                                          ],
                                        }
                                      : { height: '20%' }
                                  }
                                  transition={{
                                    duration: 0.6 + (idx % 4) * 0.15,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                  className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-emerald-500 to-teal-300"
                                />
                              ))}
                            </div>
                          </div>

                          {/* Floating Live Telemetry HUD Card */}
                          <div className="relative z-10 self-end hidden sm:flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl text-left">
                            <div className="size-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                              <ShieldCheck className="size-4 text-emerald-400" />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
                                Muse AI Telemetry
                              </div>
                              <div className="text-xs font-semibold text-emerald-300">
                                {currentScenario.badge}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BOTTOM PLAYER DOCK */}
                    {isYouTube && !forceSimulatedMode ? (
                      /* DOCK FOR YOUTUBE (Clean, unobtrusive, high conversion) */
                      <div className="px-4 sm:px-6 py-3 bg-black/70 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-3 text-xs shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-400" />
                          <span className="text-zinc-300 font-medium text-xs hidden sm:inline">
                            InterVibe Demo Video
                          </span>
                          <span className="text-zinc-500 text-[11px] hidden md:inline">
                            • Ready to test your interview readiness?
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setForceSimulatedMode(true)}
                            className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs border border-white/10 cursor-pointer transition-colors"
                            title="Switch to interactive simulation"
                          >
                            <Tv className="size-3 text-emerald-400" />
                            <span>Simulation View</span>
                          </button>

                          <Link href="/auth/signup" onClick={handleClose}>
                            <Button
                              size="sm"
                              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-full text-xs font-medium cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(120,252,214,0.3)] transition-all flex items-center gap-1.5"
                            >
                              <span>Start Free Mock</span>
                              <ArrowRight className="size-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      /* DOCK FOR DIRECT VIDEO / SIMULATION */
                      <div className="px-4 sm:px-6 py-3 bg-black/70 backdrop-blur-md border-t border-white/10 flex flex-col gap-2 shrink-0">
                        <div
                          className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer group/timeline py-1"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const newPct = Math.max(0, Math.min(1, clickX / rect.width));
                            const newTime = newPct * totalDuration;
                            setCurrentTime(newTime);
                            if (videoElementRef.current) {
                              videoElementRef.current.currentTime = newTime;
                            }
                          }}
                        >
                          <div className="absolute inset-0 flex">
                            <div className="w-1/3 border-r border-white/20 h-full" />
                            <div className="w-1/3 border-r border-white/20 h-full" />
                            <div className="w-1/3 h-full" />
                          </div>

                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-100 relative"
                            style={{ width: `${progressPercentage}%` }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 size-3.5 bg-white rounded-full shadow-md opacity-0 group-hover/timeline:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setIsPlaying(!isPlaying)}
                              className="size-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-all cursor-pointer"
                              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                            >
                              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5 fill-current" />}
                            </button>

                            <button
                              onClick={() => {
                                setCurrentTime(0);
                                if (videoElementRef.current) videoElementRef.current.currentTime = 0;
                                setIsPlaying(true);
                              }}
                              className="size-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                              title="Restart demo"
                            >
                              <RotateCcw className="size-3.5" />
                            </button>

                            <span className="font-mono text-zinc-400 text-[11px]">
                              {formatTime(currentTime)} / {formatTime(totalDuration)}
                            </span>

                            <div className="hidden lg:flex items-center gap-1.5 ml-2">
                              {[
                                { label: 'Setup', time: 0 },
                                { label: 'Voice AI', time: 10 },
                                { label: 'Feedback', time: 20 },
                              ].map((chapter) => (
                                <button
                                  key={chapter.label}
                                  onClick={() => {
                                    setCurrentTime(chapter.time);
                                    if (videoElementRef.current) videoElementRef.current.currentTime = chapter.time;
                                    setIsPlaying(true);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                                    currentTime >= chapter.time && currentTime < chapter.time + 10
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  {chapter.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3">
                            {isYouTube && (
                              <button
                                onClick={() => setForceSimulatedMode(false)}
                                className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-mono cursor-pointer border border-emerald-500/30 transition-colors"
                              >
                                Back to YouTube Video
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setPlaybackSpeed((prev) => (prev === 1 ? 1.25 : prev === 1.25 ? 1.5 : 1));
                              }}
                              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-mono cursor-pointer transition-colors"
                              title="Playback speed"
                            >
                              {playbackSpeed}x
                            </button>

                            <button
                              onClick={() => setIsMuted(!isMuted)}
                              className="size-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                              title={isMuted ? 'Unmute' : 'Mute'}
                            >
                              {isMuted ? <VolumeX className="size-3.5 text-red-400" /> : <Volume2 className="size-3.5" />}
                            </button>

                            <button
                              onClick={toggleFullscreen}
                              className="size-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                            >
                              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                            </button>

                            <Link href="/auth/signup" onClick={handleClose}>
                              <Button
                                size="sm"
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(120,252,214,0.3)] transition-all flex items-center gap-1.5"
                              >
                                <span>Start Free Mock</span>
                                <ArrowRight className="size-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
