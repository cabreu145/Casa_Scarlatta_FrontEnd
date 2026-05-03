/**
 * usuariosStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand para gestión de usuarios (admin).
 * Persiste en localStorage bajo 'casa-scarlatta-usuarios'.
 *
 * ⚠️  Este store es para operaciones ADMIN sobre usuarios.
 *     La sesión activa del cliente sigue en authStore.js.
 *     Los campos de crédito usan 'clasesPaquete' (mismo nombre
 *     que en mockUsers.js y authStore.actualizarClasesPaquete).
 *
 * Cuando haya backend, reemplazar mockUsers por llamadas
 * a los endpoints de usuarios en api.js.
 *
 * Usado en: AdminUsuarios (futuro)
 * Depende de: zustand, mockUsers
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockUsers } from '@/data/mockUsers'

export const useUsuariosStore = create(
  persist(
    (set, get) => ({
      usuarios: mockUsers,

      getUsuarioById: (id) =>
        get().usuarios.find((u) => u.id === id),

      getById: (id) =>
        get().usuarios.find((u) => u.id === id),

      getClientes: () =>
        get().usuarios.filter((u) => u.rol === 'cliente'),

      getCoaches: () =>
        get().usuarios.filter((u) => u.rol === 'coach'),

      actualizarUsuario: (id, cambios) =>
        set((state) => ({
          usuarios: state.usuarios.map((u) =>
            u.id === id ? { ...u, ...cambios } : u
          ),
        })),

      editarUsuario: (id, datos) =>
        set((state) => ({
          usuarios: state.usuarios.map((u) =>
            u.id === id ? { ...u, ...datos } : u
          ),
        })),

      // Descuenta 1 crédito del paquete activo del usuario.
      // No descuenta si el usuario ya tiene 0 créditos.
      descontarCredito: (userId) =>
        set((state) => ({
          usuarios: state.usuarios.map((u) =>
            u.id === userId && u.clasesPaquete > 0
              ? { ...u, clasesPaquete: u.clasesPaquete - 1 }
              : u
          ),
        })),

      // Devuelve 1 crédito (p.ej. al cancelar una reserva).
      devolverCredito: (userId) =>
        set((state) => ({
          usuarios: state.usuarios.map((u) =>
            u.id === userId
              ? { ...u, clasesPaquete: (u.clasesPaquete ?? 0) + 1 }
              : u
          ),
        })),

      agregarUsuario: (nuevoUsuario) => {
        const nuevo = { ...nuevoUsuario, id: Date.now() }
        set((state) => ({ usuarios: [...state.usuarios, nuevo] }))
        return nuevo
      },

      eliminarUsuario: (id) =>
        set((state) => ({
          usuarios: state.usuarios.filter((u) => u.id !== id),
        })),

      // Asigna un nuevo paquete y reinicia el contador de créditos.
      asignarPaquete: (userId, paquete, clases) =>
        set((state) => ({
          usuarios: state.usuarios.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  paquete,
                  clasesPaquete: clases,
                  clasesPaqueteTotal: clases,
                  paqueteInfo: {
                    fechaCompra: new Date().toISOString().split('T')[0],
                    estado: 'Activo',
                    tipo: 'Individual',
                  },
                }
              : u
          ),
        })),
    }),
    { name: 'casa-scarlatta-usuarios' }
  )
)
