import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    miEstadoFinanciero: '/api/v1/clientes/me/estado-financiero',
    miCreditMovements: ({ page, pageSize }) => `/api/v1/clientes/me/credit-movements?page=${page}&page_size=${pageSize}`,
  },
}))

const httpGet = vi.fn()
vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
}))

describe('financialStateApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
  })

  test('getMyCreditMovementsPaginatedApi llama endpoint correcto', async () => {
    httpGet.mockResolvedValue({ page: 1, page_size: 10, total: 2, items: [{ id: 1, amount: -1 }] })
    const { getMyCreditMovementsPaginatedApi } = await import('./financialStateApiService')
    const result = await getMyCreditMovementsPaginatedApi({ page: 1, pageSize: 10 })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/clientes/me/credit-movements?page=1&page_size=10')
    expect(result.isPaginated).toBe(true)
    expect(result.total).toBe(2)
  })
})
