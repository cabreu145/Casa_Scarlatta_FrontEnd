import { QueryClient } from '@tanstack/react-query'
import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/api/queryKeys'
import { invalidateClassSideEffects } from './useApiQueries'

function seedClassQueries(queryClient) {
  const keys = [
    ['classes'],
    queryKeys.classes.list({ page: 1, pageSize: 20, search: '', discipline: 'all', status: 'all', coachId: 'all' }),
    queryKeys.classes.detail(3),
    queryKeys.classes.occurrences(3, { from: '2026-06-10', to: '2026-06-10' }),
    ['coaches'],
    queryKeys.coaches.list(),
    queryKeys.coaches.public(),
    queryKeys.coaches.detail(11),
    ['coachAgenda'],
    queryKeys.coachAgenda.me({ from: '2026-06-10', to: '2026-06-10' }),
    ['reservations'],
    queryKeys.reservations.me(),
    queryKeys.reservations.list(),
    ['spots'],
    queryKeys.spots.byOccurrence(301),
    ['spotHolds'],
    queryKeys.spotHolds.byOccurrence(301),
    ['waitlist'],
    queryKeys.waitlist.byOccurrence(301),
    queryKeys.occurrenceRoster.detail(301),
    ['reports'],
    queryKeys.reports.topClasses({ from: '2026-06-10', to: '2026-06-10', limit: 5 }),
    queryKeys.reports.occupancyByDiscipline({ from: '2026-06-10', to: '2026-06-10' }),
    queryKeys.reports.coaches({ from: '2026-06-10', to: '2026-06-10' }),
    queryKeys.reports.coachPayments({ from: '2026-06-10', to: '2026-06-10' }),
    ['activity'],
    queryKeys.activity.list({ page: 1, pageSize: 20 }),
    ['notifications'],
    queryKeys.notifications.list({ page: 1, pageSize: 10, unreadOnly: false, category: '' }),
    queryKeys.notifications.unreadCount(),
  ]
  keys.forEach((key) => queryClient.setQueryData(key, { seeded: true }))
  return keys
}

describe('useApiQueries - clases invalidation', () => {
  let queryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  })

  it('invalidateClassSideEffects invalida clases, vistas publicas, coach y reportes relacionados', async () => {
    const seededKeys = seedClassQueries(queryClient)

    await act(async () => {
      await invalidateClassSideEffects(queryClient, { classId: 3, occurrenceId: 301, coachId: 11 })
    })

    seededKeys.forEach((key) => {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    })
  })
})
