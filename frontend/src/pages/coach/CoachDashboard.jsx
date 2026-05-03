import { LayoutDashboard, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { useClasesStore } from '@/stores/clasesStore'
import styles from '@/styles/dashboard.module.css'

const coachLinks = [
  { to: '/coach/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/coach/mis-clases', icon: BookOpen, label: 'Mis Clases' },
]

const DIAS_SEMANA = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles',
  'Jueves', 'Viernes', 'Sábado',
]
const DIA_HOY = DIAS_SEMANA[new Date().getDay()]

export default function CoachDashboard() {
  const { usuario } = useAuth()
  const { getClasesByCoach } = useClasesStore()
  const misClases = getClasesByCoach(usuario?.id)
  const clasesHoy = misClases.filter((c) => c.dia === DIA_HOY)

  const totalAlumnos = misClases.reduce((acc, c) => acc + c.cupoActual, 0)
  const ocupacionPromedio = misClases.length
    ? Math.round(misClases.reduce((acc, c) => acc + (c.cupoActual / c.cupoMax) * 100, 0) / misClases.length)
    : 0

  return (
    <DashboardLayout links={coachLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Hola, {usuario?.nombre?.split(' ')[0]} 🏋️</h1>
          <p className={styles.subtitle}>
            Hoy tienes {clasesHoy.length} {clasesHoy.length === 1 ? 'clase' : 'clases'}
          </p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Clases esta semana</div>
            <div className={styles.statValue}>{misClases.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Alumnos inscritos</div>
            <div className={styles.statValue}>{totalAlumnos}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Ocupación promedio</div>
            <div className={styles.statValue}>{ocupacionPromedio}%</div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Clases de hoy ({DIA_HOY})</div>
          {clasesHoy.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
              No tienes clases hoy.
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Clase</th>
                  <th>Tipo</th>
                  <th>Alumnos</th>
                  <th>Ocupación</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clasesHoy.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.hora}</td>
                    <td>{c.nombre}</td>
                    <td>
                      <span className={`${styles.badge} ${!c.tipo?.toLowerCase().includes('slow') ? styles.badgeStride : styles.badgeSlow}`}>
                        {c.tipo}
                      </span>
                    </td>
                    <td>{c.cupoActual} / {c.cupoMax}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={styles.progressBar} style={{ width: 80 }}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${Math.round((c.cupoActual / c.cupoMax) * 100)}%` }}
                          />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {Math.round((c.cupoActual / c.cupoMax) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <Link
                        to="/coach/mis-clases"
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                      >
                        Ver alumnos
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.panel} style={{ marginTop: 'var(--space-lg)' }}>
          <div className={styles.panelTitle}>Todas mis clases esta semana</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Día</th>
                <th>Hora</th>
                <th>Clase</th>
                <th>Tipo</th>
                <th>Alumnos</th>
              </tr>
            </thead>
            <tbody>
              {misClases.map((c) => (
                <tr key={c.id}>
                  <td>{c.dia}</td>
                  <td>{c.hora}</td>
                  <td>{c.nombre}</td>
                  <td>
                    <span className={`${styles.badge} ${!c.tipo?.toLowerCase().includes('slow') ? styles.badgeStride : styles.badgeSlow}`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td>{c.cupoActual} / {c.cupoMax}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
