function toIntegerOrUndefined(value) {
  const n = Number(value)
  return Number.isInteger(n) ? n : undefined
}

export function normalizeAdminClassStatusFilter(status) {
  const raw = String(status ?? '').trim().toLowerCase()
  if (!raw || raw === 'todas') return undefined
  if (raw === 'activa' || raw === 'active' || raw === 'programada') return 'programada'
  if (raw === 'cancelada' || raw === 'cancelled') return 'cancelada'
  if (raw === 'finalizada' || raw === 'final') return 'finalizada'
  return raw
}

export function normalizeAdminClassCoachFilter(coachId) {
  return toIntegerOrUndefined(coachId)
}

export function buildAdminClasesApiQuery({
  page = 1,
  pageSize = 12,
  search,
  discipline,
  status,
  coachId,
} = {}) {
  return {
    page,
    pageSize,
    search: String(search ?? '').trim() || undefined,
    discipline: discipline ? String(discipline).trim() : undefined,
    status: normalizeAdminClassStatusFilter(status),
    coachId: normalizeAdminClassCoachFilter(coachId),
  }
}
