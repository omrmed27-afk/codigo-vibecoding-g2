"use client"

import { motion } from 'framer-motion'

const NAV_LINKS = [
  { href: '#features', label: 'Soluciones' },
  { href: '#how-it-works', label: 'Cómo funciona' },
  { href: '#testimonials', label: 'Clientes' },
  { href: '#cta', label: 'Contacto' },
]

export default function NavBar() {
  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="fixed top-0 left-0 right-0 z-50 bg-brand-dark/85 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_32px_rgba(0,0,0,0.4)]"
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        <span className="font-bold text-lg text-white font-heading shrink-0">
          Logistica<span className="text-brand-orange">Web</span>
        </span>

        <ul className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-white/60 font-body transition-colors duration-200 hover:text-white cursor-pointer"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/login"
            className="px-4 py-2 text-sm font-semibold font-heading text-white/65 cursor-pointer transition-colors duration-200 hover:text-white"
          >
            Iniciar sesión
          </a>
          <a
            href="#cta"
            className="px-5 py-2 rounded-full text-sm font-semibold font-heading text-white bg-brand-orange cursor-pointer transition-opacity duration-200 hover:opacity-90"
          >
            Solicitar demo
          </a>
        </div>
      </nav>
    </motion.header>
  )
}
