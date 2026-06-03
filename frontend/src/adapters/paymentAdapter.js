export function mapCheckoutPreferenceToFrontend(payload = {}) {
  return {
    checkoutUrl: payload.checkout_url ?? payload.checkoutUrl ?? null,
    externalReference: payload.external_reference ?? payload.externalReference ?? null,
    preferenceId: payload.preference_id ?? payload.preferenceId ?? null,
    sandbox: payload.sandbox ?? null,
    status: payload.status ?? null,
  }
}

export function mapPaymentStatusToFrontend(payload = {}) {
  return {
    externalReference: payload.external_reference ?? payload.externalReference ?? null,
    status: payload.status ?? null,
    provider: payload.provider ?? null,
    packageId: payload.package_id ?? payload.packageId ?? null,
    amount: payload.amount ?? null,
    credits: payload.credits ?? null,
    applied: payload.applied ?? null,
    paymentMethodId: payload.payment_method_id ?? payload.paymentMethodId ?? null,
    paymentTypeId: payload.payment_type_id ?? payload.paymentTypeId ?? null,
    paymentMethod: payload.payment_method ?? payload.paymentMethod ?? null,
    paymentType: payload.payment_type ?? payload.paymentType ?? null,
    statusDetail: payload.status_detail ?? payload.statusDetail ?? null,
    approvedAt: payload.approved_at ?? payload.approvedAt ?? null,
    appliedAt: payload.applied_at ?? payload.appliedAt ?? null,
  }
}
