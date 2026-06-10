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

// ── Ingresos reales por mes (últimos 8 meses) ─────────────────────────────
export function getIngresosPorMes() {
  const { transacciones } = useTransaccionesStore.getState()
  const ahora = new Date()
  const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun',
                         'Jul','Ago','Sep','Oct','Nov','Dic']
  return Array.from({ length: 8 }, (_, i) => {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - (7 - i), 1)
    const ym    = `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}`
    const total = transacciones
      .filter(tx => tx.monto > 0 && (tx.fecha ?? '').startsWith(ym))
      .reduce((s, tx) => s + tx.monto, 0)
    return {
      label:    MESES_CORTOS[fecha.getMonth()],
      mes:      ym,
      ingresos: total,
    }
  })
}

// ── Distribución real de paquetes vendidos ────────────────────────────────
export function getDistribucionPaquetes() {
  const { transacciones } = useTransaccionesStore.getState()
  const { paquetes }      = usePaquetesStore.getState()

  const ventas = transacciones.filter(tx => tx.tipo === 'paquete' && tx.monto > 0)
  const total  = ventas.length || 1

  const COLORES = ['#7B1F2E', '#C26B7A', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6']

  return paquetes.map((p, i) => {
    const count = ventas.filter(tx =>
      tx.concepto?.toLowerCase().includes(p.nombre.toLowerCase())
    ).length
    return {
      nombre: p.nombre,
      count,
      pct:    Math.round((count / total) * 100),
      color:  COLORES[i % COLORES.length],
      precio: p.precio,
      clases: p.clases,
    }
  }).filter(p => p.count > 0)
    .sort((a, b) => b.count - a.count)
}

// ── Clases del día actual ─────────────────────────────────────────────────
export function getClasesHoy() {
  const { clases } = useClasesStore.getState()
  const hoy    = new Date()
  const isoHoy = hoy.toISOString().split('T')[0]
  const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const diaHoy  = DIAS_ES[hoy.getDay()]

  return clases
    .filter(c => c.fecha === isoHoy || (!c.fecha && c.dia === diaHoy))
    .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''))
    .slice(0, 4)
}

// ── Usuarios con paquete por vencer (≤ 7 días o ≤ 2 clases) ──────────────
export function getUsuariosPorVencer() {
  const { usuarios } = useUsuariosStore.getState()
  const hoy = new Date().toISOString().split('T')[0]

  return usuarios
    .filter(u => u.rol === 'cliente' && u.activo && u.paquete)
    .map(u => {
      const vencimiento    = u.paqueteInfo?.fechaVencimiento ?? null
      const diasRestantes  = vencimiento
        ? Math.ceil((new Date(vencimiento) - new Date(hoy)) / 86400000)
        : null
      const clasesRestantes = u.clasesPaquete === 999 ? null : (u.clasesPaquete ?? 0)
      const urgente = (diasRestantes !== null && diasRestantes <= 3)
                   || (clasesRestantes !== null && clasesRestantes <= 1)
      const pronto  = (diasRestantes !== null && diasRestantes <= 7)
                   || (clasesRestantes !== null && clasesRestantes <= 2)
      return { ...u, diasRestantes, clasesRestantes, urgente, pronto }
    })
    .filter(u => u.urgente || u.pronto)
    .sort((a, b) => {
      if (a.urgente && !b.urgente) return -1
      if (!a.urgente && b.urgente) return 1
      return (a.diasRestantes ?? 99) - (b.diasRestantes ?? 99)
    })
    .slice(0, 4)
}

// ── Últimas transacciones reales ──────────────────────────────────────────
export function getUltimasVentas() {
  const { transacciones } = useTransaccionesStore.getState()
  const { usuarios }      = useUsuariosStore.getState()

  return [...transacciones]
    .filter(tx => tx.monto > 0)
    .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))
    .slice(0, 4)
    .map(tx => {
      const usuario = usuarios.find(u => u.id === tx.userId)
      return {
        ...tx,
        nombreUsuario: usuario?.nombre ?? 'Cliente',
        inicial:       (usuario?.nombre ?? 'C').charAt(0).toUpperCase(),
      }
    })
}
