/**
 * Sidebar.jsx
 * ─────────────────────────────────────────────────────
 * Barra lateral de navegación para los dashboards.
 * Recibe los links dinámicamente para reutilizarse en
 * cliente, coach y admin sin cambiar su código.
 *
 * Usado en: DashboardLayout.jsx
 * Depende de: AuthContext, react-hot-toast
 * ─────────────────────────────────────────────────────
 */
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import styles from './Sidebar.module.css'

export default function Sidebar({ links, onNavigate }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Sesión cerrada')
    navigate('/')
  }

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoText}>casa</span>
        <span className={styles.logoAccent}>Scarlatta</span>
      </div>

      {usuario && (
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {usuario.nombre.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{usuario.nombre.split(' ')[0]}</span>
            <span className={styles.userRole}>{usuario.rol}</span>
          </div>
        </div>
      )}

      <div className={styles.divider} />

      <ul className={styles.navList}>
        {links.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to.endsWith('dashboard')}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={onNavigate}
            >
              {Icon && <Icon size={18} />}
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={styles.bottom}>
        <div className={styles.divider} />
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </nav>
  )
}
