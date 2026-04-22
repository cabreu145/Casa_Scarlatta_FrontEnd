import { useState } from 'react'
import { Heart } from 'lucide-react'
import styles from './HeartButton.module.css'

export default function HeartButton({ initialLiked = false, onToggle }) {
  const [liked, setLiked] = useState(initialLiked)

  const toggle = () => {
    setLiked(prev => {
      const next = !prev
      onToggle?.(next)
      return next
    })
  }

  return (
    <button
      className={`${styles.btn} ${liked ? styles.liked : ''}`}
      onClick={toggle}
      aria-label={liked ? 'Quitar de favoritos' : 'Guardar en favoritos'}
    >
      <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
    </button>
  )
}
