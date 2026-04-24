import { useState } from 'react'
import { LayoutDashboard, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { useClasesStore } from '@/stores/clasesStore'
import { alumnosMockClase } from '@/data/mockReservas'
import styles from '@/styles/dashboard.module.css'
import localStyles from './CoachMisClases.module.css'

const coachLinks = [
  { to: '/coach/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/coach/mis-clases', icon: BookOpen, label: 'Mis Clases' },
]

export default function CoachMisClases() {
  const { usuario } = useAuth()
  const { getClasesByCoach } = useClasesStore()
  const misClases = getClasesByCoach(usuario?.id)
  const [claseSeleccionada, setClaseSeleccionada] = useState(null)
  const [asistencia, setAsistencia] = useState({})

  const handleSeleccionarClase = (clase) => {
    setClaseSeleccionada(clase)
    setAsistencia({})
  }

  const toggleAsistencia = (alumnoId, valor) => {
    setAsistencia((prev) => ({ ...prev, [alumnoId]: valor }))
  }

  const handleGuardarAsistencia = () => {
    toast.success('Asistencia guardada correctamente')
    setClaseSeleccionada(null)
    setAsistencia({})
  }

  const registrados = Object.values(asistencia).filter((v) => v === true).length

  return (
    <DashboardLayout links={coachLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Mis Clases</h1>
          <p className={styles.subtitle}>Gestiona asistencia de alumnos</p>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Selecciona una clase</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Día</th>
                <th>Hora</th>
                <th>Clase</th>
                <th>Tipo</th>
                <th>Alumnos</th>
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
                      className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                      onClick={() => handleSeleccionarClase(c)}
                    >
                      Tomar asistencia
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {claseSeleccionada && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: 600 }}>
              <h2 className={styles.modalTitle}>{claseSeleccionada.nombre}</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                {claseSeleccionada.dia} · {claseSeleccionada.hora} · {registrados} de {alumnosMockClase.length} registraron asistencia
              </p>

              <ul className={localStyles.alumnosList}>
                {alumnosMockClase.map((alumno) => (
                  <li key={alumno.id} className={localStyles.alumnoItem}>
                    <div className={localStyles.alumnoAvatar}>
                      {alumno.nombre.charAt(0)}
                    </div>
                    <span className={localStyles.alumnoNombre}>{alumno.nombre}</span>
                    <div className={localStyles.asistenciaBtns}>
                      <button
                        className={`${localStyles.asistenciaBtn} ${asistencia[alumno.id] === true ? localStyles.asistenciaBtnSi : ''}`}
                        onClick={() => toggleAsistencia(alumno.id, true)}
                      >
                        ✅ Asistió
                      </button>
                      <button
                        className={`${localStyles.asistenciaBtn} ${asistencia[alumno.id] === false ? localStyles.asistenciaBtnNo : ''}`}
                        onClick={() => toggleAsistencia(alumno.id, false)}
                      >
                        ❌ No asistió
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className={styles.modalActions}>
                <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setClaseSeleccionada(null)}>
                  Cancelar
                </button>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleGuardarAsistencia}>
                  Guardar asistencia
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
