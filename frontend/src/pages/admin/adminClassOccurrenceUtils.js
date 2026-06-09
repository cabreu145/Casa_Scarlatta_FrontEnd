import { normalizeDiscipline } from '@/utils/discipline'
import { getClassDisplayTime, getClassTimeToken } from '@/utils/classSchedule'

function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function matchesSearch(row, search) {
  const term = normalizeText(search)
  if (!term) return true
  const haystack = [
    row.nombre,
    row.name,
    row.descripcion,
    row.description,
    row.coachNombre,
    row.coach_name,
    row.dia,
    row.fecha,
    row.hora,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(' ')
  return haystack.includes(term)
}

function matchesDiscipline(row, disciplineFilter) {
  const raw = normalizeText(disciplineFilter)
  if (!raw || raw === 'todas') return true
  if (raw === 'slow') return normalizeDiscipline(row.discipline ?? row.tipo) === 'slow'
  if (raw === 'stryde x' || raw === 'stryde') {
    return normalizeDiscipline(row.discipline ?? row.tipo) === 'stryde'
  }
  return true
}

function matchesStatus(row, statusFilter) {
  const raw = normalizeText(statusFilter)
  if (!raw || raw === 'todas') return true
  const status = normalizeText(row.estado ?? row.status)
  if (raw === 'activa' || raw === 'active' || raw === 'programada') {
    return status === 'programada' || status === 'activa' || status === 'active'
  }
  if (raw === 'cancelada' || raw === 'cancelled') return status.includes('cancel')
  if (raw === 'finalizada' || raw === 'final') return status.includes('final')
  return true
}

function matchesCoach(row, coachIdFilter) {
  const raw = String(coachIdFilter ?? '').trim()
  if (!raw || raw === 'Todos') return true
  return String(row.coachId ?? row.coach_id ?? '').trim() === raw
}

export function buildAdminClassOccurrenceRows(classes = [], occurrencesByClass = {}) {
  const rows = []
  for (const baseClass of Array.isArray(classes) ? classes : []) {
    const occurrences = occurrencesByClass?.[baseClass.id] ?? []
    for (const occurrence of Array.isArray(occurrences) ? occurrences : []) {
      const occurrenceId = occurrence.occurrenceId ?? occurrence.id ?? null
      const fecha = occurrence.fecha ?? occurrence.occurrenceDate ?? baseClass.fecha ?? null
      const hora = occurrence.hora ?? occurrence.startTime ?? getClassTimeToken(occurrence) ?? getClassTimeToken(baseClass) ?? '00:00'
      const cupoMax = safeNumber(occurrence.cupoMax ?? occurrence.capacityMax ?? baseClass.cupoMax ?? baseClass.capacity_max, 0)
      const cupoActual = safeNumber(occurrence.cupoActual ?? occurrence.capacityCurrent ?? baseClass.cupoActual ?? baseClass.capacity_current, 0)
      rows.push({
        ...baseClass,
        id: occurrenceId ?? `${baseClass.id}-${fecha ?? ''}-${hora}`,
        occurrenceId,
        occurrence_id: occurrenceId,
        claseId: baseClass.id,
        fecha,
        hora,
        displayTime: occurrence.displayTime ?? getClassDisplayTime(occurrence),
        cupoMax,
        cupoActual,
        cupoDisponible: safeNumber(
          occurrence.cupoDisponible ?? occurrence.capacityAvailable,
          Math.max(0, cupoMax - cupoActual)
        ),
        estado: occurrence.estado ?? occurrence.status ?? baseClass.estado ?? baseClass.status ?? 'programada',
        status: occurrence.status ?? occurrence.estado ?? baseClass.status ?? baseClass.estado ?? 'programada',
        coachId: occurrence.coachId ?? baseClass.coachId ?? null,
        coachNombre: baseClass.coachNombre ?? occurrence.coachNombre ?? baseClass.coach_name ?? `Coach #${baseClass.coachId ?? 'N/A'}`,
      })
    }
  }
  return rows
}

export function filterAdminClassRows(
  rows = [],
  { search = '', discipline = 'Todas', status = 'Todas', coachId = 'Todos' } = {}
) {
  return (Array.isArray(rows) ? rows : []).filter((row) =>
    matchesSearch(row, search) &&
    matchesDiscipline(row, discipline) &&
    matchesStatus(row, status) &&
    matchesCoach(row, coachId)
  )
}

export function getAdminClassRosterEmptyMessage({ useApiMode, occurrenceId, rosterCount, capacityCurrent } = {}) {
  if (!useApiMode) return 'Nadie inscrito aun'
  if (!occurrenceId) return 'Selecciona una ocurrencia para ver alumnos.'
  if (Number(capacityCurrent ?? 0) > 0 || Number(rosterCount ?? 0) > 0) {
    return 'Hay inscritos, pero el roster detallado aun no coincide.'
  }
  return 'Nadie inscrito aun'
}

export function buildClientEnrollmentLabel(client = {}) {
  const name = client.name ?? client.nombre ?? 'Cliente'
  const packageName =
    client.paquete ??
    client.packageName ??
    client.activeMembership?.packageName ??
    client.membresia?.packageName ??
    null
  const credits =
    client.creditsBalance ??
    client.creditos ??
    client.clasesPaquete ??
    client.activeMembership?.creditsAvailable ??
    client.membresia?.creditsAvailable ??
    null
  const suffix = packageName
    ? `· ${packageName}`
    : Number.isFinite(Number(credits))
      ? `· ${credits} credito${Number(credits) === 1 ? '' : 's'}`
      : '· Sin paquete'
  return `${name} ${suffix}`
}
