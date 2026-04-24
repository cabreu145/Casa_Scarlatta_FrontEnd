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
          <span className={styles.mobileTitle}>Casa Scarlatta</span>
        </header>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
