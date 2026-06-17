"use client"

import { useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'

const TESTIMONIALS = [
  {
    quote:
      'Redujimos el tiempo de despacho en un 35% en los primeros 3 meses. La visibilidad en tiempo real cambió completamente cómo operamos.',
    name: 'Carlos Mendoza',
    role: 'Gerente de Operaciones',
    company: 'FEMSA México',
    initials: 'CM',
    accent: 'blue' as const,
  },
  {
    quote:
      'La integración con SAP fue impecable. Nuestro equipo de TI lo implementó sin contratiempos y el soporte fue excelente desde el primer día.',
    name: 'Ana Torres',
    role: 'Directora de Supply Chain',
    company: 'Cencosud Chile',
    initials: 'AT',
    accent: 'orange' as const,
  },
  {
    quote:
      'Las rutas optimizadas con IA nos generaron un ahorro real del 38% en combustible. Es la inversión con mejor ROI que hemos hecho este año.',
    name: 'Roberto Díaz',
    role: 'VP de Logística',
    company: 'Grupo Bimbo',
    initials: 'RD',
    accent: 'blue' as const,
  },
  {
    quote:
      'Nuestros conductores adoptaron la app en días. La firma digital eliminó el 100% del papeleo y redujo las disputas con clientes a casi cero.',
    name: 'Mariana López',
    role: 'Jefa de Distribución',
    company: 'DHL Colombia',
    initials: 'ML',
    accent: 'orange' as const,
  },
  {
    quote:
      'El dashboard de KPIs nos da visibilidad que antes tardábamos días en recopilar. Las decisiones ahora son más rápidas y basadas en datos reales.',
    name: 'Jorge Vásquez',
    role: 'CEO',
    company: 'LogiExpress Perú',
    initials: 'JV',
    accent: 'blue' as const,
  },
  {
    quote:
      'Probamos tres plataformas antes de LogisticaWeb. Ninguna tenía la profundidad para operar en múltiples países con regulaciones distintas.',
    name: 'Sofía Guerrero',
    role: 'Manager de Operaciones',
    company: 'Walmart Argentina',
    initials: 'SG',
    accent: 'orange' as const,
  },
]

const AVATAR_CLASSES: Record<string, string> = {
  blue: 'bg-brand-blue',
  orange: 'bg-brand-orange',
}

const QUOTE_CLASSES: Record<string, string> = {
  blue: 'text-brand-blue',
  orange: 'text-brand-orange',
}

const GLOW_CLASSES: Record<string, string> = {
  blue: 'bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.08)_0%,transparent_55%)]',
  orange: 'bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,0.08)_0%,transparent_55%)]',
}

function TestimonialCard({ t }: { t: (typeof TESTIMONIALS)[0] }) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useTransform(my, [-60, 60], [5, -5])
  const rotateY = useTransform(mx, [-60, 60], [-5, 5])
  const sRotX = useSpring(rotateX, { stiffness: 200, damping: 20 })
  const sRotY = useSpring(rotateY, { stiffness: 200, damping: 20 })

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: sRotX, rotateY: sRotY, transformPerspective: 800, transformStyle: 'preserve-3d' }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        mx.set(e.clientX - rect.left - rect.width / 2)
        my.set(e.clientY - rect.top - rect.height / 2)
      }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
      className="relative p-6 rounded-2xl cursor-default mb-4 break-inside-avoid bg-white/[0.03] backdrop-blur-xl border border-white/[0.07]"
    >
      <div className={`absolute inset-0 rounded-2xl pointer-events-none ${GLOW_CLASSES[t.accent]}`} />

      <div className={`text-3xl mb-2 leading-none font-heading ${QUOTE_CLASSES[t.accent]}`}>"</div>
      <p className="text-sm font-body leading-relaxed mb-5 text-white/62">{t.quote}</p>

      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-heading text-white shrink-0 ${AVATAR_CLASSES[t.accent]}`}>
          {t.initials}
        </div>
        <div>
          <div className="text-sm font-semibold font-heading text-white">{t.name}</div>
          <div className="text-xs font-body text-white/38">{t.role} · {t.company}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-medium font-body uppercase tracking-widest mb-3 text-brand-orange">
            Clientes
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white">
            Empresas que ya operan mejor
          </h2>
        </motion.div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <TestimonialCard t={t} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
