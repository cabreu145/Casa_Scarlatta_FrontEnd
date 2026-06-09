import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    productoCategories: '/api/v1/productos/categorias',
    productoCategoriesPaginated: ({ page, pageSize, search, status }) => {
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

  test('lista categorías, crea, edita y cambia status', async () => {
    httpGet.mockResolvedValue({
      page: 1,
      page_size: 20,
      total: 1,
      items: [{ id: 1, name: 'Bebidas', is_active: true }],
    })
    httpPost.mockResolvedValue({ id: 2, name: 'Accesorios', is_active: true })
    httpPut.mockResolvedValue({ id: 2, name: 'Accesorios', is_active: false })
    httpPatch.mockResolvedValue({ id: 2, name: 'Accesorios', is_active: false })
    httpDelete.mockResolvedValue({ ok: true })

    const service = await import('./posCategoriesApiService')
    const list = await service.getProductCategoriesApi({ page: 1, pageSize: 1000, search: 'Bebidas', status: 'active' })
    const created = await service.createProductCategoryApi({ name: 'Accesorios', description: 'Accesorios', status: 'active' })
    const updated = await service.updateProductCategoryApi(2, { name: 'Accesorios', description: 'Accesorios', status: 'inactive' })
    await service.updateProductCategoryStatusApi(2, 'inactive')
    await service.deleteProductCategoryApi(2)

    expect(httpGet).toHaveBeenCalledWith('/api/v1/productos/categorias?page=1&page_size=100&search=Bebidas&status=active')
    expect(httpPost).toHaveBeenCalledWith('/api/v1/productos/categorias', expect.objectContaining({ name: 'Accesorios', description: 'Accesorios', status: 'active' }))
    expect(httpPut).toHaveBeenCalledWith('/api/v1/productos/categorias/2', expect.objectContaining({ name: 'Accesorios', status: 'inactive' }))
    expect(httpPatch).toHaveBeenCalledWith('/api/v1/productos/categorias/2/status', { status: 'inactive' })
    expect(httpDelete).toHaveBeenCalledWith('/api/v1/productos/categorias/2')
    expect(list.total).toBe(1)
    expect(created).toMatchObject({ id: 2, name: 'Accesorios' })
    expect(updated).toMatchObject({ id: 2, name: 'Accesorios' })
  })
})
