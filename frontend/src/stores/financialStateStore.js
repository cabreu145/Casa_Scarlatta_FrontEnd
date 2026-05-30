import { create } from 'zustand'
import { getMyFinancialStateApi } from '@/services/financialStateApiService'

const initialState = {
  financialState: null,
  creditsBalance: 0,
  activeMembership: null,
  creditMovements: [],
  transactions: [],
  isLoading: false,
  error: null,
}

const useApiAuth = import.meta.env.VITE_USE_API_AUTH === 'true'

export const useFinancialStateStore = create((set) => ({
  ...initialState,
  loadFinancialState: async () => {
    if (!useApiAuth) return null
    set({ isLoading: true, error: null })
    try {
      const data = await getMyFinancialStateApi()
      set({
        financialState: data,
        creditsBalance: data?.creditsBalance ?? 0,
        activeMembership: data?.activeMembership ?? null,
        creditMovements: data?.creditMovements ?? [],
        transactions: data?.transactions ?? [],
        isLoading: false,
      })
      return data
    } catch (error) {
      set({
        isLoading: false,
        error: error?.message ?? 'No se pudo cargar estado financiero',
      })
      throw error
    }
  },
  clearFinancialState: () => set({ ...initialState }),
}))
