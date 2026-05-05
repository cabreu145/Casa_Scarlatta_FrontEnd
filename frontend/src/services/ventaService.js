/**
 * ventaService.js
 * ─────────────────────────────────────────────────────
 * Orquesta el flujo completo de una venta en el POS.
 *
 * ✅ CÓMO CONECTAR BACKEND:
 *    Reemplazar cada getState() por un httpPost() al
 *    endpoint correspondiente. La UI no cambia.
 *
 * Usado en: AdminPanel.jsx
 * Depende de: transaccionesStore, usuariosStore,
 *             notificacionesStore
 * ─────────────────────────────────────────────────────
 */

import { useTransaccionesStore }  from '../stores/transaccionesStore'
import { useUsuariosStore }       from '../stores/usuariosStore'
import { useNotificacionesStore } from '../stores/notificacionesStore'
import { TIPOS_TRANSACCION }      from '../data/mockData'

/**
 * Procesa una venta completa del POS.
 *
 * Registra la transacción en el store y, si hay una
 * asignación de paquete pendiente, actualiza los créditos
 * del cliente directamente (sin llamar a asignarPaqueteService
 * para evitar duplicar la transacción).
 *
 * @param {object} params
 * @param {object[]}   params.items              - Items del carrito { name, price, emoji }
 * @param {number}     params.subtotal           - Sin IVA
 * @param {number}     params.total              - Con IVA
 * @param {string}     params.metodoPago         - 'efectivo' | 'tarjeta' | 'transferencia'
 * @param {number}     params.montoPagado        - Monto recibido
 * @param {number}     params.cambio             - Cambio entregado
 * @param {object|null} params.pendingAsignacion - { userId, userName, paqSel } | null
 * @param {string|null} params.adminId           - ID del admin que procesa
 * @returns {{ ok: boolean, mensaje: string }}
 *
 * // [BACKEND] → POST /api/ventas
 */
export async function procesarVentaService({
  items,
  subtotal,
  total,
  metodoPago,
  montoPagado,
  cambio,
  pendingAsignacion = null,
  adminId = null,
}) {
  const transaccionesStore = useTransaccionesStore.getState()
  const usuariosStore      = useUsuariosStore.getState()
  const notifStore         = useNotificacionesStore.getState()

  try {
    if (!items?.length) {
      return { ok: false, mensaje: 'La orden está vacía.' }
    }

    const tienePaquete = !!pendingAsignacion
    const tipo         = tienePaquete
      ? TIPOS_TRANSACCION.PAQUETE
      : TIPOS_TRANSACCION.PRODUCTO

    const detalle = items.map(i => i.name ?? i.nombre).join(', ')

    // 1. Registrar la transacción completa del POS
    transaccionesStore.registrarTransaccion({
      tipo,
      concepto:    `POS — ${detalle}`,
      monto:       total,
      subtotal,
      metodoPago,
      montoPagado,
      cambio,
      userId:      pendingAsignacion?.userId ?? null,
      adminId,
      fecha:       new Date().toISOString().split('T')[0],
      origen:      'pdv',
    })

    // 2. Si hay paquete pendiente, actualizar créditos del cliente
    if (pendingAsignacion) {
      const { userId, userName, paqSel } = pendingAsignacion
      const clases = paqSel.clases === 0 ? 999 : paqSel.clases
      usuariosStore.asignarPaquete(userId, paqSel.nombre, clases)

      notifStore.agregarNotificacion({
        userId,
        tipo:    'paquete',
        titulo:  'Paquete activado',
        mensaje: `${paqSel.nombre} activado para ${userName} — vía POS.`,
        fecha:   new Date().toISOString().split('T')[0],
      })
    }

    return { ok: true, mensaje: '¡Venta registrada correctamente!' }

  } catch (error) {
    console.error('[ventaService] procesarVenta:', error)
    return { ok: false, mensaje: 'Error al procesar la venta.' }
  }
}

/**
 * Obtiene ingresos del día agrupados por método de pago.
 * Usado en corte de caja.
 *
 * @returns {{ efectivo: number, tarjeta: number, transferencia: number, total: number }}
 *
 * // [BACKEND] → GET /api/finanzas/dia
 */
export function getDailyIncome() {
  const { transacciones } = useTransaccionesStore.getState()
  const hoy = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD' — evita problemas de zona horaria

  const txHoy = transacciones.filter(tx => tx.fecha === hoy)

  return txHoy.reduce(
    (acc, tx) => {
      const metodo = tx.metodoPago ?? 'efectivo'
      acc[metodo] = (acc[metodo] ?? 0) + (tx.monto ?? 0)
      acc.total   = (acc.total   ?? 0) + (tx.monto ?? 0)
      return acc
    },
    { efectivo: 0, tarjeta: 0, transferencia: 0, total: 0 }
  )
}

/**
 * Obtiene ingresos agrupados por categoría de venta.
 *
 * @param {'dia'|'semana'|'mes'} rango
 * @returns {{ paquetes: number, productos: number, total: number }}
 *
 * // [BACKEND] → GET /api/finanzas/categorias?rango=mes
 */
export function getIncomeByCategory(rango = 'mes') {
  const { transacciones } = useTransaccionesStore.getState()
  const hoy    = new Date().toISOString().split('T')[0]  // 'YYYY-MM-DD'
  const semana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const mes    = hoy.slice(0, 7) // 'YYYY-MM'

  const txFiltradas = transacciones.filter(tx => {
    const f = tx.fecha ?? ''
    if (rango === 'dia')    return f === hoy
    if (rango === 'semana') return f >= semana
    return f.slice(0, 7) === mes
  })

  return txFiltradas.reduce(
    (acc, tx) => {
      const cat  = tx.tipo === TIPOS_TRANSACCION.PAQUETE ? 'paquetes' : 'productos'
      acc[cat]   = (acc[cat]   ?? 0) + (tx.monto ?? 0)
      acc.total  = (acc.total  ?? 0) + (tx.monto ?? 0)
      return acc
    },
    { paquetes: 0, productos: 0, total: 0 }
  )
}
