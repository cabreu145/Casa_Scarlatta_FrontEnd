import { describe, expect, test } from 'vitest'
import { mapBackendExpenseToFrontend, mapBackendExpensesToFrontend } from './expenseAdapter'

describe('expenseAdapter', () => {
  test('mapea gasto backend a frontend', () => {
    const mapped = mapBackendExpenseToFrontend({
      id: 1,
      expense_date: '2026-06-09',
      category: 'insumos',
      description: 'Compra de agua y limpieza',
      amount_mxn: 350,
      payment_method: 'cash',
      status: 'active',
      notes: 'Compra local',
      created_by_user_id: 5,
      created_at: '2026-06-09T10:00:00-06:00',
      updated_at: '2026-06-09T10:00:00-06:00',
      cancelled_at: null,
      cancelled_by_user_id: null,
    })

    expect(mapped).toMatchObject({
      id: 1,
      expenseId: 1,
      expenseDate: '2026-06-09',
      category: 'insumos',
      description: 'Compra de agua y limpieza',
      amountMxn: 350,
      paymentMethod: 'cash',
      status: 'active',
      notes: 'Compra local',
      createdByUserId: 5,
      createdAt: '2026-06-09T10:00:00-06:00',
      updatedAt: '2026-06-09T10:00:00-06:00',
      cancelledAt: null,
      cancelledByUserId: null,
      isCancelled: false,
      isActive: true,
    })
  })

  test('mapea gasto cancelado y lista de gastos', () => {
    const mapped = mapBackendExpenseToFrontend({
      id: 2,
      expense_date: '2026-06-08',
      category: 'limpieza',
      description: 'Registro duplicado',
      amount_mxn: 120,
      payment_method: 'card',
      status: 'cancelled',
      cancelled_at: '2026-06-08T12:00:00-06:00',
    })

    expect(mapped).toMatchObject({
      id: 2,
      status: 'cancelled',
      isCancelled: true,
      paymentMethod: 'card',
      cancelledAt: '2026-06-08T12:00:00-06:00',
    })

    const list = mapBackendExpensesToFrontend([{ id: 1, expense_date: '2026-06-09' }])
    expect(list[0]).toMatchObject({ id: 1, expenseDate: '2026-06-09' })
  })
})
