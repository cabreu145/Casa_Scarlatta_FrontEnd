import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const paquetesIniciales = [
  {
    id: 1,
    nombre: 'Básico',
    precio: 999,
    clases: 8,
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
    beneficios: [
      '16 clases al mes',
      'Acceso prioritario',
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
    beneficios: [
      'Clases ilimitadas',
      'Acceso VIP a todos los horarios',
      'Clase privada mensual',
      'Descuentos exclusivos',
      'Soporte prioritario',
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

      resetearPaquetes: () => set({ paquetes: paquetesIniciales }),
    }),
    { name: 'casa-scarlatta-paquetes' }
  )
)
