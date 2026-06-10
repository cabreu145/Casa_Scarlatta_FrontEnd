import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpGet = vi.fn()
const httpPost = vi.fn()

vi.mock('@/lib/http', () => ({
  httpGet: (...args) => httpGet(...args),
  httpPost: (...args) => httpPost(...args),
}))

describe('emailOutboxApiService', () => {
  beforeEach(() => {
    httpGet.mockReset()
    httpPost.mockReset()
  })

  it('lista outbox con filtros', async () => {
    httpGet.mockResolvedValueOnce({ page: 1, page_size: 10, total: 0, items: [] })
    const { getEmailOutboxApi } = await import('./emailOutboxApiService')

    await getEmailOutboxApi({ page: 3, pageSize: 10, status: 'failed' })

    expect(httpGet).toHaveBeenCalledWith(expect.stringContaining('/api/v1/email/outbox?page=3&page_size=10&status=failed'))
  })

  it('reintenta outbox', async () => {
    httpPost.mockResolvedValueOnce({ id: 7, status: 'pending' })
    const { retryEmailOutboxApi } = await import('./emailOutboxApiService')

    await retryEmailOutboxApi(7)

    expect(httpPost).toHaveBeenCalledWith(expect.stringContaining('/api/v1/email/outbox/7/retry'), {})
  })
})
