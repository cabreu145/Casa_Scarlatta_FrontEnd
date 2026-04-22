import BrandBlob from '@/components/ui/BrandBlob'
import styles from './PropositoSection.module.css'

const pillars = [
  {
    num: '01',
    title: 'Equilibrio',
    desc: 'Integramos cuerpo, mente y emoción en cada sesión para crear bienestar real.',
  },
  {
    num: '02',
    title: 'Constancia',
    desc: 'El movimiento regular transforma. Construimos hábitos que duran toda la vida.',
  },
  {
    num: '03',
    title: 'Autocuidado',
    desc: 'Cada clase es un espacio para ti. Sin juicios, sin prisa, solo presencia.',
  },
]

export default function PropositoSection() {
  return (
    <section className={styles.section}>
      <BrandBlob className={styles.blob} width={700} height={700} opacity={0.18} />
      <div className={styles.inner}>
        <span className={styles.label}>Nuestro propósito</span>
        <h2 className={styles.title}>
          Crear un espacio donde el movimiento<br />
          se convierte en bienestar
        </h2>
        <p className={styles.desc}>
          Fomentamos el equilibrio, la constancia y el autocuidado.
          Un lugar donde cada persona encuentra su ritmo.
        </p>

        <div className={styles.pillars}>
          {pillars.map(({ num, title, desc }) => (
            <div key={num} className={styles.pillar}>
              <span className={styles.pillarNum}>{num}</span>
              <h3 className={styles.pillarTitle}>{title}</h3>
              <p className={styles.pillarDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
