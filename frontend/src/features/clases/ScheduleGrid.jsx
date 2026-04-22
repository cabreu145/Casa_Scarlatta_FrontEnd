import { Link } from 'react-router-dom'
import styles from './ScheduleGrid.module.css'

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function ScheduleGrid({ classes }) {
  if (!classes?.length) return null

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Clase</th>
            <th>Día</th>
            <th>Hora</th>
            <th>Duración</th>
            <th>Instructor/a</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c, i) => (
            <tr key={i}>
              <td>
                <div className={styles.className}>{c.name}</div>
                <span className={`${styles.badge} ${styles[c.type?.toLowerCase()]}`}>
                  <span className={styles.dot} />{c.type}
                </span>
              </td>
              <td>{c.day}</td>
              <td>{c.time}</td>
              <td>{c.duration} min</td>
              <td>{c.instructor}</td>
              <td>
                <Link to="/reservar" className={styles.reserveBtn} style={{
                  fontSize: '12px', fontWeight: 500, color: 'var(--brand-wine)',
                  textDecoration: 'underline', textUnderlineOffset: '2px',
                }}>
                  Reservar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
