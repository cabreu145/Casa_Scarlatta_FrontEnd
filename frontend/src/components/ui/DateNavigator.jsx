/**
 * DateNavigator.jsx
 * ─────────────────────────────────────────────────────
 * Componente reutilizable de navegación por fechas.
 * Soporta dos modos:
 *   - 'dia'   → tira de 7 días navegable por semanas
 *   - 'libre' → chips Todo/Hoy/Semana/Mes + picker de fecha específica
 *
 * Props:
 *   modo      'dia' | 'libre'
 *   onChange  (valor) => void
 *             En modo 'dia':   valor = Date seleccionada
 *             En modo 'libre': valor = { tipo, fecha? }
 *             tipos: 'todos' | 'hoy' | 'semana' | 'mes' | 'fecha'
 *   darkMode  boolean (true para panel admin oscuro)
 * ─────────────────────────────────────────────────────
 */
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DAYS_ABBR, MONTHS_ES } from '@/utils/formatters'

// ── Helpers ────────────────────────────────────────────────────────────────
function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function buildWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isToday(date) {
  const hoy = new Date()
  return date.getDate()     === hoy.getDate()
    && date.getMonth()    === hoy.getMonth()
    && date.getFullYear() === hoy.getFullYear()
}

function isSameDay(a, b) {
  return a.getDate()     === b.getDate()
    && a.getMonth()    === b.getMonth()
    && a.getFullYear() === b.getFullYear()
}

// ── Estilos dinámicos ──────────────────────────────────────────────────────
function inputRangoStyle(dark) {
  return {
    padding:      '5px 10px',
    borderRadius: 8,
    border:       `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(123,31,46,0.25)'}`,
    background:   dark ? 'rgba(255,255,255,0.06)' : 'transparent',
    color:        dark ? '#fff' : 'var(--text-primary)',
    fontFamily:   'var(--font-body)',
    fontSize:     13,
    outline:      'none',
    cursor:       'pointer',
  }
}

function chip(active, dark) {
  return {
    padding:      '6px 14px',
    borderRadius: 20,
    fontSize:     12,
    fontWeight:   500,
    cursor:       'pointer',
    border:       `1px solid ${active
      ? (dark ? '#6B1F2A' : 'var(--brand-wine)')
      : (dark ? 'rgba(255,255,255,0.12)' : 'rgba(123,31,46,0.18)')}`,
    background:   active
      ? (dark ? 'linear-gradient(135deg,#6B1F2A,#8B2D3A)' : 'var(--brand-wine)')
      : 'transparent',
    color:        active ? '#fff' : (dark ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)'),
    fontFamily:   'var(--font-body)',
    transition:   'all 0.2s',
  }
}

function navBtn(dark) {
  return {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    width:          32,
    height:         32,
    borderRadius:   '50%',
    border:         `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(123,31,46,0.18)'}`,
    background:     'transparent',
    color:          dark ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)',
    cursor:         'pointer',
    flexShrink:     0,
    transition:     'all 0.2s',
  }
}

function dayBtn(selected, today, dark) {
  return {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            4,
    padding:        '8px 14px',
    minWidth:       52,
    borderRadius:   12,
    border:         '1.5px solid',
    borderColor:    selected
      ? (dark ? '#6B1F2A' : 'var(--brand-wine)')
      : today
        ? (dark ? 'rgba(107,31,42,0.5)' : 'rgba(123,31,46,0.28)')
        : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(123,31,46,0.18)'),
    background:     selected
      ? (dark ? 'linear-gradient(135deg,#6B1F2A,#8B2D3A)' : 'var(--brand-wine)')
      : today
        ? (dark ? 'rgba(107,31,42,0.12)' : 'rgba(123,31,46,0.05)')
        : 'transparent',
    cursor:         'pointer',
    flexShrink:     0,
    transition:     'all 0.2s',
  }
}

// ── Modo DÍA ───────────────────────────────────────────────────────────────
function ModoDia({ onChange, darkMode }) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [weekStart, setWeekStart] = useState(() => startOfWeek(hoy))
  const [selected,  setSelected]  = useState(hoy)

  const days = useMemo(() => buildWeekDays(weekStart), [weekStart])

  const monthLabel = useMemo(() => {
    const meses = new Set(days.map(d => d.getMonth()))
    if (meses.size === 1) {
      return `${MONTHS_ES[days[0].getMonth()]} ${days[0].getFullYear()}`
    }
    return `${MONTHS_ES[days[0].getMonth()].slice(0,3)} – ${MONTHS_ES[days[6].getMonth()].slice(0,3)} ${days[6].getFullYear()}`
  }, [days])

  function select(date) {
    setSelected(date)
    onChange(date)
  }

  function prevWeek() {
    const prev = new Date(weekStart)
    prev.setDate(prev.getDate() - 7)
    setWeekStart(prev)
    select(prev)
  }

  function nextWeek() {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + 7)
    setWeekStart(next)
    select(next)
  }

  function goToday() {
    const hoyFresh = new Date()
    hoyFresh.setHours(0, 0, 0, 0)
    setWeekStart(startOfWeek(hoyFresh))
    select(hoyFresh)
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Controles */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 12,
        flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{
          fontFamily:    'var(--font-body)',
          fontSize:      13,
          fontWeight:    600,
          color:         darkMode ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)',
          letterSpacing: '0.03em',
        }}>
          {monthLabel}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button style={navBtn(darkMode)} onClick={prevWeek}>
            <ChevronLeft size={14} />
          </button>
          <button style={chip(false, darkMode)} onClick={goToday}>
            Hoy
          </button>
          <button style={navBtn(darkMode)} onClick={nextWeek}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Ir a fecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: darkMode ? 'rgba(255,255,255,0.45)' : 'var(--text-muted)',
        }}>
          Ir a fecha:
        </span>
        <input
          type="date"
          onChange={(e) => {
            const val = e.target.value
            if (!val) return
            const fecha = new Date(val + 'T00:00:00')
            setWeekStart(startOfWeek(fecha))
            select(fecha)
          }}
          style={{
            padding:      '4px 10px',
            borderRadius: 8,
            border:       `1px solid ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(123,31,46,0.25)'}`,
            background:   darkMode ? 'rgba(255,255,255,0.06)' : 'transparent',
            color:        darkMode ? '#fff' : 'var(--text-primary)',
            fontFamily:   'var(--font-body)',
            fontSize:     13,
            outline:      'none',
            cursor:       'pointer',
          }}
        />
      </div>

      {/* Tira de días */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto',
        paddingBottom: 4, scrollbarWidth: 'none',
      }}>
        {days.map((date, i) => {
          const sel   = isSameDay(date, selected)
          const today = isToday(date)
          return (
            <button key={i} style={dayBtn(sel, today, darkMode)} onClick={() => select(date)}>
              <span style={{
                fontFamily:    'var(--font-body)',
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color:         sel ? '#fff'
                  : today ? (darkMode ? '#E8A4AD' : 'var(--brand-wine)')
                  : (darkMode ? 'rgba(255,255,255,0.4)' : 'var(--text-muted)'),
              }}>
                {DAYS_ABBR[date.getDay()]}
              </span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize:   18,
                fontWeight: 700,
                color:      sel ? '#fff'
                  : today ? (darkMode ? '#fff' : 'var(--text-primary)')
                  : (darkMode ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)'),
                lineHeight: 1,
              }}>
                {date.getDate()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Modo LIBRE ─────────────────────────────────────────────────────────────
function ModoLibre({ onChange, darkMode, hideFecha = false, inicial = 'hoy' }) {
  const [activo,      setActivo]      = useState(inicial)
  const [fechaCustom, setFechaCustom] = useState('')
  const [fechaDesde,  setFechaDesde]  = useState('')
  const [fechaHasta,  setFechaHasta]  = useState('')

  const OPCIONES = [
    { value: 'todos',  label: 'Todo'        },
    { value: 'hoy',    label: 'Hoy'         },
    { value: 'semana', label: 'Esta semana' },
    { value: 'mes',    label: 'Este mes'    },
    ...(hideFecha ? [] : [
      { value: 'fecha', label: '📅 Fecha' },
      { value: 'rango', label: '📅 Rango' },
    ]),
  ]

  function seleccionar(value) {
    setActivo(value)
    setFechaCustom('')
    setFechaDesde('')
    setFechaHasta('')
    if (value !== 'fecha' && value !== 'rango') {
      onChange({ tipo: value })
    }
  }

  function onFechaChange(e) {
    const fecha = e.target.value
    setFechaCustom(fecha)
    if (fecha) onChange({ tipo: 'fecha', fecha })
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
      {OPCIONES.map(({ value, label }) => (
        <button
          key={value}
          style={chip(activo === value, darkMode)}
          onClick={() => seleccionar(value)}
        >
          {label}
        </button>
      ))}

      {activo === 'fecha' && (
        <input
          type="date"
          value={fechaCustom}
          onChange={onFechaChange}
          style={{
            padding:      '6px 12px',
            borderRadius: 8,
            border:       `1px solid ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(123,31,46,0.25)'}`,
            background:   darkMode ? 'rgba(255,255,255,0.06)' : 'transparent',
            color:        darkMode ? '#fff' : 'var(--text-primary)',
            fontFamily:   'var(--font-body)',
            fontSize:     13,
            outline:      'none',
            cursor:       'pointer',
          }}
        />
      )}

      {activo === 'rango' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: darkMode ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
            De:
          </span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => {
              const val = e.target.value
              setFechaDesde(val)
              if (val && fechaHasta && val <= fechaHasta) {
                onChange({ tipo: 'rango', fechaDesde: val, fechaHasta })
              }
            }}
            style={inputRangoStyle(darkMode)}
          />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: darkMode ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
            Hasta:
          </span>
          <input
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(e) => {
              const val = e.target.value
              setFechaHasta(val)
              if (fechaDesde && val && fechaDesde <= val) {
                onChange({ tipo: 'rango', fechaDesde, fechaHasta: val })
              }
            }}
            style={inputRangoStyle(darkMode)}
          />
          {fechaDesde && fechaHasta && fechaDesde <= fechaHasta && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.35)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {Math.ceil((new Date(fechaHasta) - new Date(fechaDesde)) / 86400000) + 1} días
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Export principal ───────────────────────────────────────────────────────
export default function DateNavigator({ modo = 'libre', onChange, darkMode = false, hideFecha = false, inicial = 'hoy' }) {
  if (modo === 'dia') return <ModoDia onChange={onChange} darkMode={darkMode} />
  return <ModoLibre onChange={onChange} darkMode={darkMode} hideFecha={hideFecha} inicial={inicial} />
}
