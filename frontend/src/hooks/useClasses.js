// useClasses — bridges the Zustand store with the classService API layer.
// When the backend is ready, swap getClassesByDate for a real async fetch.

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
