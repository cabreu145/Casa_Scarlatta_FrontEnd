const TIME_FIELD_KEYS = [
  'startTime',
  'start_time',
  'classStartTime',
  'class_start_time',
  'classStartAt',
  'class_start_at',
  'startAt',
  'start_at',
  'hora',
  'time',
  'horario',
  'horaInicio',
  'class_hour',
  'displayTime',
]

const DATE_FIELD_KEYS = [
  'classDate',
  'class_date',
  'occurrenceDate',
  'occurrence_date',
  'classStartAt',
  'class_start_at',
  'startAt',
  'start_at',
  'displayDate',
  'date',
  'fecha',
]

function extractTimeToken(raw) {
  if (raw === null || raw === undefined) return null
  const value = String(raw).trim()
  if (!value) return null

  const isoMatch = value.match(/T(\d{1,2}:\d{2})(?::\d{2})?/i)
  if (isoMatch?.[1]) {
    const [hours, minutes] = isoMatch[1].split(':')
    return `${hours.padStart(2, '0')}:${minutes}`
  }

  const hhmm = value.match(/\b(\d{1,2}:\d{2})(?::\d{2})?\b/)
  if (hhmm?.[1]) {
    const [hours, minutes] = hhmm[1].split(':')
    return `${hours.padStart(2, '0')}:${minutes}`
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return null
}

export function getClassTimeSource(item = {}) {
  for (const key of TIME_FIELD_KEYS) {
    const value = item?.[key]
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return value
    }
  }
  return null
}

export function getClassTimeToken(item = {}) {
  return extractTimeToken(getClassTimeSource(item))
}

export function formatClassTime(value) {
  const token = extractTimeToken(value)
  return token ?? 'Horario por definir'
}

export function getClassDisplayTime(item = {}) {
  return formatClassTime(getClassTimeSource(item))
}

export function getClassDateSource(item = {}) {
  for (const key of DATE_FIELD_KEYS) {
    const value = item?.[key]
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return value
    }
  }
  return null
}

export function formatClassDate(value, fallback = 'Fecha por definir') {
  if (!value) return fallback

  const raw = String(value).trim()
  if (!raw) return fallback

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) {
    const [, y, m, d] = ymd
    const date = new Date(Number(y), Number(m) - 1, Number(d))
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })
    }
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
  }

  return raw
}

export function getClassDisplayDate(item = {}) {
  return getClassDateSource(item)
}
