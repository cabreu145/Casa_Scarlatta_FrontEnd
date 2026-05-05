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
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks }          from './AdminDashboard'
import { useClasesStore }      from '@/stores/clasesStore'
import { useCoachesStore }     from '@/stores/coachesStore'
import { useTransaccionesStore } from '@/stores/transaccionesStore'
import { useTabuladorStore }   from '@/stores/tabuladorStore'
import { getReporteCoaches }   from '@/services/finanzasService'
import { mockUsers }           from '@/data/mockUsers'
import { ingresosUltimosMeses } from '@/data/mockTransacciones'
import styles from '@/styles/dashboard.module.css'

// ── Helpers de exportación ────────────────────────────────────────────────────
function exportarCSV(datos, nombre) {
  if (!datos?.length) { toast.error('Sin datos para exportar'); return }
  const headers = Object.keys(datos[0])
  const rows    = datos.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))
  const csv     = [headers.join(','), ...rows].join('\n')
  const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url     = URL.createObjectURL(blob)
  const a       = document.createElement('a')
  a.href = url; a.download = `${nombre}.csv`; a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV exportado')
}

async function exportarExcel(datos, nombre) {
  if (!datos?.length) { toast.error('Sin datos para exportar'); return }
  exportarCSV(datos, nombre) // Fallback a CSV directo (compatible sin librería externa)
}

function exportarPDF(nombre) {
  toast('PDF: Usa Ctrl+P → Guardar como PDF en el navegador', { icon: 'ℹ️' })
}

// ── Datos para cada reporte ───────────────────────────────────────────────────
function useReporteData() {
  const { clases, reservas } = useClasesStore()
  const { coaches }          = useCoachesStore()
  const { transacciones }    = useTransaccionesStore()
  const clientes             = mockUsers.filter(u => u.rol === 'cliente')

  const financiero = useMemo(() => transacciones.map(tx => ({
    Fecha:     tx.fecha,
    Concepto:  tx.concepto,
    Tipo:      tx.tipo,
    Método:    tx.metodoPago ?? 'efectivo',
    Monto:     tx.monto,
  })), [transacciones])

  const usuarios = useMemo(() => clientes.map(u => ({
    Nombre:    u.nombre ?? u.name,
    Email:     u.email,
    Activo:    u.activo ? 'Sí' : 'No',
    Paquete:   u.paquete ?? '—',
    Registro:  u.fechaRegistro ?? '—',
  })), [clientes])

  const clasesData = useMemo(() => clases.map(c => ({
    Nombre:      c.nombre,
    Tipo:        c.tipo,
    Día:         c.dia,
    Hora:        c.hora,
    Coach:       c.coachNombre,
    Asistentes:  c.cupoActual,
    Capacidad:   c.cupoMax,
    'Ocupación %': Math.round((c.cupoActual / c.cupoMax) * 100),
  })), [clases])

  const paquetes = useMemo(() => {
    const ventas = transacciones.filter(tx => tx.tipo === 'paquete')
    return ventas.map(tx => ({
      Fecha:     tx.fecha,
      Concepto:  tx.concepto,
      Método:    tx.metodoPago ?? 'efectivo',
      Monto:     tx.monto,
    }))
  }, [transacciones])

  const pdv = useMemo(() => {
    const ventas = transacciones.filter(tx => tx.tipo === 'producto')
    return ventas.map(tx => ({
      Fecha:     tx.fecha,
      Producto:  tx.concepto,
      Método:    tx.metodoPago ?? 'efectivo',
      Monto:     tx.monto,
    }))
  }, [transacciones])

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
function ReportCard({ icono, titulo, descripcion, onCSV, onExcel, onPDF }) {
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
        {onCSV && (
          <button onClick={onCSV} style={btnStyle('#1e3a1a', '#4ade80')}>📄 CSV</button>
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
  const { tabulador, actualizarRango, resetear } = useTabuladorStore()
  const [editMode, setEditMode]   = useState(false)
  const [tempTab, setTempTab]     = useState(null)

  const iniciarEdicion = () => {
    setTempTab(JSON.parse(JSON.stringify(tabulador)))
    setEditMode(true)
  }

  const guardarCambios = () => {
    Object.entries(tempTab).forEach(([disc, rangos]) => {
      rangos.forEach((r, i) => actualizarRango(disc, i, r))
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
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
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
                </div>
              ))}
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
  const reporte = useMemo(() => getReporteCoaches(periodo, true), [periodo])
  const [expandido, setExpandido] = useState(null)

  const exportarCoaches = () => {
    const datos = reporte.flatMap(coach =>
      coach.detalleClases.map(c => ({
        Coach:         coach.nombre,
        Especialidad:  coach.especialidad,
        Clase:         c.nombre,
        Tipo:          c.tipo,
        Día:           c.dia,
        Hora:          c.hora,
        Asistentes:    c.asistentes,
        Capacidad:     c.cupoMax,
        'Ocupación %': c.ocupPct,
        'Pago clase':  c.pagoClase,
      }))
    )
    exportarCSV(datos, `reporte_coaches_${periodo}_${new Date().toISOString().split('T')[0]}`)
  }

  return (
    <div style={{
      background:   'var(--neutral-card)',
      border:       '1px solid var(--neutral-border)',
      borderRadius: 12,
      padding:      '20px 24px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>
            Reporte de coaches
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Clases impartidas, ocupación y pago calculado automáticamente
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
            📊 Exportar
          </button>
        </div>
      </div>

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
                    {['Clase', 'Tipo', 'Día', 'Hora', 'Asistentes', 'Capacidad', 'Ocupación', 'Pago clase'].map(h => (
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
                      <td style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>{c.dia}</td>
                      <td style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>{c.hora}</td>
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
                      Total a pagar ({periodo}):
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
  const { clases }           = useClasesStore()
  const { transacciones }    = useTransaccionesStore()
  const [periodoCoach, setPeriodoCoach] = useState('mes')

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

  const { financiero, usuarios, clasesData, paquetes, pdv } = useReporteData()

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
        {/* ── Tarjetas de descarga rápida ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
          <ReportCard
            icono="💰" titulo="Reporte financiero"
            descripcion="Ingresos, gastos, desglose por categoría y período"
            onCSV={() => exportarCSV(financiero, `financiero_${new Date().toISOString().split('T')[0]}`)}
            onExcel={() => exportarExcel(financiero, `financiero_${new Date().toISOString().split('T')[0]}`)}
            onPDF={() => exportarPDF('financiero')}
          />
          <ReportCard
            icono="👥" titulo="Reporte de usuarios"
            descripcion="Lista completa, paquetes activos e historial"
            onCSV={() => exportarCSV(usuarios, `usuarios_${new Date().toISOString().split('T')[0]}`)}
            onExcel={() => exportarExcel(usuarios, `usuarios_${new Date().toISOString().split('T')[0]}`)}
            onPDF={() => exportarPDF('usuarios')}
          />
          <ReportCard
            icono="🏃" titulo="Reporte de clases"
            descripcion="Asistencia por clase, ocupación y horarios pico"
            onCSV={() => exportarCSV(clasesData, `clases_${new Date().toISOString().split('T')[0]}`)}
            onExcel={() => exportarExcel(clasesData, `clases_${new Date().toISOString().split('T')[0]}`)}
            onPDF={() => exportarPDF('clases')}
          />
          <ReportCard
            icono="📦" titulo="Reporte de paquetes"
            descripcion="Ventas por tipo de paquete y renovaciones"
            onCSV={() => exportarCSV(paquetes, `paquetes_${new Date().toISOString().split('T')[0]}`)}
            onExcel={() => exportarExcel(paquetes, `paquetes_${new Date().toISOString().split('T')[0]}`)}
            onPDF={() => exportarPDF('paquetes')}
          />
          <ReportCard
            icono="🛒" titulo="Reporte punto de venta"
            descripcion="Ventas de productos e inventario"
            onCSV={() => exportarCSV(pdv, `pdv_${new Date().toISOString().split('T')[0]}`)}
            onExcel={() => exportarExcel(pdv, `pdv_${new Date().toISOString().split('T')[0]}`)}
            onPDF={() => exportarPDF('pdv')}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
