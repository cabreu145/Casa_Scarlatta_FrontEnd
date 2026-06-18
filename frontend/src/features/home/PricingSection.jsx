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
  const creditsDisplay = credits >= 450 ? '∞' : credits
  const fallback = [credits > 0 ? `${creditsDisplay} ${credits === 1 ? 'clase' : credits >= 450 ? 'clases ilimitadas' : 'clases'}` : 'Paquete finito']
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

  const paquetes = useMemo(() => {
    const source = useApiPackages ? apiPackages : fallbackPackages
    return source.filter((pkg) => !/\(interno\)/i.test(pkg?.nombre ?? pkg?.name ?? ''))
  }, [apiPackages, fallbackPackages])

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

  const handleComprar = (pkg, { noPromo = false } = {}) => {
    if (authLoading) {
      toast.error('Espera a que cargue tu sesión.')
      return
    }

    const packageId = pkg?.id ?? null
    const base = buildPackagePurchaseRedirect(packageId)
    const redirect = noPromo ? `${base}&noPromo=true` : base

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
              onComprarSinPromo={() => handleComprar(p, { noPromo: true })}
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
        <div className="mt-4 flex justify-center">
          <button
            className="text-xs text-[#A08878] underline underline-offset-4 transition-opacity hover:opacity-70"
            onClick={() => navigate('/terminos-y-condiciones')}
          >
            Términos y condiciones
          </button>
        </div>
      </div>
    </section>
  )
}

/* ── helpers de promoción ── */

function getActivePromoMeta(activePromo) {
  if (!activePromo) return null
  const badge = activePromo.badgeLabel || null
  if (!badge) return null
  if (activePromo.type === 'buy_one_get_one') {
    return {
      badge,
      color: 'from-[#4E6855] to-[#354A3A]',
      textColor: '#fff',
      glowColor: 'rgba(78,104,85,0.35)',
    }
  }
  return {
    badge,
    color: 'from-[#C8A24B] to-[#A07830]',
    textColor: '#fff',
    glowColor: 'rgba(200,162,75,0.35)',
  }
}

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

/* ── Banner tira (dorada para % OFF, verde olivo para BOGO) ── */
function PromoBanner({ meta, isBogo }) {
  const bg = isBogo
    ? 'linear-gradient(90deg, #354A3A 0%, #4E6855 35%, #6B8F72 55%, #4E6855 75%, #354A3A 100%)'
    : 'linear-gradient(90deg, #B8892A 0%, #D4A843 35%, #F0CC6A 55%, #D4A843 75%, #B8892A 100%)'
  const border = isBogo ? '1px solid rgba(78,104,85,0.5)' : '1px solid rgba(200,162,75,0.5)'
  return (
    <div
      className="relative z-20 flex items-center justify-center gap-3 overflow-hidden"
      style={{ background: bg, borderBottom: border, padding: '10px 20px' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.20) 50%, transparent 70%)' }}
      />
      <span className="text-[13px] font-black uppercase tracking-[0.25em] text-white drop-shadow">
        {meta.badge}
      </span>
      <span className="h-3 w-px bg-white/50" />
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/85">
        Promoción activa
      </span>
    </div>
  )
}

/* ── Cinta diagonal en esquina (para featured + % OFF) ── */
function CornerRibbon({ badge }) {
  return (
    <div className="pointer-events-none absolute left-0 top-0 z-30 h-[110px] w-[110px] overflow-hidden">
      <div
        className="absolute flex items-center justify-center gap-1 font-black uppercase text-white"
        style={{
          top: 28,
          left: -30,
          width: 138,
          padding: '9px 0',
          fontSize: 12,
          letterSpacing: '0.08em',
          background: 'linear-gradient(90deg, #B8892A, #D4A843, #F0CC6A, #D4A843, #B8892A)',
          transform: 'rotate(-45deg)',
          boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
        }}
      >
        {badge} ⚡
      </div>
    </div>
  )
}

/* ── Callout regalo 2×1 ── */
function BogoCallout() {
  return (
    <div className="z-10 mx-7 mb-2 flex items-center justify-center">
      <span className="text-[28px] leading-none">🎁</span>
    </div>
  )
}

/* ── Pill "Ahorra $X MXN" ── */
function SavingsPill({ amount }) {
  const fmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(Number(amount))
  return (
    <div className="z-10 mx-7 mb-2 flex items-center justify-center gap-2 rounded-full px-4 py-[7px]"
      style={{
        background: 'linear-gradient(90deg, #B8892A, #D4A843, #F0CC6A, #D4A843, #B8892A)',
        boxShadow: '0 4px 20px rgba(200,162,75,0.45)',
      }}
    >
      <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white">
        Ahorra ${fmt} MXN
      </span>
    </div>
  )
}

/* ── Barra de confianza inferior ── */
function TrustBar({ featured }) {
  const items = [
    { icon: '🛡️', title: 'Compra segura', sub: 'Tus datos protegidos' },
    { icon: '🪷', title: 'Calidad premium', sub: 'Instructores certificados' },
    { icon: '🔄', title: 'Flexibilidad', sub: 'Usa tus clases cuando quieras' },
  ]
  return (
    <div
      className="z-10 grid grid-cols-3"
      style={{ borderTop: featured ? '1px solid rgba(245,237,232,0.08)' : '1px solid rgba(123,31,46,0.08)' }}
    >
      {items.map((item, i) => (
        <div
          key={item.title}
          className="flex flex-col items-center gap-1 px-2 py-4 text-center"
          style={i < 2 ? { borderRight: featured ? '1px solid rgba(245,237,232,0.08)' : '1px solid rgba(123,31,46,0.08)' } : {}}
        >
          <span className="text-base leading-none">{item.icon}</span>
          <span
            className="text-[8px] font-bold uppercase tracking-[0.12em] leading-tight"
            style={{ color: featured ? 'rgba(240,204,106,0.85)' : '#A07830' }}
          >
            {item.title}
          </span>
          <span
            className="text-[8px] leading-tight"
            style={{ color: featured ? 'rgba(245,237,232,0.40)' : 'rgba(123,31,46,0.4)' }}
          >
            {item.sub}
          </span>
        </div>
      ))}
    </div>
  )
}

function PaqueteCard({ p, onComprar, onComprarSinPromo }) {
  const esFeatured = Boolean(p?.destacado)
  const clases = getPackageCredits(p)
  const esUnlimited = clases >= 450
  const clasesDisplay = esUnlimited ? '∞' : clases > 0 ? clases : '—'
  const benefits = buildPackageBenefits(p)
  const priceLabel = formatPackagePriceLabel(p)
  const shareableLabel = formatPackageShareabilityLabel(p)
  const displayName = getPackageDisplayName(p)

  const activePromo = p?.activePromotion ?? null
  const legacyPromo = p?.promocion ?? p?.promo ?? null
  const promoMeta = getActivePromoMeta(activePromo) ?? getPromoMeta(legacyPromo)

  const isBogo = activePromo?.type === 'buy_one_get_one'
  const precioPromoNum = isBogo
    ? null
    : (activePromo?.finalPriceMxn ?? legacyPromo?.precioPromo ?? legacyPromo?.precio_promo ?? null)
  const promoPriceLabel = precioPromoNum != null
    ? `$${Number(precioPromoNum).toLocaleString('es-MX', { maximumFractionDigits: 2 })} MXN`
    : null
  const priceLabelMxn = priceLabel ?? ''

  const remainingCount = activePromo?.remainingCount ?? null
  const isDiscountPromo = !isBogo && !!promoMeta
  const hasSavings = isDiscountPromo && activePromo?.discountMxn != null

  /* ── FEATURED (oscuro) ── */
  if (esFeatured) {
    return (
      <div className="relative flex flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-[#7B1E22] to-[#4A0E10] shadow-[0_4px_8px_rgba(0,0,0,0.08),0_16px_40px_rgba(92,16,24,0.30),0_32px_64px_rgba(92,16,24,0.18)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(0,0,0,0.12),0_24px_56px_rgba(92,16,24,0.38)]">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.06] to-transparent" />

        {/* Cinta diagonal si hay % OFF — absolute, sin impacto en flujo */}
        {promoMeta && isDiscountPromo && <CornerRibbon badge={promoMeta.badge} />}
        {promoMeta && isBogo && <PromoBanner meta={promoMeta} isBogo />}

        {/* Badges absolutos: sin impacto en altura */}
        <div className="absolute right-4 top-4 z-30 flex flex-col items-end gap-1">
          {promoMeta && isDiscountPromo && (
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[rgba(240,204,106,0.80)]">
              Promoción activa
            </span>
          )}
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[7px] font-medium uppercase tracking-[0.16em] text-[#F5EDE8] backdrop-blur-sm">
            Más popular
          </span>
        </div>

        {/* Número + label — mismo pt siempre (banner BOGO ya aporta su propio alto) */}
        <div className={`z-10 flex flex-col items-center gap-1 px-8 pb-4 ${promoMeta && isBogo ? 'pt-4' : 'pt-8'}`}>
          <span className="font-display text-[clamp(80px,10vw,108px)] font-light italic leading-none tracking-tight text-[#F5EDE8]">
            {clasesDisplay}
          </span>
          <span className="font-sans text-[10px] font-normal uppercase tracking-[0.22em] text-[rgba(245,237,232,0.5)]">
            {esUnlimited ? 'Ilimitado' : `${clases} clases`}
          </span>
        </div>

        <div className="z-10 mx-7 h-px bg-gradient-to-r from-transparent via-[rgba(245,237,232,0.15)] to-transparent" />

        {/* Nombre + precio */}
        <div className={`z-10 px-8 pb-1 ${promoMeta ? 'pt-4' : 'pt-7'}`}>
          <p className="font-display text-xl font-medium tracking-wide text-[rgba(245,237,232,0.9)]">
            {displayName}
          </p>
        </div>
        <div className="z-10 flex flex-col px-8 pb-2 pt-1">
          {promoPriceLabel ? (
            <>
              <span className="font-sans text-[13px] font-normal text-[rgba(245,237,232,0.32)] line-through leading-tight">
                {priceLabelMxn}
              </span>
              <span
                className="font-display text-[40px] italic font-semibold leading-tight"
                style={{
                  background: 'linear-gradient(135deg, #E8C86A 0%, #F5E09A 45%, #C8A24B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {promoPriceLabel}
              </span>
            </>
          ) : (
            <span className="font-display text-[40px] italic font-semibold text-[#F5EDE8]">
              {priceLabelMxn}
            </span>
          )}
        </div>

        {isBogo && <BogoCallout />}
        {hasSavings && <SavingsPill amount={activePromo.discountMxn} />}

        {/* Beneficios */}
        <ul className={`z-10 flex flex-1 flex-col gap-2 px-8 ${promoMeta ? 'mb-5' : 'mb-8'}`}>
          {remainingCount != null && remainingCount > 0 && remainingCount <= 10 && (
            <li className="font-sans flex items-start gap-3 text-[13px] font-bold leading-snug"
              style={{ color: remainingCount <= 5 ? '#ff6b6b' : 'rgba(245,165,100,0.9)' }}>
              <span className="mt-0.5 shrink-0">{remainingCount <= 5 ? '🔴' : '⚠️'}</span>
              ¡Solo quedan {remainingCount} disponibles!
            </li>
          )}
          {remainingCount === 0 && promoMeta && (
            <li className="font-sans flex items-start gap-3 text-[13px] font-bold leading-snug text-[#ff6b6b]">
              <span className="mt-0.5 shrink-0">🔴</span>
              Promoción agotada
            </li>
          )}
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

        {/* Botón */}
        {promoMeta ? (
          <div className="z-10 mx-7 mb-5 flex flex-col gap-2">
            <button
              onClick={onComprar}
              disabled={remainingCount === 0}
              className="font-sans flex items-center justify-center gap-2 rounded-full py-[14px] text-center text-xs font-black uppercase tracking-[0.18em] text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                background: isBogo
                  ? 'linear-gradient(90deg, #2D4A33, #4E6855, #6B8F72, #4E6855, #2D4A33)'
                  : 'linear-gradient(90deg, #B8892A, #D4A843, #F0CC6A, #D4A843, #B8892A)',
                boxShadow: isBogo
                  ? '0 4px 20px rgba(78,104,85,0.45)'
                  : '0 4px 20px rgba(200,162,75,0.45)',
              }}
            >
              Comprar ahora <span className="text-sm leading-none">→</span>
            </button>
            <button
              onClick={onComprarSinPromo}
              className="font-sans rounded-full border border-[rgba(245,237,232,0.35)] bg-transparent py-[11px] text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(245,237,232,0.7)] transition-all duration-300 hover:border-[#F5EDE8] hover:text-[#F5EDE8]"
            >
              Comprar al precio regular →
            </button>
          </div>
        ) : (
          <button
            onClick={onComprar}
            className="font-sans z-10 mx-7 mb-8 rounded-full border border-[rgba(245,237,232,0.35)] bg-[rgba(245,237,232,0.12)] py-[14px] text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#F5EDE8] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F5EDE8] hover:bg-[#F5EDE8] hover:text-[#7B1E22]"
          >
            Comprar
          </button>
        )}

      </div>
    )
  }

  /* ── REGULAR (claro) ── */
  return (
    <div className={`relative flex flex-col overflow-hidden rounded-[28px] border bg-white/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:scale-[1.015] ${promoMeta ? 'border-[rgba(200,162,75,0.40)] shadow-[0_2px_4px_rgba(0,0,0,0.03),0_10px_28px_rgba(200,162,75,0.15),0_28px_60px_rgba(200,162,75,0.10)]' : 'border-[rgba(194,107,122,0.12)] shadow-[0_2px_4px_rgba(0,0,0,0.03),0_8px_24px_rgba(123,31,46,0.07),0_24px_56px_rgba(123,31,46,0.05)]'}`}>
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/70 via-transparent to-[rgba(240,228,218,0.25)]" />

      {promoMeta && <PromoBanner meta={promoMeta} isBogo={isBogo} />}

      {/* Número + label */}
      <div className={`z-10 flex flex-col items-center gap-1 px-8 pb-4 ${promoMeta ? 'pt-3' : 'pt-8'}`}>
        <span className="font-display text-[clamp(80px,10vw,108px)] font-light italic leading-none tracking-tight text-[#7B1E22]">
          {clasesDisplay}
        </span>
        <span className="font-sans text-[10px] font-normal uppercase tracking-[0.22em] text-[rgba(123,31,46,0.4)]">
          {esUnlimited ? 'Ilimitado' : `${clases} clases`}
        </span>
      </div>

      <div className="z-10 mx-7 h-px bg-gradient-to-r from-transparent via-[rgba(123,31,46,0.1)] to-transparent" />

      {/* Nombre + precio */}
      <div className={`z-10 px-8 pb-1 ${promoMeta ? 'pt-4' : 'pt-7'}`}>
        <p className="font-display text-xl font-medium tracking-wide text-[#3D1A20]">
          {displayName}
        </p>
      </div>
      <div className="z-10 flex flex-col px-8 pb-2 pt-1">
        {promoPriceLabel ? (
          <>
            <span className="font-sans text-[13px] font-normal text-[rgba(123,31,46,0.30)] line-through leading-tight">
              {priceLabelMxn}
            </span>
            <span className="font-display text-[40px] italic font-semibold text-[#7B1E22] leading-tight">
              {promoPriceLabel}
            </span>
          </>
        ) : (
          <span className="font-display text-[40px] italic font-semibold text-[#7B1E22]">
            {priceLabelMxn}
          </span>
        )}
      </div>

      {isBogo && <BogoCallout />}
      {hasSavings && <SavingsPill amount={activePromo.discountMxn} />}

      {/* Beneficios */}
      <ul className={`z-10 flex flex-1 flex-col gap-2 px-8 ${promoMeta ? 'mb-5' : 'mb-8'}`}>
        {remainingCount != null && remainingCount > 0 && remainingCount <= 10 && (
          <li className="font-sans flex items-start gap-3 text-[13px] font-bold leading-snug"
            style={{ color: remainingCount <= 5 ? '#C0392B' : '#A07830' }}>
            <span className="mt-0.5 shrink-0">{remainingCount <= 5 ? '🔴' : '⚠️'}</span>
            ¡Solo quedan {remainingCount} disponibles!
          </li>
        )}
        {remainingCount === 0 && promoMeta && (
          <li className="font-sans flex items-start gap-3 text-[13px] font-bold leading-snug text-[#C0392B]">
            <span className="mt-0.5 shrink-0">🔴</span>
            Promoción agotada
          </li>
        )}
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

      {/* Botón */}
      {promoMeta ? (
        <div className="z-10 mx-7 mb-5 flex flex-col gap-2">
          <button
            onClick={onComprar}
            disabled={remainingCount === 0}
            className="font-sans flex items-center justify-center gap-2 rounded-full py-[14px] text-center text-xs font-black uppercase tracking-[0.18em] text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              background: isBogo
                ? 'linear-gradient(90deg, #2D4A33, #4E6855, #6B8F72, #4E6855, #2D4A33)'
                : 'linear-gradient(90deg, #B8892A, #D4A843, #F0CC6A, #D4A843, #B8892A)',
              boxShadow: isBogo
                ? '0 4px 20px rgba(78,104,85,0.45)'
                : '0 4px 20px rgba(200,162,75,0.45)',
            }}
          >
            Comprar ahora <span className="text-sm leading-none">→</span>
          </button>
          <button
            onClick={onComprarSinPromo}
            className="font-sans rounded-full border-[1.5px] border-[rgba(123,31,46,0.3)] bg-transparent py-[11px] text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7B5060] transition-all duration-300 hover:border-[#7B1E22] hover:text-[#7B1E22]"
          >
            Comprar al precio regular →
          </button>
        </div>
      ) : (
        <button
          onClick={onComprar}
          className="font-sans z-10 mx-7 mb-8 rounded-full border-[1.5px] border-[rgba(123,31,46,0.3)] bg-transparent py-[14px] text-center text-xs font-semibold uppercase tracking-[0.1em] text-[#7B1E22] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7B1E22] hover:bg-[#7B1E22] hover:text-[#F5EDE8]"
        >
          Comprar
        </button>
      )}

    </div>
  )
}
