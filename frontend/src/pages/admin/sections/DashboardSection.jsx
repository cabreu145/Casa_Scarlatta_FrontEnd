import { useState, useMemo } from 'react'
import { getDashboardMetrics, getIngresosPorMes, getDistribucionPaquetes,
         getClasesHoy, getUsuariosPorVencer, getUltimasVentas }
  from '@/services/dashboardService'
import { useTransaccionesStore } from '@/stores/transaccionesStore'
import { useUsuariosStore }      from '@/stores/usuariosStore'
import { useClasesStore }        from '@/stores/clasesStore'
import { usePaquetesStore }      from '@/stores/paquetesStore'
import { getClassDisplayTime } from '@/utils/classSchedule'
import {
  useFinanceCategoriesQuery,
  useFinanceDaySummaryQuery,
  useFinanceKpisQuery,
  useFinanceLowStockQuery,
  useFinanceRecentSalesQuery,
} from '@/hooks/useApiQueries'
import { exportFinanceCsv } from '@/services/financeApiService'
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
const useApiModeDefault = import.meta.env.VITE_USE_API_AUTH === 'true'

function formatMeridaDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Merida' }).format(date)
}

function formatMoneyMx(value) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function formatDateMx(value) {
  if (!value) return '—'
  const raw = String(value).trim()
  const date = raw.length === 10 ? new Date(`${raw}T12:00:00`) : new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTimeMx(value) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function paymentMethodLabel(method) {
  const key = String(method ?? '').trim().toLowerCase()
  return ({
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    other: 'Otro',
  })[key] ?? (method ? String(method) : '—')
}

function buildDashboardRange(rangoDash, fechaEspecifica) {
  const hoy = formatMeridaDate(new Date())
  const monthStart = `${hoy.slice(0, 7)}-01`
  const weekStart = formatMeridaDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))
  if (fechaEspecifica) {
    return { from: fechaEspecifica, to: fechaEspecifica, label: 'Fecha' }
  }
  if (rangoDash === 'dia') return { from: hoy, to: hoy, label: 'Hoy' }
  if (rangoDash === 'semana') return { from: weekStart, to: hoy, label: 'Semana' }
  return { from: monthStart, to: hoy, label: 'Mes' }
}

export default function DashboardSection({ rangoDash, setRangoDash, showSection, showSectionWithFilter }) {
  const [fechaEspecifica, setFechaEspecifica] = useState(null)
  const [exportingType, setExportingType] = useState(null)
  const [exportMessage, setExportMessage] = useState('')

  const useApiMode = useApiModeDefault
  const dashboardRange = useMemo(() => buildDashboardRange(rangoDash, fechaEspecifica), [rangoDash, fechaEspecifica])
  const financeKpisQuery = useFinanceKpisQuery({
    from: dashboardRange.from,
    to: dashboardRange.to,
    enabled: useApiMode,
  })
  const financeDayQuery = useFinanceDaySummaryQuery(dashboardRange.to, {
    enabled: useApiMode && dashboardRange.from === dashboardRange.to,
  })
  const financeCategoriesQuery = useFinanceCategoriesQuery({
    from: dashboardRange.from,
    to: dashboardRange.to,
    enabled: useApiMode,
  })
  const financeLowStockQuery = useFinanceLowStockQuery({
    threshold: 5,
    enabled: useApiMode,
  })
  const financeRecentSalesQuery = useFinanceRecentSalesQuery({
    limit: 10,
    enabled: useApiMode,
  })
  const exportTypes = [
    { type: 'summary', label: 'Exportar resumen' },
    { type: 'sales', label: 'Exportar ventas' },
    { type: 'expenses', label: 'Exportar gastos' },
    { type: 'cash_closings', label: 'Exportar cortes' },
  ]

  const handleExportFinanceCsv = async (type) => {
    if (!useApiMode) return
    setExportingType(type)
    setExportMessage('Preparando descarga...')
    try {
      await exportFinanceCsv({
        from: dashboardRange.from,
        to: dashboardRange.to,
        type,
      })
      setExportMessage('Archivo CSV descargado.')
    } catch (error) {
      setExportMessage(error?.status === 401 || error?.status === 403
        ? 'Sin permisos para exportar.'
        : 'No se pudo exportar el archivo. Intenta nuevamente.')
    } finally {
      setExportingType(null)
    }
  }

  if (useApiMode) {
    const kpis = financeKpisQuery.data ?? {
      sales: { count: 0, subtotalMxn: 0, taxMxn: 0, totalMxn: 0 },
      expenses: { count: 0, totalMxn: 0 },
      net: { totalMxn: 0 },
      paymentMethods: { cashMxn: 0, cardMxn: 0, transferMxn: 0, otherMxn: 0 },
      cashClosing: { isClosed: false, lastClosingDate: null, todayClosingId: null },
      operations: { productsSold: 0, packagesSold: 0, activeClients: 0, reservationsCount: 0 },
    }
    const categories = financeCategoriesQuery.data ?? { expenseCategories: [], productCategories: [] }
    const lowStock = financeLowStockQuery.data ?? []
    const recentSales = financeRecentSalesQuery.data ?? []
    const recentExpenses = financeDayQuery.data?.recentExpenses ?? []
    const isLoading = financeKpisQuery.isLoading && !financeKpisQuery.data
    const errorMessage = financeKpisQuery.error ? 'No se pudieron cargar los KPIs financieros.' : ''
    const title = dashboardRange.label === 'Hoy'
      ? 'Hoy'
      : dashboardRange.label === 'Semana'
        ? 'Esta semana'
        : dashboardRange.label === 'Fecha'
          ? 'Fecha personalizada'
          : 'Este mes'
    const subtitle = dashboardRange.label === 'Fecha'
      ? formatDateMx(dashboardRange.from)
      : dashboardRange.label === 'Semana'
        ? `${formatDateMx(dashboardRange.from)} - ${formatDateMx(dashboardRange.to)}`
        : dashboardRange.label === 'Hoy'
          ? formatDateMx(dashboardRange.to)
          : `Del ${formatDateMx(dashboardRange.from)} al ${formatDateMx(dashboardRange.to)}`

    const financeCards = [
      { icono: '💰', label: 'Ventas', valor: formatMoneyMx(kpis.sales.totalMxn), cambio: `${kpis.sales.count} ventas`, up: true },
      { icono: '🧾', label: 'Gastos', valor: formatMoneyMx(kpis.expenses.totalMxn), cambio: `${kpis.expenses.count} gastos`, up: false },
      { icono: '📈', label: 'Neto', valor: formatMoneyMx(kpis.net.totalMxn), cambio: 'Ventas − gastos', up: kpis.net.totalMxn >= 0 },
      { icono: '🧾', label: 'Corte', valor: kpis.cashClosing.isClosed ? 'Cerrado' : 'Abierto', cambio: kpis.cashClosing.lastClosingDate ? `Último ${formatDateMx(kpis.cashClosing.lastClosingDate)}` : 'Sin corte previo', up: kpis.cashClosing.isClosed },
      { icono: '🛒', label: 'Productos vendidos', valor: String(kpis.operations.productsSold), cambio: 'Unidades', up: true },
      { icono: '🎟️', label: 'Paquetes vendidos', valor: String(kpis.operations.packagesSold), cambio: 'Ventas de membresía', up: true },
      { icono: '👥', label: 'Clientes activos', valor: String(kpis.operations.activeClients), cambio: 'Clientes con acceso', up: true },
      { icono: '📅', label: 'Reservas', valor: String(kpis.operations.reservationsCount), cambio: 'Reservas del rango', up: true },
    ]

    return (
      <>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 24,
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontStyle: 'italic',
              fontWeight: 400,
              color: '#fff',
              lineHeight: 1.1,
              marginBottom: 4,
            }}>
              {title}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'rgba(255,255,255,0.4)',
            }}>
              {subtitle}
            </div>
          </div>
          <DateNavigator
            modo="libre"
            darkMode={true}
            hideFecha={true}
            inicial="mes"
            onChange={(rango) => {
              const mapa = { hoy: 'dia', semana: 'semana', mes: 'mes', todos: 'todos', fecha: 'fecha' }
              setRangoDash(mapa[rango.tipo] ?? 'dia')
              setFechaEspecifica(rango.fecha ?? null)
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {exportTypes.map((item) => (
              <button
                key={item.type}
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => handleExportFinanceCsv(item.type)}
                disabled={exportingType === item.type}
              >
                {exportingType === item.type ? 'Preparando...' : item.label}
              </button>
            ))}
          </div>
        </div>

        {exportMessage && (
          <div className={styles.card} style={{ marginBottom: 16, color: 'rgba(255,255,255,0.75)' }}>
            {exportMessage}
          </div>
        )}
        {errorMessage && (
          <div className={styles.card} style={{ marginBottom: 16, color: '#FCA5A5' }}>
            {errorMessage}
          </div>
        )}
        {isLoading && (
          <div className={styles.card} style={{ marginBottom: 16, color: 'rgba(255,255,255,0.55)' }}>
            Cargando KPIs financieros...
          </div>
        )}

        <div className={styles.kpiGrid} style={{ marginBottom: 20 }}>
          {financeCards.map((card) => (
            <KpiCard
              key={card.label}
              icono={card.icono}
              label={card.label}
              valor={card.valor}
              cambio={card.cambio}
              up={card.up}
            />
          ))}
        </div>

        <div className={styles.dashGrid} style={{ marginBottom: 20 }}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Métodos de pago</div>
                <div className={styles.cardSub}>Ventas del rango seleccionado</div>
              </div>
            </div>
            <div className={styles.miniList}>
              {[
                ['Efectivo', kpis.paymentMethods.cashMxn],
                ['Tarjeta', kpis.paymentMethods.cardMxn],
                ['Transferencia', kpis.paymentMethods.transferMxn],
                ['Otro', kpis.paymentMethods.otherMxn],
              ].map(([label, amount]) => (
                <div key={label} className={styles.miniItem}>
                  <div className={styles.miniAvatar}>{label.charAt(0)}</div>
                  <div>
                    <div className={styles.miniName}>{label}</div>
                    <div className={styles.miniSub}>{formatMoneyMx(amount)}</div>
                  </div>
                  <div className={styles.miniRight}>
                    <div className={styles.miniVal}>{formatMoneyMx(amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Categorías</div>
                <div className={styles.cardSub}>Gastos y productos del rango</div>
              </div>
            </div>
            <div className={styles.miniList}>
              {categories.expenseCategories.length > 0 ? categories.expenseCategories.map((item) => (
                <div key={`expense-${item.category}`} className={styles.miniItem}>
                  <div className={styles.miniAvatar}>🧾</div>
                  <div>
                    <div className={styles.miniName}>{item.category}</div>
                    <div className={styles.miniSub}>{item.count} gasto{item.count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className={styles.miniRight}>
                    <div className={styles.miniVal}>{formatMoneyMx(item.totalMxn)}</div>
                  </div>
                </div>
              )) : (
                <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  Sin categorías de gastos.
                </div>
              )}
              {categories.productCategories.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                  Productos
                </div>
              )}
              {categories.productCategories.map((item) => (
                <div key={`product-${item.category}`} className={styles.miniItem}>
                  <div className={styles.miniAvatar}>🛍️</div>
                  <div>
                    <div className={styles.miniName}>{item.category}</div>
                    <div className={styles.miniSub}>{item.itemsSold} vendido{item.itemsSold !== 1 ? 's' : ''}</div>
                  </div>
                  <div className={styles.miniRight}>
                    <div className={styles.miniVal}>{formatMoneyMx(item.totalMxn)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.fullGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Ventas recientes</div>
            </div>
            <div className={styles.miniList}>
              {recentSales.length > 0 ? recentSales.map((sale) => (
                <div key={sale.id ?? sale.folio} className={styles.miniItem}>
                  <div className={styles.miniAvatar}>{(sale.customerName || sale.customerEmail || 'V').charAt(0).toUpperCase()}</div>
                  <div>
                    <div className={styles.miniName}>{sale.customerName || sale.customerEmail || 'Venta mostrador'}</div>
                    <div className={styles.miniSub}>{sale.folio} · {paymentMethodLabel(sale.paymentMethod)} · {formatDateTimeMx(sale.createdAt)}</div>
                  </div>
                  <div className={styles.miniRight}>
                    <div className={styles.miniVal}>{formatMoneyMx(sale.totalMxn)}</div>
                    <Tag color="green">Pagado</Tag>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  Sin ventas registradas
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Stock bajo</div>
            </div>
            <div className={styles.miniList}>
              {lowStock.length > 0 ? lowStock.map((item) => (
                <div key={item.id ?? `${item.productName}-${item.category}`} className={styles.miniItem}>
                  <div className={styles.miniAvatar}>⚠️</div>
                  <div>
                    <div className={styles.miniName}>{item.productName}</div>
                    <div className={styles.miniSub}>{item.category} · stock {item.stock}</div>
                  </div>
                  <div className={styles.miniRight}>
                    <Tag color={item.stock <= 2 ? 'red' : 'yellow'}>{item.stock} disp.</Tag>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  No hay productos con stock bajo.
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Gastos recientes</div>
            </div>
            <div className={styles.miniList}>
              {(recentExpenses ?? []).length > 0 ? recentExpenses.map((expense) => (
                <div key={expense.id ?? expense.description} className={styles.miniItem}>
                  <div className={styles.miniAvatar}>🧾</div>
                  <div>
                    <div className={styles.miniName}>{expense.description || expense.category}</div>
                    <div className={styles.miniSub}>{expense.category} · {paymentMethodLabel(expense.paymentMethod)} · {formatDateTimeMx(expense.createdAt)}</div>
                  </div>
                  <div className={styles.miniRight}>
                    <div className={styles.miniVal}>{formatMoneyMx(expense.amountMxn)}</div>
                    <Tag color="red">Activo</Tag>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  Sin gastos recientes.
                </div>
              )}
            </div>
            <VerMas onClick={() => showSection('gastos')} />
          </div>
        </div>
      </>
    )
  }

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
          hideFecha={true}
          inicial="mes"
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
        />
        <KpiCard
          icono="🔄" label="Ocupación promedio"
          valor={`${metricas.ocupacionPromedio}%`}
          cambio="3% vs mes anterior" up={false}
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
              const pct   = maxIngreso > 0
                ? Math.max(8, Math.round((m.ingresos / maxIngreso) * 100))
                : 8
              const ratio = maxIngreso > 0 ? m.ingresos / maxIngreso : 0
              const colorBarra = ratio >= 0.75 ? '#22C55E'
                : ratio >= 0.40               ? '#3B82F6'
                : m.ingresos === 0            ? '#3C2A2E'
                :                               '#EF4444'
              return (
                <BarraConTooltip
                  key={m.mes}
                  h={`${pct}%`}
                  label={m.label}
                  ingresos={m.ingresos}
                  color={colorBarra}
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
                      {getClassDisplayTime(c)} · {c.coachNombre} · {c.cupoActual}/{c.cupoMax}
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
          <VerMas onClick={() => {
            showSection('finanzas')
            setTimeout(() => {
              const el = document.querySelector('[data-section="transacciones"]')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 150)
          }} />
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
          <VerMas onClick={() => showSectionWithFilter('usuarios', 'usersFilter', 'Por vencer')} />
        </div>
      </div>
    </>
  )
}
