import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    miEstadoFinanciero: '/api/v1/clientes/me/estado-financiero',
  },
}))

const httpGet = vi.fn()
vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
}))

describe('financialStateApiService', () => {
  beforeEach(() => {
    vi.resetModules()
    httpGet.mockReset()
  })

  test('consulta endpoint financiero de cliente', async () => {
    httpGet.mockResolvedValue({ user_id: 3, credits_balance: 8 })
    const { getMyFinancialStateApi } = await import('./financialStateApiService')
    const result = await getMyFinancialStateApi()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/clientes/me/estado-financiero')
    expect(result.userId).toBe(3)
    expect(result.creditsBalance).toBe(8)
  })
})
