"use client";

import React, { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Header } from "./header";
import Link from "next/link";
import { ZOOM } from "./motion-config";
import { DemoVideoButton } from "./demo-video-modal";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const h = ZOOM.hero;
  const g = ZOOM.heroBg;

  // Hero "camera dolly": background flies toward the viewer, content recedes.
  const bgScale = useSpring(useTransform(scrollY, h.range, [1, h.bgScale]), ZOOM.spring);
  const bgOpacity = useSpring(useTransform(scrollY, h.range, [1, h.bgOpacity]), ZOOM.spring);
  const contentScale = useSpring(useTransform(scrollY, h.range, [1, h.contentScale]), ZOOM.spring);
  const contentY = useSpring(useTransform(scrollY, h.range, [0, h.contentY]), ZOOM.spring);
  const contentOpacity = useSpring(useTransform(scrollY, h.range, [1, 0]), ZOOM.spring);

  // Pointer parallax: grid gently drifts opposite to the cursor.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const parallaxX = useSpring(pointerX, { stiffness: 40, damping: 20, mass: 0.6 });
  const parallaxY = useSpring(pointerY, { stiffness: 40, damping: 20, mass: 0.6 });

  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      pointerX.set(-nx * 2 * g.mouseRange);
      pointerY.set(-ny * 2 * g.mouseRange);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduceMotion, pointerX, pointerY, g.mouseRange]);

  const bgStyle = reduceMotion
    ? undefined
    : { scale: bgScale, opacity: bgOpacity, willChange: "transform, opacity" };
  const contentStyle = reduceMotion
    ? undefined
    : { scale: contentScale, y: contentY, opacity: contentOpacity, willChange: "transform, opacity" };

  return (
    <section
      className="flex flex-col items-center text-center relative mx-auto rounded-3xl overflow-hidden my-4 sm:my-6 py-0 px-3 sm:px-6
         w-full min-h-[520px] md:w-[1240px] md:h-[640px] lg:h-[760px] md:px-0 border border-white/[0.08] bg-gradient-to-b from-[#0d1210] via-[#090d0b] to-[#070a08] shadow-[0_25px_80px_-20px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      {/* Dynamic Atmospheric Canvas Background */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        initial={reduceMotion ? false : { scale: g.loadFromScale }}
        animate={{ scale: 1 }}
        transition={{ duration: g.loadDuration, ease: g.loadEase }}
      >
        <motion.div className="absolute inset-0" style={bgStyle}>
          <motion.div
            className="absolute -inset-8"
            animate={
              reduceMotion
                ? undefined
                : {
                    x: [0, g.driftRange, -g.driftRange * 0.6, 0],
                    y: [0, -g.driftRange * 0.7, g.driftRange * 0.5, 0],
                  }
            }
            transition={{ duration: g.driftDuration, ease: "easeInOut", repeat: Infinity }}
          >
            <motion.div
              className="absolute inset-0"
              style={reduceMotion ? undefined : { x: parallaxX, y: parallaxY, willChange: "transform" }}
            >
              {/* Celestial Top Radial Nebula */}
              <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.25)_0%,_rgba(6,182,212,0.12)_40%,_transparent_72%)] blur-3xl opacity-90" />

              {/* Ambient Spotlight Cone */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-emerald-400/20 via-teal-500/5 to-transparent blur-2xl" />

              {/* Delicate Precision Engineering Grid (fades out at edges) */}
              <div
                className="absolute inset-0 opacity-[0.16]"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(52, 211, 153, 0.4) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(52, 211, 153, 0.4) 1px, transparent 1px)
                  `,
                  backgroundSize: "48px 48px",
                  maskImage: "radial-gradient(ellipse 75% 65% at 50% 32%, black 20%, transparent 80%)",
                  WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 32%, black 20%, transparent 80%)",
                }}
              />

              {/* Faint Concentric Orbitals */}
              <div className="absolute left-1/2 top-48 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-emerald-500/10 pointer-events-none" />
              <div className="absolute left-1/2 top-48 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] rounded-full border border-emerald-500/[0.05] pointer-events-none" />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Floating Island Header */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <Header />
      </div>

      {/* Main Hero Typography & Call-To-Action Content */}
      <motion.div className="relative z-10 flex flex-col items-center w-full px-4" style={contentStyle}>
        <div className="relative z-10 space-y-3 md:space-y-4 max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mt-14 sm:mt-16 md:mt-20 lg:mt-20">
          
          {/* Innovation Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono backdrop-blur-md shadow-[0_0_16px_rgba(16,185,129,0.15)] hover:border-emerald-400/40 hover:bg-emerald-500/15 transition-all cursor-pointer group"
          >
            <span className="flex size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tracking-wide">Next-Gen Realtime 3D AI Interviewers</span>
            <span className="text-emerald-400/70 font-sans group-hover:translate-x-0.5 transition-transform text-xs">→</span>
          </motion.div>

          {/* Main Headline (Clean natural wrap, high contrast) */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.1] text-balance max-w-3xl mx-auto">
            <span className="bg-gradient-to-b from-white via-neutral-100 to-neutral-300 bg-clip-text text-transparent">
              Unleash the Interview{" "}
            </span>
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(52,211,153,0.3)]">
              That Hires You
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-neutral-300/90 text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-xl mx-auto text-balance tracking-tight">
            Real 3D AI humans who interview like FAANG engineering leads. Voice-first, latency-free, and scored live by Meta Muse Spark.
          </p>
        </div>

        {/* CTA Actions */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 md:mt-7">
          <Link href="/auth/signup">
            <button className="group relative overflow-hidden bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 text-neutral-950 font-semibold px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm shadow-[0_0_24px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,255,255,0.6)] hover:shadow-[0_0_36px_rgba(52,211,153,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 cursor-pointer">
              <span>Start Your First Mock — Free</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <DemoVideoButton videoSrc="https://youtu.be/RlSbHkXWL0c" />
        </div>

        {/* Micro Trust Indicators (Compact inline, no vertical overlap) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mt-4 text-[11px] font-mono text-neutral-400/80">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            320ms Voice Latency
          </span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-cyan-400" />
            Photorealistic 3D Avatars
          </span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-teal-400" />
            No Credit Card Required
          </span>
        </div>
      </motion.div>
    </section>
  );
}
