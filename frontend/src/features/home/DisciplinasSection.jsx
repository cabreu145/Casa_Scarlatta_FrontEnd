import { useNavigate } from 'react-router-dom'
import styles from './DisciplinasSection.module.css'

const disciplinas = [
  {
    key: 'suet',
    nombre: 'Suet',
    subtexto: 'Alta intensidad',
    ruta: '/suet',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    alt: 'Sala Suet — treadmills con iluminación LED roja',
  },
  {
    key: 'flow',
    nombre: 'Flow',
    subtexto: 'Movimiento consciente',
    ruta: '/flow',
    img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80',
    alt: 'Sala Flow — pilates y movimiento consciente',
  },
]

export default function DisciplinasSection() {
  const navigate = useNavigate()

  return (
    <section className={styles.section}>
      {disciplinas.map(({ key, nombre, subtexto, ruta, img, alt }) => (
        <div
          key={key}
          className={styles.card}
          onClick={() => navigate(ruta)}
          role="link"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate(ruta)}
          aria-label={`Ir a ${nombre}`}
        >
          <img src={img} alt={alt} className={styles.cardImg} loading="lazy" />
          <div className={styles.cardOverlay} aria-hidden="true" />
          <div className={styles.cardContent}>
            <span className={styles.cardSub}>{subtexto}</span>
            <h2 className={styles.cardTitle}>{nombre}</h2>
          </div>
          <div className={styles.hoverCta} aria-hidden="true">
            <span>Conocer más</span>
          </div>
        </div>
      ))}
    </section>
  )
}
