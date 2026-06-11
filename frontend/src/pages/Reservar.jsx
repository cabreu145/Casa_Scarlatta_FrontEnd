import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import BrandBlob from '@/components/ui/BrandBlob'
import SectionHeader from '@/components/ui/SectionHeader'
import WeeklyCalendar from '@/features/clases/WeeklyCalendar'
import SeatSelector from '@/features/clases/SeatSelector'
import EquipmentReservationPanel from '@/features/reservas/EquipmentReservationPanel'
import { useAuth } from '@/context/AuthContext'
import { useClasesStore } from '@/stores/clasesStore'
import { normalizeDiscipline } from '@/utils/discipline'
import { formatOccurrenceDateTime } from '@/features/reservas/equipmentLayoutConfig'
import { formatHour } from '@/utils/formatters'
import { getClassTimeToken } from '@/utils/classSchedule'
import styles from './Reservar.module.css'

const SALAS = [
  {
    key: 'stryde',
    label: 'STRYDE X',
    logo: '/brand/STRYDE_X_T.png',
    subtexto: 'Alta intensidad',
    img: '/fotos/stride-hero.jpg',
    alt: 'Sala STRYDE — alta intensidad',
  },
  {
    key: 'slow',
    label: 'SLOW',
    logo: '/brand/LOGO_SLOW.png',
    subtexto: 'Movimiento consciente',
    img: '/fotos/slow-hero.jpg',
    alt: 'Sala Slow — movimiento consciente',
  },
]

function resolveSalaKey(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return null
  if (normalized.includes('slow')) return 'slow'
  if (normalized.includes('stryde') || normalized.includes('stride')) return 'stryde'
  return null
}

function resolveClassSalaKey(cls = {}) {
  const discipline = normalizeDiscipline(cls.discipline ?? cls.classDiscipline ?? cls.tipo)
  if (discipline) return discipline
  const legacy = String(cls.tipo ?? '').trim().toLowerCase()
  if (legacy.includes('slow')) return 'slow'
  if (legacy.includes('stryde') || legacy.includes('stride')) return 'stryde'
  return null
}

function buildReservationRedirect({ salaKey, classId }) {
  const params = new URLSearchParams()
  if (salaKey) params.set('tipo', salaKey)
  if (classId !== null && classId !== undefined && classId !== '') {
    params.set('classId', String(classId))
  }
  const qs = params.toString()
  return `/reservar${qs ? `?${qs}` : ''}`
}

export default function Reservar() {
  const { usuario, isAuthenticated } = useAuth()
  const { clases, loadClasesFromApi } = useClasesStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const useApiClasses = import.meta.env.VITE_USE_API_CLASSES === 'true'
  const useApiReservations = import.meta.env.VITE_USE_API_RESERVATIONS === 'true'
  const isClient = isAuthenticated && usuario?.rol === 'cliente'

  const [selectedSalaKey, setSelectedSalaKey] = useState(resolveSalaKey(searchParams.get('tipo')))
  const [selectedClass, setSelectedClass] = useState(null)
  const [showReservationPanel, setShowReservationPanel] = useState(false)
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [classesError, setClassesError] = useState('')

  useEffect(() => {
    if (!useApiClasses) return

    let active = true
    setIsLoadingClasses(true)
    setClassesError('')

    loadClasesFromApi()
      .catch((err) => {
        if (!active) return
        setClassesError(err?.message ?? 'No pudimos cargar clases.')
      })
      .finally(() => {
        if (active) setIsLoadingClasses(false)
      })

    return () => {
      active = false
    }
  }, [loadClasesFromApi, useApiClasses])

  const filteredClasses = useMemo(() => {
    if (!selectedSalaKey) return clases
    return clases.filter((cls) => resolveClassSalaKey(cls) === selectedSalaKey)
  }, [clases, selectedSalaKey])

  const selectedClassFromQuery = searchParams.get('classId')

  useEffect(() => {
    if (!selectedClassFromQuery || !filteredClasses.length) return
    const found = filteredClasses.find((cls) => String(cls.id) === String(selectedClassFromQuery))
    if (found) {
      setSelectedClass(found)
      const salaKey = resolveClassSalaKey(found)
      if (salaKey) setSelectedSalaKey(salaKey)
    }
  }, [filteredClasses, selectedClassFromQuery])

  const selectedSala = SALAS.find((sala) => sala.key === selectedSalaKey) ?? null
  const selectedClassTimeToken = getClassTimeToken(selectedClass)
  const selectedClassDateTime = useMemo(() => formatOccurrenceDateTime({
    occurrenceDate: selectedClass?.occurrenceDate ?? selectedClass?.fecha ?? selectedClass?.classDate,
    classDate: selectedClass?.fecha ?? selectedClass?.classDate,
    startTime: selectedClassTimeToken,
    startAt: selectedClass?.startAt ?? selectedClass?.classStartAt,
    classStartAt: selectedClass?.classStartAt,
  }), [selectedClass])

  const selectedClassDisplayDate = selectedClassDateTime.fullLabel === 'Sin fecha'
    ? (selectedClass?.dia && selectedClassTimeToken
      ? `${selectedClass.dia} · ${formatHour(selectedClassTimeToken)}`
      : selectedClassTimeToken
        ? formatHour(selectedClassTimeToken)
        : 'Sin fecha')
    : selectedClassDateTime.fullLabel

  const handleSelectSala = (salaKey) => {
    setSelectedSalaKey(salaKey)
    setSelectedClass(null)
    setShowReservationPanel(false)
    const next = buildReservationRedirect({ salaKey })
    if (location.pathname !== '/reservar' || searchParams.get('tipo') !== salaKey) {
      navigate(next, { replace: true })
    }
  }

  const handleSelectClass = (cls) => {
    setSelectedClass(cls)
    setShowReservationPanel(false)
    const salaKey = resolveClassSalaKey(cls)
    if (salaKey && salaKey !== selectedSalaKey) {
      setSelectedSalaKey(salaKey)
    }
  }

  const handleContinue = () => {
    if (!selectedClass) return

    if (!isAuthenticated) {
      const redirect = buildReservationRedirect({
        salaKey: selectedSalaKey,
        classId: selectedClass.id,
      })
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`)
      return
    }

    if (!isClient) {
      toast.error('Inicia sesiÃ³n con una cuenta de cliente para reservar.')
      return
    }

    setShowReservationPanel(true)
  }

  const handleBackToSala = () => {
    setSelectedClass(null)
    setShowReservationPanel(false)
  }

  return (
    <main className={styles.page}>
      <BrandBlob className={styles.blob} width={500} height={500} />

      <div className={styles.inner}>
        <SectionHeader
          label="Reservar"
          title="Asegura tu lugar"
          subtitle="Cupos limitados. Cancelación gratuita hasta 6 horas antes."
          size="lg"
          titleStyle={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'normal',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
          }}
        />

        <div className={styles.steps} aria-label="Progreso de reserva">
          <div className={`${styles.step} ${!selectedSalaKey ? styles.active : styles.done}`}>
            <span className={styles.stepNum}>1</span>
            <span>Sala</span>
          </div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${selectedSalaKey && !selectedClass ? styles.active : selectedClass ? styles.done : ''}`}>
            <span className={styles.stepNum}>2</span>
            <span>Clase</span>
          </div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${selectedClass && !showReservationPanel ? styles.active : showReservationPanel ? styles.done : ''}`}>
            <span className={styles.stepNum}>3</span>
            <span>Spot</span>
          </div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${showReservationPanel ? styles.active : ''}`}>
            <span className={styles.stepNum}>4</span>
            <span>Confirmación</span>
          </div>
        </div>

        {!selectedSalaKey && (
          <div className={styles.salaGrid}>
            {SALAS.map(({ key, label, logo, subtexto, img, alt }) => (
              <div
                key={key}
                className={styles.salaCard}
                onClick={() => handleSelectSala(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectSala(key)}
                aria-label={`Reservar clase de ${label}`}
              >
                <img src={img} alt={alt} className={styles.salaImg} loading="lazy" />
                <div className={styles.salaOverlay} aria-hidden="true" />
                <div className={styles.salaContent}>
                  <span className={styles.salaSub}>{subtexto}</span>
                  <img src={logo} alt={label} className={styles.salaLogo} draggable="false" />
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedSalaKey && !selectedClass && (
          <div className={styles.calendarStep}>
            <div className={styles.calendarHeader}>
              <button
                className={styles.backBtn}
                onClick={handleBackToSala}
                type="button"
              >
                ← Cambiar sala
              </button>
              <span className={styles.calendarType}>
                {selectedSala?.label ?? (selectedSalaKey === 'slow' ? 'SLOW' : 'STRYDE X')}
              </span>
            </div>

            {isLoadingClasses && (
              <div className={styles.card}>
                <div className={styles.cardTitle}>Cargando clases...</div>
                <p className={styles.successText}>Estamos trayendo horarios y disponibilidad reales.</p>
              </div>
            )}

            {classesError && (
              <div className={styles.card}>
                <div className={styles.cardTitle}>No pudimos cargar clases</div>
                <p className={styles.successText}>{classesError}</p>
              </div>
            )}

            {!isLoadingClasses && !classesError && (
              <>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Elige tu clase</div>
                  <WeeklyCalendar classes={filteredClasses} onSelectClass={handleSelectClass} />
                </div>

                {filteredClasses.length === 0 && (
                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Sin clases para esta sala</div>
                    <p className={styles.successText}>
                      Vuelve luego o cambia de sala para ver otros horarios disponibles.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {selectedClass && !showReservationPanel && (
          <div className={styles.card}>
            <div className={styles.cardTitle}>Clase seleccionada</div>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Sala</span>
                <span className={styles.summaryValue}>{selectedSala?.label ?? 'Sala'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Clase</span>
                <span className={styles.summaryValue}>{selectedClass.nombre ?? selectedClass.name ?? 'Clase'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Fecha</span>
                <span className={styles.summaryValue}>{selectedClassDisplayDate}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Coach</span>
                <span className={styles.summaryValue}>{selectedClass.coachNombre ?? selectedClass.coach_name ?? 'Coach'}</span>
              </div>
            </div>

            <p className={styles.successText} style={{ marginBottom: 0 }}>
              {isAuthenticated
                ? 'Continúa para elegir spot y confirmar tu reserva.'
                : 'Inicia sesión para continuar con la reserva segura de tu lugar.'}
            </p>

            <div className={styles.navBtns}>
              <button className={styles.backBtn} type="button" onClick={() => setSelectedClass(null)}>
                ← Volver a clases
              </button>
              <button className={styles.nextBtn} type="button" onClick={handleContinue}>
                {isAuthenticated ? 'Elegir lugar →' : 'Iniciar Sesión para reservar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showReservationPanel && selectedClass && (
        useApiReservations && selectedClass.occurrenceId && isClient ? (
          <EquipmentReservationPanel
            occurrenceId={selectedClass.occurrenceId}
            classId={selectedClass.id}
            userId={usuario?.id}
            onReservationCreated={() => {
              setShowReservationPanel(false)
              setSelectedClass(null)
            }}
            onClose={() => setShowReservationPanel(false)}
          />
        ) : (
          <SeatSelector
            cls={selectedClass}
            onClose={() => setShowReservationPanel(false)}
            onSuccess={() => {
              setShowReservationPanel(false)
              setSelectedClass(null)
            }}
          />
        )
      )}
    </main>
  )
}
