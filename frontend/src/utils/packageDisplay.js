function normalizeMojibakeText(value = '') {
  return String(value ?? '')
    .replace(/\u00C2\u00B7/g, '·')
    .replace(/\u00C3\u00A1/g, 'á')
    .replace(/\u00C3\u00A9/g, 'é')
    .replace(/\u00C3\u00AD/g, 'í')
    .replace(/\u00C3\u00B3/g, 'ó')
    .replace(/\u00C3\u00BA/g, 'ú')
    .replace(/\u00C3\u00B1/g, 'ñ')
    .replace(/\u00C3\u0081/g, 'Á')
    .replace(/\u00C3\u0089/g, 'É')
    .replace(/\u00C3\u008D/g, 'Í')
    .replace(/\u00C3\u0093/g, 'Ó')
    .replace(/\u00C3\u009A/g, 'Ú')
    .replace(/\u00C3\u0091/g, 'Ñ')
}

export function getPackageDisplayName(pkg = {}) {
  const name = normalizeMojibakeText(String(pkg?.name ?? '').trim())
  if (name) return name
  const displayName = normalizeMojibakeText(String(pkg?.displayName ?? pkg?.display_name ?? pkg?.nombre ?? '').trim())
  if (displayName) return displayName
  return 'Paquete'
}

export function getPackageCredits(pkg = {}) {
  const credits = Number(pkg?.credits ?? pkg?.creditos ?? pkg?.clases ?? 0)
  return Number.isFinite(credits) ? credits : 0
}

export function formatPackageCreditsLabel(value = 0) {
  const credits = typeof value === 'object' && value !== null ? getPackageCredits(value) : Number(value)
  if (!Number.isFinite(credits) || credits <= 0) return '0 clases'
  return `${credits} ${credits === 1 ? 'clase' : 'clases'}`
}

function resolvePackageDurationDays(value) {
  if (typeof value === 'object' && value !== null) {
    return Number(value?.durationDays ?? value?.duration_days ?? value?.vigencia ?? 0)
  }
  return Number(value)
}

export function formatPackageValidityLabel(value = {}) {
  const days = resolvePackageDurationDays(value)
  if (!Number.isFinite(days) || days <= 0) return 'Válido por definir'
  return `Válido por ${days} ${days === 1 ? 'día' : 'días'}`
}

export function formatPackageShareabilityLabel(pkg = {}) {
  if (!pkg?.isShareable && !pkg?.is_shareable) return ''
  const maxBeneficiaries = Number(pkg?.maxBeneficiaries ?? pkg?.max_beneficiaries ?? 0)
  const count = Number.isFinite(maxBeneficiaries) && maxBeneficiaries > 0 ? maxBeneficiaries : 1
  return `Compartible con hasta ${count} ${count === 1 ? 'beneficiario' : 'beneficiarios'}`
}

export function formatPackagePriceLabel(pkg = {}) {
  const price = Number(pkg?.priceMxn ?? pkg?.price_mxn ?? pkg?.precio ?? 0)
  if (!Number.isFinite(price)) return '$0 MX'
  return `$${price.toLocaleString()} MX`
}

export function getPackageBenefits(pkg = {}) {
  const benefits = Array.isArray(pkg?.benefits)
    ? pkg.benefits
    : Array.isArray(pkg?.beneficios)
      ? pkg.beneficios
      : []

  return benefits
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
}
