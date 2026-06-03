import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    createPaymentCheckoutPreference: '/api/v1/pagos/checkout-preference',
    getPaymentStatus: ({ externalReference }) =>
      `/api/v1/pagos/estado?external_reference=${externalReference}`,
  },
}))

const httpPost = vi.fn()
const httpGet = vi.fn()
vi.mock('@/lib/http', () => ({
  httpPost: (...args) => httpPost(...args),
  httpGet: (...args) => httpGet(...args),
}))

describe('paymentsApiService', () => {
  beforeEach(() => {
    httpPost.mockReset()
    httpGet.mockReset()
  })

  test('createCheckoutPreferenceApi envia package_id', async () => {
    httpPost.mockResolvedValue({ checkout_url: 'https://checkout', external_reference: 'ref', preference_id: 'pref', status: 'created' })
    const { createCheckoutPreferenceApi } = await import('./paymentsApiService')
    const result = await createCheckoutPreferenceApi({ packageId: 2 })
    expect(httpPost).toHaveBeenCalledWith('/api/v1/pagos/checkout-preference', { package_id: 2 })
    expect(result.checkoutUrl).toBe('https://checkout')
  })

  test('getPaymentStatusApi consulta por external_reference', async () => {
    httpGet.mockResolvedValue({ external_reference: 'ref', status: 'pending' })
    const { getPaymentStatusApi } = await import('./paymentsApiService')
    const result = await getPaymentStatusApi({ externalReference: 'ref' })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/pagos/estado?external_reference=ref')
    expect(result.status).toBe('pending')
  })
})
