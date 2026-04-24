import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockClases } from '@/data/mockClases'
import { mockReservas } from '@/data/mockReservas'

export const useClasesStore = create(
  persist(
    (set, get) => ({
      clases: mockClases,
      reservas: mockReservas,

      getReservasByUsuario: (userId) =>
        get().reservas.filter((r) => r.userId === userId),

      getClasesByCoach: (coachId) =>
        get().clases.filter((c) => c.coachId === coachId),

      reservarClase: (userId, claseId) => {
        const clases = get().clases
        const clase = clases.find((c) => c.id === claseId)
        if (!clase || clase.cupoActual >= clase.cupoMax) return false

        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        const hoy = new Date()
        const diaIndex = dias.indexOf(clase.dia)
        const hoySemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1
        const diff = diaIndex - hoySemana
        const fecha = new Date(hoy)
        fecha.setDate(hoy.getDate() + (diff >= 0 ? diff : diff + 7))

        const nuevaReserva = {
          id: Date.now(),
          userId,
          claseId,
          claseNombre: clase.nombre,
          claseHora: clase.hora,
          claseDia: clase.dia,
          coachNombre: clase.coachNombre,
          tipo: clase.tipo,
          estado: 'confirmada',
          fecha: fecha.toISOString().split('T')[0],
        }

        set((state) => ({
          reservas: [...state.reservas, nuevaReserva],
          clases: state.clases.map((c) =>
            c.id === claseId ? { ...c, cupoActual: c.cupoActual + 1 } : c
          ),
        }))
        return true
      },

      cancelarReserva: (reservaId, userId) => {
        const reserva = get().reservas.find((r) => r.id === reservaId && r.userId === userId)
        if (!reserva || reserva.estado !== 'confirmada') return false

        set((state) => ({
          reservas: state.reservas.map((r) =>
            r.id === reservaId ? { ...r, estado: 'cancelada' } : r
          ),
          clases: state.clases.map((c) =>
            c.id === reserva.claseId ? { ...c, cupoActual: Math.max(0, c.cupoActual - 1) } : c
          ),
        }))
        return true
      },

      // Reserva desde el flujo público /reservar (datos vienen de classes.js)
      reservarDesdePublico: (userId, cls, asiento) => {
        const hoy = new Date()
        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        const diaIndex = dias.indexOf(cls.day)
        const hoySemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1
        const diff = diaIndex >= 0 ? diaIndex - hoySemana : 0
        const fecha = new Date(hoy)
        fecha.setDate(hoy.getDate() + (diff >= 0 ? diff : diff + 7))

        const nuevaReserva = {
          id: Date.now(),
          userId,
          claseId: null,
          claseNombre: cls.name,
          claseHora: cls.time,
          claseDia: cls.day,
          coachNombre: cls.instructor,
          tipo: cls.type,
          asiento,
          estado: 'confirmada',
          fecha: fecha.toISOString().split('T')[0],
        }

        set((state) => ({ reservas: [...state.reservas, nuevaReserva] }))
        return nuevaReserva
      },

      agregarClase: (nuevaClase) =>
        set((state) => ({
          clases: [...state.clases, { ...nuevaClase, id: Date.now() }],
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
    { name: 'casa-scarlatta-clases' }
  )
)
