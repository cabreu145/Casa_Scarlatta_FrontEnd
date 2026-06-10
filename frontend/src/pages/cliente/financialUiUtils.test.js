import { describe, expect, test } from 'vitest'
import { resolveFinancialUiState } from './financialUiUtils'

describe('financialUiUtils', () => {
  test('API mode loading no muestra 0 definitivo', () => {
    const state = resolveFinancialUiState({
      useApiFinancialState: true,
      financialState: null,
      activeMembership: null,
      creditsBalance: 0,
      isFinancialStateLoading: true,
      financialStateError: null,
      usuario: null,
    })
    expect(state.status).toBe('loading')
    expect(state.clasesRestantes).toBe('--')
  })

  test('API mode usa creditsAvailable cuando hay membresia activa', () => {
    const state = resolveFinancialUiState({
      useApiFinancialState: true,
      financialState: { userId: 3 },
      activeMembership: {
        packageName: 'Paquete 10 clases',
        creditsAvailable: 8,
        creditsTotal: 10,
        creditsUsed: 2,
      },
      creditsBalance: 8,
      isFinancialStateLoading: false,
      financialStateError: null,
      usuario: null,
    })
    expect(state.status).toBe('ready')
    expect(state.clasesRestantes).toBe(8)
    expect(state.clasesTotal).toBe(10)
    expect(state.clasesUsadas).toBe(2)
  })

  test('API mode con 0 real muestra 0', () => {
    const state = resolveFinancialUiState({
      useApiFinancialState: true,
      financialState: { userId: 3 },
      activeMembership: {
        packageName: 'Paquete 10 clases',
        creditsAvailable: 0,
        creditsTotal: 10,
        creditsUsed: 10,
      },
      creditsBalance: 0,
      isFinancialStateLoading: false,
      financialStateError: null,
      usuario: null,
    })
    expect(state.status).toBe('ready')
    expect(state.clasesRestantes).toBe(0)
  })

  test('API mode sin membresia activa muestra estado sin plan', () => {
    const state = resolveFinancialUiState({
      useApiFinancialState: true,
      financialState: { userId: 3 },
      activeMembership: null,
      creditsBalance: 0,
      isFinancialStateLoading: false,
      financialStateError: null,
      usuario: null,
    })
    expect(state.status).toBe('no_membership')
    expect(state.planNombre).toBe('Sin plan')
  })

  test('Fallback mock se mantiene cuando API mode esta en false', () => {
    const state = resolveFinancialUiState({
      useApiFinancialState: false,
      financialState: null,
      activeMembership: null,
      creditsBalance: 999,
      isFinancialStateLoading: false,
      financialStateError: null,
      usuario: { paquete: 'Mock Pack', clasesPaquete: 5, clasesPaqueteTotal: 10 },
    })
    expect(state.status).toBe('ready')
    expect(state.planNombre).toBe('Mock Pack')
    expect(state.clasesRestantes).toBe(5)
  })
})
