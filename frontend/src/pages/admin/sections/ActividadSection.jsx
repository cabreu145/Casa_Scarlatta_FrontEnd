/**
 * ActividadSection.jsx
 * ─────────────────────────────────────────────────────
 * Sección de actividad del sistema para el admin.
 * Muestra todos los eventos con filtros y paginación.
 *
 * Filtros disponibles:
 * - Por tipo de evento
 * - Por fecha (hoy, semana, mes, rango)
 * - Por nombre de usuario
 * ─────────────────────────────────────────────────────
 */
import { useState, useMemo } from 'react'
import { useActividadStore, TIPO_LABELS, TIPO_ICONOS } from '@/stores/actividadStore'
import styles from '../AdminPanel.module.css'

const EVENTOS_POR_PAGINA = 20

const FILTROS_TIPO = [
  { value: 'todos',             label: 'Todos'        },
  { value: 'reserva_creada',    label: 'Reservas'     },
  { value: 'reserva_cancelada', label: 'Cancelaciones'},
  { value: 'usuario_nuevo',     label: 'Usuarios'     },
  { value: 'paquete_vendido',   label: 'Paquetes'     },
  { value: 'insumo_vendido',    label: 'Ventas POS'   },
  { value: 'corte_caja',        label: 'Cortes'       },
  { value: 'clase_creada',      label: 'Clases'       },
  { value: 'coach_agregado',    label: 'Coaches'      },
]

const FILTROS_FECHA = [
  { value: 'todos',  label: 'Todo'       },
  { value: 'hoy',    label: 'Hoy'        },
  { value: 'semana', label: 'Esta semana'},
  { value: 'mes',    label: 'Este mes'   },
]

function formatTimestamp(iso) {
  const d = new Date(iso)
  return d.toLocaleString('es-MX', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

export default function ActividadSection() {
  const { eventos, limpiarEventos } = useActividadStore()

  const [filtroTipo,    setFiltroTipo]    = useState('todos')
  const [filtroFecha,   setFiltroFecha]   = useState('todos')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [pagina,        setPagina]        = useState(1)
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false)

  const hoy    = new Date().toISOString().split('T')[0]
  const semana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  const mes    = hoy.slice(0, 7)

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false
      if (filtroFecha === 'hoy'    && e.fecha !== hoy)              return false
      if (filtroFecha === 'semana' && e.fecha < semana)             return false
      if (filtroFecha === 'mes'    && e.fecha.slice(0, 7) !== mes)  return false
      if (filtroUsuario.trim()) {
        const q = filtroUsuario.toLowerCase()
        if (!e.usuarioNombre?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [eventos, filtroTipo, filtroFecha, filtroUsuario, hoy, semana, mes])

  const totalPaginas  = Math.max(1, Math.ceil(eventosFiltrados.length / EVENTOS_POR_PAGINA))
  const eventosPagina = eventosFiltrados.slice(
    (pagina - 1) * EVENTOS_POR_PAGINA,
    pagina * EVENTOS_POR_PAGINA
  )

  function cambiarFiltro(setter) {
    return (val) => { setter(val); setPagina(1) }
  }

  return (
    <div>
      {/* Header con contador y limpiar */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13,
            color: 'var(--text-muted)' }}>
            {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? 's' : ''} encontrado{eventosFiltrados.length !== 1 ? 's' : ''}
            {eventos.length > 0 && ` · ${eventos.length} en total`}
          </div>
        </div>
        {eventos.length > 0 && (
          confirmarLimpiar ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)' }}>
                ¿Limpiar todo el historial?
              </span>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ fontSize: 12, padding: '5px 12px', color: '#ef4444' }}
                onClick={() => { limpiarEventos(); setConfirmarLimpiar(false) }}
              >Confirmar</button>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ fontSize: 12, padding: '5px 12px' }}
                onClick={() => setConfirmarLimpiar(false)}
              >Cancelar</button>
            </div>
          ) : (
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              style={{ fontSize: 12, padding: '5px 14px', color: 'var(--text-muted)' }}
              onClick={() => setConfirmarLimpiar(true)}
            >🗑 Limpiar historial</button>
          )
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>

        {/* Filtro por tipo */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTROS_TIPO.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => cambiarFiltro(setFiltroTipo)(value)}
              className={`${styles.filterChip}${filtroTipo === value ? ' ' + styles.active : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtro por fecha + búsqueda de usuario */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTROS_FECHA.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => cambiarFiltro(setFiltroFecha)(value)}
                className={`${styles.filterChip}${filtroFecha === value ? ' ' + styles.active : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            className={styles.searchInput}
            placeholder="🔍 Buscar por usuario..."
            value={filtroUsuario}
            onChange={(e) => { setFiltroUsuario(e.target.value); setPagina(1) }}
            style={{ flex: 1, minWidth: 200, maxWidth: 300 }}
          />
        </div>
      </div>

      {/* Lista de eventos */}
      <div className={styles.card}>
        {eventosPagina.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0',
            color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14 }}>
              {eventos.length === 0
                ? 'No hay eventos registrados aún. La actividad aparecerá aquí automáticamente.'
                : 'No hay eventos que coincidan con los filtros seleccionados.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {eventosPagina.map((evento, idx) => (
              <div
                key={evento.id}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          14,
                  padding:      '12px 16px',
                  borderBottom: idx < eventosPagina.length - 1
                    ? '1px solid var(--neutral-border)' : 'none',
                  transition:   'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Ícono */}
                <div style={{
                  width:          36,
                  height:         36,
                  borderRadius:   '50%',
                  background:     'rgba(255,255,255,0.06)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       16,
                  flexShrink:     0,
                }}>
                  {TIPO_ICONOS[evento.tipo] ?? '📌'}
                </div>

                {/* Descripción */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily:   'var(--font-body)',
                    fontSize:     13,
                    color:        'var(--text-primary)',
                    fontWeight:   500,
                    whiteSpace:   'nowrap',
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {evento.descripcion}
                  </div>
                  {evento.usuarioNombre && (
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize:   11,
                      color:      'var(--text-muted)',
                      marginTop:  2,
                    }}>
                      {evento.usuarioNombre}
                    </div>
                  )}
                </div>

                {/* Tipo badge */}
                <span style={{
                  fontFamily:    'var(--font-body)',
                  fontSize:      10,
                  fontWeight:    600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding:       '3px 10px',
                  borderRadius:  'var(--radius-pill)',
                  background:    'rgba(255,255,255,0.06)',
                  color:         'var(--text-muted)',
                  flexShrink:    0,
                }}>
                  {TIPO_LABELS[evento.tipo] ?? evento.tipo}
                </span>

                {/* Timestamp */}
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize:   11,
                  color:      'var(--text-muted)',
                  flexShrink: 0,
                  minWidth:   120,
                  textAlign:  'right',
                }}>
                  {formatTimestamp(evento.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            8,
          marginTop:      20,
        }}>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            style={{ padding: '6px 14px', fontSize: 13 }}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >← Anterior</button>

          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPaginas ||
                Math.abs(p - pagina) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) {
                  acc.push('...')
                }
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) => p === '...' ? (
                <span key={`ellipsis-${idx}`} style={{
                  padding: '6px 4px', fontSize: 13,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                }}>...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPagina(p)}
                  className={`${styles.btn} ${p === pagina ? styles.btnPrimary : styles.btnGhost}`}
                  style={{ padding: '6px 12px', fontSize: 13, minWidth: 36 }}
                >{p}</button>
              ))
            }
          </div>

          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            style={{ padding: '6px 14px', fontSize: 13 }}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >Siguiente →</button>
        </div>
      )}
    </div>
  )
}
