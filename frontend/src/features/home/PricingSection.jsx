import { Link } from 'react-router-dom'
import { usePaquetesStore } from '@/stores/paquetesStore'
import { useAuth } from '@/context/AuthContext'
import styles from './PricingSection.module.css'

export default function PricingSection() {
  const { paquetes } = usePaquetesStore()
  const { isAuthenticated } = useAuth()
  const mensuales = paquetes.filter((p) => p.categoria === 'mensual')

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.label}>MEMBRESÍAS</span>
          <h2 className={styles.title}>Elige tu Paquete</h2>
          <p className={styles.subtitle}>
            Suscripciones mensuales sin permanencia. Cancela cuando quieras.
          </p>
        </div>

        <div className={styles.grid}>
          {mensuales.map((p) => (
            <PaqueteCard key={p.id} p={p} destino={isAuthenticated ? '/cliente/pagos' : '/login'} />
          ))}
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>¿Prefieres clases sueltas?</p>
          <Link to={isAuthenticated ? '/cliente/pagos' : '/login'} className={styles.footerLink}>
            Ver todos los paquetes →
          </Link>
        </div>
      </div>
    </section>
  )
}

function PaqueteCard({ p, destino }) {
  const esFeatured = p.destacado
  const clasesDisplay = p.clases === 0 ? '∞' : p.clases
  const clasesLabel = p.clases === 0 ? 'Ilimitadas' : p.clases === 1 ? 'Clase' : 'Clases'

  return (
    <div className={`${styles.card} ${esFeatured ? styles.cardFeatured : ''}`}>
      {esFeatured && <div className={styles.badge}>MÁS POPULAR</div>}

      {/* Big class count */}
      <div className={styles.countBlock}>
        <span className={styles.countNum}>{clasesDisplay}</span>
        <span className={styles.countLabel}>{clasesLabel}</span>
      </div>

      <div className={styles.divider} />

      {/* Package info */}
      <div className={styles.planName}>{p.nombre}</div>

      <div className={styles.priceRow}>
        <span className={styles.price}>${p.precio.toLocaleString()}</span>
        <span className={styles.priceSuffix}> MX /mes</span>
      </div>

      <ul className={styles.beneficios}>
        {p.beneficios.map((b) => (
          <li key={b} className={styles.beneficio}>
            <span className={styles.check} aria-hidden="true">✓</span>
            {b}
          </li>
        ))}
      </ul>

      <Link
        to={destino}
        className={`${styles.cta} ${esFeatured ? styles.ctaFeatured : ''}`}
      >
        Comenzar
      </Link>
    </div>
  )
}
