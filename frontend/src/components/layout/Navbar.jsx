import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import LiquidButton from '@/components/ui/LiquidButton'
import styles from './Navbar.module.css'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/clases', label: 'Clases' },
  { to: '/suet', label: 'Suet' },
  { to: '/flow', label: 'Flow' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isHome = location.pathname === '/'
  const isLight = isHome && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <>
      <nav className={[
        styles.navbar,
        scrolled ? styles.scrolled : '',
        isLight ? styles.light : '',
      ].join(' ')}>
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
                  {label}
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
