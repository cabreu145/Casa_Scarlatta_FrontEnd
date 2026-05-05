import Button from '@/components/ui/Button'
import styles from './SuetPreview.module.css'

export default function SuetPreview() {
  return (
    <section className={styles.section}>
      <div className={styles.redGlow} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.content}>
          <span className={styles.label}>Alta intensidad</span>
          <h2 className={styles.title}>STRIDE</h2>
          <p className={styles.desc}>
            Entrenamiento que fusiona cardio y fuerza en bloques de alta
            intensidad con música envolvente. DJ en vivo, LED rojo, energía total.
          </p>
          <div className={styles.features}>
            {['Cardio + Fuerza', 'DJ en sala', 'Iluminación LED', 'Cupo limitado'].map(f => (
              <div key={f} className={styles.featureItem}>
                <span className={styles.featureDot} />
                {f}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)' }}>
            <Button to="/suet" variant="primary">Conocer STRIDE</Button>
            <Button to="/reservar" variant="ghostLight">Reservar</Button>
          </div>
        </div>

        <div className={styles.imgGrid}>
          <div className={styles.imgWrap}>
            <img
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80"
              alt="Sala STRIDE — treadmills con iluminación roja"
              loading="lazy"
            />
          </div>
          <div className={styles.imgWrap}>
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80"
              alt="Entrenamiento de alta intensidad"
              loading="lazy"
            />
          </div>
          <div className={styles.imgWrap}>
            <img
              src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&q=80"
              alt="Pesas y equipamiento Suet"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
