import { create } from 'zustand'
import { useAuthStore } from '@/stores/authStore'
import { getMyFinancialStateApi } from '@/services/financialStateApiService'

const initialState = {
  financialState: null,
  creditsBalance: 0,
  activeMembership: null,
  creditMovements: [],
  transactions: [],
  isLoading: false,
  error: null,
  status: 'idle',
  lastRequestedSignature: null,
}

const useApiAuth = import.meta.env.VITE_USE_API_AUTH === 'true'
const inflightLoads = new Map()

function buildAuthSignature() {
  const authState = useAuthStore.getState?.() ?? {}
  const token = authState.token ?? localStorage.getItem('token') ?? null
  const user = authState.usuario ?? null
  if (!token || !user || user.rol !== 'cliente') return null
  return `${String(user.id ?? user.email ?? 'cliente')}:${token}`
}

function resetUnauthenticatedState(signature = null) {
  return {
    financialState: null,
    creditsBalance: 0,
    activeMembership: null,
    creditMovements: [],
    transactions: [],
    isLoading: false,
    error: null,
    status: 'unauthenticated',
    lastRequestedSignature: signature,
  }
}

export const useFinancialStateStore = create((set, get) => ({
  ...initialState,
  loadFinancialState: async ({ enabled = true, force = false } = {}) => {
    if (!useApiAuth) return null
    if (!enabled) return null

    const signature = buildAuthSignature()
    if (!signature) {
      const current = get()
      if (current.status === 'unauthenticated' && current.lastRequestedSignature === null) {
        return null
      }
      set(resetUnauthenticatedState(null))
      return null
    }

    const current = get()
    if (!force && current.lastRequestedSignature === signature) {
      if (current.status === 'loading') {
        return inflightLoads.get(signature) ?? current.financialState
      }
      if (current.status === 'ready' || current.status === 'unauthenticated' || current.status === 'error') {
        return current.financialState
      }
    }

    if (inflightLoads.has(signature)) {
      return inflightLoads.get(signature)
    }

    set({
      isLoading: true,
      error: null,
      status: 'loading',
      lastRequestedSignature: signature,
    })

    const request = getMyFinancialStateApi()
      .then((data) => {
        set({
          financialState: data,
          creditsBalance: data?.creditsBalance ?? 0,
          activeMembership: data?.activeMembership ?? null,
          creditMovements: data?.creditMovements ?? [],
          transactions: data?.transactions ?? [],
          isLoading: false,
          error: null,
          status: 'ready',
          lastRequestedSignature: signature,
        })
        return data
      })
      .catch((error) => {
        const status = error?.status ?? error?.response?.status ?? null
        if (status === 401) {
          set(resetUnauthenticatedState(signature))
          return null
        }

        set({
          isLoading: false,
          error: error?.message ?? 'No se pudo cargar estado financiero',
          status: 'error',
          lastRequestedSignature: signature,
        })
        throw error
      })
      .finally(() => {
        inflightLoads.delete(signature)
      })

    inflightLoads.set(signature, request)
    return request
  },
  clearFinancialState: () => {
    inflightLoads.clear()
    set({ ...initialState })
  },
}))
