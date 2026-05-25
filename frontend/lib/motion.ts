import { Variants } from 'framer-motion'

// Page entry — stagger children
export const pageVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
}

// Each section fades + slides up
export const sectionVariants: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
  }
}

// Card hover lift — use on motion.div wrappers
export const cardHover = {
  rest:  { y: 0,  boxShadow: 'var(--shadow-sm)' },
  hover: { y: -2, boxShadow: 'var(--shadow-md)',
           transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }
}

// Number count-up — use with useMotionValue + useTransform
export const numberEntrance: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] }
  }
}

// Badge / chip pop-in
export const badgePopIn: Variants = {
  hidden:  { scale: 0.7, opacity: 0 },
  visible: {
    scale: 1, opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 22 }
  }
}

// Tab indicator slide
export const tabIndicator = {
  layoutId: 'tab-indicator',
  transition: { type: 'spring', stiffness: 380, damping: 32 }
}

// Chart line draw — use SVG pathLength
export const chartDraw: Variants = {
  hidden:  { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1, opacity: 1,
    transition: { pathLength: { duration: 1.2, ease: [0.23, 1, 0.32, 1] },
                  opacity:    { duration: 0.2 } }
  }
}

// Signal badge entrance — used in TechnicalSignals
export const signalStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } }
}

export const signalItem: Variants = {
  hidden:  { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0,
             transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] } }
}
