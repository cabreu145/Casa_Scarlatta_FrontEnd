import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ENDPOINTS } from '@/constants/api'

const httpGetMock = vi.fn()

vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGetMock(...args),
}))

describe('clientPaymentsApiService', () => {
  beforeEach(() => {
    httpGetMock.mockReset()
  })

  test('llama /api/v1/clientes/me/pagos con page, page_size y status', async () => {
    httpGetMock.mockResolvedValue({
      page: 1,
      page_size: 10,
      total: 1,
      items: [
        {
          external_reference: 'mp_ref_1',
          status: 'pending',
          package_id: 2,
        },
      ],
    })

    const { getMyPaymentsApi } = await import('./clientPaymentsApiService')
    const result = await getMyPaymentsApi({ page: 2, pageSize: 10, status: 'pending' })

    expect(httpGetMock).toHaveBeenCalledWith(ENDPOINTS.clientPayments({ page: 2, pageSize: 10, status: 'pending' }))
    expect(result).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 1,
      items: [
        {
          externalReference: 'mp_ref_1',
          status: 'pending',
          packageId: 2,
        },
      ],
    })
  })

  test('omite status si no viene', async () => {
    httpGetMock.mockResolvedValue({ page: 1, page_size: 10, total: 0, items: [] })

    const { getMyPaymentsApi } = await import('./clientPaymentsApiService')
    await getMyPaymentsApi({ page: 1, pageSize: 10 })

    expect(httpGetMock).toHaveBeenCalledWith(ENDPOINTS.clientPayments({ page: 1, pageSize: 10, status: undefined }))
  })

  test('lanza error claro si endpoint falta', async () => {
    const original = ENDPOINTS.clientPayments
    ENDPOINTS.clientPayments = undefined

    const { getMyPaymentsApi } = await import('./clientPaymentsApiService')
    await expect(getMyPaymentsApi()).rejects.toThrow('CLIENT_PAYMENTS_ENDPOINT_MISSING')

    ENDPOINTS.clientPayments = original
  })
})

