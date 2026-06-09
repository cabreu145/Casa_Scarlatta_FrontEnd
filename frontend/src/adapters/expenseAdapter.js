function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeString(value, fallback = '') {
  const raw = String(value ?? '').trim()
  return raw || fallback
}

function normalizeStatus(value) {
  if (typeof value === 'boolean') return value ? 'active' : 'cancelled'
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw) return 'active'
  if (['cancelled', 'cancelado', 'canceled', 'inactive', 'inactivo'].includes(raw)) return 'cancelled'
  return 'active'
}

function normalizePaymentMethod(value) {
  const raw = normalizeString(value, '').toLowerCase()
  return ['cash', 'card', 'transfer', 'other'].includes(raw) ? raw : 'cash'
}

export function mapBackendExpenseToFrontend(item = {}) {
  const source = item ?? {}
  const status = normalizeStatus(source.status ?? source.estado ?? source.is_active)
  const amountMxn = toNumber(source.amount_mxn ?? source.amountMxn ?? source.monto ?? 0, 0)

  return {
    id: source.id ?? source.expense_id ?? null,
    expenseId: source.id ?? source.expense_id ?? null,
    expenseDate: source.expense_date ?? source.expenseDate ?? source.date ?? source.fecha ?? null,
    category: normalizeString(source.category ?? source.categoria ?? '', ''),
    description: normalizeString(source.description ?? source.descripcion ?? source.concepto ?? '', ''),
    amountMxn,
    amount: amountMxn,
    paymentMethod: normalizePaymentMethod(source.payment_method ?? source.paymentMethod ?? source.metodo_pago ?? source.metodoPago),
    status,
    notes: normalizeString(source.notes ?? source.notas ?? '', ''),
    createdByUserId: source.created_by_user_id ?? source.createdByUserId ?? source.admin_id ?? source.adminId ?? null,
    createdAt: source.created_at ?? source.createdAt ?? null,
    updatedAt: source.updated_at ?? source.updatedAt ?? null,
    cancelledAt: source.cancelled_at ?? source.cancelledAt ?? null,
    cancelledByUserId: source.cancelled_by_user_id ?? source.cancelledByUserId ?? null,
    cancelReason: normalizeString(source.cancel_reason ?? source.cancelReason ?? '', ''),
    isCancelled: status === 'cancelled',
    isActive: status === 'active',
    raw: source,
  }
}

export function mapBackendExpensesToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendExpenseToFrontend)
}
