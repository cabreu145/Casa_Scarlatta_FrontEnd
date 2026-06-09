import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    cortesHoy: '/api/v1/cortes/hoy',
    ejecutarCorte: '/api/v1/cortes/ejecutar',
    cortesPaginated: ({ page, pageSize, from, to }) => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('page_size', String(pageSize))
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      return `/api/v1/cortes?${params.toString()}`
    },
    corteById: (id) => `/api/v1/cortes/${id}`,
  },
}))

const httpGet = vi.fn()
const httpPost = vi.fn()

vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpPost: (...args) => httpPost(...args),
}))

describe('cashClosingsApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpPost.mockReset()
  })

  test('consume resumen, historial, detalle y ejecutar corte', async () => {
    httpGet
      .mockResolvedValueOnce({
        date: '2026-06-09',
        is_closed: false,
        sales_count: 4,
        subtotal_mxn: 1000,
        tax_mxn: 160,
        total_mxn: 1160,
        cash_total_mxn: 500,
        card_total_mxn: 300,
        transfer_total_mxn: 360,
        other_total_mxn: 0,
        expenses_total_mxn: 0,
        net_total_mxn: 1160,
      })
      .mockResolvedValueOnce({
        page: 1,
        page_size: 20,
        total: 1,
        items: [{ id: 11, date: '2026-06-09', is_closed: true }],
      })
      .mockResolvedValueOnce({
        id: 11,
        date: '2026-06-09',
        sales: [
          {
            id: 100,
            folio: 'POS-000100',
            customer_name: 'Cliente Demo',
            payment_method: 'cash',
            subtotal_mxn: 100,
            tax_mxn: 16,
            total_mxn: 116,
            created_at: '2026-06-09T12:00:00-06:00',
          },
        ],
      })
    httpPost.mockResolvedValueOnce({ id: 12, date: '2026-06-09', is_closed: true })

    const service = await import('./cashClosingsApiService')
    const today = await service.getTodayCashClosingSummary()
    const list = await service.listCashClosings({ page: 1, pageSize: 1000, from: '2026-06-01', to: '2026-06-09' })
    const detail = await service.getCashClosingDetail(11)
    const executed = await service.executeCashClosing({ date: '2026-06-09', notes: 'Cierre tarde' })

    expect(httpGet).toHaveBeenNthCalledWith(1, '/api/v1/cortes/hoy')
    expect(httpGet).toHaveBeenNthCalledWith(2, '/api/v1/cortes?page=1&page_size=100&from=2026-06-01&to=2026-06-09')
    expect(httpGet).toHaveBeenNthCalledWith(3, '/api/v1/cortes/11')
    expect(httpPost).toHaveBeenCalledWith('/api/v1/cortes/ejecutar', { date: '2026-06-09', notes: 'Cierre tarde' })
    expect(today).toMatchObject({ date: '2026-06-09', isClosed: false, salesCount: 4 })
    expect(list.items[0]).toMatchObject({ id: 11, date: '2026-06-09', isClosed: true })
    expect(detail.sales[0]).toMatchObject({ folio: 'POS-000100', customerName: 'Cliente Demo' })
    expect(executed).toMatchObject({ id: 12, isClosed: true })
  })
})
