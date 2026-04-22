import Button from '@/components/ui/Button'
import styles from './FlowPreview.module.css'

export default function FlowPreview() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.imgWrap}>
          <img
            src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=700&q=80"
            alt="Clase Flow — pilates y movimiento consciente"
            className={styles.mainImg}
            loading="lazy"
          />
          <img
            src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80"
            alt="Meditación en Flow"
            className={styles.secondImg}
            loading="lazy"
          />
        </div>

        <div className={styles.content}>
          <span className={styles.label}>Movimiento consciente</span>
          <h2 className={styles.title}>Flow</h2>
          <p className={styles.desc}>
            Una experiencia transformadora que fusiona movimiento consciente,
            fuerza y meditación. Ambiente zen, espacio de calma y presencia.
          </p>

          <div className={styles.pillars}>
            <div className={styles.pillar}>
              <span className={styles.pillarIcon}>♡</span>
              <span className={styles.pillarLabel}>Mind</span>
            </div>
            <div className={styles.divV} />
            <div className={styles.pillar}>
              <span className={styles.pillarIcon}>◡</span>
              <span className={styles.pillarLabel}>Body</span>
            </div>
            <div className={styles.divV} />
            <div className={styles.pillar}>
              <span className={styles.pillarIcon}>∿</span>
              <span className={styles.pillarLabel}>Flow</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
            <Button to="/flow">Conocer Flow</Button>
            <Button to="/reservar" variant="ghost">Reservar</Button>
          </div>
        </div>
      </div>
    </section>
  )
}
