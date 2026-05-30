const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function mapAgendaOccurrenceToCoachClassRow(o = {}, coachName = 'Coach') {
  const fecha = o.occurrenceDate ?? null
  const dayName = fecha ? DIAS[new Date(`${fecha}T12:00:00`).getDay()] : ''
  const hora = o.startTime ?? (o.startAt ? new Date(o.startAt).toISOString().slice(11, 16) : '00:00')
  return {
    id: o.occurrenceId ?? o.classId ?? null,
    occurrenceId: o.occurrenceId ?? null,
    claseId: o.classId ?? null,
    nombre: o.className ?? 'Clase',
    tipo: o.classType ?? 'Stryde X',
    dia: dayName,
    fecha,
    hora,
    cupoMax: Number.isFinite(Number(o.capacityMax)) ? Number(o.capacityMax) : 0,
    cupoActual: Number.isFinite(Number(o.capacityCurrent)) ? Number(o.capacityCurrent) : 0,
    coachId: o.coachId ?? null,
    coachNombre: coachName,
    estado: o.status ?? 'programada',
  }
}

export function mapAgendaToCoachClassRows(occurrences = [], coachName = 'Coach') {
  const rows = (Array.isArray(occurrences) ? occurrences : []).map((o) =>
    mapAgendaOccurrenceToCoachClassRow(o, coachName)
  )
  rows.sort((a, b) => {
    const fa = a.fecha ?? ''
    const fb = b.fecha ?? ''
    if (fa !== fb) return fa.localeCompare(fb)
    return (a.hora ?? '').localeCompare(b.hora ?? '')
  })
  return rows
}

export function buildCoachMetricsFromOccurrences(occurrences = [], today = new Date()) {
  const source = Array.isArray(occurrences) ? occurrences : []
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const totalClasesSemana = source.length
  const clasesHoy = source.filter((o) => (o?.occurrenceDate ?? null) === todayIso).length

  let alumnosTotales = 0
  let capacidadTotal = 0
  let cuposDisponibles = 0
  for (const o of source) {
    const current = Number.isFinite(Number(o?.capacityCurrent)) ? Number(o.capacityCurrent) : 0
    const max = Number.isFinite(Number(o?.capacityMax)) ? Number(o.capacityMax) : 0
    const available = Number.isFinite(Number(o?.cupoDisponible)) ? Number(o.cupoDisponible) : Math.max(max - current, 0)
    alumnosTotales += current
    capacidadTotal += max
    cuposDisponibles += available
  }

  const ocupacionPromedioPct = capacidadTotal > 0
    ? Math.round((alumnosTotales / capacidadTotal) * 100)
    : 0

  return {
    totalClasesSemana,
    clasesHoy,
    alumnosTotales,
    capacidadTotal,
    cuposDisponibles,
    ocupacionPromedioPct,
  }
}

function isValidIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function getOccurrenceHourKey(o = {}) {
  if (typeof o.startTime === 'string' && /^\d{2}:\d{2}/.test(o.startTime)) {
    return o.startTime.slice(0, 5)
  }
  if (typeof o.startAt === 'string') {
    const match = o.startAt.match(/T(\d{2}:\d{2})/)
    if (match?.[1]) {
      return match[1]
    }
  }
  return '99:99'
}

export function getTodayOccurrences(occurrences = [], today = new Date()) {
  const source = Array.isArray(occurrences) ? occurrences : []
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return source
    .filter((o) => isValidIsoDate(o?.occurrenceDate) && o.occurrenceDate === todayIso)
    .sort((a, b) => getOccurrenceHourKey(a).localeCompare(getOccurrenceHourKey(b)))
}
