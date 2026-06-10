import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    gastos: '/api/v1/gastos',
    gastosPaginated: ({ page, pageSize, from, to, category, status, paymentMethod }) => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('page_size', String(pageSize))
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (category) params.set('category', category)
      if (status) params.set('status', status)
      if (paymentMethod) params.set('payment_method', paymentMethod)
      return `/api/v1/gastos?${params.toString()}`
    },
    gastoById: (id) => `/api/v1/gastos/${id}`,
    gastoCancelarById: (id) => `/api/v1/gastos/${id}/cancelar`,
  },
}))

const httpGet = vi.fn()
const httpPost = vi.fn()
const httpPut = vi.fn()
const httpPatch = vi.fn()
const httpDelete = vi.fn()

vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpPost: (...args) => httpPost(...args),
  httpPut: (...args) => httpPut(...args),
  httpPatch: (...args) => httpPatch(...args),
  httpDelete: (...args) => httpDelete(...args),
}))

describe('expensesApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpPost.mockReset()
    httpPut.mockReset()
    httpPatch.mockReset()
    httpDelete.mockReset()
  })

  test('consume lista, detalle y mutaciones', async () => {
    httpGet
      .mockResolvedValueOnce({
        page: 1,
        page_size: 20,
        total: 1,
        items: [
          {
            id: 1,
            expense_date: '2026-06-09',
            category: 'insumos',
            description: 'Compra de agua y limpieza',
            amount_mxn: 350,
            payment_method: 'cash',
            status: 'active',
            notes: 'Compra local',
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 1,
        expense_date: '2026-06-09',
        category: 'insumos',
        description: 'Compra de agua y limpieza',
        amount_mxn: 350,
        payment_method: 'cash',
        status: 'active',
      })

    httpPost.mockResolvedValueOnce({ id: 2, expense_date: '2026-06-09', status: 'active' })
    httpPut.mockResolvedValueOnce({ id: 1, expense_date: '2026-06-09', status: 'active' })
    httpPatch.mockResolvedValueOnce({ id: 1, expense_date: '2026-06-09', status: 'cancelled' })
    httpDelete.mockResolvedValueOnce({ ok: true })

    const service = await import('./expensesApiService')

    const list = await service.listExpenses({
      page: 1,
      pageSize: 1000,
      from: '2026-06-01',
      to: '2026-06-09',
      category: 'insumos',
      status: 'active',
      paymentMethod: 'cash',
    })
    const detail = await service.getExpenseDetail(1)
    const created = await service.createExpense({
      expenseDate: '2026-06-09',
      category: 'insumos',
      description: 'Compra de agua y limpieza',
      amountMxn: 350,
      paymentMethod: 'cash',
      notes: 'Compra local',
    })
    const updated = await service.updateExpense(1, {
      expenseDate: '2026-06-09',
      category: 'insumos',
      description: 'Compra de agua y limpieza',
      amountMxn: 420,
      paymentMethod: 'cash',
      notes: 'Ajuste',
    })
    const cancelled = await service.cancelExpense(1, 'Registro duplicado')
    const deleted = await service.deleteExpense(1)

    expect(httpGet).toHaveBeenNthCalledWith(1, '/api/v1/gastos?page=1&page_size=100&from=2026-06-01&to=2026-06-09&category=insumos&status=active&payment_method=cash')
    expect(httpGet).toHaveBeenNthCalledWith(2, '/api/v1/gastos/1')
    expect(httpPost).toHaveBeenCalledWith('/api/v1/gastos', {
      expense_date: '2026-06-09',
      category: 'insumos',
      description: 'Compra de agua y limpieza',
      amount_mxn: 350,
      payment_method: 'cash',
      notes: 'Compra local',
    })
    expect(httpPut).toHaveBeenCalledWith('/api/v1/gastos/1', expect.objectContaining({
      amount_mxn: 420,
      payment_method: 'cash',
    }))
    expect(httpPatch).toHaveBeenCalledWith('/api/v1/gastos/1/cancelar', { reason: 'Registro duplicado' })
    expect(httpDelete).toHaveBeenCalledWith('/api/v1/gastos/1')
    expect(list.items[0]).toMatchObject({ id: 1, category: 'insumos', amountMxn: 350 })
    expect(detail).toMatchObject({ id: 1, expenseDate: '2026-06-09' })
    expect(created).toMatchObject({ id: 2 })
    expect(updated).toMatchObject({ id: 1 })
    expect(cancelled).toMatchObject({ id: 1, status: 'cancelled' })
    expect(deleted).toMatchObject({ ok: true })
  })
})
