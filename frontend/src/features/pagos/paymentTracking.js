const STORAGE_KEY = 'recent_payment_references'
const LAST_EXTERNAL_REFERENCE_KEY = 'last_payment_external_reference'
const MAX_RECENT_PAYMENTS = 10

function readStorageArray(key) {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStorageArray(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage quota / private mode issues
  }
}

export function readRecentPaymentReferences() {
  return readStorageArray(STORAGE_KEY)
    .filter((item) => item && item.externalReference)
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
}

export function upsertRecentPaymentReference(payload) {
  const externalReference = payload?.externalReference
  if (!externalReference) return []

  const now = new Date().toISOString()
  const existing = readRecentPaymentReferences()
  const nextItem = {
    externalReference,
    packageId: payload.packageId ?? null,
    packageName: payload.packageName ?? null,
    amount: payload.amount ?? null,
    credits: payload.credits ?? null,
    status: payload.status ?? null,
    applied: payload.applied ?? null,
    paymentMethodId: payload.paymentMethodId ?? null,
    paymentTypeId: payload.paymentTypeId ?? null,
    statusDetail: payload.statusDetail ?? null,
    failureReason: payload.failureReason ?? null,
    paymentId: payload.paymentId ?? null,
    preferenceId: payload.preferenceId ?? null,
    merchantOrderId: payload.merchantOrderId ?? null,
    approvedAt: payload.approvedAt ?? null,
    appliedAt: payload.appliedAt ?? null,
    createdAt: payload.createdAt ?? existing.find((item) => item.externalReference === externalReference)?.createdAt ?? now,
    updatedAt: now,
  }

  const next = [nextItem, ...existing.filter((item) => item.externalReference !== externalReference)]
    .slice(0, MAX_RECENT_PAYMENTS)
  writeStorageArray(STORAGE_KEY, next)
  return next
}

export function removeRecentPaymentReference(externalReference) {
  if (!externalReference) return []
  const next = readRecentPaymentReferences().filter((item) => item.externalReference !== externalReference)
  writeStorageArray(STORAGE_KEY, next)
  return next
}

export function saveLastPaymentExternalReference(externalReference) {
  if (typeof window === 'undefined' || !externalReference) return
  try {
    window.sessionStorage.setItem(LAST_EXTERNAL_REFERENCE_KEY, externalReference)
  } catch {
    // ignore
  }
}

export function readLastPaymentExternalReference() {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(LAST_EXTERNAL_REFERENCE_KEY)
  } catch {
    return null
  }
}

