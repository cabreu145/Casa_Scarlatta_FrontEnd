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
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'
import styles from './DashboardLayout.module.css'

export default function DashboardLayout({ children, links }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen])

  return (
    <div className={styles.root}>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className={styles.sidebarBackdrop} onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <button className={styles.closeBtn} onClick={() => setIsSidebarOpen(false)}>
          <X size={20} />
        </button>
        <Sidebar links={links} onNavigate={() => setIsSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className={styles.main}>
        <header className={styles.mobileHeader}>
          <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(true)}>
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
