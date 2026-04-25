import { useNavigate } from 'react-router-dom'
import MotionButton from '@/components/ui/MotionButton'
import styles from './DisciplinasSection.module.css'

const disciplinas = [
  {
    key: 'stride',
    logo: '/brand/STRYDE_X_T.png',
    logoAlt: 'STRYDE X',
    subtexto: 'Alta intensidad',
    ruta: '/clases?tipo=Stride',
    rutaInfo: '/suet',
    img: '/fotos/stride-hero.jpg',
    alt: 'Sala Stride — treadmills con iluminación LED roja',
  },
  {
    key: 'slow',
    logo: '/brand/LOGO_SLOW.png',
    logoAlt: 'slow.',
    subtexto: 'Movimiento consciente',
    ruta: '/clases?tipo=Slow',
    rutaInfo: '/flow',
    img: '/fotos/slow-hero.jpg',
    alt: 'Sala Slow — pilates y movimiento consciente',
  },
]

export default function DisciplinasSection() {
  const navigate = useNavigate()

  return (
    <section className={styles.wrapper}>
      <div className={styles.intro}>
        <h2 className={styles.introTitle}>
          IT'S NOT JUST<br />MOVEMENT
        </h2>
        <p className={styles.introSub}>IT'S A CONNECTION</p>
      </div>
      <div className={styles.cardsRow}>
        {disciplinas.map(({ key, logo, logoAlt, subtexto, ruta, rutaInfo, img, alt }) => (
          <div
            key={key}
            className={styles.card}
            onClick={() => navigate(ruta)}
            role="link"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate(ruta)}
            aria-label={`Ir a clases de ${logoAlt}`}
          >
            <img src={img} alt={alt} className={styles.cardImg} loading="eager" fetchPriority="high" />
            <div className={styles.cardOverlay} aria-hidden="true" />
            <div className={styles.cardMotionBtn} onClick={e => { e.stopPropagation(); navigate(rutaInfo) }}>
              <MotionButton label="Conocer más" onClick={() => navigate(rutaInfo)} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardSub}>{subtexto}</span>
              <img
                src={logo}
                alt={logoAlt}
                className={styles.cardLogo}
                draggable="false"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
