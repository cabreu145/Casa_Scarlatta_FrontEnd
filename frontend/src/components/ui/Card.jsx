import styles from './Card.module.css'

export default function Card({ children, className = '', style = {}, onClick }) {
  return (
    <div
      className={`${styles.card} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
