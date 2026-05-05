/**
 * notificacionesStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand para notificaciones de usuario.
 * Persiste en localStorage bajo 'casa-scarlatta-notificaciones'.
 *
 * Cuando haya backend, reemplazar NOTIFICACIONES_MOCK por
 * llamadas al endpoint de notificaciones en api.js.
 *
 * Usado en: Navbar, ClientPanel (futuro)
 * Depende de: zustand, mockData
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NOTIFICACIONES_MOCK } from '@/data/mockData'

export const useNotificacionesStore = create(
  persist(
    (set, get) => ({
      notificaciones: NOTIFICACIONES_MOCK,

      getNotificacionesByUsuario: (userId) =>
        get().notificaciones.filter((n) => n.userId === userId),

      getNoLeidas: (userId) =>
        get().notificaciones.filter((n) => n.userId === userId && !n.leida),

      marcarLeida: (id) =>
        set((state) => ({
          notificaciones: state.notificaciones.map((n) =>
            n.id === id ? { ...n, leida: true } : n
          ),
        })),

      marcarTodasLeidas: (userId) =>
        set((state) => ({
          notificaciones: state.notificaciones.map((n) =>
            n.userId === userId ? { ...n, leida: true } : n
          ),
        })),

      agregarNotificacion: (notificacion) =>
        set((state) => ({
          notificaciones: [
            ...state.notificaciones,
            { ...notificacion, id: `n-${Date.now()}`, leida: false },
          ],
        })),
    }),
    { name: 'casa-scarlatta-notificaciones' }
  )
)
