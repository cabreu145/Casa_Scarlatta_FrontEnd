import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    productos: '/api/v1/productos',
    productosPaginated: ({ page, pageSize, search, category, status }) => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('page_size', String(pageSize))
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      if (status) params.set('status', status)
      return `/api/v1/productos?${params.toString()}`
    },
    productoById: (id) => `/api/v1/productos/${id}`,
    productoStatusById: (id) => `/api/v1/productos/${id}/status`,
    productoDeleteById: (id) => `/api/v1/productos/${id}`,
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
    ventas: '/api/v1/ventas',
    ventasPaginated: ({ page, pageSize, from, to, paymentMethod, status }) => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('page_size', String(pageSize))
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (paymentMethod) params.set('payment_method', paymentMethod)
      if (status) params.set('status', status)
      return `/api/v1/ventas?${params.toString()}`
    },
    ventaById: (id) => `/api/v1/ventas/${id}`,
    ventaTicket: (id) => `/api/v1/ventas/${id}/ticket`,
    ventaTicketPdf: (id) => `/api/v1/ventas/${id}/ticket.pdf`,
    publicTicketByToken: (token) => `/api/v1/public/tickets/${token}`,
    publicTicketImageByToken: (token) => `/api/v1/public/tickets/${token}/image`,
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

describe('posApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpPost.mockReset()
    httpPut.mockReset()
    httpPatch.mockReset()
    httpDelete.mockReset()
  })

  test('lista productos y capea page size', async () => {
    httpGet.mockResolvedValue({
      page: 1,
      page_size: 20,
      total: 1,
      items: [
        {
          id: 1,
          name: 'Toalla',
          category: 'Accesorios',
          price_mxn: 120,
          stock: 5,
          status: 'active',
        },
      ],
    })

    const { getProductsApi } = await import('./posApiService')
    const result = await getProductsApi({ page: 2, pageSize: 1000, search: 'Toalla', category: 'Accesorios', status: 'active' })

    expect(httpGet).toHaveBeenCalledWith('/api/v1/productos?page=2&page_size=100&search=Toalla&category=Accesorios&status=active')
    expect(result.total).toBe(1)
    expect(result.items[0]).toMatchObject({ id: 1, nombre: 'Toalla', precio: 120, stock: 5, activo: true })
  })

  test('crud producto usa endpoints correctos', async () => {
    httpPost.mockResolvedValue({ id: 3, name: 'Botella', category: 'Accesorios', price_mxn: 150, stock: 10, status: 'active' })
    httpPut.mockResolvedValue({ id: 3, name: 'Botella', category: 'Accesorios', price_mxn: 180, stock: 8, status: 'active' })
    httpPatch.mockResolvedValue({ id: 3, name: 'Botella', category: 'Accesorios', price_mxn: 180, stock: 8, status: 'inactive' })
    httpDelete.mockResolvedValue({ ok: true })

    const service = await import('./posApiService')
    await service.createProductApi({ nombre: 'Botella', categoria: 'Accesorios', categoryId: 1, precio: '150', stock: '10' })
    await service.updateProductApi(3, { nombre: 'Botella', categoria: 'Accesorios', categoryId: 1, precio: '180', stock: '8' })
    await service.updateProductStatusApi(3, 'inactive')
    await service.deleteProductApi(3)

    expect(httpPost).toHaveBeenCalledWith('/api/v1/productos', {
      name: 'Botella',
      category_id: 1,
      category: 'Accesorios',
      price_mxn: 150,
      stock: 10,
      description: null,
      status: 'active',
    })
    expect(httpPut).toHaveBeenCalledWith('/api/v1/productos/3', expect.objectContaining({
      name: 'Botella',
      category_id: 1,
      price_mxn: 180,
      stock: 8,
    }))
    expect(httpPatch).toHaveBeenCalledWith('/api/v1/productos/3/status', { status: 'inactive' })
    expect(httpDelete).toHaveBeenCalledWith('/api/v1/productos/3')
  })

  test('crea venta y lista ventas con query seguro', async () => {
    httpPost.mockResolvedValue({
      id: 100,
      folio: 'POS-000100',
      status: 'paid',
      customer_id: 1,
      subtotal_mxn: 2000,
      tax_rate: 0.16,
      tax_mxn: 340,
      total_mxn: 2340,
      payment_method: 'cash',
      created_at: '2026-06-08T12:00:00',
      ticket_url: '/api/v1/ventas/100/ticket',
      ticket_pdf_url: '/api/v1/ventas/100/ticket.pdf',
      ticket_image_url: '/api/v1/ventas/100/ticket.png',
      public_ticket_url: 'http://127.0.0.1:8000/api/v1/public/tickets/abc123',
      public_ticket_image_url: 'http://127.0.0.1:8000/api/v1/public/tickets/abc123/image',
      items: [
        { type: 'product', item_id: 1, name: 'Toalla', quantity: 2, unit_price_mxn: 120, line_total_mxn: 240 },
      ],
    })
    httpGet.mockResolvedValue({
      page: 1,
      page_size: 10,
      total: 1,
      items: [
        {
      id: 100,
      folio: 'POS-000100',
      status: 'paid',
      subtotal_mxn: 2000,
      total_mxn: 2340,
    },
    ],
    })

    const service = await import('./posApiService')
    const sale = await service.createSaleApi({
      customerId: 1,
      paymentMethod: 'cash',
      items: [
        { type: 'product', id: 1, quantity: 2, unitPriceMxn: 120 },
        { type: 'package', id: 2, quantity: 1, unitPriceMxn: 2100, beneficiariesText: 'beneficiario@demo.local' },
      ],
    })
    const list = await service.getSalesApi({ page: 1, pageSize: 1000, from: '2026-06-01', to: '2026-06-08', paymentMethod: 'cash', status: 'paid' })

    expect(httpPost).toHaveBeenCalledWith('/api/v1/ventas', expect.objectContaining({
      customer_id: 1,
      payment_method: 'cash',
      subtotal_mxn: 2340,
      tax_rate: 0.16,
      tax_mxn: 374.4,
      total_mxn: 2714.4,
      items: expect.arrayContaining([
        expect.objectContaining({ type: 'product', id: 1, quantity: 2, unit_price_mxn: 120 }),
        expect.objectContaining({ type: 'package', id: 2, beneficiaries: ['beneficiario@demo.local'] }),
      ]),
    }))
    expect(sale).toMatchObject({ id: 100, folio: 'POS-000100', ticketPdfUrl: '/api/v1/ventas/100/ticket.pdf', publicTicketImageUrl: 'http://127.0.0.1:8000/api/v1/public/tickets/abc123/image' })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/ventas?page=1&page_size=100&from=2026-06-01&to=2026-06-08&payment_method=cash&status=paid')
    expect(list.total).toBe(1)
  })

  test('helpers ticket devuelven url correcta', async () => {
    const { getSaleTicketApi, getSaleTicketPdfUrl, getPublicTicketUrl } = await import('./posApiService')
    httpGet.mockResolvedValue({ ok: true })

    await getSaleTicketApi(100)

    expect(httpGet).toHaveBeenCalledWith('/api/v1/ventas/100/ticket')
    expect(getSaleTicketPdfUrl(100)).toBe('/api/v1/ventas/100/ticket.pdf')
    expect(getPublicTicketUrl('abc123')).toBe('/api/v1/public/tickets/abc123')
  })
})
