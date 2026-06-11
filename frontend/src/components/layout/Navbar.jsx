import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Menu, X } from 'lucide-react'
import LiquidButton from '@/components/ui/LiquidButton'
import CoachAvatar from '@/components/common/CoachAvatar'
import { useAuth } from '@/context/AuthContext'
import { useCoachesStore } from '@/stores/coachesStore'
import {
  usePublicCoachesQuery,
  useUnreadNotificationsCountQuery,
} from '@/hooks/useApiQueries'
import NotificationsPanel from './NotificationsPanel'
import { ROUTES } from '@/constants/routes'
import toast from 'react-hot-toast'
import styles from './Navbar.module.css'

const Dithering = lazy(() =>
  import('@paper-design/shaders-react').then(mod => ({ default: mod.Dithering }))
)

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/clases', label: 'Clases' },
  { to: '/suet', label: 'Stryde' },
  { to: '/flow', label: 'Slow' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
]

const rolDashboard = {
  cliente: ROUTES.cliente.dashboard,
  coach: ROUTES.coach.dashboard,
  admin: ROUTES.admin.dashboard,
  cajero_pos: ROUTES.cajero.dashboard,
}

const rolLabel = {
  cliente: 'Cliente',
  coach: 'Coach',
  admin: 'Admin',
  cajero_pos: 'Cajero POS',
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, usuario, logout } = useAuth()
  const coaches = useCoachesStore((s) => s.coaches)
  const publicCoachesQuery = usePublicCoachesQuery({ enabled: import.meta.env.VITE_USE_API_AUTH === 'true' && usuario?.rol === 'coach' })
  const unreadNotificationsQuery = useUnreadNotificationsCountQuery({
    enabled: Boolean(isAuthenticated),
    refetchInterval: 60_000,
  })
  const dropdownRef = useRef(null)

  const coachSource = import.meta.env.VITE_USE_API_AUTH === 'true'
    ? (publicCoachesQuery.data ?? [])
    : coaches
  const coachMatch = usuario?.rol === 'coach'
    ? coachSource.find((c) =>
      c.email === usuario.email ||
      String(c.userId ?? c.user_id ?? '') === String(usuario?.id ?? '') ||
      String(c.coachId ?? c.id ?? '') === String(usuario?.coachId ?? '') ||
      c.nombre === usuario?.nombre ||
      c.name === usuario?.nombre
    )
    : null
  const avatarFoto = coachMatch?.avatarUrl ?? coachMatch?.foto ?? null

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    setOpen(false)
    setDropdownOpen(false)
    setNotificationsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    toast.success('Sesion cerrada')
    navigate('/')
  }

  const handleMenuToggle = () => {
    setOpen((prev) => !prev)
  }

  return (
    <>
      <nav className={styles.navbar}>
        <Suspense fallback={null}>
          <div style={{
            position: 'absolute', inset: 0,
            pointerEvents: 'none', zIndex: 0, opacity: 0.18,
          }}>
            <Dithering
              colorBack="#00000000"
              colorFront="#7B1F2E"
              shape="warp"
              type="4x4"
              speed={0.12}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </Suspense>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            <img
              src="/brand/CASA_SCARLATTA_ISOTIPO.png"
              alt="Casa Scarlatta"
              draggable="false"
              className={styles.navLogo}
            />
          </Link>

          <ul className={styles.nav}>
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `${styles.navLink}${isActive ? ' ' + styles.active : ''}`
                  }
                >
                  <span className={styles.linkText}>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {isAuthenticated && usuario ? (
            <>
              <div className={styles.notifWrapper}>
                <button
                  type="button"
                  className={styles.notifButton}
                  onClick={() => setNotificationsOpen((value) => !value)}
                  aria-label="Notificaciones"
                  aria-expanded={notificationsOpen}
                >
                  <Bell size={18} />
                  {(unreadNotificationsQuery.data?.unreadCount ?? 0) > 0 && (
                    <span className={styles.notifBadge}>
                      {unreadNotificationsQuery.data.unreadCount}
                    </span>
                  )}
                </button>
              </div>
              <div className={styles.avatarWrapper} ref={dropdownRef}>
              <button
                className={styles.avatar}
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label="Menu de usuario"
              >
                <CoachAvatar
                  name={usuario.nombre}
                  avatarUrl={avatarFoto}
                  size={36}
                  objectPosition="top center"
                />
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownName}>{usuario.nombre}</span>
                    <span className={styles.dropdownRole}>{rolLabel[usuario.rol] || usuario.rol}</span>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={styles.dropdownItem}
                    onClick={() => navigate(rolDashboard[usuario.rol] || '/')}
                  >
                    Mi dashboard
                  </button>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
            </>
          ) : (
            <LiquidButton onClick={() => navigate(ROUTES.login)}>Iniciar Sesión</LiquidButton>
          )}

          <button
            className={styles.menuBtn}
            onClick={handleMenuToggle}
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      <NotificationsPanel
        open={notificationsOpen && isAuthenticated}
        onClose={() => setNotificationsOpen(false)}
        enabled={Boolean(isAuthenticated)}
      />

      <div
        id="mobile-navigation"
        className={`${styles.mobileNav} ${open ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <button
          className={styles.mobileClose}
          onClick={() => setOpen(false)}
          aria-label="Cerrar menu"
        >
          <X size={28} />
        </button>
        <ul className={styles.mobileLinks}>
          {links.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `${styles.mobileNavLink}${isActive ? ' ' + styles.mobileActive : ''}`
                }
                onClick={() => setOpen(false)}
              >
                {label}
              </NavLink>
            </li>
          ))}
          {isAuthenticated && usuario ? (
            <>
              <li>
                <button
                  className={`${styles.mobileNavLink} ${styles.mobileNavCta}`}
                  onClick={() => { setOpen(false); navigate(rolDashboard[usuario.rol] || '/') }}
                >
                  Mi dashboard
                </button>
              </li>
              <li>
                <button
                  className={styles.mobileNavLink}
                  style={{ fontSize: 18, color: 'var(--text-muted)' }}
                  onClick={() => { setOpen(false); handleLogout() }}
                >
                  Cerrar Sesión
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                to="/reservar"
                className={`${styles.mobileNavLink} ${styles.mobileNavCta}`}
                onClick={() => setOpen(false)}
              >
                Reservar
              </Link>
            </li>
          )}
        </ul>
      </div>
    </>
  )
}
