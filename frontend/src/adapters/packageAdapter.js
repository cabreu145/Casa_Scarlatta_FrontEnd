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
    isShareable,
    is_shareable: isShareable,
    maxBeneficiaries: Number.isFinite(maxBeneficiaries) ? maxBeneficiaries : 0,
    max_beneficiaries: Number.isFinite(maxBeneficiaries) ? maxBeneficiaries : 0,
    benefits,
    beneficios: benefits,
    description: payload.description ?? payload.descripcion ?? '',
    descripcion: payload.description ?? payload.descripcion ?? '',
    raw: payload,
  }
}

export function mapBackendPackagesToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendPackageToFrontend)
}
