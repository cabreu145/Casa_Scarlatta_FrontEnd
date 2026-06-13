import { Wind, Heart, Brain, Leaf, Moon, Activity, CheckCircle, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import styles from './Yoga.module.css'

export default function Yoga() {
  return (
    <div className={styles.page}>

      {/* Hero */}
      <section className={styles.hero}>
        <img src="/fotos/yoga_studio2.png" alt="" className={styles.heroBgImg} />
        <div className={styles.heroBgOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.logoGroup}>
            <span className={styles.overline}>Casa Scarlatta &mdash; Equilibrio Mente-Cuerpo</span>
            <img src="/brand/LOGO_YOGA.png" alt="Yoga" className={styles.heroLogo} />
            <span className={styles.logoTagline}>Movement &nbsp;·&nbsp; Breath &nbsp;·&nbsp; Balance</span>
          </div>
          <p className={styles.heroSub}>
            movimiento consciente, respiración y presencia para fortalecer el cuerpo, calmar la mente y cultivar bienestar desde el interior.
          </p>
          <p className={styles.heroSlogan}>Respira profundo. Muévete con intención. Habita el presente.</p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginLeft: '50px' }}>
            <Button to="/clases?tipo=Slow" size="lg">Reservar clase</Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className={styles.statsBar}>
        {[
          { num: '9', label: 'Cupo máximo' },
          { num: '45', label: 'Minutos' },
        ].map(({ num, label }) => (
          <div key={label} className={styles.stat}>
            <span className={styles.statNum}>{num}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* ROW 1 — Concepto / Filosofía / Quote */}
      <div className={styles.gridRow1}>

        {/* Panel: Concepto */}
        <div className={styles.panelConcepto}>
          <img src="/fotos/yoga_position.png" alt="" className={styles.panelBg} />
          <div className={styles.panelOverlay} />
          <div className={styles.panelConceptoContent}>
            <span className={styles.secLabel}>Concepto</span>
            <h2 className={styles.conceptoTitle}>
              El movimiento<br />que restaura.<br />La calma<br />que transforma.
            </h2>
            <p className={styles.conceptoText}>
              <strong>YOGA</strong> es un espacio para reconectar contigo, desarrollar fuerza consciente y encontrar calma en medio del movimiento.<br />
              Cada clase combina respiración, alineación y fluidez para crear una experiencia completa de bienestar físico y mental.
            </p>
          </div>
        </div>

        {/* Panel: Filosofía */}
        <div className={styles.panelFilosofia}>
          <span className={styles.secLabel}>Filosofía</span>
          <div className={styles.expItems}>
            <div className={styles.expItem}>
              <Wind size={20} className={styles.expIcon} />
              <div>
                <h4 className={styles.expTitle}>Respiración consciente</h4>
                <p className={styles.expDesc}>La respiración guía cada movimiento y ayuda a mantener la atención en el presente.</p>
              </div>
            </div>
            <div className={styles.expItem}>
              <Leaf size={20} className={styles.expIcon} />
              <div>
                <h4 className={styles.expTitle}>Movimiento con propósito</h4>
                <p className={styles.expDesc}>Cada postura tiene una intención: fortalecer, abrir, estabilizar o restaurar.</p>
              </div>
            </div>
            <div className={styles.expItem}>
              <Moon size={20} className={styles.expIcon} />
              <div>
                <h4 className={styles.expTitle}>Presencia plena</h4>
                <p className={styles.expDesc}>La práctica invita a reducir el ruido mental y conectar con el aquí y ahora.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel: Quote */}
        <div className={styles.panelQuote}>
          <img src="/fotos/yoga_studio3.png" alt="" className={styles.panelBg} />
          <div className={styles.panelQuoteOverlay} />
          <div className={styles.panelQuoteContent}>
            <span className={styles.bigQuoteMark}>&ldquo;</span>
            <p className={styles.quoteText}>Cada respiración es una oportunidad para volver a ti.</p>
          </div>
        </div>
      </div>

      {/* ROW 2 — Metodología / Beneficios */}
      <div className={styles.gridRow2}>

        {/* Panel: Metodología */}
        <div className={styles.panelMetodologia}>
          <span className={styles.secLabel}>Metodología</span>
          <p className={styles.metSubtitle}>Tres momentos que transforman tu práctica</p>
          <div className={styles.metFlow}>
            <div className={styles.metStep}>
              <Activity size={28} className={styles.metIcon} />
              <h4 className={styles.metStepTitle}>Centrado y Respiración</h4>
              <p className={styles.metStepDesc}>Comenzamos conectando con la respiración para preparar cuerpo y mente.</p>
            </div>
            <ArrowRight size={20} className={styles.metArrow} />
            <div className={styles.metStep}>
              <Wind size={28} className={styles.metIcon} />
              <h4 className={styles.metStepTitle}>Secuencia de Asanas</h4>
              <p className={styles.metStepDesc}>Fluimos entre posturas que desarrollan fuerza, movilidad, equilibrio y estabilidad.</p>
            </div>
            <ArrowRight size={20} className={styles.metArrow} />
            <div className={styles.metStep}>
              <Moon size={28} className={styles.metIcon} />
              <h4 className={styles.metStepTitle}>Relajación y Meditación</h4>
              <p className={styles.metStepDesc}>Finalizamos con estiramientos suaves y una relajación guiada para integrar la práctica.</p>
            </div>
          </div>
          <p className={styles.metConclusion}>Un ciclo completo. &nbsp;Cuerpo y mente en equilibrio.</p>
        </div>

        {/* Panel: Beneficios */}
        <div className={styles.panelBeneficios}>
          <span className={styles.secLabel}>Beneficios</span>
          <div className={styles.benRow}>
            <div className={styles.benItem}>
              <Leaf size={28} className={styles.benIcon} />
              <p className={styles.benLabel}>Mayor flexibilidad y movilidad</p>
            </div>
            <div className={styles.benItem}>
              <Brain size={28} className={styles.benIcon} />
              <p className={styles.benLabel}>Gestión del estrés y ansiedad</p>
            </div>
            <div className={styles.benItem}>
              <Activity size={28} className={styles.benIcon} />
              <p className={styles.benLabel}>Fuerza y estabilidad</p>
            </div>
            <div className={styles.benItem}>
              <Heart size={28} className={styles.benIcon} />
              <p className={styles.benLabel}>Equilibrio cuerpo, mente y espíritu.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3 — Ideal para ti */}
      <div className={styles.idealSection}>
        <span className={styles.secLabel}>Ideal para ti si…</span>
        <ul className={styles.idealList}>
          {[
            'Buscas reducir el estrés diario.',
            'Quieres mejorar tu flexibilidad.',
            'Deseas fortalecer tu cuerpo de forma consciente.',
            'Te interesa desarrollar equilibrio físico y mental.'
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
