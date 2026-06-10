import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    coachAgendaMe: ({ from, to }) => `/api/v1/coaches/me/agenda?from=${from}&to=${to}`,
  },
}))

const httpGet = vi.fn()
vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
}))

describe('coachAgendaApiService', () => {
  beforeEach(() => {
    vi.resetModules()
    httpGet.mockReset()
  })

  test('consulta endpoint correcto', async () => {
    httpGet.mockResolvedValue({ coach: {}, occurrences: [] })
    const { getMyCoachAgendaApi } = await import('./coachAgendaApiService')
    await getMyCoachAgendaApi({ from: '2026-06-01', to: '2026-06-07' })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/coaches/me/agenda?from=2026-06-01&to=2026-06-07')
  })
})
