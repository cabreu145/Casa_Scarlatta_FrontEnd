/**
 * Returns YYYY-MM-DD in the user's local timezone.
 * Unlike toISOString(), this does NOT shift to UTC — so at 8 PM CDT
 * it still returns the local date, not tomorrow's UTC date.
 */
export function fechaLocal(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Returns the current local date as YYYY-MM-DD */
export function hoyLocal() {
  return fechaLocal(new Date())
}

/** Returns YYYY-MM (local) for month comparisons */
export function mesLocal(date = new Date()) {
  return fechaLocal(date).slice(0, 7)
}
