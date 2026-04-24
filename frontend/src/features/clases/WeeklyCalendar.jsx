import { useState } from 'react'
import styles from './WeeklyCalendar.module.css'

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAYS_ABBR = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

function getWeekWindow() {
  const result = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    result.push({
      fullName: DAYS_ES[d.getDay()],
      abbr: DAYS_ABBR[d.getDay()],
      dateLabel: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      isToday: i === 0,
    })
  }
  return result
}

function formatTime(time) {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hr}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

function isPastTime(time) {
  const now = new Date()
  const [h, m] = time.split(':').map(Number)
  return (h * 60 + (m || 0)) < (now.getHours() * 60 + now.getMinutes())
}

function ClassBlock({ cls, onSelect, isToday }) {
  const isFull = cls.spots === 0
  const isPast = isToday && isPastTime(cls.time)
  const disabled = isFull || isPast
  const spotsLow = cls.spots > 0 && cls.spots <= 3

  return (
    <button
      className={`${styles.block} ${isFull ? styles.blockFull : ''} ${isPast ? styles.blockPast : ''}`}
      onClick={() => !disabled && onSelect && onSelect(cls)}
      disabled={disabled}
      aria-label={`${cls.name} con ${cls.instructor} a las ${cls.time}`}
    >
      <span className={`${styles.typeTag} ${styles['type_' + cls.type.toLowerCase()]}`}>
        {cls.type}
      </span>
      <p className={styles.blockName}>{cls.name}</p>
      <p className={styles.blockMeta}>{formatTime(cls.time)} · {cls.duration} min</p>
      <p className={styles.blockInstructor}>{cls.instructor}</p>
      {isFull
        ? <span className={styles.spotsFull}>LLENO</span>
        : <span className={`${styles.spots} ${spotsLow ? styles.spotsLow : styles.spotsOk}`}>
            ● {cls.spots} lugares
          </span>
      }
    </button>
  )
}

export default function WeeklyCalendar({ classes, onSelectClass }) {
  const [activeDay, setActiveDay] = useState(0)
  const days = getWeekWindow()

  const byDay = days.map(({ fullName }) =>
    classes
      .filter(c => c.day === fullName)
      .sort((a, b) => a.time.localeCompare(b.time))
  )

  return (
    <div className={styles.wrapper}>
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
