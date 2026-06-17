"use client"

import { motion } from 'framer-motion'
import { Globe, X, Play, Mail } from 'lucide-react'

const COLS = [
  {
    title: 'Producto',
    links: ['Tracking en vivo', 'Dashboard', 'Optimización IA', 'Integraciones', 'App móvil'],
  },
  {
    title: 'Empresa',
    links: ['Sobre nosotros', 'Casos de éxito', 'Blog', 'Prensa', 'Carreras'],
  },
  {
    title: 'Soporte',
    links: ['Documentación', 'API Reference', 'Estado del servicio', 'Centro de ayuda', 'Contacto'],
  },
]

const SOCIALS = [
  { Icon: Globe, label: 'LinkedIn' },
  { Icon: X, label: 'Twitter/X' },
  { Icon: Play, label: 'YouTube' },
  { Icon: Mail, label: 'Email' },
]

export default function Footer() {
  return (
    <footer className="relative pt-16 pb-8 px-6 bg-black/30 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="font-bold text-xl font-heading text-white mb-3">
              Logistica<span className="text-brand-orange">Web</span>
            </div>
            <p className="text-sm font-body leading-relaxed mb-5 text-white/38">
              Plataforma de logística inteligente para empresas de LATAM.
            </p>
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ Icon, label }) => (
                <motion.button
                  key={label}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer bg-white/[0.05] border border-white/[0.07] text-white/45"
                  whileHover={{
                    background: 'rgba(37,99,235,0.15)',
                    borderColor: 'rgba(37,99,235,0.3)',
                    color: '#93C5FD',
                    boxShadow: '0 0 12px rgba(37,99,235,0.2)',
                  }}
                  transition={{ duration: 0.15 }}
                >
                  <Icon size={13} />
                </motion.button>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold font-heading text-white mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm font-body cursor-pointer text-white/38 transition-colors duration-200 hover:text-white/70"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs font-body text-white/22 border-t border-white/[0.06]">
          <span>© 2026 LogisticaWeb. Todos los derechos reservados.</span>
          <div className="flex items-center gap-5">
            {['Privacidad', 'Términos', 'Cookies'].map((item) => (
              <a key={item} href="#" className="cursor-pointer transition-colors duration-200 hover:text-white/40">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
