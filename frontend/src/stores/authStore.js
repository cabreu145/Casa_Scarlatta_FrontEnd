import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      setUsuario: (usuario) => set((state) => ({ usuario, isAuthenticated: !!(usuario && (state.token || true)) })),
      setToken: (token) => set((state) => ({ token, isAuthenticated: !!(state.usuario && token) || !!state.usuario })),
      setSession: ({ usuario, token }) => set({ usuario: usuario ?? null, token: token ?? null, isAuthenticated: !!usuario }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ usuario: null, token: null, isAuthenticated: false }),

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

