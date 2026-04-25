import { useNavigate } from 'react-router-dom'
import MotionButton from '@/components/ui/MotionButton'
import styles from './CoachesCtaSection.module.css'

export default function CoachesCtaSection() {
  const navigate = useNavigate()

  return (
    <section className={styles.section}>
      <img
        src="/fotos/coaches_banner.jpg"
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
        <MotionButton label="Conócenos" onClick={() => navigate('/nosotros')} />
      </div>
    </section>
  )
}
