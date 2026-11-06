"use client";

import type React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ArrowRight } from "lucide-react";
import Link from "next/link";

export function Header() {
  const navItems = [
    { name: "Features", href: "#features-section" },
    { name: "Live Demo", href: "#preview-card" },
    { name: "Pricing", href: "#pricing-section" },
    { name: "FAQ", href: "#faq-section" },
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="w-full pt-3 sm:pt-4 md:pt-5 px-3 sm:px-6 z-30">
      <div className="max-w-5xl mx-auto backdrop-blur-2xl bg-neutral-950/80 border border-white/[0.08] rounded-full py-1.5 sm:py-2 px-3 sm:px-4 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]">
        {/* User Official Brand Logo */}
        <Link href="/" className="flex items-center pl-1 sm:pl-2 group">
          <img
            src="/logo-wordmark.png"
            alt="InterVibe"
            className="h-7 sm:h-8 md:h-8.5 w-auto object-contain transition-transform group-hover:scale-[1.02]"
          />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-neutral-300">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleScroll(e, item.href)}
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/[0.08] transition-all duration-200"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="hidden sm:inline-flex text-xs font-medium text-neutral-300 hover:text-white px-3.5 py-1.5 rounded-full hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
          >
            Sign In
          </Link>
          <Link href="/auth/signup">
            <button className="relative group overflow-hidden px-4 sm:px-5 py-2 rounded-full text-xs font-semibold text-neutral-950 bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 shadow-[0_0_20px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,255,255,0.6)] hover:shadow-[0_0_28px_rgba(52,211,153,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center gap-1.5">
              <span>Try for Free</span>
              <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>

          {/* Mobile Sheet Trigger */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="size-8 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full">
                <Menu className="size-4" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="bg-neutral-950/95 border-b border-white/10 text-white backdrop-blur-2xl">
              <SheetHeader>
                <SheetTitle className="text-left text-lg font-semibold text-white flex items-center gap-2">
                  <img
                    src="/logo-wordmark.png"
                    alt="InterVibe"
                    className="h-7 w-auto object-contain"
                  />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-4 font-mono text-sm">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleScroll(e, item.href)}
                    className="text-neutral-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-3 border-t border-white/10 flex flex-col gap-2 mt-2">
                  <Link href="/auth/login" className="w-full">
                    <Button variant="outline" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10 rounded-full text-xs">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="w-full">
                    <Button className="w-full bg-gradient-to-r from-emerald-400 to-teal-300 text-neutral-950 font-semibold rounded-full text-xs shadow-[0_0_18px_rgba(52,211,153,0.35)]">
                      Try for Free →
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
