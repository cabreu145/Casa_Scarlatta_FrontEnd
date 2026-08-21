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
  const delta = Number(movement.delta ?? movement.amount ?? 0)
  return {
    id: movement.movement_id ?? movement.movementId ?? movement.id ?? null,
    movementId: movement.movement_id ?? movement.movementId ?? movement.id ?? null,
    membershipId: movement.membership_id ?? movement.membershipId ?? null,
    packageId: movement.package_id ?? movement.packageId ?? null,
    packageName: movement.package_name ?? movement.packageName ?? null,
    type: movement.type ?? movement.reason ?? null,
    reason: movement.reason ?? movement.type ?? null,
    amount: delta,
    delta,
    beforeBalance: movement.before_balance ?? movement.beforeBalance ?? null,
    balanceAfter: movement.balance_after ?? movement.balanceAfter ?? null,
    afterBalance: movement.after_balance ?? movement.afterBalance ?? movement.balance_after ?? movement.balanceAfter ?? null,
    displayTitle: movement.display_title ?? movement.displayTitle ?? null,
    displayDescription: movement.display_description ?? movement.displayDescription ?? '',
    displayAmount: movement.display_amount ?? movement.displayAmount ?? delta,
    displayAmountLabel: movement.display_amount_label ?? movement.displayAmountLabel ?? null,
    displayAmountMode: movement.display_amount_mode ?? movement.displayAmountMode ?? 'delta',
    createdAt: movement.created_at ?? movement.createdAt ?? null,
    reservationId: movement.reservation_id ?? movement.reservationId ?? null,
    reservationStatus: movement.reservation_status ?? movement.reservationStatus ?? null,
    occurrenceId: movement.occurrence_id ?? movement.occurrenceId ?? null,
    className: movement.class_name ?? movement.className ?? null,
    classStartAt: movement.class_start_at ?? movement.classStartAt ?? null,
    classDate: movement.class_date ?? movement.classDate ?? null,
    classTime: movement.class_time ?? movement.classTime ?? null,
    coachId: movement.coach_id ?? movement.coachId ?? null,
    coachName: movement.coach_name ?? movement.coachName ?? null,
    spotNumber: movement.spot_number ?? movement.spotNumber ?? null,
    spots: Array.isArray(movement.spots) ? movement.spots : [],
    quantity: Number(movement.quantity ?? 1),
    spotsCount: Number(movement.spots_count ?? movement.spotsCount ?? 1),
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
