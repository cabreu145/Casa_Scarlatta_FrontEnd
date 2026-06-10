function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeString(value, fallback = '') {
  const raw = String(value ?? '').trim()
  return raw || fallback
}

function normalizeStatus(value, fallback = 'active') {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'inactive' || raw === 'inactivo') return 'inactive'
  if (raw === 'active' || raw === 'activo') return 'active'
  return fallback
}

export function mapBackendProductToFrontend(item = {}) {
  const priceMxn = toNumber(item.price_mxn ?? item.priceMxn ?? item.precio, 0)
  const stock = toNumber(item.stock ?? item.existencia, 0)
  const status = normalizeStatus(item.status ?? (item.is_active === false ? 'inactive' : 'active'))
  const name = normalizeString(item.name ?? item.nombre, 'Producto')
  const categoryId = item.category_id ?? item.categoryId ?? null
  const categoryName = normalizeString(
    item.category_name ?? item.categoryName ?? item.category_display ?? item.category ?? item.categoria,
    'General'
  )

  return {
    id: item.id ?? item.product_id ?? null,
    productId: item.id ?? item.product_id ?? null,
    name,
    nombre: name,
    categoryId,
    category_id: categoryId,
    category: categoryName,
    categoryName,
    categoryNameDisplay: categoryName,
    categoria: categoryName,
    priceMxn,
    price_mxn: priceMxn,
    price: priceMxn,
    precio: priceMxn,
    stock,
    status,
    isActive: status === 'active',
    active: status === 'active',
    activo: status === 'active',
    description: normalizeString(item.description ?? item.descripcion, ''),
    raw: item,
  }
}

export function mapBackendProductsToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendProductToFrontend)
}

function mapSaleItem(item = {}) {
  const quantity = Math.max(1, toNumber(item.quantity ?? 1, 1))
  const unitPriceMxn = toNumber(item.unit_price_mxn ?? item.unitPriceMxn ?? item.price_mxn ?? item.price ?? 0, 0)
  const lineTotalMxn = toNumber(item.line_total_mxn ?? item.lineTotalMxn ?? quantity * unitPriceMxn, quantity * unitPriceMxn)
  return {
    type: normalizeString(item.type, 'product').toLowerCase(),
    itemId: item.item_id ?? item.itemId ?? item.id ?? null,
    id: item.item_id ?? item.itemId ?? item.id ?? null,
    name: normalizeString(item.name ?? item.nombre, 'Item'),
    quantity,
    unitPriceMxn,
    unit_price_mxn: unitPriceMxn,
    lineTotalMxn,
    line_total_mxn: lineTotalMxn,
    beneficiaries: Array.isArray(item.beneficiaries)
      ? item.beneficiaries.map((entry) => normalizeString(entry)).filter(Boolean)
      : [],
    raw: item,
  }
}

export function mapBackendSaleToFrontend(item = {}) {
  const saleId = item.id ?? item.sale_id ?? null
  const customerId = item.customer_id ?? item.customerId ?? null
  const customerName = normalizeString(item.customer_name ?? item.customerName ?? '', '')
  const customerEmail = normalizeString(item.customer_email ?? item.customerEmail ?? '', '')
  return {
    id: saleId,
    saleId,
    folio: normalizeString(item.folio ?? item.code ?? `POS-${String(saleId ?? '').padStart(6, '0')}`),
    status: normalizeString(item.status ?? 'paid', 'paid'),
    customerId,
    customer_id: customerId,
    customerName,
    customer_name: customerName,
    customerEmail,
    customer_email: customerEmail,
    subtotalMxn: toNumber(item.subtotal_mxn ?? item.subtotalMxn ?? 0, 0),
    subtotal_mxn: toNumber(item.subtotal_mxn ?? item.subtotalMxn ?? 0, 0),
    taxRate: toNumber(item.tax_rate ?? item.taxRate ?? 0.16, 0.16),
    tax_rate: toNumber(item.tax_rate ?? item.taxRate ?? 0.16, 0.16),
    taxMxn: toNumber(item.tax_mxn ?? item.taxMxn ?? 0, 0),
    tax_mxn: toNumber(item.tax_mxn ?? item.taxMxn ?? 0, 0),
    totalMxn: toNumber(item.total_mxn ?? item.totalMxn ?? 0, 0),
    total_mxn: toNumber(item.total_mxn ?? item.totalMxn ?? 0, 0),
    paymentMethod: normalizeString(item.payment_method ?? item.paymentMethod ?? '', ''),
    payment_method: normalizeString(item.payment_method ?? item.paymentMethod ?? '', ''),
    createdAt: item.created_at ?? item.createdAt ?? null,
    created_at: item.created_at ?? item.createdAt ?? null,
    ticketUrl: item.ticket_url ?? item.ticketUrl ?? null,
    ticket_url: item.ticket_url ?? item.ticketUrl ?? null,
    ticketPdfUrl: item.ticket_pdf_url ?? item.ticketPdfUrl ?? null,
    ticket_pdf_url: item.ticket_pdf_url ?? item.ticketPdfUrl ?? null,
    ticketImageUrl: item.ticket_image_url ?? item.ticketImageUrl ?? null,
    ticket_image_url: item.ticket_image_url ?? item.ticketImageUrl ?? null,
    publicTicketUrl: item.public_ticket_url ?? item.publicTicketUrl ?? null,
    public_ticket_url: item.public_ticket_url ?? item.publicTicketUrl ?? null,
    publicTicketImageUrl: item.public_ticket_image_url ?? item.publicTicketImageUrl ?? null,
    public_ticket_image_url: item.public_ticket_image_url ?? item.publicTicketImageUrl ?? null,
    items: Array.isArray(item.items) ? item.items.map(mapSaleItem) : [],
    raw: item,
  }
}

export function mapBackendSalesToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendSaleToFrontend)
}

export function resolvePublicTicketImageUrl(sale = {}) {
  return sale.publicTicketImageUrl ?? sale.public_ticket_image_url ?? null
}
