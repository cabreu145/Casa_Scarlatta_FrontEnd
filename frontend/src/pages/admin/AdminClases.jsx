import { useState, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, MapPin, User, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { useClasesStore } from '@/stores/clasesStore'
import { mockUsers } from '@/data/mockUsers'
import { getAvailability } from '@/services/classService'
import { useClasses } from '@/hooks/useClasses'
import styles from '@/styles/dashboard.module.css'

// ─── Constants ──────────────────────────────────────────────────────────────
const DAYS_ES   = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAYS_ABBR = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const coaches    = mockUsers.filter((u) => u.rol === 'coach')
const DIAS_FORM  = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const UBICACIONES = ['Studio A', 'Studio B', 'Sala Principal']

const claseVacia = {
  nombre:      '',
  tipo:        'Stride',
  coachId:     coaches[0]?.id || 2,
  coachNombre: coaches[0]?.nombre || 'Carlos Méndez',
  dia:         'Lunes',
  hora:        '07:00',
  duracion:    50,
  cupoMax:     20,
  cupoActual:  0,
  ubicacion:   'Studio A',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getWeekDays(weekOffset = 0) {
  const today = new Date()
  const dow   = today.getDay()
  const start = new Date(today)
  start.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow) + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function getMonthLabel(days) {
  const a = days[0], b = days[days.length - 1]
  const yr = b.getFullYear()
  return a.getMonth() === b.getMonth()
    ? `${MONTHS_ES[a.getMonth()]} ${yr}`
    : `${MONTHS_ES[a.getMonth()]} – ${MONTHS_ES[b.getMonth()]} ${yr}`
}

function isSameDay(a, b) {
  return a.getDate()     === b.getDate()  &&
         a.getMonth()    === b.getMonth() &&
         a.getFullYear() === b.getFullYear()
}

function isToday(date) { return isSameDay(date, new Date()) }

function formatHour(hora) {
  const [h, m] = hora.split(':').map(Number)
  const suffix = h >= 12 ? 'p.m.' : 'a.m.'
  const hr     = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hr}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

// ─── Availability badge ───────────────────────────────────────────────────────
function AvailabilityBadge({ clase }) {
  const { available, status } = getAvailability(clase)

  if (status === 'full') {
    return (
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)',
      }}>
        LLENO
      </span>
    )
  }

  const color = status === 'ok' ? '#2D7D46' : '#B84B1A'
  const bg    = status === 'ok' ? 'rgba(45,125,70,0.1)' : 'rgba(184,75,26,0.1)'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
      color, background: bg,
      borderRadius: 'var(--radius-pill)', padding: '3px 10px',
    }}>
      <span style={{ fontSize: 8 }}>●</span>
      {available} lugar{available !== 1 ? 'es' : ''}
    </span>
  )
}

// ─── Class row (app style) ────────────────────────────────────────────────────
function ClassRow({ clase, onEdit, onDelete }) {
  const { status } = getAvailability(clase)
  const isFull = status === 'full'
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '100px 1fr auto',
        alignItems: 'center',
        gap: 'var(--space-lg)',
        padding: 'var(--space-lg) var(--space-xl)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--neutral-border)',
        borderRadius: 'var(--radius-lg)',
        opacity: isFull ? 0.65 : 1,
        boxShadow: hovered ? '0 4px 20px rgba(123,31,46,0.09)' : 'none',
        transition: 'box-shadow var(--duration-fast)',
      }}
    >
      {/* LEFT — time + duration */}
      <div>
        <div style={{
          fontFamily: 'var(--font-body)', fontWeight: 700,
          fontSize: 14, color: 'var(--text-primary)',
        }}>
          {formatHour(clase.hora)}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--text-muted)', marginTop: 2,
        }}>
          {clase.duracion} min
        </div>
      </div>

      {/* CENTER — name + coach + location */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontWeight: 600,
            fontSize: 15, color: 'var(--text-primary)',
          }}>
            {clase.nombre}
          </span>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: clase.tipo === 'Stride' ? '#CC1A1A' : 'var(--brand-wine)',
            background: clase.tipo === 'Stride' ? 'rgba(204,26,26,0.1)' : 'rgba(123,31,46,0.1)',
            borderRadius: 'var(--radius-pill)', padding: '2px 9px',
          }}>
            {clase.tipo}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
          fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)',
          flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <User size={11} /> {clase.coachNombre}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={11} /> {clase.ubicacion || 'Studio A'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={11} /> {clase.cupoActual}/{clase.cupoMax} reservas
          </span>
        </div>
      </div>

      {/* RIGHT — badge + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <AvailabilityBadge clase={clase} />
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            onClick={() => onEdit(clase)}
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
            title="Editar clase"
            style={{ padding: '5px 10px' }}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(clase.id)}
            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
            title="Eliminar clase"
            style={{ padding: '5px 10px' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminClases() {
  const { clases, agregarClase, editarClase, eliminarClase } = useClasesStore()

  // View / navigation state
  const [vista,           setVista]           = useState('calendario')
  const [weekOffset,      setWeekOffset]      = useState(0)
  const [selectedDate,    setSelectedDate]    = useState(new Date())
  const [disciplina,      setDisciplina]      = useState('TODAS')

  // Modal state
  const [modalAbierto,  setModalAbierto]  = useState(false)
  const [editando,      setEditando]      = useState(null)
  const [form,          setForm]          = useState(claseVacia)
  const [eliminandoId,  setEliminandoId]  = useState(null)

  // Week grid
  const days       = useMemo(() => getWeekDays(weekOffset), [weekOffset])
  const monthLabel = useMemo(() => getMonthLabel(days),     [days])

  // Classes for selected day (live from store via hook)
  const { classes: clasesDelDia } = useClasses(selectedDate)
  const clasesFiltradas = useMemo(() => {
    if (disciplina === 'TODAS') return clasesDelDia
    return clasesDelDia.filter((c) => c.tipo === disciplina)
  }, [clasesDelDia, disciplina])

  // Selected day index in current week strip
  const selectedDayIndex = days.findIndex((d) => isSameDay(d, selectedDate))

  // Week stats
  const totalReservas = clases.reduce((s, c) => s + c.cupoActual, 0)

  // ── Handlers ────────────────────────────────────────────────────
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const abrirNueva = () => { setEditando(null); setForm(claseVacia); setModalAbierto(true) }
  const abrirEditar = (clase) => { setEditando(clase.id); setForm({ ...clase }); setModalAbierto(true) }

  const handleGuardar = () => {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio')
    const coach = coaches.find((c) => c.id === Number(form.coachId))
    const datos = {
      ...form,
      coachId:     Number(form.coachId),
      coachNombre: coach?.nombre || form.coachNombre,
      duracion:    Number(form.duracion),
      cupoMax:     Number(form.cupoMax),
    }
    if (editando) { editarClase(editando, datos); toast.success('Clase actualizada') }
    else          { agregarClase({ ...datos, cupoActual: 0 }); toast.success('Clase creada') }
    setModalAbierto(false)
  }

  const handleEliminar = (id) => { eliminarClase(id); toast.success('Clase eliminada'); setEliminandoId(null) }

  const handlePrevWeek = () => {
    if (weekOffset === 0) return
    const next = weekOffset - 1
    setWeekOffset(next)
    setSelectedDate(getWeekDays(next)[0])
  }

  const handleNextWeek = () => {
    const next = weekOffset + 1
    setWeekOffset(next)
    setSelectedDate(getWeekDays(next)[0])
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>

        {/* ── Page header ── */}
        <div
          className={styles.pageHeader}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}
        >
          <div>
            <h1 className={styles.greeting}>Clases</h1>
            <p className={styles.subtitle}>
              {clases.length} clases en el calendario · {totalReservas} reservas activas
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            {/* View toggle */}
            <div style={{
              display: 'flex', background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-pill)', padding: 3, gap: 2,
            }}>
              {[['calendario', 'Calendario'], ['lista', 'Lista']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setVista(val)}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                    padding: '5px 18px', borderRadius: 'var(--radius-pill)',
                    background: vista === val ? 'var(--bg-surface)' : 'transparent',
                    color: vista === val ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: 'none', cursor: 'pointer',
                    transition: 'all var(--duration-fast)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={abrirNueva}>
              <Plus size={16} /> Nueva clase
            </button>
          </div>
        </div>

        {/* ════════════════ CALENDAR VIEW ════════════════ */}
        {vista === 'calendario' && (
          <div>
            {/* Controls bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)',
            }}>
              {/* Discipline filter */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[['TODAS', 'Todas'], ['Stride', 'STRYDE'], ['Slow', 'SLOW']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setDisciplina(val)}
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '7px 20px', borderRadius: 'var(--radius-pill)',
                      border: '1.5px solid',
                      borderColor: disciplina === val ? 'var(--brand-wine)' : 'var(--neutral-border)',
                      background: disciplina === val ? 'var(--brand-wine)' : 'transparent',
                      color: disciplina === val ? '#F5EDE8' : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all var(--duration-fast)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Week navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <button
                  onClick={handlePrevWeek}
                  disabled={weekOffset === 0}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: '50%',
                    border: '1px solid var(--neutral-border)',
                    background: weekOffset === 0 ? 'transparent' : 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    cursor: weekOffset === 0 ? 'default' : 'pointer',
                    opacity: weekOffset === 0 ? 0.35 : 1,
                    transition: 'all var(--duration-fast)',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                  color: 'var(--text-secondary)', letterSpacing: '0.03em',
                  minWidth: 160, textAlign: 'center',
                }}>
                  {monthLabel}
                </span>

                <button
                  onClick={handleNextWeek}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: '50%',
                    border: '1px solid var(--neutral-border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all var(--duration-fast)',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Day navigation strip */}
            <div style={{
              display: 'flex', gap: 6,
              overflowX: 'auto', paddingBottom: 4,
              marginBottom: 'var(--space-xl)',
              scrollbarWidth: 'none',
            }}>
              {days.map((date, i) => {
                const today    = isToday(date)
                const selected = i === selectedDayIndex

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 4, padding: '10px 16px', minWidth: 64,
                      borderRadius: 'var(--radius-lg)', border: '1.5px solid',
                      borderColor: selected
                        ? 'var(--brand-wine)'
                        : today
                          ? 'rgba(123,31,46,0.28)'
                          : 'var(--neutral-border)',
                      background: selected
                        ? 'var(--brand-wine)'
                        : today
                          ? 'rgba(123,31,46,0.05)'
                          : 'var(--bg-surface)',
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'all var(--duration-fast)',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: selected ? '#F5EDE8' : today ? 'var(--brand-wine)' : 'var(--text-muted)',
                    }}>
                      {DAYS_ABBR[date.getDay()]}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 700,
                      color: selected ? '#F5EDE8' : today ? 'var(--text-primary)' : 'var(--text-secondary)',
                      lineHeight: 1,
                    }}>
                      {date.getDate()}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Class list for selected day */}
            {clasesFiltradas.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 'var(--space-4xl) var(--space-2xl)',
                background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
                border: '1.5px dashed var(--neutral-border)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 'var(--space-md)', opacity: 0.25 }}>📅</div>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--text-muted)', marginBottom: 'var(--space-lg)',
                }}>
                  Sin clases programadas para este día
                </p>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={abrirNueva}>
                  <Plus size={14} /> Agregar clase
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clasesFiltradas.map((clase) => (
                  <ClassRow
                    key={clase.id}
                    clase={clase}
                    onEdit={abrirEditar}
                    onDelete={setEliminandoId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════ LIST VIEW ════════════════ */}
        {vista === 'lista' && (
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
                    <td>
                      <span style={{ color: c.cupoActual >= c.cupoMax ? '#B84B1A' : 'inherit' }}>
                        {c.cupoActual}/{c.cupoMax}
                      </span>
                    </td>
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
        )}

        {/* ── Create / Edit modal ── */}
        {modalAbierto && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: 580 }}>
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
                    {DIAS_FORM.map((d) => <option key={d}>{d}</option>)}
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
                <div className={styles.field}>
                  <label>Ubicación</label>
                  <select value={form.ubicacion || 'Studio A'} onChange={set('ubicacion')}>
                    {UBICACIONES.map((u) => <option key={u}>{u}</option>)}
                  </select>
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

        {/* ── Delete confirm modal ── */}
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
