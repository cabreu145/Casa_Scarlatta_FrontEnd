function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeString(value, fallback = '') {
  const raw = String(value ?? '').trim()
  return raw || fallback
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw) return fallback
  if (['true', '1', 'active', 'activo', 'si', 'sí', 'yes', 'on'].includes(raw)) return true
  if (['false', '0', 'inactive', 'inactivo', 'no', 'off'].includes(raw)) return false
  return fallback
}

function normalizeArray(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

export function mapBackendPayTableItemToFrontend(item = {}) {
  return {
    id: item.id ?? item.pay_table_id ?? item.payTableId ?? null,
    discipline: normalizeString(item.discipline ?? item.primary_discipline ?? item.primaryDiscipline, 'Sin disciplina'),
    minAttendees: toNumber(item.min_attendees ?? item.minAttendees, 0),
    maxAttendees: toNumber(item.max_attendees ?? item.maxAttendees, 0),
    payMxn: toNumber(item.pay_mxn ?? item.payMxn, 0),
    isActive: normalizeBoolean(item.is_active ?? item.isActive, true),
    raw: item,
  }
}

export function mapBackendPayTableToFrontend(payload = {}) {
  const items = normalizeArray(payload).map(mapBackendPayTableItemToFrontend)
  return {
    items,
    raw: payload,
  }
}
