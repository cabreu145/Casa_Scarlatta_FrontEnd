import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandBlob from '@/components/ui/BrandBlob'
import SectionHeader from '@/components/ui/SectionHeader'
import WeeklyCalendar from '@/features/clases/WeeklyCalendar'
import SeatSelector from '@/features/clases/SeatSelector'
import { classes } from '@/data/classes'
import styles from './Reservar.module.css'

const salas = [
  {
    key: 'Stride',
    logo: '/brand/STRYDE_X_T.png',
    logoAlt: 'STRYDE X',
    subtexto: 'Alta intensidad',
    img: '/fotos/stride-hero.jpg',
    alt: 'Sala Stride — alta intensidad',
  },
  {
    key: 'Slow',
    logo: '/brand/LOGO_SLOW.png',
    logoAlt: 'slow.',
    subtexto: 'Movimiento consciente',
    img: '/fotos/slow-hero.jpg',
    alt: 'Sala Slow — movimiento consciente',
  },
]

const stepLabels = ['Sala', 'Clase']

export default function Reservar() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)

  const filteredClasses = selectedType
    ? classes.filter(c => c.type === selectedType)
    : classes

  function selectSala(key) {
    navigate(`/clases?tipo=${key}`)
  }

  return (
    <main className={styles.page}>
      <BrandBlob className={styles.blob} width={500} height={500} />
      <div className={styles.inner}>
        <SectionHeader
          label="Reservar"
          title="Asegura tu lugar"
          subtitle="Cupos limitados. Cancela hasta 2 horas antes sin cargo."
          size="lg"
          titleStyle={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'normal',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
          }}
        />


        {/* Step 0: Sala */}
        {step === 0 && (
          <div className={styles.salaGrid}>
            {salas.map(({ key, logo, logoAlt, subtexto, img, alt }) => (
              <div
                key={key}
                className={styles.salaCard}
                onClick={() => selectSala(key)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && selectSala(key)}
                aria-label={`Reservar clase de ${logoAlt}`}
              >
                <img src={img} alt={alt} className={styles.salaImg} loading="lazy" />
                <div className={styles.salaOverlay} aria-hidden="true" />
                <div className={styles.salaContent}>
                  <span className={styles.salaSub}>{subtexto}</span>
                  <img src={logo} alt={logoAlt} className={styles.salaLogo} draggable="false" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Calendario filtrado */}
        {step === 1 && (
          <div className={styles.calendarStep}>
            <div className={styles.calendarHeader}>
              <button
                className={styles.backBtn}
                onClick={() => { setStep(0); setSelectedType(null) }}
              >
                ← Cambiar sala
              </button>
              <span className={styles.calendarType}>
                {selectedType === 'Stride' ? 'STRIDE' : 'SLOW'}
              </span>
            </div>
            <WeeklyCalendar
              classes={filteredClasses}
              onSelectClass={setSelectedClass}
            />
          </div>
        )}
      </div>

      {/* SeatSelector modal — navega a /login al confirmar */}
      {selectedClass && (
        <SeatSelector
          cls={selectedClass}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </main>
  )
}
