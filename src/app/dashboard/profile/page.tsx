'use client';

import { useState, useRef, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { useAuthStore } from '@/store/auth-store';
import { useSessionStore } from '@/store/session-store';
import { useThemeConfig } from '@/components/themes/active-theme';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Briefcase, 
  Award, 
  Mic, 
  FileText, 
  Upload, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  Save, 
  Radio, 
  ShieldCheck, 
  Volume2,
  Palette,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { sessions, clearSessions } = useSessionStore();
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const { theme: mode, setTheme: setMode } = useTheme();

  // Candidate Profile State
  const [name, setName] = useState(user?.name || 'Alex Rivera');
  const [email, setEmail] = useState(user?.email || 'alex@intervibe.ai');
  const [targetRole, setTargetRole] = useState('Senior Full Stack Developer');
  const [seniority, setSeniority] = useState('Senior / Staff');
  const [targetCompanies, setTargetCompanies] = useState('Linear, Stripe, Meta, OpenAI');
  const [bio, setBio] = useState('Full Stack Engineer with 6+ years of experience scaling Next.js, Node.js, distributed microservices, and high-throughput real-time voice architectures.');
  
  // Tech Stack Tags
  const [tags, setTags] = useState<string[]>(['Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'WebSockets', 'System Design']);
  const [newTag, setNewTag] = useState('');

  // Audio & Interview Preferences
  const [defaultPersona, setDefaultPersona] = useState('Sarah - Friendly HR');
  const [pushToTalkMode, setPushToTalkMode] = useState('hold-space');

  // Active Resume State
  const [activeResumeName, setActiveResumeName] = useState('Alex_Rivera_Resume_2026.pdf');
  const [charCount, setCharCount] = useState(7840);

  // Microphone Test State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const testStreamRef = useRef<MediaStream | null>(null);
  const testAudioCtxRef = useRef<AudioContext | null>(null);
  const testRafRef = useRef<number | null>(null);

  // Confirmation Modals
  const [showResetModal, setShowResetModal] = useState(false);

  // Add Tech Stack Tag
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Profile Save
  const handleSaveProfile = () => {
    toast.success("Profile preferences saved successfully!");
  };

  // Microphone Volume Tester
  const toggleMicTest = async () => {
    if (isTestingMic) {
      if (testRafRef.current) cancelAnimationFrame(testRafRef.current);
      if (testStreamRef.current) {
        testStreamRef.current.getTracks().forEach(t => t.stop());
        testStreamRef.current = null;
      }
      if (testAudioCtxRef.current && testAudioCtxRef.current.state !== 'closed') {
        testAudioCtxRef.current.close().catch(() => {});
      }
      setIsTestingMic(false);
      setMicAudioLevel(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true } 
      });
      testStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      testAudioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      setIsTestingMic(true);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const loop = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        setMicAudioLevel(Math.min(100, Math.round(avg * 3.2)));
        testRafRef.current = requestAnimationFrame(loop);
      };
      loop();
      toast.success("Microphone active — speak to test input level.");
    } catch (err: any) {
      toast.error("Microphone test error: " + err.message);
    }
  };

  useEffect(() => {
    return () => {
      if (testRafRef.current) cancelAnimationFrame(testRafRef.current);
      if (testStreamRef.current) {
        testStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (testAudioCtxRef.current && testAudioCtxRef.current.state !== 'closed') {
        testAudioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleResetAllData = () => {
    clearSessions();
    setShowResetModal(false);
    toast.success("All mock interview history and diagnostics have been reset.");
  };

  return (
    <PageContainer pageTitle="Candidate Profile & Settings" pageDescription="Manage your professional background, target job criteria, audio hardware, and platform appearance.">
      <div className="space-y-6 max-w-6xl mx-auto pb-12">

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: IDENTITY CARD (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Identity & Status Card */}
            <Card className="rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
              <div className="h-24 bg-gradient-to-r from-emerald-500/10 via-muted to-purple-500/10 border-b border-border dark:border-[#1e1e1e] relative">
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-background/80 border border-border text-[10px] font-mono text-emerald-500 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    PRO MEMBER
                  </span>
                </div>
              </div>

              <CardContent className="pt-0 relative px-6 pb-6">
                <div className="-mt-12 mb-4 flex justify-between items-end">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-card dark:border-[#121212] overflow-hidden bg-muted shadow-xl">
                      <img 
                        src="https://i.pravatar.cc/150?img=32" 
                        alt="Candidate Avatar" 
                        className="h-full w-full object-cover" 
                      />
                    </div>
                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-card dark:border-[#121212]" />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs bg-muted/50 border-border text-foreground hover:bg-muted"
                    onClick={() => toast.info("Avatar update enabled")}
                  >
                    Change Avatar
                  </Button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">{name}</h3>
                  <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    {email}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-border dark:border-[#1e1e1e] space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-mono">Current Status:</span>
                    <span className="text-emerald-500 dark:text-emerald-400 font-medium">Actively Interviewing</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-mono">Target Role:</span>
                    <span className="text-foreground truncate max-w-[170px]">{targetRole}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-mono">Seniority Bar:</span>
                    <span className="text-foreground">{seniority}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-mono">Mock Loops Done:</span>
                    <span className="font-mono text-foreground font-semibold">{sessions.length} sessions</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border dark:border-[#1e1e1e] flex gap-2">
                  <Link href="/dashboard/interview" className="flex-1">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5">
                      <Mic className="size-3.5" /> Start Interview
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="shrink-0 bg-muted/30 border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30"
                    onClick={() => logout()}
                    title="Sign Out"
                  >
                    <LogOut className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Audio Telemetry Summary */}
            <Card className="rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Audio Telemetry</span>
                <span className="text-[11px] font-mono text-emerald-500 dark:text-emerald-400">● 16kHz WAV Mono</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Direct 32-bit float raw PCM capture resampled to 16,000Hz s16le for <strong className="text-foreground">Meta Muse Voice Transcribe 1.0</strong>.
              </p>
              <div className="pt-2 border-t border-border dark:border-[#1e1e1e] flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Engine:</span>
                <span className="text-foreground">Meta Muse Spark 1.3</span>
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN: DETAILED SETTINGS (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* GENERAL SETTINGS: APPEARANCE & DESIGN PRESET (VERCEL & SUPABASE) */}
            <Card className="rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border dark:border-[#1e1e1e] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                    <Palette className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">General Settings: Platform Appearance</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Choose your preferred interface theme preset and display mode.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                
                {/* Theme Presets: Vercel vs Supabase */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground font-mono">Design System Preset</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Vercel Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTheme('vercel');
                        toast.success("Switched to Vercel design preset");
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        activeTheme === 'vercel'
                          ? 'border-primary ring-2 ring-primary/20 bg-muted/40'
                          : 'border-border bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold font-mono text-foreground flex items-center gap-1.5">
                          <span className="size-4 rounded-full bg-black text-white dark:bg-white dark:text-black grid place-items-center text-[10px]">▲</span>
                          Vercel Preset
                        </span>
                        {activeTheme === 'vercel' && (
                          <span className="size-4 rounded-full bg-primary text-primary-foreground grid place-items-center">
                            <Check className="size-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Monochromatic, high-contrast, Geist Mono typography, and clean industrial borders.
                      </p>
                    </button>

                    {/* Supabase Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTheme('supabase');
                        toast.success("Switched to Supabase design preset");
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        activeTheme === 'supabase'
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5'
                          : 'border-border bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold font-mono text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="size-4 rounded-full bg-emerald-500 text-black grid place-items-center text-[10px]">⚡</span>
                          Supabase Preset
                        </span>
                        {activeTheme === 'supabase' && (
                          <span className="size-4 rounded-full bg-emerald-500 text-black grid place-items-center">
                            <Check className="size-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Signature emerald accent glow, deep developer interface, and subtle slate hues.
                      </p>
                    </button>

                  </div>
                </div>

                {/* Color Mode Switcher */}
                <div className="pt-3 border-t border-border dark:border-[#1e1e1e] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Color Mode (Light / Dark)</p>
                    <p className="text-[11px] text-muted-foreground font-mono">Toggle between high-contrast dark and clean light mode</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={mode === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('light')}
                      className="h-8 text-xs font-mono gap-1.5 cursor-pointer"
                    >
                      <Sun className="size-3.5" /> Light
                    </Button>
                    <Button
                      variant={mode === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('dark')}
                      className="h-8 text-xs font-mono gap-1.5 cursor-pointer"
                    >
                      <Moon className="size-3.5" /> Dark
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* 1. CAREER & TARGET ROLE SETTINGS */}
            <Card className="rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border dark:border-[#1e1e1e] pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-muted grid place-items-center text-foreground">
                      <Briefcase className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">Career &amp; Target Role Criteria</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Configures how AI recruiters (Sarah, Michael, Emma) tailor technical questions.
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={handleSaveProfile}
                    className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5"
                  >
                    <Save className="size-3.5" /> Save Changes
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground font-mono">Target Job Title</label>
                    <Input 
                      value={targetRole} 
                      onChange={(e) => setTargetRole(e.target.value)} 
                      className="bg-background border-border text-foreground"
                      placeholder="e.g. Senior Full Stack Developer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground font-mono">Target Seniority Bar</label>
                    <Select value={seniority} onValueChange={setSeniority}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Junior / Mid-Level">Junior / Mid-Level (1-3 yrs)</SelectItem>
                        <SelectItem value="Mid-Level">Mid-Level (3-5 yrs)</SelectItem>
                        <SelectItem value="Senior / Staff">Senior / Staff (5-8+ yrs)</SelectItem>
                        <SelectItem value="Principal / Architect">Principal / Architect (10+ yrs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground font-mono">Target Companies or Bar Level</label>
                  <Input 
                    value={targetCompanies} 
                    onChange={(e) => setTargetCompanies(e.target.value)} 
                    className="bg-background border-border text-foreground"
                    placeholder="e.g. Linear, Stripe, Meta, OpenAI, Anthropic"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground font-mono">Professional Elevator Summary</label>
                  <Textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    className="min-h-[75px] bg-background border-border text-foreground text-xs leading-relaxed"
                    placeholder="Brief overview of your architectural strengths and core impact..."
                  />
                </div>

                {/* Tech Stack Chips */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-foreground font-mono">Primary Technical Competencies</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-mono text-foreground"
                      >
                        {tag}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-500 text-muted-foreground cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <Input 
                        value={newTag} 
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="+ Add skill tag" 
                        className="h-7 w-28 text-xs bg-background border-border"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleAddTag}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. AUDIO HARDWARE & INTERVIEWER PREFERENCES */}
            <Card className="rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border dark:border-[#1e1e1e] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-500 dark:text-emerald-400">
                    <Mic className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">Audio Hardware &amp; Speech Loop</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Test your candidate microphone and customize default voice interaction modes.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                
                {/* Live Mic Volume Tester */}
                <div className="rounded-xl border border-border bg-muted/30 dark:bg-[#171717] dark:border-[#222] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Microphone Input Signal Test</p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Verify your raw audio stream before mock sessions</p>
                    </div>
                    <Button 
                      type="button" 
                      onClick={toggleMicTest}
                      variant={isTestingMic ? "destructive" : "outline"}
                      size="sm" 
                      className={`h-8 text-xs gap-1.5 cursor-pointer ${
                        isTestingMic 
                          ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
                          : 'bg-card border-border hover:bg-muted text-foreground'
                      }`}
                    >
                      <Radio className="size-3.5" />
                      {isTestingMic ? "Stop Mic Test" : "Test Microphone"}
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                      <span>Mic Input Level:</span>
                      <span className={micAudioLevel > 15 ? 'text-emerald-500 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}>
                        {isTestingMic ? `${micAudioLevel}% (Active)` : 'Inactive'}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-75 rounded-full ${
                          micAudioLevel > 65 ? 'bg-red-500' : micAudioLevel > 20 ? 'bg-emerald-500' : 'bg-muted-foreground'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, micAudioLevel))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground font-mono">Default Interviewer Persona</label>
                    <Select value={defaultPersona} onValueChange={setDefaultPersona}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sarah - Friendly HR">Sarah Chen (Friendly HR • Deepgram Asteria)</SelectItem>
                        <SelectItem value="Michael - Strict Engineering Manager">Michael Vance (Strict EM • Deepgram Orion)</SelectItem>
                        <SelectItem value="Emma - British Technical Lead">Emma Watson (Tech Lead • Deepgram Luna)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground font-mono">Push-to-Talk Voice Trigger</label>
                    <Select value={pushToTalkMode} onValueChange={setPushToTalkMode}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hold-space">Hold Space to Speak (Recommended)</SelectItem>
                        <SelectItem value="tap-toggle">Tap to Speak / Tap to Send</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. ACTIVE RESUME CONTEXT */}
            <Card className="rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border dark:border-[#1e1e1e] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-blue-500/10 grid place-items-center text-blue-500 dark:text-blue-400">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">Active Resume Repository</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      The resume currently parsed into the AI interviewer memory context.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/30 dark:bg-[#161616] dark:border-[#222]">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 grid place-items-center">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{activeResumeName}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {charCount.toLocaleString()} characters indexed for AI cross-examination
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/dashboard/interview">
                      <Button variant="outline" size="sm" className="h-8 text-xs bg-card border-border hover:bg-muted text-foreground">
                        <Upload className="size-3.5 mr-1" /> Re-upload
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. DATA & ACCOUNT MANAGEMENT */}
            <Card className="rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border dark:border-[#1e1e1e] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-red-500/10 grid place-items-center text-red-500 dark:text-red-400">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">Account Data &amp; Reset</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Manage stored mock interview sessions and diagnostic history.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-foreground">Reset Mock Interview History</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    Clears all historical transcripts, scores, and diagnosis reports stored in local browser state.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setShowResetModal(true)}
                  className="h-8 text-xs font-semibold gap-1.5 shrink-0"
                >
                  <Trash2 className="size-3.5" /> Reset History
                </Button>
              </CardContent>
            </Card>

          </div>

        </div>

      </div>

      {/* DANGER RESET CONFIRMATION DIALOG */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <AlertTriangle className="size-5" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold">Danger Zone</span>
            </div>
            <DialogTitle className="text-lg font-semibold text-foreground">Clear All Interview History?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This action will permanently delete all {sessions.length} completed mock interview records, scores, and AI diagnostic feedback from your dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-between gap-2 pt-3 border-t border-border">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowResetModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleResetAllData}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
