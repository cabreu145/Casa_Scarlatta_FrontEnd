/**
 * ActividadSection.jsx
 * ─────────────────────────────────────────────────────
 * Sección de actividad del sistema para el admin.
 * Muestra todos los eventos con filtros e infinite scroll.
 *
 * Filtros disponibles:
 * - Por tipo de evento
 * - Por fecha (DateNavigator modo libre)
 * - Por nombre de usuario
 * ─────────────────────────────────────────────────────
 */
import { useState, useMemo } from 'react'
import { useActividadStore, TIPO_LABELS, TIPO_ICONOS } from '@/stores/actividadStore'
import DateNavigator from '@/components/ui/DateNavigator'
import styles from '../AdminPanel.module.css'

const PAGE_SIZE = 10

const FILTROS_TIPO = [
  { value: 'todos',               label: 'Todos'              },
  { value: 'reserva_creada',      label: 'Reservas'           },
  { value: 'reserva_cancelada',   label: 'Cancelaciones'      },
  { value: 'usuario_nuevo',       label: 'Usuarios'           },
  { value: 'paquete_vendido',     label: 'Paquetes'           },
  { value: 'insumo_vendido',      label: 'Ventas POS'         },
  { value: 'corte_caja',          label: 'Cortes'             },
  { value: 'clase_creada',        label: 'Clases'             },
  { value: 'coach_agregado',      label: 'Coaches'            },
  { value: 'login_cliente',       label: '🔑 Sesiones cliente' },
  { value: 'lista_espera_unirse', label: '⏳ Lista espera'    },
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

  const [filtroTipo,       setFiltroTipo]       = useState('todos')
  const [rangoFecha,       setRangoFecha]       = useState({ tipo: 'hoy' })
  const [filtroUsuario,    setFiltroUsuario]    = useState('')
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false)
  const [expandido, setExpandido]               = useState(false)

  const hoy    = new Date().toISOString().split('T')[0]
  const semana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  const mes    = hoy.slice(0, 7)

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false
      if (rangoFecha.tipo === 'hoy'    && e.fecha !== hoy)              return false
      if (rangoFecha.tipo === 'semana' && e.fecha < semana)             return false
      if (rangoFecha.tipo === 'mes'    && e.fecha.slice(0, 7) !== mes)  return false
      if (rangoFecha.tipo === 'fecha'  && e.fecha !== rangoFecha.fecha) return false
      if (filtroUsuario.trim()) {
        const q = filtroUsuario.toLowerCase()
        if (!e.usuarioNombre?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [eventos, filtroTipo, rangoFecha, filtroUsuario, hoy, semana, mes])

  const eventosVisibles   = expandido ? eventosFiltrados : eventosFiltrados.slice(0, PAGE_SIZE)
  const hayMasEventos     = eventosFiltrados.length > PAGE_SIZE

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
              onClick={() => setFiltroTipo(value)}
              className={`${styles.filterChip}${filtroTipo === value ? ' ' + styles.active : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtro por fecha + búsqueda de usuario */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <DateNavigator
            modo="libre"
            darkMode={true}
            onChange={(rango) => setRangoFecha(rango)}
          />
          <input
            className={styles.searchInput}
            placeholder="🔍 Buscar por usuario..."
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
            style={{ flex: 1, minWidth: 200, maxWidth: 300 }}
          />
        </div>
      </div>

      {/* Lista de eventos */}
      <div className={styles.card}>
        {eventosFiltrados.length === 0 ? (
          <div style={{
            textAlign:  'center',
            padding:    '40px 0',
            color:      'rgba(255,255,255,0.35)',
            fontFamily: 'var(--font-body)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14 }}>
              {eventos.length === 0
                ? 'No hay eventos registrados aún. La actividad aparecerá aquí automáticamente.'
                : 'No hay eventos que coincidan con los filtros seleccionados.'}
            </div>
          </div>
        ) : (
          <>
            {eventosVisibles.map((evento, idx) => (
              <div
                key={evento.id}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          14,
                  padding:      '12px 16px',
                  borderBottom: idx < eventosVisibles.length - 1
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

            {hayMasEventos && (
              <button
                onClick={() => setExpandido(v => !v)}
                style={{
                  width: '100%', marginTop: 4, padding: '9px 0',
                  borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background  = 'rgba(123,31,46,0.15)'
                  e.currentTarget.style.color       = '#E8A4AD'
                  e.currentTarget.style.borderColor = 'rgba(123,31,46,0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background  = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.color       = 'rgba(255,255,255,0.5)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                {expandido ? '▲ Ver menos' : `▼ Ver ${eventosFiltrados.length - PAGE_SIZE} más`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
