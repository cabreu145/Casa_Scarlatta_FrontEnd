import { describe, expect, test } from 'vitest'
import { mapClientPaymentHistoryItemToFrontend } from './clientPaymentHistoryAdapter'

describe('clientPaymentHistoryAdapter', () => {
  test('mapea item completo a camelCase', () => {
    const mapped = mapClientPaymentHistoryItemToFrontend({
      external_reference: 'mp_ref_1',
      status: 'pending',
      provider: 'mercadopago',
      package_id: 2,
      package_name: 'Mensual 12',
      amount: 2100,
      credits: 12,
      applied: false,
      payment_id: '162264621142',
      preference_id: 'pref-1',
      merchant_order_id: 'mo-1',
      payment_method_id: 'oxxo',
      payment_type_id: 'ticket',
      status_detail: 'pending_waiting_payment',
      failure_reason: null,
      approved_at: null,
      applied_at: null,
      created_at: '2026-06-02T10:00:00Z',
    })

    expect(mapped).toMatchObject({
      externalReference: 'mp_ref_1',
      status: 'pending',
      provider: 'mercadopago',
      packageId: 2,
      packageName: 'Mensual 12',
      amount: 2100,
      credits: 12,
      applied: false,
      paymentId: '162264621142',
      preferenceId: 'pref-1',
      merchantOrderId: 'mo-1',
      paymentMethodId: 'oxxo',
      paymentTypeId: 'ticket',
      statusDetail: 'pending_waiting_payment',
      failureReason: null,
      approvedAt: null,
      appliedAt: null,
      createdAt: '2026-06-02T10:00:00Z',
    })
    expect(mapped.raw).toBeTruthy()
  })

  test('tolera nulls y campos faltantes', () => {
    const mapped = mapClientPaymentHistoryItemToFrontend(null)
    expect(mapped).toMatchObject({
      externalReference: null,
      status: null,
      packageId: null,
      packageName: null,
      amount: null,
      credits: null,
      applied: null,
      paymentId: null,
      preferenceId: null,
      merchantOrderId: null,
      paymentMethodId: null,
      paymentTypeId: null,
      statusDetail: null,
      failureReason: null,
      approvedAt: null,
      appliedAt: null,
      createdAt: null,
    })
  })
})

