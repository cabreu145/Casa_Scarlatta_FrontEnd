import { normalizeDiscipline as normalizeDisciplineBase } from '@/utils/discipline'

const EQUIPMENT_LABELS = {
  mat: 'Tapete',
  bench: 'Banco',
  treadmill: 'Caminadora',
}

const EQUIPMENT_LAYOUTS = {
  slow: {
    key: 'slow',
    titleBadge: 'SLOW',
    sections: [
      { type: 'mirrorBand' },
      { type: 'banner', label: 'FRENTE' },
      {
        type: 'row',
        ariaLabel: 'Fila frontal',
        equipmentType: 'mat',
        labels: ['01', '02', '03', '04', '05'],
        coachSlotIndex: 2,
      },
      { type: 'coach' },
      {
        type: 'row',
        ariaLabel: 'Fila trasera',
        equipmentType: 'mat',
        labels: ['06', '07', '08', '09', '10'],
      },
    ],
  },
  stryde: {
    key: 'stryde',
    titleBadge: 'STRYDE X',
    sections: [
      { type: 'wall' },
      {
        type: 'row',
        ariaLabel: 'Bancos fila trasera',
        equipmentType: 'bench',
        labels: ['06', '07', '08', '09'],
      },
      { type: 'coach' },
      {
        type: 'row',
        ariaLabel: 'Bancos fila delantera',
        equipmentType: 'bench',
        labels: ['05', '04', '03', '02', '01'],
      },
      {
        type: 'row',
        ariaLabel: 'Caminadoras',
        equipmentType: 'treadmill',
        labels: ['06', '05', '04', '03', '02', '01'],
      },
    ],
  },
}

function padLabel(label) {
  const str = String(label ?? '').trim()
  if (!str) return ''
  if (/^\d+$/.test(str)) return str.padStart(2, '0')
  return str
}

export function normalizeDiscipline(discipline) {
  return normalizeDisciplineBase(discipline)
}

export function getEquipmentLayoutConfig(discipline) {
  const normalized = normalizeDiscipline(discipline)
  return normalized ? EQUIPMENT_LAYOUTS[normalized] ?? null : null
}

export function getEquipmentSpotKey(spot = {}) {
  const equipmentType = String(spot.equipmentType ?? spot.equipment_type ?? '').toLowerCase()
  const label = padLabel(spot.label)
  return `${equipmentType}:${label}`
}

export function getEquipmentSpotLabel(spot = {}) {
  const equipmentType = String(spot.equipmentType ?? spot.equipment_type ?? '').toLowerCase()
  const label = padLabel(spot.label)
  const typeLabel = EQUIPMENT_LABELS[equipmentType] ?? 'Lugar'
  return `${typeLabel} ${label || '--'}`
}

export function getEquipmentSpotStatusLabel(spot = {}) {
  const status = String(spot.status ?? 'inactive').toLowerCase()
  if (spot.heldByMe || status === 'held_by_me') return 'Tu lugar'
  if (status === 'available') return 'Disponible'
  if (status === 'held') return 'Bloqueado temporalmente'
  if (status === 'reserved') return 'Ocupado'
  return 'No disponible'
}

function capitalizeFirst(value) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function formatOccurrenceDateTime({
  occurrenceDate,
  classDate,
  startAt,
  classStartAt,
} = {}) {
  const dateSource = occurrenceDate ?? classDate ?? startAt ?? classStartAt ?? null
  const timeSource = startAt ?? classStartAt ?? null
  if (!dateSource) return { dateLabel: 'Sin fecha', timeLabel: 'Sin hora', fullLabel: 'Sin fecha' }

  const normalizedDateSource = typeof dateSource === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateSource)
    ? `${dateSource}T12:00:00`
    : dateSource
  const date = new Date(normalizedDateSource)
  if (Number.isNaN(date.getTime())) {
    return { dateLabel: 'Sin fecha', timeLabel: 'Sin hora', fullLabel: 'Sin fecha' }
  }

  const dateLabel = capitalizeFirst(new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date))

  const timeDate = timeSource ? new Date(timeSource) : date
  const timeLabel = Number.isNaN(timeDate.getTime())
    ? 'Sin hora'
    : new Intl.DateTimeFormat('es-MX', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(timeDate)

  return {
    dateLabel,
    timeLabel,
    fullLabel: `${dateLabel} · ${timeLabel}`,
  }
}

export function formatHoldCountdown(expiresAt, serverNow) {
  if (!expiresAt) return '00:00'
  const expires = new Date(expiresAt).getTime()
  if (Number.isNaN(expires)) return '00:00'
  const server = serverNow ? new Date(serverNow).getTime() : Date.now()
  const remainingMs = expires - server
  const safeMs = Number.isFinite(remainingMs) ? remainingMs : 0
  const totalSeconds = Math.max(0, Math.floor(safeMs / 1000))
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function buildSpotLookup(spots = []) {
  return new Map((Array.isArray(spots) ? spots : []).map((spot) => [getEquipmentSpotKey(spot), spot]))
}

export function getEquipmentLabelForType(type) {
  return EQUIPMENT_LABELS[String(type ?? '').toLowerCase()] ?? 'Lugar'
}
