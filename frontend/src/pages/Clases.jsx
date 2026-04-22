import { useState } from 'react'
import SectionHeader from '@/components/ui/SectionHeader'
import BrandBlob from '@/components/ui/BrandBlob'
import ClassTypeFilter from '@/features/clases/ClassTypeFilter'
import WeeklyCalendar from '@/features/clases/WeeklyCalendar'
import SeatSelector from '@/features/clases/SeatSelector'
import { classes } from '@/data/classes'
import styles from './Clases.module.css'

export default function Clases() {
  const [filter, setFilter] = useState('Todos')
  const [selectedClass, setSelectedClass] = useState(null)

  const filtered = filter === 'Todos' ? classes : classes.filter(c => c.type === filter)

  return (
    <main>
      <section className={styles.hero}>
        <BrandBlob className={styles.blobTop} width={400} height={400} />
        <div className={styles.heroInner}>
          <SectionHeader
            label="Horarios"
            title="Todas las clases"
            subtitle="Elige tu ritmo. Reserva con anticipación — los cupos son limitados."
            size="lg"
          />
          <div className={styles.controls}>
            <ClassTypeFilter active={filter} onChange={setFilter} />
          </div>
        </div>
      </section>

      <div className={styles.content}>
        <p className={styles.count}>{filtered.length} clases disponibles esta semana</p>
        <WeeklyCalendar
          classes={filtered}
          onSelectClass={setSelectedClass}
        />
      </div>

      {selectedClass && (
        <SeatSelector
          cls={selectedClass}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </main>
  )
}
