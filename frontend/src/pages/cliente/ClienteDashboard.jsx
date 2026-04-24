import { Link } from 'react-router-dom'
import { CalendarDays, BookOpen, CreditCard, User } from 'lucide-react'
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

export default function ClienteDashboard() {
  const { usuario } = useAuth()
  const { getReservasByUsuario } = useClasesStore()
  const reservas = getReservasByUsuario(usuario?.id)
  const proxima = reservas.find((r) => r.estado === 'confirmada')
  const recientes = reservas.slice(-3).reverse()

  const pct = usuario?.clasesPaqueteTotal
    ? Math.round((usuario.clasesPaquete / usuario.clasesPaqueteTotal) * 100)
    : 0

  return (
    <DashboardLayout links={clienteLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Bienvenida, {usuario?.nombre?.split(' ')[0]} 👋</h1>
          <p className={styles.subtitle}>
            {usuario?.paquete ? `Paquete ${usuario.paquete}` : 'Sin paquete activo'}
          </p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Clases disponibles</div>
            <div className={styles.statValue}>{usuario?.clasesPaquete ?? '—'}</div>
            {usuario?.clasesPaqueteTotal > 0 && (
              <>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                </div>
                <div className={styles.statSub}>{usuario.clasesPaquete} de {usuario.clasesPaqueteTotal} restantes</div>
              </>
            )}
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Paquete actual</div>
            <div className={styles.statValue} style={{ fontSize: 20 }}>{usuario?.paquete || 'Ninguno'}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Clases tomadas</div>
            <div className={styles.statValue}>{reservas.filter(r => r.estado === 'completada').length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Canceladas</div>
            <div className={styles.statValue}>{reservas.filter(r => r.estado === 'cancelada').length}</div>
          </div>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Próxima clase</div>
            {proxima ? (
              <div>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  {proxima.claseNombre}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 4px' }}>
                  {proxima.claseDia} · {proxima.claseHora}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  Coach: {proxima.coachNombre}
                </p>
              </div>
            ) : (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
                No tienes clases reservadas.
              </p>
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Historial reciente</div>
            {recientes.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recientes.map((r) => (
                  <li key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 14 }}>
                    <span style={{ fontSize: 16 }}>
                      {r.estado === 'completada' ? '✓' : r.estado === 'cancelada' ? '✗' : '○'}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{r.claseNombre}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: 12 }}>{r.claseDia}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>Sin historial.</p>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Accesos rápidos</div>
          <div className={styles.actions}>
            <Link to="/cliente/calendario" className={`${styles.btn} ${styles.btnPrimary}`}>
              Reservar clase
            </Link>
            <Link to="/cliente/mis-clases" className={`${styles.btn} ${styles.btnSecondary}`}>
              Ver mis clases
            </Link>
            <Link to="/cliente/pagos" className={`${styles.btn} ${styles.btnSecondary}`}>
              Renovar paquete
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
