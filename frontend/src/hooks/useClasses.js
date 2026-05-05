/**
 * useClasses.js
 * ─────────────────────────────────────────────────────
 * Hook que conecta el store de Zustand con la capa de servicio.
 * Retorna las clases del día ordenadas por hora.
 * Cuando haya backend: reemplazar la llamada al store por
 * un fetch real a ENDPOINTS.clases vía httpGet().
 *
 * Usado en: AdminClases.jsx
 * Depende de: clasesStore, classService
 * ─────────────────────────────────────────────────────
 */

import { useClasesStore } from '@/stores/clasesStore'
import { getClassesByDate } from '@/services/classService'

/**
 * Returns sorted classes for the given Date, live from the store.
 * @param {Date} selectedDate
 */
export function useClasses(selectedDate) {
  const { clases } = useClasesStore()
  const classes = getClassesByDate(clases, selectedDate)
  return { classes, loading: false }
}
