/**
 * productosStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand para el catálogo de productos.
 * Persiste en localStorage bajo 'casa-scarlatta-productos'.
 *
 * Cuando haya backend, reemplazar PRODUCTOS_MOCK por
 * llamadas a los endpoints de productos en api.js.
 *
 * Usado en: AdminProductos (futuro)
 * Depende de: zustand, mockData
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRODUCTOS_MOCK } from '@/data/mockData'

export const useProductosStore = create(
  persist(
    (set, get) => ({
      productos: PRODUCTOS_MOCK,

      getProductoById: (id) =>
        get().productos.find((p) => p.id === id),

      getProductosActivos: () =>
        get().productos.filter((p) => p.activo),

      agregarProducto: (producto) =>
        set((state) => ({
          productos: [...state.productos, { ...producto, id: Date.now() }],
        })),

      editarProducto: (id, cambios) =>
        set((state) => ({
          productos: state.productos.map((p) =>
            p.id === id ? { ...p, ...cambios } : p
          ),
        })),

      eliminarProducto: (id) =>
        set((state) => ({
          productos: state.productos.filter((p) => p.id !== id),
        })),

      descontarStock: (id, cantidad = 1) =>
        set((state) => ({
          productos: state.productos.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, p.stock - cantidad) } : p
          ),
        })),
    }),
    { name: 'casa-scarlatta-productos' }
  )
)
