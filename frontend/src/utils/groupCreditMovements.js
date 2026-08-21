function valueOf(movement, camelCase, snakeCase) {
  return movement?.[camelCase] ?? movement?.[snakeCase] ?? null
}

function movementTimestamp(movement) {
  return valueOf(movement, 'classStartAt', 'class_start_at') ??
    valueOf(movement, 'classDate', 'class_date') ??
    valueOf(movement, 'createdAt', 'created_at') ??
    ''
}

function compareMovements(left, right) {
  const leftSpot = String(valueOf(left, 'spotNumber', 'spot_number') ?? '')
  const rightSpot = String(valueOf(right, 'spotNumber', 'spot_number') ?? '')
  if (leftSpot && rightSpot && leftSpot !== rightSpot) return leftSpot.localeCompare(rightSpot, 'es', { numeric: true })
  return String(valueOf(left, 'createdAt', 'created_at') ?? valueOf(left, 'movementId', 'movement_id') ?? '')
    .localeCompare(String(valueOf(right, 'createdAt', 'created_at') ?? valueOf(right, 'movementId', 'movement_id') ?? ''))
}

export function getCreditMovementGroupKey(movement = {}) {
  const occurrenceId = valueOf(movement, 'occurrenceId', 'occurrence_id')
  if (occurrenceId != null && occurrenceId !== '') return `occurrence:${occurrenceId}`

  const classStartAt = valueOf(movement, 'classStartAt', 'class_start_at')
  const className = valueOf(movement, 'className', 'class_name')
  const coachName = valueOf(movement, 'coachName', 'coach_name')
  if (classStartAt || className || coachName) return `class:${classStartAt ?? ''}|${className ?? ''}|${coachName ?? ''}`

  return `movement:${valueOf(movement, 'movementId', 'movement_id') ?? movement.id ?? movementTimestamp(movement)}`
}

export function groupCreditMovements(movements = []) {
  const groups = new Map()

  for (const movement of Array.isArray(movements) ? movements : []) {
    const key = getCreditMovementGroupKey(movement)
    const group = groups.get(key) ?? {
      key,
      className: valueOf(movement, 'className', 'class_name') ?? null,
      coachName: valueOf(movement, 'coachName', 'coach_name') ?? null,
      classStartAt: valueOf(movement, 'classStartAt', 'class_start_at') ?? null,
      classDate: valueOf(movement, 'classDate', 'class_date') ?? null,
      packageName: valueOf(movement, 'packageName', 'package_name') ?? null,
      movements: [],
    }
    group.movements.push(movement)
    groups.set(key, group)
  }

  return [...groups.values()]
    .map((group) => {
      const movementsInOrder = [...group.movements].sort(compareMovements)
      const spots = [...new Set(movementsInOrder
        .map((movement) => valueOf(movement, 'spotNumber', 'spot_number'))
        .filter((spot) => spot != null && spot !== '')
        .map(String))]
      const usedCredits = movementsInOrder.reduce((sum, movement) => Math.min(0, Number(valueOf(movement, 'delta', 'delta') ?? movement.amount ?? 0)) + sum, 0)
      const refundedCredits = movementsInOrder.reduce((sum, movement) => Math.max(0, Number(valueOf(movement, 'delta', 'delta') ?? movement.amount ?? 0)) + sum, 0)
      return {
        ...group,
        movements: movementsInOrder,
        spots,
        usedCredits,
        refundedCredits,
        netCredits: usedCredits + refundedCredits,
        sortAt: movementTimestamp(movementsInOrder[0]),
      }
    })
    .sort((left, right) => String(right.sortAt).localeCompare(String(left.sortAt)))
}
