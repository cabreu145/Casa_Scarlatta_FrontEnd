import { useState } from 'react'
import styles from './WeeklyCalendar.module.css'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAY_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

function spotsStatus(spots) {
  if (spots === 0) return 'full'
  if (spots <= 2) return 'critical'
  if (spots <= 5) return 'low'
  return 'ok'
}

function SpotsBadge({ spots }) {
  const status = spotsStatus(spots)
  if (status === 'full') {
    return <span className={`${styles.badge} ${styles.badgeFull}`}>LLENO</span>
  }
  return (
    <span className={`${styles.badge} ${styles['badge_' + status]}`}>
      <span className={styles.dot} />
      {spots} lugares
    </span>
  )
}

function ClassBlock({ cls, onSelect }) {
  const isFull = cls.spots === 0
  return (
    <button
      className={`${styles.block} ${isFull ? styles.blockFull : ''}`}
      onClick={() => !isFull && onSelect && onSelect(cls)}
      disabled={isFull}
      aria-label={`${cls.name}, ${cls.day} ${cls.time}, ${cls.spots} lugares`}
    >
      <div className={styles.blockTop}>
        <span className={`${styles.typeTag} ${styles['type_' + cls.type.toLowerCase()]}`}>
          {cls.type}
        </span>
      </div>
      <p className={styles.blockName}>{cls.name}</p>
      <p className={styles.blockMeta}>{cls.time} · {cls.duration} min</p>
      <p className={styles.blockInstructor}>{cls.instructor}</p>
      <SpotsBadge spots={cls.spots} />
    </button>
  )
}

export default function WeeklyCalendar({ classes, onSelectClass }) {
  const [activeDay, setActiveDay] = useState(0)
  const byDay = DAYS.map(day => classes.filter(c => c.day === day))

  return (
    <div className={styles.wrapper}>
      {/* Mobile tabs */}
      <div className={styles.mobileTabs} role="tablist">
        {DAY_SHORT.map((d, i) => (
          <button
            key={d}
            role="tab"
            aria-selected={i === activeDay}
            className={`${styles.mobileTab} ${i === activeDay ? styles.mobileTabActive : ''}`}
            onClick={() => setActiveDay(i)}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Desktop: columnas por día */}
      <div className={styles.grid}>
        {DAYS.map((day, i) => (
          <div key={day} className={styles.column}>
            <div className={styles.dayHeader}>{DAY_SHORT[i]}</div>
            <div className={styles.slots}>
              {byDay[i].length === 0
                ? <p className={styles.empty}>—</p>
                : byDay[i].map((c, j) => (
                    <ClassBlock key={j} cls={c} onSelect={onSelectClass} />
                  ))
              }
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: un día a la vez */}
      <div className={styles.mobileDay}>
        <div className={styles.slots}>
          {byDay[activeDay].length === 0
            ? <p className={styles.empty}>Sin clases este día</p>
            : byDay[activeDay].map((c, j) => (
                <ClassBlock key={j} cls={c} onSelect={onSelectClass} />
              ))
          }
        </div>
      </div>
    </div>
  )
}
