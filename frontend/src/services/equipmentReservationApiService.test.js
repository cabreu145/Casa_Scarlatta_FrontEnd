import { beforeEach, describe, expect, test, vi } from 'vitest'

let apiEndpoints
vi.mock('@/constants/api', () => ({
  get ENDPOINTS() {
    return apiEndpoints
  },
}))

const httpGet = vi.fn()
const httpPost = vi.fn()
const httpDelete = vi.fn()
vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpPost: (...args) => httpPost(...args),
  httpDelete: (...args) => httpDelete(...args),
}))

describe('equipmentReservationApiService', () => {
  beforeEach(() => {
    apiEndpoints = {
      occurrenceSpots: (occurrenceId) => `/api/v1/reservas/ocurrencias/${occurrenceId}/spots`,
      spotHolds: '/api/v1/reservas/holds',
      spotHoldById: (holdId) => `/api/v1/reservas/holds/${holdId}`,
    }
    httpGet.mockReset()
    httpPost.mockReset()
    httpDelete.mockReset()
  })

  test('getOccurrenceSpotsApi llama endpoint correcto', async () => {
    httpGet.mockResolvedValue({
      occurrence_id: 5,
      discipline: 'slow',
      spots: [],
    })
    const { getOccurrenceSpotsApi } = await import('./equipmentReservationApiService')
    const result = await getOccurrenceSpotsApi({ occurrenceId: 5 })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/reservas/ocurrencias/5/spots')
    expect(result.occurrenceId).toBe(5)
  })

  test('createSpotHoldApi manda occurrence_id y spot_id', async () => {
    httpPost.mockResolvedValue({
      hold_id: 123,
      occurrence_id: 5,
      spot_id: 1,
      status: 'held',
      expires_at: '2026-06-03T02:35:00',
      server_now: '2026-06-03T02:30:00',
    })
    const { createSpotHoldApi } = await import('./equipmentReservationApiService')
    const result = await createSpotHoldApi({ occurrenceId: 5, spotId: 1 })
    expect(httpPost).toHaveBeenCalledWith('/api/v1/reservas/holds', {
      occurrence_id: 5,
      spot_id: 1,
    })
    expect(result.holdId).toBe(123)
  })

  test('releaseSpotHoldApi llama DELETE correcto', async () => {
    httpDelete.mockResolvedValue({
      hold_id: 123,
      occurrence_id: 5,
      spot_id: 1,
      status: 'released',
    })
    const { releaseSpotHoldApi } = await import('./equipmentReservationApiService')
    const result = await releaseSpotHoldApi({ holdId: 123 })
    expect(httpDelete).toHaveBeenCalledWith('/api/v1/reservas/holds/123')
    expect(result.status).toBe('released')
  })

  test('lanza error claro si endpoint falta', async () => {
    apiEndpoints = {}
    vi.resetModules()
    const { getOccurrenceSpotsApi } = await import('./equipmentReservationApiService')
    await expect(getOccurrenceSpotsApi({ occurrenceId: 5 })).rejects.toThrow('OCCURRENCE_SPOTS_ENDPOINT_MISSING')
  })
})
