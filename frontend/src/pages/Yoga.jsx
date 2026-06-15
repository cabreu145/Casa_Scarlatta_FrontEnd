import { Wind, Heart, Brain, Leaf, Moon, Activity, CheckCircle, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useEffectiveSiteConfiguration } from '@/hooks/useSiteConfiguration'
import { getPublicPageConfig, resolveSiteMediaUrl } from '@/adapters/siteConfigurationAdapter'
import styles from './Yoga.module.css'

function renderTextBlock(value) {
  return String(value ?? '')
    .split('\n')
    .filter(Boolean)
    .map((line, index, array) => (
      <span key={`${line}-${index}`}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ))
}

export default function Yoga() {
  const site = useEffectiveSiteConfiguration()
  const page = getPublicPageConfig(site.config, 'yoga')
  const hero = page.hero ?? {}
  const sections = Object.fromEntries((page.sections ?? []).map((section) => [section.id, section]))
  const concept = sections.concept ?? {}
  const philosophy = sections.philosophy ?? {}
  const quote = sections.quote ?? {}
  const methodology = sections.methodology ?? {}
  const benefits = sections.benefits ?? {}
  const ideal = sections.ideal ?? {}

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <img src={resolveSiteMediaUrl(hero.image)} alt={hero.imageAlt ?? ''} className={styles.heroBgImg} />
        <div className={styles.heroBgOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.logoGroup}>
            <span className={styles.overline}>{hero.overline}</span>
            <img src={resolveSiteMediaUrl(hero.logo)} alt={hero.logoAlt ?? 'Yoga'} className={styles.heroLogo} />
            <span className={styles.logoTagline}>{hero.tagline}</span>
          </div>
          <p className={styles.heroSub}>{hero.subtitle}</p>
          <p className={styles.heroSlogan}>{hero.slogan}</p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginLeft: '50px' }}>
            {(hero.ctas?.length ? hero.ctas : [{ label: 'Reservar clase', to: '/clases?tipo=Slow' }]).map((cta) => (
              <Button key={`${cta.label}-${cta.to}`} to={cta.to} size="lg">{cta.label}</Button>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.statsBar}>
        {(page.stats ?? []).map(({ value, label }) => (
          <div key={label} className={styles.stat}>
            <span className={styles.statNum}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      <div className={styles.gridRow1}>
        <div className={styles.panelConcepto}>
          <img src={resolveSiteMediaUrl(concept.media)} alt="" className={styles.panelBg} />
          <div className={styles.panelOverlay} />
          <div className={styles.panelConceptoContent}>
            <span className={styles.secLabel}>{concept.title}</span>
            <h2 className={styles.conceptoTitle}>
              {renderTextBlock(concept.heading)}
            </h2>
            <p className={styles.conceptoText}>
              {renderTextBlock(concept.body)}
            </p>
          </div>
        </div>

        <div className={styles.panelFilosofia}>
          <span className={styles.secLabel}>{philosophy.title}</span>
          <div className={styles.expItems}>
            {(philosophy.items ?? []).map((item) => {
              const icon = item.title?.toLowerCase().includes('respir') ? Wind : item.title?.toLowerCase().includes('movimiento') ? Leaf : Moon
              const Icon = icon
              return (
                <div key={item.title} className={styles.expItem}>
                  <Icon size={20} className={styles.expIcon} />
                  <div>
                    <h4 className={styles.expTitle}>{item.title}</h4>
                    <p className={styles.expDesc}>{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.panelQuote}>
          <img src={resolveSiteMediaUrl(quote.media)} alt="" className={styles.panelBg} />
          <div className={styles.panelQuoteOverlay} />
          <div className={styles.panelQuoteContent}>
            <span className={styles.bigQuoteMark}>&ldquo;</span>
            <p className={styles.quoteText}>{quote.body}</p>
          </div>
        </div>
      </div>

      <div className={styles.gridRow2}>
        <div className={styles.panelMetodologia}>
          <span className={styles.secLabel}>{methodology.title}</span>
          <p className={styles.metSubtitle}>{methodology.subtitle}</p>
          <div className={styles.metFlow}>
            {(methodology.steps ?? []).map((step, index) => {
              const icons = [Activity, Wind, Moon]
              const Icon = icons[index] ?? Activity
              return (
                <span key={step.title} style={{ display: 'contents' }}>
                  <div className={styles.metStep}>
                    <Icon size={28} className={styles.metIcon} />
                    <h4 className={styles.metStepTitle}>{step.title}</h4>
                    <p className={styles.metStepDesc}>{step.description}</p>
                  </div>
                  {index < (methodology.steps ?? []).length - 1 && <ArrowRight size={20} className={styles.metArrow} />}
                </span>
              )
            })}
          </div>
          <p className={styles.metConclusion}>{methodology.conclusion}</p>
        </div>

        <div className={styles.panelBeneficios}>
          <span className={styles.secLabel}>{benefits.title}</span>
          <div className={styles.benRow}>
            {(benefits.items ?? []).map((item, index) => {
              const icons = [Leaf, Brain, Activity, Heart]
              const Icon = icons[index] ?? CheckCircle
              return (
                <div key={item.title} className={styles.benItem}>
                  <Icon size={28} className={styles.benIcon} />
                  <p className={styles.benLabel}>{item.title}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={styles.idealSection}>
        <span className={styles.secLabel}>{ideal.title}</span>
        <ul className={styles.idealList}>
          {(ideal.items ?? []).map((item) => (
            <li key={item.title} className={styles.idealItem}>
              <CheckCircle size={16} className={styles.idealIcon} />
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
