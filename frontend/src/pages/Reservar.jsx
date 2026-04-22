import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, ChevronLeft } from 'lucide-react'
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

const stepLabels = ['Sala', 'Clase', 'Datos']

export default function Reservar() {
  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const filteredClasses = selectedType ? classes.filter(c => c.type === selectedType) : []

  const onSubmit = async (data) => {
    await new Promise(r => setTimeout(r, 1200))
    toast.success('¡Reserva confirmada! Revisa tu correo.')
    setDone(true)
  }

  if (done) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <CheckCircle size={40} />
            </div>
            <h2 className={styles.successTitle}>¡Reserva confirmada!</h2>
            <p className={styles.successText}>
              Hemos enviado los detalles a tu correo. Te esperamos en{' '}
              <strong>{selectedClass?.name}</strong> el{' '}
              <strong>{selectedClass?.day} a las {selectedClass?.time}</strong>.
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
          {/* Step 0: Tipo */}
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
                <button
                  className={styles.nextBtn}
                  onClick={() => setStep(1)}
                  disabled={!selectedType}
                >
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
                  onClick={() => setStep(2)}
                  disabled={!selectedClass}
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* Step 2: Datos */}
          {step === 2 && (
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
                  <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>
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
