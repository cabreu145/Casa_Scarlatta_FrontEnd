import { describe, expect, test } from 'vitest'
import { mapBackendCashClosingToFrontend, mapBackendCashClosingsToFrontend } from './cashClosingAdapter'

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
})
