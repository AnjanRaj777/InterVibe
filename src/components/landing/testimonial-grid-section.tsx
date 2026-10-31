import Image from "next/image"

const testimonials = [
  {
    quote:
      "Practicing with Michael Vance felt identical to my actual Stripe Staff interview. His cross-examination on distributed queue failovers and backpressure caught gaps I never realized I had.",
    name: "Annette Black",
    company: "Staff Engineer Candidate",
    avatar: "/images/avatars/annette-black.png",
    type: "large-teal",
  },
  {
    quote:
      "The Push-to-Talk format is genius. Holding Spacebar allowed me to pause and organize my thoughts without awkward bot cutoffs.",
    name: "Dianne Russell",
    company: "Distributed Systems Lead",
    avatar: "/images/avatars/dianne-russell.png",
    type: "small-dark",
  },
  {
    quote:
      "The targeted micro-drill loop moved the needle for me. Instead of repeating 45-minute interviews, I drilled my exact weak spots in 3-minute sprints.",
    name: "Cameron Williamson",
    company: "Infrastructure Engineer",
    avatar: "/images/avatars/cameron-williamson.png",
    type: "small-dark",
  },
  {
    quote:
      "The resume parsing extracted my exact Redis and Kafka architecture from my CV and grilled me on real trade-offs.",
    name: "Robert Fox",
    company: "Senior Backend Eng",
    avatar: "/images/avatars/robert-fox.png",
    type: "small-dark",
  },
  {
    quote:
      "The diagnostic breakdown gave me more actionable feedback in 10 seconds than 3 rounds of peer mocks. The STAR structure advice was spot on.",
    name: "Darlene Robertson",
    company: "Engineering Manager",
    avatar: "/images/avatars/darlene-robertson.png",
    type: "small-dark",
  },
  {
    quote:
      "Sarah Chen’s behavioral persona helped me nail leadership and conflict resolution questions. The voice latency is practically instant.",
    name: "Cody Fisher",
    company: "Full Stack Engineer",
    avatar: "/images/avatars/cody-fisher.png",
    type: "small-dark",
  },
  {
    quote:
      "From Mid-Level to Staff ready in three weeks. The readiness telemetry index gave me the objective confidence I needed before stepping into my Meta onsite loops.",
    name: "Albert Flores",
    company: "Principal Systems Architect",
    avatar: "/images/avatars/albert-flores.png",
    type: "large-light",
  },
]

interface TestimonialCardProps {
  quote: string
  name: string
  company: string
  avatar: string
  type: string
}

const TestimonialCard = ({ quote, name, company, avatar, type }: TestimonialCardProps) => {
  const isLarge = type.startsWith("large")
  const isTeal = type === "large-teal"
  const isLight = type === "large-light"

  let cardClasses = "w-full rounded-[20px] p-6 flex flex-col justify-between transition-all duration-300 "

  if (isTeal) {
    cardClasses += "bg-primary text-primary-foreground"
  } else if (isLight) {
    cardClasses += "bg-secondary text-secondary-foreground"
  } else {
    cardClasses +=
      "bg-card/40 text-card-foreground border border-border backdrop-blur-sm"
  }

  if (isLarge) {
    cardClasses += " min-h-[320px]"
  } else {
    cardClasses += " min-h-[190px]"
  }

  const quoteClasses = isTeal
    ? "text-primary-foreground text-sm md:text-base font-normal leading-relaxed"
    : isLight
      ? "text-secondary-foreground text-sm md:text-base font-normal leading-relaxed"
      : "text-muted-foreground text-sm font-normal leading-relaxed"

  const nameClasses = isTeal
    ? "text-primary-foreground text-sm font-semibold"
    : isLight
      ? "text-secondary-foreground text-sm font-semibold"
      : "text-foreground text-sm font-semibold"

  const companyClasses = isTeal
    ? "text-primary-foreground/70 text-xs font-mono"
    : isLight
      ? "text-secondary-foreground/70 text-xs font-mono"
      : "text-muted-foreground text-xs font-mono"

  return (
    <div className={cardClasses}>
      <p className={quoteClasses}>&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
        <Image
          src={avatar}
          alt={name}
          width={40}
          height={40}
          className="rounded-full border border-white/10"
        />
        <div>
          <div className={nameClasses}>{name}</div>
          <div className={companyClasses}>{company}</div>
        </div>
      </div>
    </div>
  )
}

export function TestimonialGridSection() {
  return (
    <section className="w-full px-5 overflow-hidden flex flex-col justify-start py-6 md:py-8 lg:py-14">
      <div className="self-stretch py-6 md:py-8 lg:py-14 flex flex-col justify-center items-center gap-2">
        <div className="flex flex-col justify-start items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-medium">
            REAL INTERVIEW OUTCOMES
          </div>
          <h2 className="text-center text-foreground text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight">
            Trusted by Engineers Landing Top Offers
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto">
            Hear how candidates sharpen their verbal delivery, deepen their system architecture trade-offs, and ace high-stakes loops.
          </p>
        </div>
      </div>
      <div className="w-full pt-0.5 pb-4 md:pb-6 lg:pb-10 flex flex-col md:flex-row justify-center items-start gap-4 md:gap-4 lg:gap-6 max-w-[1100px] mx-auto">
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[0]} />
          <TestimonialCard {...testimonials[1]} />
        </div>
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[2]} />
          <TestimonialCard {...testimonials[3]} />
          <TestimonialCard {...testimonials[4]} />
        </div>
        <div className="flex-1 flex flex-col justify-start items-start gap-4 md:gap-4 lg:gap-6">
          <TestimonialCard {...testimonials[5]} />
          <TestimonialCard {...testimonials[6]} />
        </div>
      </div>
    </section>
  )
}
