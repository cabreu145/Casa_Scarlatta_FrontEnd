import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ClassTypeFilter from '@/features/clases/ClassTypeFilter'
import WeeklyCalendar from '@/features/clases/WeeklyCalendar'
import SeatSelector from '@/features/clases/SeatSelector'
import { classes } from '@/data/classes'
import styles from './Clases.module.css'

export default function Clases() {
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState(searchParams.get('tipo') || 'Stride')
  const [selectedClass, setSelectedClass] = useState(null)

  const filtered = filter ? classes.filter(c => c.type === filter) : classes

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.heroLabel}>RESERVA TU LUGAR</span>
          <h1 className={styles.heroTitle}>CLASES</h1>
        </div>
      </section>

      <div className={styles.filterWrap}>
        <ClassTypeFilter active={filter} onChange={setFilter} />
      </div>

      <div className={styles.calendarWrap}>
        <WeeklyCalendar classes={filtered} onSelectClass={setSelectedClass} />
      </div>

      {selectedClass && (
        <SeatSelector cls={selectedClass} onClose={() => setSelectedClass(null)} />
      )}
    </main>
  )
}
