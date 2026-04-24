import { useState } from 'react'
import { CalendarDays, BookOpen, CreditCard, User } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import styles from '@/styles/dashboard.module.css'
import localStyles from './ClientePerfil.module.css'

const clienteLinks = [
  { to: '/cliente/dashboard', icon: CalendarDays, label: 'Dashboard' },
  { to: '/cliente/calendario', icon: CalendarDays, label: 'Calendario' },
  { to: '/cliente/mis-clases', icon: BookOpen, label: 'Mis Clases' },
  { to: '/cliente/pagos', icon: CreditCard, label: 'Pagos' },
  { to: '/cliente/perfil', icon: User, label: 'Perfil' },
]

export default function ClientePerfil() {
  const { usuario, actualizarPerfil } = useAuth()
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
    telefono: usuario?.telefono || '',
  })
  const [guardando, setGuardando] = useState(false)

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    await new Promise((r) => setTimeout(r, 500))
    actualizarPerfil(form)
    toast.success('Perfil actualizado')
    setGuardando(false)
  }

  return (
    <DashboardLayout links={clienteLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Mi Perfil</h1>
          <p className={styles.subtitle}>Gestiona tu información personal</p>
        </div>

        <div className={localStyles.perfilLayout}>
          <div className={localStyles.avatarSection}>
            <div className={localStyles.avatarBig}>
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className={localStyles.avatarName}>{usuario?.nombre}</div>
            <div className={localStyles.avatarRole}>{usuario?.rol}</div>
            {usuario?.paquete && (
              <div className={localStyles.avatarPaquete}>Paquete {usuario.paquete}</div>
            )}
          </div>

          <div className={styles.panel} style={{ flex: 1 }}>
            <div className={styles.panelTitle}>Información personal</div>
            <form onSubmit={handleGuardar}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Nombre completo</label>
                  <input type="text" value={form.nombre} onChange={set('nombre')} />
                </div>
                <div className={styles.field}>
                  <label>Correo electrónico</label>
                  <input type="email" value={form.email} onChange={set('email')} />
                </div>
                <div className={styles.field}>
                  <label>Teléfono</label>
                  <input type="tel" value={form.telefono} onChange={set('telefono')} placeholder="+52 55 0000 0000" />
                </div>
                <div className={styles.field}>
                  <label>Miembro desde</label>
                  <input type="text" value={usuario?.fechaRegistro || '—'} disabled style={{ opacity: 0.6 }} />
                </div>
              </div>
              <div className={styles.actions} style={{ marginTop: 'var(--space-xl)' }}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
