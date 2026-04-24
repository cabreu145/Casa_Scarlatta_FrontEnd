import styles from './SkeletonLoader.module.css'

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 12px' }}>
          <div className={styles.skeletonLine} style={{ width: i === 0 ? '70%' : i === cols - 1 ? '40%' : '85%' }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  )
}

export function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonLine} style={{ width: '40%', height: 12 }} />
      <div className={styles.skeletonLine} style={{ width: '60%', height: 28, marginTop: 8 }} />
    </div>
  )
}
