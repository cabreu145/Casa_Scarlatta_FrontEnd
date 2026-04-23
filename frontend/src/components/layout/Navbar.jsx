import { useState, useEffect, lazy, Suspense } from 'react' // useState kept for mobile menu
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import LiquidButton from '@/components/ui/LiquidButton'
import styles from './Navbar.module.css'

const Dithering = lazy(() =>
  import('@paper-design/shaders-react').then(mod => ({ default: mod.Dithering }))
)

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/clases', label: 'Clases' },
  { to: '/suet', label: 'Suet' },
  { to: '/flow', label: 'Flow' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

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

          <LiquidButton onClick={() => navigate('/reservar')}>Reservar</LiquidButton>

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
          <li>
            <Link
              to="/reservar"
              className={`${styles.mobileNavLink} ${styles.mobileNavCta}`}
              onClick={() => setOpen(false)}
            >
              Reservar
            </Link>
          </li>
        </ul>
      </div>
    </>
  )
}
