import { ArrowRight } from 'lucide-react'
import styles from './MotionButton.module.css'

export default function MotionButton({ label, onClick }) {
  return (
    <button className={styles.motionBtn} onClick={onClick}>
      <span className={styles.circle} aria-hidden="true" />
      <div className={styles.icon}>
        <ArrowRight size={20} />
      </div>
      <span className={styles.btnText}>{label}</span>
    </button>
  )
}
