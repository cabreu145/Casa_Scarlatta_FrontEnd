const VALID_PRODUCT_STATUSES = new Set(['active', 'inactive'])
const VALID_PAYMENT_METHODS = new Set(['cash', 'card', 'transfer', 'other'])
const TAX_RATE = 0.16

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeString(value) {
  return String(value ?? '').trim()
}

function normalizeStatus(value) {
  const raw = normalizeString(value).toLowerCase()
  if (raw === 'inactive' || raw === 'inactivo') return 'inactive'
  return 'active'
}

function normalizeBeneficiaries(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeString(entry)).filter(Boolean)
  }
  return normalizeString(value)
    .split(/[\n,;]/)
    .map((entry) => normalizeString(entry))
    .filter(Boolean)
}

export function buildPosProductApiPayload(form = {}) {
  const name = normalizeString(form.name ?? form.nombre)
  const categoryIdRaw = form.category_id ?? form.categoryId ?? form.categoryIdValue ?? form.categoriaId
  const categoryId = Number(categoryIdRaw)
  const categoryName = normalizeString(form.category ?? form.categoria)
  const priceMxn = toNumber(form.price_mxn ?? form.priceMxn ?? form.precio, NaN)
  const stock = toNumber(form.stock, NaN)
  const description = normalizeString(form.description ?? form.descripcion)
  const status = normalizeStatus(form.status ?? form.is_active ?? form.activo)

  return {
    name,
    category_id: Number.isFinite(categoryId) ? categoryId : null,
    category: categoryName || null,
    price_mxn: Number.isFinite(priceMxn) ? priceMxn : 0,
    stock: Number.isFinite(stock) ? stock : 0,
    description: description || null,
    status,
  }
}

export function validatePosProductApiPayload(payload = {}) {
  if (!payload.name) return 'El nombre del producto es obligatorio.'
  const hasCategoryId = Number.isFinite(Number(payload.category_id)) && Number(payload.category_id) > 0
  const hasLegacyCategory = String(payload.category ?? '').trim().length > 0
  if (!hasCategoryId && !hasLegacyCategory) {
    return 'La categoría del producto es obligatoria.'
  }
  if (!Number.isFinite(Number(payload.price_mxn)) || Number(payload.price_mxn) < 0) {
    return 'El precio debe ser 0 o mayor.'
  }
  if (!Number.isFinite(Number(payload.stock)) || Number(payload.stock) < 0) {
    return 'El stock debe ser 0 o mayor.'
  }
  if (!VALID_PRODUCT_STATUSES.has(String(payload.status ?? '').trim().toLowerCase())) {
    return 'Estado de producto inválido.'
  }
  return null
}

export function buildPosSaleApiPayload({ customerId, items = [], paymentMethod, subtotalMxn, taxMxn, totalMxn, notes } = {}) {
  const normalizedItems = (Array.isArray(items) ? items : []).map((item) => {
    const type = String(item.type ?? item.kind ?? 'product').trim().toLowerCase() === 'package' ? 'package' : 'product'
    const beneficiaries = type === 'package'
      ? normalizeBeneficiaries(item.beneficiaries ?? item.beneficiaryEmails ?? item.beneficiariesText)
      : []

    return {
      type,
      id: Number(item.id ?? item.itemId ?? item.productId ?? item.packageId),
      quantity: Math.max(1, Number(item.quantity ?? 1) || 1),
      unit_price_mxn: Number(item.unit_price_mxn ?? item.unitPriceMxn ?? item.priceMxn ?? item.price ?? 0),
      ...(type === 'package' ? { beneficiaries } : {}),
    }
  })

  const computedSubtotal = normalizedItems.reduce(
    (sum, item) => sum + Number(item.quantity ?? 1) * Number(item.unit_price_mxn ?? 0),
    0
  )
  const subtotal = Number.isFinite(Number(subtotalMxn)) ? Number(subtotalMxn) : computedSubtotal
  const tax = Number.isFinite(Number(taxMxn)) ? Number(taxMxn) : Math.round(subtotal * TAX_RATE * 100) / 100
  const total = Number.isFinite(Number(totalMxn)) ? Number(totalMxn) : Math.round((subtotal + tax) * 100) / 100

  return {
    customer_id: customerId ? Number(customerId) : null,
    items: normalizedItems,
    payment_method: normalizeString(paymentMethod).toLowerCase(),
    subtotal_mxn: Math.round(subtotal * 100) / 100,
    tax_rate: TAX_RATE,
    tax_mxn: Math.round(tax * 100) / 100,
    total_mxn: Math.round(total * 100) / 100,
    notes: normalizeString(notes) || null,
  }
}

export function validatePosSaleApiPayload(payload = {}) {
  if (!Array.isArray(payload.items) || payload.items.length === 0) return 'La venta debe tener al menos un item.'
  if (!payload.payment_method || !VALID_PAYMENT_METHODS.has(String(payload.payment_method).trim().toLowerCase())) {
    return 'Método de pago inválido.'
  }
  if (!Number.isFinite(Number(payload.subtotal_mxn)) || Number(payload.subtotal_mxn) < 0) {
    return 'Subtotal de venta inválido.'
  }
  if (!Number.isFinite(Number(payload.tax_mxn)) || Number(payload.tax_mxn) < 0) {
    return 'IVA de venta inválido.'
  }
  if (!Number.isFinite(Number(payload.total_mxn)) || Number(payload.total_mxn) <= 0) {
    return 'Total de venta inválido.'
  }
  const expectedTotal = Math.round((Number(payload.subtotal_mxn) + Number(payload.tax_mxn)) * 100) / 100
  if (Math.abs(expectedTotal - Number(payload.total_mxn)) > 0.01) {
    return 'Total de venta no coincide con subtotal e IVA.'
  }
  const hasPackage = payload.items.some((item) => String(item.type ?? '').toLowerCase() === 'package')
  if (hasPackage && !payload.customer_id) return 'Selecciona cliente para vender paquete.'
  return null
}
