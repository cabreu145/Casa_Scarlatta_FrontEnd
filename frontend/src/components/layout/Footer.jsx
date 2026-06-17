import { lazy, Suspense, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useEffectiveSiteConfiguration } from '@/hooks/useSiteConfiguration'
import { getFooterConfig, resolveSiteMediaUrl } from '@/adapters/siteConfigurationAdapter'
import styles from './Footer.module.css'

const Dithering = lazy(() =>
  import('@paper-design/shaders-react').then((mod) => ({ default: mod.Dithering }))
)

const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const IconFacebook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

const IconYoutube = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
)

function FooterLinkList({ title, links = [] }) {
  return (
    <div>
      <p className={styles.colTitle}>{title}</p>
      <ul className={styles.colLinks}>
        {links.map((item) => {
          const rawTo = String(item?.to ?? item?.href ?? item?.url ?? '').trim()
          const isExternal = /^https?:\/\//i.test(rawTo)
          const label = item?.label ?? rawTo
          if (!rawTo) return null
          return (
            <li key={`${title}-${label}`}>
              {isExternal ? (
                <a href={rawTo} target="_blank" rel="noreferrer">
                  {label}
                </a>
              ) : (
                <Link to={rawTo}>{label}</Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function Footer() {
  const site = useEffectiveSiteConfiguration()
  const footer = useMemo(() => getFooterConfig(site.config), [site.config])
  const year = new Date().getFullYear()
  const brandLogo = resolveSiteMediaUrl(footer.brand?.logo)

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
                src={brandLogo}
                alt="Casa Scarlatta"
                width={70}
                height={47}
                draggable="false"
                className={styles.footerLogo}
              />
            </Link>
            <p className={styles.tagline}>
              {(footer.brand?.tagline ?? '').split('\n').map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index === 0 && <br />}
                </span>
              ))}
            </p>
            {footer.contact?.address && (
              <p style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                {footer.contact.address}
              </p>
            )}
          </div>

          <FooterLinkList title="Estudio" links={footer.links?.studio ?? []} />

          <FooterLinkList title="Visítanos" links={footer.links?.visit ?? []} />

          <div>
            <p className={styles.colTitle}>Horarios</p>
            <div className={styles.schedule}>
              {(footer.scheduleRows ?? []).map((row) => (
                <div key={`${row.label}-${row.value}`} className={styles.scheduleRow}>
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
            {(footer.contact?.phone || footer.contact?.email) && (
              <div style={{ marginTop: 16, display: 'grid', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                {footer.contact.phone && <span>{footer.contact.phone}</span>}
                {footer.contact.email && <span>{footer.contact.email}</span>}
              </div>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            © {year} Casa Scarlatta Wellness Studio · Todos los derechos reservados
          </p>
          <div className={styles.social}>
            {footer.social?.instagramUrl && (
              <a
                href={footer.social.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Instagram"
              >
                <IconInstagram />
              </a>
            )}
            {footer.social?.facebookUrl && (
              <a
                href={footer.social.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Facebook"
              >
                <IconFacebook />
              </a>
            )}
            {footer.social?.youtubeUrl && (
              <a
                href={footer.social.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="YouTube"
              >
                <IconYoutube />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
