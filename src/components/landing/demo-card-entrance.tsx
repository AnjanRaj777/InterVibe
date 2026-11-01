"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ZOOM } from "./motion-config"

/**
 * Demo card entrance: slides up from below the viewport with a spring bounce,
 * then "pops" from 0.95 → 1 with a soft cubic-bezier as it settles.
 *
 * Children can use `stageVariants` / `avatarStageVariants` (motion-config) –
 * they inherit the "hidden" → "visible" variant from this wrapper and stagger in.
 */
export function DemoCardEntrance({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()
  const c = ZOOM.card

  return (
    <div className="relative">
      {/* Emerald radial glow behind the card */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[30%] -z-10 h-[900px] w-[1400px] max-w-[100vw] -translate-x-1/2 -translate-y-1/2 rounded-full
          bg-[radial-gradient(closest-side,rgba(16,185,129,0.28),rgba(16,185,129,0.10)_45%,transparent_75%)]"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.3, ease: c.popEase }}
      />

      <motion.div
        initial={reduceMotion ? "visible" : "hidden"}
        animate="visible"
        variants={{
          hidden: { y: "100%", scale: c.popFromScale },
          visible: {
            y: 0,
            scale: 1,
            transition: {
              y: c.slideSpring,
              scale: { delay: c.popDelay, duration: c.popDuration, ease: c.popEase },
            },
          },
        }}
        style={{ willChange: "transform" }}
      >
        {children}
      </motion.div>
    </div>
  )
}
