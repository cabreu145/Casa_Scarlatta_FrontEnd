import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    membershipsPackages: '/api/v1/memberships/packages',
  },
}))

const httpGet = vi.fn()
vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
}))

describe('membershipPackagesApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
  })

  test('usa catalogo backend en API mode', async () => {
    httpGet.mockResolvedValue([
      { id: 1, name: 'Mensual 8', credits: 8, price_mxn: 1500, is_active: true },
      { id: 9, name: 'Inactivo', credits: 99, price_mxn: 9999, is_active: false },
    ])
    const { getMembershipPackagesApi } = await import('./membershipPackagesApiService')
    const result = await getMembershipPackagesApi()

    expect(httpGet).toHaveBeenCalledWith('/api/v1/memberships/packages')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 1, nombre: 'Mensual 8', creditos: 8, precio: 1500 })
  })
})
