'use client';

import { HeroSection } from "@/components/landing/hero-section";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { SocialProof } from "@/components/landing/social-proof";
import { BentoSection } from "@/components/landing/bento-section";
import { LargeTestimonial } from "@/components/landing/large-testimonial";
import { PricingSection } from "@/components/landing/pricing-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { ZoomSection } from "@/components/landing/zoom-section";
import { DemoCardEntrance } from "@/components/landing/demo-card-entrance";

export default function LandingPage() {
  return (
    <div 
      id="top"
      className="min-h-screen bg-[#0f1211] text-[#e7eceb] relative overflow-hidden pb-0 font-sans selection:bg-[#78fcd6] selection:text-[#0d0f0e]"
      style={{
        ['--background' as any]: '210 11% 7%',
        ['--foreground' as any]: '160 14% 93%',
        ['--primary' as any]: '165 96% 71%',
        ['--primary-foreground' as any]: '160 8% 6%',
        ['--primary-dark' as any]: '160 100% 50%',
        ['--primary-light' as any]: '160 48% 87%',
        ['--secondary' as any]: '160 14% 93%',
        ['--secondary-foreground' as any]: '165 14% 8%',
        ['--muted' as any]: '240 2% 16%',
        ['--muted-foreground' as any]: '160 14% 75%',
        ['--accent' as any]: '240 2% 25%',
        ['--accent-foreground' as any]: '240 2% 96%',
        ['--border' as any]: '240 100% 100% / 0.08',
      }}
    >
      <div className="relative z-10">
        <main className="max-w-[1320px] mx-auto relative">
          <HeroSection />
          {/* Dashboard Preview Wrapper with Recreated InterVibe Interview Room */}
          <div id="preview-card" className="absolute bottom-[-460px] sm:bottom-[-520px] md:bottom-[-600px] lg:bottom-[-620px] left-1/2 transform -translate-x-1/2 z-30">
            <DemoCardEntrance>
              <DashboardPreview />
            </DemoCardEntrance>
          </div>
        </main>

        <ZoomSection id="meta-ai-models-section" className="relative z-10 max-w-[1320px] mx-auto px-6 mt-[540px] sm:mt-[600px] md:mt-[680px] lg:mt-[700px]">
          <SocialProof />
        </ZoomSection>

        <ZoomSection id="features-section" className="relative z-10 max-w-[1320px] mx-auto mt-16">
          <BentoSection />
        </ZoomSection>

        <ZoomSection className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16">
          <LargeTestimonial />
        </ZoomSection>

        <ZoomSection
          id="pricing-section"
          className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16"
        >
          <PricingSection />
        </ZoomSection>

        <ZoomSection id="faq-section" className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16">
          <FAQSection />
        </ZoomSection>

        <ZoomSection settle className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16">
          <CTASection />
        </ZoomSection>

        <ZoomSection settle className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16">
          <FooterSection />
        </ZoomSection>
      </div>

      {/* Faint screen vignette – darkens edges to draw the eye to the center card */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]"
      />
    </div>
  );
}
