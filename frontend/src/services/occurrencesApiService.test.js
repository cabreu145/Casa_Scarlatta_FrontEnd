import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    claseOcurrencias: (id, { from, to } = {}) => `/api/v1/clases/${id}/ocurrencias?from=${from ?? ''}&to=${to ?? ''}`,
    clasesOcurrenciasBulk: ({ from, to, status } = {}) => `/api/v1/clases/ocurrencias?from=${from ?? ''}&to=${to ?? ''}&status=${status ?? ''}`,
  },
}))

const httpGet = vi.fn()
vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
}))

describe('occurrencesApiService', () => {
  beforeEach(async () => {
    httpGet.mockReset()
    const { clearOccurrencesInflightCache } = await import('./occurrencesApiService')
    clearOccurrencesInflightCache()
  })

  test('getOccurrencesByClassApi usa endpoint esperado', async () => {
    httpGet.mockResolvedValue([])
    const { getOccurrencesByClassApi } = await import('./occurrencesApiService')
    await getOccurrencesByClassApi(7, { from: '2026-05-29', to: '2026-06-04' })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/clases/7/ocurrencias?from=2026-05-29&to=2026-06-04', { signal: undefined })
  })

  test('getOccurrencesForDateRangeApi usa bulk y arma mapa por clase', async () => {
    httpGet.mockResolvedValue({ items: [
      { occurrence_id: 1, class_id: 7, available_spots: 11 },
      { occurrence_id: 2, class_id: 8, available_spots: 4 },
    ] })
    const { getOccurrencesForDateRangeApi } = await import('./occurrencesApiService')
    const result = await getOccurrencesForDateRangeApi([7, 8], { from: '2026-05-29', to: '2026-06-04', status: 'programada' })
    expect(result[7]).toHaveLength(1)
    expect(result[7][0].occurrenceId).toBe(1)
    expect(result[7][0].cupoDisponible).toBe(11)
    expect(result[8][0].occurrenceId).toBe(2)
    expect(httpGet).toHaveBeenCalledTimes(1)
  })

  test('vuelve al endpoint individual si backend interpreta ocurrencias como class_id', async () => {
    const error = new Error('Error de validación de request')
    error.status = 422
    error.details = { errors: [{ loc: ['path', 'class_id'] }] }
    httpGet
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce([{ id: 1, class_id: 7 }])
      .mockResolvedValueOnce([{ id: 2, class_id: 8 }])
    const { getOccurrencesForDateRangeApi } = await import('./occurrencesApiService')

    const result = await getOccurrencesForDateRangeApi([7, 8], { from: '2026-05-29', to: '2026-06-04' })

    expect(result[7][0].occurrenceId).toBe(1)
    expect(result[8][0].occurrenceId).toBe(2)
    expect(httpGet).toHaveBeenCalledTimes(3)
  })

  test('deduplica request en flight para misma clase/rango', async () => {
    let resolveFetch
    const pending = new Promise((resolve) => { resolveFetch = resolve })
    httpGet.mockReturnValueOnce(pending)
    const { getOccurrencesByClassApi, clearOccurrencesInflightCache } = await import('./occurrencesApiService')

    const p1 = getOccurrencesByClassApi(7, { from: '2026-05-29', to: '2026-06-04' })
    const p2 = getOccurrencesByClassApi(7, { from: '2026-05-29', to: '2026-06-04' })
    expect(httpGet).toHaveBeenCalledTimes(1)

    resolveFetch([{ id: 11 }])
    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1[0].occurrenceId).toBe(11)
    expect(r2[0].occurrenceId).toBe(11)
    clearOccurrencesInflightCache()
  })

  test('reusa respuesta reciente para misma clase y rango', async () => {
    httpGet.mockResolvedValue([{ id: 12 }])
    const { getOccurrencesByClassApi } = await import('./occurrencesApiService')
    await getOccurrencesByClassApi(7, { from: '2026-05-29', to: '2026-06-04' })
    await getOccurrencesByClassApi(7, { from: '2026-05-29', to: '2026-06-04' })
    expect(httpGet).toHaveBeenCalledTimes(1)
  })

  test('reusa rango semanal al seleccionar un día contenido', async () => {
    httpGet.mockResolvedValue([
      { id: 12, occurrence_date: '2026-06-02' },
      { id: 13, occurrence_date: '2026-06-04' },
    ])
    const { getOccurrencesByClassApi } = await import('./occurrencesApiService')
    await getOccurrencesByClassApi(7, { from: '2026-06-01', to: '2026-06-07' })
    const selectedDay = await getOccurrencesByClassApi(7, { from: '2026-06-04', to: '2026-06-04' })
    expect(httpGet).toHaveBeenCalledTimes(1)
    expect(selectedDay).toHaveLength(1)
    expect(selectedDay[0].occurrenceId).toBe(13)
  })

  test('runWithConcurrency limita concurrencia legacy', async () => {
    const { runWithConcurrency, OCCURRENCES_CONCURRENCY_LIMIT } = await import('./occurrencesApiService')
    let active = 0
    let maxActive = 0

    httpGet.mockImplementation(async () => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 10))
      active -= 1
      return []
    })

    await runWithConcurrency([1, 2, 3, 4, 5, 6], OCCURRENCES_CONCURRENCY_LIMIT, async () => httpGet())

    expect(maxActive).toBeLessThanOrEqual(OCCURRENCES_CONCURRENCY_LIMIT)
    expect(httpGet).toHaveBeenCalledTimes(6)
  })
})
