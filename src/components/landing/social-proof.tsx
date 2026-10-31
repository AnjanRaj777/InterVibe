import React from "react";
import {
  Bot,
  Mic,
  Sparkles,
  Code2,
  Layers,
  Volume2,
  Zap,
  Box
} from "lucide-react";

// Official Meta SVG Path
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

const META_MODELS = [
  {
    name: "Meta Muse Spark",
    version: "1.3",
    role: "Interviewer LLM Reasoning",
    icon: MetaIcon,
    accent: "group-hover:text-cyan-400 group-hover:border-cyan-500/40",
  },
  {
    name: "Meta Muse Voice Transcribe 1.0",
    version: "16kHz STT",
    role: "Direct Raw PCM Audio",
    icon: MetaIcon,
    accent: "group-hover:text-emerald-400 group-hover:border-emerald-500/40",
  },
  {
    name: "Meta Llama 3.3",
    version: "70B Instruct",
    role: "Candidate Rubrics & Scoring",
    icon: MetaIcon,
    accent: "group-hover:text-sky-400 group-hover:border-sky-500/40",
  },
  {
    name: "Meta Llama 3.1",
    version: "405B Engine",
    role: "Distributed System Design",
    icon: MetaIcon,
    accent: "group-hover:text-purple-400 group-hover:border-purple-500/40",
  },
  {
    name: "Meta Code Llama",
    version: "Specialized",
    role: "AST Parsing & Complexity",
    icon: MetaIcon,
    accent: "group-hover:text-amber-400 group-hover:border-amber-500/40",
  },
  {
    name: "Meta Voicebox",
    version: "Expressive",
    role: "Conversational Cadence",
    icon: MetaIcon,
    accent: "group-hover:text-teal-400 group-hover:border-teal-500/40",
  },
  {
    name: "Deepgram Aura",
    version: "Sub-300ms",
    role: "Low-Latency Neural Voice",
    icon: Zap,
    accent: "group-hover:text-red-400 group-hover:border-red-500/40",
  },
  {
    name: "XRSPACE Perxona",
    version: "60 FPS",
    role: "3D Blendshapes AI Avatar",
    icon: Box,
    accent: "group-hover:text-emerald-400 group-hover:border-emerald-500/40",
  },
];

export function SocialProof() {
  return (
    <section className="self-stretch py-12 md:py-16 flex flex-col justify-center items-center gap-8 overflow-hidden select-none">
      {/* Header Label */}
      <div className="flex flex-col items-center gap-2 text-center max-w-xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-mono">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wide">AI Foundation Architecture</span>
        </div>
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white tracking-tight">
          Trusted & Powered by Meta AI Models
        </h2>
        <p className="text-xs text-neutral-400 font-mono">
          Real-time interview loops powered by Meta Muse, Llama 3.3, and ultra-low latency speech models
        </p>
      </div>

      {/* 8 Models Grid (2 rows x 4 cols on desktop, 2 cols on mobile) */}
      <div className="w-full max-w-[1160px] grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 justify-items-stretch px-2 sm:px-4">
        {META_MODELS.map((model) => {
          const IconComponent = model.icon;
          return (
            <div
              key={model.name}
              className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 ${model.accent} transition-all duration-300 backdrop-blur-md shadow-sm`}
            >
              {/* Top row: Brand Icon + Version Pill */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-neutral-400 group-hover:text-white transition-colors">
                  <IconComponent className="size-5 shrink-0" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400 group-hover:text-neutral-200 transition-colors">
                  {model.version}
                </span>
              </div>

              {/* Bottom: Model Name + Role Description */}
              <div className="space-y-0.5 text-left">
                <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight group-hover:text-emerald-300 transition-colors truncate">
                  {model.name}
                </h3>
                <p className="text-[11px] text-neutral-400 font-mono truncate">
                  {model.role}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
