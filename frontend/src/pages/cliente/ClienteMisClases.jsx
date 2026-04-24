import { useState } from 'react'
import { LayoutDashboard, BookOpen, CreditCard, User, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { useClasesStore } from '@/stores/clasesStore'
import styles from '@/styles/dashboard.module.css'
import localStyles from './ClienteMisClases.module.css'

const clienteLinks = [
  { to: '/cliente/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cliente/mis-clases', icon: BookOpen, label: 'Mis Clases' },
  { to: '/cliente/perfil', icon: User, label: 'Mi Perfil' },
  { to: '/cliente/pagos', icon: CreditCard, label: 'Pagos y Paquetes' },
]

function horasHastaClase(reserva) {
  const ahora = new Date()
  const fechaClase = new Date(`${reserva.fecha}T${reserva.claseHora}:00`)
  return (fechaClase - ahora) / 1000 / 60 / 60
}

export default function ClienteMisClases() {
  const { usuario, actualizarClasesPaquete } = useAuth()
  const { getReservasByUsuario, cancelarReserva } = useClasesStore()
  const reservas = getReservasByUsuario(usuario?.id)
  const [confirmando, setConfirmando] = useState(null)

  const devuelveCredito = confirmando
    ? horasHastaClase(confirmando) > 2
    : false

  const handleConfirmarCancelacion = () => {
    const ok = cancelarReserva(confirmando.id, usuario.id)
    if (ok) {
      if (devuelveCredito) {
        actualizarClasesPaquete(1)
        toast.success('Clase cancelada. Tu crédito fue devuelto.')
      } else {
        toast('Clase cancelada. Sin devolución de crédito por cancelación tardía.', { icon: '⚠️' })
      }
    } else {
      toast.error('No se pudo cancelar la clase.')
    }
    setConfirmando(null)
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
                      {r.estado === 'confirmada' && (
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                          onClick={() => setConfirmando(r)}
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

        {/* Modal de confirmación */}
        {confirmando && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${localStyles.cancelModal}`}>
              <div className={localStyles.modalIcon}>
                <AlertTriangle size={32} strokeWidth={1.5} />
              </div>

              <h2 className={styles.modalTitle}>¿Cancelar esta clase?</h2>

              <div className={localStyles.claseResumen}>
                <span className={localStyles.claseNombre}>{confirmando.claseNombre}</span>
                <span className={localStyles.claseDetalle}>
                  {confirmando.claseDia} · {confirmando.claseHora} · {confirmando.coachNombre}
                </span>
              </div>

              <div className={`${localStyles.aviso} ${devuelveCredito ? localStyles.avisoOk : localStyles.avisoWarn}`}>
                {devuelveCredito ? (
                  <>
                    <strong>✓ Tu crédito será devuelto</strong>
                    <span>Estás cancelando con más de 2 horas de anticipación.</span>
                  </>
                ) : (
                  <>
                    <strong>⚠ Sin devolución de crédito</strong>
                    <span>Solo se devuelve el crédito si cancelas con al menos 2 horas de anticipación.</span>
                  </>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setConfirmando(null)}
                >
                  Mantener reserva
                </button>
                <button
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={handleConfirmarCancelacion}
                >
                  Sí, cancelar clase
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
