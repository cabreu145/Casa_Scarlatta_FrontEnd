import { Link } from 'react-router-dom'
import { LayoutDashboard, BookOpen, CreditCard, User } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { useClasesStore } from '@/stores/clasesStore'
import styles from '@/styles/dashboard.module.css'
import localStyles from './ClienteDashboard.module.css'

export const clienteLinks = [
  { to: '/cliente/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cliente/mis-clases', icon: BookOpen, label: 'Mis Clases' },
  { to: '/cliente/perfil', icon: User, label: 'Mi Perfil' },
  { to: '/cliente/pagos', icon: CreditCard, label: 'Pagos y Paquetes' },
]

export default function ClienteDashboard() {
  const { usuario } = useAuth()
  const { getReservasByUsuario } = useClasesStore()
  const reservas = getReservasByUsuario(usuario?.id)
  const proxima = reservas.find((r) => r.estado === 'confirmada')
  const recientes = reservas.slice(-3).reverse()

  const clases = usuario?.clasesPaquete
  const esIlimitado = usuario?.paquete === 'Premium' || clases === 999
  const pocasClases = !esIlimitado && clases !== undefined && clases !== null && clases <= 2 && clases > 0
  const sinClases = !esIlimitado && clases !== undefined && clases !== null && clases === 0 && usuario?.paquete

  const hoy = new Date().toISOString().split('T')[0]
  const esNuevo = usuario?.fechaRegistro === hoy

  const pct = !esIlimitado && usuario?.clasesPaqueteTotal
    ? Math.round((clases / usuario.clasesPaqueteTotal) * 100)
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

        {/* Alertas inteligentes */}
        {esNuevo && (
          <div className={localStyles.banner} style={{ background: 'rgba(37, 99, 235, 0.08)', borderColor: 'rgba(37, 99, 235, 0.3)', color: '#1e40af' }}>
            <span>¡Bienvenida a Casa Scarlatta! 🎉 Reserva tu primera clase.</span>
            <Link to="/reservar" className={localStyles.bannerBtn} style={{ color: '#1e40af', borderColor: '#1e40af' }}>
              Ver clases
            </Link>
          </div>
        )}

        {pocasClases && (
          <div className={localStyles.banner} style={{ background: 'rgba(202, 138, 4, 0.08)', borderColor: 'rgba(202, 138, 4, 0.3)', color: '#92400e' }}>
            <span>⚠ Te quedan solo <strong>{clases}</strong> {clases === 1 ? 'clase' : 'clases'}. ¡Renueva tu paquete para seguir entrenando!</span>
            <Link to="/cliente/pagos" className={localStyles.bannerBtn} style={{ color: '#92400e', borderColor: '#92400e' }}>
              Ver paquetes
            </Link>
          </div>
        )}

        {sinClases && (
          <div className={localStyles.banner} style={{ background: 'rgba(200, 50, 50, 0.08)', borderColor: 'rgba(200, 50, 50, 0.3)', color: '#991b1b' }}>
            <span>Tu paquete está agotado. Renueva para volver a reservar.</span>
            <Link to="/cliente/pagos" className={localStyles.bannerBtn} style={{ color: '#991b1b', borderColor: '#991b1b' }}>
              Renovar ahora
            </Link>
          </div>
        )}

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Clases disponibles</div>
            <div className={styles.statValue}>
              {esIlimitado ? '∞' : (clases ?? '—')}
            </div>
            {!esIlimitado && usuario?.clasesPaqueteTotal > 0 && (
              <>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                </div>
                <div className={styles.statSub}>{clases} de {usuario.clasesPaqueteTotal} restantes</div>
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
            <Link to="/reservar" className={`${styles.btn} ${styles.btnPrimary}`}>
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
