"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Twitter, Github, Linkedin, Shield, Scale, ExternalLink, Lock, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export function FooterSection() {
  const [modalType, setModalType] = useState<"privacy" | "terms" | null>(null)

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <footer className="w-full max-w-[1320px] mx-auto px-5 flex flex-col justify-start items-stretch gap-8 py-10 md:py-[70px]">
      {/* Upper Section: Brand + Navigation Columns */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
        {/* Left Section: Logo, Description, Social Links */}
        <div className="flex flex-col justify-start items-start gap-6 p-2 md:p-4 max-w-sm">
          <div className="flex gap-3 items-center">
            <span className="text-foreground text-2xl font-bold tracking-tight">InterVibe</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              v1.0
            </span>
          </div>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed">
            Real-time AI verbal mock interview simulator powered by Meta Muse Spark 1.3, WebGL 3D avatars, and sub-second neural speech synthesis.
          </p>
          <div className="flex justify-start items-center gap-4">
            <a 
              href="https://x.com/anjan_raj82685" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Twitter / X" 
              className="size-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:border-neutral-600 transition-colors"
            >
              <Twitter className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
            <a 
              href="https://github.com/AnjanRaj777/" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="GitHub" 
              className="size-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:border-neutral-600 transition-colors"
            >
              <Github className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
            <a 
              href="https://www.linkedin.com/in/anjan-p-aab740326/" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="LinkedIn" 
              className="size-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:border-neutral-600 transition-colors"
            >
              <Linkedin className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
          </div>
        </div>

        {/* Right Section: 4 Columns (Product, About, Tech, Legal) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 p-2 md:p-4 w-full lg:w-auto">
          {/* Column 1: Product */}
          <div className="flex flex-col justify-start items-start gap-3">
            <h3 className="text-foreground text-xs font-semibold font-mono uppercase tracking-wider">
              <a 
                href="#top" 
                onClick={(e) => handleScroll(e, "top")}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Product
              </a>
            </h3>
            <div className="flex flex-col justify-end items-start gap-2.5 text-sm">
              <a 
                href="#features-section" 
                onClick={(e) => handleScroll(e, "features-section")}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Features
              </a>
              <a 
                href="#pricing-section" 
                onClick={(e) => handleScroll(e, "pricing-section")}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Pricing
              </a>
              <a 
                href="#meta-ai-models-section" 
                onClick={(e) => handleScroll(e, "meta-ai-models-section")}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Integrations
              </a>
              <a 
                href="#preview-card" 
                onClick={(e) => handleScroll(e, "preview-card")}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Room Preview
              </a>
            </div>
          </div>

          {/* Column 2: About / Team */}
          <div className="flex flex-col justify-start items-start gap-3">
            <h3 className="text-foreground text-xs font-semibold font-mono uppercase tracking-wider">
              Company
            </h3>
            <div className="flex flex-col justify-center items-start gap-2.5 text-sm">
              <a 
                href="https://www.linkedin.com/in/anjan-p-aab740326/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About us
              </a>
              <a 
                href="https://github.com/AnjanRaj777/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Our team
              </a>
              <a 
                href="https://www.linkedin.com/in/anjan-p-aab740326/" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="LinkedIn: Anjan P | GitHub: AnjanRaj777 | X: @anjan_raj82685"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </a>
            </div>
          </div>

          {/* Column 3: Tech & Resources */}
          <div className="flex flex-col justify-start items-start gap-3">
            <h3 className="text-foreground text-xs font-semibold font-mono uppercase tracking-wider">
              Resources
            </h3>
            <div className="flex flex-col justify-center items-start gap-2.5 text-sm">
              <a 
                href="#meta-ai-models-section" 
                onClick={(e) => handleScroll(e, "meta-ai-models-section")}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Meta Muse Spark
              </a>
              <a 
                href="https://github.com/AnjanRaj777/InterVibe" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Repository
              </a>
              <a 
                href="https://github.com/AnjanRaj777/InterVibe/blob/main/LICENSE" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                MIT License
              </a>
              <a 
                href="https://github.com/AnjanRaj777/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Support
              </a>
            </div>
          </div>

          {/* Column 4: Legal & Policies */}
          <div className="flex flex-col justify-start items-start gap-3">
            <h3 className="text-foreground text-xs font-semibold font-mono uppercase tracking-wider">
              Legal & Trust
            </h3>
            <div className="flex flex-col justify-center items-start gap-2.5 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs">Privacy Policy:</span>
                <Link 
                  href="/privacy" 
                  className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors font-medium text-xs"
                >
                  View Policy
                </Link>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs">Terms of Use:</span>
                <Link 
                  href="/terms" 
                  className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors font-medium text-xs"
                >
                  View Terms
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setModalType("privacy")}
                className="text-left text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Quick Privacy Preview
              </button>

              <button
                type="button"
                onClick={() => setModalType("terms")}
                className="text-left text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Quick Terms Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Direct Legal Action Links */}
      <div className="w-full border-t border-border/40 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <div>
          © {new Date().getFullYear()} InterVibe Platform Technologies. Open-source under MIT License.
        </div>
        <div className="flex flex-wrap items-center gap-5 sm:gap-6 font-mono text-[11px]">
          <div className="flex items-center gap-1">
            <span className="text-neutral-500">Privacy Policy:</span>
            <Link 
              href="/privacy" 
              className="text-neutral-300 hover:text-emerald-400 hover:underline transition-colors font-medium"
            >
              /privacy
            </Link>
          </div>
          <span className="text-neutral-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1">
            <span className="text-neutral-500">Terms of Use:</span>
            <Link 
              href="/terms" 
              className="text-neutral-300 hover:text-cyan-400 hover:underline transition-colors font-medium"
            >
              /terms
            </Link>
          </div>
          <span className="text-neutral-700 hidden sm:inline">•</span>
          <a
            href="https://github.com/AnjanRaj777/InterVibe/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            MIT License
          </a>
        </div>
      </div>

      {/* Interactive Modal: Privacy Policy Dialog */}
      <Dialog open={modalType === "privacy"} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] bg-[#121212] border-neutral-800 text-neutral-200 p-6">
          <DialogHeader className="border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono mb-1">
              <Shield className="size-4" />
              <span>DATA PROTECTION & PRIVACY</span>
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Privacy Policy: InterVibe Platform
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Summary of candidate data rights, audio streaming retention, and GDPR / CCPA compliance.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[50vh] pr-4 text-xs text-neutral-300 space-y-4">
            <div className="space-y-3 pt-2">
              <h4 className="font-semibold text-white text-sm">1. Zero Audio Disk Retention</h4>
              <p className="text-neutral-400 leading-relaxed">
                Raw audio captured during Push-to-Talk is resampled to 16kHz mono PCM WAV in your browser and processed ephemerally in memory by Meta Muse Voice Transcribe. We do not store raw microphone audio files on disk unless explicitly opted into for personal replay archives.
              </p>

              <h4 className="font-semibold text-white text-sm">2. Resume Parsing & 5MB Ceiling</h4>
              <p className="text-neutral-400 leading-relaxed">
                Resume PDFs are limited to 5MB, verified against %PDF- magic bytes, and used strictly to seed conversational context for the AI interviewer persona. Your resume text is never shared with external advertisers.
              </p>

              <h4 className="font-semibold text-white text-sm">3. Sub-Processors & Data Isolation</h4>
              <p className="text-neutral-400 leading-relaxed">
                We partner with Meta AI (Muse Spark 1.3 LLM & Voice Transcribe), Deepgram (Aura TTS), and Supabase (PostgreSQL with Row Level Security). Candidate data is strictly isolated by user ID.
              </p>

              <h4 className="font-semibold text-white text-sm">4. Data Deletion Rights</h4>
              <p className="text-neutral-400 leading-relaxed">
                You can delete your transcripts and account anytime in your profile or email <span className="text-emerald-400">privacy@intervibe.ai</span>. Records are expunged within 30 days.
              </p>
            </div>
          </ScrollArea>

          <div className="border-t border-neutral-800 pt-4 flex items-center justify-between">
            <Link 
              href="/privacy" 
              onClick={() => setModalType(null)} 
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Read Full Dedicated Privacy Policy</span>
              <ExternalLink className="size-3" />
            </Link>
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-1.5 text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-white rounded transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interactive Modal: Terms of Use Dialog */}
      <Dialog open={modalType === "terms"} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] bg-[#121212] border-neutral-800 text-neutral-200 p-6">
          <DialogHeader className="border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
              <Scale className="size-4" />
              <span>TERMS & POLICIES</span>
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Terms of Use: InterVibe Platform
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Overview of acceptable use, MIT open-source licensing, subscription limits, and refund rules.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[50vh] pr-4 text-xs text-neutral-300 space-y-4">
            <div className="space-y-3 pt-2">
              <h4 className="font-semibold text-white text-sm">1. Dual Licensing Model</h4>
              <p className="text-neutral-400 leading-relaxed">
                The open-source repository code is licensed under the permissive MIT License. However, these commercial Terms of Use govern access to our hosted production platform (inter-vibe.vercel.app), paid Meta AI tokens, Deepgram voice streams, and cloud databases.
              </p>

              <h4 className="font-semibold text-white text-sm">2. Subscription Limits & Quotas</h4>
              <p className="text-neutral-400 leading-relaxed">
                Free Starter includes 3 interviews/mo (30 mins total). Hustler includes 20 interviews/mo (300 mins). Pro includes 100 interviews/mo (1,200 mins). Unused allowances reset every billing cycle.
              </p>

              <h4 className="font-semibold text-white text-sm">3. 7-Day Refund Policy</h4>
              <p className="text-neutral-400 leading-relaxed">
                First-time paid subscribers can request a 100% full refund within 7 days of purchase if fewer than 3 interviews have been completed and under 30 total minutes used. Email <span className="text-cyan-400">billing@intervibe.ai</span>.
              </p>

              <h4 className="font-semibold text-white text-sm">4. Prohibited Abuse & Violations</h4>
              <p className="text-neutral-400 leading-relaxed">
                Prompt injection attacks, scraping AI endpoints, uploading polyglot PDF exploits, or reselling accounts are strictly prohibited and subject to immediate termination.
              </p>
            </div>
          </ScrollArea>

          <div className="border-t border-neutral-800 pt-4 flex items-center justify-between">
            <Link 
              href="/terms" 
              onClick={() => setModalType(null)} 
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Read Full Dedicated Terms of Use</span>
              <ExternalLink className="size-3" />
            </Link>
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-1.5 text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-white rounded transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
