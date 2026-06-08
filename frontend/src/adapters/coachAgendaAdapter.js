import { normalizeDiscipline } from '@/utils/discipline'
import { getClassDisplayTime, getClassTimeToken } from '@/utils/classSchedule'

function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function mapOccurrence(item = {}) {
  return {
    occurrenceId: item.occurrence_id ?? item.occurrenceId ?? null,
    classId: item.class_id ?? item.classId ?? null,
    className: item.class_name ?? item.className ?? 'Clase',
    nombre: item.class_name ?? item.className ?? 'Clase',
    classType: item.class_type ?? item.classType ?? 'Stryde X',
    tipo: item.class_type ?? item.classType ?? 'Stryde X',
    discipline: normalizeDiscipline(item.discipline ?? item.class_discipline ?? item.classType ?? item.class_type),
    occurrenceDate: item.occurrence_date ?? item.occurrenceDate ?? null,
    fecha: item.occurrence_date ?? item.occurrenceDate ?? null,
    startAt: item.start_at ?? item.startAt ?? null,
    endAt: item.end_at ?? item.endAt ?? null,
    startTime: getClassTimeToken(item),
    hora: getClassTimeToken(item),
    displayTime: getClassDisplayTime(item),
    status: item.status ?? 'programada',
    estado: item.status ?? 'programada',
    capacityMax: safeNumber(item.capacity_max ?? item.capacityMax, 0),
    capacityCurrent: safeNumber(item.capacity_current ?? item.capacityCurrent, 0),
    cupoDisponible: safeNumber(item.cupo_disponible ?? item.cupoDisponible, 0),
    coachId: item.coach_id ?? item.coachId ?? null,
  }
}

export function mapCoachAgendaToFrontend(payload = {}) {
  const coach = payload.coach ?? {}
  const occurrences = Array.isArray(payload.occurrences) ? payload.occurrences : []
  return {
    coach: {
      coachId: coach.coach_id ?? coach.coachId ?? null,
      userId: coach.user_id ?? coach.userId ?? null,
      coachName: coach.name ?? coach.coachName ?? 'Coach',
    },
    from: payload.from ?? null,
    to: payload.to ?? null,
    occurrences: occurrences.map(mapOccurrence),
  }
}
