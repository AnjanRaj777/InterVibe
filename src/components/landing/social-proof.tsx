"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Box } from "lucide-react";

function MetaIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Meta</title>
      <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" />
    </svg>
  );
}

const MODELS = [
  {
    name: "Meta Muse Spark",
    tag: "Reasoning",
    desc: "Live interview intelligence",
    icon: MetaIcon,
  },
  {
    name: "Muse Voice Transcribe",
    tag: "Audio",
    desc: "Speech-to-text & speaker detection",
    icon: MetaIcon,
  },
  {
    name: "Deepgram Aura",
    tag: "<300ms",
    desc: "Real-time neural voice",
    icon: Zap,
  },
  {
    name: "XRSPACE Perxona",
    tag: "60 FPS",
    desc: "3D lifelike avatar",
    icon: Box,
  },
];

export function SocialProof() {
  return (
    <section className="self-stretch py-12 md:py-16 flex flex-col justify-center items-center gap-8 overflow-hidden select-none">
      {/* Compact Header */}
      <div className="flex flex-col items-center gap-3 text-center max-w-lg mx-auto px-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          POWERED BY
        </span>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
          Built on real-time AI
        </h2>
      </div>

      {/* 4 Core Pillars (1 row on desktop, 2x2 on mobile) */}
      <div className="w-full max-w-[1040px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2 sm:px-4">
        {MODELS.map((model, index) => {
          const IconComponent = model.icon;
          return (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative flex flex-col justify-between gap-5 p-5 rounded-2xl border border-white/10 bg-gradient-to-b from-[#141816]/80 to-[#0e1110]/95 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-[0_0_32px_-10px_rgba(16,185,129,0.3)]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="grid size-9 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-all duration-300 group-hover:bg-emerald-500/20">
                  <IconComponent className="size-4 shrink-0" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground group-hover:border-emerald-500/30 group-hover:text-emerald-300 transition-all duration-300">
                  {model.tag}
                </span>
              </div>

              <div className="space-y-1 text-left">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  {model.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {model.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
