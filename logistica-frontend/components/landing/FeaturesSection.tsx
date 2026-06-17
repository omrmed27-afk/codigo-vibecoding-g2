"use client"

import { motion } from 'framer-motion'
import { MapPin, BarChart3, Route, Link2, Smartphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Feature {
  id: string
  icon: LucideIcon
  title: string
  description: string
  featured: boolean
  accent: 'blue' | 'orange'
}

const FEATURES: Feature[] = [
  {
    id: 'tracking',
    icon: MapPin,
    title: 'Tracking en tiempo real',
    description:
      'Monitorea flotas y envíos en un mapa interactivo con actualización cada 30 segundos. Alertas automáticas, visibilidad end-to-end y seguimiento personalizado por cliente.',
    featured: true,
    accent: 'blue',
  },
  {
    id: 'dashboard',
    icon: BarChart3,
    title: 'Dashboard de operaciones',
    description:
      'KPIs críticos, alertas inteligentes y reportes automáticos para tomar decisiones en tiempo real sin depender del equipo de BI.',
    featured: false,
    accent: 'orange',
  },
  {
    id: 'routes',
    icon: Route,
    title: 'Rutas optimizadas con IA',
    description:
      'Reducción de hasta 40% en costos de combustible con algoritmos de optimización que aprenden de tu operación.',
    featured: false,
    accent: 'blue',
  },
  {
    id: 'erp',
    icon: Link2,
    title: 'Integración ERP y SAP',
    description:
      'Conecta con SAP, Oracle, Odoo y sistemas de facturación electrónica en menos de 48 horas. API REST documentada.',
    featured: false,
    accent: 'orange',
  },
  {
    id: 'mobile',
    icon: Smartphone,
    title: 'App móvil para conductores',
    description:
      'Firma digital, evidencia fotográfica y comunicación en tiempo real. Sin papel, sin llamadas, sin disputas.',
    featured: false,
    accent: 'blue',
  },
]

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 36 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: i * 0.1,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

const ICON_CLASSES: Record<string, string> = {
  blue: 'bg-brand-blue/[0.15] border border-brand-blue/25 text-brand-blue',
  orange: 'bg-brand-orange/[0.15] border border-brand-orange/25 text-brand-orange',
}

const GLOW_CLASSES: Record<string, string> = {
  blue: 'bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.1)_0%,transparent_60%)]',
  orange: 'bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,0.1)_0%,transparent_60%)]',
}

const CTA_CLASSES: Record<string, string> = {
  blue: 'text-brand-blue',
  orange: 'text-brand-orange',
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon
  return (
    <motion.div
      custom={index}
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      viewport={{ once: true, margin: '-100px' }}
      className={`relative overflow-hidden rounded-2xl p-6 cursor-default group transition-colors duration-300 bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] ${
        feature.featured ? 'md:col-span-2' : ''
      }`}
    >
      <div className={`absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${GLOW_CLASSES[feature.accent]}`} />

      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${ICON_CLASSES[feature.accent]}`}>
        <Icon size={20} />
      </div>

      <h3 className="text-lg font-semibold font-heading text-white mb-2">{feature.title}</h3>
      <p className="text-sm font-body leading-relaxed text-white/48">{feature.description}</p>

      {feature.featured && (
        <div className={`mt-5 inline-flex items-center gap-1 text-sm font-semibold font-body cursor-pointer hover:gap-2 transition-all duration-200 ${CTA_CLASSES[feature.accent]}`}>
          Ver demo del mapa →
        </div>
      )}
    </motion.div>
  )
}

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-medium font-body uppercase tracking-widest mb-3 text-brand-orange">
            Funcionalidades
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-white mb-4 leading-tight">
            Todo lo que necesitas<br />para operar mejor
          </h2>
          <p className="text-base sm:text-lg font-body max-w-2xl mx-auto text-white/48">
            Una plataforma integrada que reemplaza cinco herramientas distintas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
