/**
 * disciplinasStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand para la lista configurable de disciplinas.
 * Persiste en localStorage bajo la clave 'cs-disciplinas'.
 * Compartido por: modales de creación/edición de coaches y clases.
 *
 * Usado en: AdminPanel.jsx, AdminCoaches.jsx
 * Depende de: zustand, zustand/middleware
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_DISCIPLINAS = ['Stride', 'Slow']

export const useDisciplinasStore = create(
  persist(
    (set) => ({
      disciplinas: DEFAULT_DISCIPLINAS,

      agregarDisciplina: (nombre) =>
        set((state) => {
          const limpio = nombre.trim()
          if (!limpio || state.disciplinas.includes(limpio)) return state
          return { disciplinas: [...state.disciplinas, limpio] }
        }),

      eliminarDisciplina: (nombre) =>
        set((state) => ({
          disciplinas: state.disciplinas.filter((d) => d !== nombre),
        })),

      reordenar: (nuevaLista) => set(() => ({ disciplinas: nuevaLista })),
    }),
    { name: 'cs-disciplinas' }
  )
)
