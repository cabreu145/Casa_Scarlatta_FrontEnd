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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 6793846 (feat: add payment tracking tests and implement payment UI logic)

  test('tolera shape paginado con items', async () => {
    httpGet.mockResolvedValue({
      page: 1,
      page_size: 20,
      total: 1,
      items: [{ id: 2, name: 'Mensual 12', credits: 12, price_mxn: 2100, is_active: true }],
    })
    const { getMembershipPackagesApi } = await import('./membershipPackagesApiService')
    const result = await getMembershipPackagesApi()

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 2, nombre: 'Mensual 12', creditos: 12, precio: 2100 })
  })

  test('lanza error claro si endpoint falta', async () => {
    vi.resetModules()
    vi.doMock('@/constants/api', () => ({
      ENDPOINTS: {},
    }))
    const { getMembershipPackagesApi } = await import('./membershipPackagesApiService')
    await expect(getMembershipPackagesApi()).rejects.toThrow('MEMBERSHIP_PACKAGES_ENDPOINT_MISSING')
  })
<<<<<<< HEAD
=======
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
=======
>>>>>>> 6793846 (feat: add payment tracking tests and implement payment UI logic)
})
