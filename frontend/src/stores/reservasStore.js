/**
 * reservasStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand para el historial de reservas.
 * Persiste en localStorage bajo 'casa-scarlatta-reservas'.
 *
 * Fuente de verdad para historial, estados y asistencia.
 * clasesStore solo gestiona cupoActual — las reservas viven aquí.
 * Cuando haya backend, reemplazar RESERVAS_MOCK por llamadas a api.js.
 *
 * Usado en: ClientPanel, CoachDashboard, AdminClases
 * Depende de: zustand, mockData
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RESERVAS_MOCK, ESTADOS_RESERVA } from '@/data/mockData'
import { getMisReservasApi } from '@/services/reservasApiService'

const useApiReservations = import.meta.env.VITE_USE_API_RESERVATIONS === 'true'
const inflightReservasLoads = new Map()

export const useReservasStore = create(
  persist(
    (set, get) => ({
      reservas: RESERVAS_MOCK,
      hasLoadedFromApi: false,

      getReservasByUsuario: (userId) =>
        get().reservas.filter((r) => r.userId === userId),

      getReservasByClase: (claseId) =>
        get().reservas.filter(
          (r) => r.claseId === claseId && r.estado === ESTADOS_RESERVA.CONFIRMADA
        ),

      setReservas: (reservas) => set({ reservas: Array.isArray(reservas) ? reservas : [], hasLoadedFromApi: true }),

      loadMisReservasFromApi: async ({ force = false } = {}) => {
        if (!useApiReservations) return get().reservas
        const current = get()
        if (!force && current.hasLoadedFromApi) {
          return current.reservas
        }
        const currentSignature = 'reservas'
        if (inflightReservasLoads.has(currentSignature)) {
          return inflightReservasLoads.get(currentSignature)
        }

        const request = getMisReservasApi()
          .then((reservasApi) => {
            set({ reservas: reservasApi, hasLoadedFromApi: true })
            return reservasApi
          })
          .finally(() => {
            inflightReservasLoads.delete(currentSignature)
          })

        inflightReservasLoads.set(currentSignature, request)
        return request
      },

      agregarReserva: (reserva) =>
        set((state) => ({
          hasLoadedFromApi: state.hasLoadedFromApi,
          reservas: [...state.reservas, { ...reserva, id: Date.now() }],
        })),

      cancelarReserva: (reservaId, userId) => {
        const reserva = get().reservas.find(
          (r) => r.id === reservaId && r.userId === userId
        )
        if (!reserva || reserva.estado !== ESTADOS_RESERVA.CONFIRMADA) return false
        set((state) => ({
          hasLoadedFromApi: state.hasLoadedFromApi,
          reservas: state.reservas.map((r) =>
            r.id === reservaId ? { ...r, estado: ESTADOS_RESERVA.CANCELADA } : r
          ),
        }))
        return true
      },

      marcarNoAsistio: (reservaId) =>
        set((state) => ({
          hasLoadedFromApi: state.hasLoadedFromApi,
          reservas: state.reservas.map((r) =>
            r.id === reservaId ? { ...r, estado: ESTADOS_RESERVA.NO_ASISTIO } : r
          ),
        })),

      marcarCompletada: (reservaId) =>
        set((state) => ({
          hasLoadedFromApi: state.hasLoadedFromApi,
          reservas: state.reservas.map((r) =>
            r.id === reservaId ? { ...r, estado: ESTADOS_RESERVA.COMPLETADA } : r
          ),
        })),

      cancelarReservasByClase: (claseId) =>
        set((state) => ({
          hasLoadedFromApi: state.hasLoadedFromApi,
          reservas: state.reservas.map((r) =>
            r.claseId === claseId && r.estado === ESTADOS_RESERVA.CONFIRMADA
              ? { ...r, estado: ESTADOS_RESERVA.CANCELADA }
              : r
          ),
        })),
    }),
    {
      name: 'casa-scarlatta-reservas',
      version: 1,
      migrate: (persistedState) => ({
        ...persistedState,
        hasLoadedFromApi: false,
      }),
      partialize: (state) => ({ reservas: state.reservas }),
    }
  )
)
