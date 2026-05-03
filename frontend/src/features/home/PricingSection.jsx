import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaquetesStore } from '@/stores/paquetesStore'
import { useAuth } from '@/context/AuthContext'
import PagoModal from '@/features/pagos/PagoModal'

export default function PricingSection() {
  const { paquetes } = usePaquetesStore()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [modalPaquete, setModalPaquete] = useState(null)

  const handleComprar = (p) => {
    if (!isAuthenticated) {
      navigate('/login')
    } else {
      setModalPaquete(p)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FAF5F2] via-[#F5EDE8] to-[#EFE3DC] py-28">
      {/* Soft radial glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(194,107,122,0.09)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-5xl px-6">

        {/* Header */}
        <div className="mb-20 flex flex-col items-center gap-4 text-center">
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.28em] text-[#B8947E]">
            Membresías
          </span>
          <div className="h-px w-8 bg-[rgba(123,31,46,0.25)]" />
          <h2 className="font-sans text-[clamp(36px,4.5vw,52px)] not-italic font-normal leading-tight text-[#5A1520] uppercase tracking-[0.3em]">
            Elige tu Paquete
          </h2>
          <p className="font-sans text-sm font-light text-[#A08878] tracking-wide">
            Elige el plan que mejor se adapte a ti. Sin permanencia.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {paquetes.map((p) => (
            <PaqueteCard key={p.id} p={p} onComprar={() => handleComprar(p)} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          <p className="text-sm font-light text-[#A08878]">¿Prefieres clases sueltas?</p>
          <button
            className="border-b border-[rgba(123,31,46,0.3)] pb-px text-sm text-[#7B1E22] transition-all hover:border-[#7B1E22] hover:opacity-80"
            onClick={() => navigate(isAuthenticated ? '/cliente/pagos' : '/login')}
          >
            Ver todos los paquetes →
          </button>
        </div>
      </div>

      {modalPaquete && (
        <PagoModal
          paquete={modalPaquete}
          onClose={() => setModalPaquete(null)}
          onSuccess={() => setModalPaquete(null)}
        />
      )}
    </section>
  )
}

function PaqueteCard({ p, onComprar }) {
  const esFeatured = p.destacado
  const clasesDisplay = p.clases === 0 ? '∞' : p.clases
  const clasesLabel = p.clases === 0 ? 'Ilimitadas' : p.clases === 1 ? 'Clase' : 'Clases'

  if (esFeatured) {
    return (
      <div className="relative flex flex-col rounded-[28px] overflow-hidden
                      bg-gradient-to-b from-[#7B1E22] to-[#5C1018]
                      -translate-y-3 md:-translate-y-4
                      shadow-[0_4px_8px_rgba(0,0,0,0.08),0_20px_48px_rgba(92,16,24,0.35),0_48px_96px_rgba(92,16,24,0.20)]
                      transition-all duration-300
                      hover:-translate-y-6 hover:shadow-[0_8px_16px_rgba(0,0,0,0.10),0_28px_60px_rgba(92,16,24,0.42),0_56px_100px_rgba(92,16,24,0.25)]">

        {/* Shine overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] to-transparent rounded-[28px]" />

        {/* Badge */}
        <div className="absolute top-5 right-5">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[8px] font-medium uppercase tracking-[0.18em] text-[#F5EDE8] backdrop-blur-sm">
            Más popular
          </span>
        </div>

        {/* Count */}
        <div className="flex flex-col items-center gap-1 px-8 pb-8 pt-11 z-10">
          <span className="font-display text-[clamp(80px,10vw,108px)] font-light italic leading-none tracking-tight text-[#F5EDE8]">
            {clasesDisplay}
          </span>
          <span className="font-sans text-[10px] font-normal uppercase tracking-[0.22em] text-[rgba(245,237,232,0.5)]">
            {clasesLabel}
          </span>
        </div>

        <div className="mx-7 h-px bg-gradient-to-r from-transparent via-[rgba(245,237,232,0.15)] to-transparent z-10" />

        {/* Info */}
        <div className="px-8 pt-7 pb-2 z-10">
          <p className="font-display text-xl font-medium tracking-wide text-[rgba(245,237,232,0.9)]">{p.nombre}</p>
        </div>
        <div className="flex items-baseline gap-1 px-8 pb-6 z-10">
          <span className="font-display text-[40px] italic font-semibold text-[#F5EDE8]">${p.precio.toLocaleString()}</span>
          <span className="font-sans text-xs font-light text-[rgba(245,237,232,0.55)]"> MX /mes</span>
        </div>

        <ul className="z-10 mb-8 flex flex-1 flex-col gap-3 px-8">
          {p.beneficios.map((b) => (
            <li key={b} className="font-sans flex items-start gap-3 text-[13px] font-normal leading-snug text-[rgba(245,237,232,0.78)]">
              <span className="mt-0.5 shrink-0 text-[11px] text-[rgba(245,237,232,0.65)]">✓</span>
              {b}
            </li>
          ))}
        </ul>

        <button
          onClick={onComprar}
          className="font-sans z-10 mx-7 mb-8 rounded-full border border-[rgba(245,237,232,0.35)] bg-[rgba(245,237,232,0.12)]
                     px-7 py-[14px] text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#F5EDE8]
                     transition-all duration-300 hover:bg-[#F5EDE8] hover:text-[#7B1E22] hover:border-[#F5EDE8]
                     hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.15)]"
        >
          Comprar
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col rounded-[28px] overflow-hidden
                    bg-white/70 border border-[rgba(194,107,122,0.12)]
                    backdrop-blur-md
                    shadow-[0_2px_4px_rgba(0,0,0,0.03),0_8px_24px_rgba(123,31,46,0.07),0_24px_56px_rgba(123,31,46,0.05)]
                    transition-all duration-300
                    hover:-translate-y-2 hover:scale-[1.02]
                    hover:shadow-[0_4px_8px_rgba(0,0,0,0.04),0_16px_40px_rgba(123,31,46,0.12),0_40px_80px_rgba(123,31,46,0.09)]">

      {/* Gradient sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-[rgba(240,228,224,0.3)] rounded-[28px]" />

      {/* Count */}
      <div className="flex flex-col items-center gap-1 px-8 pb-8 pt-11 z-10">
        <span className="font-display text-[clamp(80px,10vw,108px)] font-light italic leading-none tracking-tight text-[#7B1E22]">
          {clasesDisplay}
        </span>
        <span className="font-sans text-[10px] font-normal uppercase tracking-[0.22em] text-[rgba(123,31,46,0.4)]">
          {clasesLabel}
        </span>
      </div>

      <div className="mx-7 h-px bg-gradient-to-r from-transparent via-[rgba(123,31,46,0.1)] to-transparent z-10" />

      {/* Info */}
      <div className="px-8 pt-7 pb-2 z-10">
        <p className="font-display text-xl font-medium tracking-wide text-[#3D1A20]">{p.nombre}</p>
      </div>
      <div className="flex items-baseline gap-1 px-8 pb-6 z-10">
        <span className="font-display text-[40px] italic font-semibold text-[#7B1E22]">${p.precio.toLocaleString()}</span>
        <span className="font-sans text-xs font-light text-[#A08878]"> MX /mes</span>
      </div>

      <ul className="z-10 mb-8 flex flex-1 flex-col gap-3 px-8">
        {p.beneficios.map((b) => (
          <li key={b} className="font-sans flex items-start gap-3 text-[13px] font-light leading-snug text-[#7A6560]">
            <span className="mt-0.5 shrink-0 text-[11px] font-semibold text-[#C26B7A]">✓</span>
            {b}
          </li>
        ))}
      </ul>

      <button
        onClick={onComprar}
        className="font-sans z-10 mx-7 mb-8 rounded-full border-[1.5px] border-[rgba(123,31,46,0.3)] bg-transparent
                   px-7 py-[14px] text-center text-xs font-semibold uppercase tracking-[0.1em] text-[#7B1E22]
                   transition-all duration-300 hover:bg-[#7B1E22] hover:text-[#F5EDE8] hover:border-[#7B1E22]
                   hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(123,31,46,0.25)]"
      >
        Comprar
      </button>
    </div>
  )
}
