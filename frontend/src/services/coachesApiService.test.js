import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/constants/api', () => ({
  ENDPOINTS: {
    coaches: '/api/v1/coaches',
  },
}))

const httpGet = vi.fn()
vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
}))

describe('coachesApiService', () => {
  beforeEach(() => {
    vi.resetModules()
    httpGet.mockReset()
  })

  test('consulta coaches y mapea ids canónicos', async () => {
    httpGet.mockResolvedValue([{ id: 1, name: 'Coach Uno' }])
    const { getCoachesApi } = await import('./coachesApiService')
    const rows = await getCoachesApi()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/coaches')
    expect(rows[0].coachId).toBe(1)
  })
})
