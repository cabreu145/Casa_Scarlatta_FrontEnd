/**
 * authStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand para el estado de autenticación.
 * Persiste en localStorage bajo la clave 'casa-scarlatta-auth'.
 *
 * Usado en: AuthContext.jsx (único consumidor directo)
 * Depende de: zustand, zustand/middleware
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      usuario: null,
      isAuthenticated: false,
      loading: false,

      setUsuario: (usuario) => set({ usuario, isAuthenticated: !!usuario }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ usuario: null, isAuthenticated: false }),

      actualizarPerfil: (cambios) =>
        set((state) => ({
          usuario: state.usuario ? { ...state.usuario, ...cambios } : null,
        })),

      actualizarClasesPaquete: (cantidad) =>
        set((state) => ({
          usuario: state.usuario
            ? { ...state.usuario, clasesPaquete: Math.max(0, (state.usuario.clasesPaquete || 0) + cantidad) }
            : null,
        })),
    }),
    { name: 'casa-scarlatta-auth' }
  )
)
