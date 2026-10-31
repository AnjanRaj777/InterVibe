'use client';

import { HeroSection } from "@/components/landing/hero-section";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { SocialProof } from "@/components/landing/social-proof";
import { BentoSection } from "@/components/landing/bento-section";
import { LargeTestimonial } from "@/components/landing/large-testimonial";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialGridSection } from "@/components/landing/testimonial-grid-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { AnimatedSection } from "@/components/landing/animated-section";

export default function LandingPage() {
  return (
    <div 
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
          <div className="absolute bottom-[-460px] sm:bottom-[-520px] md:bottom-[-600px] lg:bottom-[-620px] left-1/2 transform -translate-x-1/2 z-30">
            <AnimatedSection>
              <DashboardPreview />
            </AnimatedSection>
          </div>
        </main>

        <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto px-6 mt-[540px] sm:mt-[600px] md:mt-[680px] lg:mt-[700px]" delay={0.1}>
          <SocialProof />
        </AnimatedSection>

        <AnimatedSection id="features-section" className="relative z-10 max-w-[1320px] mx-auto mt-16" delay={0.2}>
          <BentoSection />
        </AnimatedSection>

        <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16" delay={0.2}>
          <LargeTestimonial />
        </AnimatedSection>

        <AnimatedSection
          id="pricing-section"
          className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16"
          delay={0.2}
        >
          <PricingSection />
        </AnimatedSection>

        <AnimatedSection
          id="testimonials-section"
          className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16"
          delay={0.2}
        >
          <TestimonialGridSection />
        </AnimatedSection>

        <AnimatedSection id="faq-section" className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16" delay={0.2}>
          <FAQSection />
        </AnimatedSection>

        <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16" delay={0.2}>
          <CTASection />
        </AnimatedSection>

        <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto mt-8 md:mt-16" delay={0.2}>
          <FooterSection />
        </AnimatedSection>
      </div>
    </div>
  );
}
