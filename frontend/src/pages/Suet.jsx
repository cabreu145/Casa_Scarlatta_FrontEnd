import { Music, Zap, Target, Heart, Dumbbell, Flame, Brain, CheckCircle, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useEffectiveSiteConfiguration } from '@/hooks/useSiteConfiguration'
import { getPublicPageConfig, resolveSiteMediaUrl } from '@/adapters/siteConfigurationAdapter'
import styles from './Suet.module.css'

function textLines(value) {
  return String(value ?? '')
    .split('\n')
    .filter(Boolean)
}

function renderTextBlock(value) {
  return textLines(value).map((line, index) => (
    <span key={`${line}-${index}`}>
      {line}
      {index < textLines(value).length - 1 && <br />}
    </span>
  ))
}

export default function Suet() {
  const site = useEffectiveSiteConfiguration()
  const page = getPublicPageConfig(site.config, 'suet')
  const hero = page.hero ?? {}
  const sections = Object.fromEntries((page.sections ?? []).map((section) => [section.id, section]))
  const concept = sections.concept ?? {}
  const experience = sections.experience ?? {}
  const quote = sections.quote ?? {}
  const methodology = sections.methodology ?? {}
  const benefits = sections.benefits ?? {}
  const ideal = sections.ideal ?? {}
  const heroImage = resolveSiteMediaUrl(hero.image)
  const heroLogo = resolveSiteMediaUrl(hero.logo)
  const conceptImage = resolveSiteMediaUrl(concept.media)
  const quoteImage = resolveSiteMediaUrl(quote.media)

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <img src={heroImage} alt={hero.imageAlt ?? 'Sala Stryde'} className={styles.heroImage} />
        <div className={styles.glow} />
        <div className={styles.heroContent}>
          <div className={styles.logoGroup}>
            <span className={styles.overline}>{hero.overline}</span>
            <img src={heroLogo} alt={hero.logoAlt ?? 'Stryde'} className={styles.heroLogo} />
            <span className={styles.logoTagline}>{hero.tagline}</span>
          </div>
          <p className={styles.heroSub}>{hero.subtitle}</p>
          <p className={styles.heroSubSmall}>{hero.slogan}</p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {(hero.ctas?.length ? hero.ctas : [{ label: 'Reservar clase', to: '/clases?tipo=Stride' }]).map((cta) => (
              <Button key={`${cta.label}-${cta.to}`} to={cta.to} size="lg" style={{ background: 'var(--suet-red)' }}>
                {cta.label}
              </Button>
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
          <img src={conceptImage} alt="" className={styles.panelBg} />
          <div className={styles.panelOverlay} />
          <div className={styles.panelConceptoContent}>
            <span className={styles.secLabel}>{concept.title}</span>
            <h2 className={styles.conceptoTitle}>
              {renderTextBlock(concept.heading)}
            </h2>
            <p className={styles.conceptoText}>{renderTextBlock(concept.body)}</p>
          </div>
        </div>

        <div className={styles.panelExperiencia}>
          <span className={styles.secLabel}>{experience.title}</span>
          <div className={styles.expItems}>
            {(experience.items ?? []).map((item) => {
              const icon = item.title?.toLowerCase().includes('música')
                ? Music
                : item.title?.toLowerCase().includes('energ')
                  ? Zap
                  : Target
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
          <img src={quoteImage} alt="" className={styles.panelBg} />
          <div className={styles.panelQuoteOverlay} />
          <div className={styles.panelQuoteContent}>
            <span className={styles.bigQuoteMark}>&ldquo;</span>
            <p className={styles.quoteText}>{quote.quote}</p>
          </div>
        </div>
      </div>

      <div className={styles.gridRow2}>
        <div className={styles.panelMetodologia}>
          <span className={styles.secLabel}>{methodology.title}</span>
          <p className={styles.metSubtitle}>{methodology.subtitle}</p>
          <div className={styles.metFlow}>
            {(methodology.steps ?? []).map((step, index) => {
              const icons = [Heart, Dumbbell, Target]
              const Icon = icons[index] ?? Target
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
              const icons = [Flame, Heart, Zap, Brain]
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
