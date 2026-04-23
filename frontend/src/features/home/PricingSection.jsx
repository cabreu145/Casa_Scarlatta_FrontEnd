import styles from './PricingSection.module.css'

const plans = [
  {
    key: 'basico',
    nombre: 'Básico',
    precio: '$999',
    clases: '8 clases',
    destacado: false,
    beneficios: [
      '8 clases al mes',
      'Acceso a Stride y Slow',
      'App de reservas',
      'Sin permanencia',
    ],
  },
  {
    key: 'esencial',
    nombre: 'Esencial',
    precio: '$1,499',
    clases: '16 clases',
    destacado: true,
    beneficios: [
      '16 clases al mes',
      'Acceso prioritario',
      'Clase de bienvenida gratis',
      'Descuentos en talleres',
      'Sin permanencia',
    ],
  },
  {
    key: 'premium',
    nombre: 'Premium',
    precio: '$1,999',
    clases: 'Ilimitadas',
    destacado: false,
    beneficios: [
      'Clases ilimitadas',
      'Acceso VIP a todos los horarios',
      'Clase privada mensual',
      'Descuentos exclusivos',
      'Soporte prioritario',
    ],
  },
]

export default function PricingSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.label}>MEMBRESÍAS</span>
          <h2 className={styles.title}>Elige tu plan</h2>
        </div>
        <div className={styles.grid}>
          {plans.map(({ key, nombre, precio, clases, destacado, beneficios }) => (
            <div
              key={key}
              className={`${styles.card} ${destacado ? styles.cardFeatured : ''}`}
            >
              {destacado && (
                <div className={styles.badge}>MÁS POPULAR</div>
              )}
              <div className={styles.planName}>{nombre}</div>
              <div className={styles.priceRow}>
                <span className={styles.price}>{precio}</span>
                <span className={styles.priceSuffix}>/mes</span>
              </div>
              <div className={styles.clasesLabel}>{clases}</div>
              <ul className={styles.beneficios}>
                {beneficios.map(b => (
                  <li key={b} className={styles.beneficio}>
                    <span className={styles.bullet}>●</span>
                    {b}
                  </li>
                ))}
              </ul>
              <button className={`${styles.cta} ${destacado ? styles.ctaFeatured : ''}`}>
                Comenzar
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
