"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CTASection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <section id="cta" className="relative py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl p-px overflow-hidden"
        >
          {/* Rotating gradient border */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <motion.div
              className="absolute inset-[-50%]"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, #2563EB 80deg, #F97316 180deg, #2563EB 280deg, transparent 360deg)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Inner panel */}
          <div className="relative rounded-3xl px-8 sm:px-12 py-12 text-center bg-brand-navy/[0.96] backdrop-blur-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white mb-4 leading-tight">
              Empieza a operar mejor<br />desde esta semana
            </h2>
            <p className="text-base font-body mb-8 max-w-lg mx-auto text-white/52">
              Demo personalizada en 30 minutos. Sin tarjeta de crédito. Un especialista en
              logística LATAM te muestra cómo aplica a tu operación.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="flex-1 px-4 py-3 rounded-xl font-body text-white placeholder-white/30 outline-none bg-white/[0.06] border border-white/[0.1] transition-all duration-200 focus:border-brand-blue/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] text-[0.9375rem]"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-semibold font-heading text-white bg-brand-orange cursor-pointer transition-opacity duration-200 hover:opacity-90 whitespace-nowrap"
                >
                  Solicitar demo
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 text-base font-body font-medium text-green-400"
              >
                <span className="w-2 h-2 rounded-full bg-green-400" />
                ¡Listo! Te contactamos en menos de 2 horas hábiles.
              </motion.div>
            )}

            <p className="mt-5 text-xs font-body text-white/25">
              +340 empresas en LATAM. Configuración en 48h. Sin permanencia.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
