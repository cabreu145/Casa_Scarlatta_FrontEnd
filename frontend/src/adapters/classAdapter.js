import { normalizeDiscipline } from '@/utils/discipline'
import { formatClassDate, getClassDisplayDate, getClassDisplayTime, getClassTimeToken } from '@/utils/classSchedule'

function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function resolveStatus(value) {
  if (!value) return 'programada'
  const raw = String(value).toLowerCase()
  if (raw.includes('cancel')) return 'cancelada'
  if (raw.includes('final')) return 'finalizada'
  return 'programada'
}

function resolveUiStatus(value) {
  const raw = String(value ?? '').toLowerCase()
  if (raw === 'programada' || raw === 'activa' || raw === 'active') return 'activa'
  if (raw.includes('cancel')) return 'cancelada'
  if (raw.includes('final')) return 'finalizada'
  return raw || 'activa'
}

function resolveTipoFromDiscipline(discipline, fallbackTipo) {
  const normalized = normalizeDiscipline(discipline ?? fallbackTipo)
  if (normalized === 'slow') return 'Slow'
  if (normalized === 'stryde') return 'Stryde X'
  const fallback = String(fallbackTipo ?? '').trim()
  if (fallback) return fallback
  return 'Stryde X'
}

export function mapBackendClassToFrontendClass(item = {}) {
  const cupoMax = safeNumber(item.capacity_max, 0)
  const cupoActual = safeNumber(item.capacity_current, 0)
  const discipline = normalizeDiscipline(item.discipline ?? item.class_discipline ?? item.classType ?? item.tipo)
  return {
    id: item.id,
    nombre: item.name ?? item.nombre ?? 'Clase',
    name: item.name ?? item.nombre ?? 'Clase',
    tipo: resolveTipoFromDiscipline(discipline, item.tipo),
    discipline,
    coachId: item.coach_id ?? item.coachId ?? null,
    coachNombre: item.coach_name ?? item.coachNombre ?? `Coach #${item.coach_id ?? 'N/A'}`,
    coachAvatarUrl: item.coach_avatar_url ?? item.coachAvatarUrl ?? item.avatar_url ?? item.avatarUrl ?? item.coach_foto ?? null,
    cupoMax,
    cupoActual,
    cupoDisponible: safeNumber(item.cupo_disponible, Math.max(0, cupoMax - cupoActual)),
    duracion: safeNumber(item.duration_minutes ?? item.duration_min ?? item.durationMin, 50),
    hora: getClassTimeToken(item),
    startTime: getClassTimeToken({ startTime: item.start_time ?? item.startTime ?? null, startAt: item.start_at ?? item.startAt ?? null }) ?? null,
    startAt: item.start_at ?? item.startAt ?? null,
    classStartTime: getClassTimeToken({ startTime: item.class_start_time ?? item.classStartTime ?? null, startAt: item.class_start_at ?? item.classStartAt ?? null }) ?? null,
    classStartAt: item.class_start_at ?? item.classStartAt ?? null,
    displayDate: formatClassDate(getClassDisplayDate({
      classDate: item.class_date ?? item.classDate ?? null,
      occurrenceDate: item.occurrence_date ?? item.occurrenceDate ?? null,
      classStartAt: item.class_start_at ?? item.classStartAt ?? null,
      startAt: item.start_at ?? item.startAt ?? null,
      fecha: item.fecha ?? null,
      date: item.date ?? null,
    })),
    displayTime: getClassDisplayTime(item),
    estado: resolveStatus(item.status),
    status: resolveStatus(item.status),
    statusDisplay: resolveUiStatus(item.status),
    estadoDisplay: resolveUiStatus(item.status),
    dia: item.dia ?? null,
    fecha: item.fecha ?? null,
    descripcion: item.description ?? item.descripcion ?? '',
    description: item.description ?? item.descripcion ?? '',
    publicarEn: item.publicarEn ?? null,
  }
}

export function mapBackendClassesToFrontend(classes = []) {
  return classes.map(mapBackendClassToFrontendClass)
}

export function mapBackendAvailabilityToFrontend(payload = {}) {
  const cupoMax = safeNumber(payload.capacity_max, 0)
  const cupoActual = safeNumber(payload.capacity_current, 0)
  return {
    classId: payload.class_id ?? null,
    cupoMax,
    cupoActual,
    cupoDisponible: safeNumber(payload.cupo_disponible, Math.max(0, cupoMax - cupoActual)),
  }
}
