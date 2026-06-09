import { describe, expect, test } from 'vitest'
import {
  mapBackendFinanceCategoriesToFrontend,
  mapBackendFinanceDaySummaryToFrontend,
  mapBackendFinanceKpisToFrontend,
  mapBackendLowStockToFrontend,
  mapBackendRecentFinanceSalesToFrontend,
} from './financeAdapter'

describe('financeAdapter', () => {
  test('mapea KPIs backend a frontend', () => {
    const mapped = mapBackendFinanceKpisToFrontend({
      from: '2026-06-09',
      to: '2026-06-09',
      sales: { count: 12, subtotal_mxn: 10000, tax_mxn: 1600, total_mxn: 11600 },
      expenses: { count: 3, total_mxn: 1200 },
      net: { total_mxn: 10400 },
      payment_methods: { cash_mxn: 4000, card_mxn: 5000, transfer_mxn: 2600, other_mxn: 0 },
      cash_closing: { is_closed: false, last_closing_date: '2026-06-08', today_closing_id: null },
      operations: { products_sold: 20, packages_sold: 4, active_clients: 30, reservations_count: 18 },
    })

    expect(mapped).toMatchObject({
      from: '2026-06-09',
      to: '2026-06-09',
      sales: { count: 12, subtotalMxn: 10000, taxMxn: 1600, totalMxn: 11600 },
      expenses: { count: 3, totalMxn: 1200 },
      net: { totalMxn: 10400 },
      paymentMethods: { cashMxn: 4000, cardMxn: 5000, transferMxn: 2600, otherMxn: 0 },
      cashClosing: { isClosed: false, lastClosingDate: '2026-06-08', todayClosingId: null },
      operations: { productsSold: 20, packagesSold: 4, activeClients: 30, reservationsCount: 18 },
    })
  })

  test('mapea resumen diario, categorias, stock bajo y ventas recientes', () => {
    const day = mapBackendFinanceDaySummaryToFrontend({
      recent_sales: [{ id: 1, customer_name: 'Cliente Demo', payment_method: 'cash', total_mxn: 350, created_at: '2026-06-09T10:00:00-06:00' }],
      recent_expenses: [{ id: 2, category: 'insumos', amount_mxn: 50, payment_method: 'cash', created_at: '2026-06-09T09:00:00-06:00' }],
    })
    const categories = mapBackendFinanceCategoriesToFrontend({
      expense_categories: [{ category: 'insumos', total_mxn: 500, count: 2 }],
      product_categories: [{ category: 'Bebidas', total_mxn: 1200, items_sold: 10 }],
    })
    const lowStock = mapBackendLowStockToFrontend([{ id: 10, product_name: 'Toalla', category: 'Accesorios', stock: 2 }])
    const recentSales = mapBackendRecentFinanceSalesToFrontend([{ id: 1, customer_name: 'Cliente Demo', payment_method: 'card', total_mxn: 350, created_at: '2026-06-09T10:00:00-06:00' }])

    expect(day.recentSales[0]).toMatchObject({ customerName: 'Cliente Demo', paymentMethod: 'cash', totalMxn: 350 })
    expect(day.recentExpenses[0]).toMatchObject({ category: 'insumos', amountMxn: 50 })
    expect(categories.expenseCategories[0]).toMatchObject({ category: 'insumos', totalMxn: 500, count: 2 })
    expect(categories.productCategories[0]).toMatchObject({ category: 'Bebidas', totalMxn: 1200, itemsSold: 10 })
    expect(lowStock[0]).toMatchObject({ productName: 'Toalla', category: 'Accesorios', stock: 2 })
    expect(recentSales[0]).toMatchObject({ customerName: 'Cliente Demo', paymentMethod: 'card', totalMxn: 350 })
  })
})
