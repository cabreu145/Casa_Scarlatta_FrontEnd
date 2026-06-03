export function mapClientPaymentHistoryItemToFrontend(payload = {}) {
  const source = payload ?? {}
  return {
    externalReference: source.external_reference ?? source.externalReference ?? null,
    status: source.status ?? null,
    provider: source.provider ?? null,
    packageId: source.package_id ?? source.packageId ?? null,
    packageName: source.package_name ?? source.packageName ?? null,
    amount: source.amount ?? null,
    credits: source.credits ?? null,
    applied: source.applied ?? null,
    paymentId: source.payment_id ?? source.paymentId ?? null,
    preferenceId: source.preference_id ?? source.preferenceId ?? null,
    merchantOrderId: source.merchant_order_id ?? source.merchantOrderId ?? null,
    paymentMethodId: source.payment_method_id ?? source.paymentMethodId ?? null,
    paymentTypeId: source.payment_type_id ?? source.paymentTypeId ?? null,
    statusDetail: source.status_detail ?? source.statusDetail ?? null,
    failureReason: source.failure_reason ?? source.failureReason ?? null,
    approvedAt: source.approved_at ?? source.approvedAt ?? null,
    appliedAt: source.applied_at ?? source.appliedAt ?? null,
    createdAt: source.created_at ?? source.createdAt ?? null,
    raw: source,
  }
}

