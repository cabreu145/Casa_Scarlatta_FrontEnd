import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { mockTransacciones, ingresosUltimosMeses } from '@/data/mockTransacciones'
import styles from '@/styles/dashboard.module.css'

const ingresosMes = mockTransacciones.reduce((acc, t) => acc + t.monto, 0)
const ingresosMesAnterior = 39800
const ingresoMax = Math.max(...ingresosUltimosMeses.map((m) => m.monto))

export default function AdminFinanzas() {
  const [busqueda, setBusqueda] = useState('')

  const filtradas = mockTransacciones.filter(
    (t) =>
      t.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.paquete.toLowerCase().includes(busqueda.toLowerCase())
  )

  const exportarCSV = () => {
    const headers = 'Fecha,Cliente,Paquete,Monto,Estado\n'
    const filas = mockTransacciones
      .map((t) => `${t.fecha},${t.clienteNombre},${t.paquete},$${t.monto},${t.estado}`)
      .join('\n')
    const blob = new Blob([headers + filas], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transacciones.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const diff = ((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior) * 100

  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Finanzas</h1>
          <p className={styles.subtitle}>Resumen financiero del estudio</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Ingresos este mes</div>
            <div className={styles.statValue}>${ingresosMes.toLocaleString()}</div>
            <div className={styles.statSub} style={{ color: diff > 0 ? '#228B22' : '#C83232' }}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}% vs mes anterior
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Mes anterior</div>
            <div className={styles.statValue}>${ingresosMesAnterior.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Transacciones</div>
            <div className={styles.statValue}>{mockTransacciones.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Ticket promedio</div>
            <div className={styles.statValue}>
              ${Math.round(ingresosMes / mockTransacciones.length).toLocaleString()}
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
                    background: 'var(--brand-wine)',
                    borderRadius: '4px 4px 0 0',
                    height: `${Math.round((m.monto / ingresoMax) * 80)}px`,
                    opacity: m.mes === 'Abr' ? 1 : 0.5,
                  }}
                />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
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
              <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={exportarCSV}>
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
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.fecha}</td>
                  <td style={{ fontWeight: 500 }}>{t.clienteNombre}</td>
                  <td>{t.paquete}</td>
                  <td style={{ fontWeight: 600, color: 'var(--brand-wine)' }}>${t.monto.toLocaleString()}</td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeConfirmada}`}>{t.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
