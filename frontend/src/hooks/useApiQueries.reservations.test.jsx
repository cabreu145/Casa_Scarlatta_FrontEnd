import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { queryKeys } from '@/api/queryKeys'
import {
  useCreateSpotHoldMutation,
  useDeleteSpotHoldMutation,
  useCreateReservationMutation,
  useCancelReservationMutation,
} from './useApiQueries'

vi.mock('@/services/equipmentReservationApiService', async () => {
  const actual = await vi.importActual('@/services/equipmentReservationApiService')
  return {
    ...actual,
    createSpotHoldApi: vi.fn(),
    releaseSpotHoldApi: vi.fn(),
    getOccurrenceSpotsApi: vi.fn(),
  }
})

vi.mock('@/services/reservasApiService', async () => {
  const actual = await vi.importActual('@/services/reservasApiService')
  return {
    ...actual,
    crearReservaApi: vi.fn(),
    cancelarReservaApi: vi.fn(),
    getMisReservasPaginatedApi: vi.fn(),
    getOccurrenceRosterApi: vi.fn(),
  }
})

import {
  createSpotHoldApi,
  releaseSpotHoldApi,
} from '@/services/equipmentReservationApiService'
import {
  crearReservaApi,
  cancelarReservaApi,
} from '@/services/reservasApiService'

const OCCURRENCE_ID = 5
const CLASS_ID = 9

function seedInvalidatableQueries(queryClient) {
  const keys = [
    queryKeys.spots.byOccurrence(OCCURRENCE_ID),
    queryKeys.spotHolds.byOccurrence(OCCURRENCE_ID),
    queryKeys.reservations.me(),
    queryKeys.reservations.list(),
    queryKeys.classes.occurrences(CLASS_ID),
    ['occurrenceRoster', OCCURRENCE_ID],
    queryKeys.waitlist.byOccurrence(OCCURRENCE_ID),
    queryKeys.myFinancialState,
    queryKeys.myCreditMovements(),
    queryKeys.notifications.list(),
    queryKeys.notifications.unreadCount(),
    queryKeys.activity.list(),
  ]
  keys.forEach((key) => queryClient.setQueryData(key, { seeded: true }))
  return keys
}

function expectAllInvalidated(queryClient, keys) {
  keys.forEach((key) => {
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })
}

function wrapper(queryClient) {
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useApiQueries - asientos/holds/reservas (P0)', () => {
  let queryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
  })

  it('useCreateSpotHoldMutation invalida spots y spotHolds de la ocurrencia', async () => {
    createSpotHoldApi.mockResolvedValue({ holdId: 123, occurrenceId: OCCURRENCE_ID, spotId: 1, expiresAt: '2026-06-03T02:35:00' })
    queryClient.setQueryData(queryKeys.spots.byOccurrence(OCCURRENCE_ID), { seeded: true })
    queryClient.setQueryData(queryKeys.spotHolds.byOccurrence(OCCURRENCE_ID), { seeded: true })

    const { result } = renderHook(() => useCreateSpotHoldMutation(), { wrapper: wrapper(queryClient) })

    await act(async () => {
      await result.current.mutateAsync({ occurrenceId: OCCURRENCE_ID, spotId: 1 })
    })

    expect(createSpotHoldApi).toHaveBeenCalledWith({ occurrenceId: OCCURRENCE_ID, spotId: 1 })
    expect(queryClient.getQueryState(queryKeys.spots.byOccurrence(OCCURRENCE_ID))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.spotHolds.byOccurrence(OCCURRENCE_ID))?.isInvalidated).toBe(true)
  })

  it('useDeleteSpotHoldMutation invalida spots y spotHolds de la ocurrencia', async () => {
    releaseSpotHoldApi.mockResolvedValue({ ok: true })
    queryClient.setQueryData(queryKeys.spots.byOccurrence(OCCURRENCE_ID), { seeded: true })
    queryClient.setQueryData(queryKeys.spotHolds.byOccurrence(OCCURRENCE_ID), { seeded: true })

    const { result } = renderHook(() => useDeleteSpotHoldMutation(), { wrapper: wrapper(queryClient) })

    await act(async () => {
      await result.current.mutateAsync({ holdId: 123, occurrenceId: OCCURRENCE_ID })
    })

    expect(releaseSpotHoldApi).toHaveBeenCalledWith({ holdId: 123 })
    expect(queryClient.getQueryState(queryKeys.spots.byOccurrence(OCCURRENCE_ID))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.spotHolds.byOccurrence(OCCURRENCE_ID))?.isInvalidated).toBe(true)
  })

  it('useCreateReservationMutation invalida reservas, créditos, notificaciones y spots sin necesitar reload', async () => {
    crearReservaApi.mockResolvedValue({ id: 77, spotId: 1, holdId: 123, occurrenceId: OCCURRENCE_ID, status: 'confirmada' })
    const keys = seedInvalidatableQueries(queryClient)

    const { result } = renderHook(() => useCreateReservationMutation(), { wrapper: wrapper(queryClient) })

    await act(async () => {
      await result.current.mutateAsync({
        claseId: CLASS_ID,
        userId: 3,
        occurrenceId: OCCURRENCE_ID,
        spotId: 1,
        holdId: 123,
      })
    })

    expect(crearReservaApi).toHaveBeenCalledWith({
      claseId: CLASS_ID,
      userId: 3,
      asiento: undefined,
      occurrenceId: OCCURRENCE_ID,
      spotId: 1,
      holdId: 123,
    })
    expectAllInvalidated(queryClient, keys)
  })

  it('useCancelReservationMutation invalida reservas, créditos, notificaciones y spots sin necesitar reload', async () => {
    cancelarReservaApi.mockResolvedValue({ ok: true })
    const keys = seedInvalidatableQueries(queryClient)

    const { result } = renderHook(() => useCancelReservationMutation(), { wrapper: wrapper(queryClient) })

    await act(async () => {
      await result.current.mutateAsync({
        reservationId: 77,
        occurrenceId: OCCURRENCE_ID,
        classId: CLASS_ID,
      })
    })

    expect(cancelarReservaApi).toHaveBeenCalledWith(77)
    expectAllInvalidated(queryClient, keys)
  })

  it('tras crear y cancelar una reserva, myFinancialState queda invalidado para reflejar créditos sin refresh manual', async () => {
    crearReservaApi.mockResolvedValue({ id: 77, spotId: 1, holdId: 123, occurrenceId: OCCURRENCE_ID, status: 'confirmada' })
    queryClient.setQueryData(queryKeys.myFinancialState, { creditsBalance: 10 })
    queryClient.setQueryData(queryKeys.myCreditMovements(), { items: [], total: 0 })

    const { result } = renderHook(() => useCreateReservationMutation(), { wrapper: wrapper(queryClient) })

    await act(async () => {
      await result.current.mutateAsync({
        claseId: CLASS_ID,
        userId: 3,
        occurrenceId: OCCURRENCE_ID,
        spotId: 1,
        holdId: 123,
      })
    })

    await waitFor(() => {
      expect(queryClient.getQueryState(queryKeys.myFinancialState)?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(queryKeys.myCreditMovements())?.isInvalidated).toBe(true)
    })
  })
})
