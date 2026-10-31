"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"

const faqData = [
  {
    question: "What is InterVibe and who is it designed for?",
    answer:
      "InterVibe is a next-generation real-time AI verbal mock interview and diagnostic platform. It is engineered for software engineers, engineering managers, and technical candidates preparing for high-stakes technical screeners, system architecture loops, and behavioral interviews at top tech companies like Meta, Stripe, Google, and Linear.",
  },
  {
    question: "How does the Push-to-Talk verbal interview loop work?",
    answer:
      "InterVibe captures raw audio via the Web Audio API and resamples it client-side to 16,000Hz mono WAV before streaming directly to Meta Muse Voice Transcribe. You simply hold the Spacebar while answering and release to process. This zero-accidental-cutoff design eliminates awkward interruptions, letting you pause and structure complex architectural thoughts naturally.",
  },
  {
    question: "How does InterVibe calibrate interviews to my resume and target job?",
    answer:
      "When you upload your resume (.pdf) and target job description, our document ingestion engine extracts your past frameworks, scale metrics, and seniority bars directly into the interviewer's working memory. The AI persona cross-examines your real technical claims and dynamically calibrates question depth to your target level (Mid, Senior, or Staff).",
  },
  {
    question: "What interviewer personas can I practice with?",
    answer:
      "You can spar with specialized AI interviewer personas powered by Meta Muse Spark 1.3 LLM and Deepgram Aura neural voices: Sarah Chen (Senior Technical Recruiter at Linear for warm behavioral & STAR probing), Michael Vance (Strict Engineering Manager at Stripe for distributed systems & edge-case pressure), and Emma Watson (Staff Tech Lead at DeepMind for algorithmic precision and architecture).",
  },
  {
    question: "What diagnostics and analysis do I receive after an interview?",
    answer:
      "Immediately upon concluding your session, the Meta Muse Evaluator generates an executive diagnostic scorecard: an overall Readiness Index, granular ratings across Technical Depth, System Architecture, and Verbal Clarity, an evaluator qualitative assessment, observed strengths, identified blind spots, and step-by-step coaching instructions.",
  },
  {
    question: "How does the targeted micro-drill loop work?",
    answer:
      "Instead of repeating an entire 45-minute interview, InterVibe isolates flagged weaknesses (such as explaining Redis split-brain recovery or quantifying architectural trade-offs) into focused 2–3 minute scenario sprints. You loop through drills with real-time scoring until your execution becomes second nature.",
  },
  {
    question: "Is my resume, voice audio, and interview session data secure?",
    answer:
      "Yes, completely. Your resume, voice stream, transcripts, and evaluation scorecards are processed over secure encrypted channels and stored locally in your private session storage. Your data is private to you and never sold, shared, or used to train public AI models.",
  },
]

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

const FAQItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onToggle()
  }
  return (
    <div
      className={`w-full bg-[rgba(231,236,235,0.04)] hover:bg-[rgba(231,236,235,0.07)] shadow-[0px_2px_4px_rgba(0,0,0,0.16)] overflow-hidden rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all duration-300 ease-out cursor-pointer`}
      onClick={handleClick}
    >
      <div className="w-full px-5 py-[18px] pr-4 flex justify-between items-center gap-5 text-left transition-all duration-300 ease-out">
        <div className="flex-1 text-foreground text-base font-medium leading-6 break-words flex items-center gap-2.5">
          <span className="text-emerald-400 font-mono text-xs opacity-80">Q.</span>
          <span>{question}</span>
        </div>
        <div className="flex justify-center items-center">
          <ChevronDown
            className={`w-5 h-5 text-emerald-400/70 transition-all duration-300 ease-out ${isOpen ? "rotate-180 text-emerald-400 scale-110" : "rotate-0 text-white/50 scale-100"}`}
          />
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-400 ease-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
        style={{
          transitionProperty: "max-height, opacity, padding",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className={`px-5 pl-10 transition-all duration-300 ease-out border-t border-white/5 ${isOpen ? "pb-5 pt-3 translate-y-0" : "pb-0 pt-0 -translate-y-2"}`}
        >
          <div className="text-muted-foreground text-sm font-normal leading-relaxed break-words">{answer}</div>
        </div>
      </div>
    </div>
  )
}

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0])) // Keep first question open by default for immediate engagement
  
  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <section className="w-full pt-[66px] pb-20 md:pb-36 px-5 relative flex flex-col justify-center items-center">
      <div className="w-[300px] h-[500px] absolute top-[150px] left-1/2 -translate-x-1/2 origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[100px] z-0 pointer-events-none" />
      
      <div className="self-stretch pt-8 pb-8 md:pt-14 md:pb-12 flex flex-col justify-center items-center gap-2 relative z-10">
        <div className="flex flex-col justify-start items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-medium">
            <HelpCircle className="size-3.5" />
            EVERYTHING YOU NEED TO KNOW
          </div>
          <h2 className="w-full max-w-[700px] text-center text-foreground text-3xl md:text-5xl font-semibold leading-tight tracking-tight break-words">
            Frequently Asked Questions
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm md:text-base font-medium leading-relaxed break-words max-w-xl mx-auto">
            Everything you need to know about InterVibe's voice simulation engine, persona cross-examination, and practice drill loops.
          </p>
        </div>
      </div>

      <div className="w-full max-w-[760px] pt-0.5 pb-10 flex flex-col justify-start items-start gap-3.5 relative z-10">
        {faqData.map((faq, index) => (
          <FAQItem key={index} {...faq} isOpen={openItems.has(index)} onToggle={() => toggleItem(index)} />
        ))}
      </div>
    </section>
  )
}
