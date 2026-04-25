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
          <ClassTypeFilter active={filter} onChange={setFilter} />
        </div>
      </section>

      <WeeklyCalendar classes={filtered} onSelectClass={setSelectedClass} />

      {selectedClass && (
        <SeatSelector cls={selectedClass} onClose={() => setSelectedClass(null)} />
      )}
    </main>
  )
}
