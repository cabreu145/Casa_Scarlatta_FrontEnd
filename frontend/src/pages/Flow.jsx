import { Wind, Heart, Brain, Leaf, Moon, Activity, CheckCircle, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import styles from './Flow.module.css'

export default function Flow() {
  return (
    <div className={styles.page}>

      {/* Hero */}
      <section className={styles.hero}>
        <img src="/fotos/yoga_studio.jpg" alt="" className={styles.heroBgImg} />
        <div className={styles.heroBgOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.logoGroup}>
            <span className={styles.overline}>Casa Scarlatta &mdash; Movimiento Consciente</span>
            <img src="/brand/LOGO_SLOW.png" alt="Slow" className={styles.heroLogo} />
            <span className={styles.logoTagline}>Movement &nbsp;·&nbsp; Breath &nbsp;·&nbsp; Presence</span>
          </div>
          <p className={styles.heroSub}>
            Movimiento consciente que combina fuerza, respiración y energía
            para alinear cuerpo, mente y espíritu.
          </p>
          <p className={styles.heroSlogan}>Fluye. Respira. Conecta contigo.</p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <Button to="/clases?tipo=Slow" size="lg">Reservar clase</Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className={styles.statsBar}>
        {[
          { num: '15', label: 'Cupo máximo' },
          { num: '60', label: 'Minutos' },
          { num: '+5', label: 'Clases por semana' },
          { num: '2', label: 'Instructoras' },
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
          <img src="/fotos/yoga_women.jpg" alt="" className={styles.panelBg} />
          <div className={styles.panelOverlay} />
          <div className={styles.panelConceptoContent}>
            <span className={styles.secLabel}>Concepto</span>
            <h2 className={styles.conceptoTitle}>
              El movimiento<br />que restaura.<br />La calma<br />que transforma.
            </h2>
            <p className={styles.conceptoText}>
              <strong>SLOW</strong> es la práctica que devuelve el equilibrio.<br />
              Cada clase es un espacio seguro para escuchar tu cuerpo y reconectar con tu centro.
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
                <p className={styles.expDesc}>La respiración guía cada movimiento. Es el hilo que conecta cuerpo y mente.</p>
              </div>
            </div>
            <div className={styles.expItem}>
              <Leaf size={20} className={styles.expIcon} />
              <div>
                <h4 className={styles.expTitle}>Movimiento con intención</h4>
                <p className={styles.expDesc}>Cada secuencia tiene propósito. Nada es casual, todo suma a tu bienestar.</p>
              </div>
            </div>
            <div className={styles.expItem}>
              <Moon size={20} className={styles.expIcon} />
              <div>
                <h4 className={styles.expTitle}>Presencia total</h4>
                <p className={styles.expDesc}>Un espacio para desconectar del ruido y volver a ti, clase a clase.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel: Quote */}
        <div className={styles.panelQuote}>
          <img src="/fotos/yoga_studio.jpg" alt="" className={styles.panelBg} />
          <div className={styles.panelQuoteOverlay} />
          <div className={styles.panelQuoteContent}>
            <span className={styles.bigQuoteMark}>&ldquo;</span>
            <p className={styles.quoteText}>Cada respiración es un paso hacia ti.</p>
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
              <h4 className={styles.metStepTitle}>Pilates Mat</h4>
              <p className={styles.metStepDesc}>Fortalece el core desde adentro. Trabajo profundo y conciencia corporal.</p>
            </div>
            <ArrowRight size={20} className={styles.metArrow} />
            <div className={styles.metStep}>
              <Wind size={28} className={styles.metIcon} />
              <h4 className={styles.metStepTitle}>Movimiento Consciente</h4>
              <p className={styles.metStepDesc}>Cada movimiento tiene intención. Conectamos mente y cuerpo en cada secuencia.</p>
            </div>
            <ArrowRight size={20} className={styles.metArrow} />
            <div className={styles.metStep}>
              <Moon size={28} className={styles.metIcon} />
              <h4 className={styles.metStepTitle}>Meditación + Stretch</h4>
              <p className={styles.metStepDesc}>Cerramos el ciclo. Liberamos tensión y creamos espacio para el bienestar emocional.</p>
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
              <p className={styles.benLabel}>Core fortalecido y postura mejorada</p>
            </div>
            <div className={styles.benItem}>
              <Heart size={28} className={styles.benIcon} />
              <p className={styles.benLabel}>Equilibrio cuerpo, mente y emoción</p>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3 — Ideal para ti */}
      <div className={styles.idealSection}>
        <span className={styles.secLabel}>Ideal para ti si…</span>
        <ul className={styles.idealList}>
          {[
            'Buscas calma y bienestar real.',
            'Quieres fortalecer tu core.',
            'Valoras el movimiento consciente.',
            'Necesitas desconectar y reconectar.',
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
