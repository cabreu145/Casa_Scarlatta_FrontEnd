/**
 * paquetesStore.js
 * ─────────────────────────────────────────────────────
 * Store de Zustand para los paquetes de membresía.
 * Persiste en localStorage bajo la clave 'casa-scarlatta-paquetes-v2'.
 * Contiene los 6 paquetes disponibles (3 mensuales + 3 packs).
 *
 * Usado en: AdminPaquetes, PricingSection, CompraModal
 * Depende de: zustand, zustand/middleware
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const paquetesIniciales = [
  // ── Suscripciones mensuales ──
  {
    id: 1,
    nombre: 'Básico',
    precio: 999,
    clases: 8,
    vigencia: 'Mensual',
    categoria: 'mensual',
    beneficios: [
      '8 clases al mes',
      'Acceso a Stride y Slow',
      'App de reservas',
      'Sin permanencia',
    ],
    destacado: false,
  },
  {
    id: 2,
    nombre: 'Esencial',
    precio: 1499,
    clases: 16,
    vigencia: 'Mensual',
    categoria: 'mensual',
    beneficios: [
      '16 clases al mes',
      'Acceso prioritario a horarios',
      'Clase de bienvenida gratis',
      'Descuentos en talleres',
      'Sin permanencia',
    ],
    destacado: true,
  },
  {
    id: 3,
    nombre: 'Premium',
    precio: 1999,
    clases: 0,
    vigencia: 'Mensual',
    categoria: 'mensual',
    beneficios: [
      'Clases ilimitadas',
      'Acceso VIP a todos los horarios',
      'Clase privada mensual',
      'Descuentos exclusivos',
      'Soporte prioritario',
    ],
    destacado: false,
  },
  // ── Packs de clases ──
  {
    id: 4,
    nombre: 'Primera Clase',
    precio: 299,
    clases: 1,
    vigencia: '7 días',
    categoria: 'pack',
    beneficios: [
      'Para nuevos clientes',
      'Stride o Slow a elegir',
      'Válido 7 días',
    ],
    destacado: false,
  },
  {
    id: 5,
    nombre: 'Pack 5',
    precio: 649,
    clases: 5,
    vigencia: '30 días',
    categoria: 'pack',
    beneficios: [
      '5 clases a tu ritmo',
      'Stride o Slow',
      'Válido 30 días',
    ],
    destacado: false,
  },
  {
    id: 6,
    nombre: 'Pack 20',
    precio: 2299,
    clases: 20,
    vigencia: '60 días',
    categoria: 'pack',
    beneficios: [
      '20 clases sin límite mensual',
      'Stride y Slow',
      'Válido 60 días',
    ],
    destacado: false,
  },
]

export const usePaquetesStore = create(
  persist(
    (set) => ({
      paquetes: paquetesIniciales,

      actualizarPaquete: (id, cambios) =>
        set((state) => ({
          paquetes: state.paquetes.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
        })),

      agregarBeneficio: (paqueteId, beneficio) =>
        set((state) => ({
          paquetes: state.paquetes.map((p) =>
            p.id === paqueteId ? { ...p, beneficios: [...p.beneficios, beneficio] } : p
          ),
        })),

      editarBeneficio: (paqueteId, index, texto) =>
        set((state) => ({
          paquetes: state.paquetes.map((p) => {
            if (p.id !== paqueteId) return p
            const nuevos = [...p.beneficios]
            nuevos[index] = texto
            return { ...p, beneficios: nuevos }
          }),
        })),

      eliminarBeneficio: (paqueteId, index) =>
        set((state) => ({
          paquetes: state.paquetes.map((p) => {
            if (p.id !== paqueteId) return p
            return { ...p, beneficios: p.beneficios.filter((_, i) => i !== index) }
          }),
        })),

      marcarDestacado: (id) =>
        set((state) => ({
          paquetes: state.paquetes.map((p) => ({ ...p, destacado: p.id === id })),
        })),

      agregarPaquete: (nuevoPaquete) =>
        set((state) => ({
          paquetes: [...state.paquetes, { ...nuevoPaquete, id: Date.now() }],
        })),

      resetearPaquetes: () => set({ paquetes: paquetesIniciales }),
    }),
    { name: 'casa-scarlatta-paquetes-v2' }
  )
)
