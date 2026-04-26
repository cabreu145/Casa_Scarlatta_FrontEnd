import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import styles from './ExpandButton.module.css'

export default function ExpandButton({ to, children, icon: Icon = ArrowRight, variant = 'ghost' }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link to={to} className={styles.wrapper}>
      <motion.div
        className={`${styles.button} ${styles[variant]}`}
        initial={{ width: 52 }}
        animate={{ width: hovered ? 200 : 52 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        style={{ height: 52, borderRadius: 26 }}
      >
        <motion.span
          className={styles.icon}
          animate={{ opacity: hovered ? 0 : 1, scale: hovered ? 0.6 : 1 }}
          transition={{ duration: 0.15 }}
        >
          <Icon size={20} />
        </motion.span>

        <motion.span
          className={styles.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.18, delay: hovered ? 0.12 : 0 }}
        >
          {children}
        </motion.span>
      </motion.div>
    </Link>
  )
}
