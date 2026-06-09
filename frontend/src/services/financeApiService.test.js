import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    finanzasKpis: ({ from, to } = {}) => {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      return `/api/v1/finanzas/kpis${params.toString() ? `?${params.toString()}` : ''}`
    },
    finanzasDia: ({ date } = {}) => `/api/v1/finanzas/dia${date ? `?date=${date}` : ''}`,
    finanzasCategorias: ({ from, to } = {}) => {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      return `/api/v1/finanzas/categorias${params.toString() ? `?${params.toString()}` : ''}`
    },
    finanzasStockBajo: ({ threshold } = {}) => `/api/v1/finanzas/stock-bajo?threshold=${threshold}`,
    finanzasVentasRecientes: ({ limit } = {}) => `/api/v1/finanzas/ventas-recientes?limit=${limit}`,
    finanzasExportar: ({ from, to, type } = {}) => {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (type) params.set('type', type)
      return `/api/v1/finanzas/exportar${params.toString() ? `?${params.toString()}` : ''}`
    },
  },
}))

const httpGet = vi.fn()
const httpRequestRaw = vi.fn()
const downloadBlob = vi.fn()
const getFilenameFromContentDisposition = vi.fn()

vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpRequestRaw: (...args) => httpRequestRaw(...args),
}))

vi.mock('@/utils/downloadCsv', () => ({
  downloadBlob: (...args) => downloadBlob(...args),
  getFilenameFromContentDisposition: (...args) => getFilenameFromContentDisposition(...args),
}))

describe('financeApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpRequestRaw.mockReset()
    downloadBlob.mockReset()
    getFilenameFromContentDisposition.mockReset()
  })

  test('consume endpoints de KPIs, día, categorías, stock bajo y ventas recientes', async () => {
    httpGet
      .mockResolvedValueOnce({
        from: '2026-06-09',
        to: '2026-06-09',
        sales: { count: 12, subtotal_mxn: 10000, tax_mxn: 1600, total_mxn: 11600 },
        expenses: { count: 3, total_mxn: 1200 },
        net: { total_mxn: 10400 },
        payment_methods: { cash_mxn: 4000, card_mxn: 5000, transfer_mxn: 2600, other_mxn: 0 },
        cash_closing: { is_closed: false, last_closing_date: '2026-06-08', today_closing_id: null },
        operations: { products_sold: 20, packages_sold: 4, active_clients: 30, reservations_count: 18 },
      })
      .mockResolvedValueOnce({
        recent_sales: [{ id: 1, customer_name: 'Cliente Demo', payment_method: 'cash', total_mxn: 350, created_at: '2026-06-09T10:00:00-06:00' }],
        recent_expenses: [{ id: 2, category: 'insumos', amount_mxn: 50, payment_method: 'cash', created_at: '2026-06-09T09:00:00-06:00' }],
      })
      .mockResolvedValueOnce({
        expense_categories: [{ category: 'insumos', total_mxn: 500, count: 2 }],
        product_categories: [{ category: 'Bebidas', total_mxn: 1200, items_sold: 10 }],
      })
      .mockResolvedValueOnce([{ id: 10, product_name: 'Toalla', category: 'Accesorios', stock: 2 }])
      .mockResolvedValueOnce([{ id: 1, customer_name: 'Cliente Demo', payment_method: 'card', total_mxn: 350, created_at: '2026-06-09T10:00:00-06:00' }])

    const service = await import('./financeApiService')

    const kpis = await service.getFinanceKpis({ from: '2026-06-09', to: '2026-06-09' })
    const day = await service.getFinanceDaySummary('2026-06-09')
    const categories = await service.getFinanceCategories({ from: '2026-06-01', to: '2026-06-09' })
    const lowStock = await service.getLowStock({ threshold: 5 })
    const recentSales = await service.getRecentFinanceSales({ limit: 10 })

    expect(httpGet).toHaveBeenNthCalledWith(1, '/api/v1/finanzas/kpis?from=2026-06-09&to=2026-06-09')
    expect(httpGet).toHaveBeenNthCalledWith(2, '/api/v1/finanzas/dia?date=2026-06-09')
    expect(httpGet).toHaveBeenNthCalledWith(3, '/api/v1/finanzas/categorias?from=2026-06-01&to=2026-06-09')
    expect(httpGet).toHaveBeenNthCalledWith(4, '/api/v1/finanzas/stock-bajo?threshold=5')
    expect(httpGet).toHaveBeenNthCalledWith(5, '/api/v1/finanzas/ventas-recientes?limit=10')

    expect(kpis.sales).toMatchObject({ count: 12, totalMxn: 11600 })
    expect(day.recentSales[0]).toMatchObject({ customerName: 'Cliente Demo' })
    expect(categories.expenseCategories[0]).toMatchObject({ category: 'insumos', totalMxn: 500 })
    expect(lowStock[0]).toMatchObject({ productName: 'Toalla', stock: 2 })
    expect(recentSales[0]).toMatchObject({ customerName: 'Cliente Demo', totalMxn: 350 })
  })

  test('exporta CSV con filename del header o fallback', async () => {
    getFilenameFromContentDisposition.mockReturnValueOnce('finanzas-summary-2026-06-09_2026-06-09.csv')
    httpRequestRaw.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (key) => (key === 'content-disposition'
          ? 'attachment; filename="finanzas-summary-2026-06-09_2026-06-09.csv"'
          : null),
      },
      blob: async () => new Blob(['col1,col2\n1,2'], { type: 'text/csv' }),
    })

    const service = await import('./financeApiService')
    const result = await service.exportFinanceCsv({
      from: '2026-06-09',
      to: '2026-06-09',
      type: 'summary',
    })

    expect(httpRequestRaw).toHaveBeenCalledWith(
      'GET',
      '/api/v1/finanzas/exportar?from=2026-06-09&to=2026-06-09&type=summary'
    )
    expect(downloadBlob).toHaveBeenCalledTimes(1)
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'finanzas-summary-2026-06-09_2026-06-09.csv')
    expect(result).toEqual({ filename: 'finanzas-summary-2026-06-09_2026-06-09.csv' })
  })

  test('exporta CSV con filename fallback si header no viene', async () => {
    getFilenameFromContentDisposition.mockReturnValueOnce(null)
    httpRequestRaw.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null },
      blob: async () => new Blob(['col1,col2\n1,2'], { type: 'text/csv' }),
    })

    const service = await import('./financeApiService')
    const result = await service.exportFinanceCsv({
      from: '2026-06-01',
      to: '2026-06-09',
      type: 'sales',
    })

    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'finanzas-sales-2026-06-01_2026-06-09.csv')
    expect(result).toEqual({ filename: 'finanzas-sales-2026-06-01_2026-06-09.csv' })
  })
})
