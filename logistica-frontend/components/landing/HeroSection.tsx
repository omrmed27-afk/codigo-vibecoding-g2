"use client"

import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

const HEADLINE = ['Mueve', 'más,', 'gestiona', 'menos.']
const SUBLINE = ['Logística', 'inteligente', 'para', 'empresas', 'que', 'no', 'se', 'detienen.']

const STATS = [
  { value: '+340', label: 'Empresas en LATAM' },
  { value: '98.7%', label: 'Puntualidad' },
  { value: '2.4M', label: 'Envíos al mes' },
  { value: '40%', label: 'Ahorro en rutas' },
]

const BADGES = [
  { label: 'Tracking en vivo', x: '7%', y: '22%', delay: 0 },
  { label: '+2.4M envíos/mes', x: '80%', y: '18%', delay: 0.4 },
  { label: 'IA en rutas', x: '78%', y: '68%', delay: 0.8 },
  { label: 'SAP integrado', x: '5%', y: '72%', delay: 1.2 },
]

function MagneticBtn({
  children,
  primary = false,
  href = '#cta',
}: {
  children: React.ReactNode
  primary?: boolean
  href?: string
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 300, damping: 25 })
  const sy = useSpring(my, { stiffness: 300, damping: 25 })

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        mx.set((e.clientX - rect.left - rect.width / 2) * 0.3)
        my.set((e.clientY - rect.top - rect.height / 2) * 0.3)
      }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
      className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold font-heading cursor-pointer transition-opacity duration-200 hover:opacity-90 ${
        primary
          ? 'bg-brand-orange text-white shadow-[0_0_40px_rgba(249,115,22,0.35)]'
          : 'bg-white/[0.04] border border-white/[0.12] text-white backdrop-blur-md'
      }`}
    >
      {children}
    </motion.a>
  )
}

export default function HeroSection() {
  const shouldReduce = useReducedMotion()

  const wordVariant = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, delay: 0.15 + i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    }),
  }

  const subVariant = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 18 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, delay: 0.6 + i * 0.05 },
    }),
  }

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16 sm:pt-20 sm:pb-10 lg:pt-16 lg:pb-0">
      {/* Mesh gradient blobs — CSS-animated for compositor thread */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="blob-primary absolute rounded-full w-[800px] h-[800px] -top-[20%] -left-[15%] blur-[80px] opacity-[0.22]" />
        <div className="blob-secondary absolute rounded-full w-[600px] h-[600px] -bottom-[10%] -right-[10%] blur-[80px] opacity-[0.18]" />
        <div className="blob-center absolute rounded-full w-[500px] h-[500px] top-[40%] left-[40%] blur-[60px] opacity-[0.1]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-body mb-8 bg-brand-blue/[0.12] border border-brand-blue/25 text-blue-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
          Plataforma de logística empresarial para LATAM
        </motion.div>

        {/* H1 — stagger words */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-heading leading-[1.1] mb-6 tracking-tight text-white">
          {HEADLINE.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.2em]"
              custom={i}
              variants={wordVariant}
              initial="hidden"
              animate="visible"
            >
              {word === 'más,' ? (
                <><span className="text-brand-orange">más</span>,</>
              ) : word}
            </motion.span>
          ))}
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl lg:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed font-body text-white/58">
          {SUBLINE.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.26em]"
              custom={i}
              variants={subVariant}
              initial="hidden"
              animate="visible"
            >
              {word}
            </motion.span>
          ))}
        </p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <MagneticBtn primary>Solicitar demo gratuita →</MagneticBtn>
          <MagneticBtn href="#how-it-works">Ver cómo funciona</MagneticBtn>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.4 }}
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-12"
        >
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold font-heading text-white">{stat.value}</div>
              <div className="text-sm mt-0.5 font-body text-white/40">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Floating badges — desktop only */}
      {!shouldReduce && BADGES.map((badge, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-body text-white/65 bg-white/[0.04] backdrop-blur-xl border border-white/[0.07] z-10"
          style={{ left: badge.x, top: badge.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.5, delay: 1.5 + badge.delay },
            scale: { duration: 0.5, delay: 1.5 + badge.delay },
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: badge.delay },
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
          {badge.label}
        </motion.div>
      ))}
    </section>
  )
}
