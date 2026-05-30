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

import { useEffect, useState } from 'react'
import { useClasesStore } from '@/stores/clasesStore'
import { getClassesByDate } from '@/services/classService'

const useApiClasses = import.meta.env.VITE_USE_API_CLASSES === 'true'

/**
 * Returns sorted classes for the given Date, live from the store.
 * @param {Date} selectedDate
 */
export function useClasses(selectedDate) {
  const { clases, loadClasesFromApi } = useClasesStore()
  const [loading, setLoading] = useState(useApiClasses)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!useApiClasses) {
        if (mounted) setLoading(false)
        return
      }
      try {
        await loadClasesFromApi()
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [loadClasesFromApi])

  const classes = getClassesByDate(clases, selectedDate)
  return { classes, loading }
}
