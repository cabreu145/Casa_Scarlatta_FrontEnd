/**
 * classService.js
 * ─────────────────────────────────────────────────────
 * Capa de servicio para clases. Contiene helpers puros de
 * filtrado/disponibilidad y stubs de API listos para activar.
 * Para conectar el backend: implementar las funciones *API
 * usando http.js y los ENDPOINTS de constants/api.js.
 *
 * Usado en: Clases.jsx, AdminClases.jsx, useClasses.js
 * Depende de: (nada — funciones puras, sin imports externos)
 * ─────────────────────────────────────────────────────
 */

import { getClassTimeToken } from '@/utils/classSchedule'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// ── Admin / store format (dia, hora, cupoMax, cupoActual) ─────────────────────

/**
 * Filter and sort classes for a given JS Date (store format).
 * @param {Array} classes  - full class list from the Zustand store
 * @param {Date}  date     - the target day
 */
export function getClassesByDate(classes, date) {
  const dayName = DIAS[date.getDay()]
  const y  = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d  = String(date.getDate()).padStart(2, '0')
  const isoDate = `${y}-${mo}-${d}`
  return [...classes]
    .filter((c) => {
      if (c.fecha) return c.fecha === isoDate
      if (c.dia) return c.dia === dayName
      return true
    })
    .sort((a, b) => {
      const timeA = getClassTimeToken(a) ?? '99:99'
      const timeB = getClassTimeToken(b) ?? '99:99'
      return timeA.localeCompare(timeB)
    })
}

/**
 * Availability for store-format class (cupoMax / cupoActual).
 * status: 'ok' (>50% free) | 'low' (≤50% free) | 'full' (0 free)
 */
export function getAvailability(clase) {
  const available = clase.cupoMax - clase.cupoActual
  const pct = clase.cupoMax > 0 ? available / clase.cupoMax : 0
  if (available <= 0) return { available: 0, pct: 0, status: 'full' }
  return { available, pct, status: pct > 0.5 ? 'ok' : 'low' }
}

// ── Public page format — ahora usa el mismo formato unificado del store ──────

/**
 * Filter and sort classes (unified format from store) for a given JS Date.
 * @param {Array} classes  - clases del store (formato unificado de mockData.js)
 * @param {Date}  date     - the target day
 */
/**
 * Returns true if a class is already published (visible to the public).
 * A class is visible when:
 *   - It has no publicarEn date, OR
 *   - Its publicarEn datetime is in the past (already reached)
 */
export function isPublished(cls) {
  if (!cls.publicarEn) return true
  return new Date(cls.publicarEn) <= new Date()
}

export function getPublicClassesByDate(classes, date) {
  const dayName = DIAS[date.getDay()]
  const y  = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d  = String(date.getDate()).padStart(2, '0')
  const isoDate = `${y}-${mo}-${d}`
  const toMin = (item) => {
    const time = getClassTimeToken(item)
    if (!time) return Number.MAX_SAFE_INTEGER
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }
  return [...classes]
    .filter((c) => {
      // Specific-date class → match isoDate; recurring class → match day name;
      // no schedule info yet from API → render as always visible
      const matchDay = c.fecha ? c.fecha === isoDate : (c.dia ? c.dia === dayName : true)
      return matchDay && isPublished(c)
    })
    .sort((a, b) => toMin(a) - toMin(b))
}

/**
 * Availability for unified-format class (cupoMax / cupoActual).
 * status: 'ok' (>50% free) | 'low' (≤50% free) | 'full' (0 free)
 */
export function getPublicAvailability(cls) {
  const available = cls.cupoMax - cls.cupoActual
  const pct = cls.cupoMax > 0 ? available / cls.cupoMax : 0
  if (available <= 0) return { available: 0, pct: 0, status: 'full' }
  return { available, pct, status: pct > 0.5 ? 'ok' : 'low' }
}

export function getReservationOccurrenceDate(reservation) {
  if (!reservation) return null
  if (reservation.classDate && /^\d{4}-\d{2}-\d{2}$/.test(reservation.classDate)) {
    return reservation.classDate
  }
  if (reservation.classStartAt) {
    const d = new Date(reservation.classStartAt)
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  if (reservation.fechaSesion && /^\d{4}-\d{2}-\d{2}$/.test(reservation.fechaSesion)) {
    return reservation.fechaSesion
  }
  if (reservation.fecha && /^\d{4}-\d{2}-\d{2}$/.test(reservation.fecha)) {
    return reservation.fecha
  }
  return null
}

// ─────────────────────────────────────────────────────────────────
// Future API endpoints — swap these implementations only when
// a real backend is available. The rest of the app stays unchanged.
// ─────────────────────────────────────────────────────────────────

export async function createClassAPI(data) {
  // POST /api/classes
  return { ...data, id: Date.now() }
}

export async function updateClassAPI(id, data) {
  // PUT /api/classes/:id
  return { id, ...data }
}

export async function deleteClassAPI(id) {
  // DELETE /api/classes/:id
  return { success: true, id }
}
