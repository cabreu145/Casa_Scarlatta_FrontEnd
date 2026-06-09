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
import { useReservasStore }      from '@/stores/reservasStore'
import { useCoachesStore }       from '@/stores/coachesStore'
import { useTabuladorStore }     from '@/stores/tabuladorStore'
import { useCortesStore }        from '@/stores/cortesStore'
import { hoyLocal }              from '@/utils/fecha'

// ── Helpers ───────────────────────────────────────────────────────────────────
function getHoy()   { return hoyLocal() }
function getSemana(){ return hoyLocal(new Date(Date.now() - 7*24*60*60*1000)) }
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
    const ayerStr = hoyLocal(ayer)
    return transacciones.filter(tx => tx.fecha === ayerStr)
  }
  if (rango === 'semana') {
    const hace14 = new Date(hoy); hace14.setDate(hoy.getDate() - 14)
    const hace7  = new Date(hoy); hace7.setDate(hoy.getDate() - 7)
    const f14 = hoyLocal(hace14)
    const f7  = hoyLocal(hace7)
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
export function getKpisFinanzas(rango = 'mes', fechaFin = null, { fechaDesde = null, fechaHasta = null } = {}) {
  const { transacciones } = useTransaccionesStore.getState()
  const gastosStore       = useGastosStore.getState()

  const esRango = rango === 'rango' && fechaDesde && fechaHasta

  const txActual   = fechaFin
    ? transacciones.filter(tx => tx.fecha === fechaFin && tx.monto > 0)
    : esRango
      ? transacciones.filter(tx => tx.fecha >= fechaDesde && tx.fecha <= fechaHasta && tx.monto > 0)
      : filtrarTxPorRango(transacciones, rango).filter(tx => tx.monto > 0)
  const txAnterior = filtrarTxPeriodoAnterior(transacciones, rango).filter(tx => tx.monto > 0)

  const totalIngresos   = txActual.reduce((a,tx) => a + tx.monto, 0)
  const totalAnt        = txAnterior.reduce((a,tx) => a + tx.monto, 0)
  const crecimiento     = totalAnt > 0 ? Math.round(((totalIngresos - totalAnt) / totalAnt) * 100) : null

  const gastosRango    = fechaFin
    ? gastosStore.gastos.filter(g => g.fecha === fechaFin)
    : esRango
      ? gastosStore.gastos.filter(g => g.fecha >= fechaDesde && g.fecha <= fechaHasta)
      : gastosStore.getGastosByRango(rango)
  const totalGastos    = gastosRango.reduce((a,g) => a + g.monto, 0)
  const utilidad       = totalIngresos - totalGastos
  const numTx          = txActual.length
  const ticketPromedio = numTx > 0 ? Math.round(totalIngresos / numTx) : 0

  // Desglose por método de pago (rango actual)
  const txAll = fechaFin
    ? transacciones.filter(tx => tx.fecha === fechaFin)
    : esRango
      ? transacciones.filter(tx => tx.fecha >= fechaDesde && tx.fecha <= fechaHasta)
      : filtrarTxPorRango(transacciones, rango)
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
  const serieHistorica = getSerieHistorica(transacciones, rango, fechaFin)

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

// Legacy/demo only. Do not use as source of truth in API mode.
// ── Serie histórica para gráfica ──────────────────────────────────────────────
function getSerieHistorica(transacciones, rango, fechaFin = null) {
  if (fechaFin) {
    return Array.from({ length: 8 }, (_, i) => {
      const h     = i * 3
      const label = `${String(h).padStart(2,'0')}:00`
      const ingresos = transacciones
        .filter(tx => tx.monto > 0 && tx.fecha === fechaFin)
        .reduce((a, tx) => a + tx.monto, 0)
      return { label, ingresos: Math.round(ingresos / 8), gastos: 0 }
    })
  }
  if (rango === 'dia') {
    // Últimas 24 horas por hora
    return Array.from({ length: 8 }, (_, i) => {
      const h = i * 3
      const label = `${String(h).padStart(2,'0')}:00`
      const monto = transacciones
        .filter(tx => tx.monto > 0 && tx.fecha === getHoy())
        .reduce((a, tx) => a + (tx.monto ?? 0), 0)
      // Legacy/demo only. Visual distribution, not financial source of truth.
      return { label, ingresos: Math.round(monto / 8 * (0.5 + Math.random() * 0.8)), gastos: 0 }
    })
  }

  if (rango === 'semana') {
    const dias = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
    return dias.map((label, i) => {
      const fecha = new Date(); fecha.setDate(fecha.getDate() - (6 - i))
      const fechaStr = hoyLocal(fecha)
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
  const { cortes }        = useCortesStore.getState()
  const hoy = getHoy()

  // Only count transactions that happened AFTER the last completed corte today
  const horaUltimoCorte = cortes
    .filter(c => c.fecha === hoy && c.estado === 'cerrado')
    .sort((a, b) => (a.hora > b.hora ? 1 : -1))
    .at(-1)?.hora ?? '00:00'

  const txTurno = transacciones.filter(
    tx => tx.fecha === hoy && (tx.hora ?? '99:99') > horaUltimoCorte
  )

  return txTurno.reduce(
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

// Legacy/demo only. Do not use as source of truth in API mode.
// ── Reporte de coaches con tabulador ─────────────────────────────────────────
/**
 * Calcula clases impartidas, ocupación y pago por coach.
 * @param {'quincena'|'mes'} periodo
 * @param {boolean} incluirPago - false para vista coach
 * @returns {object[]}
 * // [BACKEND] → GET /api/reportes/coaches?periodo=mes
 */
export function getReporteCoaches(periodo = 'mes', incluirPago = true, rangoFecha = null) {
  const { clases }   = useClasesStore.getState()
  const { reservas } = useReservasStore.getState()
  const { coaches }  = useCoachesStore.getState()
  const tabulador    = useTabuladorStore.getState().tabulador

  const hoy    = new Date()
  const hoyISO = getHoy()
  const mes    = getMes()
  let fechaInicio, fechaFin

  if (rangoFecha && rangoFecha.tipo !== 'todos') {
    if (rangoFecha.tipo === 'hoy') {
      fechaInicio = hoyISO; fechaFin = hoyISO
    } else if (rangoFecha.tipo === 'semana') {
      fechaInicio = getSemana(); fechaFin = hoyISO
    } else if (rangoFecha.tipo === 'mes') {
      fechaInicio = `${mes}-01`; fechaFin = hoyISO
    } else if (rangoFecha.tipo === 'fecha') {
      fechaInicio = rangoFecha.fecha; fechaFin = rangoFecha.fecha
    } else if (rangoFecha.tipo === 'rango' && rangoFecha.fechaDesde && rangoFecha.fechaHasta) {
      fechaInicio = rangoFecha.fechaDesde; fechaFin = rangoFecha.fechaHasta
    }
  } else {
    if (periodo === 'quincena') {
      const dia = hoy.getDate()
      fechaInicio = dia <= 15 ? `${mes}-01` : `${mes}-16`
    } else {
      fechaInicio = `${mes}-01`
    }
    fechaFin = hoyISO
  }

  return coaches.filter(c => c.activo).map(coach => {
    const clasesCoach = clases.filter(c => c.coachId === coach.id)

    // Filtrar clases por su fecha real dentro del período (no por fecha de reserva)
    const clasesEnPeriodo = clasesCoach.filter(clase => {
      const f = clase.fecha ?? ''
      if (!f) return true // sin fecha: incluir siempre
      return (!fechaInicio || f >= fechaInicio) && (!fechaFin || f <= fechaFin)
    })

    // Por cada clase del período, calcular ocupación y pago
    const detalleClases = clasesEnPeriodo.map(clase => {
      const asistentes = clase.cupoActual
      const ocupPct    = Math.round((asistentes / clase.cupoMax) * 100)

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
        claseId:   clase.id,
        nombre:    clase.nombre,
        tipo:      clase.tipo,
        fecha:     clase.fecha ?? null,
        dia:       clase.dia,
        hora:      clase.hora,
        asistentes,
        cupoMax:   clase.cupoMax,
        ocupPct,
        pagoClase: incluirPago ? pagoClase : undefined,
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
