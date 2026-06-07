import { beforeEach, describe, expect, test, vi } from 'vitest'

const getMyFinancialStateApiMock = vi.fn()
let authState = {
  token: null,
  usuario: null,
}

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => authState,
  },
}))

vi.mock('@/services/financialStateApiService', () => ({
  getMyFinancialStateApi: (...args) => getMyFinancialStateApiMock(...args),
}))

describe('financialStateStore', () => {
  beforeEach(async () => {
    authState = { token: null, usuario: null }
    getMyFinancialStateApiMock.mockReset()
    const { useFinancialStateStore } = await import('./financialStateStore')
    useFinancialStateStore.getState().clearFinancialState()
  })

  test('no llama backend sin token ni cliente', async () => {
    const { useFinancialStateStore } = await import('./financialStateStore')

    const result = await useFinancialStateStore.getState().loadFinancialState({ enabled: true })

    expect(result).toBeNull()
    expect(getMyFinancialStateApiMock).not.toHaveBeenCalled()
  })

  test('no llama backend para rol no cliente', async () => {
    authState = {
      token: 'token-1',
      usuario: { id: 2, rol: 'coach' },
    }
    const { useFinancialStateStore } = await import('./financialStateStore')

    const result = await useFinancialStateStore.getState().loadFinancialState({ enabled: true })

    expect(result).toBeNull()
    expect(getMyFinancialStateApiMock).not.toHaveBeenCalled()
  })

  test('401 deja estado en unauthenticated y no reintenta solo', async () => {
    authState = {
      token: 'token-1',
      usuario: { id: 3, rol: 'cliente', email: 'cliente@casascarlatta.local' },
    }
    getMyFinancialStateApiMock.mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { status: 401 }))
    const { useFinancialStateStore } = await import('./financialStateStore')

    const firstResult = await useFinancialStateStore.getState().loadFinancialState({ enabled: true })
    const firstState = useFinancialStateStore.getState()

    expect(firstResult).toBeNull()
    expect(firstState.status).toBe('unauthenticated')
    expect(firstState.error).toBeNull()
    expect(firstState.financialState).toBeNull()
    expect(getMyFinancialStateApiMock).toHaveBeenCalledTimes(1)

    const secondResult = await useFinancialStateStore.getState().loadFinancialState({ enabled: true })
    expect(secondResult).toBeNull()
    expect(getMyFinancialStateApiMock).toHaveBeenCalledTimes(1)
  })
})