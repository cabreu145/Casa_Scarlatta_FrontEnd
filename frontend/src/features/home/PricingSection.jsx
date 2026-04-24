import { Link } from 'react-router-dom'
import { usePaquetesStore } from '@/stores/paquetesStore'
import styles from './PricingSection.module.css'

export default function PricingSection() {
  const { paquetes } = usePaquetesStore()

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.label}>MEMBRESÍAS</span>
          <h2 className={styles.title}>Elige tu Paquete</h2>
        </div>
        <div className={styles.grid}>
          {paquetes.map((p) => (
            <div
              key={p.id}
              className={`${styles.card} ${p.destacado ? styles.cardFeatured : ''}`}
            >
              {p.destacado && (
                <div className={styles.badge}>MÁS POPULAR</div>
              )}
              <div className={styles.planName}>{p.nombre}</div>
              <div className={styles.priceRow}>
                <span className={styles.price}>${p.precio.toLocaleString()}</span>
                <span className={styles.priceSuffix}>/mes</span>
              </div>
              <div className={styles.clasesLabel}>
                {p.clases === 0 ? 'Ilimitadas' : `${p.clases} clases`}
              </div>
              <ul className={styles.beneficios}>
                {p.beneficios.map((b) => (
                  <li key={b} className={styles.beneficio}>
                    <span className={styles.bullet}>●</span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className={`${styles.cta} ${p.destacado ? styles.ctaFeatured : ''}`}
              >
                Comenzar
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
