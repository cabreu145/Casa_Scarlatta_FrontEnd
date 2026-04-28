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
import { useClasesStore } from '@/stores/clasesStore'
import { useAuth } from '@/context/AuthContext'
import { getPublicClassesByDate, getPublicAvailability } from '@/services/classService'
import { ROUTES } from '@/constants/routes'
import styles from './Clases.module.css'

// ─── Avatar helpers ───────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: 'rgba(123,31,46,0.14)', text: '#7B1F2E' },
  { bg: 'rgba(194,107,122,0.18)', text: '#b05060' },
  { bg: 'rgba(154,123,107,0.18)', text: '#7A6560' },
  { bg: 'rgba(92,16,24,0.13)', text: '#5C1018' },
]

function getInitials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function avatarStyle(name) {
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const DAYS_ES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const DAYS_ABBR = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getWeekDays(offset = 0) {
  const today = new Date()
  const dow   = today.getDay()
  const start = new Date(today)
  start.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function getMonthLabel(days) {
  const a = days[0], b = days[days.length - 1]
  if (a.getMonth() === b.getMonth())
    return `${MONTHS_ES[a.getMonth()].toUpperCase()} ${b.getFullYear()}`
  return `${MONTHS_ES[a.getMonth()].toUpperCase()} – ${MONTHS_ES[b.getMonth()].toUpperCase()} ${b.getFullYear()}`
}

function isSameDay(a, b) {
  return a.getDate()     === b.getDate()  &&
         a.getMonth()    === b.getMonth() &&
         a.getFullYear() === b.getFullYear()
}

function formatHour(time) {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'p.m.' : 'a.m.'
  const hr     = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hr}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Clases() {
  const { clases: allClasses } = useClasesStore()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams]  = useSearchParams()
  const [filter, setFilter]         = useState(searchParams.get('tipo') || 'Stride')
  const [selectedClass, setSelectedClass] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate]   = useState(new Date())

  const days       = useMemo(() => getWeekDays(weekOffset), [weekOffset])
  const monthLabel = useMemo(() => getMonthLabel(days),     [days])
  const selectedIdx = days.findIndex((d) => isSameDay(d, selectedDate))

  // Classes for the selected day, filtered by discipline, via service
  const dayClasses = useMemo(() => {
    const forDay = getPublicClassesByDate(allClasses, selectedDate)
    return filter ? forDay.filter((c) => c.tipo === filter) : forDay
  }, [selectedDate, filter])

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
              const location = cls.ubicacion ?? (cls.tipo === 'Stride' ? 'Studio A' : 'Studio B')

              const { bg, text } = avatarStyle(cls.coachNombre)

              return (
                <div key={i} className={`${styles.classCard} ${isFull ? styles.classCardFull : ''}`}>

                  {/* AVATAR */}
                  <div className={styles.avatarWrap}>
                    <div className={styles.avatar} style={{ background: bg }}>
                      <span className={styles.avatarInitials} style={{ color: text }}>
                        {getInitials(cls.coachNombre)}
                      </span>
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
                      <span className={`${styles.typeBadge} ${cls.tipo === 'Stride' ? styles.typeBadgeStride : styles.typeBadgeSlow}`}>
                        {cls.tipo === 'Stride' ? 'STRYDE' : 'SLOW'}
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
                    {isFull ? (
                      <span className={styles.fullTag}>LLENO</span>
                    ) : (
                      <span className={`${styles.availTag} ${isLow ? styles.availTagLow : styles.availTagOk}`}>
                        <span className={styles.availDot} />
                        {available} {available === 1 ? 'lugar' : 'lugares'}
                      </span>
                    )}
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
                  </div>

                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Seat selector modal ── */}
      {selectedClass && (
        <SeatSelector cls={selectedClass} onClose={() => setSelectedClass(null)} />
      )}

    </main>
  )
}
