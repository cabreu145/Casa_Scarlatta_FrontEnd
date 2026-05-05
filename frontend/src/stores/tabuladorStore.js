/**
 * tabuladorStore.js
 * ─────────────────────────────────────────────────────
 * Tabulador de pagos por clase según disciplina y ocupación.
 * Persiste en localStorage bajo 'cs-tabulador'.
 *
 * Estructura del tabulador:
 * {
 *   [disciplina]: [
 *     { min, max, pago }  ← rango de asistentes y pago por clase
 *   ]
 * }
 *
 * ✅ CÓMO CONECTAR BACKEND:
 *    Reemplazar set/get por llamadas a /api/tabulador
 *
 * Usado en: AdminReportes.jsx, finanzasService.js
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Valores iniciales según las reglas del negocio
const TABULADOR_INICIAL = {
  'Stryde X': [
    { min: 1,  max: 6,  pago: 200 },
    { min: 7,  max: 12, pago: 350 },
    { min: 13, max: 18, pago: 500 },
  ],
  'Slow': [
    { min: 1,  max: 5,  pago: 200 },
    { min: 6,  max: 10, pago: 350 },
    { min: 11, max: 15, pago: 500 },
  ],
}

export const useTabuladorStore = create(
  persist(
    (set, get) => ({
      tabulador: TABULADOR_INICIAL,

      /**
       * Actualiza un rango específico de una disciplina.
       * @param {string} disciplina - 'Stryde X' | 'Slow'
       * @param {number} rangoIndex - índice del rango (0, 1, 2...)
       * @param {object} cambios    - { min?, max?, pago? }
       * // [BACKEND] → PUT /api/tabulador/:disciplina/:rangoIndex
       */
      actualizarRango: (disciplina, rangoIndex, cambios) =>
        set(state => ({
          tabulador: {
            ...state.tabulador,
            [disciplina]: state.tabulador[disciplina].map((r, i) =>
              i === rangoIndex ? { ...r, ...cambios } : r
            ),
          },
        })),

      /**
       * Agrega una disciplina nueva al tabulador.
       * @param {string} disciplina
       * @param {object[]} rangos
       * // [BACKEND] → POST /api/tabulador/:disciplina
       */
      agregarDisciplina: (disciplina, rangos) =>
        set(state => ({
          tabulador: { ...state.tabulador, [disciplina]: rangos },
        })),

      /**
       * Calcula el pago de una clase según disciplina y asistentes.
       * @param {string} disciplina
       * @param {number} asistentes
       * @returns {number}
       */
      calcularPago: (disciplina, asistentes) => {
        const tab = get().tabulador[disciplina]
        if (!tab) return 0
        const rango = tab.find(r => asistentes >= r.min && asistentes <= r.max)
        return rango?.pago ?? 0
      },

      resetear: () => set({ tabulador: TABULADOR_INICIAL }),
    }),
    { name: 'cs-tabulador' }
  )
)
