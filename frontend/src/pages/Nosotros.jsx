import BrandBlob from '@/components/ui/BrandBlob'
import SectionHeader from '@/components/ui/SectionHeader'
import styles from './Nosotros.module.css'

const instructors = [
  {
    name: 'Sofía Reyes',
    role: 'Flow · Pilates Mat',
    type: 'flow',
    badge: 'FLOW · PILATES MAT',
    bio: 'Instructora certificada de pilates con 8 años de experiencia. Especialista en movimiento consciente y rehabilitación.',
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80',
  },
  {
    name: 'Carlos Méndez',
    role: 'Suet · Alta intensidad',
    type: 'suet',
    badge: 'SUET · ALTA INTENSIDAD',
    bio: 'Entrenador personal con certificación en HIIT y entrenamiento funcional. Creador del método Suet.',
    img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&q=80',
  },
  {
    name: 'Valentina Cruz',
    role: 'Flow · Meditación',
    type: 'flow',
    badge: 'FLOW · MEDITACIÓN',
    bio: 'Maestra de yoga y meditación. Combina la práctica ancestral con técnicas modernas de bienestar.',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80',
  },
]

export default function Nosotros() {
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

      {/* Banner grupal */}
      <div className={styles.groupBanner}>
        <img
          src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1600&q=80"
          alt="Equipo de instructores Casa Scarlatta"
          className={styles.groupBannerImg}
          loading="lazy"
        />
        <div className={styles.groupBannerOverlay} aria-hidden="true" />
        <p className={styles.groupBannerText}>Nuestro equipo</p>
      </div>

      {/* Equipo */}
      <section className={styles.team}>
        <div className={styles.teamInner}>
          <SectionHeader
            label="Instructores"
            title="Quienes guían el camino"
            subtitle="Certificados, apasionados por el movimiento y el bienestar de sus estudiantes."
            size="md"
          />
          <div className={styles.teamGrid}>
            {instructors.map(({ name, type, badge, bio, img }) => (
              <div key={name} className={styles.instructorCard}>
                <div className={styles.imgWrap}>
                  <img
                    src={img}
                    alt={name}
                    className={styles.instructorImg}
                    loading="lazy"
                  />
                </div>
                <div className={styles.instructorBody}>
                  <h3 className={styles.instructorName}>{name}</h3>
                  <span className={`${styles.badge} ${styles['badge_' + type]}`}>
                    {badge}
                  </span>
                  <p className={styles.instructorBio}>{bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
