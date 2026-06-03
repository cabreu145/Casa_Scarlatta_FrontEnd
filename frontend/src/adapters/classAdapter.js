import { normalizeDiscipline } from '@/utils/discipline'

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

export function mapBackendClassToFrontendClass(item = {}) {
  const cupoMax = safeNumber(item.capacity_max, 0)
  const cupoActual = safeNumber(item.capacity_current, 0)
  return {
    id: item.id,
    nombre: item.name ?? item.nombre ?? 'Clase',
    name: item.name ?? item.nombre ?? 'Clase',
    tipo: item.tipo ?? 'Stryde X',
    discipline: normalizeDiscipline(item.discipline ?? item.class_discipline ?? item.classType ?? item.tipo),
    coachId: item.coach_id ?? item.coachId ?? null,
    coachNombre: item.coach_name ?? item.coachNombre ?? `Coach #${item.coach_id ?? 'N/A'}`,
    cupoMax,
    cupoActual,
    cupoDisponible: safeNumber(item.cupo_disponible, Math.max(0, cupoMax - cupoActual)),
    duracion: safeNumber(item.duration_min, 50),
    hora: item.start_time ?? item.hora ?? '08:00',
    estado: resolveStatus(item.status),
    status: resolveStatus(item.status),
    dia: item.dia ?? null,
    fecha: item.fecha ?? null,
    descripcion: item.descripcion ?? '',
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
