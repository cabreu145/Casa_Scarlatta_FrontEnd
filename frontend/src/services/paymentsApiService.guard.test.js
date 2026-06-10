import { describe, expect, test, vi } from 'vitest'

test('paymentsApiService lanza error claro si endpoint falta', async () => {
  vi.resetModules()
  vi.doMock('@/constants/api', () => ({
    ENDPOINTS: {},
  }))
  vi.doMock('@/lib/http', () => ({
    httpGet: vi.fn(),
    httpPost: vi.fn(),
  }))

  const { createCheckoutPreferenceApi, getPaymentStatusApi } = await import('./paymentsApiService')

  await expect(createCheckoutPreferenceApi({ packageId: 2 })).rejects.toThrow('PAYMENT_CHECKOUT_ENDPOINT_MISSING')
  await expect(getPaymentStatusApi({ externalReference: 'ref' })).rejects.toThrow('PAYMENT_STATUS_ENDPOINT_MISSING')
})
