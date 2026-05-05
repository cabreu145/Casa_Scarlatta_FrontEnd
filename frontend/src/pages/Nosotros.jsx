import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useCoachesStore } from '../stores/coachesStore'
import styles from './Nosotros.module.css'

const carouselImages = [
  '/fotos/team_laughing.jpg',
  '/fotos/team_scene_2.jpg',
  '/fotos/team_scene_3.jpg',
  '/fotos/team_scene_4.jpg',
]

export default function Nosotros() {
  const { coaches: todosCoaches } = useCoachesStore()
  const coaches = todosCoaches.filter((c) => c.activo !== false)
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
          {coaches.map((coach) => {
            const inicial = coach.nombre.trim().charAt(0).toUpperCase()
            const bio     = coach.bio || 'Instructor de Casa Scarlatta'
            const badge   = coach.especialidad ? `Especialidad · ${coach.especialidad}` : 'Casa Scarlatta'
            return (
              <div key={coach.id} className={styles.coachCard}>
                {coach.foto ? (
                  <img src={coach.foto} alt={coach.nombre} className={styles.coachImg} loading="lazy" />
                ) : (
                  <div className={styles.coachImg} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--color-primary, #C1121F)',
                    color: '#fff',
                    fontSize: 48,
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    userSelect: 'none',
                  }}>
                    {inicial}
                  </div>
                )}
                <div className={styles.coachBottom}>
                  <span className={styles.coachBadge}>{badge}</span>
                  <h3 className={styles.coachName}>{coach.nombre}</h3>
                </div>
                <div className={styles.coachOverlay}>
                  <p className={styles.coachBio}>{bio}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

    </main>
  )
}
