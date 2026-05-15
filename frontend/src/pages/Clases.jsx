/**
 * Clases.jsx
 * ─────────────────────────────────────────────────────
 * Página pública de listado y reserva de clases.
 * Incluye navegación semanal, filtro por disciplina (Stride/Slow)
 * y tarjetas de clase con disponibilidad en tiempo real.
 *
 * Usado en: App.jsx (ruta "/clases")
 * Depende de: classService, classes (data), ClassTypeFilter, SeatSelector
 * ─────────────────────────────────────────────────────
 */
import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import ClassTypeFilter from '@/features/clases/ClassTypeFilter'
import SeatSelector from '@/features/clases/SeatSelector'
import { useClasesStore }   from '@/stores/clasesStore'
import { useCoachesStore }  from '@/stores/coachesStore'
import { useReservasStore } from '@/stores/reservasStore'
import { useAuth } from '@/context/AuthContext'
import { getPublicClassesByDate, getPublicAvailability } from '@/services/classService'
import { cancelarReserva as cancelarReservaService } from '@/services/reservasService'
import { ROUTES } from '@/constants/routes'
import { getWeekDays, isSameDay, formatHour, getInitials, DAYS_ABBR, MONTHS_ES } from '@/utils/formatters'
import styles from './Clases.module.css'

// ─── Avatar helpers ───────────────────────────────────────────────────────────
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

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getMonthLabel(days) {
  const a = days[0], b = days[days.length - 1]
  if (a.getMonth() === b.getMonth())
    return `${MONTHS_ES[a.getMonth()].toUpperCase()} ${b.getFullYear()}`
  return `${MONTHS_ES[a.getMonth()].toUpperCase()} – ${MONTHS_ES[b.getMonth()].toUpperCase()} ${b.getFullYear()}`
}

function canCancelClass(date, hora) {
  const [h, m] = hora.split(':').map(Number)
  const classTime = new Date(date)
  classTime.setHours(h, m, 0, 0)
  return (classTime - new Date()) > 6 * 60 * 60 * 1000
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Clases() {
  const { clases: allClasses } = useClasesStore()
  const { coaches }            = useCoachesStore()
  const { reservas } = useReservasStore()
  const { isAuthenticated, usuario } = useAuth()

  const coachFotoByName = useMemo(
    () => Object.fromEntries(coaches.map((c) => [c.nombre, c.foto]).filter(([, f]) => f)),
    [coaches]
  )
  const navigate = useNavigate()
  const [searchParams]  = useSearchParams()
  const [filter, setFilter]         = useState(searchParams.get('tipo') || 'Stryde X')
  const [selectedClass, setSelectedClass] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate]   = useState(new Date())

  const days       = useMemo(() => getWeekDays(weekOffset), [weekOffset])
  const monthLabel = useMemo(() => getMonthLabel(days),     [days])
  const selectedIdx = days.findIndex((d) => isSameDay(d, selectedDate))

  // Classes for the selected day, filtered by discipline.
  // Uses slow-based detection: anything that doesn't contain 'slow' is Stryde.
  // This handles 'Stryde X', 'Slow', and any custom variant.
  const isSlow = (tipo) => tipo?.toLowerCase().includes('slow')

  const dayHasClasses = useMemo(() =>
    days.map((d) => {
      const forDay = getPublicClassesByDate(allClasses, d)
      return filter
        ? forDay.some((c) => isSlow(filter) ? isSlow(c.tipo) : !isSlow(c.tipo))
        : forDay.length > 0
    }),
    [days, allClasses, filter]
  )

  const dayClasses = useMemo(() => {
    const forDay = getPublicClassesByDate(allClasses, selectedDate)
    return filter
      ? forDay.filter((c) => isSlow(filter) ? isSlow(c.tipo) : !isSlow(c.tipo))
      : forDay
  }, [selectedDate, filter, allClasses])

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

      {/* ── Hero — keep exactly as-is ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.heroLabel}>RESERVA TU LUGAR</span>
          <h1 className={styles.heroTitle}>CLASES</h1>
        </div>
      </section>

      {/* ── Discipline toggle ── */}
      <div className={styles.filterWrap}>
        <ClassTypeFilter active={filter} onChange={setFilter} />
      </div>

      {/* ── Booking timeline ── */}
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
              const location = cls.ubicacion ?? (!isSlow(cls.tipo) ? 'Studio A' : 'Studio B')

              const { bg, text } = avatarStyle(cls.coachNombre)
              const coachFoto   = coachFotoByName[cls.coachNombre] || null

              const miReserva = isAuthenticated && usuario
                ? reservas.find(r => r.claseId === cls.id && r.userId === usuario.id && r.estado === 'confirmada')
                : null
              const cancelAllowed = miReserva ? canCancelClass(selectedDate, cls.hora) : false
              // selectedDate is a Date object — convert to ISO string before building datetime
              const selectedDateISO = selectedDate instanceof Date
                ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
                : selectedDate
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

                  {/* CENTER — class info */}
                  <div className={styles.classBody}>
                    <div className={styles.classTitleRow}>
                      <span className={styles.className}>{cls.nombre}</span>
                      <span className={`${styles.typeBadge} ${!isSlow(cls.tipo) ? styles.typeBadgeStride : styles.typeBadgeSlow}`}>
                        {!isSlow(cls.tipo) ? 'STRYDE' : 'SLOW'}
                      </span>
                    </div>
                    <div className={styles.classMeta}>
                      <span className={styles.metaItem}>
                        {cls.coachNombre}
                      </span>
                      <span className={styles.metaItem}>
                        <MapPin size={11} />{location}
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

      {/* ── Seat selector modal ── */}
      {selectedClass && (
        <SeatSelector cls={selectedClass} onClose={() => setSelectedClass(null)} fecha={selectedDate} />
      )}

    </main>
  )
}
