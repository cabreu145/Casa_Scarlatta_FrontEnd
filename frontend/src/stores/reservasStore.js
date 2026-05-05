/**
 * reservasStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand para el historial de reservas.
 * Persiste en localStorage bajo 'casa-scarlatta-reservas'.
 *
 * Nota: clasesStore también maneja reservas en su flujo de cupos.
 * Este store es la fuente de verdad para historial, estados y
 * asistencia. Cuando haya backend, reemplazar RESERVAS_MOCK por
 * llamadas a los endpoints de reservas en api.js.
 *
 * Usado en: ClientPanel, CoachDashboard, AdminClases
 * Depende de: zustand, mockData
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RESERVAS_MOCK, ESTADOS_RESERVA } from '@/data/mockData'

export const useReservasStore = create(
  persist(
    (set, get) => ({
      reservas: RESERVAS_MOCK,

      getReservasByUsuario: (userId) =>
        get().reservas.filter((r) => r.userId === userId),

      getReservasByClase: (claseId) =>
        get().reservas.filter(
          (r) => r.claseId === claseId && r.estado === ESTADOS_RESERVA.CONFIRMADA
        ),

      agregarReserva: (reserva) =>
        set((state) => ({
          reservas: [...state.reservas, { ...reserva, id: Date.now() }],
        })),

      cancelarReserva: (reservaId, userId) => {
        const reserva = get().reservas.find(
          (r) => r.id === reservaId && r.userId === userId
        )
        if (!reserva || reserva.estado !== ESTADOS_RESERVA.CONFIRMADA) return false
        set((state) => ({
          reservas: state.reservas.map((r) =>
            r.id === reservaId ? { ...r, estado: ESTADOS_RESERVA.CANCELADA } : r
          ),
        }))
        return true
      },

      marcarNoAsistio: (reservaId) =>
        set((state) => ({
          reservas: state.reservas.map((r) =>
            r.id === reservaId ? { ...r, estado: ESTADOS_RESERVA.NO_ASISTIO } : r
          ),
        })),

      marcarCompletada: (reservaId) =>
        set((state) => ({
          reservas: state.reservas.map((r) =>
            r.id === reservaId ? { ...r, estado: ESTADOS_RESERVA.COMPLETADA } : r
          ),
        })),
    }),
    { name: 'casa-scarlatta-reservas' }
  )
)
