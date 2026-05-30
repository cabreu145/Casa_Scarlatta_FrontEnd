import { describe, expect, test } from 'vitest'
import { mapFinancialStateToFrontend } from './financialStateAdapter'

describe('financialStateAdapter', () => {
  test('mapea payload completo', () => {
    const mapped = mapFinancialStateToFrontend({
      user_id: 3,
      credits_balance: 8,
      active_membership: {
        id: 10,
        package_id: 2,
        package_name: 'Paquete 10 clases',
        status: 'activa',
        credits_total: 10,
        credits_used: 2,
        credits_available: 8,
      },
      credit_movements: [{ id: 1, type: 'reservation_debit', amount: -1, balance_after: 8 }],
      transactions: [],
    })

    expect(mapped.userId).toBe(3)
    expect(mapped.creditsBalance).toBe(8)
    expect(mapped.activeMembership?.packageName).toBe('Paquete 10 clases')
    expect(mapped.creditMovements).toHaveLength(1)
    expect(mapped.transactions).toHaveLength(0)
  })

  test('tolera membership null y arrays vacíos', () => {
    const mapped = mapFinancialStateToFrontend({
      user_id: 3,
      credits_balance: 0,
      active_membership: null,
      credit_movements: [],
      transactions: [],
    })
    expect(mapped.activeMembership).toBeNull()
    expect(mapped.creditMovements).toEqual([])
    expect(mapped.transactions).toEqual([])
  })
})
