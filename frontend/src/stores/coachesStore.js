/**
 * coachesStore.js
 * ─────────────────────────────────────────────────────
 * Estado global de coaches del estudio.
 * Persiste en localStorage bajo 'cs-coaches'.
 *
 * Conexiones:
 *   → clasesStore: al crear clase se selecciona coach
 *   → coach/Dashboard: coach ve sus propias clases
 *   → admin/Coaches: CRUD completo
 *   → admin/AdminPanel: sección coaches del dashboard
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { COACHES_MOCK } from '@/data/mockData'

export const useCoachesStore = create(
  persist(
    (set, get) => ({
      coaches: COACHES_MOCK,

      agregarCoach: (datos) => {
        const nuevo = { ...datos, id: `coach-${Date.now()}`, activo: true }
        set((state) => ({ coaches: [...state.coaches, nuevo] }))
        return nuevo
      },

      editarCoach: (id, datos) => {
        set((state) => ({
          coaches: state.coaches.map((c) =>
            c.id === id ? { ...c, ...datos } : c
          ),
        }))
      },

      eliminarCoach: (id) => {
        set((state) => ({
          coaches: state.coaches.map((c) =>
            c.id === id ? { ...c, activo: false } : c
          ),
        }))
      },

      getActivos: () => get().coaches.filter((c) => c.activo),

      getById: (id) => get().coaches.find((c) => c.id === id),
    }),
    { name: 'cs-coaches' }
  )
)
