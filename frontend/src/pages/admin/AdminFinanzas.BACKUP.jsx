import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { ingresosUltimosMeses } from '@/data/mockTransacciones'
import { SkeletonTable } from '@/components/ui/SkeletonLoader'
import { exportCSV } from '@/utils/exportCSV'
import { useTransaccionesStore }       from '@/stores/transaccionesStore'
import { useCortesStore }              from '@/stores/cortesStore'
import { useAuthStore }                from '@/stores/authStore'
import { useGastosStore, TIPOS_GASTO } from '@/stores/gastosStore'
import { getDailyIncome, getIncomeByCategory } from '@/services/ventaService'
import styles from '@/styles/dashboard.module.css'

// ── Columnas del CSV exportado ───────────────────────────────────────────────
const CSV_COLUMNS = [
  { label: 'Fecha',       key: 'fecha' },
  { label: 'Concepto',    key: 'concepto' },
  { label: 'Tipo',        key: 'tipo' },
  { label: 'Método pago', key: 'metodoPago' },
  { label: 'Monto',       render: (t) => `$${t.monto ?? 0}` },
]

// ── Colores de método de pago ────────────────────────────────────────────────
const METODO_COLOR = {
  efectivo:      { bg: '#1A2E1A', color: '#4CAF50' },
  tarjeta:       { bg: '#1A1E2E', color: '#5B9BD5' },
  transferencia: { bg: '#2E2A1A', color: '#E8A020' },
}

const TIPO_GASTO_LABELS = {
  operativo:  'Operativo',
  sueldo:     'Sueldo',
  servicio:   'Servicio',
  insumo:     'Insumo',
  inventario: 'Inventario',
}

export default function AdminFinanzas() {
  // ── Stores ──────────────────────────────────────────────────────────────────
  const { transacciones }                                         = useTransaccionesStore()
  const { cortes, ejecutarCorte }                                 = useCortesStore()
  const { usuario }                                               = useAuthStore()
  const { gastos, registrarGasto, getGastosByRango, eliminarGasto } = useGastosStore()

  // ── Estado local ─────────────────────────────────────────────────────────────
  const [rango, setRango]       = useState('mes')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [modalGasto, setModalGasto] = useState(false)
  const [formGasto, setFormGasto]   = useState({ concepto: '', monto: '', tipo: TIPOS_GASTO.OPERATIVO })

  // ── Transacciones filtradas por rango ────────────────────────────────────────
  const txFiltradas = useMemo(() => {
    const ahora = new Date()
    return transacciones
      .filter(tx => {
        const fecha = new Date(tx.fecha)
        if (rango === 'dia') return fecha.toDateString() === ahora.toDateString()
        if (rango === 'semana') {
          const hace7 = new Date(ahora)
          hace7.setDate(ahora.getDate() - 7)
          return fecha >= hace7
        }
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [transacciones, rango])

  // ── Métricas de ingresos ─────────────────────────────────────────────────────
  const totalIngresos = txFiltradas.filter(tx => tx.monto > 0).reduce((acc, tx) => acc + tx.monto, 0)
  const ticketProm    = txFiltradas.length > 0 ? Math.round(totalIngresos / txFiltradas.length) : 0
  const ingresosDia   = useMemo(() => getDailyIncome(),           [transacciones])
  const ingresosCat   = useMemo(() => getIncomeByCategory(rango), [transacciones, rango])

  // ── Gastos ───────────────────────────────────────────────────────────────────
  const gastosRango   = useMemo(() => getGastosByRango(rango),    [gastos, rango])
  const gastosTotales = gastosRango.reduce((acc, g) => acc + g.monto, 0)
  const utilidad      = totalIngresos - gastosTotales

  // ── Corte de caja ────────────────────────────────────────────────────────────
  const hoy           = new Date().toISOString().split('T')[0]
  const yaHayCorteHoy = cortes.some(c => c.fecha === hoy)

  const handleCerrarDia = () => {
    const now   = new Date()
    const mes   = now.toLocaleString('es-MX', { month: 'long' })
    const año   = now.getFullYear()
    ejecutarCorte({
      fecha:               hoy,
      periodo:             `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${año}`,
      tipo:                'diario',
      ingresosPaquetes:    ingresosCat.paquetes,
      ingresosProductos:   ingresosCat.productos,
      totalIngresos:       ingresosDia.total,
      totalEfectivo:       ingresosDia.efectivo,
      totalTarjeta:        ingresosDia.tarjeta,
      totalTransferencia:  ingresosDia.transferencia,
      totalReservas:       0,
      totalCancelaciones:  0,
      ejecutadoPor:        usuario?.id ?? null,
      estado:              'cerrado',
    })
    toast.success('¡Corte de caja realizado correctamente!')
  }

  const handleGuardarGasto = () => {
    if (!formGasto.concepto.trim() || !formGasto.monto) {
      toast.error('Completa concepto y monto.')
      return
    }
    registrarGasto({
      concepto: formGasto.concepto.trim(),
      monto:    parseFloat(formGasto.monto),
      tipo:     formGasto.tipo,
      adminId:  usuario?.id ?? null,
    })
    toast.success('Gasto registrado.')
    setModalGasto(false)
    setFormGasto({ concepto: '', monto: '', tipo: TIPOS_GASTO.OPERATIVO })
  }

  // ── Búsqueda sobre txFiltradas ───────────────────────────────────────────────
  const txMostradas = busqueda.trim()
    ? txFiltradas.filter(tx =>
        tx.concepto?.toLowerCase().includes(busqueda.toLowerCase()) ||
        tx.tipo?.toLowerCase().includes(busqueda.toLowerCase())     ||
        (tx.metodoPago ?? '').toLowerCase().includes(busqueda.toLowerCase())
      )
    : txFiltradas

  // ── Bar chart ────────────────────────────────────────────────────────────────
  const ingresoMax = Math.max(...ingresosUltimosMeses.map(m => m.monto), 1)

  const handleExportar = () => {
    exportCSV(txMostradas, `finanzas_casascarlatta_${rango}.csv`, CSV_COLUMNS)
    toast.success('CSV exportado correctamente')
  }

  const handleRango = (r) => {
    setCargando(true)
    setRango(r)
    setTimeout(() => setCargando(false), 400)
  }

  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-2xl)' }}>
          <div className={styles.pageHeader} style={{ margin: 0 }}>
            <h1 className={styles.greeting}>Finanzas</h1>
            <p className={styles.subtitle}>Resumen financiero del estudio</p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#1E1014', padding: 4, borderRadius: 8 }}>
            {[
              { value: 'dia',    label: 'Hoy'    },
              { value: 'semana', label: 'Semana' },
              { value: 'mes',    label: 'Mes'    },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleRango(value)}
                style={{
                  padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  background: rango === value ? '#7B1E22' : 'transparent',
                  color:      rango === value ? '#fff'    : '#A69A93',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Ingresos — {rango === 'dia' ? 'hoy' : rango === 'semana' ? 'semana' : 'mes'}</div>
            <div className={styles.statValue}>${totalIngresos.toLocaleString()}</div>
            <div className={styles.statSub}>{txFiltradas.length} transacciones</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Gastos</div>
            <div className={styles.statValue} style={{ color: gastosTotales > 0 ? '#C83232' : undefined }}>
              ${gastosTotales.toLocaleString()}
            </div>
            <div className={styles.statSub}>{gastosRango.length} registros</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Utilidad neta</div>
            <div className={styles.statValue} style={{ color: utilidad >= 0 ? '#228B22' : '#C83232' }}>
              ${utilidad.toLocaleString()}
            </div>
            <div className={styles.statSub}>Ingresos − Gastos</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Ticket promedio</div>
            <div className={styles.statValue}>${ticketProm.toLocaleString()}</div>
            <div className={styles.statSub}>Por transacción</div>
          </div>
        </div>

        {/* ── Desglose método de pago ── */}
        <div className={styles.panel} style={{ marginBottom: 'var(--space-xl)' }}>
          <div className={styles.panelTitle}>Desglose por método de pago — hoy</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { key: 'efectivo',      label: '💵 Efectivo'      },
              { key: 'tarjeta',       label: '💳 Tarjeta'       },
              { key: 'transferencia', label: '📱 Transferencia' },
            ].map(({ key, label }) => {
              const mc = METODO_COLOR[key]
              return (
                <div key={key} style={{ flex: '1 1 140px', background: mc.bg, borderRadius: 10, padding: '14px 18px', border: `1px solid ${mc.color}33` }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: mc.color }}>
                    ${(ingresosDia[key] ?? 0).toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Bar chart histórico ── */}
        <div className={styles.panel} style={{ marginBottom: 'var(--space-xl)' }}>
          <div className={styles.panelTitle}>Ingresos históricos (últimos 6 meses)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 100, padding: '0 var(--space-sm)' }}>
            {ingresosUltimosMeses.map((m) => (
              <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>
                  ${Math.round(m.monto / 1000)}k
                </span>
                <div style={{ width: '100%', background: 'var(--brand-rose)', borderRadius: '4px 4px 0 0', height: `${Math.round((m.monto / ingresoMax) * 80)}px`, opacity: 0.5 }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{m.mes}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Corte de caja ── */}
        <div className={styles.panel} style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <div className={styles.panelTitle} style={{ margin: 0 }}>Corte de caja — Hoy</div>
            <button
              onClick={handleCerrarDia}
              disabled={yaHayCorteHoy}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: yaHayCorteHoy ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13,
                background: yaHayCorteHoy ? '#2C1A1E' : '#7B1E22',
                color:      yaHayCorteHoy ? '#A69A93' : '#fff',
                opacity:    yaHayCorteHoy ? 0.7 : 1,
                transition: 'all 0.15s',
              }}
            >
              {yaHayCorteHoy ? '✓ Corte realizado' : '🔒 Cerrar día'}
            </button>
          </div>

          {/* Resumen del día */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 'var(--space-lg)' }}>
            {[
              { label: '💵 Efectivo',       val: ingresosDia.efectivo      },
              { label: '💳 Tarjeta',        val: ingresosDia.tarjeta       },
              { label: '📱 Transferencia',  val: ingresosDia.transferencia },
              { label: '📊 Total esperado', val: ingresosDia.total,  bold: true },
            ].map(({ label, val, bold }) => (
              <div key={label} style={{ background: '#2C1A1E', borderRadius: 8, padding: '12px 16px', border: bold ? '1px solid #7B1E22' : '1px solid #3C2A2E' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: bold ? '#E8A4AD' : 'var(--text-primary)', fontWeight: bold ? 600 : 400 }}>
                  ${(val ?? 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Historial de cortes */}
          {cortes.length > 0 && (
            <>
              <div className={styles.panelTitle} style={{ marginBottom: 'var(--space-sm)' }}>Cortes anteriores</div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Período</th>
                    <th>Efectivo</th>
                    <th>Total ingresos</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...cortes].reverse().map(c => (
                    <tr key={c.id}>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.fecha}</td>
                      <td>{c.periodo}</td>
                      <td>${(c.totalEfectivo ?? c.ingresosPaquetes ?? 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--brand-wine)' }}>${(c.totalIngresos ?? 0).toLocaleString()}</td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeCompletada}`}>{c.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* ── Gastos ── */}
        <div className={styles.panel} style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <div className={styles.panelTitle} style={{ margin: 0 }}>Gastos</div>
            <button
              onClick={() => setModalGasto(true)}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13,
                background: '#7B1E22', color: '#fff',
              }}
            >
              + Registrar gasto
            </button>
          </div>

          {/* Resumen financiero */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
            {[
              { label: 'Ingresos',     val: totalIngresos,  color: '#228B22' },
              { label: 'Gastos',       val: -gastosTotales, color: '#C83232' },
              { label: 'Utilidad',     val: utilidad,       color: utilidad >= 0 ? '#228B22' : '#C83232', bold: true },
            ].map(({ label, val, color, bold }) => (
              <div key={label} style={{ flex: '1 1 160px', background: '#1E1014', borderRadius: 10, padding: '14px 18px', border: `1px solid ${color}33` }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: bold ? 24 : 20, color, fontWeight: bold ? 600 : 400 }}>
                  {val < 0 ? '-' : ''}${Math.abs(val).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Tabla de gastos */}
          {gastosRango.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
              Sin gastos registrados en este período
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gastosRango.map(g => (
                  <tr key={g.id}>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{g.fecha}</td>
                    <td style={{ fontWeight: 500 }}>{g.concepto}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeSlow}`}>
                        {TIPO_GASTO_LABELS[g.tipo] ?? g.tipo}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#C83232' }}>
                      −${g.monto.toLocaleString()}
                    </td>
                    <td>
                      <button
                        onClick={() => eliminarGasto(g.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A69A93', fontSize: 16 }}
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Tabla transacciones ── */}
        <div className={styles.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <div className={styles.panelTitle} style={{ margin: 0 }}>
              Transacciones
              <span style={{ marginLeft: 10, fontSize: 12, color: '#A69A93', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                ({txMostradas.length} registros)
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input
                className={styles.searchInput}
                style={{ width: 200 }}
                type="text"
                placeholder="Buscar concepto, tipo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={handleExportar}>
                Exportar CSV
              </button>
            </div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Tipo</th>
                <th>Método de pago</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <SkeletonTable rows={4} cols={5} />
              ) : txMostradas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                    Sin transacciones en este período
                  </td>
                </tr>
              ) : (
                txMostradas.map((tx) => (
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
                        {tx.metodoPago ?? 'efectivo'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--brand-wine)' }}>
                      ${(tx.monto ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── Modal registrar gasto ── */}
      {modalGasto && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalGasto(false)}
        >
          <div
            style={{ background: '#1E1014', borderRadius: 16, padding: 32, width: '90%', maxWidth: 420, border: '1px solid #3C2A2E', zIndex: 10000 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--text-primary)', fontSize: 20, margin: '0 0 24px' }}>
              Registrar gasto
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>Concepto</label>
                <input
                  type="text"
                  placeholder="Ej. Pago de luz, Sueldo coach..."
                  value={formGasto.concepto}
                  onChange={e => setFormGasto(p => ({ ...p, concepto: e.target.value }))}
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>Monto ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formGasto.monto}
                  onChange={e => setFormGasto(p => ({ ...p, monto: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 18, boxSizing: 'border-box' }}
                />
              </div>

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
              <button
                onClick={handleGuardarGasto}
                style={{ padding: 14, borderRadius: 8, border: 'none', background: '#7B1E22', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, cursor: 'pointer' }}
              >
                Guardar gasto
              </button>
              <button
                onClick={() => setModalGasto(false)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #3C2A2E', background: 'transparent', color: '#A69A93', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </DashboardLayout>
  )
}
