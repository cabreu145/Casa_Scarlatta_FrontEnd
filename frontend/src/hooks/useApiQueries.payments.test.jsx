import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/api/queryKeys'
import { usePaymentStatusQuery } from './useApiQueries'

vi.mock('@/services/paymentsApiService', async () => {
  const actual = await vi.importActual('@/services/paymentsApiService')
  return {
    ...actual,
    getPaymentStatusApi: vi.fn(),
  }
})

import { getPaymentStatusApi } from '@/services/paymentsApiService'

function wrapper(queryClient) {
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('usePaymentStatusQuery', () => {
  let queryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
  })

  it('usa query key estable y consulta por external_reference', async () => {
    getPaymentStatusApi.mockResolvedValue({ externalReference: 'ref-hook', status: 'pending', applied: false })

    const { result } = renderHook(
      () => usePaymentStatusQuery('ref-hook'),
      { wrapper: wrapper(queryClient) }
    )

    await waitFor(() => {
      expect(result.current.data?.status).toBe('pending')
    })

    expect(getPaymentStatusApi).toHaveBeenCalledTimes(1)
    expect(getPaymentStatusApi).toHaveBeenCalledWith({ externalReference: 'ref-hook' })
    expect(queryClient.getQueryData(queryKeys.payments.status('ref-hook'))).toMatchObject({
      externalReference: 'ref-hook',
      status: 'pending',
    })
  })

  it('no consulta si falta external_reference', () => {
    renderHook(
      () => usePaymentStatusQuery(null),
      { wrapper: wrapper(queryClient) }
    )

    expect(getPaymentStatusApi).not.toHaveBeenCalled()
  })
})
