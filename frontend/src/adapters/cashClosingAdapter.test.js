import { describe, expect, test } from 'vitest'
import { mapBackendCashClosingToFrontend, mapBackendCashClosingsToFrontend, normalizeCashClosing } from './cashClosingAdapter'

describe('cashClosingAdapter', () => {
  test('mapea resumen backend a frontend', () => {
    const mapped = mapBackendCashClosingToFrontend({
      id: 10,
      date: '2026-06-09',
      is_closed: false,
      sales_count: 4,
      subtotal_mxn: 1000,
      tax_mxn: 160,
      total_mxn: 1160,
      cash_total_mxn: 500,
      card_total_mxn: 300,
      transfer_total_mxn: 360,
      other_total_mxn: 0,
      expenses_total_mxn: 0,
      net_total_mxn: 1160,
    })

    expect(mapped).toMatchObject({
      id: 10,
      cashClosingId: 10,
      date: '2026-06-09',
      isClosed: false,
      salesCount: 4,
      subtotalMxn: 1000,
      taxMxn: 160,
      totalMxn: 1160,
      cashTotalMxn: 500,
      cardTotalMxn: 300,
      transferTotalMxn: 360,
      otherTotalMxn: 0,
      expensesTotalMxn: 0,
      netTotalMxn: 1160,
    })
  })

  test('mapea ventas incluidas en detalle', () => {
    const mapped = mapBackendCashClosingToFrontend({
      id: 11,
      date: '2026-06-09',
      sales: [
        {
          id: 100,
          folio: 'POS-000100',
          customer_name: 'Cliente Demo',
          payment_method: 'cash',
          subtotal_mxn: 100,
          tax_mxn: 16,
          total_mxn: 116,
          created_at: '2026-06-09T12:00:00-06:00',
        },
      ],
    })

    expect(mapped.sales[0]).toMatchObject({
      id: 100,
      folio: 'POS-000100',
      customerName: 'Cliente Demo',
      paymentMethod: 'cash',
      subtotalMxn: 100,
      taxMxn: 16,
      totalMxn: 116,
      createdAt: '2026-06-09T12:00:00-06:00',
    })
  })

  test('mapea lista de cortes', () => {
    const mapped = mapBackendCashClosingsToFrontend([{ id: 1, date: '2026-06-09' }])
    expect(mapped[0]).toMatchObject({ id: 1, date: '2026-06-09' })
  })

  test('normalizeCashClosing: mapea campos de turno snake y camel', () => {
    const raw = {
      id: 10,
      date: '2026-06-19',
      shiftKey: 'turno_1',
      shiftLabel: 'Turno 1',
      shiftStartAt: '2026-06-19T07:00:00-06:00',
      shiftEndAt: '2026-06-19T15:00:00-06:00',
      status: 'open',
      isOpen: true,
      isClosed: false,
      opening_cash_mxn: 500,
      cash_outflows_mxn: 150,
      expected_cash_mxn: 1550,
      counted_cash_mxn: null,
      cash_difference_mxn: null,
    }
    const n = normalizeCashClosing(raw)
    expect(n.shiftKey).toBe('turno_1')
    expect(n.shiftLabel).toBe('Turno 1')
    expect(n.isOpen).toBe(true)
    expect(n.isClosed).toBe(false)
    expect(n.openingCashMxn).toBe(500)
    expect(n.cashOutflowsMxn).toBe(150)
    expect(n.expectedCashMxn).toBe(1550)
    expect(n.countedCashMxn).toBeNull()
    expect(n.cashDifferenceMxn).toBeNull()
  })

  test('normalizeCashClosing: acepta campos snake_case de turno', () => {
    const raw = {
      shift_key: 'turno_2',
      shift_label: 'Turno 2',
      status: 'closed',
      counted_cash_mxn: 1600,
      cash_difference_mxn: 50,
    }
    const n = normalizeCashClosing(raw)
    expect(n.shiftKey).toBe('turno_2')
    expect(n.shiftLabel).toBe('Turno 2')
    expect(n.isClosed).toBe(true)
    expect(n.countedCashMxn).toBe(1600)
    expect(n.cashDifferenceMxn).toBe(50)
  })

  test('normalizeCashClosing: fallback a dia_completo si no hay turno', () => {
    const n = normalizeCashClosing({ id: 1, date: '2026-06-01', status: 'closed' })
    expect(n.shiftKey).toBe('dia_completo')
    expect(n.shiftLabel).toBe('Día completo')
  })

  test('normalizeCashClosing: mapea gastos incluidos', () => {
    const raw = {
      expenses: [
        {
          expense_id: 55,
          category: 'operacion',
          description: 'Compra de insumos',
          payment_method: 'cash',
          amount_mxn: 150,
          expense_date: '2026-06-19',
        },
      ],
    }
    const n = normalizeCashClosing(raw)
    expect(n.expenses[0]).toMatchObject({
      expenseId: 55,
      category: 'operacion',
      description: 'Compra de insumos',
      paymentMethod: 'cash',
      amountMxn: 150,
      expenseDate: '2026-06-19',
    })
  })
})
