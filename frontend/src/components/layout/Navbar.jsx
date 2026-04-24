import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import LiquidButton from '@/components/ui/LiquidButton'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import styles from './Navbar.module.css'

const Dithering = lazy(() =>
  import('@paper-design/shaders-react').then(mod => ({ default: mod.Dithering }))
)

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/clases', label: 'Clases' },
  { to: '/suet', label: 'Stride' },
  { to: '/flow', label: 'Slow' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
]

const rolDashboard = {
  cliente: '/cliente/dashboard',
  coach: '/coach/dashboard',
  admin: '/admin/dashboard',
}

const rolLabel = {
  cliente: 'Cliente',
  coach: 'Coach',
  admin: 'Admin',
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, usuario, logout } = useAuth()
  const dropdownRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    setOpen(false)
    setDropdownOpen(false)
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
    toast.success('Sesión cerrada')
    navigate('/')
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
            <span className={styles.logoCasa}>casa</span>
            <span className={styles.logoScarlatta}>Scarlatta</span>
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
            <div className={styles.avatarWrapper} ref={dropdownRef}>
              <button
                className={styles.avatar}
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label="Menú de usuario"
              >
                {usuario.nombre.charAt(0).toUpperCase()}
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
          ) : (
            <LiquidButton onClick={() => navigate('/login')}>Iniciar sesión</LiquidButton>
          )}

          <button
            className={styles.menuBtn}
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      <div className={`${styles.mobileNav} ${open ? styles.open : ''}`}>
        <button
          className={styles.mobileClose}
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
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
                  Cerrar sesión
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
