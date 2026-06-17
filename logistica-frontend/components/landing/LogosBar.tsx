"use client"

const LOGOS = [
  'FEMSA', 'Cencosud', 'Falabella', 'Grupo Bimbo', 'DHL',
  'Walmart', 'Nestlé', 'OXXO', 'Liverpool', 'Grupo Éxito',
]

export default function LogosBar() {
  const doubled = [...LOGOS, ...LOGOS]

  return (
    <section className="py-12 overflow-hidden border-y border-white/[0.05] bg-black/[0.12]">
      <p className="text-center text-xs font-medium font-body uppercase tracking-widest mb-8 text-white/22">
        Empresas líderes en LATAM confían en nosotros
      </p>
      <div
        className="relative flex overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}
      >
        <div className="flex animate-marquee shrink-0">
          {doubled.map((logo, i) => (
            <span
              key={i}
              className="px-10 text-sm font-semibold font-heading whitespace-nowrap text-white/22"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
