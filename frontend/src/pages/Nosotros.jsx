import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styles from './Nosotros.module.css'

const carouselImages = [
  '/fotos/team_laughing.jpg',
  '/fotos/team_scene_2.jpg',
  '/fotos/team_scene_3.jpg',
  '/fotos/team_scene_4.jpg',
]

const coaches = [
  { name: 'Mafer', badge: 'Especialidad · placeholder', bio: 'Descripción placeholder — agrega aquí la biografía y especialidades de Mafer.', img: '/fotos/mafer_coach.jpg' },
  { name: 'Majo',  badge: 'Especialidad · placeholder', bio: 'Descripción placeholder — agrega aquí la biografía y especialidades de Majo.',  img: '/fotos/majo_coach.jpg'  },
  { name: 'Mali',  badge: 'Especialidad · placeholder', bio: 'Descripción placeholder — agrega aquí la biografía y especialidades de Mali.',  img: '/fotos/mali_coach.jpg'  },
  { name: 'Daya',  badge: 'Especialidad · placeholder', bio: 'Descripción placeholder — agrega aquí la biografía y especialidades de Daya.',  img: '/fotos/daya_coach.jpg'  },
  { name: 'Coste', badge: 'Especialidad · placeholder', bio: 'Descripción placeholder — agrega aquí la biografía y especialidades de Coste.', img: '/fotos/coste_coach.jpg' },
]

export default function Nosotros() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => setCurrent(c => (c + 1) % carouselImages.length), [])

  useEffect(() => {
    const t = setInterval(next, 4500)
    return () => clearInterval(t)
  }, [next])

  return (
    <main className={styles.page}>

      {/* SECCIÓN 1 — HISTORIA */}
      <section className={styles.historia}>

        {/* Imagen — izquierda */}
        <div className={styles.carouselWrap}>
          <div className={styles.carouselTrack}>
            {carouselImages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                className={`${styles.carouselImg} ${i === current ? styles.carouselImgActive : ''}`}
              />
            ))}
            <div className={styles.imageOverlay} />
          </div>
          <div className={styles.carouselDots}>
            {carouselImages.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Texto — derecha */}
        <div className={styles.historiaContent}>
          <div className={styles.historiaText}>

            <h1 className={styles.historiaTitle}>
              Creemos en el equilibrio entre fluidez y fuerza, entre disciplina y presencia.
            </h1>

            <div className={styles.divider} />
            <p className={styles.experienceText}>Arrive. Breathe. Move. Connect. Transform.</p>


          </div>
        </div>
      </section>

      {/* SECCIÓN 2 — COACHES */}
      <section className={styles.coachesSec}>
        <div className={styles.coachesHeader}>
          <span className={styles.coachesLabel}>Nuestro equipo</span>
          <h2 className={styles.coachesTitle}>COACHES</h2>
          <div className={styles.coachesDivider} />
        </div>
        <div className={styles.coachesGrid}>
          {coaches.map(({ name, badge, bio, img }) => (
            <div key={name} className={styles.coachCard}>
              <img src={img} alt={name} className={styles.coachImg} loading="lazy" />
              <div className={styles.coachBottom}>
                <span className={styles.coachBadge}>{badge}</span>
                <h3 className={styles.coachName}>{name}</h3>
              </div>
              <div className={styles.coachOverlay}>
                <p className={styles.coachBio}>{bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  )
}
