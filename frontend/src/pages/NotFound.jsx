import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import styles from './NotFound.module.css'

export default function NotFound() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  // Partículas flotantes de fondo
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 28 }, () => ({
      x:    Math.random() * canvas.width,
      y:    Math.random() * canvas.height,
      r:    1 + Math.random() * 2.5,
      dx:   (Math.random() - 0.5) * 0.35,
      dy:   -0.15 - Math.random() * 0.25,
      a:    0.1 + Math.random() * 0.5,
    }))

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(232,164,173,${p.a})`
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width }
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Fondo decorativo */}
      <div className={styles.bgCircle1} />
      <div className={styles.bgCircle2} />

      <div className={styles.content}>

        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoCs}>CS</span>
          <span className={styles.logoBar} />
          <span className={styles.logoBrand}>Casa Scarlatta</span>
        </div>

        {/* 404 grande */}
        <div className={styles.errorCode}>
          <span className={styles.digit}>4</span>
          <span className={styles.digitMiddle}>
            <span className={styles.innerRing} />
            <span className={styles.innerDot} />
          </span>
          <span className={styles.digit}>4</span>
        </div>

        {/* Mensaje */}
        <p className={styles.headline}>Parece que te perdiste</p>
        <p className={styles.sub}>
          Esta página no existe o fue movida.<br />
          Pero tu entrenamiento no tiene por qué detenerse.
        </p>

        {/* Acciones */}
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => navigate('/')}>
            Volver al inicio
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate(-1)}>
            Regresar
          </button>
        </div>

        {/* Links rápidos */}
        <div className={styles.quickLinks}>
          <span className={styles.quickLabel}>¿Buscabas algo de aquí?</span>
          <div className={styles.quickRow}>
            {[
              { label: 'Clases',    path: '/clases'   },
              { label: 'Stryde X', path: '/suet'     },
              { label: 'Slow',     path: '/flow'     },
              { label: 'Reservar', path: '/reservar' },
              { label: 'Contacto', path: '/contacto' },
            ].map(({ label, path }) => (
              <button key={path} className={styles.quickLink} onClick={() => navigate(path)}>
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
