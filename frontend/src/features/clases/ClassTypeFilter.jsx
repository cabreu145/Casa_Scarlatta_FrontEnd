import styles from './ClassTypeFilter.module.css'

const filters = [
  { value: 'Stride', label: 'STRIDE' },
  { value: 'Slow', label: 'SLOW' },
]

export default function ClassTypeFilter({ active, onChange }) {
  return (
    <div className={styles.wrap}>
      {filters.map(({ value, label }) => (
        <button
          key={value}
          className={`${styles.btn} ${active === value ? styles.active : ''}`}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
