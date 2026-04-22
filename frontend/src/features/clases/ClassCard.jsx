import { Clock, Users, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import HeartButton from '@/components/ui/HeartButton'
import styles from './ClassCard.module.css'

export default function ClassCard({ name, type, instructor, time, day, duration, spots, totalSpots }) {
  const isLow = spots <= 4

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <span className={`${styles.type} ${styles[type?.toLowerCase()]}`}>
          <span className={styles.dot} />
          {type}
        </span>
        <HeartButton />
      </div>

      <h3 className={styles.name}>{name}</h3>
      <p className={styles.instructor}>con {instructor}</p>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <Calendar size={13} />
          {day}
        </div>
        <div className={styles.metaItem}>
          <Clock size={13} />
          {time} · {duration} min
        </div>
        <div className={styles.metaItem}>
          <Users size={13} />
          {totalSpots} cupos
        </div>
      </div>

      <div className={styles.footer}>
        <span className={`${styles.spots} ${isLow ? styles.low : ''}`}>
          {isLow ? `¡Solo ${spots} lugares!` : `${spots} lugares disponibles`}
        </span>
        <Link to="/reservar" className={styles.reserveBtn}>Reservar</Link>
      </div>
    </div>
  )
}
