import SectionHeader from '@/components/ui/SectionHeader'
import Button from '@/components/ui/Button'
import styles from './MoodGallery.module.css'

const images = [
  { src: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=700&q=80', alt: 'Clase en Casa Scarlatta' },
  { src: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80', alt: 'Movimiento consciente' },
  { src: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&q=80', alt: 'Pilates mat' },
  { src: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80', alt: 'Entrenamiento' },
  { src: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&q=80', alt: 'Wellness studio' },
]

export default function MoodGallery() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <SectionHeader
            label="Nuestro espacio"
            title="El lugar donde todo cambia"
            size="md"
          />
          <Button to="/nosotros" variant="ghost">Ver más</Button>
        </div>

        <div className={styles.grid}>
          {images.map(({ src, alt }, i) => (
            <div key={i} className={styles.item}>
              <img src={src} alt={alt} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
