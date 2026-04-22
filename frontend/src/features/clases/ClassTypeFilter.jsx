import styles from './ClassTypeFilter.module.css'

const filters = ['Todos', 'Suet', 'Flow']

export default function ClassTypeFilter({ active, onChange }) {
  return (
    <div className={styles.wrap}>
      {filters.map(f => (
        <button
          key={f}
          className={`${styles.btn} ${active === f ? styles.active : ''}`}
          onClick={() => onChange(f)}
        >
          {f}
        </button>
      ))}
    </div>
  )
}
