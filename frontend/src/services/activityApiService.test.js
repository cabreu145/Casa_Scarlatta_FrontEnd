import { describe, expect, test, vi, beforeEach } from 'vitest'

const httpGet = vi.fn()

vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
}))

describe('activityApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
  })

  test('construye URL con page y page_size', async () => {
    httpGet.mockResolvedValue({ page: 1, page_size: 20, total: 0, items: [] })
    const { getActivityApi } = await import('./activityApiService')

    await getActivityApi({ page: 2, pageSize: 20 })

    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('/api/v1/actividad?page=2&page_size=20'))
  })

  test('construye URL con category y rango', async () => {
    httpGet.mockResolvedValue({ page: 1, page_size: 20, total: 0, items: [] })
    const { getActivityApi } = await import('./activityApiService')

    await getActivityApi({
      category: 'reservas',
      from: '2026-06-09',
      to: '2026-06-09',
    })

    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('category=reservas'))
    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('from=2026-06-09'))
    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('to=2026-06-09'))
  })

  test('construye URL con actor_id y entity filters', async () => {
    httpGet.mockResolvedValue({ page: 1, page_size: 20, total: 0, items: [] })
    const { getActivityApi } = await import('./activityApiService')

    await getActivityApi({
      actorId: 3,
      entityType: 'reservation',
      entityId: 6,
    })

    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('actor_id=3'))
    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('entity_type=reservation'))
    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('entity_id=6'))
  })

  test('no usa page_size=1000', async () => {
    httpGet.mockResolvedValue({ page: 1, page_size: 20, total: 0, items: [] })
    const { getActivityApi } = await import('./activityApiService')

    await getActivityApi({ pageSize: 20 })

    expect(httpGet).not.toHaveBeenCalledWith(expect.stringContaining('page_size=1000'))
  })
})

