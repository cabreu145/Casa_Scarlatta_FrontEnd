import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { usePaquetesStore } from '@/stores/paquetesStore'
import { useAuth } from '@/context/AuthContext'
import { getMembershipPackagesApi } from '@/services/membershipPackagesApiService'
import {
  formatPackagePriceLabel,
  formatPackageCreditsLabel,
  formatPackageShareabilityLabel,
  formatPackageValidityLabel,
  getPackageBenefits,
  getPackageCredits,
  getPackageDisplayName,
} from '@/utils/packageDisplay'
import {
  buildPackagePurchaseRedirect,
  savePendingPackagePurchaseIntent,
} from '@/utils/packagePurchaseIntent'

const useApiPackages =
  import.meta.env.VITE_USE_API_AUTH === 'true' ||
  import.meta.env.VITE_USE_API_CLASSES === 'true' ||
  import.meta.env.VITE_USE_API_RESERVATIONS === 'true' ||
  import.meta.env.VITE_USE_API_WAITLIST === 'true'

function buildPackageBenefits(pkg) {
  const benefits = getPackageBenefits(pkg)
  if (benefits.length) return benefits

  const credits = getPackageCredits(pkg)
  const fallback = [credits > 0 ? `${credits} ${credits === 1 ? 'clase' : 'clases'}` : 'Paquete finito']
  const validity = formatPackageValidityLabel(pkg)
  if (validity) fallback.push(validity)
  const shareable = formatPackageShareabilityLabel(pkg)
  if (shareable) fallback.push(shareable)
  if (pkg?.descripcion) fallback.push(pkg.descripcion)
  return fallback.filter(Boolean)
}

export default function PricingSection() {
  const fallbackPackages = usePaquetesStore((state) => state.paquetes)
  const { usuario, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [apiPackages, setApiPackages] = useState([])
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (!useApiPackages) return
    let active = true

    setIsApiLoading(true)
    setApiError('')

    getMembershipPackagesApi()
      .then((items) => {
        if (!active) return
        setApiPackages(items)
      })
      .catch((err) => {
        if (!active) return
        setApiPackages([])
        setApiError(err?.message ?? 'No se pudo cargar catálogo de paquetes')
      })
      .finally(() => {
        if (active) setIsApiLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const paquetes = useMemo(
    () => (useApiPackages ? apiPackages : fallbackPackages),
    [apiPackages, fallbackPackages]
  )

  const handleOpenPayments = () => {
    const redirect = buildPackagePurchaseRedirect(null)
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`)
      return
    }
    if (usuario?.rol !== 'cliente') {
      toast.error('Inicia sesión con una cuenta de cliente para comprar paquetes.')
      return
    }
    navigate(redirect)
  }

  const handleComprar = (pkg) => {
    if (authLoading) {
      toast.error('Espera a que cargue tu sesión.')
      return
    }

    const packageId = pkg?.id ?? null
    const redirect = buildPackagePurchaseRedirect(packageId)

    if (!isAuthenticated) {
      savePendingPackagePurchaseIntent(packageId)
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`)
      return
    }

    if (usuario?.rol !== 'cliente') {
      toast.error('Inicia sesión con una cuenta de cliente para comprar paquetes.')
      return
    }

    navigate(redirect)
  }

  return (
    <section id="membresias" className="relative overflow-hidden bg-gradient-to-br from-[#FAF5F2] via-[#F5EDE8] to-[#EFE3DC] py-28">
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(194,107,122,0.09)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-5xl px-6">
        <div className="mb-20 flex flex-col items-center gap-4 text-center">
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.28em] text-[#B8947E]">
            Membresías
          </span>
          <div className="h-px w-8 bg-[rgba(123,31,46,0.25)]" />
          <h2 className="font-sans text-[clamp(36px,4.5vw,52px)] font-normal leading-tight uppercase tracking-[0.3em] text-[#5A1520]">
            Elige tu Paquete
          </h2>
          <p className="font-sans text-sm font-light tracking-wide text-[#A08878]">
            Elige el plan que mejor se adapte a ti. Sin permanencia.
          </p>
        </div>

        {useApiPackages && isApiLoading && (
          <div className="mb-10 text-center text-sm text-[#7A6560]">
            Cargando catálogo de paquetes...
          </div>
        )}

        {useApiPackages && apiError && (
          <div className="mb-10 text-center text-sm text-[#B42318]">
            {apiError}
          </div>
        )}

        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
          {paquetes.map((p) => (
            <PaqueteCard
              key={p.id}
              p={p}
              onComprar={() => handleComprar(p)}
            />
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          <p className="text-sm font-light text-[#A08878]">¿Prefieres ver tus paquetes activos?</p>
          <button
            className="border-b border-[rgba(123,31,46,0.3)] pb-px text-sm text-[#7B1E22] transition-all hover:border-[#7B1E22] hover:opacity-80"
            onClick={handleOpenPayments}
          >
            Ver todos los paquetes →
          </button>
        </div>
      </div>
    </section>
  )
}

function PaqueteCard({ p, onComprar }) {
  const esFeatured = Boolean(p?.destacado)
  const clases = getPackageCredits(p)
  const clasesDisplay = clases > 0 ? clases : '—'
  const clasesLabel = formatPackageCreditsLabel(clases)
  const benefits = buildPackageBenefits(p)
  const priceLabel = formatPackagePriceLabel(p)
  const validityLabel = formatPackageValidityLabel(p)
  const shareableLabel = formatPackageShareabilityLabel(p)
  const displayName = getPackageDisplayName(p)

  if (esFeatured) {
    return (
      <div className="relative flex flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-[#7B1E22] to-[#5C1018] shadow-[0_4px_8px_rgba(0,0,0,0.08),0_20px_48px_rgba(92,16,24,0.35),0_48px_96px_rgba(92,16,24,0.20)] transition-all duration-300 -translate-y-3 md:-translate-y-4 hover:-translate-y-6 hover:shadow-[0_8px_16px_rgba(0,0,0,0.10),0_28px_60px_rgba(92,16,24,0.42),0_56px_100px_rgba(92,16,24,0.25)]">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.07] to-transparent" />
        <div className="absolute right-5 top-5">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[8px] font-medium uppercase tracking-[0.18em] text-[#F5EDE8] backdrop-blur-sm">
            Más popular
          </span>
        </div>

        <div className="z-10 flex flex-col items-center gap-1 px-8 pb-8 pt-11">
          <span className="font-display text-[clamp(80px,10vw,108px)] font-light italic leading-none tracking-tight text-[#F5EDE8]">
            {clasesDisplay}
          </span>
          <span className="font-sans text-[10px] font-normal uppercase tracking-[0.22em] text-[rgba(245,237,232,0.5)]">
            {clasesLabel}
          </span>
        </div>

        <div className="z-10 mx-7 h-px bg-gradient-to-r from-transparent via-[rgba(245,237,232,0.15)] to-transparent" />

        <div className="z-10 px-8 pb-2 pt-7">
          <p className="font-display text-xl font-medium tracking-wide text-[rgba(245,237,232,0.9)]">
            {displayName}
          </p>
        </div>
        <div className="z-10 flex items-baseline gap-1 px-8 pb-6">
          <span className="font-display text-[40px] italic font-semibold text-[#F5EDE8]">
            {priceLabel}
          </span>
        </div>

        <ul className="z-10 mb-8 flex flex-1 flex-col gap-3 px-8">
          
          {shareableLabel && (
            <li className="font-sans flex items-start gap-3 text-[13px] font-normal leading-snug text-[rgba(245,237,232,0.78)]">
              <span className="mt-0.5 shrink-0 text-[11px] text-[rgba(245,237,232,0.65)]">•</span>
              {shareableLabel}
            </li>
          )}
          {benefits.map((b) => (
            <li key={b} className="font-sans flex items-start gap-3 text-[13px] font-normal leading-snug text-[rgba(245,237,232,0.78)]">
              <span className="mt-0.5 shrink-0 text-[11px] text-[rgba(245,237,232,0.65)]">✓</span>
              {b}
            </li>
          ))}
        </ul>

        <button
          onClick={onComprar}
          className="font-sans z-10 mx-7 mb-8 rounded-full border border-[rgba(245,237,232,0.35)] bg-[rgba(245,237,232,0.12)] px-7 py-[14px] text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#F5EDE8] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F5EDE8] hover:bg-[#F5EDE8] hover:text-[#7B1E22] hover:shadow-[0_8px_28px_rgba(0,0,0,0.15)]"
        >
          Comprar
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[28px] border border-[rgba(194,107,122,0.12)] bg-white/70 shadow-[0_2px_4px_rgba(0,0,0,0.03),0_8px_24px_rgba(123,31,46,0.07),0_24px_56px_rgba(123,31,46,0.05)] backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_4px_8px_rgba(0,0,0,0.04),0_16px_40px_rgba(123,31,46,0.12),0_40px_80px_rgba(123,31,46,0.09)]">
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/60 via-transparent to-[rgba(240,228,224,0.3)]" />

      <div className="z-10 flex flex-col items-center gap-1 px-8 pb-8 pt-11">
        <span className="font-display text-[clamp(80px,10vw,108px)] font-light italic leading-none tracking-tight text-[#7B1E22]">
          {clasesDisplay}
        </span>
        <span className="font-sans text-[10px] font-normal uppercase tracking-[0.22em] text-[rgba(123,31,46,0.4)]">
          {clasesLabel}
        </span>
      </div>

      <div className="z-10 mx-7 h-px bg-gradient-to-r from-transparent via-[rgba(123,31,46,0.1)] to-transparent" />

      <div className="z-10 px-8 pb-2 pt-7">
        <p className="font-display text-xl font-medium tracking-wide text-[#3D1A20]">
          {displayName}
        </p>
      </div>
      <div className="z-10 flex items-baseline gap-1 px-8 pb-6">
        <span className="font-display text-[40px] italic font-semibold text-[#7B1E22]">
          {priceLabel}
        </span>
      </div>

      <ul className="z-10 mb-8 flex flex-1 flex-col gap-3 px-8">
        
        {shareableLabel && (
          <li className="font-sans flex items-start gap-3 text-[13px] font-light leading-snug text-[#7A6560]">
            <span className="mt-0.5 shrink-0 text-[11px] font-semibold text-[#C26B7A]">•</span>
            {shareableLabel}
          </li>
        )}
        {benefits.map((b) => (
          <li key={b} className="font-sans flex items-start gap-3 text-[13px] font-light leading-snug text-[#7A6560]">
            <span className="mt-0.5 shrink-0 text-[11px] font-semibold text-[#C26B7A]">✓</span>
            {b}
          </li>
        ))}
      </ul>

      <button
        onClick={onComprar}
        className="font-sans z-10 mx-7 mb-8 rounded-full border-[1.5px] border-[rgba(123,31,46,0.3)] bg-transparent px-7 py-[14px] text-center text-xs font-semibold uppercase tracking-[0.1em] text-[#7B1E22] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7B1E22] hover:bg-[#7B1E22] hover:text-[#F5EDE8] hover:shadow-[0_8px_28px_rgba(123,31,46,0.25)]"
      >
        Comprar
      </button>
    </div>
  )
}
