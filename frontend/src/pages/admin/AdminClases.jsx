/**
 * AdminClases.jsx
 * ─────────────────────────────────────────────────────
 * Panel de gestión de clases para administradores.
 * Ofrece vista de calendario y vista de lista, con CRUD completo
 * (crear, editar, eliminar) vía modal y confirmación.
 *
 * Usado en: App.jsx (ruta "/admin/clases", protegida por rol admin)
 * Depende de: clasesStore, classService, useClasses, DashboardLayout
 * ─────────────────────────────────────────────────────
 */
import { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, User, Clock, Users, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { useClasesStore } from '@/stores/clasesStore'
import { useReservasStore } from '@/stores/reservasStore'
import { useUsuariosStore } from '@/stores/usuariosStore'
import { useCoachesStore } from '@/stores/coachesStore'
import { getAvailability } from '@/services/classService'
import { marcarNoAsistio, eliminarClaseConReservas } from '@/services/reservasService'
import { useClasses } from '@/hooks/useClasses'
import { ESTADOS_RESERVA } from '@/data/mockData'
import {
  DAYS_ES, DAYS_ABBR,
  getWeekDays, getMonthLabel, isSameDay, isToday,
  formatHour, diaDesdefecha,
} from '@/utils/formatters'
import styles from '@/styles/dashboard.module.css'

// ─── Constants ──────────────────────────────────────────────────────────────
const CLASE_VACIA_BASE = {
  nombre:      '',
  tipo:        'Stryde X',
  coachId:     '',
  coachNombre: '',
  fecha:       '',
  hora:        '07:00',
  duracion:    50,
  cupoMax:     20,
  cupoActual:  0,
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
function ClassRow({ clase, onEdit, onDelete, onAlumnos }) {
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
            color: !clase.tipo?.toLowerCase().includes('slow') ? '#CC1A1A' : 'var(--brand-wine)',
            background: !clase.tipo?.toLowerCase().includes('slow') ? 'rgba(204,26,26,0.1)' : 'rgba(123,31,46,0.1)',
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
            <Clock size={11} /> {clase.cupoActual}/{clase.cupoMax} reservas
          </span>
        </div>
      </div>

      {/* RIGHT — badge + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <AvailabilityBadge clase={clase} />
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            onClick={() => onAlumnos(clase)}
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
            title="Ver alumnos"
            style={{ padding: '5px 10px' }}
          >
            <Users size={13} />
          </button>
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

// ─── Import Excel modal ───────────────────────────────────────────────────────
function ModalImportarClases({ coaches, onImportar, onClose }) {
  const [clasesParseadas, setClasesParseadas] = useState([])
  const [errores,         setErrores]         = useState([])
  const [publicarEn,      setPublicarEn]      = useState(null)
  const [cargando,        setCargando]        = useState(false)
  const fileInputRef = useRef(null)

  const normalizar = (s) => String(s ?? '').toLowerCase().trim().replace(/[\s_\-()áéíóú]/g, '')

  const descargarPlantilla = () => {
    const hoy = new Date()
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() + (7 - hoy.getDay() + 1) % 7 || 7)
    const fmtFecha = (d) => d.toISOString().split('T')[0]
    const addDias  = (d, n) => { const r = new Date(d); r.setDate(d.getDate() + n); return r }
    const muestra = [
      { Nombre: 'Stride Power', Tipo: 'Stryde X', Coach: coaches[0]?.nombre ?? 'Coach', Fecha: fmtFecha(addDias(lunes,0)), Hora: '07:00', 'Duracion (min)': 50, 'Cupo maximo': 15, Descripcion: 'Clase de potencia y cardio' },
      { Nombre: 'Slow Pilates', Tipo: 'Slow',     Coach: coaches[1]?.nombre ?? coaches[0]?.nombre ?? 'Coach', Fecha: fmtFecha(addDias(lunes,0)), Hora: '09:00', 'Duracion (min)': 60, 'Cupo maximo': 12, Descripcion: 'Pilates consciente' },
    ]
    const ws = XLSX.utils.json_to_sheet(muestra)
    ws['!cols'] = [
      { wch: 20 }, { wch: 12 }, { wch: 22 }, { wch: 14 },
      { wch: 8 },  { wch: 16 }, { wch: 14 }, { wch: 35 },
    ]
    ws['!freeze'] = { xSplit: 0, ySplit: 1 }
    const range = XLSX.utils.decode_range(ws['!ref'])
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r:0, c:0 }, e: { r:0, c: range.e.c } }) }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clases')
    XLSX.writeFile(wb, 'plantilla_clases_casa_scarlatta.xlsx')
    toast.success('Plantilla descargada')
  }

  const parsearFecha = (val) => {
    if (!val && val !== 0) return null
    const s = String(val).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [d, m, y] = s.split('/'); return `${y}-${m}-${d}`
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const [d, m, y] = s.split('/'); return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
    }
    if (!isNaN(val) && Number(val) > 1000) {
      try {
        const info = XLSX.SSF.parse_date_code(Number(val))
        if (info) return `${info.y}-${String(info.m).padStart(2,'0')}-${String(info.d).padStart(2,'0')}`
      } catch {}
    }
    return null
  }

  const parsearHora = (val) => {
    if (!val && val !== 0) return '07:00'
    const s = String(val).trim()
    if (/^\d{1,2}:\d{2}(:\d{2})?(\s?(AM|PM))?$/i.test(s)) {
      const parts = s.match(/^(\d{1,2}):(\d{2}).*?(AM|PM)?$/i)
      if (parts) {
        let h = parseInt(parts[1]); const m = parts[2]; const ampm = parts[3]?.toUpperCase()
        if (ampm === 'PM' && h < 12) h += 12
        if (ampm === 'AM' && h === 12) h = 0
        return `${String(h).padStart(2,'0')}:${m}`
      }
    }
    if (!isNaN(val) && Number(val) > 0 && Number(val) < 1) {
      const totalMins = Math.round(Number(val) * 24 * 60)
      const h = Math.floor(totalMins / 60); const m = totalMins % 60
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
    }
    return '07:00'
  }

  const calcPublicarEn = (clases) => {
    const fechas = clases.map(c => c.fecha).filter(Boolean).sort()
    if (!fechas.length) return null
    const primeraFecha = new Date(fechas[0] + 'T00:00:00')
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    if (primeraFecha <= hoy) return null

    // Domingo anterior a la semana de la primera clase (lunes=inicio de semana)
    const dow = primeraFecha.getDay()             // 0=Dom, 1=Lun…6=Sáb
    const daysToMon = dow === 0 ? 6 : dow - 1    // días hasta el lunes de esa semana
    const lunes = new Date(primeraFecha)
    lunes.setDate(primeraFecha.getDate() - daysToMon)
    const domingo = new Date(lunes)
    domingo.setDate(lunes.getDate() - 1)
    domingo.setHours(23, 59, 59, 0)

    // Solo programar si ese domingo aún no pasó
    return domingo.getTime() > Date.now()
      ? domingo.toISOString().split('.')[0]
      : null
  }

  const handleFile = async (file) => {
    if (!file) return
    setCargando(true); setClasesParseadas([]); setErrores([]); setPublicarEn(null)
    try {
      const buffer = await file.arrayBuffer()
      const wb    = XLSX.read(buffer, { type: 'array', cellDates: false })
      const ws    = wb.Sheets[wb.SheetNames[0]]
      const raw   = XLSX.utils.sheet_to_json(ws, { defval: '' })

      if (!raw.length) { setErrores(['El archivo está vacío o no tiene filas de datos.']); return }

      const errs = []
      const parsed = raw.map((row, i) => {
        const keys = Object.keys(row)
        const get  = (...candidatos) => {
          const key = keys.find(k => candidatos.includes(normalizar(k)))
          return key !== undefined ? row[key] : ''
        }

        const nombre = String(get('nombre','name','clase','class')).trim()
        const tipo   = (() => {
          const t = normalizar(String(get('tipo','type','disciplina')))
          return t.includes('slow') ? 'Slow' : 'Stryde X'
        })()
        const coachRaw  = String(get('coach','instructor','entrenador','coachname')).trim()
        const coachMatch = coaches.find(c =>
          coachRaw && (
            c.nombre.toLowerCase().includes(coachRaw.toLowerCase()) ||
            coachRaw.toLowerCase().includes(c.nombre.toLowerCase())
          )
        )
        const fecha    = parsearFecha(get('fecha','date','dia','día','fechaespecifica'))
        const hora     = parsearHora(get('hora','time','horario','horainicio'))
        const duracion = Number(get('duracion','duration','duracionmin','minutos','mins','min')) || 50
        const cupoMax  = Number(get('cupomximo','cupomax','cupo','capacidad','capacity','cupomaxmo')) || 15
        const descripcion = String(get('descripcion','descripción','description','desc')).trim()

        if (!nombre) errs.push(`Fila ${i + 2}: "Nombre" vacío — se omitirá`)
        if (!fecha)  errs.push(`Fila ${i + 2}: Fecha inválida («${get('fecha','date','dia')}») — se omitirá`)

        return {
          _valido: !!nombre && !!fecha,
          nombre, tipo,
          coachId:      coachMatch?.id ?? '',
          coachNombre:  coachMatch?.nombre ?? coachRaw,
          fecha,
          dia:          fecha ? diaDesdefecha(fecha) : '',
          hora, duracion,
          cupoMax, cupoActual: 0,
          descripcion,
        }
      }).filter(c => c._valido).map(({ _valido, ...c }) => c)

      setErrores(errs)
      setClasesParseadas(parsed)
      setPublicarEn(calcPublicarEn(parsed))
    } catch (e) {
      setErrores([`Error leyendo el archivo: ${e.message}`])
    } finally {
      setCargando(false)
    }
  }

  const confirmar = () => {
    onImportar(clasesParseadas.map(c => ({ ...c, ...(publicarEn ? { publicarEn } : {}) })))
    onClose()
  }

  const fmtFechaPublicacion = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.modalOverlay} style={{ display: 'flex' }} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Importar clases desde Excel</h2>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            onClick={descargarPlantilla}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 16px', borderRadius: 10,
              border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.08)',
              color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16 }}>📥</span> Descargar plantilla
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 16px', borderRadius: 10,
              border: '1px solid rgba(232,164,173,0.35)', background: 'rgba(232,164,173,0.07)',
              color: '#E8A4AD', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16 }}>📂</span> Seleccionar archivo
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
            onChange={e => { handleFile(e.target.files?.[0]); e.target.value = '' }} />
        </div>

        {/* Cargando */}
        {cargando && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Procesando archivo…
          </div>
        )}

        {/* Errores */}
        {errores.length > 0 && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 14 }}>
            {errores.map((e, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#ef4444', lineHeight: 1.7 }}>⚠ {e}</div>
            ))}
          </div>
        )}

        {/* Banner de publicación programada */}
        {clasesParseadas.length > 0 && publicarEn && (
          <div style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, marginBottom: 14, fontFamily: 'var(--font-body)', fontSize: 13, color: '#93c5fd', lineHeight: 1.6 }}>
            🗓 <strong>Publicación programada:</strong> Los usuarios verán estas clases a partir del <strong>{fmtFechaPublicacion(publicarEn)}</strong>
          </div>
        )}
        {clasesParseadas.length > 0 && !publicarEn && (
          <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, marginBottom: 14, fontFamily: 'var(--font-body)', fontSize: 13, color: '#86efac' }}>
            ✓ Las clases se publicarán inmediatamente al cargar.
          </div>
        )}

        {/* Tabla previa */}
        {clasesParseadas.length > 0 && (
          <>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              {clasesParseadas.length} clase{clasesParseadas.length !== 1 ? 's' : ''} detectadas:
            </div>
            <div style={{ overflowX: 'auto', marginBottom: 18 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-body)' }}>
                <thead>
                  <tr>
                    {['Nombre','Tipo','Coach','Fecha','Hora','Cupo'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', borderBottom: '1px solid var(--neutral-border)', color: 'var(--text-muted)', textAlign: 'left', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clasesParseadas.slice(0, 20).map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--neutral-border)' }}>
                      <td style={{ padding: '7px 10px', color: 'var(--text-primary)', fontWeight: 500 }}>{c.nombre}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: c.tipo === 'Stryde X' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', color: c.tipo === 'Stryde X' ? '#ef4444' : '#3b82f6' }}>{c.tipo}</span>
                      </td>
                      <td style={{ padding: '7px 10px', color: c.coachId ? 'var(--text-secondary)' : '#eab308' }}>
                        {c.coachNombre || '—'}{!c.coachId && c.coachNombre ? ' ⚠' : ''}
                      </td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{c.fecha}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{c.hora}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-muted)', textAlign: 'center' }}>{c.cupoMax}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clasesParseadas.length > 20 && (
                <div style={{ padding: '8px 10px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  … y {clasesParseadas.length - 20} más
                </div>
              )}
            </div>
          </>
        )}

        <div className={styles.modalActions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cancelar</button>
          {clasesParseadas.length > 0 && (
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={confirmar}>
              Cargar {clasesParseadas.length} clase{clasesParseadas.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminClases() {
  const { clases, agregarClase, editarClase } = useClasesStore()
  const { reservas } = useReservasStore()
  const { getUsuarioById } = useUsuariosStore()
  const { coaches: todosCoaches } = useCoachesStore()
  const coaches = todosCoaches.filter((c) => c.activo !== false)

  // View / navigation state
  const [vista,           setVista]           = useState('calendario')
  const [weekOffset,      setWeekOffset]      = useState(0)
  const [selectedDate,    setSelectedDate]    = useState(new Date())
  const [disciplina,      setDisciplina]      = useState('TODAS')

  // Modal state
  const [modalAbierto,  setModalAbierto]  = useState(false)
  const [editando,      setEditando]      = useState(null)
  const [form,          setForm]          = useState(CLASE_VACIA_BASE)
  const [eliminandoId,  setEliminandoId]  = useState(null)
  const [modalAlumnos,  setModalAlumnos]  = useState(null)
  const [modalImport,   setModalImport]   = useState(false)

  const handleImportar = (clases) => {
    clases.forEach(c => agregarClase(c))
    toast.success(`${clases.length} clase${clases.length !== 1 ? 's' : ''} importadas correctamente`)
  }

  // Week grid
  const days       = useMemo(() => getWeekDays(weekOffset), [weekOffset])
  const monthLabel = useMemo(() => getMonthLabel(days),     [days])

  // Classes for selected day (live from store via hook)
  const { classes: clasesDelDia } = useClasses(selectedDate)
  const clasesFiltradas = useMemo(() => {
    if (disciplina === 'TODAS') return clasesDelDia
    return clasesDelDia.filter((c) =>
      disciplina === 'Stryde X'
        ? !c.tipo?.toLowerCase().includes('slow')
        : c.tipo?.toLowerCase().includes('slow')
    )
  }, [clasesDelDia, disciplina])

  // Selected day index in current week strip
  const selectedDayIndex = days.findIndex((d) => isSameDay(d, selectedDate))

  // Week stats
  const totalReservas = clases.reduce((s, c) => s + c.cupoActual, 0)

  // ── Handlers ────────────────────────────────────────────────────
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const claseVacia = () => ({
    ...CLASE_VACIA_BASE,
    fecha:       new Date().toISOString().split('T')[0],
    coachId:     coaches[0]?.id     ?? '',
    coachNombre: coaches[0]?.nombre ?? '',
  })

  const abrirNueva = () => { setEditando(null); setForm(claseVacia()); setModalAbierto(true) }
  const abrirEditar = (clase) => { setEditando(clase.id); setForm({ ...clase }); setModalAbierto(true) }

  const handleGuardar = () => {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio')
    if (!form.fecha)         return toast.error('La fecha es obligatoria')
    const coach = coaches.find((c) => String(c.id) === String(form.coachId))
    const datos = {
      ...form,
      dia:         diaDesdefecha(form.fecha),
      coachId:     form.coachId,
      coachNombre: coach?.nombre || form.coachNombre,
      duracion:    Number(form.duracion),
      cupoMax:     Number(form.cupoMax),
    }
    if (editando) { editarClase(editando, datos); toast.success('Clase actualizada') }
    else          { agregarClase({ ...datos, cupoActual: 0 }); toast.success('Clase creada') }
    setModalAbierto(false)
  }

  const handleEliminar = (id) => { eliminarClaseConReservas(id); toast.success('Clase eliminada'); setEliminandoId(null) }

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

            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => setModalImport(true)}
              title="Importar clases desde Excel"
            >
              <Upload size={15} /> Importar Excel
            </button>
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
                {[['TODAS', 'Todas'], ['Stryde X', 'STRYDE'], ['Slow', 'SLOW']].map(([val, label]) => (
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
                    onAlumnos={setModalAlumnos}
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
                      <span className={`${styles.badge} ${!c.tipo?.toLowerCase().includes('slow') ? styles.badgeStride : styles.badgeSlow}`}>
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
                      <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} onClick={() => setModalAlumnos(c)}>
                        Alumnos
                      </button>
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
        {modalAbierto && createPortal(
          <div className={styles.modalOverlay} style={{ display: 'flex' }} onClick={() => setModalAbierto(false)}>
            <div className={styles.modal} style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
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
                  <select value={String(form.coachId)} onChange={set('coachId')}>
                    {coaches
                      .filter((c) => {
                        const esp = c.especialidad
                        if (!esp || esp === 'Ambas') return true
                        const claseEsSlow = form.tipo?.toLowerCase().includes('slow')
                        return claseEsSlow
                          ? esp.toLowerCase().includes('slow')
                          : !esp.toLowerCase().includes('slow')
                      })
                      .map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.nombre}</option>
                      ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Fecha</label>
                  <input type="date" value={form.fecha} onChange={set('fecha')} />
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
          </div>,
          document.body
        )}

        {/* ── Delete confirm modal ── */}
        {eliminandoId && createPortal(
          <div className={styles.modalOverlay} style={{ display: 'flex' }} onClick={() => setEliminandoId(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
          </div>,
          document.body
        )}

        {/* ── Alumnos modal ── */}
        {modalAlumnos && (() => {
          const alumnos = reservas.filter((r) => r.claseId === modalAlumnos.id)
          return createPortal(
            <div className={styles.modalOverlay} style={{ display: 'flex' }} onClick={() => setModalAlumnos(null)}>
              <div className={styles.modal} style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.modalTitle}>
                  Alumnos — {modalAlumnos.nombre}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                  {modalAlumnos.dia} · {modalAlumnos.hora} · {alumnos.length} registros
                </p>

                {alumnos.length === 0 ? (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-2xl) 0' }}>
                    Sin alumnos registrados en esta clase.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                    {alumnos.map((r) => {
                      const alumno = getUsuarioById(r.userId)
                      const nombre = alumno?.nombre ?? `Usuario #${r.userId}`
                      const esConfirmada = r.estado === ESTADOS_RESERVA.CONFIRMADA

                      return (
                        <div
                          key={r.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--neutral-border)',
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {nombre}
                            </div>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                              {r.asiento ?? 'Sin asiento'} · {r.fecha}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`${styles.badge} ${
                              r.estado === 'confirmada'  ? styles.badgeActive  :
                              r.estado === 'completada'  ? styles.badgeActive  :
                              r.estado === 'no_asistio'  ? styles.badgeDanger  :
                              styles.badgeInactive
                            }`}>
                              {r.estado === 'no_asistio' ? 'No asistió' :
                               r.estado === 'confirmada'  ? 'Confirmada' :
                               r.estado === 'completada'  ? 'Completada' : 'Cancelada'}
                            </span>
                            {esConfirmada && (
                              <button
                                className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                                onClick={() => {
                                  const resultado = marcarNoAsistio(r.id)
                                  if (resultado.ok) toast.success(`${nombre} marcado como no asistió`)
                                  else toast.error(resultado.error)
                                }}
                              >
                                No asistió
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setModalAlumnos(null)}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        })()}

        {/* ── Import Excel modal ── */}
        {modalImport && createPortal(
          <ModalImportarClases
            coaches={coaches}
            onImportar={handleImportar}
            onClose={() => setModalImport(false)}
          />,
          document.body
        )}

      </div>
    </DashboardLayout>
  )
}
