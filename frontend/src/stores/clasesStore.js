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
import { getClasesApi } from '@/services/clasesApiService'

const useApiClasses = import.meta.env.VITE_USE_API_CLASSES === 'true'
const inflightClasesLoads = new Map()

export const useClasesStore = create(
  persist(
    (set, get) => ({
      clases: useApiClasses ? [] : CLASES_MOCK,
      hasLoadedFromApi: false,

      getClasesByCoach: (coachId) =>
        get().clases.filter((c) => c.coachId === coachId),

      getById: (claseId) =>
        get().clases.find((c) => c.id === claseId),

      actualizarCupo: (claseId, delta) => {
        if (useApiClasses) return
        set((state) => ({
          clases: state.clases.map((c) =>
            c.id === claseId
              ? { ...c, cupoActual: Math.max(0, Math.min(c.cupoMax, c.cupoActual + delta)) }
              : c
          ),
        }))
      },

      setClases: (clases) => set({ clases: Array.isArray(clases) ? clases : [], hasLoadedFromApi: true }),

      loadClasesFromApi: async ({ force = false, status = 'programada' } = {}) => {
        if (!useApiClasses) return get().clases
        const current = get()
        if (!force && current.hasLoadedFromApi) {
          return current.clases
        }
        const currentSignature = `clases|${status || 'all'}`
        if (inflightClasesLoads.has(currentSignature)) {
          return inflightClasesLoads.get(currentSignature)
        }

        const request = getClasesApi({ status })
          .then((clasesApi) => {
            set({ clases: clasesApi, hasLoadedFromApi: true })
            return clasesApi
          })
          .finally(() => {
            inflightClasesLoads.delete(currentSignature)
          })

        inflightClasesLoads.set(currentSignature, request)
        return request
      },

      agregarClase: (nuevaClase) =>
        set((state) => ({
          hasLoadedFromApi: state.hasLoadedFromApi,
          clases: [...state.clases, { ...nuevaClase, id: Date.now() + Math.floor(Math.random() * 100000) }],
        })),

      editarClase: (id, cambios) =>
        set((state) => ({
          hasLoadedFromApi: state.hasLoadedFromApi,
          clases: state.clases.map((c) => (c.id === id ? { ...c, ...cambios } : c)),
        })),

      eliminarClase: (id) =>
        set((state) => ({
          hasLoadedFromApi: state.hasLoadedFromApi,
          clases: state.clases.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'casa-scarlatta-clases',
      version: 2,
      migrate: (persistedState) => ({
        ...persistedState,
        hasLoadedFromApi: false,
      }),
      partialize: (state) => ({ clases: state.clases }),
    }
  )
)
