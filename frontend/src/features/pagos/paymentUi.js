export function getPaymentSupportMessage(statusData = {}) {
  const paymentMethodId = String(statusData.paymentMethodId ?? '').toLowerCase()
  const paymentTypeId = String(statusData.paymentTypeId ?? '').toLowerCase()
  const paymentMethod = String(statusData.paymentMethod ?? '').toLowerCase()
  const paymentType = String(statusData.paymentType ?? '').toLowerCase()
  const fingerprint = [paymentMethodId, paymentTypeId, paymentMethod, paymentType].join(' ')

  if (fingerprint.includes('oxxo') || fingerprint.includes('ticket')) {
    return 'Si pagaste en OXXO o tienda autorizada, la acreditación puede tardar de 1 a 2 días hábiles.'
  }
  if (
    fingerprint.includes('spei') ||
    fingerprint.includes('bank_transfer') ||
    fingerprint.includes('transfer') ||
    fingerprint.includes('cash')
  ) {
    return 'Si pagaste por transferencia, la acreditación puede tardar hasta que Mercado Pago confirme la operación.'
  }
  if (
    fingerprint.includes('7eleven') ||
    fingerprint.includes('seven eleven') ||
    fingerprint.includes('circle_k') ||
    fingerprint.includes('soriana') ||
    fingerprint.includes('extra') ||
    fingerprint.includes('calimax') ||
    fingerprint.includes('bbva') ||
    fingerprint.includes('santander')
  ) {
    return 'Si pagaste en tienda autorizada, la acreditación puede tardar entre minutos y horas, según confirmación de Mercado Pago.'
  }
  return 'Este proceso puede tardar unos minutos u horas, dependiendo del método de pago.'
}

export function getFriendlyPaymentState(statusData = {}) {
  const status = String(statusData.status ?? '').toLowerCase()
  const applied = Boolean(statusData.applied)

  if (status === 'approved' && applied) return 'Acreditado'
  if (status === 'approved' && !applied) return 'Aprobado, actualizando créditos'
  if (status === 'pending' || status === 'in_process') return 'Pendiente de acreditación'
  if (status === 'created') return 'Esperando confirmación'
  if (status === 'rejected' || status === 'failed' || status === 'cancelled') return 'No procesado'
  return 'En validación'
}

export function resolvePaymentUiState({ statusData = {}, routeKind = 'unknown', returnParams = {} } = {}) {
  const safeStatusData = statusData ?? {}
  const status = String(safeStatusData.status ?? '').toLowerCase()
  const applied = Boolean(safeStatusData.applied)
  const failedByProviderReturn =
    routeKind === 'failure' &&
    (returnParams.paymentId === null || returnParams.paymentId === undefined || returnParams.paymentId === '' || returnParams.paymentId === 'null') &&
    (
      returnParams.paymentStatus === 'failed' ||
      returnParams.paymentStatusDetail === 'payment_creation_failed' ||
      returnParams.collectionStatus === 'null' ||
      returnParams.status === 'null'
    )

  if (status === 'approved' && applied) {
    return {
      tone: 'success',
      title: 'Pago aprobado',
      message: 'Tus créditos fueron actualizados correctamente.',
      statusLabel: getFriendlyPaymentState(safeStatusData),
      allowPolling: false,
      allowManualRefresh: false,
      canRetry: false,
      canRedirectToDashboard: true,
    }
  }

  if (status === 'approved' && !applied) {
    return {
      tone: 'info',
      title: 'Pago aprobado, actualizando créditos',
      message: 'Mercado Pago ya aprobó tu pago. Estamos terminando de actualizar tus créditos. Verifica nuevamente en unos segundos.',
      statusLabel: getFriendlyPaymentState(safeStatusData),
      allowPolling: true,
      allowManualRefresh: true,
      canRetry: false,
      canRedirectToDashboard: false,
    }
  }

  if (status === 'pending' || status === 'in_process') {
    return {
      tone: 'info',
      title: 'Pago pendiente de acreditación',
      message: 'Recibimos tu solicitud de pago. Tus créditos se acreditarán automáticamente cuando Mercado Pago confirme el pago.',
      statusLabel: getFriendlyPaymentState(safeStatusData),
      supportMessage: getPaymentSupportMessage(statusData),
      allowPolling: true,
      allowManualRefresh: true,
      canRetry: false,
      canRedirectToDashboard: false,
    }
  }

  if (status === 'created' && failedByProviderReturn) {
    return {
      tone: 'danger',
      title: 'No pudimos confirmar tu pago',
      message: 'Mercado Pago no pudo procesar esta operación. Tus créditos no fueron modificados.',
      statusLabel: getFriendlyPaymentState(safeStatusData),
      allowPolling: false,
      allowManualRefresh: true,
      canRetry: true,
      canRedirectToDashboard: false,
    }
  }

  if (status === 'created') {
    return {
      tone: 'info',
      title: 'Pago creado, esperando confirmación',
      message: 'Tu checkout fue creado correctamente. Si ya realizaste el pago, puedes verificar el estado más tarde.',
      statusLabel: getFriendlyPaymentState(safeStatusData),
      allowPolling: true,
      allowManualRefresh: true,
      canRetry: false,
      canRedirectToDashboard: false,
    }
  }

  if (status === 'rejected' || status === 'failed' || status === 'cancelled') {
    return {
      tone: 'danger',
      title: 'No pudimos confirmar tu pago',
      message: 'Mercado Pago no pudo procesar esta operación. Tus créditos no fueron modificados.',
      statusLabel: getFriendlyPaymentState(safeStatusData),
      allowPolling: false,
      allowManualRefresh: false,
      canRetry: true,
      canRedirectToDashboard: false,
    }
  }

  return {
    tone: 'info',
    title: 'Estamos consultando el estado real de tu pago.',
    message: '',
    statusLabel: getFriendlyPaymentState(safeStatusData),
    allowPolling: false,
    allowManualRefresh: true,
    canRetry: false,
    canRedirectToDashboard: false,
  }
}

