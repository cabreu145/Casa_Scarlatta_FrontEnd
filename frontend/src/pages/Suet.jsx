import { Music, Zap, Target, Heart, Dumbbell, Flame, Brain, CheckCircle, ArrowRight, Calendar } from 'lucide-react'
import Button from '@/components/ui/Button'
import ExpandButton from '@/components/ui/ExpandButton'
import styles from './Suet.module.css'

export default function Suet() {
  return (
    <div className={styles.page}>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <img src="/fotos/gym_banner_stryde.jpg" alt="Sala Stryde" className={styles.heroImage} />
        <div className={styles.glow} />
        <div className={styles.heroContent}>
          <div className={styles.logoGroup}>
            <span className={styles.overline}>Casa Scarlatta &mdash; Alta Intensidad</span>
            <img src="/brand/STRYDE_X_T.png" alt="Stryde" className={styles.heroLogo} />
            <span className={styles.logoTagline}>Stronger Every Stryde</span>
          </div>
          <p className={styles.heroSub}>
            Entrenamiento de alto rendimiento que fusiona cardio y fuerza en bloques de
            alta intensidad con música envolvente.
          </p>
          <p className={styles.heroSubSmall}>
            Mejora tu resistencia. Tonifica tu cuerpo. Eleva tu disciplina.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <Button to="/clases?tipo=Stride" size="lg" style={{ background: 'var(--suet-red)' }}>
              Reservar clase
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

      {/* ROW 1 — Concepto / Experiencia / Quote */}
      <div className={styles.gridRow1}>
        {/* Panel: Concepto */}
        <div className={styles.panelConcepto}>
          <img src="/fotos/stride-hero.jpg" alt="" className={styles.panelBg} />
          <div className={styles.panelOverlay} />
          <div className={styles.panelConceptoContent}>
            <span className={styles.secLabel}>Concepto</span>
            <h2 className={styles.conceptoTitle}>
              La fuerza<br />no se encuentra.<br />Se construye.
            </h2>
            <p className={styles.conceptoText}>
              <strong>STRYDE X</strong> es más que una clase.<br />
              Es disciplina en movimiento.<br />
              Es el compromiso que transforma<br />tu cuerpo y tu mente.
            </p>
          </div>
        </div>

        {/* Panel: Experiencia */}
        <div className={styles.panelExperiencia}>
          <span className={styles.secLabel}>Experiencia</span>
          <div className={styles.expItems}>
            <div className={styles.expItem}>
              <Music size={20} className={styles.expIcon} />
              <div>
                <h4 className={styles.expTitle}>Música envolvente</h4>
                <p className={styles.expDesc}>Que marca el ritmo de cada repetición.</p>
              </div>
            </div>
            <div className={styles.expItem}>
              <Zap size={20} className={styles.expIcon} />
              <div>
                <h4 className={styles.expTitle}>Ambiente energético</h4>
                <p className={styles.expDesc}>Luz, sonido y diseño que te impulsan.</p>
              </div>
            </div>
            <div className={styles.expItem}>
              <Target size={20} className={styles.expIcon} />
              <div>
                <h4 className={styles.expTitle}>Enfoque total</h4>
                <p className={styles.expDesc}>Un espacio creado para superar tus límites.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel: Quote con foto */}
        <div className={styles.panelQuote}>
          <img src="/fotos/gym_banner_stryde.jpg" alt="" className={styles.panelBg} />
          <div className={styles.panelQuoteOverlay} />
          <div className={styles.panelQuoteContent}>
            <span className={styles.bigQuoteMark}>&ldquo;</span>
            <p className={styles.quoteText}>
              Cada bloque te acerca a tu mejor versión.
            </p>
          </div>
        </div>
      </div>

      {/* ROW 2 — Metodología / Beneficios */}
      <div className={styles.gridRow2}>
        {/* Panel: Metodología */}
        <div className={styles.panelMetodologia}>
          <span className={styles.secLabel}>Metodología</span>
          <p className={styles.metSubtitle}>Entrenamiento en bloques de alta intensidad</p>
          <div className={styles.metFlow}>
            <div className={styles.metStep}>
              <Heart size={28} className={styles.metIcon} />
              <h4 className={styles.metStepTitle}>Cardio</h4>
              <p className={styles.metStepDesc}>Intervalos de alta intensidad que elevan tu capacidad cardiovascular.</p>
            </div>
            <ArrowRight size={20} className={styles.metArrow} />
            <div className={styles.metStep}>
              <Dumbbell size={28} className={styles.metIcon} />
              <h4 className={styles.metStepTitle}>Fuerza</h4>
              <p className={styles.metStepDesc}>Movimientos funcionales que desarrollan fuerza, potencia y tonicidad muscular.</p>
            </div>
            <ArrowRight size={20} className={styles.metArrow} />
            <div className={styles.metStep}>
              <Target size={28} className={styles.metIcon} />
              <h4 className={styles.metStepTitle}>Resistencia</h4>
              <p className={styles.metStepDesc}>Secuencias continuas para mejorar tu rendimiento y llevarte al siguiente nivel.</p>
            </div>
          </div>
          <p className={styles.metConclusion}>Todo en una sesión. &nbsp;Máximo rendimiento.</p>
        </div>

        {/* Panel: Beneficios */}
        <div className={styles.panelBeneficios}>
          <span className={styles.secLabel}>Beneficios</span>
          <div className={styles.benRow}>
            <div className={styles.benItem}>
              <Flame size={28} className={styles.benIcon} />
              <p className={styles.benLabel}>Aumento de fuerza y tonificación</p>
            </div>
            <div className={styles.benItem}>
              <Heart size={28} className={styles.benIcon} />
              <p className={styles.benLabel}>Mejora de resistencia física</p>
            </div>
            <div className={styles.benItem}>
              <Zap size={28} className={styles.benIcon} />
              <p className={styles.benLabel}>Alto gasto calórico</p>
            </div>
            <div className={styles.benItem}>
              <Brain size={28} className={styles.benIcon} />
              <p className={styles.benLabel}>Mayor disciplina y enfoque mental</p>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3 — Ideal para ti */}
      <div className={styles.idealSection}>
        <span className={styles.secLabel}>Ideal para ti si…</span>
        <ul className={styles.idealList}>
          {[
            'Buscas resultados visibles.',
            'Disfrutas los retos físicos.',
            'Quieres estructura y progreso.',
            'Valoras la estética y la experiencia.',
          ].map(item => (
            <li key={item} className={styles.idealItem}>
              <CheckCircle size={16} className={styles.idealIcon} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}
