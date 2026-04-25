import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const Dithering = lazy(() =>
  import('@paper-design/shaders-react').then(mod => ({ default: mod.Dithering }))
)

const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)

const IconFacebook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
)

const IconYoutube = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
)

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <Suspense fallback={null}>
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0, opacity: 0.15,
        }}>
          <Dithering
            colorBack="#00000000"
            colorFront="#C0392B"
            shape="warp"
            type="4x4"
            speed={0.15}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </Suspense>
      <div className={styles.inner} style={{ position: 'relative', zIndex: 1 }}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link to="/">
              <img
                src="/brand/CASA_SCARLATTA_ISOTIPO.png"
                alt="Casa Scarlatta"
                draggable="false"
                className={styles.footerLogo}
              />
            </Link>
            <p className={styles.tagline}>
              Estudio de movimiento enfocado en el bienestar integral.<br />
              Mind · Body · Flow
            </p>
          </div>

          <div>
            <p className={styles.colTitle}>Estudio</p>
            <ul className={styles.colLinks}>
              <li><Link to="/suet">Stryde X </Link></li>
              <li><Link to="/flow">Slow </Link></li>
              <li><Link to="/clases">Clases</Link></li>
              <li><Link to="/nosotros">Nosotros</Link></li>
            </ul>
          </div>

          <div>
            <p className={styles.colTitle}>Visítanos</p>
            <ul className={styles.colLinks}>
              <li><Link to="/reservar">Reservar clase</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
              <li><a href="#membresias">Paquetes</a></li>
            </ul>
          </div>

          <div>
            <p className={styles.colTitle}>Horarios</p>
            <div className={styles.schedule}>
              <div className={styles.scheduleRow}>
                <span>Lun — Vie</span>
                <span>6:00 – 21:00</span>
              </div>
              <div className={styles.scheduleRow}>
                <span>Sábado</span>
                <span>7:00 – 18:00</span>
              </div>
              <div className={styles.scheduleRow}>
                <span>Domingo</span>
                <span>8:00 – 14:00</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            © {year} Casa Scarlatta Wellness Studio · Todos los derechos reservados
          </p>
          <div className={styles.social}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Instagram"
            >
              <IconInstagram />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Facebook"
            >
              <IconFacebook />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="YouTube"
            >
              <IconYoutube />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
