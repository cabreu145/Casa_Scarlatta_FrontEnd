/**
 * cortesStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand para cortes de caja mensuales.
 * Persiste en localStorage bajo 'casa-scarlatta-cortes'.
 *
 * Cuando haya backend, reemplazar CORTES_MOCK por
 * llamadas al endpoint de cortes en api.js.
 *
 * Usado en: AdminFinanzas (futuro)
 * Depende de: zustand, mockData
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CORTES_MOCK } from '@/data/mockData'

export const useCortesStore = create(
  persist(
    (set, get) => ({
      cortes: CORTES_MOCK,

      getUltimoCorte: () => {
        const cortes = get().cortes
        return cortes[cortes.length - 1] ?? null
      },

      ejecutarCorte: (datosCorte) =>
        set((state) => ({
          cortes: [
            ...state.cortes,
            { ...datosCorte, id: `corte-${Date.now()}`, estado: 'cerrado' },
          ],
        })),
    }),
    { name: 'casa-scarlatta-cortes' }
  )
)
