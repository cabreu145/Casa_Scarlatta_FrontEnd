import { describe, expect, test } from 'vitest'
import { mapCheckoutPreferenceToFrontend, mapPaymentStatusToFrontend } from './paymentAdapter'

describe('paymentAdapter', () => {
  test('mapea checkout preference', () => {
    const payload = {
      checkout_url: 'https://checkout.example',
      external_reference: 'ref123',
      preference_id: 'pref123',
      sandbox: true,
      status: 'created',
    }
    expect(mapCheckoutPreferenceToFrontend(payload)).toEqual({
      checkoutUrl: 'https://checkout.example',
      externalReference: 'ref123',
      preferenceId: 'pref123',
      sandbox: true,
      status: 'created',
    })
  })

  test('mapea payment status', () => {
    const payload = {
      external_reference: 'ref123',
      status: 'approved',
      provider: 'mercadopago',
      package_id: 2,
      amount: 1500,
      credits: 8,
      applied: true,
      payment_method_id: 'visa',
      payment_type_id: 'credit_card',
      payment_method: 'Visa',
      payment_type: 'Tarjeta',
      status_detail: 'accredited',
      approved_at: '2026-05-31T12:00:00Z',
      applied_at: '2026-05-31T12:01:00Z',
    }
    expect(mapPaymentStatusToFrontend(payload)).toEqual({
      externalReference: 'ref123',
      status: 'approved',
      provider: 'mercadopago',
      packageId: 2,
      amount: 1500,
      credits: 8,
      applied: true,
      paymentMethodId: 'visa',
      paymentTypeId: 'credit_card',
      paymentMethod: 'Visa',
      paymentType: 'Tarjeta',
      statusDetail: 'accredited',
      approvedAt: '2026-05-31T12:00:00Z',
      appliedAt: '2026-05-31T12:01:00Z',
    })
  })
})
