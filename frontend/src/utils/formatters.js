/**
 * formatters.js
 * ─────────────────────────────────────────────────────
 * Fuente única de funciones de formato de fechas, horas y texto.
 * dateHelpers.js y fecha.js re-exportan desde aquí para
 * preservar imports existentes sin cambios en stores/services.
 *
 * Importar directamente en componentes nuevos:
 *   import { formatHour, getWeekDays } from '@/utils/formatters'
 * ─────────────────────────────────────────────────────
 */

// ── Constantes de calendario ──────────────────────────────────────────────────
export const DAYS_ES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
export const DAYS_ABBR = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']
export const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ── Timezone-safe date strings ────────────────────────────────────────────────

/** Returns YYYY-MM-DD in local timezone (no UTC shift). */
export function fechaLocal(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Returns current local date as YYYY-MM-DD */
export function hoyLocal() {
  return fechaLocal(new Date())
}

/** Returns YYYY-MM (local) for month comparisons */
export function mesLocal(date = new Date()) {
  return fechaLocal(date).slice(0, 7)
}

// ── Semana / calendario ───────────────────────────────────────────────────────

/**
 * Genera 7 Date objects (lunes a domingo) para la semana con el offset dado.
 * @param {number} offset - 0 = semana actual, 1 = siguiente, -1 = anterior
 * @returns {Date[]}
 */
export function getWeekDays(offset = 0) {
  const today = new Date()
  const dow   = today.getDay()
  const start = new Date(today)
  start.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

/**
 * Genera 7 objetos enriquecidos para la semana con el offset dado.
 * A diferencia de getWeekDays, devuelve metadatos listos para render
 * (fullName, abbr, num, isoDate) — útil en ClientPanel.
 * @param {number} off - offset en semanas
 * @returns {{ fullName, abbr, num, month, year, isoDate }[]}
 */
export function buildWeek(off = 0) {
  const base = new Date()
  base.setDate(base.getDate() + off * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d  = new Date(base)
    d.setDate(base.getDate() + i)
    const y  = d.getFullYear()
    const m  = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return {
      fullName: DAYS_ES[d.getDay()],
      abbr:     DAYS_ABBR[d.getDay()],
      num:      d.getDate(),
      month:    d.getMonth(),
      year:     d.getFullYear(),
      isoDate:  `${y}-${m}-${dd}`,
    }
  })
}

/**
 * Etiqueta de rango mensual para un resultado de buildWeek.
 * Ejemplo: "Abril 2026" o "Abril – Mayo 2026"
 * @param {{ month: number, year: number }[]} days - resultado de buildWeek
 */
export function weekRangeLabel(days) {
  const f = days[0], l = days[6]
  return f.month === l.month
    ? `${MONTHS_ES[f.month]} ${f.year}`
    : `${MONTHS_ES[f.month]} – ${MONTHS_ES[l.month]} ${l.year}`
}

/**
 * Etiqueta de rango mensual para un arreglo de Date objects.
 * Ejemplo: "ABRIL 2026" o "ABRIL – MAYO 2026"
 * @param {Date[]} days - resultado de getWeekDays
 */
export function getMonthLabel(days) {
  const a = days[0], b = days[days.length - 1]
  if (a.getMonth() === b.getMonth())
    return `${MONTHS_ES[a.getMonth()]} ${b.getFullYear()}`
  return `${MONTHS_ES[a.getMonth()]} – ${MONTHS_ES[b.getMonth()]} ${b.getFullYear()}`
}

// ── Comparación de fechas ─────────────────────────────────────────────────────

/**
 * Compara si dos Date son el mismo día calendario.
 */
export function isSameDay(fecha1, fecha2) {
  return fecha1.getDate()     === fecha2.getDate()  &&
         fecha1.getMonth()    === fecha2.getMonth() &&
         fecha1.getFullYear() === fecha2.getFullYear()
}

/** Devuelve true si date es hoy. */
export function isToday(date) {
  return isSameDay(date, new Date())
}

// ── Formateo de hora ──────────────────────────────────────────────────────────

/**
 * Convierte "HH:MM" a "H:MM a.m./p.m.".
 * @param {string} hora - Ejemplo: "07:00" o "14:30"
 * @returns {string} Ejemplo: "7:00 a.m." o "2:30 p.m."
 */
export function formatHour(hora) {
  const [h, m] = hora.split(':').map(Number)
  const suffix = h >= 12 ? 'p.m.' : 'a.m.'
  const hr     = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hr}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

// ── Formateo de fechas ────────────────────────────────────────────────────────

/**
 * Formatea una fecha ISO ("YYYY-MM-DD") como "D de Mes de YYYY".
 * Ejemplo: "2026-05-15" → "15 de Mayo de 2026"
 * @param {string|null} iso
 */
export function formatFechaISO(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} de ${MONTHS_ES[m - 1]} de ${y}`
}

/**
 * Devuelve el nombre del día de la semana en español para una fecha ISO.
 * Usa T00:00:00 para evitar desfase UTC.
 * @param {string} fechaStr - "YYYY-MM-DD"
 */
export function diaDesdefecha(fechaStr) {
  if (!fechaStr) return ''
  return DAYS_ES[new Date(fechaStr + 'T00:00:00').getDay()] ?? ''
}

// ── Texto ─────────────────────────────────────────────────────────────────────

/**
 * Genera las iniciales de un nombre completo (máximo 2 letras).
 * @param {string} nombre - Ejemplo: "Carlos Méndez"
 * @returns {string} Ejemplo: "CM"
 */
export function getInitials(nombre) {
  return nombre.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
