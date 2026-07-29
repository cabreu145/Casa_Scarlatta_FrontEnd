function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toNullableNumber(value) {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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

function mapIncludedExpense(item = {}) {
  return {
    id: item.id ?? item.expense_id ?? null,
    expenseId: item.id ?? item.expense_id ?? null,
    category: normalizeString(item.category ?? '', ''),
    description: normalizeString(item.description ?? '', ''),
    paymentMethod: normalizeString(item.payment_method ?? item.paymentMethod ?? '', ''),
    amountMxn: toNumber(item.amount_mxn ?? item.amountMxn ?? 0, 0),
    expenseDate: item.expense_date ?? item.expenseDate ?? null,
    createdAt: item.created_at ?? item.createdAt ?? null,
    raw: item,
  }
}

export function normalizeCashClosing(raw = {}) {
  const source = raw ?? {}
  return {
    id: source.id,
    date: source.date ?? source.closure_date ?? source.closing_date ?? null,
    shiftKey: source.shiftKey ?? source.shift_key ?? 'dia_completo',
    shiftLabel: source.shiftLabel ?? source.shift_label ?? 'Día completo',
    shiftStartAt: source.shiftStartAt ?? source.shift_start_at ?? null,
    shiftEndAt: source.shiftEndAt ?? source.shift_end_at ?? null,
    status: source.status ?? null,
    isOpen: source.isOpen ?? source.is_open ?? source.status === 'open',
    isClosed: source.isClosed ?? source.is_closed ?? source.status === 'closed',
    openingCashMxn: toNumber(source.opening_cash_mxn ?? source.openingCashMxn ?? 0),
    cashTotalMxn: toNumber(source.cash_total_mxn ?? source.cashTotalMxn ?? 0),
    cardTotalMxn: toNumber(source.card_total_mxn ?? source.cardTotalMxn ?? 0),
    transferTotalMxn: toNumber(source.transfer_total_mxn ?? source.transferTotalMxn ?? 0),
    otherTotalMxn: toNumber(source.other_total_mxn ?? source.otherTotalMxn ?? 0),
    expensesTotalMxn: toNumber(source.expenses_total_mxn ?? source.expensesTotalMxn ?? 0),
    cashOutflowsMxn: toNumber(source.cash_outflows_mxn ?? source.cashOutflowsMxn ?? 0),
    expectedCashMxn: toNumber(source.expected_cash_mxn ?? source.expectedCashMxn ?? 0),
    countedCashMxn: toNullableNumber(source.counted_cash_mxn ?? source.countedCashMxn),
    cashDifferenceMxn: toNullableNumber(source.cash_difference_mxn ?? source.cashDifferenceMxn),
    salesCount: toNumber(source.sales_count ?? source.salesCount ?? 0),
    subtotalMxn: toNumber(source.subtotal_mxn ?? source.subtotalMxn ?? 0),
    taxMxn: toNumber(source.tax_mxn ?? source.taxMxn ?? 0),
    totalMxn: toNumber(source.total_mxn ?? source.totalMxn ?? 0),
    netTotalMxn: toNumber(source.netTotalMxn ?? source.net_total_mxn ?? 0),
    notes: normalizeString(source.notes ?? '', ''),
    openedAt: source.opened_at ?? source.openedAt ?? null,
    closedAt: source.closed_at ?? source.closedAt ?? null,
    openedByUserId: source.opened_by_user_id ?? source.openedByUserId ?? null,
    closedByUserId: source.closed_by_user_id ?? source.closedByUserId ?? null,
    sales: Array.isArray(source.sales) ? source.sales.map(mapIncludedSale) : [],
    expenses: Array.isArray(source.expenses) ? source.expenses.map(mapIncludedExpense) : [],
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

  const normalized = normalizeCashClosing(source)

  return {
    id: normalized.id ?? source.cash_closing_id ?? null,
    cashClosingId: normalized.id ?? source.cash_closing_id ?? null,
    date: normalized.date,
    shiftKey: normalized.shiftKey,
    shiftLabel: normalized.shiftLabel,
    shiftStartAt: normalized.shiftStartAt,
    shiftEndAt: normalized.shiftEndAt,
    status: normalized.status,
    isOpen: normalized.isOpen,
    isClosed: normalized.isClosed || Boolean(source.is_closed ?? false) || source.estado === 'cerrado',
    openingCashMxn: normalized.openingCashMxn,
    salesCount: normalized.salesCount,
    subtotalMxn: normalized.subtotalMxn,
    taxMxn: normalized.taxMxn,
    totalMxn: normalized.totalMxn,
    cashTotalMxn: normalized.cashTotalMxn,
    cardTotalMxn: normalized.cardTotalMxn,
    transferTotalMxn: normalized.transferTotalMxn,
    otherTotalMxn: normalized.otherTotalMxn,
    expensesTotalMxn: normalized.expensesTotalMxn,
    cashOutflowsMxn: normalized.cashOutflowsMxn,
    expectedCashMxn: normalized.expectedCashMxn,
    countedCashMxn: normalized.countedCashMxn,
    cashDifferenceMxn: normalized.cashDifferenceMxn,
    netTotalMxn: normalized.netTotalMxn,
    notes: normalized.notes,
    openedAt: normalized.openedAt,
    closedAt: normalized.closedAt,
    createdAt: source.created_at ?? source.createdAt ?? null,
    createdBy: normalizeString(source.created_by ?? source.createdBy ?? '', ''),
    createdByName: normalizeString(source.created_by_name ?? source.createdByName ?? source.responsible_name ?? source.responsibleName ?? '', ''),
    openingResponsibleName: normalizeString(source.opening_responsible_name ?? source.openingResponsibleName ?? '', ''),
    sales: includedSales.map(mapIncludedSale),
    expenses: normalized.expenses,
    raw: source,
  }
}

export function mapBackendCashClosingsToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendCashClosingToFrontend)
}
