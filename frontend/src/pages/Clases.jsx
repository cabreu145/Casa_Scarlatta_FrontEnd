import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'
import BrandBlob from '@/components/ui/BrandBlob'
import ClassCard from '@/features/clases/ClassCard'
import ClassTypeFilter from '@/features/clases/ClassTypeFilter'
import ScheduleGrid from '@/features/clases/ScheduleGrid'
import { classes } from '@/data/classes'
import styles from './Clases.module.css'

export default function Clases() {
  const [filter, setFilter] = useState('Todos')
  const [view, setView] = useState('grid')

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
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${view === 'grid' ? styles.active : ''}`}
                onClick={() => setView('grid')}
                aria-label="Vista en cuadrícula"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`${styles.viewBtn} ${view === 'list' ? styles.active : ''}`}
                onClick={() => setView('list')}
                aria-label="Vista en lista"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.content}>
        <p className={styles.count}>{filtered.length} clases disponibles</p>
        {view === 'grid' ? (
          <div className={styles.grid}>
            {filtered.map((c, i) => (
              <ClassCard key={i} {...c} />
            ))}
          </div>
        ) : (
          <ScheduleGrid classes={filtered} />
        )}
      </div>
    </main>
  )
}
