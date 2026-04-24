import { CalendarDays, BookOpen, CreditCard, User } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { useClasesStore } from '@/stores/clasesStore'
import styles from '@/styles/dashboard.module.css'

const clienteLinks = [
  { to: '/cliente/dashboard', icon: CalendarDays, label: 'Dashboard' },
  { to: '/cliente/calendario', icon: CalendarDays, label: 'Calendario' },
  { to: '/cliente/mis-clases', icon: BookOpen, label: 'Mis Clases' },
  { to: '/cliente/pagos', icon: CreditCard, label: 'Pagos' },
  { to: '/cliente/perfil', icon: User, label: 'Perfil' },
]

export default function ClienteMisClases() {
  const { usuario, actualizarClasesPaquete } = useAuth()
  const { getReservasByUsuario, cancelarReserva } = useClasesStore()
  const reservas = getReservasByUsuario(usuario?.id)

  const puedeCanselar = (reserva) => {
    if (reserva.estado !== 'confirmada') return false
    const ahora = new Date()
    const fechaClase = new Date(`${reserva.fecha}T${reserva.claseHora}:00`)
    const diffHoras = (fechaClase - ahora) / 1000 / 60 / 60
    return diffHoras > 2
  }

  const handleCancelar = (reserva) => {
    const ok = cancelarReserva(reserva.id, usuario.id)
    if (ok) {
      actualizarClasesPaquete(1)
      toast.success('Clase cancelada. Crédito devuelto.')
    } else {
      toast.error('No se pudo cancelar la clase')
    }
  }

  const estadoClass = {
    confirmada: styles.badgeConfirmada,
    cancelada: styles.badgeCancelada,
    completada: styles.badgeCompletada,
  }

  return (
    <DashboardLayout links={clienteLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Mis Clases</h1>
          <p className={styles.subtitle}>{reservas.length} reservas en total</p>
        </div>

        {reservas.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <p className={styles.emptyText}>No tienes clases reservadas aún.</p>
          </div>
        ) : (
          <div className={styles.panel}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Clase</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Coach</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...reservas].reverse().map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.claseNombre}</td>
                    <td>{r.fecha}</td>
                    <td>{r.claseHora}</td>
                    <td>{r.coachNombre}</td>
                    <td>
                      <span className={`${styles.badge} ${r.tipo === 'Stride' ? styles.badgeStride : styles.badgeSlow}`}>
                        {r.tipo}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${estadoClass[r.estado] || ''}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td>
                      {puedeCanselar(r) && (
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                          onClick={() => handleCancelar(r)}
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
