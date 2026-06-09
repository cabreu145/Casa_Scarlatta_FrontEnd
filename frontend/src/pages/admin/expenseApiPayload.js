const ALLOWED_PAYMENT_METHODS = new Set(['cash', 'card', 'transfer', 'other'])

function normalizeString(value) {
  return String(value ?? '').trim()
}

function normalizePaymentMethod(value) {
  const raw = normalizeString(value).toLowerCase()
  if (ALLOWED_PAYMENT_METHODS.has(raw)) return raw
  return 'cash'
}

function normalizeAmount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : NaN
}

export function buildExpenseApiPayload(form = {}) {
  const expenseDate = normalizeString(form.expenseDate ?? form.expense_date ?? form.date ?? form.fecha)
  const category = normalizeString(form.category ?? form.categoria)
  const description = normalizeString(form.description ?? form.descripcion ?? form.concepto)
  const amountMxn = normalizeAmount(form.amountMxn ?? form.amount_mxn ?? form.amount ?? form.monto)
  const paymentMethod = normalizePaymentMethod(form.paymentMethod ?? form.payment_method ?? form.metodoPago ?? form.metodo_pago)
  const notes = normalizeString(form.notes ?? form.notas)

  return {
    expense_date: expenseDate || null,
    category: category || null,
    description: description || null,
    amount_mxn: amountMxn,
    payment_method: paymentMethod,
    ...(notes ? { notes } : {}),
  }
}

export function validateExpenseApiPayload(payload = {}) {
  if (!String(payload.expense_date ?? '').trim()) return 'La fecha es obligatoria.'
  if (!String(payload.category ?? '').trim()) return 'La categoría es obligatoria.'
  if (!String(payload.description ?? '').trim()) return 'La descripción es obligatoria.'
  const amount = Number(payload.amount_mxn)
  if (!Number.isFinite(amount) || amount <= 0) return 'El monto debe ser mayor a cero.'
  if (!ALLOWED_PAYMENT_METHODS.has(String(payload.payment_method ?? '').trim().toLowerCase())) {
    return 'Método de pago inválido.'
  }
  return null
}

export const EXPENSE_CATEGORY_OPTIONS = [
  'renta',
  'nomina',
  'insumos',
  'mantenimiento',
  'limpieza',
  'marketing',
  'servicios',
  'otros',
]

export const EXPENSE_PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'other', label: 'Otro' },
]

