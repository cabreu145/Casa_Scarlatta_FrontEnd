function mapMembership(membership) {
  if (!membership) return null
  return {
    id: membership.id ?? null,
    packageId: membership.package_id ?? membership.packageId ?? null,
    packageName: membership.package_name ?? membership.packageName ?? null,
    status: membership.status ?? null,
    startedAt: membership.started_at ?? membership.startedAt ?? null,
    expiresAt: membership.expires_at ?? membership.expiresAt ?? null,
    creditsTotal: membership.credits_total ?? membership.creditsTotal ?? 0,
    creditsUsed: membership.credits_used ?? membership.creditsUsed ?? 0,
    creditsAvailable: membership.credits_available ?? membership.creditsAvailable ?? 0,
    limitOneSpotPerOccurrence: Boolean(
      membership.limitOneSpotPerOccurrence ??
      membership.limit_one_spot_per_occurrence ??
      false
    ),
  }
}

export function mapCreditMovement(movement = {}) {
  return {
    id: movement.id ?? null,
    type: movement.type ?? null,
    amount: movement.amount ?? 0,
    beforeBalance: movement.before_balance ?? movement.beforeBalance ?? null,
    balanceAfter: movement.balance_after ?? movement.balanceAfter ?? null,
    afterBalance: movement.after_balance ?? movement.afterBalance ?? movement.balance_after ?? movement.balanceAfter ?? null,
    displayTitle: movement.display_title ?? movement.displayTitle ?? null,
    displayDescription: movement.display_description ?? movement.displayDescription ?? '',
    displayAmount: movement.display_amount ?? movement.displayAmount ?? movement.amount ?? 0,
    displayAmountLabel: movement.display_amount_label ?? movement.displayAmountLabel ?? null,
    displayAmountMode: movement.display_amount_mode ?? movement.displayAmountMode ?? 'delta',
    createdAt: movement.created_at ?? movement.createdAt ?? null,
    reservationId: movement.reservation_id ?? movement.reservationId ?? null,
    occurrenceId: movement.occurrence_id ?? movement.occurrenceId ?? null,
  }
}

function mapTransaction(tx = {}) {
  return {
    id: tx.id ?? null,
    type: tx.type ?? null,
    amount: tx.amount ?? 0,
    status: tx.status ?? null,
    createdAt: tx.created_at ?? tx.createdAt ?? null,
  }
}

export function mapFinancialStateToFrontend(payload = {}) {
  const activeMembership = mapMembership(payload.active_membership ?? payload.activeMembership ?? null)
  const creditMovementsRaw = Array.isArray(payload.credit_movements)
    ? payload.credit_movements
    : Array.isArray(payload.creditMovements)
      ? payload.creditMovements
      : []
  const transactionsRaw = Array.isArray(payload.transactions) ? payload.transactions : []

  return {
    userId: payload.user_id ?? payload.userId ?? null,
    creditsBalance: payload.credits_balance ?? payload.creditsBalance ?? activeMembership?.creditsAvailable ?? 0,
    activeMembership,
    creditMovements: creditMovementsRaw.map(mapCreditMovement),
    transactions: transactionsRaw.map(mapTransaction),
  }
}
