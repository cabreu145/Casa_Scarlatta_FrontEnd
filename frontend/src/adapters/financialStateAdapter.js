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
  }
}

export function mapCreditMovement(movement = {}) {
  return {
    id: movement.id ?? null,
    type: movement.type ?? null,
    amount: movement.amount ?? 0,
    balanceAfter: movement.balance_after ?? movement.balanceAfter ?? null,
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
