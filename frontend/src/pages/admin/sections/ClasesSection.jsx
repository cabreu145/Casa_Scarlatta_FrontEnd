import { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { eliminarClaseConReservas } from '@/services/reservasService'
import { logClaseEliminada, logClaseCreada } from '@/services/actividadService'
import { useListaEsperaStore } from '@/stores/listaEsperaStore'
import DateNavigator from '@/components/ui/DateNavigator'
import InfiniteList  from '@/components/ui/InfiniteList'
import { useClasses } from '@/hooks/useClasses'
import { useClasesStore } from '@/stores/clasesStore'
import { diaDesdefecha } from '@/utils/formatters'
import styles from '../AdminPanel.module.css'

const ABBR_DIA = { Lunes: 'LUN', Martes: 'MAR', Miércoles: 'MIÉ', Jueves: 'JUE', Viernes: 'VIE', Sábado: 'SÁB', Domingo: 'DOM' }

function Tag({ color, children }) {
  const cls = {
    green:  styles.tagGreen,
    red:    styles.tagRed,
    yellow: styles.tagYellow,
    blue:   styles.tagBlue,
    pink:   styles.tagPink,
    gray:   styles.tagGray,
  }[color] || styles.tagGreen
  return <span className={`${styles.miniTag} ${cls}`}>{children}</span>
}

function FilterChips({ options, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((o) => (
        <button
          key={o}
          className={`${styles.filterChip}${active === o ? ' ' + styles.active : ''}`}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

// ─── Import Excel modal ───────────────────────────────────────────────────────
function ModalImportarClases({ coaches, onImportar, onClose }) {
  const [clasesParseadas, setClasesParseadas] = useState([])
  const [errores,         setErrores]         = useState([])
  const [autoPublicarEn,  setAutoPublicarEn]  = useState(null)   // sugerencia automática
  const [modoPublicacion, setModoPublicacion] = useState('inmediato') // 'inmediato' | 'automatico' | 'personalizado'
  const [publicarEnCustom, setPublicarEnCustom] = useState('')   // datetime-local string
  const [cargando,        setCargando]        = useState(false)
  const fileInputRef = useRef(null)

  // Fecha/hora de publicación efectiva según el modo seleccionado
  const publicarEnFinal = (() => {
    if (modoPublicacion === 'inmediato') return null
    if (modoPublicacion === 'automatico') return autoPublicarEn
    if (modoPublicacion === 'personalizado' && publicarEnCustom) return publicarEnCustom
    return null
  })()

  const normalizar = (s) => String(s ?? '').toLowerCase().trim()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n')
    .replace(/[\s_\-()']/g,'')

  const descargarPlantilla = () => {
    const hoy = new Date()
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() + (7 - hoy.getDay() + 1) % 7 || 7) // próximo lunes
    const fmtFecha = (d) => d.toISOString().split('T')[0]
    const addDias  = (d, n) => { const r = new Date(d); r.setDate(d.getDate() + n); return r }

    const muestra = [
      { Nombre: 'Stride Power',  Tipo: 'Stryde X', Coach: coaches[0]?.nombre ?? 'Coach', Fecha: fmtFecha(addDias(lunes,0)), Hora: '07:00', 'Duracion (min)': 50, 'Cupo maximo': 15, Descripcion: 'Clase de potencia y cardio' },
      { Nombre: 'Slow Pilates',  Tipo: 'Slow',     Coach: coaches[1]?.nombre ?? coaches[0]?.nombre ?? 'Coach', Fecha: fmtFecha(addDias(lunes,0)), Hora: '09:00', 'Duracion (min)': 60, 'Cupo maximo': 12, Descripcion: 'Pilates consciente' },
      { Nombre: 'Stride HIIT',   Tipo: 'Stryde X', Coach: coaches[0]?.nombre ?? 'Coach', Fecha: fmtFecha(addDias(lunes,1)), Hora: '19:00', 'Duracion (min)': 50, 'Cupo maximo': 15, Descripcion: 'Alta intensidad' },
      { Nombre: 'Slow Stretch',  Tipo: 'Slow',     Coach: coaches[1]?.nombre ?? coaches[0]?.nombre ?? 'Coach', Fecha: fmtFecha(addDias(lunes,2)), Hora: '07:30', 'Duracion (min)': 55, 'Cupo maximo': 12, Descripcion: 'Stretching profundo' },
    ]
    const ws = XLSX.utils.json_to_sheet(muestra)
    // Columnas con ancho óptimo
    ws['!cols'] = [
      { wch: 20 }, // Nombre
      { wch: 12 }, // Tipo
      { wch: 22 }, // Coach
      { wch: 14 }, // Fecha
      { wch: 8  }, // Hora
      { wch: 16 }, // Duracion (min)
      { wch: 14 }, // Cupo maximo
      { wch: 35 }, // Descripcion
    ]
    // Encabezado fijo al hacer scroll
    ws['!freeze'] = { xSplit: 0, ySplit: 1 }
    // Filtros automáticos en encabezados
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
    const match = s.match(/^(\d{1,2}):(\d{2}).*?(AM|PM)?$/i)
    if (match) {
      let h = parseInt(match[1]); const m = match[2]; const ampm = match[3]?.toUpperCase()
      if (ampm === 'PM' && h < 12) h += 12
      if (ampm === 'AM' && h === 12) h = 0
      return `${String(h).padStart(2,'0')}:${m}`
    }
    if (!isNaN(val) && Number(val) > 0 && Number(val) < 1) {
      const totalMins = Math.round(Number(val) * 24 * 60)
      return `${String(Math.floor(totalMins/60)).padStart(2,'0')}:${String(totalMins%60).padStart(2,'0')}`
    }
    return '07:00'
  }

  const calcPublicarEnAuto = (clases) => {
    const fechas = clases.map(c => c.fecha).filter(Boolean).sort()
    if (!fechas.length) return null
    const primeraFecha = new Date(fechas[0] + 'T00:00:00')
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    if (primeraFecha <= hoy) return null
    const dow = primeraFecha.getDay()
    const daysToMon = dow === 0 ? 6 : dow - 1
    const lunes = new Date(primeraFecha); lunes.setDate(primeraFecha.getDate() - daysToMon)
    const domingo = new Date(lunes); domingo.setDate(lunes.getDate() - 1); domingo.setHours(23,59,59,0)
    return domingo.getTime() > Date.now() ? domingo.toISOString().split('.')[0] : null
  }

  const handleFile = async (file) => {
    if (!file) return
    setCargando(true); setClasesParseadas([]); setErrores([]); setAutoPublicarEn(null)
    try {
      const buffer = await file.arrayBuffer()
      const wb    = XLSX.read(buffer, { type: 'array', cellDates: false })
      const ws    = wb.Sheets[wb.SheetNames[0]]
      const raw   = XLSX.utils.sheet_to_json(ws, { defval: '' })
      if (!raw.length) { setErrores(['El archivo está vacío.']); setCargando(false); return }

      const errs = []
      const parsed = raw.map((row, i) => {
        const keys = Object.keys(row)
        const get  = (...cands) => { const k = keys.find(k => cands.includes(normalizar(k))); return k !== undefined ? row[k] : '' }

        const nombre  = String(get('nombre','name','clase','class')).trim()
        const tipo    = normalizar(String(get('tipo','type','disciplina'))).includes('slow') ? 'Slow' : 'Stryde X'
        const coachRaw = String(get('coach','instructor','entrenador')).trim()
        const coachMatch = coaches.find(c => coachRaw && (c.nombre.toLowerCase().includes(coachRaw.toLowerCase()) || coachRaw.toLowerCase().includes(c.nombre.toLowerCase())))
        const fecha   = parsearFecha(get('fecha','date','dia','fechaespecifica'))
        const hora    = parsearHora(get('hora','time','horario','horainicio'))
        const duracion  = Number(get('duracion','duration','duracionmin','minutos')) || 50
        const cupoMax   = Number(get('cupomaximo','cupomax','cupo','capacidad','capacity')) || 15
        const descripcion = String(get('descripcion','descripcion','description','desc')).trim()

        if (!nombre) errs.push(`Fila ${i+2}: Nombre vacío — se omitirá`)
        if (!fecha)  errs.push(`Fila ${i+2}: Fecha inválida — se omitirá`)

        return { _ok: !!nombre && !!fecha, nombre, tipo, coachId: coachMatch?.id ?? '', coachNombre: coachMatch?.nombre ?? coachRaw, fecha, dia: fecha ? diaDesdefecha(fecha) : '', hora, duracion, cupoMax, cupoActual: 0, descripcion }
      }).filter(c => c._ok).map(({ _ok, ...c }) => c)

      setErrores(errs)
      setClasesParseadas(parsed)

      const auto = calcPublicarEnAuto(parsed)
      setAutoPublicarEn(auto)
      // Si hay una sugerencia automática válida, seleccionarla por default
      setModoPublicacion(auto ? 'automatico' : 'inmediato')
      // Precargar el campo personalizado con la misma fecha auto para facilitar edición
      if (auto) setPublicarEnCustom(auto)
    } catch (e) { setErrores([`Error leyendo el archivo: ${e.message}`]) }
    finally { setCargando(false) }
  }

  const confirmar = () => {
    if (modoPublicacion === 'personalizado' && !publicarEnCustom) {
      toast.error('Selecciona la fecha y hora de publicación')
      return
    }
    onImportar(clasesParseadas.map(c => ({ ...c, ...(publicarEnFinal ? { publicarEn: publicarEnFinal } : {}) })))
    const msg = publicarEnFinal
      ? `${clasesParseadas.length} clase${clasesParseadas.length !== 1 ? 's' : ''} programadas para ${new Date(publicarEnFinal).toLocaleString('es-MX', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}`
      : `${clasesParseadas.length} clase${clasesParseadas.length !== 1 ? 's' : ''} publicadas inmediatamente`
    toast.success(msg)
    onClose()
  }

  return (
    <div className={styles.modalOverlay} style={{ display: 'flex' }} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Importar clases desde Excel</h2>

        {/* ── Botones de acción ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            onClick={descargarPlantilla}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 16px', borderRadius: 10,
              border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.08)',
              color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
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
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 16 }}>📂</span> Seleccionar archivo
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { handleFile(e.target.files?.[0]); e.target.value = '' }} />
        </div>

        {cargando && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 14, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Procesando archivo…
          </div>
        )}

        {errores.length > 0 && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 16 }}>
            {errores.map((e, i) => <div key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#f87171', lineHeight: 1.8 }}>⚠ {e}</div>)}
          </div>
        )}

        {/* ── Configuración de publicación ── */}
        {clasesParseadas.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              ¿Cuándo se publican las clases?
            </div>

            {/* Cards de modo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
              {/* Inmediato */}
              {[
                {
                  key: 'inmediato',
                  icon: '⚡',
                  label: 'Inmediato',
                  sub: 'Visible al instante',
                  available: true,
                  accent: '#4ade80',
                  accentBg: 'rgba(74,222,128,0.08)',
                  accentBorder: 'rgba(74,222,128,0.3)',
                },
                {
                  key: 'automatico',
                  icon: '🗓',
                  label: 'Automático',
                  sub: autoPublicarEn
                    ? `Dom ${new Date(autoPublicarEn).toLocaleDateString('es-MX',{day:'2-digit',month:'short'})} · 23:59`
                    : 'No disponible',
                  available: !!autoPublicarEn,
                  accent: '#60a5fa',
                  accentBg: 'rgba(96,165,250,0.08)',
                  accentBorder: 'rgba(96,165,250,0.3)',
                },
                {
                  key: 'personalizado',
                  icon: '🕐',
                  label: 'Personalizado',
                  sub: 'Elige fecha y hora',
                  available: true,
                  accent: '#fbbf24',
                  accentBg: 'rgba(251,191,36,0.08)',
                  accentBorder: 'rgba(251,191,36,0.3)',
                },
              ].map(({ key, icon, label, sub, available, accent, accentBg, accentBorder }) => {
                const active = modoPublicacion === key
                return (
                  <button
                    key={key}
                    onClick={() => available && setModoPublicacion(key)}
                    title={!available ? 'No disponible para clases de hoy o pasadas' : ''}
                    style={{
                      padding: '14px 12px', borderRadius: 12, cursor: available ? 'pointer' : 'default',
                      border: `1.5px solid ${active ? accentBorder : 'rgba(255,255,255,0.08)'}`,
                      background: active ? accentBg : 'rgba(255,255,255,0.03)',
                      opacity: available ? 1 : 0.35,
                      textAlign: 'center', transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                      color: active ? accent : 'rgba(255,255,255,0.75)',
                    }}>
                      {label}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 11,
                      color: active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)',
                      lineHeight: 1.4, textAlign: 'center',
                    }}>
                      {sub}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Selector de fecha/hora personalizado */}
            {modoPublicacion === 'personalizado' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
                  Publicar el:
                </span>
                <input
                  type="datetime-local"
                  value={publicarEnCustom}
                  min={new Date().toISOString().slice(0,16)}
                  onChange={e => setPublicarEnCustom(e.target.value)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: '1px solid rgba(251,191,36,0.3)',
                    background: 'rgba(0,0,0,0.3)', color: '#fff',
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    colorScheme: 'dark',
                  }}
                />
              </div>
            )}

            {/* Resumen */}
            {modoPublicacion === 'inmediato' && (
              <div style={{ padding: '10px 14px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 12, color: '#86efac' }}>
                ✓ Los usuarios verán estas clases en cuanto confirmes la carga.
              </div>
            )}
            {modoPublicacion === 'automatico' && autoPublicarEn && (
              <div style={{ padding: '10px 14px', background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 12, color: '#93c5fd' }}>
                🗓 Se publicarán automáticamente el <strong>{new Date(autoPublicarEn).toLocaleString('es-MX',{weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'})}</strong>
              </div>
            )}
            {modoPublicacion === 'personalizado' && publicarEnCustom && (
              <div style={{ padding: '10px 14px', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 12, color: '#fbbf24' }}>
                🕐 Se publicarán el <strong>{new Date(publicarEnCustom).toLocaleString('es-MX',{weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'})}</strong>
              </div>
            )}
          </div>
        )}

        {/* Tabla de clases parseadas */}
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
                      <td style={{ padding: '7px 10px', color: c.coachId ? 'var(--text-secondary)' : '#eab308' }}>{c.coachNombre || '—'}{!c.coachId && c.coachNombre ? ' ⚠' : ''}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{c.fecha}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{c.hora}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-muted)', textAlign: 'center' }}>{c.cupoMax}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clasesParseadas.length > 20 && (
                <div style={{ padding: '8px 10px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>… y {clasesParseadas.length - 20} más</div>
              )}
            </div>
          </>
        )}

        <div className={styles.modalActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Cancelar</button>
          {clasesParseadas.length > 0 && (
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={confirmar}>
              {publicarEnFinal ? '🕐 ' : '⚡ '}Cargar {clasesParseadas.length} clase{clasesParseadas.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClasesSection({
  clases,
  clasesFilter,
  setClasesFilter,
  selectMode,
  setSelectMode,
  selectedIds,
  setSelectedIds,
  coaches,
  disciplinas,
  openModal,
  setModalAlumnosClase,
  setAlumnoAgregarId,
  setModalEditClase,
  setEditClaseForm,
  claseForm,
  setClaseForm,
}) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    return hoy
  })
  const [modalImport, setModalImport] = useState(false)
  const { agregarClase } = useClasesStore()
  const { getPorClase }  = useListaEsperaStore()

  const handleImportar = (clases) => {
    clases.forEach(c => agregarClase(c))
    logClaseCreada({ nombre: `Importación masiva: ${clases.length} clases` })
    toast.success(`${clases.length} clase${clases.length !== 1 ? 's' : ''} importadas correctamente`)
  }

  const { classes: clasesDelDia } = useClasses(fechaSeleccionada)

  const clasesFiltradas = useMemo(() => {
    if (clasesFilter === 'Stryde X')
      return clasesDelDia.filter(c => !c.tipo?.toLowerCase().includes('slow'))
    if (clasesFilter === 'Slow')
      return clasesDelDia.filter(c => c.tipo?.toLowerCase().includes('slow'))
    return clasesDelDia
  }, [clasesDelDia, clasesFilter])

  return (
    <>
      <div className={styles.sectionTopRow}>
        <FilterChips
          options={['Todas', 'Stryde X', 'Slow']}
          active={clasesFilter}
          onChange={setClasesFilter}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {selectMode && selectedIds.size > 0 && (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ background: '#ef4444', borderColor: '#ef4444' }}
              onClick={() => {
                if (!window.confirm(`¿Eliminar ${selectedIds.size} clase${selectedIds.size > 1 ? 's' : ''}?`)) return
                selectedIds.forEach(id => eliminarClaseConReservas(id))
                toast.success(`${selectedIds.size} clase${selectedIds.size > 1 ? 's eliminadas' : ' eliminada'}`)
                setSelectedIds(new Set())
                setSelectMode(false)
              }}
            >
              🗑 Eliminar ({selectedIds.size})
            </button>
          )}
          <button
            className={`${styles.btn} ${selectMode ? styles.btnSecondary : styles.btnGhost}`}
            onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()) }}
          >
            {selectMode ? '✕ Cancelar' : '☑ Seleccionar'}
          </button>
          {!selectMode && (
            <>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalImport(true)}>
                📊 Importar Excel
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('clase')}>
                + Nueva Clase
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar de selección */}
      {selectMode && (() => {
        const todosSeleccionados = clasesFiltradas.length > 0 && clasesFiltradas.every(c => selectedIds.has(c.id))
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 8, fontFamily: 'var(--font-body)', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={todosSeleccionados}
              onChange={() => {
                if (todosSeleccionados) {
                  setSelectedIds(new Set())
                } else {
                  setSelectedIds(new Set(clasesFiltradas.map(c => c.id)))
                }
              }}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#ef4444' }}
            />
            <span style={{ color: 'var(--muted)' }}>
              {selectedIds.size === 0
                ? 'Selecciona las clases que deseas eliminar'
                : `${selectedIds.size} de ${clasesFiltradas.length} seleccionada${selectedIds.size > 1 ? 's' : ''}`}
            </span>
            {selectedIds.size > 0 && (
              <button
                style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                onClick={() => setSelectedIds(new Set())}
              >
                Deseleccionar todo
              </button>
            )}
          </div>
        )
      })()}

      <DateNavigator
        modo="dia"
        darkMode={true}
        onChange={(fecha) => {
          setFechaSeleccionada(fecha)
          setSelectedIds(new Set())
        }}
      />

      <div className={styles.card}>
        <InfiniteList
          items={clasesFiltradas}
          pageSize={12}
          darkMode={true}
          gap={10}
          renderItem={(c) => {
            const pct          = c.cupoMax > 0 ? Math.round((c.cupoActual / c.cupoMax) * 100) : 0
            const isPasada = (() => {
              if (!c.fecha) return false
              const [h, m] = (c.hora || '00:00').split(':').map(Number)
              const fin = new Date(c.fecha + 'T00:00:00')
              fin.setHours(h + Math.floor((c.duracion || 50) / 60), m + (c.duracion || 50) % 60)
              return fin < new Date()
            })()
            const statusTag    = isPasada ? 'gray' : pct >= 100 ? 'red' : pct >= 80 ? 'yellow' : 'green'
            const statusLabel  = isPasada ? 'Finalizada' : pct >= 100 ? 'Llena' : pct >= 80 ? 'Casi llena' : 'Abierta'
            const isProgramada = c.publicarEn && new Date(c.publicarEn) > new Date()
            const isSelected   = selectedIds.has(c.id)
            return (
              <div
                key={c.id}
                className={styles.claseItem}
                style={{
                  opacity:      isProgramada ? 0.75 : 1,
                  background:   isSelected ? 'rgba(239,68,68,0.08)' : undefined,
                  outline:      isSelected ? '1px solid rgba(239,68,68,0.3)' : undefined,
                  borderRadius: isSelected ? 'var(--radius-md)' : undefined,
                  cursor:       selectMode ? 'pointer' : undefined,
                }}
                onClick={selectMode ? () => {
                  setSelectedIds(prev => {
                    const next = new Set(prev)
                    next.has(c.id) ? next.delete(c.id) : next.add(c.id)
                    return next
                  })
                } : undefined}
              >
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    onClick={e => e.stopPropagation()}
                    style={{ width: 16, height: 16, flexShrink: 0, accentColor: '#ef4444', cursor: 'pointer' }}
                  />
                )}
                <div className={styles.claseDay}>
                  <span style={{ fontSize: 9 }}>{ABBR_DIA[c.dia] || c.dia}</span>
                  <span className={styles.dayNum}>
                    {(() => {
                      if (c.fecha) return new Date(c.fecha + 'T12:00:00').getDate()
                      const idx = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].indexOf(c.dia)
                      const hoy = new Date()
                      const diff = idx - hoy.getDay()
                      const fecha = new Date(hoy)
                      fecha.setDate(hoy.getDate() + (diff >= 0 ? diff : diff + 7))
                      return fecha.getDate()
                    })()}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className={styles.claseName}>
                    {c.nombre}
                    {isProgramada && (
                      <span style={{ marginLeft: 8, fontSize: 10, background: 'rgba(217,119,6,0.18)', color: '#d97706', padding: '2px 8px', borderRadius: 10, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                        🕐 Prog. {new Date(c.publicarEn).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className={styles.claseMeta}>{c.hora} · {c.duracion} min · {c.coachNombre}</div>
                </div>
                <Tag color={!c.tipo?.toLowerCase().includes('slow') ? 'pink' : 'blue'}>{c.tipo}</Tag>
                <div className={styles.claseSpots}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.cupoActual}/{c.cupoMax} lugares</div>
                  <div className={styles.spotsBar}>
                    <div className={styles.spotsFill} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {!isProgramada && <Tag color={statusTag}>{statusLabel}</Tag>}
                {c.cupoActual >= c.cupoMax && (() => {
                  const enEspera = getPorClase(c.id)
                  if (!enEspera.length) return null
                  return (
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 10,
                      background: 'rgba(245,158,11,0.12)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245,158,11,0.25)',
                      fontFamily: 'var(--font-body)',
                      marginLeft: 4,
                    }}>
                      ⏳ {enEspera.length} en espera
                    </span>
                  )
                })()}
                {!selectMode && <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => { setModalAlumnosClase(c); setAlumnoAgregarId('') }}
                  >
                    👥 {c.cupoActual}
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnGhost}`}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => {
                      setModalEditClase(c)
                      const coachNombre = c.coachNombre === 'Sin asignar' ? '' : c.coachNombre
                      setEditClaseForm({
                        nombre:      c.nombre,
                        tipo:        c.tipo,
                        coach:       coachNombre,
                        dia:         c.dia,
                        hora:        c.hora,
                        duracion:    String(c.duracion || 50),
                        cupoMax:     String(c.cupoMax || 15),
                        descripcion: c.descripcion || '',
                        publicarEn:  c.publicarEn
                          ? new Date(c.publicarEn).toISOString().slice(0, 16)
                          : '',
                        fecha:       c.fecha ?? '',
                      })
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnGhost}`}
                    style={{ padding: '6px 8px', fontSize: 12, color: '#ef4444' }}
                    onClick={() => {
                      if (!window.confirm(`¿Eliminar la clase "${c.nombre}"?`)) return
                      eliminarClaseConReservas(c.id)
                      logClaseEliminada({ nombre: c.nombre, coachNombre: c.coachNombre })
                      toast.success('Clase eliminada')
                    }}
                  >
                    🗑
                  </button>
                </div>}
              </div>
            )
          }}
          emptyNode={
            <div style={{
              textAlign:  'center',
              padding:    '40px 0',
              color:      'rgba(255,255,255,0.35)',
              fontFamily: 'var(--font-body)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 14 }}>Sin clases para este día</div>
            </div>
          }
        />
      </div>

      {modalImport && createPortal(
        <ModalImportarClases
          coaches={coaches}
          onImportar={handleImportar}
          onClose={() => setModalImport(false)}
        />,
        document.body
      )}
    </>
  )
}
