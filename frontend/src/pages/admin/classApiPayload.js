function toNumber(value, fallback = null) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function resolveCoachIdByName(coaches = [], coachName = '') {
  if (!coachName) return null
  const coach = coaches.find((c) => c?.nombre === coachName)
  return toNumber(coach?.id, null)
}

export function buildClaseApiPayload({ form, coaches, fallbackCoachId = null }) {
  const coachId = resolveCoachIdByName(coaches, form?.coach) ?? toNumber(fallbackCoachId, null)
  return {
    name: form?.nombre ?? '',
    tipo: form?.tipo ?? 'Stryde X',
    coach_id: coachId,
    day_name: form?.dia ?? 'Lunes',
    start_time: form?.hora ?? '07:00',
    duration_min: Number(form?.duracion) || 50,
    capacity_max: form?.tipo === 'Slow' ? 10 : 14,
    description: form?.descripcion ?? '',
    status: 'programada',
  }
}
