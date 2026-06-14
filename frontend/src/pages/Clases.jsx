/**
 * Clases.jsx
 * Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
 * PÃƒÂ¡gina pÃƒÂºblica de listado y reserva de clases.
 * Incluye navegaciÃƒÂ³n semanal, filtro por disciplina (Stride/Slow)
 * y tarjetas de clase con disponibilidad en tiempo real.
 *
 * Usado en: App.jsx (ruta "/clases")
 * Depende de: classService, classes (data), ClassTypeFilter, SeatSelector
 * Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
import { useEffectiveSiteConfiguration } from '@/hooks/useSiteConfiguration'
import { useAuth } from '@/context/AuthContext'
import { getPublicClassesByDate, getPublicAvailability, getReservationOccurrenceDate } from '@/services/classService'
import { clearOccurrencesInflightCache, getOccurrencesForDateRangeApi } from '@/services/occurrencesApiService'
import { cancelarReserva as cancelarReservaService } from '@/services/reservasService'
import { ROUTES } from '@/constants/routes'
import { getWeekDays, isSameDay, formatHour, DAYS_ABBR, MONTHS_ES } from '@/utils/formatters'
import { getClassTimeToken } from '@/utils/classSchedule'
import { normalizeDiscipline } from '@/utils/discipline'
import CoachAvatar from '@/components/common/CoachAvatar'
import { usePublicCoachesQuery } from '@/hooks/useApiQueries'
import styles from './Clases.module.css'

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Date helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function getMonthLabel(days) {
  const a = days[0], b = days[days.length - 1]
  if (a.getMonth() === b.getMonth())
    return `${MONTHS_ES[a.getMonth()].toUpperCase()} ${b.getFullYear()}`
  return `${MONTHS_ES[a.getMonth()].toUpperCase()} Ã¢â‚¬â€œ ${MONTHS_ES[b.getMonth()].toUpperCase()} ${b.getFullYear()}`
}

function canCancelClass(date, hora) {
  const [h, m] = hora.split(':').map(Number)
  const classTime = new Date(date)
  classTime.setHours(h, m, 0, 0)
  // LÃƒÂ­mite de cancelaciÃƒÂ³n configurable desde el panel admin
  // [BACKEND] Ã¢â€ â€™ GET /api/configuracion Ã¢â€ â€™ horasCancelacion
  const horasCancelacion = useConfiguracionStore.getState().get('horasCancelacion')
  return (classTime - new Date()) > horasCancelacion * 60 * 60 * 1000
}

// Main page
export default function Clases() {
  const { clases: allClasses, loadClasesFromApi } = useClasesStore()
  const { coaches }            = useCoachesStore()
  const { reservas } = useReservasStore()
  const { isAuthenticated, usuario } = useAuth()
  const [selectedDate, setSelectedDate]   = useState(new Date())
  const [weekOffset, setWeekOffset] = useState(0)
  const [filter, setFilter] = useState('')
  const [selectedClass, setSelectedClass] = useState(null)
  const [occurrencesByClass, setOccurrencesByClass] = useState({})
  const useApiClasses = import.meta.env.VITE_USE_API_CLASSES === 'true'
  const useApiReservations = import.meta.env.VITE_USE_API_RESERVATIONS === 'true'
  const siteConfig = useEffectiveSiteConfiguration()
  const useApiCoachAvatars = useApiClasses || useApiReservations
  const publicCoachesQuery = usePublicCoachesQuery({ enabled: useApiCoachAvatars })
  const coachSource = useApiCoachAvatars ? (publicCoachesQuery.data ?? []) : coaches
  const coachFotoById = useMemo(
    () => Object.fromEntries(coachSource.map((c) => [String(c.coachId ?? c.id ?? c.userId ?? c.email ?? c.nombre ?? c.name), c.avatarUrl ?? c.foto ?? null]).filter(([, f]) => f)),
    [coachSource]
  )
  const coachFotoByName = useMemo(
    () => Object.fromEntries(coachSource.map((c) => [String(c.nombre ?? c.name ?? ''), c.avatarUrl ?? c.foto ?? null]).filter(([name, f]) => name && f)),
    [coachSource]
  )
  const navigate = useNavigate()
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
          hora: getClassTimeToken(occ) ?? getClassTimeToken(cls) ?? null,
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
        style={{ '--hero-image': `url("${siteConfig.get('imagenBannerClases')}")` }}
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
              const coachFoto = cls.coachAvatarUrl
                ?? coachFotoById[String(cls.coachId ?? cls.coach_id ?? '')]
                ?? coachFotoByName[String(cls.coachNombre ?? cls.coach ?? '')]
                ?? null
              const classTime = getClassTimeToken(cls)

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
              const cancelAllowed = miReserva && classTime ? canCancelClass(selectedDate, classTime) : false
              const clasePasada = classTime ? new Date(selectedDateISO + 'T' + classTime + ':00') <= new Date() : false

              return (
                <div key={i} className={`${styles.classCard} ${isFull ? styles.classCardFull : ''}`}>

                  {/* AVATAR */}
                  <div className={styles.avatarWrap}>
                    <CoachAvatar name={cls.coachNombre ?? cls.coach ?? 'Coach'} avatarUrl={coachFoto} size={54} className={styles.avatar} objectPosition="center 15%" />
                  </div>

                  {/* TIME */}
                  <div className={styles.classTime}>
                    <span className={styles.timeHour}>{formatHour(classTime)}</span>
                    <span className={styles.timeDur}>{cls.duracion} min</span>
                  </div>

                  {/* DIVIDER */}
                  <div className={styles.divider} />

                  {/* CENTER — class info */}
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

                  {/* RIGHT — availability + button */}
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
                          <span className={styles.cancelarVencido}>Sin cancelaciÃ³n disponible</span>
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

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Seat selector modal Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {selectedClass && (
        useApiReservations && selectedClass.occurrenceId ? (
          <EquipmentReservationPanel
            occurrenceId={selectedClass.occurrenceId}
            classId={selectedClass.id}
            userId={usuario?.id}
            coachAvatarUrl={selectedClass.coachAvatarUrl ?? coachFotoById[String(selectedClass.coachId ?? selectedClass.coach_id ?? '')] ?? coachFotoByName[String(selectedClass.coachNombre ?? selectedClass.coach ?? '')] ?? null}
            onClose={() => setSelectedClass(null)}
          />
        ) : (
          <SeatSelector
            cls={{
              ...selectedClass,
              coachAvatarUrl: selectedClass.coachAvatarUrl ?? coachFotoById[String(selectedClass.coachId ?? selectedClass.coach_id ?? '')] ?? coachFotoByName[String(selectedClass.coachNombre ?? selectedClass.coach ?? '')] ?? null,
            }}
            onClose={() => setSelectedClass(null)}
            fecha={selectedDate}
          />
        )
      )}

    </main>
  )
}
