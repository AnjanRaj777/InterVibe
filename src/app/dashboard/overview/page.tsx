'use client';

import { useState, useMemo } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSessionStore, type InterviewSession } from '@/store/session-store';
import { 
  Mic, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Award, 
  Sparkles, 
  AlertCircle, 
  MessageSquare,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function OverviewPage() {
  const { sessions } = useSessionStore();
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Compute live statistics from stored interview sessions
  const stats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return [
        { title: 'Interviews Completed', value: '0', sub: 'Start your first mock', icon: CheckCircle2, statusColor: 'text-muted-foreground' },
        { title: 'Avg. Verbal Score', value: '--', sub: 'No evaluations yet', icon: Award, statusColor: 'text-muted-foreground' },
        { title: 'Practice Speaking Time', value: '0m', sub: 'Direct PCM capture', icon: Clock, statusColor: 'text-muted-foreground' },
        { title: 'Readiness Index', value: 'Unrated', sub: 'Complete 1 loop to rate', icon: TrendingUp, statusColor: 'text-muted-foreground' },
      ];
    }

    const total = sessions.length;
    const avgScore = Math.round(
      sessions.reduce((acc, s) => acc + (s.analysis?.overallScore || 0), 0) / total
    );
    const totalSecs = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    const totalMinutes = Math.round(totalSecs / 60);

    let readiness = 'Developing';
    let readinessSub = 'Keep practicing fundamentals';
    if (avgScore >= 85) {
      readiness = 'Staff / Lead';
      readinessSub = 'Exceeds target bar';
    } else if (avgScore >= 75) {
      readiness = 'Senior Ready';
      readinessSub = 'Strong production competence';
    } else if (avgScore >= 60) {
      readiness = 'Mid-Level';
      readinessSub = 'Solid base, deepen architecture';
    }

    return [
      { 
        title: 'Interviews Completed', 
        value: total.toString(), 
        sub: `${total} loop${total > 1 ? 's' : ''} evaluated`, 
        icon: CheckCircle2, 
        statusColor: 'text-emerald-500 dark:text-emerald-400' 
      },
      { 
        title: 'Avg. Verbal Score', 
        value: `${avgScore}%`, 
        sub: avgScore >= 75 ? 'Above target hiring bar' : 'Focus on improvement drills', 
        icon: Award, 
        statusColor: avgScore >= 75 ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400' 
      },
      { 
        title: 'Practice Speaking Time', 
        value: totalMinutes >= 60 ? `${(totalMinutes / 60).toFixed(1)} hrs` : `${totalMinutes} min`, 
        sub: '16kHz live verbal delivery', 
        icon: Clock, 
        statusColor: 'text-purple-500 dark:text-purple-400' 
      },
      { 
        title: 'Readiness Index', 
        value: readiness, 
        sub: readinessSub, 
        icon: TrendingUp, 
        statusColor: 'text-blue-500 dark:text-blue-400' 
      },
    ];
  }, [sessions]);

  // Aggregated competencies
  const competencies = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { technical: 0, architecture: 0, clarity: 0, star: 0 };
    }
    const count = sessions.length;
    return {
      technical: Math.round(sessions.reduce((acc, s) => acc + (s.analysis?.technicalDepthScore || 70), 0) / count),
      architecture: Math.round(sessions.reduce((acc, s) => acc + (s.analysis?.architectureScore || 65), 0) / count),
      clarity: Math.round(sessions.reduce((acc, s) => acc + (s.analysis?.clarityScore || 75), 0) / count),
      star: Math.round(sessions.reduce((acc, s) => acc + (s.analysis?.overallScore || 70), 0) / count),
    };
  }, [sessions]);

  const latestSession = sessions && sessions.length > 0 ? sessions[0] : null;

  const handleOpenDetail = (session: InterviewSession) => {
    setSelectedSession(session);
    setShowDetailDialog(true);
  };

  return (
    <PageContainer 
      pageTitle="Interview Performance & AI Analysis" 
      pageDescription="Comprehensive diagnostics powered by Meta Muse Spark 1.3 to understand your verbal delivery, technical depth, and actionable growth plan."
    >
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* BANNER CTA (LIGHT / DARK ADAPTIVE) */}
        <div className="rounded-[20px] border border-border bg-gradient-to-r from-card via-card to-muted/30 dark:border-[#222] dark:from-[#141414] dark:via-[#121212] dark:to-[#171717] p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted border border-border text-[10px] font-mono text-emerald-500 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                META MUSE ACTIVE
              </span>
              <h3 className="text-base md:text-lg font-semibold text-foreground tracking-tight">Ready to practice your next mock loop?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-mono">
              Powered by <strong className="text-foreground">Meta Muse Spark 1.3 Contributor</strong> (LLM), <strong className="text-foreground">Meta Muse Voice Transcribe</strong> (STT), and <strong className="text-foreground">Deepgram Aura Asteria</strong> (TTS).
            </p>
          </div>
          <Link href="/dashboard/interview" className="shrink-0">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs h-10 px-5 gap-2 shadow-sm rounded-full">
              <Mic className="size-4" /> Start Mock Interview
            </Button>
          </Link>
        </div>

        {/* 4 TOP TELEMETRY METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} className="rounded-[18px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">{s.title}</span>
                  <Icon className={`size-4 ${s.statusColor}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-foreground tracking-tight">{s.value}</div>
                  <p className="text-[11px] text-muted-foreground mt-1 font-mono">{s.sub}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* LATEST INTERVIEW DEEP DIVE / DIAGNOSTIC COCKPIT */}
        {latestSession && (
          <div className="rounded-[22px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
            
            {/* Cockpit Header */}
            <div className="px-5 md:px-6 py-4 border-b border-border bg-muted/30 dark:border-[#1e1e1e] dark:bg-[#141414]/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full overflow-hidden border border-border shrink-0 bg-muted">
                  <img 
                    src="/avatars/sarah.webp" 
                    alt="Sarah Chen" 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
                      LATEST SESSION DIAGNOSIS
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      • {new Date(latestSession.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h2 className="text-base md:text-lg font-semibold text-foreground tracking-tight mt-0.5 truncate">
                    {latestSession.jobRole}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className={`px-3 py-1 rounded-full border text-xs font-mono font-bold ${
                  latestSession.analysis.overallScore >= 80 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400'
                    : latestSession.analysis.overallScore >= 60
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400'
                }`}>
                  Overall Score: {latestSession.analysis.overallScore}%
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleOpenDetail(latestSession)}
                  className="h-8 text-xs bg-card border-border hover:bg-muted text-foreground gap-1.5 cursor-pointer rounded-full"
                >
                  <MessageSquare className="size-3.5" /> View Transcript
                </Button>
              </div>
            </div>

            {/* Diagnostic Details */}
            <div className="p-5 md:p-6 space-y-5">
              
              {/* Executive Assessment Quote */}
              <div className="rounded-xl border border-border bg-muted/40 dark:border-[#222] dark:bg-[#161616] p-4 space-y-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  EXECUTIVE EVALUATOR ASSESSMENT
                </span>
                <p className="text-xs text-foreground leading-relaxed italic">
                  &ldquo;{latestSession.analysis.executiveSummary}&rdquo;
                </p>
              </div>

              {/* 3-Column Diagnostic Breakdown */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Strengths */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-mono">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Observed Strengths:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4 leading-relaxed">
                    {latestSession.analysis.strengths.map((str, idx) => (
                      <li key={idx}><span className="text-foreground">{str}</span></li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-mono">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>Areas for Improvement:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4 leading-relaxed">
                    {latestSession.analysis.improvements.map((imp, idx) => (
                      <li key={idx}><span className="text-foreground">{imp}</span></li>
                    ))}
                  </ul>
                </div>

                {/* Action Plan */}
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-2">
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-purple-500 dark:text-purple-400 font-mono">
                    <Sparkles className="size-4 shrink-0" />
                    <span>Recommended Practice Drills:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4 leading-relaxed">
                    {latestSession.analysis.actionPlan.map((act, idx) => (
                      <li key={idx}><span className="text-foreground">{act}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2-COLUMN LOWER STAGE: COMPETENCY PROGRESS & LIVE TELEMETRY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Competency Breakdown (7 cols on lg) */}
          <Card className="lg:col-span-7 rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border dark:border-[#1e1e1e] pb-4">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-emerald-500 dark:text-emerald-400" />
                <CardTitle className="text-sm font-semibold text-foreground">Aggregated Skill Competency Breakdown</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                Real-time scoring aggregated across your completed verbal interviews
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground font-medium">Technical Depth &amp; Code Realism</span>
                  <span className="text-foreground font-bold">{competencies.technical}%</span>
                </div>
                <Progress value={competencies.technical} className="h-1.5" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground font-medium">System Architecture &amp; Scalability Trade-offs</span>
                  <span className="text-foreground font-bold">{competencies.architecture}%</span>
                </div>
                <Progress value={competencies.architecture} className="h-1.5" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground font-medium">Verbal Conciseness &amp; Clarity</span>
                  <span className="text-foreground font-bold">{competencies.clarity}%</span>
                </div>
                <Progress value={competencies.clarity} className="h-1.5" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-foreground font-medium">Overall Role Seniority Bar</span>
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold">{competencies.star}%</span>
                </div>
                <Progress value={competencies.star} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          {/* Voice & Hardware Diagnostics (5 cols on lg) */}
          <Card className="lg:col-span-5 rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border dark:border-[#1e1e1e] pb-4">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-purple-500 dark:text-purple-400" />
                <CardTitle className="text-sm font-semibold text-foreground">Live Voice Pipeline Telemetry</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                Low-latency verbal stack specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-3.5 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-muted-foreground">Audio Capture:</span>
                <span className="text-emerald-500 dark:text-emerald-400 font-bold">16kHz Mono PCM WAV</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-muted-foreground">STT Engine:</span>
                <span className="text-foreground">Meta Muse Voice Transcribe 1.0</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-muted-foreground">Reasoning LLM:</span>
                <span className="text-foreground">Meta Muse Spark 1.3 Contributor</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <span className="text-muted-foreground">Voice Persona:</span>
                <span className="text-foreground">Deepgram Aura Asteria (Sarah)</span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-muted-foreground">Average Turn Latency:</span>
                <span className="text-foreground font-bold">~320ms</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* FULL SESSION HISTORY TABLE */}
        <Card className="rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
          <CardHeader className="border-b border-border dark:border-[#1e1e1e] pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Complete Session History</CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                Log of past verbal mock interview loops and diagnostics
              </CardDescription>
            </div>
            <Link href="/dashboard/interview">
              <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-full">
                New Mock Session
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {sessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-mono">
                No past interview loops recorded. Start your first mock interview to see diagnostics.
              </div>
            ) : (
              <div className="divide-y divide-border overflow-x-auto">
                {sessions.map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">{s.jobRole}</p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                          {s.interviewerVoice.split(' - ')[0]}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • Duration: {Math.round(s.durationSeconds)}s • {s.questionCount} Qs
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold ${
                        s.analysis.overallScore >= 80 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400' 
                          : s.analysis.overallScore >= 60 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400' 
                          : 'bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400'
                      }`}>
                        {s.analysis.overallScore}%
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenDetail(s)}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-muted gap-1 font-mono"
                      >
                        Review <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* TRANSCRIPT & DETAILED REPORT MODAL */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-card border-border text-foreground">
          <DialogHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 mb-1">
              <Award className="size-4" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold">Diagnostic Report</span>
            </div>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {selectedSession?.jobRole} Loop
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-mono">
              Interviewer: {selectedSession?.interviewerVoice} • {selectedSession && new Date(selectedSession.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-xs">
              
              {/* Score Badges */}
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                  <div className="text-xl font-bold text-emerald-500 dark:text-emerald-400">{selectedSession.analysis.overallScore}%</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Overall</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                  <div className="text-xl font-bold text-foreground">{selectedSession.analysis.technicalDepthScore}%</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Tech Depth</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                  <div className="text-xl font-bold text-foreground">{selectedSession.analysis.clarityScore}%</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Clarity</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                  <div className="text-xl font-bold text-foreground">{selectedSession.analysis.architectureScore}%</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Architecture</div>
                </div>
              </div>

              {/* Assessment Quote */}
              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Assessment</p>
                <p className="text-xs text-foreground italic leading-relaxed">
                  &ldquo;{selectedSession.analysis.executiveSummary}&rdquo;
                </p>
              </div>

              {/* Full Dialogue Transcript */}
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  SESSION DIALOGUE TRANSCRIPT ({selectedSession.messages.filter(m => m.role !== 'system').length} turns)
                </p>
                <div className="space-y-2 bg-background border border-border rounded-xl p-3 max-h-[220px] overflow-y-auto font-mono text-xs">
                  {selectedSession.messages.filter(m => m.role !== 'system').map((msg, idx) => (
                    <div key={idx} className="flex gap-2.5 leading-relaxed">
                      <span className={`px-1.5 py-0.2 rounded border h-fit text-[10px] font-bold ${
                        msg.role === 'assistant' 
                          ? 'bg-muted border-border text-foreground' 
                          : 'bg-primary text-primary-foreground border-primary'
                      }`}>
                        {msg.role === 'assistant' ? 'AI' : 'Me'}
                      </span>
                      <p className="text-foreground flex-1">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
