/**
 * Central motion tokens for the landing page "camera dolly" zoom effect.
 * Tweak values here to tune intensity across hero, preview card and sections.
 */
export const ZOOM = {
  /** Spring applied to every scroll-linked value to smooth out wheel stepping */
  spring: { stiffness: 120, damping: 30, mass: 0.4 },

  /** Scroll-linked section zoom (enter → center → exit) */
  section: {
    enterScale: 0.92,
    exitScale: 0.96,
    enterOpacity: 0.4,
    exitOpacity: 0.6,
    enterY: 40,
  },

  /** Milder section values for small screens */
  sectionMobile: {
    enterScale: 0.96,
    exitScale: 0.98,
    enterOpacity: 0.5,
    exitOpacity: 0.7,
    enterY: 24,
  },

  /** Hero zoom-out as the page scrolls from the top */
  hero: {
    range: [0, 600] as [number, number],
    bgScale: 1.12,
    bgOpacity: 0.5,
    contentScale: 0.9,
    contentY: -60,
  },

  /** Hero background: cinematic load zoom-out + ambient parallax */
  heroBg: {
    loadFromScale: 1.1,
    loadDuration: 1.5,
    loadEase: [0.16, 1, 0.3, 1] as [number, number, number, number],
    /** max px the grid follows the pointer */
    mouseRange: 14,
    /** slow ambient drift loop (px / seconds) */
    driftRange: 8,
    driftDuration: 18,
  },

  /** Demo card: slide up from below with spring, then soft scale "pop" */
  card: {
    slideSpring: { type: "spring", stiffness: 70, damping: 14, mass: 1 } as const,
    popFromScale: 0.95,
    popDelay: 0.55,
    popDuration: 0.6,
    popEase: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },

  /** Internal UI stagger, starts as the card settles */
  stagger: {
    baseDelay: 0.85,
    step: 0.22,
    duration: 0.6,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
} as const

/** Stage indices for staggered card internals (use as `custom`) */
export const STAGE = { header: 0, pills: 1, avatar: 2, details: 3 } as const

const stageTransition = (i: number) => ({
  delay: ZOOM.stagger.baseDelay + i * ZOOM.stagger.step,
  duration: ZOOM.stagger.duration,
  ease: ZOOM.stagger.ease,
})

/** Fade + lift for header / pills / details. Inherits "hidden"/"visible" from the card. */
export const stageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: stageTransition(i) }),
}

/** Fade + scale-up (0.9 → 1) for the 3D avatar viewport. */
export const avatarStageVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number = STAGE.avatar) => ({ opacity: 1, scale: 1, transition: stageTransition(i) }),
}
