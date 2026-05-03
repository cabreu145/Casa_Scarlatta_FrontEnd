import { useState } from 'react'
import { LayoutDashboard, BookOpen } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { useClasesStore } from '@/stores/clasesStore'
import { useReservasStore } from '@/stores/reservasStore'
import { useUsuariosStore } from '@/stores/usuariosStore'
import styles from '@/styles/dashboard.module.css'
import localStyles from './CoachMisClases.module.css'

const coachLinks = [
  { to: '/coach/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/coach/mis-clases', icon: BookOpen, label: 'Mis Clases' },
]

export default function CoachMisClases() {
  const { usuario } = useAuth()
  const { getClasesByCoach } = useClasesStore()
  const { getReservasByClase } = useReservasStore()
  const { usuarios } = useUsuariosStore()
  const misClases = getClasesByCoach(usuario?.id)
  const [claseSeleccionada, setClaseSeleccionada] = useState(null)

  return (
    <DashboardLayout links={coachLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Mis Clases</h1>
          <p className={styles.subtitle}>Alumnos inscritos en tus clases</p>
        </div>

        <div className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Día</th>
                <th>Hora</th>
                <th>Clase</th>
                <th>Tipo</th>
                <th>Inscritos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {misClases.map((c) => (
                <tr key={c.id}>
                  <td>{c.dia}</td>
                  <td style={{ fontWeight: 600 }}>{c.hora}</td>
                  <td>{c.nombre}</td>
                  <td>
                    <span className={`${styles.badge} ${c.tipo === 'Stride' ? styles.badgeStride : styles.badgeSlow}`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td>{c.cupoActual} / {c.cupoMax}</td>
                  <td>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                      onClick={() => setClaseSeleccionada(c)}
                    >
                      Ver alumnos
                    </button>
                  </td>
                </tr>
              ))}
              {misClases.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>
                    No tienes clases asignadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {claseSeleccionada && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: 520 }}>
              <h2 className={styles.modalTitle}>{claseSeleccionada.nombre}</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                {claseSeleccionada.dia} · {claseSeleccionada.hora} · {claseSeleccionada.cupoActual} / {claseSeleccionada.cupoMax} inscritos
              </p>

              {(() => {
                const alumnos = getReservasByClase(claseSeleccionada.id).map((r) => {
                  const u = usuarios.find((u) => u.id === r.userId)
                  return { id: r.id, nombre: u?.nombre ?? `Usuario #${r.userId}` }
                })
                return alumnos.length > 0 ? (
                  <ul className={localStyles.alumnosList}>
                    {alumnos.map((alumno) => (
                      <li key={alumno.id} className={localStyles.alumnoItem}>
                        <div className={localStyles.alumnoAvatar}>
                          {alumno.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className={localStyles.alumnoNombre}>{alumno.nombre}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', padding: '12px 0' }}>
                    No hay alumnos inscritos en esta clase.
                  </p>
                )
              })()}

              <div className={styles.modalActions}>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setClaseSeleccionada(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
