import { useState, useEffect } from 'react'
import BrandBlob from '@/components/ui/BrandBlob'
import SectionHeader from '@/components/ui/SectionHeader'
import styles from './Nosotros.module.css'

const instructors = [
  {
    name: 'Sofía Reyes',
    badge: 'SLOW · PILATES MAT',
    bio: 'Instructora certificada de pilates con 8 años de experiencia. Especialista en movimiento consciente y rehabilitación.',
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80',
  },
  {
    name: 'Carlos Méndez',
    badge: 'STRIDE · ALTA INTENSIDAD',
    bio: 'Entrenador personal con certificación en HIIT y entrenamiento funcional. Creador del método STRIDE.',
    img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&q=80',
  },
  {
    name: 'Valentina Cruz',
    badge: 'SLOW · MEDITACIÓN',
    bio: 'Maestra de yoga y meditación. Combina la práctica ancestral con técnicas modernas de bienestar.',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80',
  },
  {
    name: 'Ana Torres',
    badge: 'STRIDE · FUNCIONAL',
    bio: 'Especialista en entrenamiento funcional y fuerza. Apasionada por ayudar a sus estudiantes a superar sus límites.',
    img: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=600&q=80',
  },
  {
    name: 'Miguel Herrera',
    badge: 'STRIDE · CARDIO',
    bio: 'Ex atleta profesional reconvertido en coach. Su energía es contagiosa y sus clases son un reto constante.',
    img: 'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=600&q=80',
  },
  {
    name: 'Daniela Morales',
    badge: 'SLOW · RESPIRACIÓN',
    bio: 'Coach de bienestar holístico. Especializada en técnicas de respiración y movimiento restaurativo.',
    img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&q=80',
  },
]

const VISIBLE = 3

function chunk(arr, size) {
  const result = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

export default function Nosotros() {
  const pages = chunk(instructors, VISIBLE)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPage((p) => (p + 1) % pages.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [pages.length])

  return (
    <main>
      {/* Historia */}
      <section className={styles.hero}>
        <BrandBlob className={styles.blob} width={500} height={500} />
        <div className={styles.heroInner}>
          <div className={styles.storyContent}>
            <SectionHeader
              label="Nuestra historia"
              title="Un espacio creado con propósito"
              size="lg"
            />
            <p className={styles.storyText}>
              Casa Scarlatta nació del deseo de crear un lugar donde el movimiento
              sea más que ejercicio. Un espacio boutique donde cada persona encuentre
              su ritmo, su método y su comunidad.
            </p>
            <p className={styles.storyText}>
              Dos salas, dos experiencias, un mismo propósito: transformar cuerpos
              y mentes a través del movimiento consciente e intencional.
            </p>
            <p className={styles.storyText}>
              Creemos que el bienestar no es un destino — es un camino que se
              recorre día a día, clase a clase.
            </p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=700&q=80"
            alt="Casa Scarlatta Wellness Studio"
            className={styles.storyImage}
            loading="lazy"
          />
        </div>
      </section>

      {/* Banner coaches */}
      <div className={styles.coachesBanner}>
        <div className={styles.coachesBannerContent}>
          <span className={styles.coachesBannerLabel}>NUESTRO EQUIPO</span>
          <h2 className={styles.coachesBannerTitle}>COACHES</h2>
        </div>
      </div>

      {/* Carrusel de coaches */}
      <section className={styles.team}>
        <div className={styles.teamInner}>
          <div key={page} className={styles.teamGrid}>
            {pages[page].map(({ name, badge, bio, img }) => (
              <div key={name} className={styles.instructorCard}>
                <img src={img} alt={name} className={styles.instructorImg} loading="lazy" />
                <div className={styles.instructorBottom}>
                  <span className={styles.instructorRole}>{badge}</span>
                  <h3 className={styles.instructorName}>{name}</h3>
                </div>
                <div className={styles.instructorOverlay}>
                  <p className={styles.instructorBio}>{bio}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className={styles.dots}>
            {pages.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === page ? styles.dotActive : ''}`}
                onClick={() => setPage(i)}
                aria-label={`Grupo ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
