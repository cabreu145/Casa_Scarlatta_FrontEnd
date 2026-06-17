export function getPackageAlreadyPurchasedMessage({ admin = false } = {}) {
  return admin
    ? 'Este cliente ya adquirió este paquete anteriormente.'
    : 'Este paquete solo puede adquirirse una vez por cliente.'
}

export function resolvePackagePurchaseErrorMessage(error, { admin = false } = {}) {
  const code = String(error?.code ?? error?.error?.code ?? '').trim()
  const raw = String(error?.message ?? error?.error?.message ?? '').trim()

  if (code === 'PACKAGE_ALREADY_PURCHASED_ONCE' || raw.includes('PACKAGE_ALREADY_PURCHASED_ONCE')) {
    return getPackageAlreadyPurchasedMessage({ admin })
  }

  return raw || null
}
