import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { useReportesStore } from '@/stores/reportesStore'
import styles from '@/styles/dashboard.module.css'

export default function AdminReportes() {
  const {
    clasesMasPopulares,
    asistenciaPorCoach,
    cancelacionesPorSemana,
    clientesNuevosVsRecurrentes,
  } = useReportesStore()

  const cancelacionMax = Math.max(...cancelacionesPorSemana.map((s) => s.cancelaciones))

  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Reportes</h1>
          <p className={styles.subtitle}>Análisis de desempeño del estudio este mes</p>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Clases más populares</div>
            <div className={styles.barChart}>
              {clasesMasPopulares.map((c) => (
                <div key={c.nombre} className={styles.barRow}>
                  <span className={styles.barLabel}>{c.nombre}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${c.tipo === 'Slow' ? styles.barFillSlow : ''}`}
                      style={{ width: `${c.porcentaje}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>{c.reservas}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Cancelaciones por semana</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 100 }}>
              {cancelacionesPorSemana.map((s) => (
                <div key={s.semana} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {s.cancelaciones}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      background: 'var(--brand-rose)',
                      borderRadius: '4px 4px 0 0',
                      height: `${Math.round((s.cancelaciones / cancelacionMax) * 70)}px`,
                      opacity: 0.7,
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {s.semana}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.contentGrid} style={{ marginTop: 'var(--space-lg)' }}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Asistencia promedio por coach</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Coach</th>
                  <th>Promedio/clase</th>
                  <th>Total clases</th>
                </tr>
              </thead>
              <tbody>
                {asistenciaPorCoach.map((c) => (
                  <tr key={c.coach}>
                    <td style={{ fontWeight: 500 }}>{c.coach}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={styles.progressBar} style={{ width: 80 }}>
                          <div className={styles.progressFill} style={{ width: `${(c.promedio / 20) * 100}%` }} />
                        </div>
                        <span style={{ fontSize: 13 }}>{c.promedio}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.total} clases</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Clientes este mes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', paddingTop: 'var(--space-sm)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Recurrentes
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {clientesNuevosVsRecurrentes.recurrentes}
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.round((clientesNuevosVsRecurrentes.recurrentes / clientesNuevosVsRecurrentes.total) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Nuevos
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--brand-rose)' }}>
                    {clientesNuevosVsRecurrentes.nuevos}
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${Math.round((clientesNuevosVsRecurrentes.nuevos / clientesNuevosVsRecurrentes.total) * 100)}%`,
                      background: 'var(--brand-rose)',
                    }}
                  />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                {clientesNuevosVsRecurrentes.total} clientes totales
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
