import { useState } from 'react'
import { CalendarDays, BookOpen, CreditCard, User } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { usePaquetesStore } from '@/stores/paquetesStore'
import { mockTransacciones } from '@/data/mockTransacciones'
import styles from '@/styles/dashboard.module.css'
import localStyles from './ClientePagos.module.css'

const clienteLinks = [
  { to: '/cliente/dashboard', icon: CalendarDays, label: 'Dashboard' },
  { to: '/cliente/calendario', icon: CalendarDays, label: 'Calendario' },
  { to: '/cliente/mis-clases', icon: BookOpen, label: 'Mis Clases' },
  { to: '/cliente/pagos', icon: CreditCard, label: 'Pagos' },
  { to: '/cliente/perfil', icon: User, label: 'Perfil' },
]

export default function ClientePagos() {
  const { usuario, actualizarPerfil, actualizarClasesPaquete } = useAuth()
  const { paquetes } = usePaquetesStore()
  const [confirmando, setConfirmando] = useState(null)

  const misTransacciones = mockTransacciones.filter(
    (t) => t.clienteNombre === usuario?.nombre
  )

  const handleComprar = () => {
    if (!confirmando) return
    const clases = confirmando.clases === 0 ? 999 : confirmando.clases
    actualizarPerfil({
      paquete: confirmando.nombre,
      clasesPaquete: clases,
      clasesPaqueteTotal: clases,
    })
    toast.success(`Paquete ${confirmando.nombre} activado`)
    setConfirmando(null)
  }

  return (
    <DashboardLayout links={clienteLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Pagos y Paquetes</h1>
          <p className={styles.subtitle}>Paquete actual: {usuario?.paquete || 'Ninguno'}</p>
        </div>

        <div className={localStyles.paquetesGrid}>
          {paquetes.map((p) => (
            <div
              key={p.id}
              className={`${localStyles.paqueteCard} ${p.destacado ? localStyles.paqueteDestacado : ''} ${usuario?.paquete === p.nombre ? localStyles.paqueteActivo : ''}`}
            >
              {p.destacado && <div className={localStyles.popularBadge}>MÁS POPULAR</div>}
              {usuario?.paquete === p.nombre && <div className={localStyles.activoBadge}>ACTIVO</div>}
              <div className={localStyles.paqueteNombre}>{p.nombre}</div>
              <div className={localStyles.paquetePrecio}>
                <span className={localStyles.precio}>${p.precio.toLocaleString()}</span>
                <span className={localStyles.precioSufijo}>/mes</span>
              </div>
              <div className={localStyles.paqueteClases}>
                {p.clases === 0 ? 'Ilimitadas' : `${p.clases} clases`}
              </div>
              <ul className={localStyles.beneficiosList}>
                {p.beneficios.map((b) => (
                  <li key={b}>● {b}</li>
                ))}
              </ul>
              <button
                className={`${styles.btn} ${p.destacado ? styles.btnPrimary : styles.btnSecondary}`}
                onClick={() => setConfirmando(p)}
              >
                {usuario?.paquete === p.nombre ? 'Renovar' : 'Comprar'}
              </button>
            </div>
          ))}
        </div>

        {misTransacciones.length > 0 && (
          <div className={styles.panel} style={{ marginTop: 'var(--space-2xl)' }}>
            <div className={styles.panelTitle}>Historial de pagos</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Paquete</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {misTransacciones.map((t) => (
                  <tr key={t.id}>
                    <td>{t.fecha}</td>
                    <td>{t.paquete}</td>
                    <td>${t.monto.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeConfirmada}`}>
                        {t.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {confirmando && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2 className={styles.modalTitle}>Confirmar compra</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)' }}>
                ¿Activar el paquete <strong>{confirmando.nombre}</strong> por{' '}
                <strong>${confirmando.precio.toLocaleString()}/mes</strong>?
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                {confirmando.clases === 0 ? 'Clases ilimitadas' : `${confirmando.clases} clases al mes`}
              </p>
              <div className={styles.modalActions}>
                <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setConfirmando(null)}>
                  Cancelar
                </button>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleComprar}>
                  Confirmar compra
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
