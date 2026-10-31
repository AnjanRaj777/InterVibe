"use client"

import { useState } from "react"
import { Check, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"

type PlanTier = "free" | "hustler" | "pro" | "teams"
type BillingCycle = "monthly" | "annual"

export function PricingSection() {
  const { user } = useAuthStore()
  const [activePlan] = useState<PlanTier>("free")
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")

  return (
    <section className="w-full px-5 overflow-hidden flex flex-col justify-start items-center my-0 py-8 md:py-14 font-sans text-foreground">
      {/* SECTION HEADER */}
      <div className="self-stretch relative flex flex-col justify-center items-center gap-3 py-0">
        <div className="flex flex-col justify-start items-center gap-3">
          <h2 className="text-center text-foreground text-4xl md:text-5xl font-semibold leading-tight md:leading-[40px]">
            Pricing built for every interview journey
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-tight max-w-2xl">
            Choose a plan that fits your interview preparation, from individuals starting out to growing professionals and organizations.
          </p>
        </div>

        {/* BILLING CYCLE TOGGLE */}
        <div className="pt-4 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 hidden sm:inline">
            BILLING CYCLE
          </span>
          <div className="inline-flex border border-neutral-800 bg-[#121212] p-0.5 rounded-none">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1 font-mono text-xs transition-colors rounded-none cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`px-3 py-1 font-mono text-xs transition-colors rounded-none flex items-center gap-1.5 cursor-pointer ${
                billingCycle === "annual"
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>Annual</span>
              <span
                className={`text-[10px] px-1 py-0.2 border ${
                  billingCycle === "annual"
                    ? "bg-black text-white border-black"
                    : "bg-neutral-800 text-neutral-300 border-neutral-700"
                }`}
              >
                -30%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* PLANS WRAPPER */}
      <div className="w-full max-w-6xl mx-auto space-y-4 mt-8">
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
          <div
            className={`border bg-[#0d0d0d] rounded-none p-5 flex flex-col justify-between transition-colors ${
              activePlan === "free" ? "border-neutral-700 ring-1 ring-neutral-700" : "border-neutral-800"
            }`}
          >
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

              <Link href="/dashboard/billing" className="w-full block">
                <button
                  type="button"
                  className="w-full text-xs font-mono py-2 rounded-none transition-colors border border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700 hover:text-white cursor-pointer"
                >
                  Current Plan
                </button>
              </Link>

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
          <div
            className={`border bg-[#0d0d0d] rounded-none p-5 flex flex-col justify-between transition-colors ${
              activePlan === "hustler" ? "border-neutral-600 ring-1 ring-neutral-600" : "border-neutral-800 hover:border-neutral-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Hustler</h3>
                <span className="border border-neutral-800 text-[9px] font-mono text-neutral-400 px-1.5 py-0.5 rounded-none uppercase">
                  HUSTLER
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-white tracking-tight">
                  {billingCycle === "annual" ? "₹349" : "₹499"}
                </span>
                <span className="text-xs font-mono text-neutral-400">/mo</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">For active job seekers</p>
              <p className="text-[11px] text-neutral-500 mt-2 mb-4">
                {billingCycle === "annual" ? "Billed annually" : "Billed monthly"}
              </p>

              <Link href="/dashboard/billing" className="w-full block">
                <button
                  type="button"
                  className="w-full border border-neutral-600 hover:bg-neutral-800 hover:border-neutral-500 text-white text-xs font-mono py-2 rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Upgrade to Hustler</span>
                  <ArrowUpRight className="size-3.5" />
                </button>
              </Link>

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

          {/* PLAN 3: PRO (FEATURED WHITE BORDER) */}
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
                    {billingCycle === "annual" ? "₹1049" : "₹1499"}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">/mo</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">For serious interview prep</p>
                <p className="text-[11px] text-neutral-500 mt-2 mb-4">Everything in Hustler +</p>

                <Link href="/dashboard/billing" className="w-full block">
                  <button
                    type="button"
                    className="w-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs font-mono py-2 rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Upgrade to Pro</span>
                    <ArrowUpRight className="size-3.5" />
                  </button>
                </Link>

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
          <div
            className={`border bg-[#0d0d0d] rounded-none p-5 flex flex-col justify-between transition-colors ${
              activePlan === "teams" ? "border-neutral-600 ring-1 ring-neutral-600" : "border-neutral-800 hover:border-neutral-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Teams</h3>
                <span className="border border-neutral-800 text-[9px] font-mono text-neutral-400 px-1.5 py-0.5 rounded-none uppercase">
                  TEAMS
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono text-white tracking-tight">
                  {billingCycle === "annual" ? "₹3499" : "₹4999"}
                </span>
                <span className="text-xs font-mono text-neutral-400">/mo</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">For coaches & orgs</p>
              <p className="text-[11px] text-neutral-500 mt-2 mb-4">Per seat / month</p>

              <Link href="/dashboard/billing" className="w-full block">
                <button
                  type="button"
                  className="w-full border border-neutral-600 hover:bg-neutral-800 hover:border-neutral-500 text-white text-xs font-mono py-2 rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Talk to Sales</span>
                  <ArrowUpRight className="size-3.5" />
                </button>
              </Link>

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
      </div>
    </section>
  )
}
