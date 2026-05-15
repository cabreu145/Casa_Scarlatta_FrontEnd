import toast from 'react-hot-toast'
import { borrarCoachService } from '@/services/coachesService'
import styles from '../AdminPanel.module.css'

export default function CoachesSection({
  coaches,
  openModal,
  setModalEditCoach,
  setEditCoachForm,
  setEditFotoPreview,
  setEditFotoPath,
  setModalHorarioCoach,
  editarCoach,
  eliminarCoach,
}) {
  return (
    <>
      <div className={styles.sectionTopRow}>
        <div />
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('coach')}>
          + Agregar Coach
        </button>
      </div>
      <div className={styles.coachesGrid}>
        {coaches.map((c) => {
          const iniciales = c.nombre.split(' ').slice(0, 2).map((w) => w[0]).join('')
          return (
            <div key={c.id} className={styles.coachCard}>
              <div className={styles.coachPhoto} style={{ overflow: 'hidden', padding: 0 }}>
                {c.foto
                  ? <img src={c.foto} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', borderRadius: '50%' }} />
                  : iniciales}
              </div>
              <div className={styles.coachInfo}>
                <div className={styles.coachName}>{c.nombre}</div>
                <div className={styles.coachSpec}>{c.especialidad}</div>
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
                      const disc = ['Stryde X','Slow','Ambas'].includes(c.especialidad) ? c.especialidad : 'Stryde X'
                      setEditCoachForm({
                        nombre:       c.nombre,
                        disciplina:   disc,
                        especialidad: '',
                        email:        c.email || '',
                        telefono:     c.telefono || '',
                        bio:          c.bio || '',
                      })
                      setEditFotoPreview(c.foto || null)
                      setEditFotoPath(c.foto || null)
                    }}
                  >Editar</button>
                  <button
                    className={styles.coachBtn}
                    onClick={() => setModalHorarioCoach(c)}
                  >Horario</button>
                  {c.activo === false ? (
                    <button
                      className={styles.coachBtn}
                      style={{ color: '#4CAF50', borderColor: '#4CAF50' }}
                      onClick={() => {
                        editarCoach(c.id, { activo: true })
                        toast.success(`${c.nombre} reactivado`)
                      }}
                    >Reactivar</button>
                  ) : (
                    <button
                      className={styles.coachBtn}
                      style={{ color: '#b45309', borderColor: '#b45309' }}
                      onClick={() => {
                        eliminarCoach(c.id)
                        toast.success(`${c.nombre} dado de baja`)
                      }}
                    >Dar de baja</button>
                  )}
                  <button
                    className={styles.coachBtn}
                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                    onClick={async () => {
                      if (!window.confirm(`¿Eliminar permanentemente a ${c.nombre}? Esta acción no se puede deshacer.`)) return
                      const resultado = await borrarCoachService(c.id)
                      if (resultado.ok) toast.success(resultado.mensaje)
                      else toast.error(resultado.mensaje)
                    }}
                  >Eliminar</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
