import { normalizeDiscipline } from '@/utils/discipline'
import { formatClassDate, getClassDisplayDate, getClassDisplayTime, getClassTimeToken } from '@/utils/classSchedule'

function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function mapBackendOccurrenceToFrontend(item = {}) {
  const cupoMax = safeNumber(item.capacity_max, 0)
  const cupoActual = safeNumber(item.capacity_current, 0)
  const effectiveCoachId =
    item.effective_coach_id ??
    item.effectiveCoachId ??
    item.effective_coach?.coach_id ??
    item.effective_coach?.coachId ??
    item.effective_coach?.id ??
    item.effectiveCoach?.coach_id ??
    item.effectiveCoach?.coachId ??
    item.effectiveCoach?.id ??
    null
  const coachId =
    effectiveCoachId ??
    item.coach_id ??
    item.coachId ??
    item.coach?.coach_id ??
    item.coach?.coachId ??
    item.coach?.id ??
    null
  const coachNombre =
    item.effective_coach_name ??
    item.effectiveCoachName ??
    item.effective_coach?.name ??
    item.effective_coach?.nombre ??
    item.effectiveCoach?.name ??
    item.effectiveCoach?.nombre ??
    item.coach_name ??
    item.coachNombre ??
    item.coach?.name ??
    item.coach?.nombre ??
    null
  const usesCoachOverride =
    item.uses_coach_override ??
    item.usesCoachOverride ??
    null
  return {
    occurrenceId: item.id ?? item.occurrence_id ?? null,
    id: item.id ?? item.occurrence_id ?? null,
    claseId: item.class_id ?? item.clase_id ?? null,
    classId: item.class_id ?? item.clase_id ?? item.classId ?? null,
    discipline: normalizeDiscipline(
      item.discipline ?? item.class_discipline ?? item.classDiscipline,
      item.class_name ?? item.claseNombre ?? item.name ?? item.nombre
    ),
    fecha: item.occurrence_date ?? item.class_date ?? null,
    displayDate: formatClassDate(getClassDisplayDate(item)),
    inicio: item.start_at ?? item.class_start_at ?? null,
    fin: item.end_at ?? null,
    hora: getClassTimeToken(item),
    startTime: getClassTimeToken(item),
    displayTime: getClassDisplayTime(item),
    cupoMax,
    cupoActual,
    cupoDisponible: safeNumber(item.available_spots ?? item.availableSpots ?? item.cupo_disponible, Math.max(0, cupoMax - cupoActual)),
    coachId,
    effectiveCoachId,
    usesCoachOverride,
    coachNombre,
    coachAvatarUrl: item.coach_avatar_url ?? item.coachAvatarUrl ?? item.avatar_url ?? item.avatarUrl ?? item.coach_foto ?? null,
    estado: item.status ?? 'programada',
    claseNombre: item.class_name ?? item.claseNombre ?? null,
    className: item.class_name ?? item.claseNombre ?? null,
  }
}

export function mapBackendOccurrencesToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendOccurrenceToFrontend)
}
