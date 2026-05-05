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
function filtrarPorRango(arr, rango, campo = 'fecha') {
  const hoy    = new Date().toISOString().split('T')[0]
  const semana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const mes    = hoy.slice(0, 7) // 'YYYY-MM'
  return arr.filter(item => {
    const f = (item[campo] ?? item.creadaEn ?? '').slice(0, 10)
    if (rango === 'dia')    return f === hoy
    if (rango === 'semana') return f >= semana
    if (rango === 'mes')    return f.slice(0, 7) === mes
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

  const txRango = filtrarPorRango(transacciones, rango, 'fecha')

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

  // Reservas del rango  (usa campo 'fecha', cae en 'creadaEn' como fallback via filtrarPorRango)
  const reservasRango = filtrarPorRango(reservas, rango, 'fecha')

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
