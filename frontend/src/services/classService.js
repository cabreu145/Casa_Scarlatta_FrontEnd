// classService.js — fake API layer
// To connect a real backend, replace only the async* functions at the bottom.
// The pure helpers stay the same.

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// ── Admin / store format (dia, hora, cupoMax, cupoActual) ─────────────────────

/**
 * Filter and sort classes for a given JS Date (store format).
 * @param {Array} classes  - full class list from the Zustand store
 * @param {Date}  date     - the target day
 */
export function getClassesByDate(classes, date) {
  const dayName = DIAS[date.getDay()]
  return [...classes]
    .filter((c) => c.dia === dayName)
    .sort((a, b) => a.hora.localeCompare(b.hora))
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

// ── Public page format (day, time, spots, totalSpots) ────────────────────────

/**
 * Filter and sort public classes (classes.js format) for a given JS Date.
 * @param {Array} classes  - public classes array (from data/classes.js)
 * @param {Date}  date     - the target day
 */
export function getPublicClassesByDate(classes, date) {
  const dayName = DIAS[date.getDay()]
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  return [...classes]
    .filter((c) => c.day === dayName)
    .sort((a, b) => toMin(a.time) - toMin(b.time))
}

/**
 * Availability for public-format class (spots / totalSpots).
 * status: 'ok' (>50% free) | 'low' (≤50% free) | 'full' (0 free)
 */
export function getPublicAvailability(cls) {
  const available = cls.spots
  const pct = cls.totalSpots > 0 ? available / cls.totalSpots : 0
  if (available <= 0) return { available: 0, pct: 0, status: 'full' }
  return { available, pct, status: pct > 0.5 ? 'ok' : 'low' }
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
