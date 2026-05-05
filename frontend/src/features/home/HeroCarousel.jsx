import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './HeroCarousel.module.css'

const VIDEO_SLIDE_INDEX = 0

const slides = [
  {
    type: 'video',
    videoId: 'djp5ZQQ7WXA',
    start: 14,
  },
  {
    src: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&q=80',
    alt: 'Clase en Casa Scarlatta',
  },
  {
    src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80',
    alt: 'Sala STRIDE — alta intensidad',
  },
  {
    src: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1600&q=80',
    alt: 'Sala Slow — movimiento consciente',
  },
  {
    src: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1600&q=80',
    alt: 'Comunidad Casa Scarlatta',
  },
]

const INTERVAL = 4000

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const timerRef = useRef(null)
  const iframeRef = useRef(null)

  const advance = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length)
  }, [])

  // Load YouTube iframe when browser is idle (after critical resources)
  useEffect(() => {
    const load = () => setVideoReady(true)
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(load, { timeout: 800 })
      return () => cancelIdleCallback(id)
    } else {
      const t = setTimeout(load, 500)
      return () => clearTimeout(t)
    }
  }, [])

  // Pause auto-advance while video slide is playing; resume for image slides
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return
    if (current === VIDEO_SLIDE_INDEX) {
      clearInterval(timerRef.current)
      return
    }
    if (!paused) {
      timerRef.current = setInterval(advance, INTERVAL)
    }
    return () => clearInterval(timerRef.current)
  }, [current, paused, advance])

  // Listen for YouTube video end event and advance slide
  useEffect(() => {
    const handleMessage = (e) => {
      if (!String(e.origin).includes('youtube.com')) return
      try {
        const data = JSON.parse(e.data)
        if (data.event === 'onStateChange' && data.info === 0) {
          advance()
        }
      } catch {}
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [advance])

  const handleIframeLoad = () => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'listening' }), '*'
    )
  }

  return (
    <section
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero — Casa Scarlatta"
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`${styles.slide} ${i === current ? styles.active : ''}`}
          aria-hidden={i !== current}
        >
          {slide.type === 'video' ? (
            <>
              <iframe
                ref={iframeRef}
                className={styles.videoBg}
                src={videoReady ? `https://www.youtube.com/embed/${slide.videoId}?autoplay=1&mute=1&loop=1&playlist=${slide.videoId}&controls=0&rel=0&modestbranding=1&showinfo=0&fs=0&iv_load_policy=3&disablekb=1&start=${slide.start}` : undefined}
                title="Casa Scarlatta video"
                allow="autoplay; encrypted-media"
                frameBorder="0"
              />
              <div className={styles.videoBlock} />
            </>
          ) : (
            <img src={slide.src} alt={slide.alt} className={styles.bg} />
          )}
        </div>
      ))}

      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <span className={styles.logoCasa}>casa</span>
          <span className={styles.logoScarlatta}>Scarlatta</span>
        </div>
        <p className={styles.tagline}>Wellness Center</p>
        <Link to="/reservar" className={styles.cta}>Reservar</Link>
      </div>

      <div className={styles.dots} role="tablist" aria-label="Slides">
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </section>
  )
}
