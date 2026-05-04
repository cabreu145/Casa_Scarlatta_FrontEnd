/**
 * dashboardService.js
 * ─────────────────────────────────────────────────────
 * Servicio de métricas para el dashboard admin.
 * Todas las funciones leen de los stores reales.
 *
 * ✅ CÓMO CONECTAR BACKEND:
 *    Reemplazar cada función por una llamada httpGet()
 *    al endpoint correspondiente. La UI no cambia.
 *
 * Usado en: AdminDashboard.jsx
 * Depende de: transaccionesStore, usuariosStore,
 *             clasesStore, reservasStore, paquetesStore
 * ─────────────────────────────────────────────────────
 */

import { useTransaccionesStore } from '../stores/transaccionesStore'
import { useUsuariosStore }      from '../stores/usuariosStore'
import { useReservasStore }      from '../stores/reservasStore'
import { useClasesStore }        from '../stores/clasesStore'
import { usePaquetesStore }      from '../stores/paquetesStore'

/**
 * Filtra transacciones según el rango seleccionado.
 * @param {object[]} transacciones
 * @param {'dia'|'semana'|'mes'} rango
 * @returns {object[]}
 */
function filtrarPorRango(transacciones, rango) {
  const ahora = new Date()
  return transacciones.filter(tx => {
    const fecha = new Date(tx.fecha)
    if (rango === 'dia') {
      return fecha.toDateString() === ahora.toDateString()
    }
    if (rango === 'semana') {
      const hace7 = new Date(ahora)
      hace7.setDate(ahora.getDate() - 7)
      return fecha >= hace7
    }
    if (rango === 'mes') {
      return (
        fecha.getMonth()    === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
      )
    }
    return true
  })
}

/**
 * Obtiene todas las métricas del dashboard
 * para el rango de tiempo seleccionado.
 *
 * @param {'dia'|'semana'|'mes'} rango
 * @returns {object} métricas completas
 *
 * // [BACKEND] → GET /api/admin/dashboard?rango=mes
 */
export function getDashboardMetrics(rango = 'mes') {
  const { transacciones } = useTransaccionesStore.getState()
  const { usuarios }      = useUsuariosStore.getState()
  const { reservas }      = useReservasStore.getState()
  const { clases }        = useClasesStore.getState()
  const { paquetes }      = usePaquetesStore.getState()

  const txRango = filtrarPorRango(transacciones, rango)

  // Ingresos totales del rango (excluye reembolsos/montos negativos)
  const ingresosTotales = txRango
    .filter(tx => tx.monto > 0)
    .reduce((acc, tx) => acc + tx.monto, 0)

  // Paquetes vendidos en el rango
  const paquetesVendidos = txRango.filter(tx => tx.tipo === 'paquete').length

  // Usuarios clientes activos (sin filtro de rango — total acumulado)
  const totalUsuarios = usuarios.filter(
    u => u.rol === 'cliente' && u.activo
  ).length

  // Ocupación promedio de todas las clases
  const ocupacionPromedio = clases.length > 0
    ? Math.round(
        clases.reduce((acc, c) => acc + (c.cupoActual / c.cupoMax) * 100, 0) / clases.length
      )
    : 0

  // Reservas del rango
  const reservasRango = reservas.filter(r => {
    const fecha = new Date(r.fecha ?? r.creadaEn)
    const ahora = new Date()
    if (rango === 'dia') {
      return fecha.toDateString() === ahora.toDateString()
    }
    if (rango === 'semana') {
      const hace7 = new Date(ahora)
      hace7.setDate(ahora.getDate() - 7)
      return fecha >= hace7
    }
    if (rango === 'mes') {
      return (
        fecha.getMonth()    === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
      )
    }
    return true
  })

  const totalReservas       = reservasRango.length
  const reservasConfirmadas = reservasRango.filter(r => r.estado === 'confirmada').length
  const reservasCanceladas  = reservasRango.filter(r => r.estado === 'cancelada').length

  // Transacciones recientes del rango (últimas 5)
  const transaccionesRecientes = [...txRango]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5)

  return {
    ingresosTotales,
    paquetesVendidos,
    totalUsuarios,
    ocupacionPromedio,
    totalReservas,
    reservasConfirmadas,
    reservasCanceladas,
    transaccionesRecientes,
    totalClases:   clases.length,
    totalPaquetes: paquetes.length,
  }
}
