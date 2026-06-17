function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value
  const raw = String(value ?? '').trim().toLowerCase()
  if (['true', '1', 'si', 'sí', 'on', 'yes'].includes(raw)) return true
  if (['false', '0', 'no', 'off'].includes(raw)) return false
  return fallback
}

function toPositiveInt(value, fallback = null) {
  const n = Number(value)
  if (Number.isInteger(n) && n > 0) return n
  return fallback
}

function toNonNegativeNumber(value, fallback = null) {
  const n = Number(value)
  if (Number.isFinite(n) && n >= 0) return n
  return fallback
}

function normalizeBenefits(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean)
  }
  const raw = String(value ?? '').trim()
  if (!raw) return []
  return raw
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function buildPackageApiPayload(form = {}) {
  const isShareable = toBoolean(form.is_shareable ?? form.isShareable ?? form.compartible, false)
  const limitOneSpotPerOccurrence = toBoolean(
    form.limit_one_spot_per_occurrence ?? form.limitOneSpotPerOccurrence,
    false
  )
  const purchaseOncePerUser = toBoolean(
    form.purchase_once_per_user ?? form.purchaseOncePerUser,
    false
  )
  const maxBeneficiaries = isShareable
    ? toPositiveInt(form.max_beneficiaries ?? form.maxBeneficiaries ?? form.maxParticipantes, null)
    : 0

  return {
    name: String(form.name ?? form.nombre ?? '').trim() || null,
    credits: toPositiveInt(form.credits ?? form.creditos ?? form.clases ?? form.numClases, null),
    price_mxn: toNonNegativeNumber(form.price_mxn ?? form.priceMxn ?? form.precio, null),
    duration_days: toPositiveInt(form.duration_days ?? form.durationDays ?? form.vigencia, null),
    is_active: toBoolean(form.is_active ?? form.isActive ?? form.activo, true),
    is_featured: toBoolean(form.is_featured ?? form.isFeatured ?? form.destacado, false),
    benefits: normalizeBenefits(form.benefits ?? form.beneficios ?? form.descripcion),
    is_shareable: isShareable,
    max_beneficiaries: maxBeneficiaries,
    limit_one_spot_per_occurrence: limitOneSpotPerOccurrence,
    purchase_once_per_user: purchaseOncePerUser,
  }
}

export function validatePackageApiPayload(payload = {}) {
  if (!Number.isInteger(payload.credits) || payload.credits <= 0) return 'Los créditos deben ser mayores a 0.'
  if (!Number.isFinite(payload.price_mxn) || payload.price_mxn < 0) return 'El precio debe ser 0 o mayor.'
  if (!Number.isInteger(payload.duration_days) || payload.duration_days <= 0) return 'La vigencia debe ser mayor a 0.'
  if (typeof payload.is_active !== 'boolean') return 'Estado de paquete inválido.'
  if (typeof payload.is_featured !== 'boolean') return 'Bandera de destacado inválida.'
  if (typeof payload.is_shareable !== 'boolean') return 'Bandera de paquete compartible inválida.'
  if (!Number.isInteger(payload.max_beneficiaries) || payload.max_beneficiaries < 0) return 'Máximo de beneficiarios inválido.'
  if (payload.is_shareable && payload.max_beneficiaries < 1) return 'El paquete compartible requiere al menos 1 beneficiario.'
  if (!payload.is_shareable && payload.max_beneficiaries !== 0) return 'Los paquetes no compartibles deben usar 0 beneficiarios.'
  if (typeof payload.limit_one_spot_per_occurrence !== 'boolean') return 'Bandera de 1 lugar por clase inválida.'
  if (typeof payload.purchase_once_per_user !== 'boolean') return 'Bandera de compra única inválida.'
  if (!Array.isArray(payload.benefits)) return 'Beneficios inválidos.'
  if (payload.benefits.some((item) => typeof item !== 'string')) return 'Beneficios inválidos.'
  return null
}
