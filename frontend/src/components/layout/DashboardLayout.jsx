/**
 * DashboardLayout.jsx
 * ─────────────────────────────────────────────────────
 * Layout base para todos los paneles (cliente, coach, admin).
 * Renderiza el Sidebar fijo en desktop y un overlay deslizable
 * en mobile, con un header con botón de menú hamburguesa.
 *
 * Usado en: AdminPanel, AdminClases, CoachPanel y todas las vistas de dashboard
 * Depende de: Sidebar
 * ─────────────────────────────────────────────────────
 */
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'
import styles from './DashboardLayout.module.css'

export default function DashboardLayout({ children, links }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={styles.root}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>
        <Sidebar links={links} onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className={styles.main}>
        <header className={styles.mobileHeader}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <span className={styles.mobileTitle}>Casa Scarlatt</span>
        </header>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
