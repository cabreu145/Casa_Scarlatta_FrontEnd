import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { mockUsers } from '@/data/mockUsers'
import styles from '@/styles/dashboard.module.css'

const ESPECIALIDADES = ['Stride', 'Slow', 'Ambas']

const coachesIniciales = mockUsers
  .filter((u) => u.rol === 'coach')
  .map((u) => ({
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    especialidad: u.especialidad || 'Stride',
    activo: u.activo,
  }))

function CoachModal({ coach, onSave, onClose }) {
  const [form, setForm] = useState(
    coach ?? { nombre: '', email: '', especialidad: 'Stride', activo: true }
  )
  const [errors, setErrors] = useState({})

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email inválido'
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 className={styles.modalTitle} style={{ margin: 0 }}>
            {coach ? 'Editar coach' : 'Nuevo coach'}
          </h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid} style={{ marginBottom: 'var(--space-lg)' }}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Nombre completo</label>
              <input type="text" value={form.nombre} onChange={set('nombre')}
                placeholder="Nombre y apellido" style={errors.nombre ? { borderColor: '#EF4444' } : {}} />
              {errors.nombre && <span style={{ fontSize: 12, color: '#EF4444' }}>{errors.nombre}</span>}
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="coach@casascarlatta.com" style={errors.email ? { borderColor: '#EF4444' } : {}} />
              {errors.email && <span style={{ fontSize: 12, color: '#EF4444' }}>{errors.email}</span>}
            </div>
            <div className={styles.field}>
              <label>Especialidad</label>
              <select value={form.especialidad} onChange={set('especialidad')}>
                {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
              {coach ? 'Guardar cambios' : 'Crear coach'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ mensaje, onConfirm, onClose }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Confirmar acción</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)' }}>{mensaje}</p>
        <div className={styles.modalActions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cancelar</button>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCoaches() {
  const [coaches, setCoaches] = useState(coachesIniciales)
  const [modal, setModal] = useState(null) // null | 'nuevo' | { coach }
  const [confirmar, setConfirmar] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const filtrados = coaches.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleSave = (form) => {
    if (modal === 'nuevo') {
      setCoaches((prev) => [...prev, { ...form, id: Date.now() }])
      toast.success('Coach creado exitosamente')
    } else {
      setCoaches((prev) => prev.map((c) => (c.id === modal.coach.id ? { ...c, ...form } : c)))
      toast.success('Cambios guardados')
    }
    setModal(null)
  }

  const handleToggle = (coach) => {
    const accion = coach.activo ? 'dar de baja' : 'reactivar'
    setConfirmar({
      mensaje: coach.activo
        ? `¿Dar de baja a ${coach.nombre}? Dejará de aparecer en el horario.`
        : `¿Reactivar a ${coach.nombre}?`,
      onConfirm: () => {
        setCoaches((prev) => prev.map((c) => (c.id === coach.id ? { ...c, activo: !c.activo } : c)))
        toast.success(`${coach.nombre} ${coach.activo ? 'dado de baja' : 'reactivado'}`)
        setConfirmar(null)
      },
    })
  }

  const espBadge = { Stride: styles.badgeStride, Slow: styles.badgeSlow, Ambas: styles.badgeCompletada }

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
            onClick={() => setModal('nuevo')}
          >
            + Nuevo coach
          </button>
        </div>

        <div className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Especialidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.email}</td>
                  <td>
                    <span className={`${styles.badge} ${espBadge[c.especialidad] || styles.badgeCompletada}`}>
                      {c.especialidad}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${c.activo ? styles.badgeConfirmada : styles.badgeCancelada}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      <button
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                        onClick={() => setModal({ coach: c })}
                      >
                        Editar
                      </button>
                      <button
                        className={`${styles.btn} ${c.activo ? styles.btnDanger : styles.btnSecondary} ${styles.btnSm}`}
                        onClick={() => handleToggle(c)}
                      >
                        {c.activo ? 'Dar de baja' : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>
                    No se encontraron coaches
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CoachModal
          coach={modal === 'nuevo' ? null : modal.coach}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {confirmar && (
        <ConfirmModal
          mensaje={confirmar.mensaje}
          onConfirm={confirmar.onConfirm}
          onClose={() => setConfirmar(null)}
        />
      )}
    </DashboardLayout>
  )
}
