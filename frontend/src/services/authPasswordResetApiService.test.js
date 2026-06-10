import { beforeEach, describe, expect, test, vi } from 'vitest'

const httpPost = vi.fn()

vi.mock('@/lib/http', () => ({
  httpPost: (...args) => httpPost(...args),
}))

describe('authPasswordResetApiService', () => {
  beforeEach(() => {
    httpPost.mockReset()
  })

  test('requestPasswordResetApi llama endpoint correcto', async () => {
    httpPost.mockResolvedValueOnce({})
    const { requestPasswordResetApi } = await import('./authPasswordResetApiService')

    await requestPasswordResetApi('cliente@casascarlatta.mx')

    expect(httpPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/reset-password/request'),
      { email: 'cliente@casascarlatta.mx' },
    )
  })

  test('confirmPasswordResetApi llama endpoint correcto', async () => {
    httpPost.mockResolvedValueOnce({})
    const { confirmPasswordResetApi } = await import('./authPasswordResetApiService')

    await confirmPasswordResetApi({ token: 'abc123', newPassword: 'NuevaPassword123' })

    expect(httpPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/reset-password/confirm'),
      { token: 'abc123', new_password: 'NuevaPassword123' },
    )
  })
})
