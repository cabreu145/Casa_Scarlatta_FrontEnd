/**
 * AdminReportes.jsx
 * ─────────────────────────────────────────────────────
 * Módulo de Reportes rediseñado — Casa Scarlatta Admin
 *
 * Incluye:
 * - Reporte financiero exportable (Excel/CSV)
 * - Reporte de usuarios
 * - Reporte de clases y ocupación
 * - Reporte de coaches con tabulador de pagos editable
 * - Reporte de paquetes
 * - Reporte de punto de venta
 *
 * ✅ Para conectar backend: edita finanzasService.js
 * ─────────────────────────────────────────────────────
 */
import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks }          from './AdminDashboard'
import DateNavigator           from '@/components/ui/DateNavigator'
import { useClasesStore }      from '@/stores/clasesStore'
import { useCoachesStore }     from '@/stores/coachesStore'
import { useTransaccionesStore } from '@/stores/transaccionesStore'
import { useTabuladorStore }   from '@/stores/tabuladorStore'
import { usePaquetesStore }    from '@/stores/paquetesStore'
import { useUsuariosStore }    from '@/stores/usuariosStore'
import { getReporteCoaches }   from '@/services/finanzasService'
import { getClassDisplayTime } from '@/utils/classSchedule'
import { mockUsers }           from '@/data/mockUsers'
import { ingresosUltimosMeses } from '@/data/mockTransacciones'
import { abrirReportePDF }     from '@/utils/reportePDF'
import ReportesApiSection from '@/pages/admin/components/ReportesApiSection'
import styles from '@/styles/dashboard.module.css'

const useApiMode = import.meta.env.VITE_USE_API_AUTH === 'true'

// ── Helpers de exportación ────────────────────────────────────────────────────
function diaSemana(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T00:00:00')
  const s = d.toLocaleDateString('es-MX', { weekday: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function fechaDesdeDia(dia) {
  if (!dia) return '—'
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const idx = DIAS.indexOf(dia)
  if (idx === -1) return '—'
  const hoy = new Date()
  const hoySemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1
  const diff = idx - hoySemana
  const fecha = new Date(hoy)
  fecha.setDate(hoy.getDate() + (diff >= 0 ? diff : diff + 7))
  return fecha.toISOString().split('T')[0]
}

function parseMonto(v) {
  if (typeof v === 'number') return v
  const n = Number(String(v).replace(/[$,\s]/g, ''))
  return isNaN(n) ? 0 : n
}

function labelPeriodo(p) {
  if (!p) return 'historico'
  if (p.tipo === 'hoy')    return 'hoy'
  if (p.tipo === 'semana') return 'semana'
  if (p.tipo === 'mes')    return 'mes'
  if (p.tipo === 'fecha')  return p.fecha ?? 'fecha'
  if (p.tipo === 'rango') {
    const { fechaDesde, fechaHasta } = p
    return fechaDesde && fechaHasta ? `${fechaDesde}_${fechaHasta}` : 'rango'
  }
  return 'historico'
}

function tituloPeriodo(p) {
  if (!p) return 'Historial completo'
  if (p.tipo === 'hoy')    return 'Hoy'
  if (p.tipo === 'semana') return 'Esta semana'
  if (p.tipo === 'mes')    return 'Este mes'
  if (p.tipo === 'fecha')  return p.fecha ?? ''
  if (p.tipo === 'rango') {
    const { fechaDesde, fechaHasta } = p
    return fechaDesde && fechaHasta ? `Del ${fechaDesde} al ${fechaHasta}` : 'Rango de fechas'
  }
  return 'Historial completo'
}

function exportarExcel(datos, nombre, filasTotales = []) {
  if (!datos?.length) { toast.error('Sin datos para exportar'); return }
  const cols       = Object.keys(datos[0])
  const todasFilas = [...datos, ...filasTotales]

  const ws = XLSX.utils.json_to_sheet(todasFilas, { header: cols })

  // Ancho de columnas auto-ajustado
  ws['!cols'] = cols.map(col => ({
    wch: Math.min(
      Math.max(col.length, ...todasFilas.map(r => String(r[col] ?? '').length)) + 2,
      45
    ),
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
  XLSX.writeFile(wb, `${nombre}.xlsx`)
  toast.success('Excel exportado')
}

function exportarExcelFinanciero(datos, nombre) {
  if (!datos?.length) { toast.error('Sin datos para exportar'); return }
  const col      = 'Monto'
  const ingresos = datos.filter(r => parseMonto(r[col]) > 0).reduce((a, r) => a + parseMonto(r[col]), 0)
  const gastos   = datos.filter(r => parseMonto(r[col]) < 0).reduce((a, r) => a + Math.abs(parseMonto(r[col])), 0)
  const vacio    = Object.fromEntries(Object.keys(datos[0]).map(k => [k, '']))
  const totales  = [
    { ...vacio, Concepto: 'INGRESOS', [col]: ingresos          },
    { ...vacio, Concepto: 'GASTOS',   [col]: -gastos           },
    { ...vacio, Concepto: 'UTILIDAD', [col]: ingresos - gastos },
  ]
  exportarExcel(datos, nombre, totales)
}


// ── Datos para cada reporte ───────────────────────────────────────────────────
function useReporteData(periodoReporte = { tipo: 'todos' }) {
  const { clases }             = useClasesStore()
  const { coaches }            = useCoachesStore()
  const { transacciones }      = useTransaccionesStore()
  const { paquetes: catalogo } = usePaquetesStore()
  const { usuarios: todos }    = useUsuariosStore()
  const clientes               = mockUsers.filter(u => u.rol === 'cliente')

  const hoy    = new Date().toISOString().split('T')[0]
  const semana = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const mes    = hoy.slice(0, 7)

  const txFiltradas = useMemo(() => transacciones.filter(tx => {
    if (periodoReporte.tipo === 'hoy')    return tx.fecha === hoy
    if (periodoReporte.tipo === 'semana') return tx.fecha >= semana
    if (periodoReporte.tipo === 'mes')    return tx.fecha?.slice(0, 7) === mes
    if (periodoReporte.tipo === 'fecha')  return tx.fecha === periodoReporte.fecha
    if (periodoReporte.tipo === 'rango') {
      const { fechaDesde, fechaHasta } = periodoReporte
      if (!fechaDesde || !fechaHasta) return true
      return tx.fecha >= fechaDesde && tx.fecha <= fechaHasta
    }
    return true
  }), [transacciones, periodoReporte, hoy, semana, mes])

  const financiero = useMemo(() => txFiltradas.map(tx => ({
    Fecha:     tx.fecha,
    Día:       diaSemana(tx.fecha),
    Hora:      tx.hora ?? '—',
    Concepto:  tx.concepto,
    Tipo:      tx.tipo,
    Canal:     tx.canal ?? '—',
    Método:    tx.metodoPago ?? '—',
    Monto:     tx.monto,
  })), [txFiltradas])

  const usuarios = useMemo(() => clientes.map(u => {
    const txPaquetes = transacciones
      .filter(tx => tx.userId === u.id && tx.tipo === 'paquete')
      .sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''))
    const renovaciones    = txPaquetes.length > 1 ? txPaquetes.length - 1 : 0
    const ultimaRenovacion = renovaciones > 0 ? txPaquetes[txPaquetes.length - 1].fecha : '—'
    return {
      Nombre:              u.nombre ?? u.name,
      Email:               u.email,
      Activo:              u.activo ? 'Sí' : 'No',
      Paquete:             u.paquete ?? '—',
      'Renovó paquete':    renovaciones > 0 ? 'Sí' : 'No',
      'Veces renovado':    renovaciones > 0 ? renovaciones : '—',
      'Última renovación': ultimaRenovacion,
      Registro:            u.fechaRegistro ?? '—',
    }
  }), [clientes, transacciones])

  const clasesData = useMemo(() => clases.map(c => ({
    Fecha:       c.fecha ?? fechaDesdeDia(c.dia),
    Día:         c.dia,
    Hora:        getClassDisplayTime(c),
    Nombre:      c.nombre,
    Tipo:        c.tipo,
    Coach:       c.coachNombre,
    Asistentes:  c.cupoActual,
    Capacidad:   c.cupoMax,
    'Ocupación %': Math.round((c.cupoActual / c.cupoMax) * 100),
  })), [clases])

  const paquetes = useMemo(() => {
    const ventas = txFiltradas.filter(tx => tx.tipo === 'paquete')
    return ventas.map(tx => {
      const usuario = todos.find(u => u.id === tx.userId)
      const paqInfo = catalogo.find(p => tx.concepto?.includes(p.nombre))
      const vencimiento = (() => {
        if (!tx.fecha || !paqInfo?.vigencia) return '—'
        const dias = parseInt(paqInfo.vigencia) || 30
        const d = new Date(tx.fecha + 'T00:00:00')
        d.setDate(d.getDate() + dias)
        return d.toISOString().split('T')[0]
      })()
      return {
        Fecha:       tx.fecha,
        Día:         diaSemana(tx.fecha),
        Hora:        tx.hora ?? '—',
        Usuario:     usuario?.nombre ?? usuario?.name ?? '—',
        Concepto:    tx.concepto,
        Vencimiento: vencimiento,
        Canal:       tx.canal ?? '—',
        Método:      tx.metodoPago ?? '—',
        Monto:       tx.monto,
      }
    })
  }, [txFiltradas, todos, catalogo])

  const pdv = useMemo(() => {
    const ventas = txFiltradas.filter(tx => tx.tipo === 'producto')
    return ventas.map(tx => ({
      Fecha:     tx.fecha,
      Día:       diaSemana(tx.fecha),
      Hora:      tx.hora ?? '—',
      Producto:  tx.concepto,
      Canal:     tx.canal ?? '—',
      Método:    tx.metodoPago ?? '—',
      Monto:     tx.monto,
    }))
  }, [txFiltradas])

  return { financiero, usuarios, clasesData, paquetes, pdv }
}

// ── Barra de porcentaje ───────────────────────────────────────────────────────
function BarRow({ label, pct, value, color = 'var(--brand-wine)' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <div style={{ height: 6, background: 'var(--neutral-border)', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

// ── Tarjeta de reporte ────────────────────────────────────────────────────────
function ReportCard({ icono, titulo, descripcion, onExcel, onPDF }) {
  return (
    <div style={{
      background:   'var(--neutral-card)',
      border:       '1px solid var(--neutral-border)',
      borderRadius: 12,
      padding:      '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <span style={{ fontSize: 26 }}>{icono}</span>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
            {titulo}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {descripcion}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onExcel && (
          <button onClick={onExcel} style={btnStyle('#1a472a', '#22c55e')}>📊 Excel</button>
        )}
        {onPDF && (
          <button onClick={onPDF} style={btnStyle('#2d1b1b', '#ef4444')}>📋 PDF</button>
        )}
      </div>
    </div>
  )
}

function btnStyle(bg, color) {
  return {
    flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${color}44`,
    background: bg, color, fontFamily: 'var(--font-body)', fontSize: 12,
    cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s',
  }
}

// ── Tabulador editable ────────────────────────────────────────────────────────
function TabuladorEditor() {
  const { tabulador, agregarDisciplina, resetear } = useTabuladorStore()
  const [editMode, setEditMode]   = useState(false)
  const [tempTab, setTempTab]     = useState(null)

  const iniciarEdicion = () => {
    setTempTab(JSON.parse(JSON.stringify(tabulador)))
    setEditMode(true)
  }

  const guardarCambios = () => {
    Object.entries(tempTab).forEach(([disc, rangos]) => {
      agregarDisciplina(disc, rangos)
    })
    setEditMode(false)
    toast.success('Tabulador actualizado')
  }

  const handleChange = (disc, idx, campo, val) => {
    setTempTab(prev => ({
      ...prev,
      [disc]: prev[disc].map((r, i) => i === idx ? { ...r, [campo]: Number(val) } : r),
    }))
  }

  const handleAgregarFila = (disc) => {
    setTempTab(prev => {
      const rangos = prev[disc]
      const ultimo = rangos[rangos.length - 1]
      return { ...prev, [disc]: [...rangos, { min: (ultimo?.max ?? 0) + 1, max: (ultimo?.max ?? 0) + 5, pago: 0 }] }
    })
  }

  const handleEliminarFila = (disc, idx) => {
    setTempTab(prev => {
      if (prev[disc].length <= 1) return prev
      return { ...prev, [disc]: prev[disc].filter((_, i) => i !== idx) }
    })
  }

  const tab = editMode ? tempTab : tabulador

  return (
    <div style={{
      background:   'var(--neutral-card)',
      border:       '1px solid var(--neutral-border)',
      borderRadius: 12,
      padding:      '20px 24px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>
            Tabulador de pagos por clase
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Pago según disciplina y número de asistentes por clase impartida
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editMode ? (
            <>
              <button onClick={guardarCambios} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
                Guardar
              </button>
              <button onClick={() => setEditMode(false)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--neutral-border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={iniciarEdicion} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #7B1E22', background: 'transparent', color: '#E8A4AD', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
                ✏️ Editar tabulador
              </button>
              <button onClick={() => { resetear(); toast('Tabulador restaurado', { icon: '↩️' }) }} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--neutral-border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
                Restaurar
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {Object.entries(tab).map(([disciplina, rangos]) => (
          <div key={disciplina}>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
              paddingBottom: 8, borderBottom: '1px solid var(--neutral-border)',
            }}>
              {disciplina}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rangos.map((r, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: editMode ? '1fr 1fr 1fr auto' : '1fr 1fr 1fr',
                  gap: 8, alignItems: 'center',
                  background: '#2C1A1E', borderRadius: 8, padding: '10px 12px',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Mín personas</div>
                    {editMode ? (
                      <input type="number" min="1" value={r.min}
                        onChange={e => handleChange(disciplina, i, 'min', e.target.value)}
                        style={inputTabStyle} />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-primary)' }}>{r.min}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Máx personas</div>
                    {editMode ? (
                      <input type="number" min="1" value={r.max}
                        onChange={e => handleChange(disciplina, i, 'max', e.target.value)}
                        style={inputTabStyle} />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-primary)' }}>{r.max}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Pago/clase</div>
                    {editMode ? (
                      <input type="number" min="0" step="50" value={r.pago}
                        onChange={e => handleChange(disciplina, i, 'pago', e.target.value)}
                        style={{ ...inputTabStyle, color: '#22c55e' }} />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#22c55e', fontWeight: 600 }}>
                        ${r.pago}
                      </span>
                    )}
                  </div>
                  {editMode && (
                    <button onClick={() => handleEliminarFila(disciplina, i)} title="Eliminar fila" style={{
                      width: 26, height: 26, borderRadius: 6, border: '1px solid #7B1E22',
                      background: 'transparent', color: '#E8A4AD', cursor: 'pointer',
                      fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: rangos.length <= 1 ? 0.3 : 1,
                    }}>×</button>
                  )}
                </div>
              ))}
              {editMode && (
                <button onClick={() => handleAgregarFila(disciplina)} style={{
                  width: '100%', padding: '7px 0', borderRadius: 8, marginTop: 4,
                  border: '1px dashed #7B1E22', background: 'transparent',
                  color: '#E8A4AD', fontFamily: 'var(--font-body)', fontSize: 13,
                  cursor: 'pointer',
                }}>+ Agregar fila</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputTabStyle = {
  width: '100%', padding: '4px 6px', background: '#1E1014',
  border: '1px solid #7B1E22', borderRadius: 6, color: 'white',
  fontFamily: 'var(--font-display)', fontSize: 15, boxSizing: 'border-box',
}

// ── Tabla de coaches ──────────────────────────────────────────────────────────
function TablaCoaches({ periodo, setPeriodo }) {
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [expandido, setExpandido]   = useState(null)

  const rangoFecha = (fechaDesde && fechaHasta)
    ? { tipo: 'rango', fechaDesde, fechaHasta }
    : null

  const reporte = useMemo(() => getReporteCoaches(periodo, true, rangoFecha), [periodo, rangoFecha])

  const periodoLabel = rangoFecha
    ? `Del ${fechaDesde} al ${fechaHasta}`
    : (periodo === 'quincena' ? 'Quincena actual' : 'Mes actual')
  const periodoKey = rangoFecha
    ? `${fechaDesde}_${fechaHasta}`
    : periodo

  const datosCoachesPlanos = useMemo(() => reporte.flatMap(coach =>
    coach.detalleClases.map(c => ({
      Coach:         coach.nombre,
      Especialidad:  coach.especialidad,
      Clase:         c.nombre,
      Tipo:          c.tipo,
      Fecha:         c.fecha ?? '—',
      Día:           c.dia,
      Hora:          getClassDisplayTime(c),
      Asistentes:    c.asistentes,
      Capacidad:     c.cupoMax,
      'Ocupación %': c.ocupPct,
      'Pago clase':  c.pagoClase,
    }))
  ), [reporte])

  const exportarCoaches = () => {
    exportarExcel(datosCoachesPlanos, `reporte_coaches_${periodoKey}_${new Date().toISOString().split('T')[0]}`)
  }

  const exportarCoachesPDF = () => {
    abrirReportePDF({
      tipo:    'coaches',
      titulo:  'Reporte de Coaches',
      datos:   datosCoachesPlanos,
      periodo: periodoLabel,
    })
  }

  const inputDateStyle = {
    padding: '6px 10px', borderRadius: 8,
    border: '1px solid var(--neutral-border)',
    background: '#1E1014', color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)', fontSize: 12,
    cursor: 'pointer',
  }

  return (
    <div style={{
      background:   'var(--neutral-card)',
      border:       '1px solid var(--neutral-border)',
      borderRadius: 12,
      padding:      '20px 24px',
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>
            Reporte de coaches
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Clases impartidas, ocupación y pago calculado automáticamente
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Quincena/Mes — siempre visible */}
          <div style={{ display: 'flex', gap: 4, background: '#1E1014', padding: 4, borderRadius: 8 }}>
            {[{ v: 'quincena', l: 'Quincena' }, { v: 'mes', l: 'Mes' }].map(({ v, l }) => (
              <button key={v} onClick={() => setPeriodo(v)} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 12,
                background: periodo === v ? '#7B1E22' : 'transparent',
                color:      periodo === v ? '#fff' : '#A69A93',
              }}>{l}</button>
            ))}
          </div>
          <button onClick={exportarCoaches} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid #22c55e44',
            background: '#1a472a', color: '#22c55e', fontFamily: 'var(--font-body)', fontSize: 12,
            cursor: 'pointer', fontWeight: 600,
          }}>
            📊 CSV
          </button>
          <button onClick={exportarCoachesPDF} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid #ef444444',
            background: '#2d1b1b', color: '#ef4444', fontFamily: 'var(--font-body)', fontSize: 12,
            cursor: 'pointer', fontWeight: 600,
          }}>
            📋 PDF
          </button>
        </div>
      </div>

      {/* Filtro por rango de fechas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
          Filtrar por período:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>Desde</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            style={inputDateStyle}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>Hasta</span>
          <input
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={e => setFechaHasta(e.target.value)}
            style={inputDateStyle}
          />
        </div>
        {(fechaDesde || fechaHasta) && (
          <button
            onClick={() => { setFechaDesde(''); setFechaHasta('') }}
            style={{
              padding: '5px 12px', borderRadius: 8, border: '1px solid var(--neutral-border)',
              background: 'transparent', color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer',
            }}
          >
            × Limpiar
          </button>
        )}
      </div>

      {/* Indicador período activo cuando hay rango personalizado */}
      {rangoFecha && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
          padding: '7px 12px',
          background: 'rgba(123,31,46,0.1)', border: '1px solid rgba(123,31,46,0.25)', borderRadius: 8,
        }}>
          <span style={{ fontSize: 13 }}>📅</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#E8A4AD' }}>
            Mostrando: <strong>{periodoLabel}</strong>
          </span>
        </div>
      )}

      {reporte.map(coach => (
        <div key={coach.coachId} style={{
          border: '1px solid var(--neutral-border)', borderRadius: 10, marginBottom: 12, overflow: 'hidden',
        }}>
          {/* Fila resumen del coach */}
          <div
            onClick={() => setExpandido(expandido === coach.coachId ? null : coach.coachId)}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
              gap: 12, alignItems: 'center', padding: '14px 18px',
              cursor: 'pointer', background: expandido === coach.coachId ? 'rgba(123,30,34,0.1)' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {coach.nombre}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                {coach.especialidad}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)' }}>{coach.totalClases}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>Clases</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 18,
                color: coach.ocupPromedio >= 70 ? '#22c55e' : coach.ocupPromedio >= 40 ? '#eab308' : '#ef4444',
              }}>
                {coach.ocupPromedio}%
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>Ocup. promedio</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#22c55e' }}>
                ${(coach.totalPago ?? 0).toLocaleString()}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>Pago estimado</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: periodo === 'quincena' ? 'rgba(59,130,246,0.15)' : 'rgba(123,30,34,0.15)',
                color:      periodo === 'quincena' ? '#3b82f6' : '#E8A4AD',
                border:     `1px solid ${periodo === 'quincena' ? '#3b82f644' : '#7B1E2244'}`,
              }}>
                {periodo === 'quincena' ? 'Quincena' : 'Mes'}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {expandido === coach.coachId ? '▲' : '▼'}
            </div>
          </div>

          {/* Detalle expandible */}
          {expandido === coach.coachId && (
            <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--neutral-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                <thead>
                  <tr>
                    {['Clase', 'Tipo', 'Fecha', 'Hora', 'Asistentes', 'Capacidad', 'Ocupación', 'Pago clase'].map(h => (
                      <th key={h} style={{
                        fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)',
                        textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--neutral-border)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coach.detalleClases.map(c => (
                    <tr key={c.claseId} style={{ borderBottom: '1px solid var(--neutral-border)' }}>
                      <td style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500 }}>{c.nombre}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: c.tipo === 'Stryde X' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                          color:      c.tipo === 'Stryde X' ? '#ef4444' : '#3b82f6',
                        }}>{c.tipo}</span>
                      </td>
                      <td style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {c.fecha
                          ? (() => {
                              const d = new Date(c.fecha + 'T00:00:00')
                              return d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
                            })()
                          : (c.dia ?? '—')}
                      </td>
                      <td style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>{getClassDisplayTime(c)}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--font-display)', fontSize: 15,
                          color: c.asistentes === c.cupoMax ? '#22c55e' : c.asistentes === 0 ? '#ef4444' : 'var(--text-primary)',
                        }}>
                          {c.asistentes}
                          {c.asistentes === c.cupoMax && ' ✓'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                        {c.cupoMax}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--neutral-border)', borderRadius: 2 }}>
                            <div style={{
                              height: '100%',
                              width: `${c.ocupPct}%`,
                              background: c.ocupPct >= 70 ? '#22c55e' : c.ocupPct >= 40 ? '#eab308' : '#ef4444',
                              borderRadius: 2,
                            }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', minWidth: 30 }}>
                            {c.ocupPct}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', fontFamily: 'var(--font-display)', fontSize: 15, color: '#22c55e', textAlign: 'right' }}>
                        ${(c.pagoClase ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={7} style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>
                      Total a pagar ({periodoLabel}):
                    </td>
                    <td style={{ padding: '10px 10px', fontFamily: 'var(--font-display)', fontSize: 18, color: '#22c55e', fontWeight: 600, textAlign: 'right' }}>
                      ${(coach.totalPago ?? 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
export function ReportesSection({ inPanel = false }) {
  if (useApiMode) {
    return <ReportesApiSection inPanel={inPanel} />
  }

  const { clases }           = useClasesStore()
  const { transacciones }    = useTransaccionesStore()
  const [periodoCoach, setPeriodoCoach]     = useState('mes')
  const [periodoReporte, setPeriodoReporte] = useState({ tipo: 'todos' })
  const [navKey, setNavKey]                 = useState(0)

  const clientes         = mockUsers.filter(u => u.rol === 'cliente')
  const clientesActivos  = clientes.filter(u => u.activo)
  const nuevosEsteMes    = clientes.filter(u => u.fechaRegistro >= '2026-04-01')
  const ingresoMax       = Math.max(...ingresosUltimosMeses.map(m => m.monto), 1)

  const strideClases    = clases.filter(c => c.tipo === 'Stryde X')
  const slowClases      = clases.filter(c => c.tipo === 'Slow')
  const ocupStrideAvg   = strideClases.length
    ? Math.round(strideClases.reduce((a,c) => a + (c.cupoActual/c.cupoMax)*100, 0) / strideClases.length) : 0
  const ocupSlowAvg     = slowClases.length
    ? Math.round(slowClases.reduce((a,c) => a + (c.cupoActual/c.cupoMax)*100, 0) / slowClases.length) : 0

  const top5 = [...clases]
    .sort((a,b) => b.cupoActual - a.cupoActual)
    .slice(0,5)

  const { financiero, usuarios, clasesData, paquetes, pdv } = useReporteData(periodoReporte)

  const label  = labelPeriodo(periodoReporte)
  const titulo = tituloPeriodo(periodoReporte)
  const hoyStr = new Date().toISOString().split('T')[0]

  const panelStyle = {
    background:   'var(--neutral-card)',
    border:       '1px solid var(--neutral-border)',
    borderRadius: 12,
    padding:      '20px 24px',
    marginBottom: 16,
  }

  return (
    <>
      <div className={inPanel ? undefined : styles.page}>
        {/* ── Filtro de período ── */}
        <DateNavigator
          key={navKey}
          modo="libre"
          darkMode={true}
          inicial="todos"
          onChange={(r) => setPeriodoReporte(r)}
        />

        {/* ── Indicador visual del período activo ── */}
        {periodoReporte.tipo !== 'todos' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 16, marginTop: -8,
            padding: '8px 14px',
            background: 'rgba(123,31,46,0.1)',
            border: '1px solid rgba(123,31,46,0.25)',
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#E8A4AD' }}>
              Los reportes incluyen datos de: <strong>{titulo}</strong>
            </span>
            <button
              onClick={() => { setPeriodoReporte({ tipo: 'todos' }); setNavKey(k => k + 1) }}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
                fontSize: 16, lineHeight: 1, padding: '0 4px',
              }}
              title="Limpiar filtro"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Tarjetas de descarga rápida ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
          <ReportCard
            icono="💰" titulo="Reporte financiero"
            descripcion="Ingresos, gastos, desglose por categoría y período"
            onExcel={() => exportarExcelFinanciero(financiero, `financiero_${label}_${hoyStr}`)}
            onPDF={() => abrirReportePDF({ tipo: 'financiero', titulo: `Reporte Financiero — ${titulo}`, datos: financiero, periodo: titulo })}
          />
          <ReportCard
            icono="👥" titulo="Reporte de usuarios"
            descripcion="Lista completa, paquetes activos e historial"
            onExcel={() => exportarExcel(usuarios, `usuarios_${label}_${hoyStr}`)}
            onPDF={() => abrirReportePDF({ tipo: 'usuarios', titulo: `Reporte de Usuarios — ${titulo}`, datos: usuarios, periodo: titulo })}
          />
          <ReportCard
            icono="🏃" titulo="Reporte de clases"
            descripcion="Asistencia por clase, ocupación y horarios pico"
            onExcel={() => exportarExcel(clasesData, `clases_${label}_${hoyStr}`)}
            onPDF={() => abrirReportePDF({ tipo: 'clases', titulo: `Reporte de Clases — ${titulo}`, datos: clasesData, periodo: titulo })}
          />
          <ReportCard
            icono="📦" titulo="Reporte de paquetes"
            descripcion="Ventas por tipo de paquete y renovaciones"
            onExcel={() => {
              const total = paquetes.reduce((a, r) => a + parseMonto(r.Monto), 0)
              const vacio = Object.fromEntries(Object.keys(paquetes[0] ?? {}).map(k => [k, '']))
              exportarExcel(paquetes, `paquetes_${label}_${hoyStr}`, [{ ...vacio, Concepto: 'TOTAL', Monto: total }])
            }}
            onPDF={() => abrirReportePDF({ tipo: 'paquetes', titulo: `Reporte de Paquetes — ${titulo}`, datos: paquetes, periodo: titulo })}
          />
          <ReportCard
            icono="🛒" titulo="Reporte punto de venta"
            descripcion="Ventas de productos e inventario"
            onExcel={() => exportarExcel(pdv, `pdv_${label}_${hoyStr}`)}
            onPDF={() => abrirReportePDF({ tipo: 'pdv', titulo: `Reporte Punto de Venta — ${titulo}`, datos: pdv, periodo: titulo })}
          />
        </div>

        {/* ── Tabulador de coaches ── */}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--brand-wine)', margin: '0 0 16px', paddingBottom: 8, borderBottom: '1px solid var(--neutral-border)' }}>
          Tabulador de pagos
        </h2>
        <TabuladorEditor />

        {/* ── Reporte detallado de coaches ── */}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--brand-wine)', margin: '24px 0 16px', paddingBottom: 8, borderBottom: '1px solid var(--neutral-border)' }}>
          Reporte de coaches
        </h2>
        <TablaCoaches periodo={periodoCoach} setPeriodo={setPeriodoCoach} />

        {/* ── Ingresos históricos ── */}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--brand-wine)', margin: '24px 0 16px', paddingBottom: 8, borderBottom: '1px solid var(--neutral-border)' }}>
          Métricas generales
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
          {/* Ingresos históricos */}
          <div style={panelStyle}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Ingresos últimos 6 meses
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 110 }}>
              {ingresosUltimosMeses.map((m, i) => (
                <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>
                    ${Math.round(m.monto/1000)}k
                  </span>
                  <div style={{
                    width: '100%', background: 'var(--brand-wine)', borderRadius: '4px 4px 0 0',
                    height: `${Math.round((m.monto/ingresoMax)*80)}px`,
                    opacity: i === ingresosUltimosMeses.length - 1 ? 1 : 0.45 + (i * 0.1),
                    transition: 'height 0.4s ease',
                  }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{m.mes}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clientes */}
          <div style={panelStyle}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Estado de clientes
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              {[
                { label: 'Activos',       val: clientesActivos.length, color: '#22c55e' },
                { label: 'Inactivos',     val: clientes.length - clientesActivos.length, color: '#ef4444' },
                { label: 'Nuevos mes',    val: nuevosEsteMes.length, color: 'var(--brand-wine)' },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                </div>
              ))}
            </div>
            <BarRow label="Activos" pct={Math.round((clientesActivos.length/clientes.length)*100)} value={`${clientesActivos.length}`} color="#22c55e" />
            <BarRow label="Inactivos" pct={Math.round(((clientes.length-clientesActivos.length)/clientes.length)*100)} value={`${clientes.length-clientesActivos.length}`} color="#ef4444" />
          </div>
        </div>

        {/* Ocupación por disciplina */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <div style={panelStyle}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Ocupación por disciplina
            </div>
            <BarRow label="Stryde X" pct={ocupStrideAvg} value={`${ocupStrideAvg}%`} color="#ef4444" />
            <BarRow label="Slow"     pct={ocupSlowAvg}   value={`${ocupSlowAvg}%`}   color="#3b82f6" />
          </div>

          <div style={panelStyle}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Top 5 clases más llenas
            </div>
            {top5.map(c => (
              <BarRow
                key={c.id}
                label={c.nombre}
                pct={Math.round((c.cupoActual/c.cupoMax)*100)}
                value={`${c.cupoActual}/${c.cupoMax}`}
                color={c.tipo === 'Stryde X' ? '#ef4444' : '#3b82f6'}
              />
            ))}
          </div>
        </div>

      </div>
    </>
  )
}

export default function AdminReportes() {
  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>
        <ReportesSection />
      </div>
    </DashboardLayout>
  )
}
