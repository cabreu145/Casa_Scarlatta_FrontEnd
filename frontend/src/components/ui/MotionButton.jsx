import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import styles from './MotionButton.module.css'

export default function MotionButton({ label, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      className={styles.motionBtn}
      onClick={onClick}
      initial={{ width: 56 }}
      animate={{ width: hovered ? 200 : 56 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      style={{ height: 56, borderRadius: 28 }}
    >
      <motion.span
        className={styles.icon}
        animate={{ opacity: hovered ? 0 : 1, scale: hovered ? 0.6 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <ArrowRight size={20} />
      </motion.span>

      <motion.span
        className={styles.btnText}
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.18, delay: hovered ? 0.12 : 0 }}
      >
        {label}
      </motion.span>
    </motion.button>
  )
}
