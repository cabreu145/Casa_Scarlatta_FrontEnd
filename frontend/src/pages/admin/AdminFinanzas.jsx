/**
 * AdminFinanzas.jsx — Casa Scarlatta Admin
 * KPIs reactivos, gráfica histórica, desglose por método de pago,
 * alertas inteligentes, corte de caja, registro de gastos,
 * tabla de transacciones con búsqueda y exportación CSV/Excel.
 * ✅ Para conectar backend: edita solo finanzasService.js
 */
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { useTransaccionesStore }       from '@/stores/transaccionesStore'
import { useCortesStore }              from '@/stores/cortesStore'
import { useAuthStore }                from '@/stores/authStore'
import { useGastosStore, TIPOS_GASTO } from '@/stores/gastosStore'
import { getKpisFinanzas, getDatosCorteHoy, getTransaccionesParaExportar } from '@/services/finanzasService'
import styles from '@/styles/dashboard.module.css'

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

function exportarCSV(datos, nombre) {
  if (!datos.length) { toast.error('Sin datos para exportar'); return }
  const headers = Object.keys(datos[0])
  const rows    = datos.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))
  const csv     = [headers.join(','), ...rows].join('\n')
  const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url     = URL.createObjectURL(blob)
  const a       = document.createElement('a')
  a.href = url; a.download = nombre; a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV exportado')
}

async function exportarExcel(datos, nombre) {
  if (!datos.length) { toast.error('Sin datos para exportar'); return }
  try {
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs').catch(() => null)
    if (!XLSX) { exportarCSV(datos, nombre.replace('.xlsx', '.csv')); return }
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Finanzas')
    XLSX.writeFile(wb, nombre)
    toast.success('Excel exportado')
  } catch {
    exportarCSV(datos, nombre.replace('.xlsx', '.csv'))
  }
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

  const hoy           = new Date().toISOString().split('T')[0]
  const yaHayCorteHoy = cortes.some(c => c.fecha === hoy)

  const handleCerrarDia = () => {
    const now = new Date()
    const mes = now.toLocaleString('es-MX', { month: 'long' })
    ejecutarCorte({
      fecha:              hoy,
      periodo:            `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${now.getFullYear()}`,
      tipo:               'diario',
      totalIngresos:      datosCorte.total,
      totalEfectivo:      datosCorte.efectivo,
      totalTarjeta:       datosCorte.tarjeta,
      totalTransferencia: datosCorte.transferencia,
      ejecutadoPor:       usuario?.id ?? null,
      estado:             'cerrado',
    })
    toast.success('¡Corte de caja realizado!')
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
    if (formato === 'excel') exportarExcel(datos, `${nombre}.xlsx`)
    else exportarCSV(datos, `${nombre}.csv`)
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>
              Corte de caja — Hoy
            </div>
            <button onClick={handleCerrarDia} disabled={yaHayCorteHoy} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              cursor: yaHayCorteHoy ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13,
              background: yaHayCorteHoy ? '#2C1A1E' : '#7B1E22',
              color:      yaHayCorteHoy ? '#A69A93' : '#fff',
              opacity:    yaHayCorteHoy ? 0.7 : 1,
            }}>
              {yaHayCorteHoy ? '✓ Realizado' : '🔒 Cerrar día'}
            </button>
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
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cortes anteriores
              </div>
              <table className={styles.table}>
                <thead>
                  <tr><th>Fecha</th><th>Período</th><th>Efectivo</th><th>Total</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {[...cortes].reverse().slice(0, 5).map(c => (
                    <tr key={c.id}>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.fecha}</td>
                      <td>{c.periodo}</td>
                      <td>${(c.totalEfectivo ?? 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: '#22c55e' }}>${(c.totalIngresos ?? 0).toLocaleString()}</td>
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
