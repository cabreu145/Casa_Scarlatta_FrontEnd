export function buildMisClasesApiFilters(statusFilter, weekDays = []) {
  const from = weekDays?.[0]?.isoDate ?? null
  const to = weekDays?.[weekDays.length - 1]?.isoDate ?? null
  return {
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    from,
    to,
  }
}
