import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import BrandBlob from '@/components/ui/BrandBlob'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <BrandBlob className={styles.blob1} width={560} height={560} />
      <BrandBlob className={styles.blob2} width={340} height={340} opacity={0.18} />

      <div className={styles.inner}>
        <div className={styles.content}>
          <span className={styles.overline}>Wellness Studio · CDMX</span>

          <div className={styles.titleWrap}>
            <span className={styles.titleCasa}>casa</span>
            <span className={styles.titleScarlatta}>Scarlatta</span>
            <span className={styles.tagline}>Movimiento que transforma</span>
          </div>

          <p className={styles.desc}>
            Estudio boutique de movimiento enfocado en el bienestar integral.
            Dos salas, una experiencia. Elige tu ritmo.
          </p>

          <div className={styles.ctas}>
            <Button to="/reservar" size="lg">Reservar clase</Button>
            <Button to="/clases" variant="ghost" size="lg">Ver horarios</Button>
          </div>

          <div className={styles.services}>
            <div className={styles.serviceItem}>
              <span className={styles.serviceLabel}>Alta intensidad</span>
              <span className={styles.serviceName}>Suet</span>
            </div>
            <div className={styles.dividerV} />
            <div className={styles.serviceItem}>
              <span className={styles.serviceLabel}>Movimiento consciente</span>
              <span className={styles.serviceName}>Flow</span>
            </div>
          </div>
        </div>

        <div className={styles.imageWrap}>
          <img
            src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80"
            alt="Clase en Casa Scarlatta"
            className={styles.mainImage}
            loading="eager"
          />
          <div className={styles.floatCard}>
            <span className={styles.floatNumber}>+20</span>
            <span className={styles.floatText}>clases semanales</span>
          </div>
        </div>
      </div>

      <div className={styles.scrollHint}>
        <div className={styles.scrollLine} />
        <span>Explorar</span>
      </div>
    </section>
  )
}
