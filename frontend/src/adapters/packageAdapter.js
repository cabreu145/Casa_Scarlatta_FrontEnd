function normalizeActivePromotion(raw) {
  if (!raw || typeof raw !== 'object') return null
  const type = String(raw.type ?? raw.promotion_type ?? '').trim()
  if (!type) return null
  return {
    id: raw.id ?? null,
    type,
    name: String(raw.name ?? '').trim() || null,
    badgeLabel: String(raw.badgeLabel ?? raw.badge_label ?? '').trim() || null,
    discountPercent: raw.discountPercent ?? raw.discount_percent ?? null,
    originalPriceMxn: raw.originalPriceMxn ?? raw.original_price_mxn ?? null,
    discountMxn: raw.discountMxn ?? raw.discount_mxn ?? null,
    finalPriceMxn: raw.finalPriceMxn ?? raw.final_price_mxn ?? null,
    remainingCount: raw.remainingCount ?? raw.remaining_count ?? null,
    bonusPackageId: raw.bonusPackageId ?? raw.bonus_package_id ?? null,
    bonusPackageName: raw.bonusPackageName ?? raw.bonus_package_name ?? null,
    description: String(raw.description ?? '').trim() || null,
    startsAt: raw.startsAt ?? raw.starts_at ?? null,
    endsAt: raw.endsAt ?? raw.ends_at ?? null,
  }
}

export function mapBackendPackageToFrontend(payload = {}) {
  const credits = Number(payload.credits ?? payload.clases ?? 0)
  const priceMxn = Number(payload.price_mxn ?? payload.precio ?? 0)
  const durationDays = Number(payload.duration_days ?? payload.vigencia ?? 0)
  const rawName = String(payload.name ?? payload.nombre ?? '').trim()
  const displayName = String(
    payload.display_name ?? payload.displayName ?? payload.nombre ?? ''
  ).trim() || 'Paquete'
  const benefits = Array.isArray(payload.benefits)
    ? payload.benefits.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
    : Array.isArray(payload.beneficios)
      ? payload.beneficios.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
      : []
  const isShareable = Boolean(payload.is_shareable ?? payload.isShareable ?? false)
  const maxBeneficiaries = Number(payload.max_beneficiaries ?? payload.maxBeneficiaries ?? 0)

  return {
    id: payload.id ?? null,
    name: rawName || null,
    nombre: rawName || '',
    displayName,
    display_name: displayName,
    credits,
    creditos: credits,
    clases: credits,
    priceMxn,
    price_mxn: priceMxn,
    precio: priceMxn,
    durationDays,
    duration_days: durationDays,
    vigencia: payload.vigencia ?? (durationDays > 0 ? `${durationDays} días` : null),
    isActive: payload.is_active ?? payload.isActive ?? true,
    active: payload.is_active ?? payload.isActive ?? true,
    activo: payload.is_active ?? payload.isActive ?? true,
    isFeatured: payload.is_featured ?? payload.isFeatured ?? false,
    featured: payload.is_featured ?? payload.isFeatured ?? false,
    destacado: payload.is_featured ?? payload.isFeatured ?? false,
    limitOneSpotPerOccurrence: Boolean(
      payload.limitOneSpotPerOccurrence ??
      payload.limit_one_spot_per_occurrence ??
      false
    ),
    purchaseOncePerUser: Boolean(
      payload.purchaseOncePerUser ??
      payload.purchase_once_per_user ??
      false
    ),
    isShareable,
    is_shareable: isShareable,
    maxBeneficiaries: Number.isFinite(maxBeneficiaries) ? maxBeneficiaries : 0,
    max_beneficiaries: Number.isFinite(maxBeneficiaries) ? maxBeneficiaries : 0,
    benefits,
    beneficios: benefits,
    description: payload.description ?? payload.descripcion ?? '',
    descripcion: payload.description ?? payload.descripcion ?? '',
    activePromotion: normalizeActivePromotion(
      payload.activePromotion ?? payload.active_promotion ?? null
    ),
    raw: payload,
  }
}

export function mapBackendPackagesToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendPackageToFrontend)
}
