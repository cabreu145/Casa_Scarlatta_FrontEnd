import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    membershipsPackages: '/api/v1/memberships/packages',
    adminMembershipPackagesPaginated: ({ page, pageSize, search, status }) => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('page_size', String(pageSize))
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      return `/api/v1/memberships/packages?${params.toString()}`
    },
    adminMembershipPackageById: (id) => `/api/v1/memberships/packages/${id}`,
    adminMembershipPackageStatusById: (id) => `/api/v1/memberships/packages/${id}/status`,
    adminMembershipPackageFeaturedById: (id) => `/api/v1/memberships/packages/${id}/featured`,
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

describe('membershipPackagesApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpPost.mockReset()
    httpPut.mockReset()
    httpPatch.mockReset()
    httpDelete.mockReset()
  })

  test('usa catalogo backend publico', async () => {
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

  test('usa paginado admin con page_size seguro', async () => {
    httpGet.mockResolvedValue({
      page: 1,
      page_size: 20,
      total: 1,
      items: [{ id: 2, name: 'Mensual 12', credits: 12, price_mxn: 2100, is_active: true }],
    })
    const { getMembershipPackagesPaginatedApi } = await import('./membershipPackagesApiService')
    const result = await getMembershipPackagesPaginatedApi({ page: 2, pageSize: 1000, search: 'Mensual', status: 'active' })

    expect(httpGet).toHaveBeenCalledWith('/api/v1/memberships/packages?page=2&page_size=100&search=Mensual&status=active')
    expect(result.total).toBe(1)
    expect(result.items[0]).toMatchObject({ id: 2, nombre: 'Mensual 12', creditos: 12 })
  })

  test('crea actualiza toggles y borra paquete admin', async () => {
    httpPost.mockResolvedValue({ id: 7, name: 'Pack Demo', credits: 10, price_mxn: 1200, duration_days: 30, is_active: true })
    httpPut.mockResolvedValue({ id: 7, name: 'Pack Demo', credits: 12, price_mxn: 1500, duration_days: 45, is_active: true })
    httpPatch.mockResolvedValue({ id: 7, name: 'Pack Demo', credits: 12, price_mxn: 1500, duration_days: 45, is_active: false })
    httpDelete.mockResolvedValue({ ok: true })

    const service = await import('./membershipPackagesApiService')

    await service.createMembershipPackageApi({
      nombre: 'Pack Demo',
      numClases: '10',
      precio: '1200',
      vigencia: '30',
      destacado: true,
      descripcion: 'Uno\nDos',
    })
    await service.updateMembershipPackageApi(7, {
      nombre: 'Pack Demo',
      numClases: '12',
      precio: '1500',
      vigencia: '45',
    })
    await service.updateMembershipPackageStatusApi(7, false)
    await service.updateMembershipPackageFeaturedApi(7, true)
    await service.deleteMembershipPackageApi(7)

    expect(httpPost).toHaveBeenCalledWith('/api/v1/memberships/packages', {
      name: 'Pack Demo',
      credits: 10,
      price_mxn: 1200,
      duration_days: 30,
      is_active: true,
      is_featured: true,
      benefits: ['Uno', 'Dos'],
      is_shareable: false,
      max_beneficiaries: 0,
    })
    expect(httpPut).toHaveBeenCalledWith('/api/v1/memberships/packages/7', expect.objectContaining({
      name: 'Pack Demo',
      credits: 12,
      price_mxn: 1500,
      duration_days: 45,
    }))
    expect(httpPatch).toHaveBeenCalledWith('/api/v1/memberships/packages/7/status', { is_active: false })
    expect(httpPatch).toHaveBeenCalledWith('/api/v1/memberships/packages/7/featured', { is_featured: true })
    expect(httpDelete).toHaveBeenCalledWith('/api/v1/memberships/packages/7')
  })

  test('lanza error claro si endpoint falta', async () => {
    vi.resetModules()
    vi.doMock('@/constants/api', () => ({
      ENDPOINTS: {},
    }))
    const { getMembershipPackagesApi } = await import('./membershipPackagesApiService')
    await expect(getMembershipPackagesApi()).rejects.toThrow('MEMBERSHIP_PACKAGES_ENDPOINT_MISSING')
  })
})
