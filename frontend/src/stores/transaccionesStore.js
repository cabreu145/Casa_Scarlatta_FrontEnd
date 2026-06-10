/**
 * transaccionesStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand para el registro de transacciones financieras.
 * Persiste en localStorage bajo 'casa-scarlatta-transacciones'.
 *
 * Cuando haya backend, reemplazar TRANSACCIONES_MOCK por
 * llamadas a los endpoints de transacciones en api.js.
 *
 * Usado en: AdminFinanzas (futuro)
 * Depende de: zustand, mockData
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TRANSACCIONES_MOCK } from '@/data/mockData'

export const useTransaccionesStore = create(
  persist(
    (set, get) => ({
      transacciones: TRANSACCIONES_MOCK,

      getTransaccionesByUsuario: (userId) =>
        get().transacciones.filter((t) => t.userId === userId),

      getTransaccionesByMes: (año, mes) =>
        get().transacciones.filter((t) => {
          const d = new Date(t.fecha)
          return d.getFullYear() === año && d.getMonth() + 1 === mes
        }),

      registrarTransaccion: (tx) =>
        set((state) => ({
          transacciones: [
            ...state.transacciones,
            { ...tx, id: `tx-${Date.now()}` },
          ],
        })),
    }),
    { name: 'casa-scarlatta-transacciones' }
  )
)
