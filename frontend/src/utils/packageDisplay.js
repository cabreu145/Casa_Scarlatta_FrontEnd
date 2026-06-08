export function getPackageDisplayName(pkg = {}) {
  const name = String(pkg?.name ?? '').trim()
  if (name) return name
  const displayName = String(pkg?.displayName ?? pkg?.display_name ?? pkg?.nombre ?? '').trim()
  if (displayName) return displayName
  return 'Paquete'
}

export function getPackageCredits(pkg = {}) {
  const credits = Number(pkg?.credits ?? pkg?.creditos ?? pkg?.clases ?? 0)
  return Number.isFinite(credits) ? credits : 0
}

export function formatPackageValidityLabel(pkg = {}) {
  const days = Number(pkg?.durationDays ?? pkg?.duration_days ?? pkg?.vigencia ?? 0)
  if (!Number.isFinite(days) || days <= 0) return 'Vigencia por definir'
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
