import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpGet = vi.fn()
const httpPatch = vi.fn()

vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpPatch: (...args) => httpPatch(...args),
}))

describe('notificationsApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpPatch.mockReset()
  })

  it('lista notificaciones con filtros', async () => {
    httpGet.mockResolvedValueOnce({ page: 1, page_size: 10, total: 1, items: [] })
    const { getNotificationsApi } = await import('./notificationsApiService')

    await getNotificationsApi({ page: 2, pageSize: 10, unreadOnly: true, category: 'reservas' })

    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('/api/v1/notificaciones?page=2&page_size=10&unread_only=true&category=reservas'))
  })

  it('obtiene unread count y marca leida', async () => {
    httpGet.mockResolvedValueOnce({ unread_count: 3 })
    httpPatch.mockResolvedValueOnce({ id: 1, read: true })
    const { getUnreadNotificationsCountApi, markNotificationReadApi, markAllNotificationsReadApi } = await import('./notificationsApiService')

    const unread = await getUnreadNotificationsCountApi()
    await markNotificationReadApi(9)
    await markAllNotificationsReadApi()

    expect(unread.unreadCount).toBe(3)
    expect(httpPatch).toHaveBeenNthCalledWith(1, expect.stringContaining('/api/v1/notificaciones/9/read'), {})
    expect(httpPatch).toHaveBeenNthCalledWith(2, expect.stringContaining('/api/v1/notificaciones/read-all'), {})
  })
})
