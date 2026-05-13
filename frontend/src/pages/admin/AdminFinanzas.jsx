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
import styles from '@/styles/dashboard.module.css'

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

function MiniChart({ serie, color = '#7B1E22' }) {
  if (!serie?.length) return null
  const max = Math.max(...serie.map(s => s.ingresos), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, padding: '0 4px' }}>
      {serie.map((s, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{
            width: '100%',
            background: i === serie.length - 1 ? color : `${color}66`,
            borderRadius: '3px 3px 0 0',
            height: `${Math.max(4, Math.round((s.ingresos / max) * 50))}px`,
            transition: 'height 0.4s ease',
          }} />
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
            {s.label}
          </span>
        </div>
      ))}
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
  const { transacciones }                                            = useTransaccionesStore()
  const { cortes, ejecutarCorte }                                    = useCortesStore()
  const { usuario }                                                  = useAuthStore()
  const { gastos, registrarGasto, getGastosByRango, eliminarGasto } = useGastosStore()

  const [rango, setRango]               = useState('dia')
  const [filtroActivo, setFiltroActivo] = useState(null)
  const [busqueda, setBusqueda]         = useState('')
  const [modalGasto, setModalGasto]     = useState(false)
  const [modalCorte, setModalCorte]     = useState(false)
  const [formCorte, setFormCorte]       = useState({ turno: 'mañana', montoInicial: '' })
  const [tick, setTick]                 = useState(0)
  const [formGasto, setFormGasto]       = useState({ concepto: '', monto: '', tipo: TIPOS_GASTO.OPERATIVO })

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const kpis = useMemo(() => getKpisFinanzas(rango), [transacciones, gastos, rango, tick])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const datosCorte = useMemo(() => getDatosCorteHoy(), [transacciones, tick])

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
    const ahora = new Date()
    const hoy   = ahora.toISOString().split('T')[0]
    const semanaInicio = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const mesActual    = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`

    let lista = [...transacciones]
      .filter(tx => {
        if (rango === 'dia')    return tx.fecha === hoy
        if (rango === 'semana') return tx.fecha >= semanaInicio
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
  }, [transacciones, rango, filtroActivo, busqueda])

  const gastosRango = useMemo(
    () => getGastosByRango(rango),
    [gastos, rango, getGastosByRango]
  )

  const hoy              = new Date().toISOString().split('T')[0]
  const yaHayManana      = cortes.some(c => c.fecha === hoy && c.turno === 'mañana')
  const yaHayNoche       = cortes.some(c => c.fecha === hoy && (c.turno === 'tarde' || c.turno === 'noche'))
  const ambosCompletos   = yaHayManana && yaHayNoche

  const abrirModalCorte = (turno) => {
    setFormCorte({ turno, montoInicial: '' })
    setModalCorte(true)
  }

  const handleConfirmarCorte = () => {
    const montoInicial = parseFloat(formCorte.montoInicial) || 0
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
      montoInicial,
      totalIngresos:      datosCorte.total,
      totalEfectivo:      datosCorte.efectivo,
      totalTarjeta:       datosCorte.tarjeta,
      totalTransferencia: datosCorte.transferencia,
      montoCierre:        montoInicial + datosCorte.efectivo,
      ejecutadoPor:       usuario?.id ?? null,
      estado:             'cerrado',
    })
    setModalCorte(false)
    toast.success(`¡Corte de ${formCorte.turno} realizado!`)
  }

  const handleExportarCortes = (formato) => {
    const datos = [...cortes].reverse().map(c => ({
      Fecha:          c.fecha,
      Día:            c.dia ?? diaDesdefecha(c.fecha),
      Hora:           c.hora ?? '—',
      Turno:          c.turno ? (c.turno.charAt(0).toUpperCase() + c.turno.slice(1)) : '—',
      'Monto inicial': c.montoInicial ?? 0,
      Efectivo:       c.totalEfectivo ?? 0,
      Tarjeta:        c.totalTarjeta ?? 0,
      Transferencia:  c.totalTransferencia ?? 0,
      'Total ingresos': c.totalIngresos ?? 0,
      'Monto cierre': c.montoCierre ?? 0,
      Estado:         c.estado ?? '—',
    }))
    const nombre = `cortes_${hoy}`
    if (formato === 'pdf') {
      abrirReportePDF({ tipo: 'financiero', titulo: 'Cortes de Caja', datos: datos.map(d => ({ ...d, Monto: d['Total ingresos'] })) })
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

  const handleExportar = (formato) => {
    const datos  = getTransaccionesParaExportar(rango)
    const nombre = `finanzas_casascarlatta_${rango}_${hoy}`
    exportarExcelLocal(datos, `${nombre}.xlsx`, 'Finanzas')
  }

  const panel = {
    background: 'var(--neutral-card)', border: '1px solid var(--neutral-border)',
    borderRadius: 12, padding: '20px 24px', marginBottom: 16,
  }
  const labelRango = rango === 'dia' ? 'hoy' : rango === 'semana' ? 'esta semana' : 'este mes'

  return (
    <>
      <div className={inPanel ? undefined : styles.page}>

        {/* Selector de rango */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 4, background: '#1E1014', padding: 4, borderRadius: 8 }}>
            {[{ v: 'dia', l: 'Hoy' }, { v: 'semana', l: 'Semana' }, { v: 'mes', l: 'Mes' }].map(({ v, l }) => (
              <button key={v} onClick={() => setRango(v)} style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13,
                background: rango === v ? '#7B1E22' : 'transparent',
                color:      rango === v ? '#fff' : '#A69A93',
                transition: 'all 0.15s',
              }}>{l}</button>
            ))}
          </div>
        </div>

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
            onClick={() => setFiltroActivo(f => f === 'ingresos' ? null : 'ingresos')}
          />
          <KpiCard
            label="Gastos" valor={`$${kpis.totalGastos.toLocaleString()}`}
            sub={`${gastosRango.length} registros`} color="#ef4444" icono="📉"
            activo={filtroActivo === 'gastos'}
            onClick={() => setFiltroActivo(f => f === 'gastos' ? null : 'gastos')}
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
            <MiniChart serie={kpis.serieHistorica} color="#7B1E22" />
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

        {/* Corte de caja */}
        <div style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>
              Corte de caja — Hoy
            </div>
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: '💵 Efectivo',      val: datosCorte.efectivo      },
              { label: '💳 Tarjeta',       val: datosCorte.tarjeta       },
              { label: '📱 Transferencia', val: datosCorte.transferencia },
              { label: '📊 Total',         val: datosCorte.total, bold: true },
            ].map(({ label, val, bold }) => (
              <div key={label} style={{
                background: '#2C1A1E', borderRadius: 8, padding: '12px 14px',
                border: bold ? '1px solid #7B1E22' : '1px solid #3C2A2E',
              }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: bold ? '#E8A4AD' : 'var(--text-primary)', fontWeight: bold ? 600 : 400 }}>
                  ${(val ?? 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {cortes.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Historial de cortes
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleExportarCortes('excel')} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #22c55e44', background: '#1a472a', color: '#22c55e', fontFamily: 'var(--font-body)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>📊 Excel</button>
                  <button onClick={() => handleExportarCortes('pdf')}   style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #ef444444', background: '#2d1b1b', color: '#ef4444', fontFamily: 'var(--font-body)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>📋 PDF</button>
                </div>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr><th>Fecha</th><th>Día</th><th>Hora</th><th>Turno</th><th>Inicio</th><th>Efectivo</th><th>Tarjeta</th><th>Total</th><th>Cierre</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {[...cortes].reverse().map(c => (
                    <tr key={c.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.fecha}</td>
                      <td style={{ fontSize: 12 }}>{c.dia ?? diaDesdefecha(c.fecha)}</td>
                      <td style={{ fontSize: 12 }}>{c.hora ?? '—'}</td>
                      <td>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: (c.turno === 'tarde' || c.turno === 'noche') ? '#1A1A3A' : '#2A1A1A', color: (c.turno === 'tarde' || c.turno === 'noche') ? '#818CF8' : '#F59E0B' }}>
                          {(c.turno === 'tarde' || c.turno === 'noche') ? '🌙 Tarde' : '☀️ Mañana'}
                        </span>
                      </td>
                      <td>${(c.montoInicial ?? 0).toLocaleString()}</td>
                      <td>${(c.totalEfectivo ?? 0).toLocaleString()}</td>
                      <td>${(c.totalTarjeta ?? 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: '#22c55e' }}>${(c.totalIngresos ?? 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: '#E8A4AD' }}>${(c.montoCierre ?? 0).toLocaleString()}</td>
                      <td><span className={`${styles.badge} ${styles.badgeCompletada}`}>{c.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
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

        {/* Transacciones */}
        <div style={panel}>
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
                onChange={e => setBusqueda(e.target.value)}
              />
              <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={() => handleExportar('csv')}>CSV</button>
              <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={() => handleExportar('excel')}>Excel</button>
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
              ) : txFiltradas.map(tx => (
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
        </div>

      </div>

      {/* Modal corte de caja */}
      {modalCorte && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalCorte(false)}
        >
          <div
            style={{ background: '#1E1014', borderRadius: 16, padding: 32, width: '90%', maxWidth: 400, border: '1px solid #3C2A2E' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, margin: '0 0 6px', color: '#F5EDE8' }}>
              Corte de caja
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', margin: '0 0 24px' }}>
              {formCorte.turno === 'mañana' ? '☀️ Turno mañana' : '🌙 Turno tarde'} — {hoy}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>Turno</label>
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
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>
                  Monto inicial en caja ($)
                </label>
                <input
                  type="number" placeholder="0" value={formCorte.montoInicial} autoFocus
                  onChange={e => setFormCorte(p => ({ ...p, montoInicial: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ background: '#2C1A1E', borderRadius: 8, padding: '12px 14px', border: '1px solid #7B1E22' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A69A93', marginBottom: 4 }}>Monto de cierre</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#E8A4AD' }}>
                  ${((parseFloat(formCorte.montoInicial) || 0) + datosCorte.efectivo).toLocaleString()}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A69A93', marginTop: 4 }}>
                  ${(parseFloat(formCorte.montoInicial) || 0).toLocaleString()} inicial + ${datosCorte.efectivo.toLocaleString()} efectivo registrado hoy
                </div>
              </div>
            </div>
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
