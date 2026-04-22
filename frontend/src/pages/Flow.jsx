import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import BrandBlob from '@/components/ui/BrandBlob'
import SectionHeader from '@/components/ui/SectionHeader'
import { classes } from '@/data/classes'
import styles from './Flow.module.css'

const flowClasses = classes.filter(c => c.type === 'Flow')

const values = [
  { num: '01', title: 'Pilates Mat', desc: 'Fortalece el core desde adentro. Trabajo profundo, respiración y conciencia corporal.' },
  { num: '02', title: 'Movimiento Consciente', desc: 'Cada movimiento tiene intención. Conectamos mente y cuerpo en cada secuencia.' },
  { num: '03', title: 'Meditación + Stretch', desc: 'Cerramos el ciclo. Liberamos tensión y creamos espacio para el bienestar emocional.' },
]

export default function Flow() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <BrandBlob className={styles.blob1} width={500} height={500} />
        <BrandBlob className={styles.blob2} width={300} height={300} opacity={0.20} />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <span className={styles.overline}>Casa Scarlatta · Movimiento consciente</span>
            <h1 className={styles.heroTitle}>Flow</h1>
            <p className={styles.heroSub}>
              Una experiencia transformadora que fusiona movimiento consciente,
              fuerza y meditación. Tu espacio para conectarte.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              <Button to="/reservar" size="lg">Reservar clase</Button>
              <Button to="/clases" variant="ghost" size="lg">Ver horarios</Button>
            </div>
          </div>
          <div className={styles.heroImageWrap}>
            <img
              src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=700&q=80"
              alt="Sala Flow — pilates y meditación"
              className={styles.heroImage}
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={styles.values}>
        <div className={styles.valuesInner}>
          <SectionHeader
            label="La práctica"
            title="Tres pilares del Flow"
            size="md"
          />
          <div className={styles.valuesGrid}>
            {values.map(({ num, title, desc }) => (
              <div key={num} className={styles.valueItem}>
                <span className={styles.valueNum}>{num}</span>
                <h3 className={styles.valueTitle}>{title}</h3>
                <p className={styles.valueDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Classes */}
      <section className={styles.classesSec}>
        <SectionHeader
          label="Horarios Flow"
          title="Encuentra tu clase"
          subtitle="Cupo máximo de 15 personas para garantizar atención personalizada."
          size="md"
        />
        <div className={styles.classesList}>
          {flowClasses.map((c, i) => (
            <div key={i} className={styles.classRow}>
              <div>
                <div className={styles.className}>{c.name}</div>
                <div className={styles.classMeta}>{c.day} · {c.time} · {c.duration} min · {c.instructor}</div>
              </div>
              <Link to="/reservar" className={styles.classReserve}>Reservar</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
