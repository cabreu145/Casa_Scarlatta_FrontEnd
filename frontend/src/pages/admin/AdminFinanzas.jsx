import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { mockTransacciones, ingresosUltimosMeses } from '@/data/mockTransacciones'
import { SkeletonTable } from '@/components/ui/SkeletonLoader'
import { exportCSV } from '@/utils/exportCSV'
import styles from '@/styles/dashboard.module.css'

const MESES = ingresosUltimosMeses.map((m) => m.mes)

const CSV_COLUMNS = [
  { label: 'Fecha', key: 'fecha' },
  { label: 'Cliente', key: 'clienteNombre' },
  { label: 'Paquete', key: 'paquete' },
  { label: 'Monto', render: (t) => `$${t.monto}` },
  { label: 'Tipo', render: (t) => t.tipo || 'Individual' },
  { label: 'Estado', key: 'estado' },
]

const transaccionesConTipo = mockTransacciones.map((t) => ({
  ...t,
  tipo: t.tipo || 'Individual',
}))

export default function AdminFinanzas() {
  const [mesSeleccionado, setMesSeleccionado] = useState('Abr')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setCargando(true)
    const t = setTimeout(() => setCargando(false), 800)
    return () => clearTimeout(t)
  }, [mesSeleccionado])

  const mesActualData = ingresosUltimosMeses.find((m) => m.mes === mesSeleccionado)
  const mesIdx = ingresosUltimosMeses.findIndex((m) => m.mes === mesSeleccionado)
  const mesAnteriorData = mesIdx > 0 ? ingresosUltimosMeses[mesIdx - 1] : null

  const ingresosMes = mesActualData?.monto ?? 0
  const ingresosMesAnterior = mesAnteriorData?.monto ?? 0
  const diff = mesAnteriorData
    ? ((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior) * 100
    : null

  const filtradas = transaccionesConTipo.filter(
    (t) =>
      (t.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.paquete.toLowerCase().includes(busqueda.toLowerCase()))
  )

  const ingresoMax = Math.max(...ingresosUltimosMeses.map((m) => m.monto))

  const handleExportar = () => {
    const mes = mesSeleccionado
    const anio = '2026'
    exportCSV(filtradas, `finanzas_casascarlatta_${mes}_${anio}.csv`, CSV_COLUMNS)
    toast.success('CSV exportado correctamente')
  }

  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-2xl)' }}>
          <div className={styles.pageHeader} style={{ margin: 0 }}>
            <h1 className={styles.greeting}>Finanzas</h1>
            <p className={styles.subtitle}>Resumen financiero del estudio</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
              Mes:
            </label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--text-primary)',
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--neutral-border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px',
                cursor: 'pointer',
              }}
            >
              {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Ingresos — {mesSeleccionado}</div>
            <div className={styles.statValue}>${ingresosMes.toLocaleString()}</div>
            {diff !== null && (
              <div className={styles.statSub} style={{ color: diff >= 0 ? '#228B22' : '#C83232' }}>
                {diff >= 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}% vs mes anterior
              </div>
            )}
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Mes anterior</div>
            <div className={styles.statValue}>${(ingresosMesAnterior || 0).toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Transacciones</div>
            <div className={styles.statValue}>{mockTransacciones.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Ticket promedio</div>
            <div className={styles.statValue}>
              ${Math.round(ingresosMes / Math.max(mockTransacciones.length, 1)).toLocaleString()}
            </div>
          </div>
        </div>

        <div className={styles.panel} style={{ marginBottom: 'var(--space-xl)' }}>
          <div className={styles.panelTitle}>Ingresos últimos 6 meses</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 100, padding: '0 var(--space-sm)' }}>
            {ingresosUltimosMeses.map((m) => (
              <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>
                  ${Math.round(m.monto / 1000)}k
                </span>
                <div
                  style={{
                    width: '100%',
                    background: m.mes === mesSeleccionado ? 'var(--brand-wine)' : 'var(--brand-rose)',
                    borderRadius: '4px 4px 0 0',
                    height: `${Math.round((m.monto / ingresoMax) * 80)}px`,
                    opacity: m.mes === mesSeleccionado ? 1 : 0.4,
                    transition: 'opacity 0.3s ease',
                  }}
                />
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: m.mes === mesSeleccionado ? 'var(--brand-wine)' : 'var(--text-muted)',
                  fontWeight: m.mes === mesSeleccionado ? 600 : 400,
                }}>
                  {m.mes}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <div className={styles.panelTitle} style={{ margin: 0 }}>Transacciones</div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input
                className={styles.searchInput}
                style={{ width: 200 }}
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                onClick={handleExportar}
              >
                Exportar CSV
              </button>
            </div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Paquete</th>
                <th>Monto</th>
                <th>Tipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <SkeletonTable rows={4} cols={6} />
              ) : (
                filtradas.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.fecha}</td>
                    <td style={{ fontWeight: 500 }}>{t.clienteNombre}</td>
                    <td>{t.paquete}</td>
                    <td style={{ fontWeight: 600, color: 'var(--brand-wine)' }}>${t.monto.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.badge} ${t.tipo === 'Compartido' ? styles.badgeSlow : styles.badgeCompletada}`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeConfirmada}`}>{t.estado}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
