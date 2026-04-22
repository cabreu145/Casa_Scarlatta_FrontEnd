import { Link } from 'react-router-dom'
import styles from './CoachesCtaSection.module.css'

export default function CoachesCtaSection() {
  return (
    <section className={styles.section}>
      <img
        src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1600&q=80"
        alt="Equipo de instructores Casa Scarlatta"
        className={styles.bg}
        loading="lazy"
      />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>
        <h2 className={styles.title}>Conoce a nuestro equipo</h2>
        <p className={styles.subtitle}>
          Instructores certificados, apasionados por el movimiento
        </p>
        <Link to="/nosotros" className={styles.cta}>Conócenos</Link>
      </div>
    </section>
  )
}
