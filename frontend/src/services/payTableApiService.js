import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPost, httpPut } from '@/lib/http'
import { mapBackendPayTableItemToFrontend, mapBackendPayTableToFrontend } from '@/adapters/payTableAdapter'

function normalizeDiscipline(value) {
  return String(value ?? '').trim()
}

function normalizeRangeNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function buildPayTablePayload(form = {}) {
  return {
    discipline: normalizeDiscipline(form.discipline ?? form.primaryDiscipline),
    min_attendees: normalizeRangeNumber(form.minAttendees ?? form.min_attendees, 0),
    max_attendees: normalizeRangeNumber(form.maxAttendees ?? form.max_attendees, 0),
    pay_mxn: normalizeRangeNumber(form.payMxn ?? form.pay_mxn, 0),
    is_active: typeof form.isActive === 'boolean'
      ? form.isActive
      : typeof form.is_active === 'boolean'
        ? form.is_active
        : String(form.isActive ?? form.is_active ?? 'true').trim().toLowerCase() !== 'false',
  }
}

function validatePayTablePayload(payload = {}) {
  if (!String(payload.discipline ?? '').trim()) return 'La disciplina es obligatoria.'
  if (payload.min_attendees < 0 || payload.max_attendees < 0) return 'Rango de asistentes inválido.'
  if (payload.max_attendees < payload.min_attendees) return 'Rango de asistentes inválido.'
  if (payload.pay_mxn < 0) return 'Pago inválido.'
  if (typeof payload.is_active !== 'boolean') return 'Estado de rango inválido.'
  return null
}

export async function getPayTableApi() {
  if (!ENDPOINTS.tabulador) {
    throw new Error('PAY_TABLE_ENDPOINT_MISSING')
  }
  const payload = await httpGet(ENDPOINTS.tabulador)
  return mapBackendPayTableToFrontend(payload)
}

export async function createPayTableApi(form = {}) {
  if (!ENDPOINTS.tabulador) {
    throw new Error('PAY_TABLE_ENDPOINT_MISSING')
  }
  const payload = buildPayTablePayload(form)
  const validationError = validatePayTablePayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendPayTableItemToFrontend(await httpPost(ENDPOINTS.tabulador, payload))
}

export async function updatePayTableApi(id, form = {}) {
  if (!ENDPOINTS.tabuladorById) {
    throw new Error('PAY_TABLE_ENDPOINT_MISSING')
  }
  const payload = buildPayTablePayload(form)
  const validationError = validatePayTablePayload(payload)
  if (validationError) throw new Error(validationError)
  return mapBackendPayTableItemToFrontend(await httpPut(ENDPOINTS.tabuladorById(id), payload))
}

export async function deletePayTableApi(id) {
  if (!ENDPOINTS.tabuladorById) {
    throw new Error('PAY_TABLE_ENDPOINT_MISSING')
  }
  const response = await httpDelete(ENDPOINTS.tabuladorById(id))
  return response ?? { success: true, id }
}

export { buildPayTablePayload, validatePayTablePayload }
