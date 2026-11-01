"use client"

import { useRef, type ReactNode } from "react"
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ZOOM } from "./motion-config"

interface ZoomSectionProps {
  children: ReactNode
  className?: string
  id?: string
  /**
   * For sections near the page bottom that can never scroll to the viewport
   * center: zoom in fully once the section's bottom enters view, no exit zoom.
   */
  settle?: boolean
}

/**
 * Scroll-linked section that zooms in as it reaches the viewport center
 * and gently zooms out as it leaves. Fully reversible when scrolling up.
 */
export function ZoomSection({ children, className, id, settle = false }: ZoomSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { isOpen: isMobile } = useMediaQuery()
  const t = isMobile ? ZOOM.sectionMobile : ZOOM.section

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: settle ? ["start end", "end end"] : ["start end", "end start"],
  })

  const scale = useSpring(
    useTransform(
      scrollYProgress,
      settle ? [0, 1] : [0, 0.5, 1],
      settle ? [t.enterScale, 1] : [t.enterScale, 1, t.exitScale]
    ),
    ZOOM.spring
  )
  const opacity = useSpring(
    useTransform(
      scrollYProgress,
      settle ? [0, 0.7] : [0, 0.35, 0.65, 1],
      settle ? [t.enterOpacity, 1] : [t.enterOpacity, 1, 1, t.exitOpacity]
    ),
    ZOOM.spring
  )
  const y = useSpring(
    useTransform(scrollYProgress, settle ? [0, 0.8] : [0, 0.4], [t.enterY, 0]),
    ZOOM.spring
  )

  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      style={
        reduceMotion
          ? undefined
          : { scale, opacity, y, transformOrigin: "50% 50%", willChange: "transform, opacity" }
      }
    >
      {children}
    </motion.div>
  )
}
