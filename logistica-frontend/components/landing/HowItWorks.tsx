"use client"

import { motion } from 'framer-motion'
import { Plug, Settings, Activity, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Step {
  num: string
  icon: LucideIcon
  title: string
  description: string
  side: 'left' | 'right'
}

const STEPS: Step[] = [
  {
    num: '01',
    icon: Plug,
    title: 'Conecta tus sistemas',
    description:
      'Integra tu ERP, SAP u otros sistemas en menos de 48 horas. API REST + conectores nativos para los principales sistemas en LATAM. Sin código, sin consultores externos.',
    side: 'left',
  },
  {
    num: '02',
    icon: Settings,
    title: 'Configura tu operación',
    description:
      'Define zonas de cobertura, flota disponible, ventanas horarias y reglas de negocio desde el panel de administración. Cualquier persona del equipo puede hacerlo.',
    side: 'right',
  },
  {
    num: '03',
    icon: Activity,
    title: 'Opera en tiempo real',
    description:
      'Gestiona envíos, monitorea tu flota en el mapa y resuelve incidencias al instante desde el dashboard central o desde la app móvil.',
    side: 'left',
  },
  {
    num: '04',
    icon: TrendingUp,
    title: 'Optimiza con datos',
    description:
      'Analiza KPIs semana a semana y deja que la IA proponga mejoras de ruta que reducen costos de forma continua y automática.',
    side: 'right',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <p className="text-xs font-medium font-body uppercase tracking-widest mb-3 text-brand-orange">
            Cómo funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white">
            En marcha en 48 horas
          </h2>
        </motion.div>

        <div className="relative">
          {/* Vertical connector */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden md:block bg-gradient-to-b from-transparent via-brand-blue/25 to-transparent" />

          <div className="flex flex-col gap-12">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const isLeft = step.side === 'left'
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.08,
                    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                  }}
                  className={`relative flex items-center gap-8 flex-col ${
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Card */}
                  <div className="flex-1 p-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-blue/[0.14] border border-brand-blue/22 text-brand-blue">
                        <Icon size={17} />
                      </div>
                      <span className="text-2xl font-bold font-heading text-brand-blue/35">
                        {step.num}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold font-heading text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm font-body leading-relaxed text-white/48">
                      {step.description}
                    </p>
                  </div>

                  {/* Center dot */}
                  <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full shrink-0 z-10 bg-brand-blue shadow-[0_0_20px_rgba(37,99,235,0.45)]">
                    <div className="w-3 h-3 rounded-full bg-white" />
                  </div>

                  <div className="flex-1 hidden md:block" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
