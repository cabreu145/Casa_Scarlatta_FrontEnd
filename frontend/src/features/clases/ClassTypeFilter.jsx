import styles from './ClassTypeFilter.module.css'

const filters = [
  { value: 'Stryde X', img: 'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/Isotipo_SX_wzpolg.png', alt: 'STRYDE X' },
  { value: 'Slow', img: 'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/SLOW_ISOTIPO_piojoa.png', alt: 'slow.' },
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
