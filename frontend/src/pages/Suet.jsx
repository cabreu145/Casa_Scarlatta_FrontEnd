import { Link } from 'react-router-dom'
import { Zap, Music, Dumbbell, Timer, Flame, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import SectionHeader from '@/components/ui/SectionHeader'
import { classes } from '@/data/classes'
import styles from './Suet.module.css'

const features = [
  { icon: <Zap size={28} />, title: 'Alta intensidad', desc: 'Bloques de cardio y fuerza diseñados para maximizar resultados en cada sesión.' },
  { icon: <Music size={28} />, title: 'DJ en sala', desc: 'Música en vivo que sincroniza con tu ritmo. La energía de un club, la efectividad de un gym.' },
  { icon: <Dumbbell size={28} />, title: 'Equipo premium', desc: 'Treadmills, steps, rack de pesas y kettlebells. Todo lo que necesitas en un espacio.' },
  { icon: <Timer size={28} />, title: '45–50 min', desc: 'Clases cortas, efectivas e intensas. Optimizadas para resultados reales sin perder el tiempo.' },
  { icon: <Flame size={28} />, title: 'LED rojo', desc: 'Iluminación dramática que crea el ambiente perfecto para entrar en modo bestia.' },
  { icon: <Users size={28} />, title: 'Cupo limitado', desc: 'Máximo 20 personas. Atención personalizada y espacio garantizado en cada clase.' },
]

const suetClasses = classes.filter(c => c.type === 'Stride')

export default function Suet() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <img
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1400&q=80"
          alt="Sala Stride"
          className={styles.heroImage}
        />
        <div className={styles.redStripes} />
        <div className={styles.glow} />
        <div className={styles.heroContent}>
          <span className={styles.overline}>Casa Scarlatta · Alta intensidad</span>
          <h1 className={styles.heroTitle}>STRIDE</h1>
          <p className={styles.heroSub}>
            Entrenamiento que fusiona cardio y fuerza en bloques de alta
            intensidad con música envolvente. Aquí se suda de verdad.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <Button to="/reservar" size="lg" style={{ background: 'var(--suet-red)' }}>
              Reservar clase
            </Button>
            <Button to="/clases" variant="ghostLight" size="lg">
              Ver horarios
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className={styles.statsBar}>
        {[
          { num: '20', label: 'Cupo máximo' },
          { num: '45', label: 'Minutos' },
          { num: '+6', label: 'Clases por semana' },
          { num: '3', label: 'Instructores' },
        ].map(({ num, label }) => (
          <div key={label} className={styles.stat}>
            <span className={styles.statNum}>{num}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className={styles.features}>
        <SectionHeader
          label="La experiencia"
          title="Más que un gym"
          dark
          size="md"
        />
        <div className={styles.featuresGrid}>
          {features.map(({ icon, title, desc }) => (
            <div key={title} className={styles.featureCard}>
              <span className={styles.featureIcon}>{icon}</span>
              <h3 className={styles.featureTitle}>{title}</h3>
              <p className={styles.featureDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div className={styles.schedule}>
        <SectionHeader
          label="Horarios STRIDE"
          title="Próximas clases"
          dark
          size="md"
        />
        <div className={styles.classesList}>
          {suetClasses.map((c, i) => (
            <div key={i} className={styles.classRow}>
              <div className={styles.classInfo}>
                <span className={styles.className}>{c.name}</span>
                <span className={styles.classMeta}>{c.day} · {c.time} · {c.duration} min · {c.instructor}</span>
              </div>
              <Link to="/reservar" className={styles.classReserve}>Reservar</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
