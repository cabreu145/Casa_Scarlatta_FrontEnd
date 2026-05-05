import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { useCoachesStore }      from '@/stores/coachesStore'
import { useClasesStore }       from '@/stores/clasesStore'
import { useDisciplinasStore }  from '@/stores/disciplinasStore'
import {
  crearCoachService,
  editarCoachService,
  eliminarCoachService,
  borrarCoachService,
} from '@/services/coachesService'
import styles    from '@/styles/dashboard.module.css'
import localStyles from './AdminCoaches.module.css'

// ESPECIALIDADES ya viene del disciplinasStore (dinámico)

const FORM_VACIO = {
  nombre:       '',
  email:        '',
  password:     '123456',
  especialidad: 'Stryde X',
  bio:          '',
  foto:         null,
}

// ── Foto upload helper ────────────────────────────────────────────────────────

async function subirFoto(file, setPreview, setFotoEnForm) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (ev) => {
    const base64 = ev.target.result
    setPreview(base64) // preview inmediato
    try {
      const ext      = file.name.split('.').pop().toLowerCase()
      const filename = `coach-${Date.now()}.${ext}`
      const res  = await fetch('/api/upload-foto', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ base64, filename }),
      })
      const data = await res.json()
      setFotoEnForm(data.path || base64) // preferir path del servidor
    } catch {
      setFotoEnForm(base64) // fallback a base64
    }
  }
  reader.readAsDataURL(file)
}

// ── Modal crear coach ─────────────────────────────────────────────────────────

function ModalCrear({ onClose }) {
  const { disciplinas } = useDisciplinasStore()
  const [formData,    setFormData]    = useState(FORM_VACIO)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [guardando,   setGuardando]   = useState(false)
  const [errors,      setErrors]      = useState({})
  const fotoInputRef = useRef(null)

  const setField = (f) => (e) =>
    setFormData((p) => ({ ...p, [f]: e.target.value }))

  const handleFoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    subirFoto(
      file,
      setFotoPreview,
      (valor) => setFormData((p) => ({ ...p, foto: valor }))
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!formData.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!formData.email.trim())  errs.email  = 'El email es obligatorio'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = 'Email inválido'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setGuardando(true)
    const resultado = await crearCoachService(formData)
    if (resultado.ok) {
      toast.success(resultado.mensaje)
      onClose()
    } else {
      toast.error(resultado.mensaje)
    }
    setGuardando(false)
  }

  return createPortal(
    <div className={localStyles.overlay} onClick={onClose}>
      <div className={localStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={localStyles.modalHeader}>
          <h2 className={localStyles.modalTitle}>Nuevo coach</h2>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Foto upload */}
        <div className={localStyles.fotoUpload}>
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFoto}
          />
          {fotoPreview ? (
            <img
              src={fotoPreview}
              alt="Foto"
              className={localStyles.fotoCoach}
              onClick={() => fotoInputRef.current?.click()}
            />
          ) : (
            <div
              className={localStyles.inicial}
              onClick={() => fotoInputRef.current?.click()}
            >
              {formData.nombre.trim().charAt(0).toUpperCase() || '+'}
            </div>
          )}
          <label
            className={localStyles.fotoLabel}
            onClick={() => fotoInputRef.current?.click()}
          >
            {fotoPreview ? 'Cambiar foto' : 'Subir foto (opcional)'}
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid} style={{ marginBottom: 'var(--space-lg)' }}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Nombre completo <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="text"
                value={formData.nombre}
                onChange={setField('nombre')}
                placeholder="Nombre y apellido"
                style={errors.nombre ? { borderColor: '#EF4444' } : {}}
              />
              {errors.nombre && <span style={{ fontSize: 12, color: '#EF4444' }}>{errors.nombre}</span>}
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Email <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="email"
                value={formData.email}
                onChange={setField('email')}
                placeholder="coach@casascarlatta.com"
                style={errors.email ? { borderColor: '#EF4444' } : {}}
              />
              {errors.email && <span style={{ fontSize: 12, color: '#EF4444' }}>{errors.email}</span>}
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Contraseña inicial</label>
              <input
                type="password"
                value={formData.password}
                onChange={setField('password')}
                placeholder="Por defecto: 123456"
              />
            </div>
            <div className={styles.field}>
              <label>Especialidad / Disciplina</label>
              <select value={formData.especialidad} onChange={setField('especialidad')}>
                <option value="">Seleccionar…</option>
                {disciplinas.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Bio (opcional)</label>
              <textarea
                className={styles.formInput}
                rows={3}
                value={formData.bio}
                onChange={setField('bio')}
                placeholder="Breve descripción del coach..."
                style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div className={localStyles.modalActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={guardando}
            >
              {guardando ? 'Creando…' : 'Crear coach'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ── Modal editar coach ────────────────────────────────────────────────────────

function ModalEditar({ coach, onClose }) {
  const { disciplinas } = useDisciplinasStore()
  const [formData,    setFormData]    = useState({
    nombre:       coach.nombre,
    especialidad: coach.especialidad || '',
    bio:          coach.bio          || '',
    foto:         coach.foto         || null,
  })
  const [fotoPreview, setFotoPreview] = useState(coach.foto || null)
  const [guardando,   setGuardando]   = useState(false)
  const fotoInputRef = useRef(null)

  const setField = (f) => (e) =>
    setFormData((p) => ({ ...p, [f]: e.target.value }))

  const handleFoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    subirFoto(
      file,
      setFotoPreview,
      (valor) => setFormData((p) => ({ ...p, foto: valor }))
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setGuardando(true)
    const resultado = await editarCoachService(coach.id, {
      nombre:       formData.nombre,
      especialidad: formData.especialidad,
      bio:          formData.bio,
      foto:         formData.foto,
    })
    if (resultado.ok) {
      toast.success(resultado.mensaje)
      onClose()
    } else {
      toast.error(resultado.mensaje)
    }
    setGuardando(false)
  }

  const inicial = formData.nombre.trim().charAt(0).toUpperCase() || '?'

  return createPortal(
    <div className={localStyles.overlay} onClick={onClose}>
      <div className={localStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={localStyles.modalHeader}>
          <h2 className={localStyles.modalTitle}>Editar coach</h2>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Foto upload */}
        <div className={localStyles.fotoUpload}>
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFoto}
          />
          {fotoPreview ? (
            <img
              src={fotoPreview}
              alt="Foto"
              className={localStyles.fotoCoach}
              onClick={() => fotoInputRef.current?.click()}
            />
          ) : (
            <div
              className={localStyles.inicial}
              onClick={() => fotoInputRef.current?.click()}
            >
              {inicial}
            </div>
          )}
          <label
            className={localStyles.fotoLabel}
            onClick={() => fotoInputRef.current?.click()}
          >
            {fotoPreview ? 'Cambiar foto' : 'Subir foto'}
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid} style={{ marginBottom: 'var(--space-lg)' }}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Nombre completo</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={setField('nombre')}
                placeholder="Nombre y apellido"
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Email</label>
              <input
                type="email"
                value={coach.email || ''}
                readOnly
                style={{ opacity: 0.6, cursor: 'not-allowed', background: 'var(--bg-elevated)' }}
              />
            </div>
            <div className={styles.field}>
              <label>Especialidad / Disciplina</label>
              <select value={formData.especialidad} onChange={setField('especialidad')}>
                <option value="">Seleccionar…</option>
                {disciplinas.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Bio</label>
              <textarea
                className={styles.formInput}
                rows={3}
                value={formData.bio}
                onChange={setField('bio')}
                placeholder="Breve descripción del coach..."
                style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div className={localStyles.modalActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ── Modal horario ─────────────────────────────────────────────────────────────

function ModalHorario({ coach, onClose }) {
  const { clases } = useClasesStore()
  const clasesCoach = clases.filter(
    (c) => String(c.coachId) === String(coach.id) || c.coachNombre === coach.nombre
  )

  return createPortal(
    <div className={localStyles.overlay} onClick={onClose}>
      <div
        className={localStyles.modal}
        style={{ maxWidth: 560 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={localStyles.modalHeader}>
          <h2 className={localStyles.modalTitle}>Horario — {coach.nombre}</h2>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {clasesCoach.length === 0 ? (
          <p className={localStyles.sinClases}>
            Este coach no tiene clases asignadas
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={localStyles.horarioTable}>
              <thead>
                <tr>
                  <th>Clase</th>
                  <th>Tipo</th>
                  <th>Día</th>
                  <th>Hora</th>
                  <th>Cupo</th>
                </tr>
              </thead>
              <tbody>
                {clasesCoach.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                    <td>
                      <span className={`${styles.badge} ${!c.tipo?.toLowerCase().includes('slow') ? styles.badgeStride : styles.badgeSlow}`}>
                        {c.tipo}
                      </span>
                    </td>
                    <td>{c.dia}</td>
                    <td>{c.hora}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {c.cupoActual}/{c.cupoMax}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={localStyles.modalActions}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Modal confirmar baja / reactivar ──────────────────────────────────────────

function ModalConfirm({ mensaje, confirmLabel = 'Confirmar', danger = false, onConfirm, onClose }) {
  return createPortal(
    <div className={localStyles.overlay} onClick={onClose}>
      <div className={localStyles.modal} style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <h2 className={localStyles.modalTitle} style={{ marginBottom: 'var(--space-md)' }}>
          Confirmar acción
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          {mensaje}
        </p>
        <div className={localStyles.modalActions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={`${styles.btn} ${danger ? styles.btnDanger : styles.btnPrimary}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function AdminCoaches() {
  const { coaches, editarCoach } = useCoachesStore()

  const [modalCrear,   setModalCrear]   = useState(false)
  const [modalEditar,  setModalEditar]  = useState(null)   // coach | null
  const [modalHorario, setModalHorario] = useState(null)   // coach | null
  const [modalConfirm, setModalConfirm] = useState(null)   // { mensaje, onConfirm } | null
  const [busqueda,     setBusqueda]     = useState('')

  const abrirCrear   = ()      => setModalCrear(true)
  const abrirEditar  = (coach) => setModalEditar(coach)
  const abrirHorario = (coach) => setModalHorario(coach)

  const abrirBaja = (coach) => {
    setModalConfirm({
      mensaje: `¿Dar de baja a ${coach.nombre}? Quedará inactivo pero podrás reactivarlo después.`,
      onConfirm: async () => {
        const resultado = await eliminarCoachService(coach.id)
        if (resultado.ok) toast.success(resultado.mensaje)
        else toast.error(resultado.mensaje)
        setModalConfirm(null)
      },
    })
  }

  const abrirReactivar = (coach) => {
    setModalConfirm({
      mensaje: `¿Reactivar a ${coach.nombre}?`,
      onConfirm: () => {
        editarCoach(coach.id, { activo: true })
        toast.success(`${coach.nombre} reactivado`)
        setModalConfirm(null)
      },
    })
  }

  const abrirEliminar = (coach) => {
    setModalConfirm({
      mensaje: `¿Eliminar permanentemente a ${coach.nombre}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: async () => {
        const resultado = await borrarCoachService(coach.id)
        if (resultado.ok) toast.success(resultado.mensaje)
        else toast.error(resultado.mensaje)
        setModalConfirm(null)
      },
    })
  }

  const filtrados = coaches.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const espBadge = {
    Stride: styles.badgeStride,
    Slow:   styles.badgeSlow,
    Ambas:  styles.badgeCompletada,
  }

  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Coaches</h1>
          <p className={styles.subtitle}>{coaches.length} coaches registrados</p>
        </div>

        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={abrirCrear}
          >
            + Nuevo coach
          </button>
        </div>

        <div className={localStyles.cardGrid}>
          {filtrados.map((coach) => {
            const inicial = coach.nombre.trim().charAt(0).toUpperCase()
            return (
              <div
                key={coach.id}
                className={`${localStyles.coachCard} ${coach.activo === false ? localStyles.inactivo : ''}`}
              >
                {/* Foto o inicial */}
                {coach.foto ? (
                  <img src={coach.foto} alt={coach.nombre} className={localStyles.fotoCoach} />
                ) : (
                  <div className={localStyles.inicial}>{inicial}</div>
                )}

                <p className={localStyles.coachNombre}>{coach.nombre}</p>
                <p className={localStyles.coachEmail}>{coach.email || '—'}</p>

                <span
                  className={`${styles.badge} ${espBadge[coach.especialidad] || styles.badgeCompletada}`}
                  style={{ alignSelf: 'center' }}
                >
                  {coach.especialidad || '—'}
                </span>

                <span
                  className={`${styles.badge} ${coach.activo !== false ? styles.badgeConfirmada : styles.badgeCancelada}`}
                  style={{ alignSelf: 'center' }}
                >
                  {coach.activo !== false ? 'Activo' : 'Inactivo'}
                </span>

                <div className={localStyles.cardActions}>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                    onClick={() => abrirEditar(coach)}
                  >
                    Editar
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                    onClick={() => abrirHorario(coach)}
                    title="Ver horario"
                  >
                    <Calendar size={13} style={{ marginRight: 4 }} />
                    Horario
                  </button>
                  {coach.activo !== false ? (
                    <button
                      className={`${styles.btn} ${styles.btnWarning} ${styles.btnSm}`}
                      onClick={() => abrirBaja(coach)}
                    >
                      Dar de baja
                    </button>
                  ) : (
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                      onClick={() => abrirReactivar(coach)}
                    >
                      Reactivar
                    </button>
                  )}
                  <button
                    className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                    onClick={() => abrirEliminar(coach)}
                    title="Eliminar permanentemente"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}

          {filtrados.length === 0 && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)', fontFamily: 'var(--font-body)' }}>
              No se encontraron coaches
            </p>
          )}
        </div>
      </div>

      {modalCrear && (
        <ModalCrear onClose={() => setModalCrear(false)} />
      )}

      {modalEditar && (
        <ModalEditar coach={modalEditar} onClose={() => setModalEditar(null)} />
      )}

      {modalHorario && (
        <ModalHorario coach={modalHorario} onClose={() => setModalHorario(null)} />
      )}

      {modalConfirm && (
        <ModalConfirm
          mensaje={modalConfirm.mensaje}
          confirmLabel={modalConfirm.confirmLabel}
          danger={modalConfirm.danger}
          onConfirm={modalConfirm.onConfirm}
          onClose={() => setModalConfirm(null)}
        />
      )}
    </DashboardLayout>
  )
}
