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
    nombre: 'Stride',
    subtexto: 'Alta intensidad',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    alt: 'Sala Stride — alta intensidad',
  },
  {
    key: 'Slow',
    nombre: 'SLOW',
    subtexto: 'Movimiento consciente',
    img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80',
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
    setSelectedType(key)
    setStep(1)
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
        />

        {/* Steps indicator */}
        <div className={styles.steps}>
          {stepLabels.map((label, i) => (
            <div key={label} style={{ display: 'contents' }}>
              <div className={`${styles.step} ${i === step ? styles.active : ''} ${i < step ? styles.done : ''}`}>
                <div className={styles.stepNum}>{i < step ? '✓' : i + 1}</div>
                {label}
              </div>
              {i < stepLabels.length - 1 && <div className={styles.stepLine} />}
            </div>
          ))}
        </div>

        {/* Step 0: Sala */}
        {step === 0 && (
          <div className={styles.salaGrid}>
            {salas.map(({ key, nombre, subtexto, img, alt }) => (
              <div
                key={key}
                className={styles.salaCard}
                onClick={() => selectSala(key)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && selectSala(key)}
                aria-label={`Reservar clase de ${nombre}`}
              >
                <img src={img} alt={alt} className={styles.salaImg} loading="lazy" />
                <div className={styles.salaOverlay} aria-hidden="true" />
                <div className={styles.salaContent}>
                  <span className={styles.salaSub}>{subtexto}</span>
                  <h2 className={styles.salaNombre}>{nombre}</h2>
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
