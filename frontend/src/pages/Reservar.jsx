import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, ChevronLeft } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import BrandBlob from '@/components/ui/BrandBlob'
import SectionHeader from '@/components/ui/SectionHeader'
import Button from '@/components/ui/Button'
import { classes } from '@/data/classes'
import styles from './Reservar.module.css'

const schema = z.object({
  nombre: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Correo inválido'),
  telefono: z.string().min(8, 'Ingresa tu teléfono'),
  notas: z.string().optional(),
})

const stepLabels = ['Sala', 'Clase', 'Asiento', 'Datos']

const SEAT_LAYOUT = {
  Suet: { rows: 4, cols: 5 },
  Flow: { rows: 3, cols: 5 },
}

function generateOccupied(rows, cols, spots) {
  const total = rows * cols
  const taken = total - spots
  const ids = new Set()
  while (ids.size < taken) {
    const r = Math.floor(Math.random() * rows) + 1
    const c = Math.floor(Math.random() * cols) + 1
    ids.add(`R${r}-S${c}`)
  }
  return ids
}

function seatLabel(id) {
  const [r, c] = id.split('-')
  return `Fila ${r.slice(1)}, Asiento ${c.slice(1)}`
}

export default function Reservar() {
  const location = useLocation()
  const incoming = location.state ?? {}

  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [done, setDone] = useState(false)

  // Pre-fill from /clases SeatSelector
  useEffect(() => {
    if (incoming.selectedClass) {
      setSelectedType(incoming.selectedClass.type)
      setSelectedClass(incoming.selectedClass)
      setStep(2)
    }
    if (incoming.selectedSeat) {
      setSelectedSeat(incoming.selectedSeat)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const filteredClasses = selectedType ? classes.filter(c => c.type === selectedType) : []

  // Generate occupied seats once per selected class
  const occupiedSeats = useMemo(() => {
    if (!selectedClass) return new Set()
    const { rows, cols } = SEAT_LAYOUT[selectedClass.type] ?? { rows: 4, cols: 5 }
    return generateOccupied(rows, cols, selectedClass.spots)
  }, [selectedClass?.name, selectedClass?.day, selectedClass?.time]) // eslint-disable-line react-hooks/exhaustive-deps

  const seatLayout = selectedClass ? (SEAT_LAYOUT[selectedClass.type] ?? { rows: 4, cols: 5 }) : null

  const onSubmit = async () => {
    await new Promise(r => setTimeout(r, 1200))
    toast.success('¡Reserva confirmada! Revisa tu correo.')
    setDone(true)
  }

  if (done) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.success}>
            <div className={styles.successIcon}><CheckCircle size={40} /></div>
            <h2 className={styles.successTitle}>¡Reserva confirmada!</h2>
            <p className={styles.successText}>
              Hemos enviado los detalles a tu correo. Te esperamos en{' '}
              <strong>{selectedClass?.name}</strong> el{' '}
              <strong>{selectedClass?.day} a las {selectedClass?.time}</strong>
              {selectedSeat && <>, asiento <strong>{seatLabel(selectedSeat)}</strong></>}.
            </p>
            <Button to="/clases">Ver más clases</Button>
          </div>
        </div>
      </main>
    )
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
            <>
              <div key={label} className={`${styles.step} ${i === step ? styles.active : ''} ${i < step ? styles.done : ''}`}>
                <div className={styles.stepNum}>{i < step ? '✓' : i + 1}</div>
                {label}
              </div>
              {i < stepLabels.length - 1 && <div key={`line-${i}`} className={styles.stepLine} />}
            </>
          ))}
        </div>

        <div className={styles.card}>

          {/* Step 0: Sala */}
          {step === 0 && (
            <>
              <h3 className={styles.cardTitle}>¿Qué sala quieres?</h3>
              <div className={styles.typeGrid}>
                {['Suet', 'Flow'].map(type => (
                  <div
                    key={type}
                    className={`${styles.typeOption} ${styles[type.toLowerCase()]} ${selectedType === type ? styles.selected : ''}`}
                    onClick={() => setSelectedType(type)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedType(type)}
                  >
                    <span className={styles.typeName}>{type}</span>
                    <span className={styles.typeDesc}>
                      {type === 'Suet'
                        ? 'Cardio + fuerza, alta intensidad, DJ en sala'
                        : 'Movimiento consciente, pilates, meditación'}
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.navBtns}>
                <span />
                <button className={styles.nextBtn} onClick={() => setStep(1)} disabled={!selectedType}>
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* Step 1: Clase */}
          {step === 1 && (
            <>
              <h3 className={styles.cardTitle}>Elige tu clase</h3>
              <div className={styles.classesList}>
                {filteredClasses.map((c, i) => (
                  <div
                    key={i}
                    className={`${styles.classOption} ${selectedClass === c ? styles.selected : ''}`}
                    onClick={() => setSelectedClass(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedClass(c)}
                  >
                    <div>
                      <div className={styles.classOptionName}>{c.name}</div>
                      <div className={styles.classOptionMeta}>{c.day} · {c.time} · {c.duration} min · {c.instructor}</div>
                    </div>
                    <span className={`${styles.spotsLeft} ${c.spots <= 4 ? styles.low : ''}`}>
                      {c.spots} lugares
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.navBtns}>
                <button className={styles.backBtn} onClick={() => setStep(0)}>
                  <ChevronLeft size={16} /> Atrás
                </button>
                <button
                  className={styles.nextBtn}
                  onClick={() => { setSelectedSeat(null); setStep(2) }}
                  disabled={!selectedClass}
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* Step 2: Asiento */}
          {step === 2 && selectedClass && seatLayout && (
            <>
              <h3 className={styles.cardTitle}>Elige tu asiento</h3>

              <div className={styles.seatInfo}>
                <span className={styles.seatInfoName}>{selectedClass.name}</span>
                <span className={styles.seatInfoMeta}>{selectedClass.day} · {selectedClass.time} · Coach: {selectedClass.instructor}</span>
              </div>

              <div className={styles.seatStage}>TARIMA DEL COACH</div>

              <div
                className={styles.seatGrid}
                style={{ '--cols': seatLayout.cols }}
                role="group"
                aria-label="Selección de asiento"
              >
                {Array.from({ length: seatLayout.rows }, (_, r) =>
                  Array.from({ length: seatLayout.cols }, (_, c) => {
                    const id = `R${r + 1}-S${c + 1}`
                    const isOccupied = occupiedSeats.has(id)
                    const isSelected = selectedSeat === id
                    return (
                      <button
                        key={id}
                        className={[
                          styles.seat,
                          isOccupied ? styles.seatOccupied : '',
                          isSelected ? styles.seatSelected : '',
                        ].join(' ')}
                        onClick={() => !isOccupied && setSelectedSeat(prev => prev === id ? null : id)}
                        disabled={isOccupied}
                        aria-label={`Fila ${r + 1}, Asiento ${c + 1}${isOccupied ? ' — ocupado' : isSelected ? ' — seleccionado' : ''}`}
                        aria-pressed={isSelected}
                      />
                    )
                  })
                )}
              </div>

              <div className={styles.seatLegend}>
                <span className={styles.seatLegendItem}><span className={`${styles.seatDot} ${styles.dotAvail}`} />Disponible</span>
                <span className={styles.seatLegendItem}><span className={`${styles.seatDot} ${styles.dotOccupied}`} />Ocupado</span>
                <span className={styles.seatLegendItem}><span className={`${styles.seatDot} ${styles.dotSelected}`} />Tu selección</span>
              </div>

              {selectedSeat && (
                <p className={styles.seatConfirmText}>
                  Asiento seleccionado: <strong>{seatLabel(selectedSeat)}</strong>
                </p>
              )}

              <div className={styles.navBtns}>
                <button className={styles.backBtn} onClick={() => setStep(1)}>
                  <ChevronLeft size={16} /> Atrás
                </button>
                <button
                  className={styles.nextBtn}
                  onClick={() => setStep(3)}
                  disabled={!selectedSeat}
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* Step 3: Datos */}
          {step === 3 && (
            <>
              <h3 className={styles.cardTitle}>Tus datos</h3>
              {selectedClass && (
                <div className={styles.summary}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Clase</span>
                    <span className={styles.summaryValue}>{selectedClass.name}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Día y hora</span>
                    <span className={styles.summaryValue}>{selectedClass.day} · {selectedClass.time}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Instructor/a</span>
                    <span className={styles.summaryValue}>{selectedClass.instructor}</span>
                  </div>
                  {selectedSeat && (
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Asiento</span>
                      <span className={styles.summaryValue}>{seatLabel(selectedSeat)}</span>
                    </div>
                  )}
                </div>
              )}
              <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label htmlFor="nombre">Nombre completo *</label>
                    <input id="nombre" placeholder="Tu nombre" {...register('nombre')} />
                    {errors.nombre && <span className={styles.error}>{errors.nombre.message}</span>}
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="email">Correo electrónico *</label>
                    <input id="email" type="email" placeholder="tu@correo.com" {...register('email')} />
                    {errors.email && <span className={styles.error}>{errors.email.message}</span>}
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="telefono">Teléfono *</label>
                  <input id="telefono" placeholder="+52 55 0000 0000" {...register('telefono')} />
                  {errors.telefono && <span className={styles.error}>{errors.telefono.message}</span>}
                </div>
                <div className={styles.navBtns}>
                  <button type="button" className={styles.backBtn} onClick={() => setStep(2)}>
                    <ChevronLeft size={16} /> Atrás
                  </button>
                  <button type="submit" className={styles.nextBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Confirmando...' : 'Confirmar reserva'}
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </main>
  )
}
