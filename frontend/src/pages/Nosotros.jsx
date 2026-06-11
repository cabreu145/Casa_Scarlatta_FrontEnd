import { useMemo, useState, useEffect, useCallback } from 'react'
import { useCoachesStore } from '../stores/coachesStore'
import { useEffectiveSiteConfiguration } from '@/hooks/useSiteConfiguration'
import { isVideoMediaUrl } from '@/adapters/siteConfigurationAdapter'
import { resolveCoachAvatarUrl } from '@/adapters/coachAdapter'
import { getPublicCoachesApi } from '@/services/coachesApiService'
import styles from './Nosotros.module.css'

const FILTROS = ['Todas', 'Stryde X', 'Slow']

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

export default function Nosotros() {
  const { coaches: todosCoaches } = useCoachesStore()
  const useApiMode = import.meta.env.VITE_USE_API_CLASSES === 'true'
  const coachesActivos = todosCoaches.filter((c) => c.activo !== false)
  const cfg = useEffectiveSiteConfiguration()
  const carouselImages = cfg.get('carouselNosotros')
  const [current, setCurrent] = useState(0)
  const [filtro, setFiltro] = useState('Todas')
  const [publicCoaches, setPublicCoaches] = useState([])
  const [loadingPublicCoaches, setLoadingPublicCoaches] = useState(false)
  const [publicCoachesError, setPublicCoachesError] = useState('')

  useEffect(() => {
    if (!useApiMode) return
    let active = true
    setLoadingPublicCoaches(true)
    setPublicCoachesError('')
    getPublicCoachesApi()
      .then((items) => {
        if (!active) return
        setPublicCoaches(items ?? [])
      })
      .catch((error) => {
        if (!active) return
        setPublicCoaches([])
        setPublicCoachesError(error?.message ?? 'No se pudieron cargar coaches públicos')
      })
      .finally(() => {
        if (!active) return
        setLoadingPublicCoaches(false)
      })
    return () => {
      active = false
    }
  }, [useApiMode])

  const coachesBase = useApiMode ? publicCoaches : coachesActivos

  const coaches = useMemo(() => coachesBase.filter((c) => {
    if (filtro === 'Todas') return true
    const specialities = Array.isArray(c.specialties) ? c.specialties : []
    const primary = String(c.primaryDiscipline ?? c.primary_discipline ?? c.especialidad ?? c.specialty ?? '').trim()
    const esp = primary || specialities[0] || ''
    if (filtro === 'Stryde X') return esp.toLowerCase().includes('stryde') || specialities.includes('stryde')
    if (filtro === 'Slow') return esp.toLowerCase().includes('slow') || specialities.includes('slow')
    return true
  }), [coachesBase, filtro])

  const next = useCallback(
    () => setCurrent((c) => (carouselImages.length ? (c + 1) % carouselImages.length : 0)),
    [carouselImages.length]
  )

  useEffect(() => {
    const t = setInterval(next, 4500)
    return () => clearInterval(t)
  }, [next])

  return (
    <main className={styles.page}>

      {/* SECCIÓN 1 — HISTORIA */}
      <section className={styles.historia}>

        {/* Imagen — izquierda */}
        <div className={styles.carouselWrap}>
          <div className={styles.carouselTrack}>
            {carouselImages.map((src, i) => {
              const className = `${styles.carouselImg} ${i === current ? styles.carouselImgActive : ''}`
              return isVideoMediaUrl(src) ? (
                <video
                  key={src}
                  src={src}
                  className={className}
                  muted
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img key={src} src={src} alt="" className={className} />
              )
            })}
            <div className={styles.imageOverlay} />
          </div>
          <div className={styles.carouselDots}>
            {carouselImages.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Texto — derecha */}
        <div className={styles.historiaContent}>
          <div className={styles.historiaText}>

            <h1 className={styles.historiaTitle}>
              {cfg.get('nosotrosTexto1')}
            </h1>

            <div className={styles.divider} />
            <p className={styles.experienceText}>{cfg.get('nosotrosTexto2')}</p>

          </div>
        </div>
      </section>

      {/* SECCIÓN 2 — COACHES */}
      <section className={styles.coachesSec}>
        <div className={styles.coachesHeader}>
          <span className={styles.coachesLabel}>Nuestro equipo</span>
          <h2 className={styles.coachesTitle}>COACHES</h2>
          <div className={styles.coachesDivider} />
        </div>

        {/* Filtros */}
        <div className={styles.filtros}>
          {FILTROS.map((f) => (
            <button
              key={f}
              className={`${styles.filtroBtn}${filtro === f ? ' ' + styles.filtroBtnActive : ''}`}
              onClick={() => setFiltro(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className={styles.coachesGrid}>
          {useApiMode && loadingPublicCoaches && (
            <div style={{ padding: '16px 0', color: 'var(--muted)' }}>Cargando coaches…</div>
          )}
          {useApiMode && publicCoachesError && !loadingPublicCoaches && (
            <div style={{ padding: '16px 0', color: '#fca5a5' }}>{publicCoachesError}</div>
          )}
          {useApiMode && !loadingPublicCoaches && !publicCoachesError && coaches.length === 0 && (
            <div style={{ padding: '16px 0', color: 'var(--muted)' }}>No hay coaches públicos disponibles.</div>
          )}
          {coaches.map((coach) => {
            const name = coach.name ?? coach.nombre ?? 'Coach'
            const inicial         = String(name).trim().charAt(0).toUpperCase()
            const bio             = coach.bio || 'Instructor de Casa Scarlatta'
            const specialties     = Array.isArray(coach.specialties) ? coach.specialties : []
            const primary         = coach.primaryDiscipline ?? coach.primary_discipline ?? coach.especialidad ?? coach.specialty ?? ''
            const disciplinaLabel = specialties.length > 1
              ? 'Stryde X / Slow'
              : String(primary).toLowerCase().includes('slow')
                ? 'Slow'
                : String(primary).toLowerCase().includes('stryde') || specialties.includes('stryde')
                  ? 'Stryde X'
                  : 'Coach'
            const avatar = resolveCoachAvatarUrl(coach.avatarUrl ?? coach.avatar_url ?? coach.foto ?? null)
            return (
              <div key={coach.coachId ?? coach.id ?? name} className={styles.coachCard}>
                {avatar ? (
                  <img src={avatar} alt={name} className={styles.coachImg} loading="lazy" />
                ) : (
                  <div className={styles.coachImg} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--color-primary, #C1121F)',
                    color: '#fff',
                    fontSize: 48,
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    userSelect: 'none',
                  }}>
                    {inicial}
                  </div>
                )}
                <div className={styles.coachBottom}>
                  <h3 className={styles.coachName}>{name}</h3>
                  {disciplinaLabel && (
                    <span className={styles.coachDiscipline}>{disciplinaLabel}</span>
                  )}
                </div>
                <div className={styles.coachOverlay}>
                  <p className={styles.coachBio}>{bio}</p>
                  {coach.instagram && (
                    <a
                      href={coach.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.igLink}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Instagram de ${name}`}
                    >
                      <InstagramIcon />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

    </main>
  )
}
