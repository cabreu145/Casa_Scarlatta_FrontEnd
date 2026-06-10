function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeString(value, fallback = '') {
  const raw = String(value ?? '').trim()
  return raw || fallback
}

function mapIncludedSale(item = {}) {
  return {
    id: item.id ?? item.sale_id ?? null,
    saleId: item.id ?? item.sale_id ?? null,
    folio: normalizeString(item.folio ?? item.code ?? `POS-${String(item.id ?? '').padStart(6, '0')}`),
    customerName: normalizeString(item.customer_name ?? item.customerName ?? '', ''),
    customerEmail: normalizeString(item.customer_email ?? item.customerEmail ?? '', ''),
    paymentMethod: normalizeString(item.payment_method ?? item.paymentMethod ?? '', ''),
    subtotalMxn: toNumber(item.subtotal_mxn ?? item.subtotalMxn ?? 0, 0),
    taxMxn: toNumber(item.tax_mxn ?? item.taxMxn ?? 0, 0),
    totalMxn: toNumber(item.total_mxn ?? item.totalMxn ?? 0, 0),
    createdAt: item.created_at ?? item.createdAt ?? null,
    raw: item,
  }
}

export function mapBackendCashClosingToFrontend(item = {}) {
  const source = item ?? {}
  const includedSales = Array.isArray(source.sales)
    ? source.sales
    : Array.isArray(source.items)
      ? source.items
      : Array.isArray(source.ventas)
        ? source.ventas
        : Array.isArray(source.included_sales)
          ? source.included_sales
          : Array.isArray(source.sales_included)
            ? source.sales_included
            : []

  return {
    id: source.id ?? source.cash_closing_id ?? null,
    cashClosingId: source.id ?? source.cash_closing_id ?? null,
    date: source.date ?? source.fecha ?? null,
    isClosed: Boolean((source.is_closed ?? source.isClosed ?? source.estado === 'cerrado') || source.status === 'closed'),
    salesCount: toNumber(source.sales_count ?? source.salesCount ?? 0, 0),
    subtotalMxn: toNumber(source.subtotal_mxn ?? source.subtotalMxn ?? 0, 0),
    taxMxn: toNumber(source.tax_mxn ?? source.taxMxn ?? 0, 0),
    totalMxn: toNumber(source.total_mxn ?? source.totalMxn ?? 0, 0),
    cashTotalMxn: toNumber(source.cash_total_mxn ?? source.cashTotalMxn ?? 0, 0),
    cardTotalMxn: toNumber(source.card_total_mxn ?? source.cardTotalMxn ?? 0, 0),
    transferTotalMxn: toNumber(source.transfer_total_mxn ?? source.transferTotalMxn ?? 0, 0),
    otherTotalMxn: toNumber(source.other_total_mxn ?? source.otherTotalMxn ?? 0, 0),
    expensesTotalMxn: toNumber(source.expenses_total_mxn ?? source.expensesTotalMxn ?? 0, 0),
    netTotalMxn: toNumber(source.net_total_mxn ?? source.netTotalMxn ?? 0, 0),
    notes: normalizeString(source.notes ?? source.note ?? '', ''),
    createdAt: source.created_at ?? source.createdAt ?? null,
    createdBy: normalizeString(source.created_by ?? source.createdBy ?? '', ''),
    createdByName: normalizeString(source.created_by_name ?? source.createdByName ?? '', ''),
    sales: includedSales.map(mapIncludedSale),
    raw: source,
  }
}

export function mapBackendCashClosingsToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendCashClosingToFrontend)
}
