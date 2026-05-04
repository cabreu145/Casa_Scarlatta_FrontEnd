/**
 * gastosStore.js
 * ─────────────────────────────────────────────────────
 * Estado global de gastos del estudio.
 *
 * Tipos de gasto: operativo, sueldo, servicio,
 *                 insumo, inventario
 *
 * ✅ CÓMO CONECTAR BACKEND:
 *    Reemplazar acciones por llamadas httpPost/httpGet
 *    al endpoint correspondiente. La UI no cambia.
 *
 * Usado en: AdminFinanzas.jsx
 * Depende de: zustand
 * ─────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const TIPOS_GASTO = {
  OPERATIVO:  'operativo',
  SUELDO:     'sueldo',
  SERVICIO:   'servicio',
  INSUMO:     'insumo',
  INVENTARIO: 'inventario',
}

export const useGastosStore = create(
  persist(
    (set, get) => ({
      gastos: [],

      /**
       * Registra un gasto nuevo.
       * @param {object} datos
       * @param {string} datos.concepto
       * @param {number} datos.monto
       * @param {string} datos.tipo    - Ver TIPOS_GASTO
       * @param {string} datos.adminId
       * @returns {object} gasto creado
       * // [BACKEND] → POST /api/gastos
       */
      registrarGasto: (datos) => {
        const nuevo = {
          ...datos,
          id:    `gasto-${Date.now()}`,
          fecha: new Date().toISOString().split('T')[0],
          hora:  new Date().toTimeString().slice(0, 5),
        }
        set(state => ({ gastos: [...state.gastos, nuevo] }))
        return nuevo
      },

      /**
       * Elimina un gasto por ID.
       * @param {string} id
       * // [BACKEND] → DELETE /api/gastos/:id
       */
      eliminarGasto: (id) =>
        set(state => ({
          gastos: state.gastos.filter(g => g.id !== id),
        })),

      /**
       * Gastos filtrados por rango de tiempo.
       * @param {'dia'|'semana'|'mes'} rango
       * @returns {object[]}
       * // [BACKEND] → GET /api/gastos?rango=mes
       */
      getGastosByRango: (rango) => {
        const hoy    = new Date().toISOString().split('T')[0]
        const semana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const mes    = hoy.slice(0, 7) // 'YYYY-MM'
        return get().gastos.filter(g => {
          const f = g.fecha ?? ''
          if (rango === 'dia')    return f === hoy
          if (rango === 'semana') return f >= semana
          return f.slice(0, 7) === mes
        })
      },

      /**
       * Gastos agrupados por tipo para el rango.
       * @param {'dia'|'semana'|'mes'} rango
       * @returns {object} totales por tipo + total general
       */
      getGastosByTipo: (rango) => {
        const gastos = get().getGastosByRango(rango)
        return gastos.reduce(
          (acc, g) => {
            acc[g.tipo] = (acc[g.tipo] ?? 0) + g.monto
            acc.total   = (acc.total   ?? 0) + g.monto
            return acc
          },
          { operativo: 0, sueldo: 0, servicio: 0, insumo: 0, inventario: 0, total: 0 }
        )
      },
    }),
    { name: 'cs-gastos' }
  )
)
