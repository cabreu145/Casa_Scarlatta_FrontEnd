/**
 * clasesStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand para clases y cupos.
 * Las reservas viven en reservasStore; este store solo
 * gestiona el catálogo de clases y el cupo disponible.
 *
 * Usado en: AdminClases, CoachDashboard, SeatSelector, reservasService
 * Depende de: zustand, mockData
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CLASES_MOCK } from '@/data/mockData'

export const useClasesStore = create(
  persist(
    (set, get) => ({
      clases: CLASES_MOCK,

      getClasesByCoach: (coachId) =>
        get().clases.filter((c) => c.coachId === coachId),

      getById: (claseId) =>
        get().clases.find((c) => c.id === claseId),

      actualizarCupo: (claseId, delta) =>
        set((state) => ({
          clases: state.clases.map((c) =>
            c.id === claseId
              ? { ...c, cupoActual: Math.max(0, Math.min(c.cupoMax, c.cupoActual + delta)) }
              : c
          ),
        })),

      agregarClase: (nuevaClase) =>
        set((state) => ({
          clases: [...state.clases, { ...nuevaClase, id: Date.now() + Math.floor(Math.random() * 100000) }],
        })),

      editarClase: (id, cambios) =>
        set((state) => ({
          clases: state.clases.map((c) => (c.id === id ? { ...c, ...cambios } : c)),
        })),

      eliminarClase: (id) =>
        set((state) => ({
          clases: state.clases.filter((c) => c.id !== id),
        })),
    }),
    { name: 'casa-scarlatta-clases', version: 1 }
  )
)
