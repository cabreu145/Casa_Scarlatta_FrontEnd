/**
 * dateHelpers.js
 * ─────────────────────────────────────────────────────
 * Funciones para manejo de fechas usadas en el calendario.
 * Lógica extraída de Clases.jsx y AdminClases.jsx para
 * reutilizarse en cualquier parte de la app sin duplicar código.
 *
 * ✅ CÓMO USAR:
 *    import { getWeekDays, formatHour } from '../utils/dateHelpers'
 * ─────────────────────────────────────────────────────
 */

const DAYS_ES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const DAYS_ABBR = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export { DAYS_ES, DAYS_ABBR, MONTHS_ES }

/**
 * Genera un arreglo con los 7 días de la semana (lunes a domingo)
 * a partir de un offset de semanas relativo a la semana actual.
 * @param {number} offset - 0 = semana actual, 1 = siguiente, -1 = anterior
 * @returns {Date[]} Arreglo de 7 fechas de lunes a domingo
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
 * Convierte hora en formato "HH:MM" a "H:MM a.m./p.m.".
 * @param {string} hora - Ejemplo: "07:00" o "14:30"
 * @returns {string} Ejemplo: "7:00 a.m." o "2:30 p.m."
 */
export function formatHour(hora) {
  const [h, m] = hora.split(':').map(Number)
  const suffix = h >= 12 ? 'p.m.' : 'a.m.'
  const hr     = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hr}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

/**
 * Compara si dos objetos Date son el mismo día calendario.
 * @param {Date} fecha1
 * @param {Date} fecha2
 * @returns {boolean} true si son el mismo día
 */
export function isSameDay(fecha1, fecha2) {
  return fecha1.getDate()     === fecha2.getDate()  &&
         fecha1.getMonth()    === fecha2.getMonth() &&
         fecha1.getFullYear() === fecha2.getFullYear()
}

/**
 * Retorna el rango de meses que abarca una semana, en español y en mayúsculas.
 * Si la semana cruza dos meses, muestra ambos separados por "–".
 * @param {Date[]} days - Arreglo de 7 fechas (resultado de getWeekDays)
 * @returns {string} Ejemplo: "ABRIL 2026" o "ABRIL – MAYO 2026"
 */
export function getMonthLabel(days) {
  const a = days[0], b = days[days.length - 1]
  if (a.getMonth() === b.getMonth())
    return `${MONTHS_ES[a.getMonth()].toUpperCase()} ${b.getFullYear()}`
  return `${MONTHS_ES[a.getMonth()].toUpperCase()} – ${MONTHS_ES[b.getMonth()].toUpperCase()} ${b.getFullYear()}`
}

/**
 * Genera las iniciales de un nombre completo (máximo 2 letras).
 * @param {string} nombre - Ejemplo: "Carlos Méndez"
 * @returns {string} Ejemplo: "CM"
 */
export function getInitials(nombre) {
  return nombre.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
