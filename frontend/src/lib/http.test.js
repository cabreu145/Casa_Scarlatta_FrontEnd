import { beforeEach, describe, expect, test, vi } from 'vitest'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

describe('http', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    localStorage.clear()
  })

  test('httpPost con FormData no stringify ni pone content-type json', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    })
    localStorage.setItem('token', 'token-123')

    const { httpPost } = await import('./http')
    const formData = new FormData()
    formData.append('file', new File(['x'], 'x.png', { type: 'image/png' }))

    const result = await httpPost('https://example.com/upload', formData)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer token-123')
    expect(init.headers['Content-Type']).toBeUndefined()
    expect(init.body).toBe(formData)
    expect(result).toEqual({ ok: true })
  })
})
