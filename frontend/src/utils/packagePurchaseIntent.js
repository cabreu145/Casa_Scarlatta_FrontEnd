const PENDING_PACKAGE_PURCHASE_ID_KEY = 'pending_package_purchase_id'
const PENDING_PACKAGE_REDIRECT_KEY = 'pending_package_redirect'

export function normalizeInternalRedirect(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || !trimmed.startsWith('/')) return null

  try {
    const url = new URL(trimmed, 'http://local')
    if (!url.pathname.startsWith('/')) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function buildPackagePurchaseRedirect(packageId) {
  const params = new URLSearchParams({ section: 'pagos' })
  if (packageId !== undefined && packageId !== null && String(packageId).trim() !== '') {
    params.set('packageId', String(packageId))
  }
  return `/cliente/dashboard?${params.toString()}`
}

export function savePendingPackagePurchaseIntent(packageId) {
  if (typeof window === 'undefined') return
  if (packageId === undefined || packageId === null || String(packageId).trim() === '') return
  const redirect = buildPackagePurchaseRedirect(packageId)
  localStorage.setItem(PENDING_PACKAGE_PURCHASE_ID_KEY, String(packageId))
  localStorage.setItem(PENDING_PACKAGE_REDIRECT_KEY, redirect)
}

export function readPendingPackagePurchaseIntent() {
  if (typeof window === 'undefined') {
    return { packageId: null, redirect: null }
  }

  const packageId = localStorage.getItem(PENDING_PACKAGE_PURCHASE_ID_KEY)
  const redirect = normalizeInternalRedirect(localStorage.getItem(PENDING_PACKAGE_REDIRECT_KEY))

  return {
    packageId: packageId && String(packageId).trim() !== '' ? packageId : null,
    redirect,
  }
}

export function clearPendingPackagePurchaseIntent() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PENDING_PACKAGE_PURCHASE_ID_KEY)
  localStorage.removeItem(PENDING_PACKAGE_REDIRECT_KEY)
}
