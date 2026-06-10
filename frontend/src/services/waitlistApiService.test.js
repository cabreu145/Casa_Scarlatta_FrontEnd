import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    waitlistByClase: (claseId) => `/api/v1/lista-espera?claseId=${claseId}`,
    waitlistByOccurrence: (occurrenceId) => `/api/v1/lista-espera?occurrenceId=${occurrenceId}`,
    waitlist: '/api/v1/lista-espera',
    waitlistEntryById: (id) => `/api/v1/lista-espera/${id}`,
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

describe('waitlistApiService', () => {
  beforeEach(() => {
    vi.resetModules()
    httpGet.mockReset()
    httpPost.mockReset()
    httpDelete.mockReset()
  })

  test('consulta waitlist por occurrence en endpoint correcto', async () => {
    vi.stubEnv('VITE_USE_API_WAITLIST', 'true')
    httpGet.mockResolvedValue({ occurrence_id: 77, entries: [] })
    const { getWaitlistByOccurrenceApi } = await import('./waitlistApiService')
    await getWaitlistByOccurrenceApi(77)
    expect(httpGet).toHaveBeenCalledWith('/api/v1/lista-espera?occurrenceId=77')
    vi.unstubAllEnvs()
  })

  test('unirse waitlist envía payload correcto', async () => {
    vi.stubEnv('VITE_USE_API_WAITLIST', 'true')
    httpPost.mockResolvedValue({ id: 1, class_id: 9, occurrence_id: 77, user_id: 3 })
    const { unirseWaitlistApi } = await import('./waitlistApiService')
    await unirseWaitlistApi({ occurrenceId: 77, userId: 3 })
    expect(httpPost).toHaveBeenCalledWith('/api/v1/lista-espera', {
      occurrence_id: 77,
      user_id: 3,
    })
    vi.unstubAllEnvs()
  })

  test('salir waitlist usa delete por entry id', async () => {
    vi.stubEnv('VITE_USE_API_WAITLIST', 'true')
    httpDelete.mockResolvedValue({ id: 11, occurrence_id: 77, user_id: 3 })
    const { salirWaitlistApi } = await import('./waitlistApiService')
    await salirWaitlistApi(11)
    expect(httpDelete).toHaveBeenCalledWith('/api/v1/lista-espera/11')
    vi.unstubAllEnvs()
  })

  test('en modo API, getWaitlistByClaseApi falla para evitar endpoint legacy', async () => {
    vi.stubEnv('VITE_USE_API_WAITLIST', 'true')
    const { getWaitlistByClaseApi } = await import('./waitlistApiService')
    await expect(getWaitlistByClaseApi(9)).rejects.toThrow('WAITLIST_OCCURRENCE_REQUIRED')
    expect(httpGet).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })
})
