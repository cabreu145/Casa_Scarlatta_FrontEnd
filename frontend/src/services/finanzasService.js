/**
 * finanzasService.js
 * ─────────────────────────────────────────────────────
 * Servicio centralizado de métricas financieras.
 * Lee de los stores de Zustand existentes.
 *
 * ✅ CÓMO CONECTAR BACKEND:
 *    Reemplazar cada función por llamada httpGet/httpPost.
 *    La UI no cambia — solo este archivo.
 *
 * Usado en: AdminFinanzas.jsx, AdminReportes.jsx
 * ─────────────────────────────────────────────────────
 */

import { useTransaccionesStore } from '@/stores/transaccionesStore'
import { useGastosStore }        from '@/stores/gastosStore'
import { useClasesStore }        from '@/stores/clasesStore'
import { useCoachesStore }       from '@/stores/coachesStore'
import { useTabuladorStore }     from '@/stores/tabuladorStore'

// ── Helpers ───────────────────────────────────────────────────────────────────
function getHoy()   { return new Date().toISOString().split('T')[0] }
function getSemana(){ return new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0] }
function getMes()   { return getHoy().slice(0,7) }

function filtrarTxPorRango(transacciones, rango) {
  const hoy = getHoy(), semana = getSemana(), mes = getMes()
  return transacciones.filter(tx => {
    const f = tx.fecha ?? ''
    if (rango === 'dia')    return f === hoy
    if (rango === 'semana') return f >= semana
    return f.slice(0,7) === mes
  })
}

// Período anterior al rango actual (para % de crecimiento)
function filtrarTxPeriodoAnterior(transacciones, rango) {
  const hoy = new Date()
  if (rango === 'dia') {
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1)
    const ayerStr = ayer.toISOString().split('T')[0]
    return transacciones.filter(tx => tx.fecha === ayerStr)
  }
  if (rango === 'semana') {
    const hace14 = new Date(hoy); hace14.setDate(hoy.getDate() - 14)
    const hace7  = new Date(hoy); hace7.setDate(hoy.getDate() - 7)
    const f14 = hace14.toISOString().split('T')[0]
    const f7  = hace7.toISOString().split('T')[0]
    return transacciones.filter(tx => tx.fecha >= f14 && tx.fecha < f7)
  }
  // mes anterior
  const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const mesStr = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth()+1).padStart(2,'0')}`
  return transacciones.filter(tx => (tx.fecha ?? '').slice(0,7) === mesStr)
}

// ── KPIs principales ──────────────────────────────────────────────────────────
/**
 * Devuelve todos los KPIs del módulo de finanzas para el rango dado.
 * @param {'dia'|'semana'|'mes'} rango
 * @returns {object} kpis
 *
 * // [BACKEND] → GET /api/finanzas/kpis?rango=mes
 */
export function getKpisFinanzas(rango = 'mes') {
  const { transacciones } = useTransaccionesStore.getState()
  const gastosStore       = useGastosStore.getState()

  const txActual   = filtrarTxPorRango(transacciones, rango).filter(tx => tx.monto > 0)
  const txAnterior = filtrarTxPeriodoAnterior(transacciones, rango).filter(tx => tx.monto > 0)

  const totalIngresos   = txActual.reduce((a,tx) => a + tx.monto, 0)
  const totalAnt        = txAnterior.reduce((a,tx) => a + tx.monto, 0)
  const crecimiento     = totalAnt > 0 ? Math.round(((totalIngresos - totalAnt) / totalAnt) * 100) : null

  const gastosRango    = gastosStore.getGastosByRango(rango)
  const totalGastos    = gastosRango.reduce((a,g) => a + g.monto, 0)
  const utilidad       = totalIngresos - totalGastos
  const numTx          = txActual.length
  const ticketPromedio = numTx > 0 ? Math.round(totalIngresos / numTx) : 0

  // Desglose por método de pago (rango actual)
  const txAll = filtrarTxPorRango(transacciones, rango)
  const desglosePago = txAll.reduce(
    (acc, tx) => {
      const m = tx.metodoPago ?? 'efectivo'
      acc[m] = (acc[m] ?? 0) + (tx.monto > 0 ? tx.monto : 0)
      return acc
    },
    { efectivo: 0, tarjeta: 0, transferencia: 0 }
  )

  // Desglose por categoría
  const desgloseCat = txActual.reduce(
    (acc, tx) => {
      const cat = tx.tipo === 'paquete' ? 'paquetes' : 'productos'
      acc[cat] = (acc[cat] ?? 0) + tx.monto
      return acc
    },
    { paquetes: 0, productos: 0 }
  )

  // Datos para gráfica de línea (últimos 7 días o 6 semanas o 6 meses)
  const serieHistorica = getSerieHistorica(transacciones, rango)

  return {
    totalIngresos,
    totalGastos,
    utilidad,
    crecimiento,
    numTransacciones: numTx,
    ticketPromedio,
    desglosePago,
    desgloseCat,
    serieHistorica,
  }
}

// ── Serie histórica para gráfica ──────────────────────────────────────────────
function getSerieHistorica(transacciones, rango) {
  if (rango === 'dia') {
    // Últimas 24 horas por hora
    return Array.from({ length: 8 }, (_, i) => {
      const h = i * 3
      const label = `${String(h).padStart(2,'0')}:00`
      const monto = transacciones
        .filter(tx => tx.monto > 0 && tx.fecha === getHoy())
        .reduce((a, tx) => a + (tx.monto ?? 0), 0)
      // Distribuir monto de forma visual (mock)
      return { label, ingresos: Math.round(monto / 8 * (0.5 + Math.random() * 0.8)), gastos: 0 }
    })
  }

  if (rango === 'semana') {
    const dias = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
    return dias.map((label, i) => {
      const fecha = new Date(); fecha.setDate(fecha.getDate() - (6 - i))
      const fechaStr = fecha.toISOString().split('T')[0]
      const ingresos = transacciones
        .filter(tx => tx.fecha === fechaStr && tx.monto > 0)
        .reduce((a, tx) => a + tx.monto, 0)
      return { label, ingresos, gastos: 0 }
    })
  }

  // mes: últimos 6 meses
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const mesStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const label  = meses[d.getMonth()]
    const ingresos = transacciones
      .filter(tx => (tx.fecha ?? '').slice(0,7) === mesStr && tx.monto > 0)
      .reduce((a, tx) => a + tx.monto, 0)
    return { label, ingresos, gastos: 0 }
  })
}

// ── Datos de corte de caja ────────────────────────────────────────────────────
/**
 * Resumen del día para corte de caja.
 * @returns {object}
 * // [BACKEND] → GET /api/finanzas/corte-hoy
 */
export function getDatosCorteHoy() {
  const { transacciones } = useTransaccionesStore.getState()
  const hoy = getHoy()
  const txHoy = transacciones.filter(tx => tx.fecha === hoy)

  return txHoy.reduce(
    (acc, tx) => {
      if (tx.monto > 0) {
        const m = tx.metodoPago ?? 'efectivo'
        acc[m]    = (acc[m] ?? 0) + tx.monto
        acc.total = (acc.total ?? 0) + tx.monto
      }
      return acc
    },
    { efectivo: 0, tarjeta: 0, transferencia: 0, total: 0 }
  )
}

// ── Reporte de coaches con tabulador ─────────────────────────────────────────
/**
 * Calcula clases impartidas, ocupación y pago por coach.
 * @param {'quincena'|'mes'} periodo
 * @param {boolean} incluirPago - false para vista coach
 * @returns {object[]}
 * // [BACKEND] → GET /api/reportes/coaches?periodo=mes
 */
export function getReporteCoaches(periodo = 'mes', incluirPago = true) {
  const { clases, reservas } = useClasesStore.getState()
  const { coaches }          = useCoachesStore.getState()
  const tabulador            = useTabuladorStore.getState().tabulador

  const hoy  = new Date()
  const mes  = getMes()
  let fechaInicio

  if (periodo === 'quincena') {
    const dia = hoy.getDate()
    fechaInicio = dia <= 15
      ? `${mes}-01`
      : `${mes}-16`
  } else {
    fechaInicio = `${mes}-01`
  }

  return coaches.filter(c => c.activo).map(coach => {
    const clasesCoach = clases.filter(c => c.coachId === coach.id)

    // Reservas confirmadas en el período para las clases de este coach
    const reservasCoach = reservas.filter(r =>
      r.estado === 'confirmada' &&
      r.fecha >= fechaInicio &&
      clasesCoach.some(c => c.id === r.claseId)
    )

    // Por cada clase, calcular ocupación promedio y pago
    const detalleClases = clasesCoach.map(clase => {
      const reservasClase = reservasCoach.filter(r => r.claseId === clase.id)
      const asistentes    = clase.cupoActual
      const ocupPct       = Math.round((asistentes / clase.cupoMax) * 100)

      // Calcular pago según tabulador
      const tabDisciplina = tabulador[clase.tipo] ?? tabulador['Stryde X']
      let pagoClase = 0
      for (const rango of tabDisciplina) {
        if (asistentes >= rango.min && asistentes <= rango.max) {
          pagoClase = rango.pago
          break
        }
      }

      return {
        claseId:      clase.id,
        nombre:       clase.nombre,
        tipo:         clase.tipo,
        dia:          clase.dia,
        hora:         clase.hora,
        asistentes,
        cupoMax:      clase.cupoMax,
        ocupPct,
        pagoClase:    incluirPago ? pagoClase : undefined,
        reservas:     reservasClase.length,
      }
    })

    const totalClases    = detalleClases.length
    const ocupPromedio   = totalClases > 0
      ? Math.round(detalleClases.reduce((a, c) => a + c.ocupPct, 0) / totalClases)
      : 0
    const totalPago      = incluirPago
      ? detalleClases.reduce((a, c) => a + (c.pagoClase ?? 0), 0)
      : undefined

    return {
      coachId:      coach.id,
      nombre:       coach.nombre,
      especialidad: coach.especialidad,
      totalClases,
      ocupPromedio,
      totalPago,
      detalleClases,
      periodo,
    }
  })
}

// ── Datos para exportación ────────────────────────────────────────────────────
/**
 * Transacciones formateadas para Excel/CSV.
 * @param {'dia'|'semana'|'mes'} rango
 * // [BACKEND] → GET /api/finanzas/exportar?rango=mes
 */
export function getTransaccionesParaExportar(rango = 'mes') {
  const { transacciones } = useTransaccionesStore.getState()
  return filtrarTxPorRango(transacciones, rango)
    .sort((a,b) => new Date(b.fecha) - new Date(a.fecha))
    .map(tx => ({
      Fecha:        tx.fecha,
      Concepto:     tx.concepto,
      Tipo:         tx.tipo,
      'Método pago': tx.metodoPago ?? 'efectivo',
      Monto:        tx.monto,
    }))
}
