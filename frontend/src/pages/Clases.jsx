/**
 * Clases.jsx
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * PÃ¡gina pÃºblica de listado y reserva de clases.
 * Incluye navegaciÃ³n semanal, filtro por disciplina (Stride/Slow)
 * y tarjetas de clase con disponibilidad en tiempo real.
 *
 * Usado en: App.jsx (ruta "/clases")
 * Depende de: classService, classes (data), ClassTypeFilter, SeatSelector
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ClassTypeFilter from '@/features/clases/ClassTypeFilter'
import EquipmentReservationPanel from '@/features/reservas/EquipmentReservationPanel'
import SeatSelector from '@/features/clases/SeatSelector'
import { useClasesStore }          from '@/stores/clasesStore'
import { useCoachesStore }         from '@/stores/coachesStore'
import { useReservasStore }        from '@/stores/reservasStore'
import { useConfiguracionStore } from '@/stores/configuracionStore'
import { useAuth } from '@/context/AuthContext'
import { getPublicClassesByDate, getPublicAvailability, getReservationOccurrenceDate } from '@/services/classService'
import { clearOccurrencesInflightCache, getOccurrencesForDateRangeApi } from '@/services/occurrencesApiService'
import { cancelarReserva as cancelarReservaService } from '@/services/reservasService'
import { ROUTES } from '@/constants/routes'
import { getWeekDays, isSameDay, formatHour, getInitials, DAYS_ABBR, MONTHS_ES } from '@/utils/formatters'
import { normalizeDiscipline } from '@/utils/discipline'
import styles from './Clases.module.css'

// â”€â”€â”€ Avatar helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AVATAR_COLORS = [
  { bg: 'rgba(123,31,46,0.14)', text: '#7B1F2E' },
  { bg: 'rgba(194,107,122,0.18)', text: '#b05060' },
  { bg: 'rgba(154,123,107,0.18)', text: '#7A6560' },
  { bg: 'rgba(92,16,24,0.13)', text: '#5C1018' },
]

function avatarStyle(name) {
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

// â”€â”€â”€ Date helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getMonthLabel(days) {
  const a = days[0], b = days[days.length - 1]
  if (a.getMonth() === b.getMonth())
    return `${MONTHS_ES[a.getMonth()].toUpperCase()} ${b.getFullYear()}`
  return `${MONTHS_ES[a.getMonth()].toUpperCase()} â€“ ${MONTHS_ES[b.getMonth()].toUpperCase()} ${b.getFullYear()}`
}

function canCancelClass(date, hora) {
  const [h, m] = hora.split(':').map(Number)
  const classTime = new Date(date)
  classTime.setHours(h, m, 0, 0)
  // LÃ­mite de cancelaciÃ³n configurable desde el panel admin
  // [BACKEND] â†’ GET /api/configuracion â†’ horasCancelacion
  const horasCancelacion = useConfiguracionStore.getState().get('horasCancelacion')
  return (classTime - new Date()) > horasCancelacion * 60 * 60 * 1000
}

// Main page
export default function Clases() {
  const { clases: allClasses, loadClasesFromApi } = useClasesStore()
  const { coaches }            = useCoachesStore()
  const { reservas } = useReservasStore()
  const { isAuthenticated, usuario } = useAuth()
  const cfg = useConfiguracionStore()

  const coachFotoByName = useMemo(
    () => Object.fromEntries(coaches.map((c) => [c.nombre, c.foto]).filter(([, f]) => f)),
    [coaches]
  )
  const navigate = useNavigate()
  const [searchParams]  = useSearchParams()
  const [filter, setFilter]         = useState(searchParams.get('tipo') || 'Stryde X')
  const [selectedClass, setSelectedClass] = useState(null)
  const [occurrencesByClass, setOccurrencesByClass] = useState({})
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate]   = useState(new Date())
  const useApiClasses = import.meta.env.VITE_USE_API_CLASSES === 'true'
  const useApiReservations = import.meta.env.VITE_USE_API_RESERVATIONS === 'true'
  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset])
  const monthLabel = useMemo(() => getMonthLabel(days), [days])
  const selectedIdx = days.findIndex((d) => isSameDay(d, selectedDate))

  useEffect(() => {
    if (!useApiClasses) return
    loadClasesFromApi().catch((err) => {
      if (import.meta.env.DEV) {
        console.error('[Clases] No se pudo cargar clases API, fallback cache/store', err)
      }
    })
  }, [loadClasesFromApi, useApiClasses])

  useEffect(() => {
    if (!useApiClasses || !allClasses.length) return
    const from = `${days[0].getFullYear()}-${String(days[0].getMonth() + 1).padStart(2, '0')}-${String(days[0].getDate()).padStart(2, '0')}`
    const to = `${days[days.length - 1].getFullYear()}-${String(days[days.length - 1].getMonth() + 1).padStart(2, '0')}-${String(days[days.length - 1].getDate()).padStart(2, '0')}`
    const controller = new AbortController()
    let active = true

    getOccurrencesForDateRangeApi(allClasses.map((c) => c.id), { from, to, signal: controller.signal })
      .then((data) => {
        if (active) setOccurrencesByClass(data)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        if (active) setOccurrencesByClass({})
      })

    return () => {
      active = false
      controller.abort()
      clearOccurrencesInflightCache()
    }
  }, [allClasses, days, useApiClasses])

  // Classes for the selected day, filtered by discipline.
  // Uses slow-based detection: anything that doesn't contain 'slow' is Stryde.
  // This handles 'Stryde X', 'Slow', and any custom variant.
  const isSlow = (tipo) => normalizeDiscipline(tipo) === 'slow'
  const resolveDiscipline = (value) => normalizeDiscipline(value)

  const occurrenceSessions = useMemo(() => {
    if (!useApiClasses) return []
    const sessions = []
    for (const cls of allClasses) {
      const occs = occurrencesByClass?.[cls.id] ?? []
      for (const occ of occs) {
        sessions.push({
          ...cls,
          occurrenceId: occ.occurrenceId,
          fecha: occ.fecha,
          hora: occ.inicio ? new Date(occ.inicio).toISOString().slice(11, 16) : cls.hora,
          cupoMax: occ.cupoMax ?? cls.cupoMax,
          cupoActual: occ.cupoActual ?? cls.cupoActual,
          estado: occ.estado ?? cls.estado,
          coachId: occ.coachId ?? cls.coachId,
          coachNombre: cls.coachNombre,
          nombre: occ.claseNombre ?? cls.nombre,
        })
      }
    }
    return sessions
  }, [allClasses, occurrencesByClass, useApiClasses])

  const dayHasClasses = useMemo(() =>
    days.map((d) => {
      const forDay = useApiClasses
        ? occurrenceSessions.filter((c) => c.fecha === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
        : getPublicClassesByDate(allClasses, d)
      return filter
        ? forDay.some((c) => isSlow(filter) ? resolveDiscipline(c.discipline ?? c.tipo) === 'slow' : resolveDiscipline(c.discipline ?? c.tipo) === 'stryde')
        : forDay.length > 0
    }),
    [days, allClasses, filter, occurrenceSessions, useApiClasses]
  )

  const dayClasses = useMemo(() => {
    const selectedIso = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    const forDay = useApiClasses
      ? occurrenceSessions.filter((c) => c.fecha === selectedIso)
      : getPublicClassesByDate(allClasses, selectedDate)
    return filter
      ? forDay.filter((c) => isSlow(filter) ? resolveDiscipline(c.discipline ?? c.tipo) === 'slow' : resolveDiscipline(c.discipline ?? c.tipo) === 'stryde')
      : forDay
  }, [selectedDate, filter, allClasses, occurrenceSessions, useApiClasses])

  const handlePrevWeek = () => {
    if (weekOffset === 0) return
    const n = weekOffset - 1
    setWeekOffset(n)
    setSelectedDate(getWeekDays(n)[0])
  }

  const handleNextWeek = () => {
    const n = weekOffset + 1
    setWeekOffset(n)
    setSelectedDate(getWeekDays(n)[0])
  }

  return (
    <main className={styles.main}>

      {/* Hero - keep exactly as-is*/}
      <section
        className={styles.hero}
        style={{ backgroundImage: `url(${cfg.get('imagenBannerClases')})` }}
      >
        <div className={styles.heroInner}>
          <span className={styles.heroLabel}>RESERVA TU LUGAR</span>
          <h1 className={styles.heroTitle}>CLASES</h1>
        </div>
      </section>

      {/* Discipline toggle */}
      <div className={styles.filterWrap}>
        <ClassTypeFilter active={filter} onChange={setFilter} />
      </div>

      {/*  Booking timeline*/}
      <div className={styles.bookingWrap}>

        {/* Day navigation */}
        <div className={styles.dayNav}>
          <button
            className={`${styles.navBtn} ${weekOffset === 0 ? styles.navBtnOff : ''}`}
            onClick={handlePrevWeek}
            disabled={weekOffset === 0}
            aria-label="Semana anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className={styles.daysStrip}>
            {days.map((date, i) => {
              const today    = isSameDay(date, new Date())
              const selected = i === selectedIdx
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={[
                    styles.dayBtn,
                    selected ? styles.dayBtnActive : '',
                    today && !selected ? styles.dayBtnToday : '',
                  ].join(' ')}
                >
                  <span className={styles.dayAbbr}>{DAYS_ABBR[date.getDay()]}</span>
                  <span className={styles.dayNum}>{date.getDate()}</span>
                  <span className={[
                    styles.dayDot,
                    dayHasClasses[i] ? styles.dayDotVisible : '',
                  ].join(' ')} />
                </button>
              )
            })}
          </div>

          <button
            className={styles.navBtn}
            onClick={handleNextWeek}
            aria-label="Siguiente semana"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Month label */}
        <p className={styles.monthLabel}>{monthLabel}</p>

        {/* Class list */}
        <div className={styles.classList}>
          {dayClasses.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📅</span>
              <p>Sin clases este día</p>
            </div>
          ) : (
            dayClasses.map((cls, i) => {
              const { available, status } = getPublicAvailability(cls)
              const isFull  = status === 'full'
              const isLow   = status === 'low'
              const { bg, text } = avatarStyle(cls.coachNombre)
                            const coachFoto   = coachFotoByName[cls.coachNombre] || null

              // selectedDate is a Date object - convert to ISO string before matching reservation occurrence
              const selectedDateISO = selectedDate instanceof Date
                ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
                : selectedDate

              const miReserva = isAuthenticated && usuario
                ? reservas.find((r) => {
                    if (!(r.userId === usuario.id && r.estado === 'confirmada')) return false
                    if (!useApiReservations) return true
                    if (cls.occurrenceId) return Number(r.occurrenceId) === Number(cls.occurrenceId)
                    const occurrenceDate = getReservationOccurrenceDate(r)
                    if (!occurrenceDate || Number(r.claseId) !== Number(cls.id)) return false
                    return occurrenceDate === selectedDateISO
                  })
                : null
              const cancelAllowed = miReserva ? canCancelClass(selectedDate, cls.hora) : false
              const clasePasada = new Date(selectedDateISO + 'T' + cls.hora + ':00') <= new Date()

              return (
                <div key={i} className={`${styles.classCard} ${isFull ? styles.classCardFull : ''}`}>

                  {/* AVATAR */}
                  <div className={styles.avatarWrap}>
                    <div className={styles.avatar} style={{ background: coachFoto ? 'transparent' : bg, overflow: 'hidden', padding: 0 }}>
                      {coachFoto ? (
                        <img
                          src={coachFoto}
                          alt={cls.coachNombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
                        />
                      ) : (
                        <span className={styles.avatarInitials} style={{ color: text }}>
                          {getInitials(cls.coachNombre)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* TIME */}
                  <div className={styles.classTime}>
                    <span className={styles.timeHour}>{formatHour(cls.hora)}</span>
                    <span className={styles.timeDur}>{cls.duracion} min</span>
                  </div>

                  {/* DIVIDER */}
                  <div className={styles.divider} />

                  {/* CENTER â€” class info */}
                  <div className={styles.classBody}>
                    <div className={styles.classTitleRow}>
                      <span className={styles.className}>{cls.nombre}</span>
                      {(() => {
                        const classDiscipline = resolveDiscipline(cls.discipline ?? cls.tipo)
                        return (
                          <span className={`${styles.typeBadge} ${classDiscipline === 'stryde' ? styles.typeBadgeStride : classDiscipline === 'slow' ? styles.typeBadgeSlow : ''}`}>
                            {classDiscipline === 'slow' ? 'SLOW' : classDiscipline === 'stryde' ? 'STRYDE' : 'Sin tipo'}
                          </span>
                        )
                      })()}
                    </div>
                    <div className={styles.classMeta}>
                      <span className={styles.metaItem}>
                        {cls.coachNombre}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT â€” availability + button */}
                  <div className={styles.classActions}>
                    {!clasePasada && (isFull ? (
                      <span className={styles.fullTag}>LLENO</span>
                    ) : (
                      <span className={`${styles.availTag} ${isLow ? styles.availTagLow : styles.availTagOk}`}>
                        <span className={styles.availDot} />
                        {available} {available === 1 ? 'lugar' : 'lugares'}
                      </span>
                    ))}
                    {clasePasada ? (
                      <span className={styles.cancelarVencido} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0, display: 'inline-block' }} />
                        Clase finalizada
                      </span>
                    ) : miReserva ? (
                      <div className={styles.reservadaWrap}>
                        <span className={styles.reservadaBadge}>CONFIRMADA</span>
                        {cancelAllowed ? (
                          <button
                            className={styles.cancelarBtn}
                            onClick={() => cancelarReservaService(miReserva.id, usuario.id)}
                          >
                            Cancelar
                          </button>
                        ) : (
                          <span className={styles.cancelarVencido}>Sin cancelación disponible</span>
                        )}
                      </div>
                    ) : (
                      <button
                        className={styles.reservarBtn}
                        onClick={() => {
                          if (isFull) return
                          if (!isAuthenticated) {
                            navigate(ROUTES.login, { state: { selectedClass: cls } })
                            return
                          }
                          setSelectedClass(cls)
                        }}
                        disabled={isFull}
                      >
                        RESERVAR
                      </button>
                    )}
                  </div>

                </div>
              )
            })
          )}
        </div>
      </div>

      {/* â”€â”€ Seat selector modal â”€â”€ */}
      {selectedClass && (
        useApiReservations && selectedClass.occurrenceId ? (
          <EquipmentReservationPanel
            occurrenceId={selectedClass.occurrenceId}
            classId={selectedClass.id}
            userId={usuario?.id}
            onClose={() => setSelectedClass(null)}
          />
        ) : (
          <SeatSelector cls={selectedClass} onClose={() => setSelectedClass(null)} fecha={selectedDate} />
        )
      )}

    </main>
  )
}


