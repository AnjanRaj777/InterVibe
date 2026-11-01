"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Check, FileText, Mic, TrendingUp } from "lucide-react"

/* ---------- Tiny visuals (kept intentionally minimal) ---------- */

const UploadVisual = () => (
  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
    <div className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
      <FileText className="size-4" />
    </div>
    <div className="flex-1 text-left">
      <p className="text-sm font-medium text-foreground">resume.pdf</p>
      <p className="text-[11px] text-muted-foreground">Senior Engineer</p>
    </div>
    <div className="grid size-6 place-items-center rounded-full bg-emerald-500 text-black">
      <Check className="size-3.5" strokeWidth={3} />
    </div>
  </div>
)

const InterviewVisual = () => (
  <div className="flex h-[60px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-4">
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <span
        key={i}
        className="w-1 rounded-full bg-emerald-400/80"
        style={{
          height: 10,
          animation: `${["wave", "wave2", "wave3"][i % 3]} ${0.9 + (i % 4) * 0.15}s ease-in-out ${i * 0.08}s infinite`,
        }}
      />
    ))}
  </div>
)

const ScoreVisual = () => (
  <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
    <div className="relative grid size-11 place-items-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15" fill="none" stroke="#34d399" strokeWidth="3"
          strokeLinecap="round" strokeDasharray="94.2" strokeDashoffset="11.3"
        />
      </svg>
      <span className="text-[11px] font-semibold text-foreground">88</span>
    </div>
    <div className="flex-1 space-y-1.5">
      {[90, 72, 84].map((w, i) => (
        <div key={i} className="h-1.5 rounded-full bg-white/5">
          <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  </div>
)

/* ---------- Card ---------- */

interface StepProps {
  n: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
  Visual: React.ComponentType
}

const steps: StepProps[] = [
  { n: "01", icon: FileText, title: "Upload your resume", text: "Questions tailored to your role.", Visual: UploadVisual },
  { n: "02", icon: Mic, title: "Interview by voice", text: "Talk to a realistic AI interviewer.", Visual: InterviewVisual },
  { n: "03", icon: TrendingUp, title: "Get scored & improve", text: "See what to fix. Drill it. Repeat.", Visual: ScoreVisual },
]

const StepCard = ({ n, icon: Icon, title, text, Visual, index }: StepProps & { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    className="group relative flex flex-col gap-6 rounded-2xl border border-white/10 bg-gradient-to-b from-[#141816]/80 to-[#0e1110]/95 p-6
      backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-[0_0_40px_-12px_rgba(16,185,129,0.35)]"
  >
    <div className="flex items-center justify-between">
      <div className="grid size-10 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-all duration-300 group-hover:bg-emerald-500/20">
        <Icon className="size-5" />
      </div>
      <span className="font-mono text-sm text-white/20 transition-all duration-300 group-hover:text-emerald-400/60">{n}</span>
    </div>

    <div className="space-y-1.5 text-left">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>

    <Visual />
  </motion.div>
)

/* ---------- Section ---------- */

export function BentoSection() {
  return (
    <section className="w-full px-5 flex flex-col items-center bg-transparent">
      <div className="relative w-full max-w-[1100px] py-16 md:py-24 flex flex-col items-center gap-12 md:gap-16">
        {/* Ambient light */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[420px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            HOW IT WORKS
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Three steps to offer-ready
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">Upload. Practice. Improve.</p>
        </div>

        {/* Steps */}
        <div className="relative z-10 w-full">
          {/* Connector line (desktop) */}
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-[44px] hidden h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent md:block" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <StepCard key={s.n} {...s} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
