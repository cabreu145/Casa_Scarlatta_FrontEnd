import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    productCategories: '/api/v1/productos/categorias',
    productCategoriesPaginated: ({ page, pageSize, search, status }) => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('page_size', String(pageSize))
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      return `/api/v1/productos/categorias?${params.toString()}`
    },
    productCategoryById: (id) => `/api/v1/productos/categorias/${id}`,
    productCategoryStatusById: (id) => `/api/v1/productos/categorias/${id}/status`,
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

describe('posCategoriesApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpPost.mockReset()
    httpPut.mockReset()
    httpPatch.mockReset()
    httpDelete.mockReset()
  })

  test('lista categorias, crea, edita, activa/desactiva y elimina con endpoints reales', async () => {
    httpGet.mockResolvedValue({
      page: 1,
      page_size: 20,
      total: 1,
      items: [{ id: 1, name: 'Bebidas', is_active: true, created_at: '2026-06-09T10:00:00-06:00' }],
    })
    httpPost.mockResolvedValue({ id: 2, name: 'Accesorios', is_active: true })
    httpPut.mockResolvedValue({ id: 2, name: 'Accesorios', is_active: false })
    httpPatch
      .mockResolvedValueOnce({ id: 2, name: 'Accesorios', is_active: false })
      .mockResolvedValueOnce({ id: 2, name: 'Accesorios', is_active: true })
    httpDelete.mockResolvedValue({ ok: true })

    const service = await import('./posCategoriesApiService')
    const list = await service.getProductCategoriesApi({ page: 1, pageSize: 1000, search: 'Bebidas', status: 'active' })
    const created = await service.createProductCategoryApi({ name: 'Accesorios', description: 'Accesorios', isActive: true })
    const updated = await service.updateProductCategoryApi(2, { name: 'Accesorios', description: 'Accesorios', isActive: false })
    await service.updateProductCategoryStatusApi(2, false)
    await service.updateProductCategoryStatusApi(2, true)
    await service.deleteProductCategoryApi(2)

    expect(httpGet).toHaveBeenCalledWith('/api/v1/productos/categorias?page=1&page_size=100&search=Bebidas&status=active')
    expect(httpPost).toHaveBeenCalledWith('/api/v1/productos/categorias', {
      name: 'Accesorios',
      description: 'Accesorios',
      is_active: true,
    })
    expect(httpPut).toHaveBeenCalledWith('/api/v1/productos/categorias/2', {
      name: 'Accesorios',
      description: 'Accesorios',
      is_active: false,
    })
    expect(httpPatch).toHaveBeenNthCalledWith(1, '/api/v1/productos/categorias/2/status', { is_active: false })
    expect(httpPatch).toHaveBeenNthCalledWith(2, '/api/v1/productos/categorias/2/status', { is_active: true })
    expect(httpDelete).toHaveBeenCalledWith('/api/v1/productos/categorias/2')
    expect(list.items[0]).toMatchObject({
      id: 1,
      name: 'Bebidas',
      isActive: true,
      createdAt: '2026-06-09T10:00:00-06:00',
    })
    expect(created).toMatchObject({ id: 2, name: 'Accesorios', isActive: true })
    expect(updated).toMatchObject({ id: 2, name: 'Accesorios', isActive: false })
  })
})
