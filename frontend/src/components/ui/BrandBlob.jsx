import styles from './BrandBlob.module.css'

export default function BrandBlob({
  width = 400,
  height = 400,
  style = {},
  className = '',
  opacity = 0.35,
  color = 'var(--brand-blush)',
}) {
  return (
    <div
      className={`${styles.blob} ${className}`}
      style={{
        width,
        height,
        background: color,
        opacity,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}
