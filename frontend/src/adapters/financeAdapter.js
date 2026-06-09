function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeString(value, fallback = '') {
  const raw = String(value ?? '').trim()
  return raw || fallback
}

function normalizePaymentMethod(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'cash' || raw === 'efectivo') return 'cash'
  if (raw === 'card' || raw === 'tarjeta') return 'card'
  if (raw === 'transfer' || raw === 'transferencia' || raw === 'bank_transfer') return 'transfer'
  if (raw === 'other' || raw === 'otro') return 'other'
  return raw || 'other'
}

function mapRecentSale(item = {}) {
  const id = item.id ?? item.sale_id ?? null
  return {
    id,
    saleId: id,
    folio: normalizeString(item.folio ?? item.code ?? `POS-${String(id ?? '').padStart(6, '0')}`),
    customerName: normalizeString(item.customer_name ?? item.customerName, ''),
    customerEmail: normalizeString(item.customer_email ?? item.customerEmail, ''),
    paymentMethod: normalizePaymentMethod(item.payment_method ?? item.paymentMethod),
    totalMxn: toNumber(item.total_mxn ?? item.totalMxn, 0),
    createdAt: item.created_at ?? item.createdAt ?? null,
    raw: item,
  }
}

function mapRecentExpense(item = {}) {
  const id = item.id ?? item.expense_id ?? null
  return {
    id,
    expenseId: id,
    category: normalizeString(item.category ?? item.categoria, 'insumos'),
    description: normalizeString(item.description ?? item.descripcion, ''),
    amountMxn: toNumber(item.amount_mxn ?? item.amountMxn, 0),
    paymentMethod: normalizePaymentMethod(item.payment_method ?? item.paymentMethod),
    createdAt: item.created_at ?? item.createdAt ?? null,
    raw: item,
  }
}

function mapHistoricalItem(item = {}) {
  return {
    groupBy: normalizeString(item.group_by ?? item.groupBy, 'day'),
    label: normalizeString(
      item.label ?? item.period_label ?? item.periodLabel ?? item.date ?? item.week ?? item.month,
      '—'
    ),
    salesCount: toNumber(item.sales_count ?? item.salesCount, 0),
    salesTotalMxn: toNumber(item.sales_total_mxn ?? item.salesTotalMxn, 0),
    expensesTotalMxn: toNumber(item.expenses_total_mxn ?? item.expensesTotalMxn, 0),
    netTotalMxn: toNumber(item.net_total_mxn ?? item.netTotalMxn, 0),
    averageTicketMxn: toNumber(item.average_ticket_mxn ?? item.averageTicketMxn, 0),
    cashMxn: toNumber(item.cash_mxn ?? item.cashMxn, 0),
    cardMxn: toNumber(item.card_mxn ?? item.cardMxn, 0),
    transferMxn: toNumber(item.transfer_mxn ?? item.transferMxn, 0),
    otherMxn: toNumber(item.other_mxn ?? item.otherMxn, 0),
    raw: item,
  }
}

function mapLowStockItem(item = {}) {
  const id = item.id ?? item.product_id ?? null
  return {
    id,
    productId: id,
    productName: normalizeString(item.product_name ?? item.productName ?? item.name, 'Producto'),
    category: normalizeString(item.category ?? item.category_name ?? item.categoryName, 'General'),
    stock: toNumber(item.stock ?? item.current_stock ?? item.existencia, 0),
    threshold: toNumber(item.threshold ?? item.min_stock ?? item.minStock, 0),
    raw: item,
  }
}

export function mapBackendFinanceKpisToFrontend(payload = {}) {
  return {
    from: payload.from ?? null,
    to: payload.to ?? null,
    sales: {
      count: toNumber(payload.sales?.count ?? payload.sales_count, 0),
      subtotalMxn: toNumber(payload.sales?.subtotal_mxn ?? payload.sales?.subtotalMxn ?? 0, 0),
      taxMxn: toNumber(payload.sales?.tax_mxn ?? payload.sales?.taxMxn ?? 0, 0),
      totalMxn: toNumber(payload.sales?.total_mxn ?? payload.sales?.totalMxn ?? 0, 0),
    },
    expenses: {
      count: toNumber(payload.expenses?.count ?? payload.expenses_count, 0),
      totalMxn: toNumber(payload.expenses?.total_mxn ?? payload.expenses?.totalMxn ?? 0, 0),
    },
    net: {
      totalMxn: toNumber(payload.net?.total_mxn ?? payload.net?.totalMxn ?? 0, 0),
    },
    paymentMethods: {
      cashMxn: toNumber(payload.payment_methods?.cash_mxn ?? payload.payment_methods?.cashMxn, 0),
      cardMxn: toNumber(payload.payment_methods?.card_mxn ?? payload.payment_methods?.cardMxn, 0),
      transferMxn: toNumber(payload.payment_methods?.transfer_mxn ?? payload.payment_methods?.transferMxn, 0),
      otherMxn: toNumber(payload.payment_methods?.other_mxn ?? payload.payment_methods?.otherMxn, 0),
    },
    cashClosing: {
      isClosed: Boolean(payload.cash_closing?.is_closed ?? payload.cash_closing?.isClosed ?? false),
      lastClosingDate: payload.cash_closing?.last_closing_date ?? payload.cash_closing?.lastClosingDate ?? null,
      todayClosingId: payload.cash_closing?.today_closing_id ?? payload.cash_closing?.todayClosingId ?? null,
    },
    operations: {
      productsSold: toNumber(payload.operations?.products_sold ?? payload.operations?.productsSold, 0),
      packagesSold: toNumber(payload.operations?.packages_sold ?? payload.operations?.packagesSold, 0),
      activeClients: toNumber(payload.operations?.active_clients ?? payload.operations?.activeClients, 0),
      reservationsCount: toNumber(payload.operations?.reservations_count ?? payload.operations?.reservationsCount, 0),
    },
    raw: payload,
  }
}

export function mapBackendFinanceDaySummaryToFrontend(payload = {}) {
  const mapped = mapBackendFinanceKpisToFrontend(payload)
  const recentSales = Array.isArray(payload.recent_sales)
    ? payload.recent_sales.map(mapRecentSale)
    : Array.isArray(payload.recentSales)
      ? payload.recentSales.map(mapRecentSale)
      : []
  const recentExpenses = Array.isArray(payload.recent_expenses)
    ? payload.recent_expenses.map(mapRecentExpense)
    : Array.isArray(payload.recentExpenses)
      ? payload.recentExpenses.map(mapRecentExpense)
      : []

  return {
    ...mapped,
    recentSales,
    recentExpenses,
  }
}

export function mapBackendFinanceHistoricalToFrontend(payload = {}) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.series)
        ? payload.series
        : Array.isArray(payload.data)
          ? payload.data
          : []

  return {
    from: payload.from ?? null,
    to: payload.to ?? null,
    groupBy: payload.group_by ?? payload.groupBy ?? null,
    items: items.map(mapHistoricalItem),
    raw: payload,
  }
}

export function mapBackendFinanceCategoriesToFrontend(payload = {}) {
  const expenseCategories = Array.isArray(payload.expense_categories)
    ? payload.expense_categories
    : Array.isArray(payload.expenseCategories)
      ? payload.expenseCategories
      : []
  const productCategories = Array.isArray(payload.product_categories)
    ? payload.product_categories
    : Array.isArray(payload.productCategories)
      ? payload.productCategories
      : []

  return {
    expenseCategories: expenseCategories.map((item = {}) => ({
      category: normalizeString(item.category ?? item.name, 'Sin categoría'),
      totalMxn: toNumber(item.total_mxn ?? item.totalMxn, 0),
      count: toNumber(item.count ?? 0, 0),
      raw: item,
    })),
    productCategories: productCategories.map((item = {}) => ({
      category: normalizeString(item.category ?? item.name, 'Sin categoría'),
      totalMxn: toNumber(item.total_mxn ?? item.totalMxn, 0),
      itemsSold: toNumber(item.items_sold ?? item.itemsSold, 0),
      raw: item,
    })),
    raw: payload,
  }
}

export function mapBackendLowStockToFrontend(payload = {}) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.low_stock)
        ? payload.low_stock
        : Array.isArray(payload.lowStock)
          ? payload.lowStock
          : []
  return items.map(mapLowStockItem)
}

export function mapBackendRecentFinanceSalesToFrontend(payload = {}) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.sales)
        ? payload.sales
        : Array.isArray(payload.recent_sales)
          ? payload.recent_sales
          : []
  return items.map(mapRecentSale)
}
