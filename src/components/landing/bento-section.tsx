import type React from "react"
import CalibrationIllustration from "./bento/calibration-illustration"
import LiveInterviewIllustration from "./bento/live-interview-illustration"
import DiagnosticAnalysisIllustration from "./bento/diagnostic-analysis-illustration"
import ActionableGuidanceIllustration from "./bento/actionable-guidance-illustration"
import DrillLoopIllustration from "./bento/drill-loop-illustration"
import ReadinessTelemetryIllustration from "./bento/readiness-telemetry-illustration"

interface BentoCardProps {
  step: string
  title: string
  description: string
  Component: React.ComponentType
}

const BentoCard = ({ step, title, description, Component }: BentoCardProps) => (
  <div className="overflow-hidden rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-start items-start relative group bg-gradient-to-b from-[#141816]/75 to-[#0e1110]/95 backdrop-blur-md">
    {/* Background with blur effect */}
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: "rgba(231, 236, 235, 0.03)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    />
    {/* Subtle emerald gradient on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

    <div className="self-stretch p-6 pb-2 flex flex-col justify-start items-start gap-2 relative z-10">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-semibold tracking-wider uppercase">
        {step}
      </div>
      <div className="self-stretch flex flex-col justify-start items-start gap-1">
        <h3 className="text-foreground text-lg font-semibold leading-tight tracking-tight">
          {title}
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed min-h-[36px]">
          {description}
        </p>
      </div>
    </div>
    <div className="self-stretch h-[290px] relative -mt-0.5 z-10 p-4 pt-1">
      <Component />
    </div>
  </div>
)

export function BentoSection() {
  const cards: BentoCardProps[] = [
    {
      step: "Step 01 • Calibration",
      title: "Contextual Resume Ingestion",
      description: "Upload your CV and target role to dynamically calibrate interview personas and seniority bars.",
      Component: CalibrationIllustration,
    },
    {
      step: "Step 02 • Simulation",
      title: "Attend Live Verbal Interviews",
      description: "Spar in real-time with responsive AI personas using low-latency 16kHz Push-to-Talk audio.",
      Component: LiveInterviewIllustration,
    },
    {
      step: "Step 03 • Diagnostics",
      title: "Deep Diagnostic Analysis",
      description: "Receive instant executive evaluations across technical depth, system design, and communication.",
      Component: DiagnosticAnalysisIllustration,
    },
    {
      step: "Step 04 • Guidance",
      title: "Suggestions & Precise Instructions",
      description: "Review observed strengths, pinpoint blind spots, and follow concrete coaching instructions.",
      Component: ActionableGuidanceIllustration,
    },
    {
      step: "Step 05 • Drill Loop",
      title: "The Targeted Drill Loop",
      description: "Convert flagged weaknesses into second nature through rapid-fire 3-minute scenario drills.",
      Component: DrillLoopIllustration,
    },
    {
      step: "Step 06 • Mastery",
      title: "Offer-Ready Velocity Tracking",
      description: "Track your competency velocity and score trajectory across loops until interview day.",
      Component: ReadinessTelemetryIllustration,
    },
  ]

  return (
    <section className="w-full px-5 flex flex-col justify-center items-center overflow-visible bg-transparent">
      <div className="w-full py-8 md:py-16 relative flex flex-col justify-start items-start gap-6">
        {/* Ambient background light */}
        <div className="w-[547px] h-[938px] absolute top-[614px] left-[80px] origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[130px] z-0" />
        
        {/* Section Header */}
        <div className="self-stretch py-8 md:py-14 flex flex-col justify-center items-center gap-2 z-10">
          <div className="flex flex-col justify-start items-center gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-medium">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PROVEN PREPARATION PIPELINE
            </div>
            <h2 className="w-full max-w-[760px] text-center text-foreground text-4xl md:text-6xl font-semibold leading-tight md:leading-[66px] tracking-tight">
              The Complete Interview Mastery Loop
            </h2>
            <p className="w-full max-w-[680px] text-center text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
              From contextual resume calibration to live verbal sparring, instant diagnostics, and targeted scenario drills — engineered to turn preparation into offers.
            </p>
          </div>
        </div>

        {/* 3x2 Bento Cards Grid */}
        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10">
          {cards.map((card) => (
            <BentoCard key={card.step} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}
