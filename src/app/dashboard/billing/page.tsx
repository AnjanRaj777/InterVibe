'use client';

import PageContainer from '@/components/layout/page-container';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Sparkles, ShieldCheck, CreditCard, Download, Clock, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function BillingPage() {
  const { user, upgradeSubscription, downgradeSubscription } = useAuthStore();
  const isPro = !!user?.hasProSubscription;

  const handleTogglePlan = () => {
    if (isPro) {
      downgradeSubscription();
      toast.info('Switched to Free Starter tier');
    } else {
      upgradeSubscription();
      toast.success('Successfully upgraded to Pro tier! Full verbal interview room unlocked.');
    }
  };

  const proFeatures = [
    'Unlimited Live Verbal AI Interview Loops',
    'Real-time Meta Muse Voice Transcribe 1.0 (16kHz PCM WAV)',
    'Meta Muse Spark 1.3 Contributor LLM Reasoning',
    'Deepgram Aura Asteria Live Voice Synthesis (TTS)',
    'Full Resume Parsing & 10,000 char Memory Context',
    'Access to all 3 Interviewer Personas (Sarah, Michael, Emma)',
    'Technical, Behavioral (STAR), and System Design focus modes',
    'Diagnostic performance report & actionable drills saved to dashboard'
  ];

  const starterFeatures = [
    '1 Mock Interview Session per month',
    'Standard HR Persona Only',
    'Basic Text-only Mode fallback',
    'Standard community support'
  ];

  const mockInvoices = [
    { id: 'INV-2026-004', date: 'Oct 18, 2026', plan: 'Pro Unlimited — Monthly', amount: '$15.00', status: 'Paid' },
    { id: 'INV-2026-003', date: 'Sep 18, 2026', plan: 'Pro Unlimited — Monthly', amount: '$15.00', status: 'Paid' },
    { id: 'INV-2026-002', date: 'Aug 18, 2026', plan: 'Pro Unlimited — Monthly', amount: '$15.00', status: 'Paid' },
  ];

  return (
    <PageContainer pageTitle="Subscription & Credits" pageDescription="Manage your membership plan, active interview credits, and payment invoices.">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        
        {/* ACTIVE CREDITS & USAGE COCKPIT */}
        <div className="rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-500 dark:text-emerald-400">
                  CREDITS COCKPIT
                </span>
                <span className="text-muted-foreground font-mono text-xs">•</span>
                <span className="text-xs font-mono text-muted-foreground">
                  Billing cycle renews on Nov 18, 2026
                </span>
              </div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight mt-0.5">
                Monthly Interview Credits &amp; Audio Quota
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-muted border border-border text-xs font-mono text-emerald-500 dark:text-emerald-400 font-bold">
                {isPro ? 'Pro Member • Active' : 'Starter Free Tier'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-foreground">Session Usage: 3 of 10 used this month</span>
              <span className="text-emerald-500 dark:text-emerald-400 font-bold">70% remaining</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[30%] bg-primary rounded-full transition-all duration-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-3.5 text-muted-foreground" />
              <span>Verbal Audio: <strong className="text-foreground">42 mins transcribed</strong></span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="size-3.5 text-muted-foreground" />
              <span>Diagnostic Reports: <strong className="text-foreground">4 saved</strong></span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="size-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Meta Muse Voice STT: <strong className="text-emerald-500 dark:text-emerald-400">Unlimited</strong></span>
            </div>
          </div>
        </div>

        {/* PRICING TIERS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* STARTER FREE TIER */}
          <Card className={`rounded-[22px] border bg-card dark:bg-[#121212] flex flex-col justify-between shadow-sm overflow-hidden ${
            !isPro ? 'border-primary ring-1 ring-primary/30' : 'border-border dark:border-[#222]'
          }`}>
            <div>
              <CardHeader className="border-b border-border pb-5">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-foreground">Starter Free</CardTitle>
                  {!isPro && (
                    <Badge variant="outline" className="bg-muted border-border text-foreground text-[11px] font-mono">
                      Current Plan
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground font-mono mt-0.5">
                  Basic mock interview trial
                </CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-mono text-foreground">$0</span>
                  <span className="text-xs font-mono text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs pt-5">
                {starterFeatures.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-muted-foreground">
                    <Check className="size-3.5 text-muted-foreground shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </CardContent>
            </div>
            <CardFooter className="pt-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full h-10 text-xs font-mono"
                disabled={!isPro}
                onClick={handleTogglePlan}
              >
                {!isPro ? 'Active Plan' : 'Downgrade to Starter'}
              </Button>
            </CardFooter>
          </Card>

          {/* PRO UNLIMITED TIER */}
          <Card className={`rounded-[22px] border bg-gradient-to-b from-card via-card to-muted/20 dark:from-[#141414] dark:via-[#121212] dark:to-[#161616] flex flex-col justify-between shadow-sm relative overflow-hidden ${
            isPro ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-border dark:border-[#2a2a2a]'
          }`}>
            <div className="absolute top-3.5 right-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-500 dark:text-emerald-400 font-bold">
                <Sparkles className="size-3" /> MOST POPULAR
              </span>
            </div>

            <div>
              <CardHeader className="border-b border-border pb-5">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-1.5">
                    Pro Unlimited
                    <Zap className="size-4 text-amber-500 fill-amber-500" />
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-muted-foreground font-mono mt-0.5">
                  Full verbal interview loops &amp; Meta AI diagnostics
                </CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-mono text-foreground">$15</span>
                  <span className="text-xs font-mono text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs pt-5">
                {proFeatures.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check className="size-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-foreground">{feat}</span>
                  </div>
                ))}
              </CardContent>
            </div>
            <CardFooter className="pt-4 border-t border-border">
              <Button
                className={`w-full h-10 text-xs font-semibold font-mono rounded-xl cursor-pointer ${
                  isPro 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white dark:text-black font-bold' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                onClick={handleTogglePlan}
              >
                {isPro ? 'Active Plan (Click to Downgrade)' : 'Upgrade to Pro Now ($15/mo)'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* PAYMENT METHOD & INVOICES (2 COLUMNS) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left: Payment Method Card (5 cols) */}
          <Card className="md:col-span-5 rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border pb-3.5">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold text-foreground">Payment Method</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="p-4 rounded-xl border border-border bg-muted/30 dark:bg-[#171717] dark:border-[#222] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm tracking-widest font-mono text-foreground">VISA</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30">DEFAULT</span>
                </div>
                <div className="text-sm font-mono text-foreground tracking-wider">
                  •••• •••• •••• 4242
                </div>
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Expires 12/28</span>
                  <span>{user?.name || 'Alex Rivera'}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs font-mono"
                onClick={() => toast.info("Payment processor modal enabled")}
              >
                Update Payment Method
              </Button>
            </CardContent>
          </Card>

          {/* Right: Invoices Table (7 cols) */}
          <Card className="md:col-span-7 rounded-[20px] border border-border bg-card dark:border-[#222] dark:bg-[#121212] overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border pb-3.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Billing History &amp; Receipts</CardTitle>
                <span className="text-[10px] font-mono text-muted-foreground">Automatic monthly billing</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border text-xs font-mono">
                {mockInvoices.map((inv) => (
                  <div key={inv.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-foreground font-medium">{inv.plan}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{inv.id} • {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground font-bold">{inv.amount}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                        {inv.status}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => toast.success(`Receipt for ${inv.id} downloaded.`)}
                        title="Download Receipt"
                      >
                        <Download className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* GUARANTEE & SECURITY BADGE */}
        <div className="rounded-[16px] border border-border bg-muted/20 p-3.5 text-center text-xs text-muted-foreground flex items-center justify-center gap-2 font-mono">
          <ShieldCheck className="size-4 text-emerald-500 dark:text-emerald-400" />
          <span>Mock payment processor enabled. You can upgrade or downgrade freely with 1-click anytime.</span>
        </div>

      </div>
    </PageContainer>
  );
}
