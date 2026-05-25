'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full" style={{ background: 'var(--bg-sunken)' }} />
    )
  }

  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="theme-toggle-btn"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-sunken)',
        border: '1px solid var(--border-soft)',
        cursor: 'pointer',
        transitionProperty: 'border-color',
        transitionDuration: '150ms',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isDark
            ? <Sun size={17} weight="regular" color="var(--amber-500)" />
            : <Moon size={17} weight="regular" color="var(--teal-600)" />
          }
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
