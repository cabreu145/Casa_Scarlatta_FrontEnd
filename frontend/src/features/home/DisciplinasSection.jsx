import { useNavigate } from 'react-router-dom'
import styles from './DisciplinasSection.module.css'

const disciplinas = [
  {
    key: 'stride',
    nombre: 'STRIDE',
    subtexto: 'Alta intensidad',
    ruta: '/clases?tipo=stride',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    alt: 'Sala Stride — treadmills con iluminación LED roja',
  },
  {
    key: 'slow',
    nombre: 'SLOW',
    subtexto: 'Movimiento consciente',
    ruta: '/clases?tipo=slow',
    img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80',
    alt: 'Sala Slow — pilates y movimiento consciente',
  },
]

export default function DisciplinasSection() {
  const navigate = useNavigate()

  return (
    <section className={styles.wrapper}>
      <div className={styles.intro}>
        <span className={styles.introLabel}>DISCIPLINES</span>
        <h2 className={styles.introTitle}>
          Move with Purpose,<br />Live with Intention.
        </h2>
      </div>
      <div className={styles.cardsRow}>
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
      </div>
    </section>
  )
}
