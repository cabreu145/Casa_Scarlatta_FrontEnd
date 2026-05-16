import { useState, useMemo } from 'react'
import { getDashboardMetrics, getIngresosPorMes, getDistribucionPaquetes,
         getClasesHoy, getUsuariosPorVencer, getUltimasVentas }
  from '@/services/dashboardService'
import { useTransaccionesStore } from '@/stores/transaccionesStore'
import { useUsuariosStore }      from '@/stores/usuariosStore'
import { useClasesStore }        from '@/stores/clasesStore'
import { usePaquetesStore }      from '@/stores/paquetesStore'
import DateNavigator from '@/components/ui/DateNavigator'
import styles from '../AdminPanel.module.css'

// ── Helpers ────────────────────────────────────────────────────────────────
function subtituloDash(rango, fechaEspec) {
  const hoy   = new Date()
  const MESES = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre']
  const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  if (fechaEspec) {
    const d = new Date(fechaEspec + 'T00:00:00')
    return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()}`
  }
  if (rango === 'dia')
    return `${DIAS[hoy.getDay()]} ${hoy.getDate()} de ${MESES[hoy.getMonth()]} ${hoy.getFullYear()}`
  if (rango === 'semana') {
    const hace7 = new Date(hoy); hace7.setDate(hoy.getDate() - 7)
    return `${hace7.getDate()} – ${hoy.getDate()} de ${MESES[hoy.getMonth()]} ${hoy.getFullYear()}`
  }
  if (rango === 'mes')
    return `${MESES[hoy.getMonth()].charAt(0).toUpperCase() + MESES[hoy.getMonth()].slice(1)} ${hoy.getFullYear()}`
  return 'Todo el historial disponible'
}

function formatHora(hora) {
  if (!hora) return '—'
  const [h, m] = hora.split(':').map(Number)
  const ampm   = h >= 12 ? 'PM' : 'AM'
  const h12    = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ icono, label, valor, cambio, up, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={styles.kpiCard}
      style={{
        cursor:     onClick ? 'pointer' : 'default',
        transform:  hovered && onClick ? 'translateY(-3px)' : 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow:  hovered && onClick ? '0 8px 24px rgba(123,31,46,0.2)' : 'none',
        position:   'relative',
      }}
    >
      {onClick && (
        <div style={{
          position:      'absolute', bottom: 12, right: 14,
          fontFamily:    'var(--font-body)', fontSize: 10,
          color:         'rgba(255,255,255,0.3)', letterSpacing: '0.05em',
        }}>
          Ver más →
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className={styles.kpiLabel}>{label}</div>
        <div className={styles.kpiIcon}>{icono}</div>
      </div>
      <div className={styles.kpiValue}>{valor}</div>
      <div className={`${styles.kpiChange} ${up ? styles.up : styles.down}`}>
        {up ? '↑' : '↓'} {cambio}
      </div>
    </div>
  )
}

// ── Barra con tooltip ──────────────────────────────────────────────────────
function BarraConTooltip({ h, label, ingresos, color, isLast }) {
  const [show, setShow] = useState(false)
  return (
    <div
      className={styles.barWrap}
      style={{ position: 'relative' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {show && (
        <div style={{
          position:     'absolute',
          bottom:       `calc(${h} + 10px)`,
          left:         '50%',
          transform:    'translateX(-50%)',
          background:   '#1E1014',
          border:       '1px solid rgba(232,164,173,0.3)',
          borderRadius: 6,
          padding:      '5px 10px',
          whiteSpace:   'nowrap',
          zIndex:       10,
          fontFamily:   'var(--font-body)',
          fontSize:     12,
          color:        '#E8A4AD',
          fontWeight:   600,
        }}>
          ${ingresos.toLocaleString()}
          <div style={{
            position:    'absolute',
            bottom:      -5,
            left:        '50%',
            transform:   'translateX(-50%)',
            width:       8,
            height:      8,
            background:  '#1E1014',
            border:      '1px solid rgba(232,164,173,0.3)',
            borderTop:   'none',
            borderLeft:  'none',
            rotate:      '45deg',
          }} />
        </div>
      )}
      <div
        className={styles.bar}
        style={{
          height:          h,
          background:      color,
          opacity:         show ? 1 : (isLast ? 0.95 : 0.6),
          transition:      'opacity 0.2s, transform 0.2s',
          transform:       show ? 'scaleY(1.03)' : 'none',
          transformOrigin: 'bottom',
          cursor:          'pointer',
        }}
      />
      <div className={styles.barLabel}>{label}</div>
    </div>
  )
}

// ── Donut SVG real ─────────────────────────────────────────────────────────
function DonutReal({ segmentos }) {
  const [hovIdx, setHovIdx] = useState(null)
  if (!segmentos?.length) {
    return (
      <div style={{
        width: 110, height: 110, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)',
      }}>
        Sin datos
      </div>
    )
  }

  const total  = segmentos.reduce((s, p) => s + p.count, 0) || 1
  const R      = 40
  const stroke = 18
  const cx     = 55
  const cy     = 55
  let acum     = -90

  const arcos = segmentos.map((seg, i) => {
    const pct      = seg.count / total
    const deg      = pct * 360
    const start    = acum
    acum           += deg
    const startRad = (start * Math.PI) / 180
    const endRad   = ((start + deg) * Math.PI) / 180
    const x1       = cx + R * Math.cos(startRad)
    const y1       = cy + R * Math.sin(startRad)
    const x2       = cx + R * Math.cos(endRad)
    const y2       = cy + R * Math.sin(endRad)
    const large    = deg > 180 ? 1 : 0
    return { ...seg, path: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`, i, pct }
  })

  return (
    <svg width={110} height={110} viewBox="0 0 110 110">
      {arcos.map(({ path, color, nombre, i, pct }) => (
        <path
          key={i}
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={hovIdx === i ? stroke + 4 : stroke}
          strokeLinecap="butt"
          style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }}
          onMouseEnter={() => setHovIdx(i)}
          onMouseLeave={() => setHovIdx(null)}
        >
          <title>{nombre} — {Math.round(pct * 100)}%</title>
        </path>
      ))}
      <circle cx={cx} cy={cy} r={R - stroke / 2 - 1} fill="#251C22" />
      {hovIdx !== null ? (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle"
            style={{ fontFamily: 'var(--font-body)', fontSize: 13, fill: '#fff', fontWeight: 700 }}>
            {Math.round(arcos[hovIdx].pct * 100)}%
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            style={{ fontFamily: 'var(--font-body)', fontSize: 8, fill: 'rgba(255,255,255,0.5)' }}>
            {arcos[hovIdx].nombre.slice(0, 12)}
          </text>
        </>
      ) : (
        <text x={cx} y={cy + 5} textAnchor="middle"
          style={{ fontFamily: 'var(--font-body)', fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}>
          paquetes
        </text>
      )}
    </svg>
  )
}

// ── Tag ────────────────────────────────────────────────────────────────────
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

// ── Botón Ver más ──────────────────────────────────────────────────────────
function VerMas({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width:         '100%',
        marginTop:     12,
        padding:       '8px 0',
        borderRadius:  8,
        border:        '1px solid rgba(255,255,255,0.08)',
        background:    'rgba(255,255,255,0.03)',
        color:         'rgba(255,255,255,0.45)',
        fontFamily:    'var(--font-body)',
        fontSize:      12,
        cursor:        'pointer',
        transition:    'all 0.2s',
        letterSpacing: '0.04em',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background   = 'rgba(123,31,46,0.15)'
        e.currentTarget.style.color        = '#E8A4AD'
        e.currentTarget.style.borderColor  = 'rgba(123,31,46,0.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background   = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.color        = 'rgba(255,255,255,0.45)'
        e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.08)'
      }}
    >
      Ver más →
    </button>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function DashboardSection({ rangoDash, setRangoDash, showSection }) {
  const [fechaEspecifica, setFechaEspecifica] = useState(null)

  // Subscribirse a los stores para reactividad
  const { transacciones } = useTransaccionesStore()
  const { usuarios }      = useUsuariosStore()
  const { clases }        = useClasesStore()
  const { paquetes }      = usePaquetesStore()

  const metricas      = useMemo(() => getDashboardMetrics(rangoDash),       [rangoDash, transacciones, usuarios, clases])
  const ingresosMes   = useMemo(() => getIngresosPorMes(),                  [transacciones])
  const distPaquetes  = useMemo(() => getDistribucionPaquetes(),             [transacciones, paquetes])
  const clasesHoy     = useMemo(() => getClasesHoy(),                       [clases])
  const porVencer     = useMemo(() => getUsuariosPorVencer(),               [usuarios])
  const ultimasVentas = useMemo(() => getUltimasVentas(),                   [transacciones, usuarios])

  const maxIngreso = Math.max(...ingresosMes.map(m => m.ingresos), 1)
  const COLORES_BARRA = [
    '#3B1A22','#4A1F2B','#5C2533','#6B2A3A','#7B3042',
    '#8C3A4E','#9B435A','#C26B7A',
  ]

  const tituloRango = rangoDash === 'dia' && !fechaEspecifica ? 'Hoy'
    : rangoDash === 'semana' ? 'Esta semana'
    : rangoDash === 'mes'    ? 'Este mes'
    : fechaEspecifica        ? new Date(fechaEspecifica + 'T00:00:00')
        .toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
    : 'General'

  return (
    <>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 24,
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily:   'var(--font-display)',
            fontSize:     28,
            fontStyle:    'italic',
            fontWeight:   400,
            color:        '#fff',
            lineHeight:   1.1,
            marginBottom: 4,
          }}>
            {tituloRango}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize:   13,
            color:      'rgba(255,255,255,0.4)',
          }}>
            {subtituloDash(rangoDash, fechaEspecifica)}
          </div>
        </div>
        <DateNavigator
          modo="libre"
          darkMode={true}
          onChange={(rango) => {
            const mapa = { hoy: 'dia', semana: 'semana', mes: 'mes', todos: 'todos', fecha: 'fecha' }
            setRangoDash(mapa[rango.tipo] ?? 'dia')
            setFechaEspecifica(rango.fecha ?? null)
          }}
        />
      </div>

      {/* ── KPIs ── */}
      <div className={styles.kpiGrid} style={{ marginBottom: 20 }}>
        <KpiCard
          icono="👥" label="Usuarios activos"
          valor={metricas.totalUsuarios}
          cambio="12% vs mes anterior" up
          onClick={() => showSection('usuarios')}
        />
        <KpiCard
          icono="📦" label="Paquetes vendidos"
          valor={metricas.paquetesVendidos}
          cambio="8% vs mes anterior" up
          onClick={() => showSection('paquetes')}
        />
        <KpiCard
          icono="💰" label="Ingresos del mes"
          valor={`$${metricas.ingresosTotales.toLocaleString()}`}
          cambio="15% vs mes anterior" up
          onClick={() => showSection('finanzas')}
        />
        <KpiCard
          icono="🔄" label="Ocupación promedio"
          valor={`${metricas.ocupacionPromedio}%`}
          cambio="3% vs mes anterior" up={false}
          onClick={() => showSection('clases')}
        />
      </div>

      {/* ── Gráfica + Distribución paquetes ── */}
      <div className={styles.dashGrid} style={{ marginBottom: 20 }}>

        {/* Gráfica de ingresos reales */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Ingresos mensuales</div>
              <div className={styles.cardSub}>Últimos 8 meses — pasa el cursor sobre las barras</div>
            </div>
          </div>
          <div className={styles.chartBars}>
            {ingresosMes.map((m, i) => {
              const pct = maxIngreso > 0
                ? Math.max(8, Math.round((m.ingresos / maxIngreso) * 100))
                : 8
              return (
                <BarraConTooltip
                  key={m.mes}
                  h={`${pct}%`}
                  label={m.label}
                  ingresos={m.ingresos}
                  color={COLORES_BARRA[i] ?? '#7B1F2E'}
                  isLast={i === ingresosMes.length - 1}
                />
              )
            })}
          </div>
          <VerMas onClick={() => showSection('finanzas')} />
        </div>

        {/* Distribución de paquetes real */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Distribución paquetes</div>
              <div className={styles.cardSub}>Ventas reales por tipo</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
            <DonutReal segmentos={distPaquetes} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {distPaquetes.length > 0 ? distPaquetes.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: p.color, flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily:   'var(--font-body)',
                    fontSize:     12,
                    color:        'rgba(255,255,255,0.75)',
                    flex:         1,
                    whiteSpace:   'nowrap',
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {p.nombre}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize:   12,
                    color:      p.color,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {p.pct}%
                  </span>
                </div>
              )) : (
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize:   12,
                  color:      'rgba(255,255,255,0.3)',
                }}>
                  Sin ventas registradas
                </div>
              )}
            </div>
          </div>
          <VerMas onClick={() => showSection('paquetes')} />
        </div>
      </div>

      {/* ── Clases hoy + Últimas ventas + Por vencer ── */}
      <div className={styles.fullGrid}>

        {/* Clases hoy */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Clases hoy</div>
            <Tag color="blue">{clasesHoy.length} clases</Tag>
          </div>
          <div className={styles.miniList}>
            {clasesHoy.length > 0 ? clasesHoy.map(c => {
              const pct      = c.cupoMax > 0 ? Math.round((c.cupoActual / c.cupoMax) * 100) : 0
              const tagColor = pct >= 100 ? 'red' : pct >= 80 ? 'yellow' : 'green'
              const tagLabel = pct >= 100 ? 'Llena' : pct >= 80 ? 'Casi llena' : 'Abierta'
              const diaAbr   = c.dia ? c.dia.slice(0, 3).toUpperCase() : 'HOY'
              const diaN     = c.fecha
                ? new Date(c.fecha + 'T12:00:00').getDate()
                : new Date().getDate()
              return (
                <div key={c.id} className={styles.miniItem}>
                  <div className={styles.claseDay}>
                    <span style={{ fontSize: 9 }}>{diaAbr}</span>
                    <span className={styles.dayNum}>{diaN}</span>
                  </div>
                  <div>
                    <div className={styles.miniName}>{c.nombre}</div>
                    <div className={styles.miniSub}>
                      {formatHora(c.hora)} · {c.coachNombre} · {c.cupoActual}/{c.cupoMax}
                    </div>
                  </div>
                  <div className={styles.miniRight}>
                    <Tag color={tagColor}>{tagLabel}</Tag>
                  </div>
                </div>
              )
            }) : (
              <div style={{
                textAlign:  'center',
                padding:    '20px 0',
                color:      'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-body)',
                fontSize:   13,
              }}>
                Sin clases programadas hoy
              </div>
            )}
          </div>
          <VerMas onClick={() => showSection('clases')} />
        </div>

        {/* Últimas ventas */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Últimas ventas</div>
          </div>
          <div className={styles.miniList}>
            {ultimasVentas.length > 0 ? ultimasVentas.map(tx => (
              <div key={tx.id} className={styles.miniItem}>
                <div className={styles.miniAvatar}>{tx.inicial}</div>
                <div>
                  <div className={styles.miniName}>{tx.nombreUsuario}</div>
                  <div className={styles.miniSub}>{tx.concepto} · {tx.fecha}</div>
                </div>
                <div className={styles.miniRight}>
                  <div className={styles.miniVal}>${(tx.monto ?? 0).toLocaleString()}</div>
                  <Tag color="green">Pagado</Tag>
                </div>
              </div>
            )) : (
              <div style={{
                textAlign:  'center',
                padding:    '20px 0',
                color:      'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-body)',
                fontSize:   13,
              }}>
                Sin ventas registradas
              </div>
            )}
          </div>
          <VerMas onClick={() => showSection('finanzas')} />
        </div>

        {/* Paquetes por vencer */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Paquetes por vencer</div>
            <Tag color="yellow">{porVencer.length} usuarios</Tag>
          </div>
          <div className={styles.miniList}>
            {porVencer.length > 0 ? porVencer.map(u => (
              <div key={u.id} className={styles.miniItem}>
                <div className={styles.miniAvatar}>{u.nombre?.charAt(0) ?? 'U'}</div>
                <div>
                  <div className={styles.miniName}>{u.nombre}</div>
                  <div className={styles.miniSub}>
                    {u.diasRestantes !== null
                      ? `Vence en ${u.diasRestantes} día${u.diasRestantes !== 1 ? 's' : ''}`
                      : 'Sin fecha'}
                    {u.clasesRestantes !== null
                      ? ` · ${u.clasesRestantes} clase${u.clasesRestantes !== 1 ? 's' : ''}`
                      : ''}
                  </div>
                </div>
                <div className={styles.miniRight}>
                  <Tag color={u.urgente ? 'red' : 'yellow'}>
                    {u.urgente ? 'Urgente' : 'Pronto'}
                  </Tag>
                </div>
              </div>
            )) : (
              <div style={{
                textAlign:  'center',
                padding:    '20px 0',
                color:      'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-body)',
                fontSize:   13,
              }}>
                Ningún paquete por vencer
              </div>
            )}
          </div>
          <VerMas onClick={() => showSection('usuarios')} />
        </div>
      </div>
    </>
  )
}
