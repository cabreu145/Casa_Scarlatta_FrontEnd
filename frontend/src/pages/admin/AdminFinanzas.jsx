/**
 * AdminFinanzas.jsx — Casa Scarlatta Admin
 * KPIs reactivos, gráfica histórica, desglose por método de pago,
 * alertas inteligentes, corte de caja, registro de gastos,
 * tabla de transacciones con búsqueda y exportación CSV/Excel.
 * ✅ Para conectar backend: edita solo finanzasService.js
 */
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { useTransaccionesStore }       from '@/stores/transaccionesStore'
import { useCortesStore }              from '@/stores/cortesStore'
import { useAuthStore }                from '@/stores/authStore'
import { useGastosStore, TIPOS_GASTO } from '@/stores/gastosStore'
import { getKpisFinanzas, getDatosCorteHoy, getTransaccionesParaExportar } from '@/services/finanzasService'
import { abrirReportePDF } from '@/utils/reportePDF'
import { hoyLocal, mesLocal } from '@/utils/fecha'
import DateNavigator from '@/components/ui/DateNavigator'
import styles from '@/styles/dashboard.module.css'
import FinanzasApiSection from './components/FinanzasApiSection'

const useApiMode = import.meta.env.VITE_USE_API_AUTH === 'true'

const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
function diaDesdefecha(f) { return f ? DIAS_ES[new Date(f + 'T00:00:00').getDay()] ?? '—' : '—' }

const TIPO_GASTO_LABELS = {
  operativo:  'Operativo',
  sueldo:     'Sueldo',
  servicio:   'Servicio',
  insumo:     'Insumo',
  inventario: 'Inventario',
}

const METODO_ICONS = {
  efectivo:      '💵',
  tarjeta:       '💳',
  transferencia: '📱',
}

function exportarExcelLocal(datos, nombre, hoja = 'Reporte') {
  if (!datos.length) { toast.error('Sin datos para exportar'); return }
  const cols = Object.keys(datos[0])
  const ws   = XLSX.utils.json_to_sheet(datos, { header: cols })
  ws['!cols'] = cols.map(col => ({
    wch: Math.min(Math.max(col.length, ...datos.map(r => String(r[col] ?? '').length)) + 2, 40)
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, hoja)
  XLSX.writeFile(wb, nombre)
  toast.success('Excel exportado')
}

function BarraFinanzas({ serie }) {
  const [hovIdx, setHovIdx] = useState(null)
  if (!serie?.length) return null
  const max = Math.max(...serie.map(s => s.ingresos), 1)

  return (
    <div style={{
      display:    'flex',
      alignItems: 'flex-end',
      gap:        6,
      height:     120,
      paddingTop: 24,
      position:   'relative',
    }}>
      {serie.map((s, i) => {
        const pct   = Math.max(6, Math.round((s.ingresos / max) * 100))
        const hov   = hovIdx === i
        const ratio = s.ingresos / max
        const color = ratio >= 0.75 ? '#22C55E'
          : ratio >= 0.40           ? '#3B82F6'
          : s.ingresos === 0        ? '#3C2A2E'
          :                           '#EF4444'

        return (
          <div
            key={i}
            style={{
              flex:           1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            4,
              height:         '100%',
              justifyContent: 'flex-end',
              position:       'relative',
              cursor:         'pointer',
            }}
            onMouseEnter={() => setHovIdx(i)}
            onMouseLeave={() => setHovIdx(null)}
          >
            {hov && s.ingresos > 0 && (
              <div style={{
                position:     'absolute',
                bottom:       `calc(${pct}% + 28px)`,
                left:         '50%',
                transform:    'translateX(-50%)',
                background:   '#1E1014',
                border:       '1px solid rgba(232,164,173,0.3)',
                borderRadius: 6,
                padding:      '4px 8px',
                whiteSpace:   'nowrap',
                zIndex:       10,
                fontFamily:   'var(--font-body)',
                fontSize:     11,
                color:        '#E8A4AD',
                fontWeight:   600,
              }}>
                ${s.ingresos.toLocaleString()}
              </div>
            )}
            <div style={{
              width:           '100%',
              height:          `${pct}%`,
              background:      color,
              borderRadius:    '3px 3px 0 0',
              opacity:         hov ? 1 : 0.75,
              transform:       hov ? 'scaleY(1.04)' : 'none',
              transformOrigin: 'bottom',
              transition:      'all 0.15s',
            }} />
            <span style={{
              fontSize:   9,
              color:      'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}>
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function KpiCard({ label, valor, sub, crecimiento, color, icono, onClick, activo }) {
  const signo  = crecimiento > 0 ? '+' : ''
  const colorC = crecimiento > 0 ? '#22c55e' : crecimiento < 0 ? '#ef4444' : '#94a3b8'
  return (
    <div
      onClick={onClick}
      style={{
        background:   activo ? 'rgba(123,30,34,0.15)' : 'var(--neutral-card)',
        border:       activo ? '1px solid #7B1E22' : '1px solid var(--neutral-border)',
        borderRadius: 12, padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          {label}
        </div>
        {icono && <span style={{ fontSize: 18, opacity: 0.7 }}>{icono}</span>}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: color || 'var(--text-primary)', lineHeight: 1, marginBottom: 8 }}>
        {valor}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{sub}</span>
        {crecimiento !== null && crecimiento !== undefined && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: colorC, fontWeight: 600 }}>
            {signo}{crecimiento}% vs anterior
          </span>
        )}
      </div>
      {activo && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#7B1E22' }} />}
    </div>
  )
}

function Alerta({ tipo, mensaje }) {
  const colores = {
    warning: { bg: 'rgba(234,179,8,0.1)',  border: '#eab308', text: '#eab308', icono: '⚠️' },
    danger:  { bg: 'rgba(239,68,68,0.1)',  border: '#ef4444', text: '#ef4444', icono: '🔴' },
    info:    { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', text: '#3b82f6', icono: 'ℹ️' },
  }
  const c = colores[tipo] ?? colores.info
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 16 }}>{c.icono}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: c.text }}>{mensaje}</span>
    </div>
  )
}

export function FinanzasSection({ inPanel = false }) {
  if (useApiMode) {
    return <FinanzasApiSection inPanel={inPanel} />
  }

  const { transacciones }                                            = useTransaccionesStore()
  const { cortes, ejecutarCorte }                                    = useCortesStore()
  const { usuario }                                                  = useAuthStore()
  const { gastos, registrarGasto, getGastosByRango, eliminarGasto } = useGastosStore()

  const [rango, setRango]               = useState('dia')
  const [fechaFin, setFechaFin]         = useState(null)
  const [fechaDesde, setFechaDesde]     = useState(null)
  const [fechaHasta, setFechaHasta]     = useState(null)
  const [filtroActivo, setFiltroActivo] = useState(null)
  const [busqueda, setBusqueda]         = useState('')
  const [modalGasto, setModalGasto]     = useState(false)
  const [modalCorte, setModalCorte]     = useState(false)
  const [formCorte, setFormCorte]       = useState({ turno: 'mañana', montoInicial: '' })
  const [tick, setTick]                 = useState(0)
  const [formGasto, setFormGasto]       = useState({ concepto: '', monto: '', tipo: TIPOS_GASTO.OPERATIVO })
  const [filtroCortes, setFiltroCortes] = useState('todo')
  const [cortesPageDate, setCortesPageDate] = useState(() => hoyLocal())
  const [txExpandidas, setTxExpandidas]     = useState(false)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const kpis = useMemo(
    () => getKpisFinanzas(rango, fechaFin, { fechaDesde, fechaHasta }),
    [transacciones, gastos, rango, fechaFin, fechaDesde, fechaHasta, tick]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const datosCorte = useMemo(() => getDatosCorteHoy(), [transacciones, cortes, tick])

  const gastosHoy = useMemo(() => {
    const today = hoyLocal()
    const horaUltimoCorte = [...cortes]
      .filter(c => c.fecha === today && c.estado === 'cerrado')
      .sort((a, b) => (a.hora > b.hora ? 1 : -1))
      .at(-1)?.hora ?? '00:00'
    return gastos.filter(g => g.fecha === today && (g.hora ?? '99:99') > horaUltimoCorte)
  }, [gastos, cortes, tick])

  const totalGastosHoy = useMemo(
    () => gastosHoy.reduce((a, g) => a + g.monto, 0),
    [gastosHoy]
  )

  const cortesFiltrados = useMemo(() => {
    const hoyStr = hoyLocal()
    if (fechaFin) {
      return [...cortes].reverse().filter(c => c.fecha === fechaFin)
    }
    const todos = [...cortes].reverse().filter(c => c.fecha <= hoyStr)
    if (filtroCortes === 'todo') return todos
    if (filtroCortes === 'hoy')    return todos.filter(c => c.fecha === hoyStr)
    if (filtroCortes === 'semana') {
      const hace7 = hoyLocal(new Date(Date.now() - 7 * 86400000))
      return todos.filter(c => c.fecha >= hace7)
    }
    if (filtroCortes === 'mes') {
      const mes = mesLocal()
      return todos.filter(c => c.fecha?.startsWith(mes))
    }
    return todos
  }, [cortes, filtroCortes, fechaFin])

  const alertas = useMemo(() => {
    const lista = []
    if (kpis.crecimiento !== null && kpis.crecimiento < -10)
      lista.push({ tipo: 'danger',  mensaje: `Ingresos bajaron ${Math.abs(kpis.crecimiento)}% vs el período anterior` })
    if (kpis.totalGastos > kpis.totalIngresos * 0.8)
      lista.push({ tipo: 'warning', mensaje: 'Los gastos superan el 80% de los ingresos del período' })
    if (kpis.utilidad < 0)
      lista.push({ tipo: 'danger',  mensaje: `Utilidad negativa: -$${Math.abs(kpis.utilidad).toLocaleString()}` })
    return lista
  }, [kpis])

  const txFiltradas = useMemo(() => {
    const hoy          = hoyLocal()
    const semanaInicio = hoyLocal(new Date(Date.now() - 7 * 86400000))
    const mesActual    = mesLocal()

    let lista = [...transacciones]
      .filter(tx => {
        if (rango === 'fecha')  return fechaFin ? tx.fecha === fechaFin : tx.fecha === hoy
        if (rango === 'todos')  return true
        if (rango === 'dia')    return tx.fecha === hoy
        if (rango === 'semana') return tx.fecha >= semanaInicio
        if (rango === 'rango')  return fechaDesde && fechaHasta ? tx.fecha >= fechaDesde && tx.fecha <= fechaHasta : false
        return tx.fecha?.slice(0, 7) === mesActual
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    if (filtroActivo === 'ingresos') lista = lista.filter(tx => tx.monto > 0)
    if (filtroActivo === 'gastos')   lista = lista.filter(tx => tx.monto < 0)

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      lista = lista.filter(tx =>
        tx.concepto?.toLowerCase().includes(q) ||
        tx.tipo?.toLowerCase().includes(q) ||
        (tx.metodoPago ?? '').toLowerCase().includes(q)
      )
    }
    return lista
  }, [transacciones, rango, filtroActivo, busqueda, fechaFin, fechaDesde, fechaHasta])

  const gastosRango = useMemo(() => {
    if (rango === 'fecha' && fechaFin) return gastos.filter(g => g.fecha === fechaFin)
    if (rango === 'todos') return [...gastos]
    if (rango === 'rango' && fechaDesde && fechaHasta) {
      return gastos.filter(g => g.fecha >= fechaDesde && g.fecha <= fechaHasta)
    }
    return getGastosByRango(rango)
  }, [gastos, rango, fechaFin, fechaDesde, fechaHasta, getGastosByRango])

  const hoy              = hoyLocal()
  const fechaCorteActiva = fechaFin ?? hoy
  const esFechaFutura    = fechaCorteActiva > hoy
  const puedeHacerCorte  = !fechaFin || fechaFin === hoy

  const datosCorteActivos = useMemo(() => {
    if (esFechaFutura) return { efectivo: 0, tarjeta: 0, transferencia: 0, total: 0 }
    if (fechaFin) {
      const txFecha = transacciones.filter(tx => tx.fecha === fechaFin && tx.monto > 0)
      return txFecha.reduce(
        (acc, tx) => {
          const m = tx.metodoPago ?? 'efectivo'
          acc[m]    = (acc[m] ?? 0) + tx.monto
          acc.total = (acc.total ?? 0) + tx.monto
          return acc
        },
        { efectivo: 0, tarjeta: 0, transferencia: 0, total: 0 }
      )
    }
    return datosCorte
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transacciones, fechaFin, datosCorte, esFechaFutura])

  const yaHayManana    = cortes.some(c => c.fecha === hoy && c.turno === 'mañana')
  const yaHayNoche     = cortes.some(c => c.fecha === hoy && (c.turno === 'tarde' || c.turno === 'noche'))
  const montoInicial   = parseFloat(formCorte.montoInicial) || 0

  const abrirModalCorte = (turno) => {
    setFormCorte({ turno, montoInicial: '' })
    setModalCorte(true)
  }

  const handleConfirmarCorte = () => {
    const monto = parseFloat(formCorte.montoInicial) || 0
    const now  = new Date()
    const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
    const mes  = now.toLocaleString('es-MX', { month: 'long' })
    ejecutarCorte({
      fecha:              hoy,
      dia:                diaDesdefecha(hoy),
      hora,
      turno:              formCorte.turno,
      periodo:            `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${now.getFullYear()}`,
      tipo:               'diario',
      montoInicial:       monto,
      totalIngresos:      datosCorte.total,
      totalEfectivo:      datosCorte.efectivo,
      totalTarjeta:       datosCorte.tarjeta,
      totalTransferencia: datosCorte.transferencia,
      totalGastos:        totalGastosHoy,
      neto:           datosCorte.efectivo - totalGastosHoy,
      aEntregar:      Math.max(0, datosCorte.efectivo - totalGastosHoy),
      fondoSiguiente: monto,
      montoCierre:    monto + datosCorte.efectivo,
      ejecutadoPor:       usuario?.id ?? null,
      estado:             'cerrado',
    })
    setModalCorte(false)
    toast.success(`¡Corte de ${formCorte.turno} realizado!`)
  }

  const handleExportarCortes = (formato) => {
    const datos = cortesFiltrados.map(c => ({
      Fecha:              c.fecha,
      Día:                c.dia ?? diaDesdefecha(c.fecha),
      Hora:               c.hora ?? '—',
      Turno:              c.turno ? (c.turno.charAt(0).toUpperCase() + c.turno.slice(1)) : '—',
      'Fondo inicial':    c.montoInicial ?? 0,
      Efectivo:           c.totalEfectivo ?? 0,
      Tarjeta:            c.totalTarjeta ?? 0,
      Transferencia:      c.totalTransferencia ?? 0,
      'Total ingresos':   c.totalIngresos ?? 0,
      Gastos:             c.totalGastos != null ? -c.totalGastos : 0,
      Neto:               c.neto ?? (c.totalIngresos ?? 0),
      'Monto cierre':     c.montoCierre ?? 0,
      Estado:             c.estado ?? '—',
    }))
    const periodoLabel = { hoy: 'hoy', semana: '7dias', mes: 'mes', todo: 'historico' }[filtroCortes] ?? filtroCortes
    const nombre = `cortes_${periodoLabel}_${hoy}`
    if (formato === 'pdf') {
      abrirReportePDF({ tipo: 'cortes', titulo: `Cortes de Caja — ${periodoLabel}`, datos, landscape: true })
    } else {
      exportarExcelLocal(datos, `${nombre}.xlsx`, 'Cortes')
    }
  }

  const handleGuardarGasto = () => {
    if (!formGasto.concepto.trim() || !formGasto.monto) {
      toast.error('Completa concepto y monto'); return
    }
    registrarGasto({
      concepto: formGasto.concepto.trim(),
      monto:    parseFloat(formGasto.monto),
      tipo:     formGasto.tipo,
      adminId:  usuario?.id ?? null,
    })
    toast.success('Gasto registrado')
    setModalGasto(false)
    setFormGasto({ concepto: '', monto: '', tipo: TIPOS_GASTO.OPERATIVO })
  }

  const handleExportar = () => {
    const datos  = getTransaccionesParaExportar(rango)
    const nombre = `finanzas_casascarlatta_${rango}_${hoy}`
    exportarExcelLocal(datos, `${nombre}.xlsx`, 'Finanzas')
  }

  const TX_VISIBLES = 5
  const txVisibles  = txExpandidas ? txFiltradas : txFiltradas.slice(0, TX_VISIBLES)
  const hayMasTx    = txFiltradas.length > TX_VISIBLES

  const panel = {
    background: 'var(--neutral-card)', border: '1px solid var(--neutral-border)',
    borderRadius: 12, padding: '20px 24px', marginBottom: 16,
  }
  const labelRango = rango === 'rango' && fechaDesde && fechaHasta
    ? `${fechaDesde} al ${fechaHasta}`
    : rango === 'fecha' && fechaFin ? fechaFin
    : rango === 'todos'  ? 'todo el historial'
    : rango === 'dia'    ? 'hoy'
    : rango === 'semana' ? 'esta semana'
    : 'este mes'

  return (
    <>
      <div className={inPanel ? undefined : styles.page}>

        {/* Selector de rango */}
        <DateNavigator
          modo="libre"
          darkMode={true}
          inicial="hoy"
          onChange={(r) => {
            const mapa = { hoy: 'dia', semana: 'semana', mes: 'mes', todos: 'todos', fecha: 'fecha', rango: 'rango' }
            setRango(mapa[r.tipo] ?? 'dia')
            setFechaFin(r.fecha ?? null)
            setFechaDesde(r.fechaDesde ?? null)
            setFechaHasta(r.fechaHasta ?? null)
            setTxExpandidas(false)
          }}
        />

        {/* Alertas */}
        {alertas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {alertas.map((a, i) => <Alerta key={i} {...a} />)}
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <KpiCard
            label={`Ingresos — ${labelRango}`}
            valor={`$${kpis.totalIngresos.toLocaleString()}`}
            sub={`${kpis.numTransacciones} transacciones`}
            crecimiento={kpis.crecimiento} color="#22c55e" icono="💹"
            activo={filtroActivo === 'ingresos'}
            onClick={() => { setFiltroActivo(f => f === 'ingresos' ? null : 'ingresos'); setTxExpandidas(false) }}
          />
          <KpiCard
            label="Gastos" valor={`$${kpis.totalGastos.toLocaleString()}`}
            sub={`${gastosRango.length} registros`} color="#ef4444" icono="📉"
            activo={filtroActivo === 'gastos'}
            onClick={() => { setFiltroActivo(f => f === 'gastos' ? null : 'gastos'); setTxExpandidas(false) }}
          />
          <KpiCard
            label="Utilidad neta"
            valor={`${kpis.utilidad < 0 ? '-' : ''}$${Math.abs(kpis.utilidad).toLocaleString()}`}
            sub="Ingresos − Gastos"
            color={kpis.utilidad >= 0 ? '#22c55e' : '#ef4444'} icono="📊"
          />
          <KpiCard
            label="Ticket promedio" valor={`$${kpis.ticketPromedio.toLocaleString()}`}
            sub="Por transacción" color="var(--text-primary)" icono="🎟️"
          />
        </div>

        {/* Gráfica + Método de pago */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-secondary)' }}>
                Ingresos históricos
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#22c55e' }}>
                ${kpis.totalIngresos.toLocaleString()} total
              </span>
            </div>
            <BarraFinanzas serie={kpis.serieHistorica} />
          </div>

          <div style={panel}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Método de pago — {labelRango}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(kpis.desglosePago).map(([metodo, monto]) => {
                const pct = Math.round((monto / (kpis.totalIngresos || 1)) * 100)
                return (
                  <div key={metodo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {METODO_ICONS[metodo]} {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        ${monto.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--neutral-border)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#7B1E22', borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Desglose por categoría */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          {Object.entries(kpis.desgloseCat).map(([cat, monto]) => (
            <div key={cat} style={{ ...panel, marginBottom: 0, padding: '14px 18px' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                {cat === 'paquetes' ? '📦 Paquetes' : '🛒 Productos'}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)' }}>
                ${monto.toLocaleString()}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {kpis.totalIngresos > 0 ? Math.round((monto / kpis.totalIngresos) * 100) : 0}% del total
              </div>
            </div>
          ))}
        </div>

        {/* Transacciones */}
        <div style={panel} data-section="transacciones">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>
              Transacciones
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                ({txFiltradas.length} registros)
              </span>
              {filtroActivo && (
                <button onClick={() => setFiltroActivo(null)} style={{
                  marginLeft: 10, fontSize: 11, fontFamily: 'var(--font-body)',
                  background: '#7B1E2233', border: '1px solid #7B1E22', color: '#E8A4AD',
                  borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
                }}>
                  Filtro: {filtroActivo} ×
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                className={styles.searchInput} style={{ width: 180 }}
                type="text" placeholder="Buscar..." value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setTxExpandidas(false) }}
              />
              <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={handleExportar}>CSV</button>
              <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={handleExportar}>Excel</button>
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr><th>Fecha</th><th>Concepto</th><th>Tipo</th><th>Método</th><th>Total</th></tr>
            </thead>
            <tbody>
              {txFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                    Sin transacciones en este período
                  </td>
                </tr>
              ) : txVisibles.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tx.fecha}</td>
                  <td style={{ fontWeight: 500 }}>{tx.concepto}</td>
                  <td>
                    <span className={`${styles.badge} ${tx.tipo === 'paquete' ? styles.badgeSlow : styles.badgeCompletada}`}>
                      {tx.tipo}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeConfirmada}`}>
                      {METODO_ICONS[tx.metodoPago ?? 'efectivo']} {tx.metodoPago ?? 'efectivo'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: tx.monto < 0 ? '#ef4444' : '#22c55e' }}>
                    {tx.monto < 0 ? '-' : ''}${Math.abs(tx.monto ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hayMasTx && (
            <button
              onClick={() => setTxExpandidas(v => !v)}
              style={{
                width: '100%', marginTop: 12, padding: '9px 0',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background  = 'rgba(123,31,46,0.15)'
                e.currentTarget.style.color       = '#E8A4AD'
                e.currentTarget.style.borderColor = 'rgba(123,31,46,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.color       = 'rgba(255,255,255,0.5)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >
              {txExpandidas ? `▲ Ver menos` : `▼ Ver ${txFiltradas.length - TX_VISIBLES} más`}
            </button>
          )}
        </div>

        {/* Gastos */}
        <div style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>
              Gastos — {labelRango}
            </div>
            <button onClick={() => setModalGasto(true)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13, background: '#7B1E22', color: '#fff',
            }}>
              + Registrar gasto
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Ingresos', val: kpis.totalIngresos,  color: '#22c55e' },
              { label: 'Gastos',   val: -kpis.totalGastos,   color: '#ef4444' },
              { label: 'Utilidad', val: kpis.utilidad, color: kpis.utilidad >= 0 ? '#22c55e' : '#ef4444', bold: true },
            ].map(({ label, val, color, bold }) => (
              <div key={label} style={{ flex: '1 1 140px', background: '#1E1014', borderRadius: 10, padding: '12px 16px', border: `1px solid ${color}33` }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: bold ? 22 : 18, color }}>
                  {val < 0 ? '-' : ''}${Math.abs(val).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {gastosRango.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
              Sin gastos en este período
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr><th>Fecha</th><th>Concepto</th><th>Tipo</th><th>Monto</th><th></th></tr>
              </thead>
              <tbody>
                {gastosRango.map(g => (
                  <tr key={g.id}>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{g.fecha}</td>
                    <td style={{ fontWeight: 500 }}>{g.concepto}</td>
                    <td><span className={`${styles.badge} ${styles.badgeSlow}`}>{TIPO_GASTO_LABELS[g.tipo] ?? g.tipo}</span></td>
                    <td style={{ fontWeight: 600, color: '#ef4444' }}>−${g.monto.toLocaleString()}</td>
                    <td>
                      <button onClick={() => eliminarGasto(g.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Corte de caja */}
        <div style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>
              Corte de caja — {fechaCorteActiva}
            </div>
            {puedeHacerCorte && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => abrirModalCorte('mañana')} disabled={yaHayManana} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  cursor: yaHayManana ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  background: yaHayManana ? '#2C1A1E' : '#7B1E22',
                  color: yaHayManana ? '#A69A93' : '#fff', opacity: yaHayManana ? 0.7 : 1,
                }}>
                  {yaHayManana ? '✓ Mañana' : '☀️ Turno mañana'}
                </button>
                <button onClick={() => abrirModalCorte('tarde')} disabled={yaHayNoche} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  cursor: yaHayNoche ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  background: yaHayNoche ? '#2C1A1E' : '#4A1A3A',
                  color: yaHayNoche ? '#A69A93' : '#fff', opacity: yaHayNoche ? 0.7 : 1,
                }}>
                  {yaHayNoche ? '✓ Tarde' : '🌙 Turno tarde'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: '💵 Efectivo',        val: datosCorteActivos.efectivo,                        color: 'var(--text-primary)' },
              { label: '💳 Tarjeta',         val: datosCorteActivos.tarjeta,                         color: 'var(--text-primary)' },
              { label: '📱 Transferencia',   val: datosCorteActivos.transferencia,                   color: 'var(--text-primary)' },
              { label: '📊 Total ingresos',  val: datosCorteActivos.total,                           color: '#22c55e', border: '#22c55e44' },
              { label: '📉 Gastos del día',  val: totalGastosHoy,                                    color: '#ef4444', border: '#ef444444', neg: true },
              { label: '💰 Neto a entregar', val: datosCorteActivos.efectivo - totalGastosHoy,       color: '#E8A4AD', border: '#7B1E22',   bold: true },
            ].map(({ label, val, color, border, bold, neg }) => (
              <div key={label} style={{
                background: '#2C1A1E', borderRadius: 8, padding: '12px 14px',
                border: `1px solid ${border ?? '#3C2A2E'}`,
              }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color, fontWeight: bold ? 600 : 400 }}>
                  {neg && (val ?? 0) > 0 ? '−' : ''}${(val ?? 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {cortes.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Historial de cortes
                  </div>
                  <div style={{ display: 'flex', gap: 2, background: '#1E1014', padding: 3, borderRadius: 6 }}>
                    {[{ v: 'hoy', l: 'Hoy' }, { v: 'semana', l: '7 días' }, { v: 'mes', l: 'Mes' }, { v: 'todo', l: 'Todo' }].map(({ v, l }) => (
                      <button key={v} onClick={() => setFiltroCortes(v)} style={{
                        padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', fontSize: 11,
                        background: filtroCortes === v ? '#7B1E22' : 'transparent',
                        color: filtroCortes === v ? '#fff' : '#A69A93',
                      }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleExportarCortes('excel')} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #22c55e44', background: '#1a472a', color: '#22c55e', fontFamily: 'var(--font-body)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>📊 Excel</button>
                  <button onClick={() => handleExportarCortes('pdf')}   style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #ef444444', background: '#2d1b1b', color: '#ef4444', fontFamily: 'var(--font-body)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>📋 PDF</button>
                </div>
              </div>

              {cortesFiltrados.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  Sin cortes en este período
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cortesFiltrados.map(c => {
                    const esTarde = c.turno === 'tarde' || c.turno === 'noche'
                    const neto    = c.neto ?? (c.totalEfectivo ?? 0) - (c.totalGastos ?? 0)
                    const aEntregar = c.aEntregar ?? Math.max(0, neto)
                    return (
                      <div key={c.id} style={{
                        borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
                        background: '#1E1014', overflow: 'hidden',
                      }}>
                        {/* Header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 16px', background: 'rgba(255,255,255,0.03)',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#F5EDE8' }}>
                              {c.fecha} — {c.dia ?? diaDesdefecha(c.fecha)}
                            </span>
                            <span style={{ fontSize: 11, color: '#A69A93' }}>{c.hora ?? ''}</span>
                            <span style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 10,
                              background: esTarde ? '#1A1A3A' : '#2A1A1A',
                              color:      esTarde ? '#818CF8' : '#F59E0B',
                            }}>
                              {esTarde ? '🌙 Tarde' : '☀️ Mañana'}
                            </span>
                          </div>
                          <span className={`${styles.badge} ${styles.badgeCompletada}`} style={{ fontSize: 11 }}>
                            {c.estado}
                          </span>
                        </div>

                        {/* 3 columnas */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>

                          {/* Col 1 — Ingresos */}
                          <div style={{ padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#6B5A55', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ingresos del turno</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {[
                                { label: 'Total ingresos', val: c.totalIngresos ?? 0, color: '#22c55e', bold: true },
                                { label: 'Efectivo',       val: c.totalEfectivo ?? 0, color: '#A3E635' },
                                { label: 'Tarjeta',        val: c.totalTarjeta ?? 0,  color: '#60A5FA' },
                                { label: 'Transferencia',  val: c.totalTransferencia ?? 0, color: '#A78BFA' },
                              ].map(({ label, val, color, bold }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>{label}</span>
                                  <span style={{ fontFamily: 'var(--font-body)', fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 500, color }}>
                                    ${val.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Col 2 — Gastos y resultado */}
                          <div style={{ padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#6B5A55', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gastos y resultado</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {[
                                { label: 'Gastos',  val: -(c.totalGastos ?? 0), color: '#ef4444' },
                                { label: 'Neto',    val: neto,                   color: neto >= 0 ? '#22c55e' : '#ef4444', bold: true },
                              ].map(({ label, val, color, bold }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>{label}</span>
                                  <span style={{ fontFamily: 'var(--font-body)', fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 500, color }}>
                                    {val < 0 ? '−' : ''}${Math.abs(val).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                              <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>A entregar</span>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#F59E0B', fontWeight: 700 }}>${aEntregar.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Col 3 — Caja física */}
                          <div style={{ padding: '12px 16px' }}>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#6B5A55', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Caja física</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {[
                                { label: 'Fondo inicial',   val: c.montoInicial ?? 0,  color: '#A69A93' },
                                { label: 'Fondo siguiente', val: c.fondoSiguiente ?? c.montoInicial ?? 0, color: '#60A5FA' },
                                { label: 'Cierre de caja',  val: c.montoCierre ?? 0,   color: '#E8A4AD', bold: true },
                              ].map(({ label, val, color, bold }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>{label}</span>
                                  <span style={{ fontFamily: 'var(--font-body)', fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 500, color }}>
                                    ${val.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Modal corte de caja */}
      {modalCorte && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalCorte(false)}
        >
          <div
            style={{ background: '#1E1014', borderRadius: 16, padding: 32, width: '90%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', border: '1px solid #3C2A2E' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, margin: '0 0 4px', color: '#F5EDE8' }}>
              Corte de caja
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', margin: '0 0 20px' }}>
              {formCorte.turno === 'mañana' ? '☀️ Turno mañana' : '🌙 Turno tarde'} · {hoy}
            </p>

            {/* Selector de turno */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['mañana', 'tarde'].map(t => (
                  <button key={t} onClick={() => setFormCorte(p => ({ ...p, turno: t }))} style={{
                    flex: 1, padding: '10px 0', borderRadius: 8,
                    border: `1px solid ${formCorte.turno === t ? '#7B1E22' : '#3C2A2E'}`,
                    background: formCorte.turno === t ? '#7B1E22' : '#2C1A1E',
                    color: formCorte.turno === t ? '#fff' : '#A69A93',
                    fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer',
                  }}>
                    {t === 'mañana' ? '☀️ Mañana' : '🌙 Tarde'}
                  </button>
                ))}
              </div>
            </div>

            {/* Fondo de cambio */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 14, color: '#F5EDE8', marginBottom: 4, fontWeight: 500 }}>
                ¿Cuánto dinero pusiste en caja para dar cambio?
              </label>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#6B5A55', margin: '0 0 10px', lineHeight: 1.5 }}>
                Solo el efectivo inicial del turno. No incluyas ventas.
              </p>
              <input
                type="number" placeholder="1000" value={formCorte.montoInicial} autoFocus
                onChange={e => setFormCorte(p => ({ ...p, montoInicial: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            {/* Resumen en 3 grupos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Grupo A — Ingresos del turno */}
              <div style={{ background: '#2C1A1E', borderRadius: 8, padding: '12px 14px', border: '1px solid #3C2A2E' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#6B5A55', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Ingresos del turno
                </div>
                {[
                  { label: '💵 Efectivo cobrado', val: datosCorte.efectivo },
                  { label: '💳 Tarjeta cobrada',  val: datosCorte.tarjeta },
                  { label: '📱 Transferencia',    val: datosCorte.transferencia },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)' }}>${(val ?? 0).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #3C2A2E', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>📊 Total ingresos</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#22c55e', fontWeight: 700 }}>${datosCorte.total.toLocaleString()} ✓</span>
                </div>
              </div>

              {/* Grupo B — Gastos y resultado */}
              <div style={{ background: '#2C1A1E', borderRadius: 8, padding: '12px 14px', border: '1px solid #3C2A2E' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#6B5A55', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Gastos y resultado
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>📉 Gastos del turno</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ef4444' }}>−${totalGastosHoy.toLocaleString()}</span>
                </div>
                <div style={{ borderTop: '1px solid #3C2A2E', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>💼 Neto (ingresos − gastos)</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#E8A4AD', fontWeight: 700 }}>
                    {datosCorte.total - totalGastosHoy < 0 ? '−' : ''}${Math.abs(datosCorte.total - totalGastosHoy).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Grupo C — Caja física */}
              <div style={{ background: '#2C1A1E', borderRadius: 8, padding: '12px 14px', border: '1px solid #3C2A2E' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#6B5A55', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Caja física
                </div>
                {[
                  { label: '🏦 Fondo inicial',  val: montoInicial },
                  { label: '+ Efectivo cobrado', val: datosCorte.efectivo },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)' }}>${(val ?? 0).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #3C2A2E', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>💰 Total físico en caja</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#E8A4AD', fontWeight: 700 }}>${(montoInicial + datosCorte.efectivo).toLocaleString()}</span>
                </div>
              </div>

              {/* Resaltado final — A entregar */}
              <div style={{ background: '#2A1E0A', borderRadius: 8, padding: '14px 16px', border: '1px solid #F59E0B44' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🏧 A entregar al cierre
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#6B5A55', marginTop: 2 }}>
                      = Efectivo cobrado − Gastos
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: '#F59E0B', fontWeight: 700 }}>
                    ${Math.max(0, datosCorte.efectivo - totalGastosHoy).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
              <button onClick={handleConfirmarCorte}
                style={{ padding: 14, borderRadius: 8, border: 'none', background: '#7B1E22', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, cursor: 'pointer' }}>
                Confirmar corte
              </button>
              <button onClick={() => setModalCorte(false)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #3C2A2E', background: 'transparent', color: '#A69A93', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal gasto */}
      {modalGasto && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalGasto(false)}
        >
          <div
            style={{ background: '#1E1014', borderRadius: 16, padding: 32, width: '90%', maxWidth: 420, border: '1px solid #3C2A2E' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, margin: '0 0 24px' }}>
              Registrar gasto
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Concepto', type: 'text',   key: 'concepto', placeholder: 'Ej. Pago de luz, Sueldo coach...' },
                { label: 'Monto ($)', type: 'number', key: 'monto',    placeholder: '0' },
              ].map(({ label, type, key, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>{label}</label>
                  <input
                    type={type} placeholder={placeholder} value={formGasto[key]}
                    onChange={e => setFormGasto(p => ({ ...p, [key]: e.target.value }))}
                    autoFocus={key === 'concepto'}
                    style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>Tipo</label>
                <select
                  value={formGasto.tipo}
                  onChange={e => setFormGasto(p => ({ ...p, tipo: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, boxSizing: 'border-box' }}
                >
                  {Object.entries(TIPOS_GASTO).map(([, val]) => (
                    <option key={val} value={val}>{TIPO_GASTO_LABELS[val]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
              <button onClick={handleGuardarGasto}
                style={{ padding: 14, borderRadius: 8, border: 'none', background: '#7B1E22', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, cursor: 'pointer' }}>
                Guardar gasto
              </button>
              <button onClick={() => setModalGasto(false)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #3C2A2E', background: 'transparent', color: '#A69A93', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default function AdminFinanzas() {
  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>
        <FinanzasSection />
      </div>
    </DashboardLayout>
  )
}
