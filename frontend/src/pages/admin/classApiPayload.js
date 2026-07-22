import { getMapCapacityByDiscipline } from '@/utils/classCapacity'

function toNumber(value, fallback = null) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function resolveCoachIdByName(coaches = [], coachName = '') {
  if (!coachName) return null
  const normalizedName = String(coachName).trim().toLowerCase()
  const coach = coaches.find((c) => {
    const candidateName = String(c?.nombre ?? c?.name ?? '').trim().toLowerCase()
    return candidateName === normalizedName
  })
  return toNumber(coach?.id ?? coach?.coach_id ?? coach?.coachId, null)
}

export function resolveDisciplineFromForm(form = {}) {
  const raw = String(form?.discipline ?? form?.tipo ?? '').trim().toLowerCase()
  if (raw === 'slow') return 'slow'
  if (raw === 'stryde' || raw === 'stryde x' || raw === 'stride') return 'stryde'
  return raw || 'stryde'
}

export function resolveApiClassStatus(status) {
  const raw = String(status ?? '').trim().toLowerCase()
  if (!raw || raw === 'activa' || raw === 'active' || raw === 'programada') return 'programada'
  if (raw === 'cancelada' || raw === 'cancelled' || raw === 'cancelada ') return 'cancelada'
  if (raw === 'finalizada' || raw === 'final') return 'finalizada'
  return 'programada'
}

const CLASS_FORM_REQUIRED_FIELDS = [
  ['nombre', 'Nombre de la clase'],
  ['tipo', 'Tipo / Disciplina'],
  ['coach', 'Coach'],
  ['fecha', 'Fecha específica'],
  ['dia', 'Día de la semana'],
  ['hora', 'Hora de inicio'],
  ['descripcion', 'Descripción'],
]

export function validateClaseForm(form = {}) {
  const missingFields = CLASS_FORM_REQUIRED_FIELDS
    .filter(([field]) => !String(form?.[field] ?? '').trim())
    .map(([, label]) => label)

  const duration = Number(form?.duracion)
  if (!Number.isFinite(duration) || duration < 30 || duration > 120) {
    missingFields.push('Duración (minutos) válida entre 30 y 120')
  }

  return missingFields
}

export function buildClaseApiPayload({ form, coaches, fallbackCoachId = null }) {
  const coachId = resolveCoachIdByName(coaches, form?.coach) ?? toNumber(fallbackCoachId, null)
  const durationMinutes = Number(form?.duracion) || 50
  const discipline = resolveDisciplineFromForm(form)
  const status = resolveApiClassStatus(form?.status ?? form?.estado ?? 'programada')
  const derivedCapacity = getMapCapacityByDiscipline(discipline)
  return {
    name: form?.nombre ?? '',
    discipline,
    coach_id: coachId,
    capacity_max: derivedCapacity ?? (form?.cupoMax != null
      ? Number(form?.cupoMax) || 15
      : 15),
    duration_minutes: durationMinutes,
    description: form?.descripcion ?? '',
    status,
    // Compatibilidad temporal con formularios legados.
    day_name: form?.dia ?? 'Lunes',
    start_time: form?.hora ?? '07:00',
  }
}
