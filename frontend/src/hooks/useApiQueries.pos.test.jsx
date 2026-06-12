import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/api/queryKeys'
import { invalidatePosSaleSideEffects, useCreatePosSaleMutation } from './useApiQueries'

vi.mock('@/services/posApiService', async () => {
  const actual = await vi.importActual('@/services/posApiService')
  return {
    ...actual,
    createSaleApi: vi.fn(),
  }
})

import { createSaleApi } from '@/services/posApiService'

function wrapper(queryClient) {
  return ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function seedPosQueries(queryClient, customerId = 7) {
  const keys = [
    ['admin', 'pos', 'sales'],
    ['admin', 'pos', 'products'],
    ['finance'],
    ['cashClosings'],
    ['reports'],
    ['activity'],
    ['notifications'],
    ['packages'],
    ['clients'],
    ['admin', 'clients'],
    queryKeys.myFinancialState,
    queryKeys.myMemberships,
    queryKeys.myCreditMovements(),
    queryKeys.myPayments(),
    queryKeys.clients.list({ page: 1, pageSize: 20, search: '', status: 'all', membershipStatus: 'all' }),
    queryKeys.clients.detail(customerId),
    queryKeys.adminClients({ page: 1, pageSize: 20, search: '', status: 'all', membershipStatus: 'all' }),
    queryKeys.adminClientDetail(customerId),
    queryKeys.packages.list(),
    queryKeys.packages.public(),
    queryKeys.reports.packages(),
    queryKeys.reports.users(),
    queryKeys.reports.pos(),
    queryKeys.reports.finance(),
  ]
  keys.forEach((key) => queryClient.setQueryData(key, { seeded: true }))
  return keys
}

describe('useApiQueries - POS invalidation', () => {
  let queryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    createSaleApi.mockResolvedValue({ id: 33, customerId: 7, packageId: 2 })
  })

  it('useCreatePosSaleMutation invalida finanzas, cliente, paquetes, reportes y pos sin reload', async () => {
    const seededKeys = seedPosQueries(queryClient)
    const { result } = renderHook(() => useCreatePosSaleMutation(), { wrapper: wrapper(queryClient) })

    await act(async () => {
      await result.current.mutateAsync({ customerId: 7, items: [], paymentMethod: 'cash', subtotalMxn: 100, taxMxn: 0, totalMxn: 100 })
    })

    expect(createSaleApi).toHaveBeenCalled()
    expect(createSaleApi.mock.calls[0][0]).toMatchObject({
      customerId: 7,
      items: [],
      paymentMethod: 'cash',
      subtotalMxn: 100,
      taxMxn: 0,
      totalMxn: 100,
    })
    seededKeys.forEach((key) => {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    })
  })

  it('invalidatePosSaleSideEffects cubre cliente autenticado y listas admin', async () => {
    const seededKeys = seedPosQueries(queryClient)

    await act(async () => {
      await invalidatePosSaleSideEffects(queryClient, { customerId: 7 })
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(queryKeys.myFinancialState)?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(queryKeys.clients.detail(7))?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(queryKeys.adminClientDetail(7))?.isInvalidated).toBe(true)
    })

    seededKeys.forEach((key) => {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    })
  })
})
