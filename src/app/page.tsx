'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Sparkles, Zap, ShieldCheck, ArrowRight, Bot, AudioWaveform, FileText, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
            IV
          </div>
          <span className="font-bold text-xl tracking-tight">InterVibe</span>
          <Badge variant="outline" className="text-xs px-2 py-0.5 ml-1 border-primary/30 text-primary">
            v2.0
          </Badge>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
          <Link href="/dashboard/billing" className="hover:text-foreground transition-colors">Pricing</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/dashboard/interview">
            <Button size="sm" className="gap-2">
              Launch Interview <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 md:pt-28 md:pb-32 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles className="size-3.5" />
          <span>Real-time Groq Whisper Large v3 &amp; LLaMA 3.3 70B</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1]">
          Master Your Next Tech Interview with <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">Voice AI</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl font-normal leading-relaxed">
          Realistic, hands-free verbal technical mock interviews. Upload your resume, paste target job descriptions, and practice speaking naturally with intelligent AI interviewers.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/dashboard/interview">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base gap-2 font-semibold shadow-lg shadow-primary/20">
              <Mic className="size-5" /> Start Practice Interview
            </Button>
          </Link>
          <Link href="/dashboard/overview">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base font-semibold">
              View Analytics
            </Button>
          </Link>
        </div>

        {/* Live Audio Visualizer Banner */}
        <div className="mt-14 w-full max-w-3xl rounded-2xl border border-border/80 bg-card/60 p-6 shadow-2xl backdrop-blur flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <AudioWaveform className="size-6 animate-pulse" />
            </div>
            <div>
              <div className="font-semibold text-sm">Autonomous Hands-Free Voice Loop</div>
              <div className="text-xs text-muted-foreground">Voice Activity Detection automatically catches pauses and responds in milliseconds</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-medium text-emerald-400">Zero Latency Audio</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="px-6 py-20 bg-muted/20 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Everything You Need to Get Hired</h2>
            <p className="text-muted-foreground mt-3">Built with modern cloud-edge AI inference and browser-native audio pipelines.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/60 bg-card/70">
              <CardHeader>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <FileText className="size-5" />
                </div>
                <CardTitle>Resume Memory Parsing</CardTitle>
                <CardDescription>
                  Upload your PDF/DOCX resume. The AI extracts up to 10,000 characters to cross-examine specific achievements and previous tech stack choices.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60 bg-card/70">
              <CardHeader>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Bot className="size-5" />
                </div>
                <CardTitle>Specialized Interview Personas</CardTitle>
                <CardDescription>
                  Choose between Friendly HR Recruiter (Sarah), Strict Engineering Manager (Michael), or UK Technical Lead (Emma) across 4 difficulty tiers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60 bg-card/70">
              <CardHeader>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Zap className="size-5" />
                </div>
                <CardTitle>Blazing Edge Speed</CardTitle>
                <CardDescription>
                  Powered by Groq Whisper Large v3 and LLaMA 3.3 70B Versatile, delivering sub-second speech transcription and responsive interview dialogue.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 py-8 px-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>InterVibe &copy; 2026. All rights reserved. Built for technical interview prep.</div>
          <div className="flex gap-4">
            <Link href="/dashboard/interview" className="hover:underline">Interview Room</Link>
            <Link href="/dashboard/overview" className="hover:underline">Dashboard</Link>
            <Link href="/dashboard/billing" className="hover:underline">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
