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
  const creditsDisplay = credits >= 999 ? '∞' : credits
  const fallback = [credits > 0 ? `${creditsDisplay} ${credits === 1 ? 'clase' : credits >= 999 ? 'clases ilimitadas' : 'clases'}` : 'Paquete finito']
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

/* ── helpers de promoción ── */
function getPromoMeta(promo) {
  if (!promo) return null
  const tipo = promo.tipo ?? ''
  if (tipo === 'porcentaje' && promo.valor) {
    return {
      badge: `${promo.valor}% OFF`,
      color: 'from-[#C8A24B] to-[#A07830]',
      textColor: '#fff',
      glowColor: 'rgba(200,162,75,0.35)',
    }
  }
  if (tipo === '2x1') {
    return {
      badge: '2 × 1',
      color: 'from-[#4E6855] to-[#354A3A]',
      textColor: '#fff',
      glowColor: 'rgba(78,104,85,0.35)',
    }
  }
  if (tipo === '3x2') {
    return {
      badge: '3 × 2',
      color: 'from-[#4E6855] to-[#354A3A]',
      textColor: '#fff',
      glowColor: 'rgba(78,104,85,0.35)',
    }
  }
  if (tipo === 'clases_gratis' && promo.valor) {
    return {
      badge: `+${promo.valor} gratis`,
      color: 'from-[#5B7BAA] to-[#3D5A80]',
      textColor: '#fff',
      glowColor: 'rgba(91,123,170,0.35)',
    }
  }
  if (tipo === 'monto' && promo.valor) {
    return {
      badge: `−$${promo.valor}`,
      color: 'from-[#C8A24B] to-[#A07830]',
      textColor: '#fff',
      glowColor: 'rgba(200,162,75,0.35)',
    }
  }
  // etiqueta libre
  if (promo.etiqueta) {
    return {
      badge: promo.etiqueta,
      color: 'from-[#C8A24B] to-[#A07830]',
      textColor: '#fff',
      glowColor: 'rgba(200,162,75,0.35)',
    }
  }
  return null
}

function PromoBanner({ meta, featured }) {
  return (
    <div
      className="absolute left-0 right-0 top-0 z-20 flex items-center justify-center gap-2 overflow-hidden"
      style={{ height: 38 }}
    >
      {/* glow de fondo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${meta.glowColor} 50%, transparent 100%)` }}
      />
      {/* borde inferior sutil */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{ background: featured ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)' }}
      />
      <span
        className={`bg-gradient-to-r ${meta.color} rounded-full px-3 py-[3px] text-[9px] font-bold uppercase tracking-[0.22em]`}
        style={{ color: meta.textColor, boxShadow: `0 2px 12px ${meta.glowColor}` }}
      >
        {meta.badge}
      </span>
      {featured ? (
        <span className="text-[10px] font-light tracking-widest text-[rgba(245,237,232,0.55)]">
          Promoción activa
        </span>
      ) : (
        <span className="text-[10px] font-light tracking-widest text-[rgba(123,31,46,0.4)]">
          Promoción activa
        </span>
      )}
    </div>
  )
}

function PaqueteCard({ p, onComprar }) {
  const esFeatured = Boolean(p?.destacado)
  const clases = getPackageCredits(p)
  const esUnlimited = clases >= 999
  const clasesDisplay = esUnlimited ? '∞' : clases > 0 ? clases : '—'
  const clasesLabel = esUnlimited ? 'Ilimitado' : formatPackageCreditsLabel(clases)
  const benefits = buildPackageBenefits(p)
  const priceLabel = formatPackagePriceLabel(p)
  const validityLabel = formatPackageValidityLabel(p)
  const shareableLabel = formatPackageShareabilityLabel(p)
  const displayName = getPackageDisplayName(p)

  // ── Promoción ──
  const promo = p?.promocion ?? p?.promo ?? null
  const promoMeta = getPromoMeta(promo)
  const precioPromo = promo?.precioPromo ?? promo?.precio_promo ?? null
  const promoPriceLabel = precioPromo != null
    ? `$${Number(precioPromo).toLocaleString('es-MX')} MX`
    : null

  if (esFeatured) {
    return (
      <div className="relative flex flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-[#7B1E22] to-[#5C1018] shadow-[0_4px_8px_rgba(0,0,0,0.08),0_20px_48px_rgba(92,16,24,0.35),0_48px_96px_rgba(92,16,24,0.20)] transition-all duration-300 -translate-y-3 md:-translate-y-4 hover:-translate-y-6 hover:shadow-[0_8px_16px_rgba(0,0,0,0.10),0_28px_60px_rgba(92,16,24,0.42),0_56px_100px_rgba(92,16,24,0.25)]">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.07] to-transparent" />

        {promoMeta && <PromoBanner meta={promoMeta} featured />}

        <div className={`absolute right-5 ${promoMeta ? 'top-11' : 'top-5'}`}>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[8px] font-medium uppercase tracking-[0.18em] text-[#F5EDE8] backdrop-blur-sm">
            Más popular
          </span>
        </div>

        <div className={`z-10 flex flex-col items-center gap-1 px-8 pb-8 ${promoMeta ? 'pt-16' : 'pt-11'}`}>
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
        <div className="z-10 flex flex-col px-8 pb-6 pt-1 gap-0.5">
          {promoPriceLabel ? (
            <>
              <span className="font-display text-[22px] italic font-normal text-[rgba(245,237,232,0.38)] line-through decoration-[rgba(245,237,232,0.4)]">
                {priceLabel}
              </span>
              <span className="font-display text-[40px] italic font-semibold text-[#F5EDE8]">
                {promoPriceLabel}
              </span>
            </>
          ) : (
            <span className="font-display text-[40px] italic font-semibold text-[#F5EDE8]">
              {priceLabel}
            </span>
          )}
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
    <div className={`relative flex flex-col overflow-hidden rounded-[28px] border bg-white/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_4px_8px_rgba(0,0,0,0.04),0_16px_40px_rgba(123,31,46,0.12),0_40px_80px_rgba(123,31,46,0.09)] ${promoMeta ? 'border-[rgba(200,162,75,0.35)] shadow-[0_2px_4px_rgba(0,0,0,0.03),0_8px_24px_rgba(200,162,75,0.12),0_24px_56px_rgba(200,162,75,0.08)]' : 'border-[rgba(194,107,122,0.12)] shadow-[0_2px_4px_rgba(0,0,0,0.03),0_8px_24px_rgba(123,31,46,0.07),0_24px_56px_rgba(123,31,46,0.05)]'}`}>
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/60 via-transparent to-[rgba(240,228,224,0.3)]" />

      {promoMeta && <PromoBanner meta={promoMeta} featured={false} />}

      <div className={`z-10 flex flex-col items-center gap-1 px-8 pb-8 ${promoMeta ? 'pt-16' : 'pt-11'}`}>
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
      <div className="z-10 flex flex-col px-8 pb-6 pt-1 gap-0.5">
        {promoPriceLabel ? (
          <>
            <span className="font-display text-[22px] italic font-normal text-[rgba(123,31,46,0.32)] line-through decoration-[rgba(123,31,46,0.35)]">
              {priceLabel}
            </span>
            <span className="font-display text-[40px] italic font-semibold text-[#7B1E22]">
              {promoPriceLabel}
            </span>
          </>
        ) : (
          <span className="font-display text-[40px] italic font-semibold text-[#7B1E22]">
            {priceLabel}
          </span>
        )}
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
