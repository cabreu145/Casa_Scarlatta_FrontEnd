import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ClassTypeFilter from '@/features/clases/ClassTypeFilter'
import EquipmentReservationPanel from '@/features/reservas/EquipmentReservationPanel'
import SeatSelector from '@/features/clases/SeatSelector'
import SeatMapViewer from '@/features/clases/SeatMapViewer'
import { useClasesStore }          from '@/stores/clasesStore'
import { useCoachesStore }         from '@/stores/coachesStore'
import { useReservasStore }        from '@/stores/reservasStore'
import { useConfiguracionStore } from '@/stores/configuracionStore'
import { useEffectiveSiteConfiguration } from '@/hooks/useSiteConfiguration'
import { useAuth } from '@/context/AuthContext'
import { getPublicClassesByDate, getPublicAvailability, getReservationOccurrenceDate } from '@/services/classService'
import { getOccurrencesForDateRangeApi } from '@/services/occurrencesApiService'
import { cancelarReserva as cancelarReservaService } from '@/services/reservasService'
import { ROUTES } from '@/constants/routes'
import { getWeekDays, isSameDay, formatHour, DAYS_ABBR, MONTHS_ES } from '@/utils/formatters'
import { getClassTimeToken } from '@/utils/classSchedule'
import { resolveCoachId, resolveCoachNombre } from '@/utils/resolveClassCoach'
import { normalizeDiscipline } from '@/utils/discipline'
import CoachAvatar from '@/components/common/CoachAvatar'
import { useMyFinancialStateQuery, usePublicCoachesQuery } from '@/hooks/useApiQueries'
import { queryKeys } from '@/api/queryKeys'
import { canReserveAnotherSpotInOccurrence, getOneSpotPerOccurrenceMessage, resolveLimitOneSpotPerOccurrence } from '@/utils/reservationPolicy'
import styles from './Clases.module.css'



function getMonthLabel(days) {
  const a = days[0], b = days[days.length - 1]
  if (a.getMonth() === b.getMonth())
    return `${MONTHS_ES[a.getMonth()].toUpperCase()} ${b.getFullYear()}`
  return `${MONTHS_ES[a.getMonth()].toUpperCase()} — ${MONTHS_ES[b.getMonth()].toUpperCase()} ${b.getFullYear()}`
}

function canCancelClass(date, hora) {
  const [h, m] = hora.split(':').map(Number)
  const classTime = new Date(date)
  classTime.setHours(h, m, 0, 0)
  
  const horasCancelacion = useConfiguracionStore.getState().get('horasCancelacion')
  return (classTime - new Date()) > horasCancelacion * 60 * 60 * 1000
}

// Main page
export default function Clases() {
  const { clases: allClasses, loadClasesFromApi } = useClasesStore()
  const { coaches }            = useCoachesStore()
  const { reservas, loadMisReservasFromApi } = useReservasStore()
  const { isAuthenticated, usuario } = useAuth()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate]   = useState(new Date())
  const [weekOffset, setWeekOffset] = useState(0)
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState(() => {
    const tipo = searchParams.get('tipo') ?? ''
    if (!tipo) return ''
    return tipo.toLowerCase().includes('slow') ? 'Slow' : 'Stryde X'
  })
  const [selectedClass, setSelectedClass] = useState(null)
  const [viewMapClass, setViewMapClass] = useState(null) // { cls, occurrenceId, fecha }
  const isAdminOrCoach = usuario?.rol === 'admin' || usuario?.rol === 'coach'
  const isAdmin = usuario?.rol === 'admin'
  const [viewMode, setViewMode] = useState('day') // 'day' | 'week'
  const [occurrencesByClass, setOccurrencesByClass] = useState({})
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [isLoadingOccurrences, setIsLoadingOccurrences] = useState(true)
  const useApiClasses = import.meta.env.VITE_USE_API_CLASSES === 'true'
  const useApiReservations = import.meta.env.VITE_USE_API_RESERVATIONS === 'true'
  const useApiAuth = import.meta.env.VITE_USE_API_AUTH === 'true'
  const siteConfig = useEffectiveSiteConfiguration()
  const useApiCoachAvatars = useApiClasses || useApiReservations
  const financialStateQuery = useMyFinancialStateQuery({
    enabled: useApiAuth && isAuthenticated && usuario?.rol === 'cliente',
  })
  const activeMembership = useApiAuth ? (financialStateQuery.data?.activeMembership ?? null) : null
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
  const selectedRange = useMemo(() => ({
    from: `${days[0].getFullYear()}-${String(days[0].getMonth() + 1).padStart(2, '0')}-${String(days[0].getDate()).padStart(2, '0')}`,
    to: `${days[days.length - 1].getFullYear()}-${String(days[days.length - 1].getMonth() + 1).padStart(2, '0')}-${String(days[days.length - 1].getDate()).padStart(2, '0')}`,
  }), [days])
  const selectedDateRange = useMemo(() => {
    const isoDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    return { from: isoDate, to: isoDate }
  }, [selectedDate])
  const occurrenceRange = viewMode === 'week' ? selectedRange : selectedDateRange
  const visibleClassIds = useMemo(() => allClasses
    .filter((cls) => {
      if (!filter) return true
      const discipline = normalizeDiscipline(cls.discipline ?? cls.tipo, cls.nombre ?? cls.name)
      return filter === 'Slow' ? discipline === 'slow' : discipline === 'stryde'
    })
    .map((cls) => cls.id), [allClasses, filter])

  const refreshVisibleOccurrences = useCallback(async () => {
    if (!useApiClasses || !visibleClassIds.length) return
    const data = await getOccurrencesForDateRangeApi(visibleClassIds, occurrenceRange)
    setOccurrencesByClass(data ?? {})
  }, [occurrenceRange, useApiClasses, visibleClassIds])

  useEffect(() => {
    if (!useApiClasses) { setIsLoadingClasses(false); setIsLoadingOccurrences(false); return }
    let active = true
    const fetchClasses = async (isFirst = false) => {
      try {
        await loadClasesFromApi()
      } catch (err) {
        if (active && import.meta.env.DEV) {
          console.error('[Clases] No se pudo cargar clases API, fallback cache/store', err)
        }
      } finally {
        if (active && isFirst) setIsLoadingClasses(false)
      }
    }
    fetchClasses(true)
    const intervalId = window.setInterval(() => {
      fetchClasses(false).catch(() => {})
    }, 35_000)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [loadClasesFromApi, useApiClasses])

  useEffect(() => {
    if (!useApiClasses || !visibleClassIds.length) {
      setOccurrencesByClass({})
      return
    }
    setIsLoadingOccurrences(true)
    let active = true
    let isFirst = true
    let controller = new AbortController()
    const fetchOccurrences = async () => {
      controller.abort()
      controller = new AbortController()
      try {
        const data = await getOccurrencesForDateRangeApi(visibleClassIds, { ...occurrenceRange, signal: controller.signal })
        if (active) {
          setOccurrencesByClass(data)
          if (isFirst) { isFirst = false; setIsLoadingOccurrences(false) }
        }
      } catch (err) {
        if (err?.name === 'AbortError') return
        if (active && isFirst) { isFirst = false; setIsLoadingOccurrences(false) }
      }
    }

    fetchOccurrences().catch(() => {})

    return () => {
      active = false
      controller.abort()
    }
  }, [occurrenceRange, useApiClasses, visibleClassIds])

  // Classes for the selected day, filtered by discipline.
  // Uses slow-based detection: anything that doesn't contain 'slow' is Stryde.
  // This handles 'Stryde X', 'Slow', and any custom variant.
  const isSlow = (tipo) => normalizeDiscipline(tipo) === 'slow'
  const resolveDiscipline = (value, fallbackText = '') => normalizeDiscipline(value, fallbackText)

  const occurrenceSessions = useMemo(() => {
    if (!useApiClasses) return []
    const sessions = []
    for (const cls of allClasses) {
      const occs = occurrencesByClass?.[cls.id] ?? []
      for (const occ of occs) {
        sessions.push({
          ...cls,
          classId: cls.id,
          claseId: cls.id,
          discipline: resolveDiscipline(occ.discipline ?? cls.discipline ?? cls.tipo, occ.claseNombre ?? cls.nombre),
          occurrenceId: occ.occurrenceId,
          fecha: occ.fecha,
          hora: getClassTimeToken(occ) ?? getClassTimeToken(cls) ?? null,
          cupoMax: occ.cupoMax ?? cls.cupoMax,
          cupoActual: occ.cupoActual ?? cls.cupoActual,
          estado: occ.estado ?? cls.estado,
          coachId: resolveCoachId(occ, cls),
          coachNombre: resolveCoachNombre(occ, cls),
          // Occurrence coach can differ from template coach. Resolve avatar from
          // effective coach ID before retaining any template-level image.
          coachAvatarUrl:
            coachFotoById[String(resolveCoachId(occ, cls) ?? '')]
            ?? occ.coachAvatarUrl
            ?? cls.coachAvatarUrl
            ?? null,
          nombre: occ.claseNombre ?? cls.nombre,
        })
      }
    }
    return sessions
  }, [allClasses, coachFotoById, occurrencesByClass, useApiClasses])

  const dayHasClasses = useMemo(() =>
    days.map((d) => {
      const forDay = useApiClasses
        ? occurrenceSessions.filter((c) => c.fecha === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
        : getPublicClassesByDate(allClasses, d)
      if (useApiClasses && viewMode === 'day' && !isSameDay(d, selectedDate)) return false
      return filter
        ? forDay.some((c) => isSlow(filter) ? resolveDiscipline(c.discipline ?? c.tipo) === 'slow' : resolveDiscipline(c.discipline ?? c.tipo) === 'stryde')
        : forDay.length > 0
    }),
    [days, allClasses, filter, occurrenceSessions, selectedDate, useApiClasses, viewMode]
  )

  const byTimeAsc = (a, b) => (getClassTimeToken(a) ?? '99:99').localeCompare(getClassTimeToken(b) ?? '99:99')

  const dayClasses = useMemo(() => {
    const selectedIso = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    const forDay = useApiClasses
      ? occurrenceSessions.filter((c) => c.fecha === selectedIso)
      : getPublicClassesByDate(allClasses, selectedDate)
    const sorted = forDay.slice().sort(byTimeAsc)
    return filter
      ? sorted.filter((c) => isSlow(filter) ? resolveDiscipline(c.discipline ?? c.tipo) === 'slow' : resolveDiscipline(c.discipline ?? c.tipo) === 'stryde')
      : sorted
  }, [selectedDate, filter, allClasses, occurrenceSessions, useApiClasses])

  // Classes for every day of the current week (used by week view)
  const weekClasses = useMemo(() => {
    return days.map((date) => {
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const forDay = useApiClasses
        ? occurrenceSessions.filter((c) => c.fecha === iso)
        : getPublicClassesByDate(allClasses, date)
      const sorted = forDay.slice().sort(byTimeAsc)
      return filter
        ? sorted.filter((c) => isSlow(filter) ? resolveDiscipline(c.discipline ?? c.tipo) === 'slow' : resolveDiscipline(c.discipline ?? c.tipo) === 'stryde')
        : sorted
    })
  }, [days, allClasses, occurrenceSessions, filter, useApiClasses])

  const selectedClassExistingReservations = useMemo(() => {
    if (!selectedClass) return []
    const selectedOccurrenceId = selectedClass.occurrenceId ?? selectedClass.occurrence_id ?? null
    const selectedOccurrenceDate = getReservationOccurrenceDate(selectedClass)
    return (reservas ?? []).filter((reservation) => {
      const status = String(reservation.estado ?? reservation.status ?? '').toLowerCase()
      if (!['confirmada', 'confirmed', 'programada', 'active', 'activa'].includes(status)) return false
      const sameOccurrence = Number(reservation.occurrenceId ?? reservation.occurrence_id ?? 0) === Number(selectedOccurrenceId ?? 0)
      if (sameOccurrence) return true
      if (!selectedOccurrenceDate) return false
      return (
        Number(reservation.claseId ?? reservation.classId ?? reservation.class_id ?? 0) === Number(selectedClass.classId ?? selectedClass.claseId ?? selectedClass.id ?? 0) &&
        getReservationOccurrenceDate(reservation) === selectedOccurrenceDate
      )
    })
  }, [reservas, selectedClass])

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

      {/* Discipline toggle + view mode */}
      <div className={styles.filterWrap}>
        <ClassTypeFilter active={filter} onChange={setFilter} />
        <button
          className={`${styles.weekViewBtn} ${viewMode === 'week' ? styles.weekViewBtnActive : ''}`}
          onClick={() => setViewMode(v => v === 'week' ? 'day' : 'week')}
          title="Vista semanal"
        >
          <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
            <rect x="0" y="0" width="6" height="5" rx="1.5" fill="currentColor" opacity="0.5"/>
            <rect x="8" y="0" width="6" height="5" rx="1.5" fill="currentColor" opacity="0.5"/>
            <rect x="16" y="0" width="6" height="5" rx="1.5" fill="currentColor" opacity="0.5"/>
            <rect x="0" y="7" width="6" height="5" rx="1.5" fill="currentColor"/>
            <rect x="8" y="7" width="6" height="5" rx="1.5" fill="currentColor"/>
            <rect x="16" y="7" width="6" height="5" rx="1.5" fill="currentColor"/>
            <rect x="0" y="14" width="6" height="4" rx="1.5" fill="currentColor" opacity="0.4"/>
            <rect x="8" y="14" width="6" height="4" rx="1.5" fill="currentColor" opacity="0.4"/>
            <rect x="16" y="14" width="6" height="4" rx="1.5" fill="currentColor" opacity="0.4"/>
          </svg>
          <span>Semana</span>
        </button>
      </div>

      {/*  Booking timeline*/}
      <div className={styles.bookingWrap}>

        {/* Day navigation — solo en vista diaria */}
        <div className={styles.dayNav} style={viewMode === 'week' ? { display: 'none' } : {}}>
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

        {/* Month label — solo en vista diaria */}
        {viewMode === 'day' && <p className={styles.monthLabel}>{monthLabel}</p>}

        {/* ── WEEK VIEW ── */}
        {viewMode === 'week' && (
          <>
            {/* Navegación de semana */}
            <div className={styles.weekNav}>
              <button
                className={`${styles.navBtn} ${weekOffset === 0 ? styles.navBtnOff : ''}`}
                onClick={handlePrevWeek}
                disabled={weekOffset === 0}
                aria-label="Semana anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <span className={styles.monthLabel} style={{ margin: 0 }}>{monthLabel}</span>
              <button
                className={styles.navBtn}
                onClick={handleNextWeek}
                aria-label="Siguiente semana"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          <div className={styles.weekGrid}>
            {(isLoadingClasses || isLoadingOccurrences) ? (
              <>
                <span className={styles.weekLoadingLabel} role="status">Cargando clases de la semana...</span>
                {days.map((date, di) => (
                  <div key={di} className={styles.weekCol} aria-hidden="true">
                    <div className={`${styles.weekColHeader} ${isSameDay(date, new Date()) ? styles.weekColHeaderToday : ''}`}>
                      <span className={styles.weekColAbbr}>{DAYS_ABBR[date.getDay()]}</span>
                      <span className={styles.weekColNum}>{date.getDate()}</span>
                    </div>
                    <div className={styles.weekColBody}>
                      <div className={styles.weekSkeletonCard} />
                      <div className={styles.weekSkeletonCard} />
                    </div>
                  </div>
                ))}
              </>
            ) : days.map((date, di) => {
              const today = isSameDay(date, new Date())
              const classes = weekClasses[di] ?? []
              return (
                <div key={di} className={styles.weekCol}>
                  <div className={`${styles.weekColHeader} ${today ? styles.weekColHeaderToday : ''}`}>
                    <span className={styles.weekColAbbr}>{DAYS_ABBR[date.getDay()]}</span>
                    <span className={styles.weekColNum}>{date.getDate()}</span>
                  </div>
                  <div className={styles.weekColBody}>
                    {classes.length === 0 ? (
                      <div className={styles.weekEmpty}>—</div>
                    ) : classes.map((cls, ci) => {
                      const classTime = getClassTimeToken(cls)
                      const { available, status } = getPublicAvailability(cls)
                      const isFull = status === 'full'
                      const classDiscipline = resolveDiscipline(cls.discipline ?? cls.tipo)
                      const coachFoto = coachFotoById[String(cls.coachId ?? cls.coach_id ?? '')]
                        ?? cls.coachAvatarUrl
                        ?? coachFotoByName[String(cls.coachNombre ?? cls.coach ?? '')]
                        ?? null
                      return (
                        <button
                          key={ci}
                          className={`${styles.weekCard} ${isFull ? styles.weekCardFull : ''}`}
                          onClick={() => {
                            if (isFull) return
                            if (!isAuthenticated) { navigate(ROUTES.login, { state: { selectedClass: cls } }); return }
                            setSelectedDate(date)
                            setSelectedClass(cls)
                          }}
                          disabled={isFull}
                        >
                          <div className={styles.weekCardTime}>{formatHour(classTime)}</div>
                          <div className={styles.weekCardAvail}>{isFull ? 'LLENO' : `${available} lugar${available === 1 ? '' : 'es'}`}</div>
                          <div className={styles.weekCardCoach}>
                            <CoachAvatar name={cls.coachNombre ?? cls.coach ?? ''} avatarUrl={coachFoto} size={18} />
                            <span>{cls.coachNombre}</span>
                          </div>
                          <span className={`${styles.weekCardBadge} ${classDiscipline === 'stryde' ? styles.weekCardBadgeStride : styles.weekCardBadgeSlow}`}>
                            {classDiscipline === 'stryde' ? 'STRYDE X' : 'SLOW'}
                          </span>
                          <div className={styles.weekCardName}>{cls.nombre}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          </>
        )}

        {/* ── DAY VIEW ── */}
        {viewMode === 'day' && <div className={styles.classList}>
          {(isLoadingClasses || isLoadingOccurrences) ? (
            <div className={styles.skeletonList}>
              {[1, 2, 3].map(n => (
                <div key={n} className={styles.skeletonCard} />
              ))}
            </div>
          ) : dayClasses.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📅</span>
              <p>Sin clases este día</p>
            </div>
          ) : (
            dayClasses.map((cls, i) => {
              const { available, status } = getPublicAvailability(cls)
              const isFull  = status === 'full'
              const isLow   = status === 'low'
              const classDiscipline = resolveDiscipline(cls.discipline ?? cls.tipo, cls.nombre)
              const isMapClass = classDiscipline === 'slow' || classDiscipline === 'stryde'
              const coachFoto = coachFotoById[String(cls.coachId ?? cls.coach_id ?? '')]
                ?? cls.coachAvatarUrl
                ?? coachFotoByName[String(cls.coachNombre ?? cls.coach ?? '')]
                ?? null
              const classTime = getClassTimeToken(cls)

              // selectedDate is a Date object - convert to ISO string before matching reservation occurrence
              const selectedDateISO = selectedDate instanceof Date
                ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
                : selectedDate

              const misReservasClase = isAuthenticated && usuario
                ? reservas.filter((r) => {
                    if (!(r.userId === usuario.id && r.estado === 'confirmada')) return false
                    if (!useApiReservations) return true
                    if (cls.occurrenceId) return Number(r.occurrenceId) === Number(cls.occurrenceId)
                    const occurrenceDate = getReservationOccurrenceDate(r)
                    if (!occurrenceDate || Number(r.claseId) !== Number(cls.id)) return false
                    return occurrenceDate === selectedDateISO
                  })
                : []
              const miReserva = misReservasClase[0] ?? null
              const canReserveAnother = canReserveAnotherSpotInOccurrence({
                isMapClass,
                hasActiveReservationInOccurrence: Boolean(miReserva),
                activeMembership,
              })
              const isSingleSpotLimited = isMapClass && Boolean(miReserva) && resolveLimitOneSpotPerOccurrence(activeMembership)
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
                    <div className={styles.classMeta}>
                      <span className={styles.coachName}>
                        {cls.coachNombre}
                      </span>
                      {(() => {
                        return (
                          <span className={`${styles.typeBadge} ${classDiscipline === 'stryde' ? styles.typeBadgeStride : classDiscipline === 'slow' ? styles.typeBadgeSlow : ''}`}>
                            {classDiscipline === 'slow' ? 'SLOW' : classDiscipline === 'stryde' ? 'STRYDE X' : 'Sin tipo'}
                          </span>
                        )
                      })()}
                    </div>
                    <div className={styles.classTitleRow}>
                      <span className={styles.className}>{cls.nombre}</span>
                    </div>
                    {(cls.descripcion || cls.description) && (
                      <div className={styles.classDesc}>{cls.descripcion ?? cls.description}</div>
                    )}
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <span className={styles.cancelarVencido} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0, display: 'inline-block' }} />
                          Clase finalizada
                        </span>
                        {isAdmin && isMapClass && cls.occurrenceId && (
                          <button
                            className={styles.reservarBtn}
                            style={{ fontSize: 11, padding: '6px 12px' }}
                            onClick={() => setViewMapClass({ cls, occurrenceId: cls.occurrenceId, fecha: selectedDate })}
                          >
                            Ver mapa
                          </button>
                        )}
                      </div>
                    ) : miReserva ? (
                      <div className={styles.reservadaWrap}>
                        <span className={styles.reservadaBadge}>CONFIRMADA</span>
                        {cancelAllowed ? (
                          misReservasClase.map((reservation) => (
                            <button
                              key={reservation.id}
                              className={styles.cancelarBtn}
                              onClick={() => cancelarReservaService(reservation.id, usuario.id)}
                            >
                              {reservation.spotLabel ? `Cancelar ${reservation.spotLabel}` : 'Cancelar'}
                            </button>
                          ))
                        ) : (
                          <span className={styles.cancelarVencido}>Sin cancelación disponible</span>
                        )}
                        {canReserveAnother && !isAdmin ? (
                          <button
                            className={styles.reservarBtn}
                            onClick={() => setSelectedClass(cls)}
                            disabled={isFull}
                          >
                            Reservar otro
                          </button>
                        ) : isSingleSpotLimited ? (
                          <span className={styles.cancelarVencido}>
                            {getOneSpotPerOccurrenceMessage()}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      !isAdmin && (
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
                      )
                    )}
                    {isAdmin && isMapClass && cls.occurrenceId && !clasePasada && (
                      <button
                        className={styles.reservarBtn}
                        style={{ fontSize: 11, padding: '6px 12px', marginTop: 4 }}
                        onClick={() => setViewMapClass({ cls, occurrenceId: cls.occurrenceId, fecha: selectedDate })}
                      >
                        Ver mapa
                      </button>
                    )}
                  </div>

                </div>
              )
            })
          )}
        </div>}
      </div>

      
      {viewMapClass && (
        <SeatMapViewer
          cls={viewMapClass.cls}
          occurrenceId={viewMapClass.occurrenceId}
          fecha={viewMapClass.fecha}
          onClose={() => setViewMapClass(null)}
        />
      )}

      {selectedClass && (
        useApiReservations && selectedClass.occurrenceId ? (
          <EquipmentReservationPanel
            occurrenceId={selectedClass.occurrenceId}
            classId={selectedClass.classId ?? selectedClass.claseId ?? selectedClass.id}
            userId={usuario?.id}
            hasExistingReservationInOccurrence={selectedClassExistingReservations.length > 0}
            limitErrorMessage={getOneSpotPerOccurrenceMessage()}
            coachAvatarUrl={coachFotoById[String(selectedClass.coachId ?? selectedClass.coach_id ?? '')] ?? selectedClass.coachAvatarUrl ?? coachFotoByName[String(selectedClass.coachNombre ?? selectedClass.coach ?? '')] ?? null}
            onReservationCreated={async () => {
              await Promise.allSettled([
                loadClasesFromApi?.(),
                loadMisReservasFromApi?.(),
                refreshVisibleOccurrences(),
                queryClient.invalidateQueries({ queryKey: queryKeys.reservations.me() }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myFinancialState }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships }),
                queryClient.invalidateQueries({ queryKey: queryKeys.myCreditMovements() }),
                queryClient.invalidateQueries({ queryKey: queryKeys.spots.byOccurrence(selectedClass.occurrenceId) }),
              ])
            }}
            onClose={() => setSelectedClass(null)}
          />
        ) : (
          <SeatSelector
            cls={{
              ...selectedClass,
              coachAvatarUrl: coachFotoById[String(selectedClass.coachId ?? selectedClass.coach_id ?? '')] ?? selectedClass.coachAvatarUrl ?? coachFotoByName[String(selectedClass.coachNombre ?? selectedClass.coach ?? '')] ?? null,
            }}
            onClose={() => setSelectedClass(null)}
            fecha={selectedDate}
          />
        )
      )}

    </main>
  )
}
