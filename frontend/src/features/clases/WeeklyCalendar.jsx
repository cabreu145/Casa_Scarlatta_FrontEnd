import { useState } from 'react'
import styles from './WeeklyCalendar.module.css'

const DAYS_ES   = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAYS_ABBR = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getWeekWindow(offsetWeeks = 0) {
  const result = []
  const today  = new Date()
  const base   = new Date(today)
  base.setDate(today.getDate() + offsetWeeks * 7)

  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    result.push({
      fullName:   DAYS_ES[d.getDay()],
      abbr:       DAYS_ABBR[d.getDay()],
      dateLabel:  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      isToday:    offsetWeeks === 0 && i === 0,
      monthIndex: d.getMonth(),
      year:       d.getFullYear(),
    })
  }
  return result
}

function getMonthLabel(days) {
  const first = days[0]
  const last  = days[days.length - 1]
  if (first.monthIndex === last.monthIndex) {
    return `${MONTHS_ES[first.monthIndex]} ${first.year}`
  }
  return `${MONTHS_ES[first.monthIndex]} – ${MONTHS_ES[last.monthIndex]} ${last.year}`
}

function formatTime(time) {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hr     = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hr}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

function isPastTime(time) {
  const now    = new Date()
  const [h, m] = time.split(':').map(Number)
  return (h * 60 + (m || 0)) < (now.getHours() * 60 + now.getMinutes())
}

function ClassBlock({ cls, onSelect, isToday }) {
  const spotsDisponibles = cls.cupoMax - cls.cupoActual
  const isFull    = spotsDisponibles === 0
  const isPast    = isToday && isPastTime(cls.hora)
  const disabled  = isFull || isPast
  const spotsLow  = spotsDisponibles > 0 && spotsDisponibles <= 3

  return (
    <button
      className={`${styles.block} ${isFull ? styles.blockFull : ''} ${isPast ? styles.blockPast : ''}`}
      onClick={() => !disabled && onSelect && onSelect(cls)}
      disabled={disabled}
      aria-label={`${cls.nombre} con ${cls.coachNombre} a las ${cls.hora}`}
    >
      <span className={`${styles.typeTag} ${styles['type_' + cls.tipo.toLowerCase()]}`}>
        {cls.tipo}
      </span>
      <p className={styles.blockName}>{cls.nombre}</p>
      <p className={styles.blockMeta}>{formatTime(cls.hora)} · {cls.duracion} min</p>
      <p className={styles.blockInstructor}>{cls.coachNombre}</p>
      {isFull
        ? <span className={styles.spotsFull}>LLENO</span>
        : <span className={`${styles.spots} ${spotsLow ? styles.spotsLow : styles.spotsOk}`}>
            ● {spotsDisponibles} lugares
          </span>
      }
    </button>
  )
}

export default function WeeklyCalendar({ classes, onSelectClass }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeDay, setActiveDay]   = useState(0)
  const days  = getWeekWindow(weekOffset)
  const label = getMonthLabel(days)

  const byDay = days.map(({ fullName }) =>
    classes
      .filter(c => c.dia === fullName)
      .sort((a, b) => a.hora.localeCompare(b.hora))
  )

  return (
    <div className={styles.wrapper}>

      {/* ── Month nav ── */}
      <div className={styles.monthNav}>
        <button
          className={`${styles.navBtn} ${weekOffset === 0 ? styles.navBtnDisabled : ''}`}
          onClick={() => { setWeekOffset(0); setActiveDay(0) }}
          disabled={weekOffset === 0}
          aria-label="Regresar a semana actual"
        >
          ←
        </button>

        <span className={styles.monthLabel}>{label}</span>

        <button
          className={styles.navBtn}
          onClick={() => setWeekOffset(w => w + 1)}
          aria-label="Siguiente semana"
        >
          →
        </button>
      </div>

      {/* ── Desktop grid ── */}
      <div className={styles.grid}>
        {days.map(({ abbr, dateLabel, isToday }, i) => (
          <div key={i} className={`${styles.column} ${isToday ? styles.columnToday : ''}`}>
            <div className={`${styles.colHeader} ${isToday ? styles.colHeaderToday : ''}`}>
              <span className={styles.colDate}>{dateLabel}</span>
              <span className={styles.colDay}>{abbr}</span>
            </div>
            <div className={styles.slots}>
              {byDay[i].length === 0
                ? <div className={styles.emptySlot} />
                : byDay[i].map((c, j) => (
                    <ClassBlock key={j} cls={c} onSelect={onSelectClass} isToday={isToday} />
                  ))
              }
            </div>
          </div>
        ))}
      </div>

      {/* ── Mobile tabs ── */}
      <div className={styles.mobileTabs}>
        {days.map(({ abbr, dateLabel }, i) => (
          <button
            key={i}
            className={`${styles.mobileTab} ${i === activeDay ? styles.mobileTabActive : ''}`}
            onClick={() => setActiveDay(i)}
          >
            <span className={styles.mobileTabDate}>{dateLabel}</span>
            <span className={styles.mobileTabDay}>{abbr}</span>
          </button>
        ))}
      </div>

      {/* ── Mobile single day ── */}
      <div className={styles.mobileDay}>
        {byDay[activeDay].length === 0
          ? <p className={styles.emptyText}>Sin clases este día</p>
          : byDay[activeDay].map((c, j) => (
              <ClassBlock key={j} cls={c} onSelect={onSelectClass} isToday={days[activeDay].isToday} />
            ))
        }
      </div>
    </div>
  )
}
