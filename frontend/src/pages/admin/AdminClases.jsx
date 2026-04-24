import { useState } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { useClasesStore } from '@/stores/clasesStore'
import { mockUsers } from '@/data/mockUsers'
import styles from '@/styles/dashboard.module.css'

const coaches = mockUsers.filter((u) => u.rol === 'coach')
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const claseVacia = {
  nombre: '',
  tipo: 'Stride',
  coachId: coaches[0]?.id || 2,
  coachNombre: coaches[0]?.nombre || 'Carlos Méndez',
  dia: 'Lunes',
  hora: '07:00',
  duracion: 50,
  cupoMax: 20,
  cupoActual: 0,
}

export default function AdminClases() {
  const { clases, agregarClase, editarClase, eliminarClase } = useClasesStore()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(claseVacia)
  const [eliminandoId, setEliminandoId] = useState(null)

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const abrirNueva = () => {
    setEditando(null)
    setForm(claseVacia)
    setModalAbierto(true)
  }

  const abrirEditar = (clase) => {
    setEditando(clase.id)
    setForm({ ...clase })
    setModalAbierto(true)
  }

  const handleGuardar = () => {
    if (!form.nombre) return toast.error('El nombre es obligatorio')
    const coach = coaches.find((c) => c.id === Number(form.coachId))
    const datos = { ...form, coachId: Number(form.coachId), coachNombre: coach?.nombre || form.coachNombre, duracion: Number(form.duracion), cupoMax: Number(form.cupoMax) }
    if (editando) {
      editarClase(editando, datos)
      toast.success('Clase actualizada')
    } else {
      agregarClase({ ...datos, cupoActual: 0 })
      toast.success('Clase creada')
    }
    setModalAbierto(false)
  }

  const handleEliminar = (id) => {
    eliminarClase(id)
    toast.success('Clase eliminada')
    setEliminandoId(null)
  }

  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.greeting}>Clases</h1>
            <p className={styles.subtitle}>{clases.length} clases en el calendario</p>
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={abrirNueva}>
            <Plus size={16} /> Nueva clase
          </button>
        </div>

        <div className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Día</th>
                <th>Hora</th>
                <th>Clase</th>
                <th>Tipo</th>
                <th>Coach</th>
                <th>Cupo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clases.map((c) => (
                <tr key={c.id}>
                  <td>{c.dia}</td>
                  <td style={{ fontWeight: 600 }}>{c.hora}</td>
                  <td>{c.nombre}</td>
                  <td>
                    <span className={`${styles.badge} ${c.tipo === 'Stride' ? styles.badgeStride : styles.badgeSlow}`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.coachNombre}</td>
                  <td>{c.cupoActual}/{c.cupoMax}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={() => abrirEditar(c)}>
                      Editar
                    </button>
                    <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => setEliminandoId(c.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modalAbierto && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: 560 }}>
              <h2 className={styles.modalTitle}>{editando ? 'Editar clase' : 'Nueva clase'}</h2>
              <div className={styles.formGrid}>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label>Nombre de la clase</label>
                  <input value={form.nombre} onChange={set('nombre')} placeholder="Ej. Stride Power" />
                </div>
                <div className={styles.field}>
                  <label>Tipo</label>
                  <select value={form.tipo} onChange={set('tipo')}>
                    <option>Stride</option>
                    <option>Slow</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Coach</label>
                  <select value={form.coachId} onChange={set('coachId')}>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Día</label>
                  <select value={form.dia} onChange={set('dia')}>
                    {DIAS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Hora</label>
                  <input type="time" value={form.hora} onChange={set('hora')} />
                </div>
                <div className={styles.field}>
                  <label>Duración (min)</label>
                  <input type="number" value={form.duracion} onChange={set('duracion')} min={30} max={120} />
                </div>
                <div className={styles.field}>
                  <label>Cupo máximo</label>
                  <input type="number" value={form.cupoMax} onChange={set('cupoMax')} min={1} max={50} />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setModalAbierto(false)}>
                  Cancelar
                </button>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleGuardar}>
                  {editando ? 'Guardar cambios' : 'Crear clase'}
                </button>
              </div>
            </div>
          </div>
        )}

        {eliminandoId && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2 className={styles.modalTitle}>¿Eliminar clase?</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)' }}>
                Esta acción no se puede deshacer.
              </p>
              <div className={styles.modalActions}>
                <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setEliminandoId(null)}>
                  Cancelar
                </button>
                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => handleEliminar(eliminandoId)}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
