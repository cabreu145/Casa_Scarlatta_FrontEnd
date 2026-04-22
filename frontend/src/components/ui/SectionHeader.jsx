import styles from './SectionHeader.module.css'

export default function SectionHeader({
  label,
  title,
  subtitle,
  size = 'lg',
  center = false,
  dark = false,
}) {
  return (
    <div
      className={[
        styles.wrapper,
        styles[size],
        center ? styles.center : '',
      ].filter(Boolean).join(' ')}
    >
      {label && <span className={styles.label} style={dark ? { color: 'rgba(245,237,232,0.5)' } : {}}>{label}</span>}
      <h2 className={styles.title} style={dark ? { color: 'var(--text-on-dark)' } : {}}>{title}</h2>
      {subtitle && (
        <p className={styles.subtitle} style={dark ? { color: 'rgba(245,237,232,0.65)' } : {}}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
