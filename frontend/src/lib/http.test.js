import { beforeEach, describe, expect, test, vi } from 'vitest'

describe('http client', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  test('GET público sale sin Authorization si no hay token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true }),
    })
    global.fetch = fetchMock

    const { httpGet } = await import('./http')
    await httpGet('/api/v1/clases')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBeUndefined()
  })

  test('GET privado agrega Authorization si existe token', async () => {
    localStorage.setItem('token', 'abc123')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true }),
    })
    global.fetch = fetchMock

    const { httpGet } = await import('./http')
    await httpGet('/api/v1/clientes/me/estado-financiero')

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer abc123')
  })
})
