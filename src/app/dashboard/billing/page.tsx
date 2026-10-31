'use client';

import React, { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { useAuthStore } from '@/store/auth-store';
import { Check, Zap, ArrowUpRight, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type PlanTier = 'free' | 'hustler' | 'pro' | 'teams';
type BillingCycle = 'monthly' | 'annual';

export default function BillingPage() {
  const { user, upgradeSubscription, downgradeSubscription } = useAuthStore();
  const [activePlan, setActivePlan] = useState<PlanTier>(
    user?.hasProSubscription ? 'free' : 'free'
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);

  const mockInvoices = [
    { id: 'INV-2026-004', date: 'Oct 18, 2026', plan: 'Pro — Monthly', amount: '₹1,499.00', status: 'Paid' },
    { id: 'INV-2026-003', date: 'Sep 18, 2026', plan: 'Pro — Monthly', amount: '₹1,499.00', status: 'Paid' },
    { id: 'INV-2026-002', date: 'Aug 18, 2026', plan: 'Hustler — Monthly', amount: '₹499.00', status: 'Paid' },
  ];

  const handlePlanSelect = (tier: PlanTier) => {
    setActivePlan(tier);
    if (tier === 'pro') {
      upgradeSubscription();
      toast.success('Successfully upgraded to Pro tier! Full verbal loops unlocked.');
    } else if (tier === 'hustler') {
      upgradeSubscription();
      toast.success('Switched to Hustler tier!');
    } else if (tier === 'teams') {
      toast.info('Teams request received. Our enterprise team will contact you.');
    } else {
      downgradeSubscription();
      toast.info('Switched to Free starter tier.');
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Invoice ID,Date,Plan,Amount,Status\n' +
      mockInvoices.map((inv) => `${inv.id},${inv.date},"${inv.plan}",${inv.amount},${inv.status}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `intervibe_billing_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Billing & usage CSV downloaded successfully');
  };

  // Dynamic values depending on activePlan
  const usageStats = {
    free: {
      title: 'Free Plan',
      usageLine: '2/3 interviews used • 18/30 mins',
      interviewsPct: 66,
      interviewsSub: '2 of 3 used',
      minutesPct: 60,
      minutesSub: '18 of 30 mins',
      nextInvoice: 'You are on Free. No payment due. Upgrade anytime to unlock minutes and templates.',
      resetText: 'Resets Mar 15, 2026.',
    },
    hustler: {
      title: 'Hustler Plan',
      usageLine: '6/20 interviews used • 72/300 mins',
      interviewsPct: 30,
      interviewsSub: '6 of 20 used',
      minutesPct: 24,
      minutesSub: '72 of 300 mins',
      nextInvoice: 'Next invoice due on Mar 15, 2026. Charged to default payment method.',
      resetText: 'Resets Mar 15, 2026.',
    },
    pro: {
      title: 'Pro Plan',
      usageLine: '18/100 interviews used • 216/1200 mins',
      interviewsPct: 18,
      interviewsSub: '18 of 100 used',
      minutesPct: 18,
      minutesSub: '216 of 1200 mins',
      nextInvoice: 'Next invoice due on Mar 15, 2026 for ₹1,499. Unlimited voice AI loops active.',
      resetText: 'Resets Mar 15, 2026.',
    },
    teams: {
      title: 'Teams Plan',
      usageLine: '42/500 interviews used • 480/5000 mins',
      interviewsPct: 8,
      interviewsSub: '42 of 500 used',
      minutesPct: 9,
      minutesSub: '480 of 5000 mins',
      nextInvoice: 'Next enterprise cycle on Mar 15, 2026 for ₹4,999/seat.',
      resetText: 'Resets Mar 15, 2026.',
    },
  }[activePlan];

  return (
    <PageContainer
      pageTitle="Billing & Plans"
      pageDescription="Manage your usage, invoices, and upgrade when you need more interviews. All plans include brutalist square edges."
      pageHeaderAction={
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:inline">
            BILLING CYCLE
          </span>
          <div className="inline-flex border border-neutral-800 bg-[#121212] p-0.5 rounded-none">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1 font-mono text-xs transition-colors rounded-none ${
                billingCycle === 'monthly'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1 font-mono text-xs transition-colors rounded-none flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className={`text-[10px] px-1 py-0.2 border ${
                billingCycle === 'annual'
                  ? 'bg-black text-white border-black'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700'
              }`}>
                -30%
              </span>
            </button>
          </div>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-foreground">
        
        {/* INTERVIEW CREDITS & USAGE COCKPIT */}
        <div className="border border-neutral-800 bg-[#0d0d0d] p-5 md:p-6 rounded-none shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 border border-neutral-700 bg-neutral-900 flex items-center justify-center text-white shrink-0 rounded-none">
                <Zap className="size-3.5 fill-white text-white" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold text-white tracking-tight">{usageStats.title}</span>
                <span className="text-neutral-500 font-mono">-</span>
                <span className="text-neutral-300 font-mono text-xs">{usageStats.usageLine}</span>
              </div>
            </div>
            <span className="border border-neutral-700 bg-neutral-900/60 text-[10px] font-mono text-neutral-400 px-2.5 py-0.5 rounded-none tracking-widest uppercase">
              ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1">
            {/* Usage Bars (7 cols) */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Interviews bar */}
              <div>
                <div className="flex justify-between text-[11px] font-mono tracking-wider">
                  <span className="text-neutral-400 uppercase">INTERVIEWS</span>
                  <span className="text-white font-bold">{usageStats.interviewsPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-none overflow-hidden my-2">
                  <div
                    className="h-full bg-white rounded-none transition-all duration-300"
                    style={{ width: `${usageStats.interviewsPct}%` }}
                  />
                </div>
                <p className="text-[11px] font-mono text-neutral-400">{usageStats.interviewsSub}</p>
              </div>

              {/* Minutes bar */}
              <div>
                <div className="flex justify-between text-[11px] font-mono tracking-wider">
                  <span className="text-neutral-400 uppercase">MINUTES</span>
                  <span className="text-white font-bold">{usageStats.minutesPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-none overflow-hidden my-2">
                  <div
                    className="h-full bg-white rounded-none transition-all duration-300"
                    style={{ width: `${usageStats.minutesPct}%` }}
                  />
                </div>
                <p className="text-[11px] font-mono text-neutral-400">{usageStats.minutesSub}</p>
              </div>
            </div>

            {/* Next Invoice and Actions (5 cols) */}
            <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
                  NEXT INVOICE
                </span>
                <p className="text-xs text-neutral-300 font-sans mt-1 leading-relaxed">
                  {usageStats.nextInvoice}
                </p>
                <p className="text-xs font-mono text-neutral-400 mt-1">
                  {usageStats.resetText}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvoicesModal(true)}
                  className="bg-white hover:bg-neutral-200 text-black text-xs font-mono px-3.5 py-1.5 font-medium rounded-none flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span>View Invoices</span>
                  <ArrowUpRight className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="border border-neutral-700 hover:bg-neutral-800 hover:text-white text-neutral-400 text-xs font-mono px-3.5 py-1.5 rounded-none transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="size-3" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PLANS SECTION HEADER */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-bold font-mono tracking-widest uppercase text-white">
            PLANS
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500">
            4 OPTIONS • SQUARE • NO RADIUS
          </span>
        </div>

        {/* 4 PLANS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          
          {/* PLAN 1: FREE */}
          <div className={`border bg-[#0d0d0d] rounded-none p-5 flex flex-col justify-between transition-colors ${
            activePlan === 'free' ? 'border-neutral-700 ring-1 ring-neutral-700' : 'border-neutral-800'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Free</h3>
                <span className="border border-neutral-800 text-[9px] font-mono text-neutral-400 px-1.5 py-0.5 rounded-none uppercase">
                  FREE
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-white tracking-tight">₹0</span>
                <span className="text-xs font-mono text-neutral-400">/mo</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">For trying out InterVibe</p>
              <p className="text-[11px] text-neutral-500 mt-2 mb-4">No card required</p>

              <button
                type="button"
                onClick={() => handlePlanSelect('free')}
                disabled={activePlan === 'free'}
                className={`w-full text-xs font-mono py-2 rounded-none transition-colors ${
                  activePlan === 'free'
                    ? 'border border-neutral-800 bg-neutral-900/50 text-neutral-400 cursor-default'
                    : 'border border-neutral-700 hover:bg-neutral-800 text-white cursor-pointer'
                }`}
              >
                {activePlan === 'free' ? 'Current Plan' : 'Select Free'}
              </button>

              <div className="border-t border-neutral-800 my-4" />

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-3 font-semibold">
                  INCLUDES
                </span>
                <div className="space-y-2.5 text-xs text-neutral-300 font-sans">
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>3 interviews / month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>30 mins total</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>Basic AI feedback</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>1 interview template</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>Community support</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-3 mt-6 flex items-center justify-between text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
              <span>SQUARE EDGE • NO RADIUS</span>
              <span>B2C</span>
            </div>
          </div>

          {/* PLAN 2: HUSTLER */}
          <div className={`border bg-[#0d0d0d] rounded-none p-5 flex flex-col justify-between transition-colors ${
            activePlan === 'hustler' ? 'border-neutral-600 ring-1 ring-neutral-600' : 'border-neutral-800'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Hustler</h3>
                <span className="border border-neutral-800 text-[9px] font-mono text-neutral-400 px-1.5 py-0.5 rounded-none uppercase">
                  HUSTLER
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-white tracking-tight">
                  {billingCycle === 'annual' ? '₹349' : '₹499'}
                </span>
                <span className="text-xs font-mono text-neutral-400">/mo</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">For active job seekers</p>
              <p className="text-[11px] text-neutral-500 mt-2 mb-4">
                {billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly'}
              </p>

              <button
                type="button"
                onClick={() => handlePlanSelect('hustler')}
                className={`w-full border text-xs font-mono py-2 rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePlan === 'hustler'
                    ? 'border-neutral-800 bg-neutral-900/50 text-neutral-400'
                    : 'border-neutral-600 hover:bg-neutral-800 hover:border-neutral-500 text-white'
                }`}
              >
                <span>{activePlan === 'hustler' ? 'Current Plan' : 'Upgrade to Hustler'}</span>
                {activePlan !== 'hustler' && <ArrowUpRight className="size-3.5" />}
              </button>

              <div className="border-t border-neutral-800 my-4" />

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-3 font-semibold">
                  INCLUDES
                </span>
                <div className="space-y-2.5 text-xs text-neutral-300 font-sans">
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>20 interviews / month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>300 mins total</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>Advanced AI feedback</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>10 templates + custom</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>Resume analysis</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>Email support</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-3 mt-6 flex items-center justify-between text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
              <span>SQUARE EDGE • NO RADIUS</span>
              <span>B2C</span>
            </div>
          </div>

          {/* PLAN 3: PRO (MOST POPULAR - FEATURED WHITE BORDER) */}
          <div className="border-2 border-white bg-[#0d0d0d] rounded-none flex flex-col justify-between relative shadow-2xl">
            {/* Top Badge Strip */}
            <div className="bg-white text-black font-mono text-[10px] font-bold uppercase tracking-widest text-center py-1 rounded-none">
              MOST POPULAR • POPULAR
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Pro</h3>
                  <span className="border border-neutral-600 text-[9px] font-mono text-white px-1.5 py-0.5 rounded-none uppercase">
                    PRO
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-mono text-white tracking-tight">
                    {billingCycle === 'annual' ? '₹1049' : '₹1499'}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">/mo</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">For serious interview prep</p>
                <p className="text-[11px] text-neutral-500 mt-2 mb-4">Everything in Hustler +</p>

                <button
                  type="button"
                  onClick={() => handlePlanSelect('pro')}
                  className="w-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs font-mono py-2 rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>{activePlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}</span>
                  {activePlan !== 'pro' && <ArrowUpRight className="size-3.5" />}
                </button>

                <div className="border-t border-neutral-800 my-4" />

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-3 font-semibold">
                    INCLUDES
                  </span>
                  <div className="space-y-2.5 text-xs text-neutral-200 font-sans">
                    <div className="flex items-start gap-2">
                      <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                      <span>100 interviews / month</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                      <span>1200 mins total</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                      <span>Deep performance analytics</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                      <span>Unlimited templates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                      <span>Voice cloning + behavior map</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                      <span>Priority support + Slack</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                      <span>Export to PDF / Notion</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-3 mt-6 flex items-center justify-between text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
                <span>SQUARE EDGE • NO RADIUS</span>
                <span>B2C</span>
              </div>
            </div>
          </div>

          {/* PLAN 4: TEAMS */}
          <div className={`border bg-[#0d0d0d] rounded-none p-5 flex flex-col justify-between transition-colors ${
            activePlan === 'teams' ? 'border-neutral-600 ring-1 ring-neutral-600' : 'border-neutral-800'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Teams</h3>
                <span className="border border-neutral-800 text-[9px] font-mono text-neutral-400 px-1.5 py-0.5 rounded-none uppercase">
                  TEAMS
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-white tracking-tight">
                  {billingCycle === 'annual' ? '₹3499' : '₹4999'}
                </span>
                <span className="text-xs font-mono text-neutral-400">/mo</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">For coaches &amp; orgs</p>
              <p className="text-[11px] text-neutral-500 mt-2 mb-4">Per seat / month</p>

              <button
                type="button"
                onClick={() => handlePlanSelect('teams')}
                className={`w-full border text-xs font-mono py-2 rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePlan === 'teams'
                    ? 'border-neutral-800 bg-neutral-900/50 text-neutral-400'
                    : 'border-neutral-600 hover:bg-neutral-800 hover:border-neutral-500 text-white'
                }`}
              >
                <span>Talk to Sales</span>
                <ArrowUpRight className="size-3.5" />
              </button>

              <div className="border-t border-neutral-800 my-4" />

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-3 font-semibold">
                  INCLUDES
                </span>
                <div className="space-y-2.5 text-xs text-neutral-300 font-sans">
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>500 interviews / month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>5000 mins pooled</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>Team dashboard + SSO</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>Custom AI interviewer</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>API access + webhooks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>Dedicated success manager</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="size-3.5 text-white shrink-0 mt-0.5" />
                    <span>Onboarding + training</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-3 mt-6 flex items-center justify-between text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
              <span>SQUARE EDGE • NO RADIUS</span>
              <span>B2B</span>
            </div>
          </div>
        </div>

        {/* PAYMENT BADGES & DISCLAIMER BAR */}
        <div className="border border-neutral-800 bg-[#0d0d0d] p-4 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs font-mono rounded-none">
          <div className="flex flex-wrap items-center gap-2.5 text-neutral-300">
            <span className="border border-neutral-700 bg-neutral-900 text-neutral-300 px-2 py-0.5 text-[11px] font-mono rounded-none">
              Razorpay
            </span>
            <span className="border border-neutral-700 bg-neutral-900 text-neutral-300 px-2 py-0.5 text-[11px] font-mono rounded-none">
              Stripe
            </span>
            <span className="text-neutral-400">
              • UPI, Cards, NetBanking • GST invoices • Cancel anytime
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 font-mono text-left lg:text-right max-w-xl leading-relaxed">
            Prices in INR. Annual saves 30%. All transactions square-edged, brutalist, minimal. No hidden rounding. Border-radius: 0 enforced.
          </div>
        </div>

        {/* BOTTOM FAQ 3 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 border border-neutral-800 bg-[#0d0d0d] divide-y md:divide-y-0 md:divide-x divide-neutral-800 rounded-none">
          <div className="p-5 space-y-1">
            <h4 className="text-xs font-bold text-white font-mono">
              What happens after limit?
            </h4>
            <p className="text-xs text-neutral-400 font-mono leading-relaxed">
              Interviews pause. Upgrade to continue. History stays.
            </p>
          </div>
          <div className="p-5 space-y-1">
            <h4 className="text-xs font-bold text-white font-mono">
              Can I switch monthly/annual?
            </h4>
            <p className="text-xs text-neutral-400 font-mono leading-relaxed">
              Yes. Toggle above. Prorated credit applied automatically.
            </p>
          </div>
          <div className="p-5 space-y-1">
            <h4 className="text-xs font-bold text-white font-mono">
              Teams billing?
            </h4>
            <p className="text-xs text-neutral-400 font-mono leading-relaxed">
              Per seat. Pool minutes. Admin can reallocate. SSO included.
            </p>
          </div>
        </div>

      </div>

      {/* VIEW INVOICES MODAL */}
      <Dialog open={showInvoicesModal} onOpenChange={setShowInvoicesModal}>
        <DialogContent className="border border-neutral-800 bg-[#0f0f0f] text-foreground rounded-none max-w-lg p-6">
          <DialogHeader className="border-b border-neutral-800 pb-3">
            <DialogTitle className="text-base font-mono font-bold text-white flex items-center gap-2">
              <FileText className="size-4 text-white" />
              <span>Billing Invoices &amp; Receipts</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-neutral-400">
              Download GST tax receipts and review automatic billing history.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-neutral-800 text-xs font-mono py-2">
            {mockInvoices.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-medium">{inv.plan}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {inv.id} • {inv.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">{inv.amount}</span>
                  <span className="text-[10px] px-1.5 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 rounded-none font-bold">
                    {inv.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => toast.success(`Receipt for ${inv.id} downloaded.`)}
                    className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Download Receipt"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-800 flex justify-end">
            <button
              type="button"
              onClick={() => setShowInvoicesModal(false)}
              className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs rounded-none transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
