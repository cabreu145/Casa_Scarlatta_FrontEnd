import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    claseOcurrencias: (id, { from, to } = {}) => `/api/v1/clases/${id}/ocurrencias?from=${from ?? ''}&to=${to ?? ''}`,
  },
}))

const httpGet = vi.fn()
vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
}))

describe('occurrencesApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
  })

  test('getOccurrencesByClassApi usa endpoint esperado', async () => {
    httpGet.mockResolvedValue([])
    const { getOccurrencesByClassApi } = await import('./occurrencesApiService')
    await getOccurrencesByClassApi(7, { from: '2026-05-29', to: '2026-06-04' })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/clases/7/ocurrencias?from=2026-05-29&to=2026-06-04', { signal: undefined })
  })

  test('getOccurrencesForDateRangeApi arma mapa por clase', async () => {
    httpGet.mockResolvedValue([{ id: 1 }, { id: 2 }])
    const { getOccurrencesForDateRangeApi } = await import('./occurrencesApiService')
    const result = await getOccurrencesForDateRangeApi([7], { from: '2026-05-29', to: '2026-06-04' })
    expect(result[7]).toHaveLength(2)
    expect(result[7][0].occurrenceId).toBe(1)
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
})

