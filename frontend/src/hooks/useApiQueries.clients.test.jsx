import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/api/queryKeys'
import { updateClientMembershipExpirationApi } from '@/services/clientsApiService'
import { useUpdateClientMembershipExpirationMutation } from './useApiQueries'

vi.mock('@/services/clientsApiService', async () => {
  const actual = await vi.importActual('@/services/clientsApiService')
  return {
    ...actual,
    updateClientMembershipExpirationApi: vi.fn(),
  }
})

function wrapper(queryClient) {
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useApiQueries - client membership expiration', () => {
  let queryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
  })

  it('invalida detalle, listados y actividad al actualizar vigencia', async () => {
    updateClientMembershipExpirationApi.mockResolvedValue({
      id: 55,
      packageName: '12 créditos',
      expiresAt: '2026-07-31',
    })

    const keys = [
      queryKeys.adminClients({ page: 1, pageSize: 20, search: '', status: 'all', membershipStatus: 'all' }),
      queryKeys.adminClientDetail(12),
      queryKeys.clients.list({ page: 1 }),
      queryKeys.clients.detail(12),
      queryKeys.activity.list({ page: 1, pageSize: 20 }),
    ]
    keys.forEach((key) => queryClient.setQueryData(key, { seeded: true }))

    const { result } = renderHook(() => useUpdateClientMembershipExpirationMutation(), {
      wrapper: wrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        clientId: 12,
        membershipId: 55,
        expiresAt: '2026-07-31',
        notes: 'Extensión manual por cortesía',
      })
    })

    expect(updateClientMembershipExpirationApi).toHaveBeenCalledWith(12, 55, {
      expires_at: '2026-07-31',
      notes: 'Extensión manual por cortesía',
    })
    keys.forEach((key) => {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    })
  })
})
