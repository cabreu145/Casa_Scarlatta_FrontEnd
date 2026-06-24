const PROMOTION_ERROR_MESSAGES = {
  PROMOTION_NOT_FOUND: 'La promoción no existe.',
  PROMOTION_INACTIVE: 'Esta promoción no está activa.',
  PROMOTION_EXPIRED: 'Esta promoción ha expirado.',
  PROMOTION_NOT_STARTED: 'Esta promoción aún no ha comenzado.',
  PROMOTION_USAGE_LIMIT_REACHED: 'Esta promoción ya no está disponible.',
  PROMOTION_CONFLICT: 'Hay un conflicto con otra promoción activa.',
  PROMOTION_NOT_APPLICABLE_TO_PACKAGE: 'Esta promoción no aplica para este paquete.',
  PROMOTION_NOT_AVAILABLE_FOR_CHANNEL: 'Esta promoción no está disponible para este canal.',
  PROMOTION_FINAL_PRICE_BELOW_MINIMUM: 'El descuento deja el precio por debajo del mínimo permitido.',
  PROMOTION_BENEFICIARY_REQUIRED: 'Esta promoción requiere seleccionar un beneficiario.',
  PROMOTION_BENEFICIARY_INVALID: 'El beneficiario seleccionado no es válido.',
  PROMOTION_REDEMPTION_NOT_FOUND: 'No se encontró el registro de redención de promoción.',
  PROMOTION_REDEMPTION_ALREADY_APPLIED: 'Esta promoción ya fue aplicada.',
  PACKAGE_ALREADY_PURCHASED_ONCE: null,
}

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

  if (code === 'PACKAGE_PAYMENT_ALREADY_PENDING' || raw.includes('PACKAGE_PAYMENT_ALREADY_PENDING')) {
    return raw || 'Ya tienes un pago pendiente para este paquete. Si no deseas continuar con ese metodo de pago, levanta un ticket con administracion para cancelar esa referencia y poder comprar de nuevo.'
  }

  if (Object.prototype.hasOwnProperty.call(PROMOTION_ERROR_MESSAGES, code)) {
    return (PROMOTION_ERROR_MESSAGES[code] ?? raw) || null
  }

  for (const key of Object.keys(PROMOTION_ERROR_MESSAGES)) {
    if (raw.includes(key)) {
      return (PROMOTION_ERROR_MESSAGES[key] ?? raw) || null
    }
  }

  return raw || null
}
