import styles from './ClassTypeFilter.module.css'

const filters = [
  { value: 'Stryde X', img: '/brand/Isotipo_SX.png', alt: 'STRYDE X' },
  { value: 'Slow', img: '/brand/SLOW_ISOTIPO.png', alt: 'slow.' },
]

export default function ClassTypeFilter({ active, onChange }) {
  return (
    <div className={styles.wrap}>
      {filters.map(({ value, img, alt }) => (
        <button
          key={value}
          className={`${styles.btn} ${active === value ? styles.active : ''}`}
          onClick={() => onChange(value)}
          aria-label={alt}
        >
          <img src={img} alt={alt} className={`${styles.isotipo} ${value === 'Slow' ? styles.isotipoSlow : ''}`} draggable="false" />
        </button>
      ))}
    </div>
  )
}
