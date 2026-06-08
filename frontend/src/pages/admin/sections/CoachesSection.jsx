import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'

function resolveCoachDisciplina(coach) {
  if (coach?.specialties?.length > 1) return 'Ambas'
  const raw = String(coach?.specialties?.[0] ?? coach?.especialidad ?? coach?.specialty ?? '').toLowerCase()
  if (raw.includes('slow')) return 'Slow'
  if (raw.includes('stryde') || raw.includes('stride')) return 'Stryde X'
  if (String(coach?.especialidad ?? '').toLowerCase().includes('ambas')) return 'Ambas'
  return 'Stryde X'
}

export default function CoachesSection({
  coaches = [],
  useApiMode = false,
  isLoading = false,
  error = '',
  search,
  setSearch,
  status,
  setStatus,
  openModal,
  setModalEditCoach,
  setEditCoachForm,
  setEditFotoPreview,
  setEditFotoPath,
  setModalHorarioCoach,
  onToggleStatus,
  onDeleteCoach,
}) {
  return (
    <>
      <div className={styles.sectionTopRow}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {useApiMode && (
            <>
              <input
                className={styles.searchInput}
                style={{ minWidth: 240 }}
                placeholder="Buscar coach..."
                value={search ?? ''}
                onChange={(e) => setSearch?.(e.target.value)}
              />
              <select
                className={styles.formSelect}
                style={{ minWidth: 160 }}
                value={status ?? 'Todos'}
                onChange={(e) => setStatus?.(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
              {isLoading && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Cargando coaches...</span>}
            </>
          )}
        </div>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('coach')}>
          + Agregar Coach
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: 12 }}>
          {error}
        </div>
      )}

      {coaches.length === 0 && !isLoading ? (
        <div style={{ padding: '24px 16px', borderRadius: 12, border: '1px dashed var(--muted-2)', color: 'var(--muted)', fontSize: 13 }}>
          No hay coaches para mostrar.
        </div>
      ) : (
        <div className={styles.coachesGrid}>
          {coaches.map((c, index) => {
            const name = c.nombre ?? c.name ?? 'Coach'
            const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('')
            const coachKey = c.coachId ?? c.id ?? `${c.nombre ?? c.name ?? 'coach'}-${index}`
            const isInactive = c.status === 'inactive' || c.activo === false
            return (
              <div key={coachKey} className={styles.coachCard}>
                <div className={styles.coachPhoto} style={{ overflow: 'hidden', padding: 0 }}>
                  {c.foto || c.avatarUrl
                    ? <img src={c.foto || c.avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', borderRadius: '50%' }} />
                    : initials}
                </div>
                <div className={styles.coachInfo}>
                  <div className={styles.coachName}>{name}</div>
                  <div className={styles.coachSpec}>{c.especialidad ?? c.specialty ?? resolveCoachDisciplina(c)}</div>
                  {c.bio && (
                    <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.45, color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.bio}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
                    {c.instagram && (
                      <a href={c.instagram} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#93c5fd', textDecoration: 'none' }}>
                        Instagram
                      </a>
                    )}
                    {c.publicProfileEnabled !== false && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#86efac' }}>
                        Público
                      </span>
                    )}
                    {c.publicProfileEnabled === false && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(148,163,184,0.12)', color: '#cbd5e1' }}>
                        Privado
                      </span>
                    )}
                  </div>
                  <div className={styles.coachStats}>
                    <div className={styles.coachStat}>
                      <div className={styles.coachStatVal}>{c.clases ?? 0}</div>
                      <div className={styles.coachStatLabel}>Clases</div>
                    </div>
                    <div className={styles.coachStat}>
                      <div className={styles.coachStatVal}>{c.rating ?? '—'}</div>
                      <div className={styles.coachStatLabel}>Rating</div>
                    </div>
                    <div className={styles.coachStat}>
                      <div className={styles.coachStatVal}>{c.asist ?? '—'}</div>
                      <div className={styles.coachStatLabel}>Asistencia</div>
                    </div>
                  </div>
                  <div className={styles.coachActions}>
                    <button
                      className={styles.coachBtn}
                      onClick={() => {
                        setModalEditCoach(c)
                        setEditCoachForm({
                          nombre: name,
                          disciplina: resolveCoachDisciplina(c),
                          especialidad: '',
                          email: c.email || '',
                          telefono: c.telefono || c.phone || '',
                          bio: c.bio || '',
                          instagram: c.instagram || '',
                          avatar_url: c.avatarUrl || c.foto || '',
                          public_profile_enabled: c.publicProfileEnabled !== false,
                          password: '',
                          estado: isInactive ? 'inactivo' : 'activo',
                        })
                        setEditFotoPreview(c.foto || c.avatarUrl || null)
                        setEditFotoPath(c.foto || c.avatarUrl || null)
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.coachBtn}
                      onClick={() => setModalHorarioCoach(c)}
                    >
                      Horario
                    </button>
                    {isInactive ? (
                      <button
                        className={styles.coachBtn}
                        style={{ color: '#4CAF50', borderColor: '#4CAF50' }}
                        onClick={() => onToggleStatus?.(c)}
                      >
                        Reactivar
                      </button>
                    ) : (
                      <button
                        className={styles.coachBtn}
                        style={{ color: '#b45309', borderColor: '#b45309' }}
                        onClick={() => onToggleStatus?.(c)}
                      >
                        Dar de baja
                      </button>
                    )}
                    <button
                      className={styles.coachBtn}
                      style={{ color: '#ef4444', borderColor: '#ef4444' }}
                      onClick={async () => {
                        if (!window.confirm(`¿Eliminar permanentemente a ${name}? Esta acción no se puede deshacer.`)) return
                        await onDeleteCoach?.(c)
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
