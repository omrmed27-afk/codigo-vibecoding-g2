"use client"

import dynamic from 'next/dynamic'

// ssr: false is valid here because this is a Client Component
// Prevents SSR/hydration mismatch from Framer Motion transform initial states
const ParticlesCanvas = dynamic(() => import('./ParticlesCanvas'), { ssr: false })
const NavBar = dynamic(() => import('./NavBar'), { ssr: false })
const HeroSection = dynamic(() => import('./HeroSection'), { ssr: false })
const LogosBar = dynamic(() => import('./LogosBar'), { ssr: false })
const FeaturesSection = dynamic(() => import('./FeaturesSection'), { ssr: false })
const HowItWorks = dynamic(() => import('./HowItWorks'), { ssr: false })
const Testimonials = dynamic(() => import('./Testimonials'), { ssr: false })
const CTASection = dynamic(() => import('./CTASection'), { ssr: false })
const Footer = dynamic(() => import('./Footer'), { ssr: false })

export default function LandingPageClient() {
  return (
    <div className="relative min-h-screen bg-brand-dark">
      {/* Fixed background layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: '256px 256px',
          }}
        />
      </div>

      <ParticlesCanvas />
      <NavBar />

      <main className="relative z-10">
        <HeroSection />
        <LogosBar />
        <FeaturesSection />
        <HowItWorks />
        <Testimonials />
        <CTASection />
      </main>

      <Footer />
    </div>
  )
}
