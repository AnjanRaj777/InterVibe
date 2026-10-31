'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ChevronLeft,
  Award,
  Zap
} from 'lucide-react';

const TARGET_ROLES = [
  'Senior Full Stack Developer',
  'Backend & Distributed Systems',
  'Frontend & React Architect',
  'AI / ML & LLM Engineer',
  'System Design Lead'
];

export default function SignUpPage() {
  const router = useRouter();
  const { signup } = useAuthStore();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Full Stack Developer');
  const [seniority, setSeniority] = useState('Senior / Staff (5-8+ yrs)');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null);

  // Compute password strength
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!agreeTerms) {
      toast.error('Please accept the Terms of Service to continue');
      return;
    }

    setLoading(true);
    try {
      await signup(fullName, email, password, targetRole, seniority);
      toast.success('Account created successfully!', {
        description: `Welcome aboard, ${fullName}! Please check your email if confirmation is required.`,
      });
      router.push('/dashboard/interview');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider: 'github' | 'google') => {
    setOauthLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/interview`,
        },
      });
      if (error) throw error;
      // Browser automatically redirects to provider OAuth page
    } catch (err: any) {
      toast.error(`Failed to register with ${provider}: ${err.message || ''}`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090c0a] text-[#e7eceb] relative flex flex-col justify-between selection:bg-[#78fcd6] selection:text-[#090c0a]">
      {/* Background Ambience & Engineering Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-25 bg-[linear-gradient(to_right,#34d399_1px,transparent_1px),linear-gradient(to_bottom,#34d399_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#78fcd6]/15 via-transparent to-transparent blur-[120px] pointer-events-none" />

      {/* TOP NAVIGATION BAR */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-[#0d120f]/80">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 text-black font-mono font-bold text-sm grid place-items-center shadow-sm group-hover:scale-105 transition-transform">
              IV
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">InterVibe</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400">
              BETA
            </span>
          </Link>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/5"
        >
          <ChevronLeft className="size-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* MAIN AUTH CONTAINER */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT: SIGN UP FORM (Cols 1-7) */}
          <div className="lg:col-span-7 bg-[#0d120f]/90 border border-white/15 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            
            {/* Top pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 mb-5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>FREE CANDIDATE ACCOUNT • 3 SESSIONS INCLUDED</span>
            </div>

            <div className="space-y-1.5 mb-6 text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Create your developer account
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 font-mono">
                Start practicing with Meta Muse real-time AI recruiters and get immediate architectural rubrics.
              </p>
            </div>

            {/* FAST 1-CLICK OAUTH SIGN-UP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleOAuthSignUp('github')}
                disabled={oauthLoading !== null}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold font-mono transition-all hover:border-white/30 cursor-pointer disabled:opacity-50"
              >
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>{oauthLoading === 'github' ? 'Redirecting to GitHub...' : 'Sign up with GitHub'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthSignUp('google')}
                disabled={oauthLoading !== null}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold font-mono transition-all hover:border-white/30 cursor-pointer disabled:opacity-50"
              >
                <svg className="size-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.25 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>{oauthLoading === 'google' ? 'Redirecting to Google...' : 'Sign up with Google'}</span>
              </button>
            </div>

            {/* DIVIDER */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0d120f] px-3 text-[10px] font-mono tracking-widest uppercase text-neutral-500 absolute">
                OR REGISTER WITH WORK EMAIL
              </span>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-mono text-neutral-300">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-black/40 border-white/15 focus:border-emerald-500 text-white text-sm h-11 rounded-xl font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-mono text-neutral-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/40 border-white/15 focus:border-emerald-500 text-white text-sm h-11 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              {/* Target Role Selector */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-mono text-neutral-300">
                    Target Role for Mock Interviews
                  </Label>
                  <span className="text-[10px] font-mono text-neutral-500">AI recruiters tailor questions</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TARGET_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        targetRole === role
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-semibold'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seniority Bar Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="seniority" className="text-xs font-mono text-neutral-300">
                  Target Seniority Level
                </Label>
                <select
                  id="seniority"
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 focus:border-emerald-500 text-neutral-200 text-xs h-10 px-3 rounded-xl font-mono outline-hidden cursor-pointer"
                >
                  <option value="Junior Engineer (1-3 yrs)" className="bg-[#121614] text-white">Junior Engineer (1-3 yrs)</option>
                  <option value="Mid-Level Engineer (3-5 yrs)" className="bg-[#121614] text-white">Mid-Level Engineer (3-5 yrs)</option>
                  <option value="Senior / Staff (5-8+ yrs)" className="bg-[#121614] text-white">Senior / Staff (5-8+ yrs)</option>
                  <option value="Principal / Director (10+ yrs)" className="bg-[#121614] text-white">Principal / Director (10+ yrs)</option>
                </select>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-mono text-neutral-300">
                    Create Password
                  </Label>
                  <span className="text-[10px] font-mono text-neutral-500">Min. 8 characters</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/40 border-white/15 focus:border-emerald-500 text-white text-sm h-11 rounded-xl pr-10 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        strength >= step
                          ? strength <= 2
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] font-mono text-neutral-400 ml-1">
                    {strength === 0 ? 'Empty' : strength <= 1 ? 'Weak' : strength <= 3 ? 'Good' : 'Strong'}
                  </span>
                </div>
              </div>

              {/* Agreement */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-emerald-500 focus:ring-emerald-500/20 size-4 mt-0.5 cursor-pointer"
                />
                <label htmlFor="terms" className="text-[11px] font-mono text-neutral-400 leading-tight cursor-pointer">
                  I agree to the <Link href="/" className="text-neutral-300 underline">Terms of Service</Link> and understand that audio sessions are processed privately under Meta AI security standards.
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                <span>{loading ? 'Setting up your interview cockpit...' : 'Create Account & Start Interviewing'}</span>
                <ArrowRight className="size-4" />
              </Button>
            </form>

            {/* FOOTER SWITCHER TO SIGN IN */}
            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <p className="text-xs text-neutral-400 font-mono">
                Already have an InterVibe account?{' '}
                <Link
                  href="/auth/login"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 transition-colors"
                >
                  Sign in here →
                </Link>
              </p>
            </div>
          </div>

          {/* RIGHT: SHOWCASE OF FREE BENEFITS (Cols 8-12) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col gap-4 text-left">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#121815] to-[#090d0b] border border-white/15 shadow-2xl relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  FREE CANDIDATE PLAN
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400">
                  NO CREDIT CARD
                </span>
              </div>

              <h3 className="text-lg font-bold text-white tracking-tight">
                What&apos;s included in your developer account
              </h3>

              {/* Perks list */}
              <div className="space-y-3 text-xs text-neutral-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">3 Full AI Mock Sessions</h4>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      Face Sarah Chen or Emma Watson for comprehensive 15-minute technical rounds.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Full Rubric Scorecards</h4>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      Pinpoint breakdown across Technical Depth, Clarity, and Architecture.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="size-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Real-time Speech Synthesis</h4>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      Direct 16kHz PCM streaming powered by Meta Muse and Deepgram Aura.
                    </p>
                  </div>
                </div>
              </div>

              {/* Social proof pill */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                <span>Active Candidates</span>
                <span className="text-white font-bold">12,400+ engineers</span>
              </div>
            </div>

            {/* Bottom Security Assurance */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] font-mono text-neutral-500">
              <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
              <span>Free forever tier • Upgrade anytime for unlimited loops</span>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-white/5 text-center text-xs text-neutral-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 InterVibe AI Inc. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="hover:text-neutral-400 transition-colors">Sign In</Link>
          <Link href="/dashboard/billing" className="hover:text-neutral-400 transition-colors">Pricing</Link>
          <Link href="/" className="hover:text-neutral-400 transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
