import { useState, useMemo } from 'react'
import {
  LayoutDashboard, Users, UserCheck, CalendarDays,
  Package, BarChart2, DollarSign, RefreshCw,
} from 'lucide-react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
} from 'chart.js'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useClasesStore } from '@/stores/clasesStore'
import { mockTransacciones, ingresosUltimosMeses } from '@/data/mockTransacciones'
import { getDashboardMetrics } from '@/services/dashboardService'
import styles from '@/styles/dashboard.module.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip)

// ── Palette ─────────────────────────────────────────────────────────────────
const WINE  = '#7B1F2E'
const ROSE  = '#C26B7A'
const BLUSH = '#E8A4AD'

// ── Bar chart (ingresos) ─────────────────────────────────────────────────────
const barData = {
  labels: ingresosUltimosMeses.map((m) => m.mes),
  datasets: [{
    data: ingresosUltimosMeses.map((m) => m.monto),
    backgroundColor: ingresosUltimosMeses.map((_, i) =>
      i === ingresosUltimosMeses.length - 1 ? WINE : 'rgba(194,107,122,0.38)'
    ),
    hoverBackgroundColor: WINE,
    borderRadius: 6,
    borderSkipped: false,
  }],
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (ctx) => ` $${ctx.raw.toLocaleString()}` },
      backgroundColor: WINE,
      titleColor: '#F5EDE8',
      bodyColor: '#F5EDE8',
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#A08070', font: { family: 'DM Sans', size: 11 } },
    },
    y: { display: false, grid: { display: false } },
  },
}

// ── Donut chart (paquetes) ───────────────────────────────────────────────────
const donutData = {
  labels: ['Premium', 'Esencial', 'Básico'],
  datasets: [{
    data: [30, 45, 25],
    backgroundColor: [WINE, ROSE, BLUSH],
    borderWidth: 0,
    hoverOffset: 4,
  }],
}

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}%` },
      backgroundColor: WINE,
      titleColor: '#F5EDE8',
      bodyColor: '#F5EDE8',
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
    },
  },
}

// ── Static mock: paquetes por vencer ────────────────────────────────────────
const paquetesPorVencer = [
  { inicial: 'L', nombre: 'Lucía M.',  detalle: 'Vence en 2 días · 3 clases', tag: 'red',    label: 'Urgente' },
  { inicial: 'P', nombre: 'Paula G.',  detalle: 'Vence en 5 días · 1 clase',  tag: 'yellow', label: 'Pronto'  },
  { inicial: 'R', nombre: 'Regina H.', detalle: 'Vence en 7 días · 5 clases', tag: 'yellow', label: 'Pronto'  },
]

// ── Tag helper ───────────────────────────────────────────────────────────────
const TAG_MAP = {
  green:  styles.tagGreen,
  red:    styles.tagRed,
  yellow: styles.tagYellow,
  blue:   styles.tagBlue,
  pink:   styles.tagPink,
}

// ── Nav links (shared with other admin pages) ────────────────────────────────
export const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/paquetes',  icon: Package,         label: 'Paquetes'  },
  { to: '/admin/coaches',   icon: UserCheck,       label: 'Coaches'   },
  { to: '/admin/clases',    icon: CalendarDays,    label: 'Clases'    },
  { to: '/admin/usuarios',  icon: Users,           label: 'Usuarios'  },
  { to: '/admin/finanzas',  icon: DollarSign,      label: 'Finanzas'  },
  { to: '/admin/reportes',  icon: BarChart2,       label: 'Reportes'  },
]

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { clases } = useClasesStore()
  const [rango, setRango] = useState('mes')
  const metricas = useMemo(() => getDashboardMetrics(rango), [rango])

  const clasesHoy     = clases.slice(0, 3)
  const ultimasVentas = [...mockTransacciones].reverse().slice(0, 3)

  const today  = new Date()
  const dayNum = today.getDate()

  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>

        {/* ── Page header ── */}
        <div className={styles.pageHeader}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.greeting}>Panel de Administración</h1>
              <p className={styles.subtitle}>Resumen general del estudio</p>
            </div>
            <div className={styles.selectorRango}>
              {[
                { value: 'dia',    label: 'Hoy'    },
                { value: 'semana', label: 'Semana' },
                { value: 'mes',    label: 'Mes'    },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={rango === value ? styles.rangoActivo : styles.rango}
                  onClick={() => setRango(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI stat cards ── */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.kpiIcon}><DollarSign size={18} /></div>
            <div className={styles.statLabel}>Ingresos del período</div>
            <div className={styles.statValue}>${metricas.ingresosTotales.toLocaleString()}</div>
            <div className={`${styles.kpiChange} ${styles.kpiChangeUp}`}>↑ 12% vs período anterior</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.kpiIcon}><Package size={18} /></div>
            <div className={styles.statLabel}>Paquetes vendidos</div>
            <div className={styles.statValue}>{metricas.paquetesVendidos}</div>
            <div className={`${styles.kpiChange} ${styles.kpiChangeUp}`}>↑ 8% vs período anterior</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.kpiIcon}><Users size={18} /></div>
            <div className={styles.statLabel}>Clientes activos</div>
            <div className={styles.statValue}>{metricas.totalUsuarios}</div>
            <div className={`${styles.kpiChange} ${styles.kpiChangeUp}`}>↑ 8% vs mes anterior</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.kpiIcon}><RefreshCw size={18} /></div>
            <div className={styles.statLabel}>Ocupación promedio</div>
            <div className={styles.statValue}>{metricas.ocupacionPromedio}%</div>
            <div className={`${styles.kpiChange} ${metricas.ocupacionPromedio >= 70 ? styles.kpiChangeUp : styles.kpiChangeDown}`}>
              {metricas.ocupacionPromedio >= 70 ? '↑' : '↓'} vs meta 70%
            </div>
          </div>
        </div>

        {/* ── Charts row ── */}
        <div className={styles.dashGrid}>

          {/* Bar chart */}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>
              Ingresos últimos 6 meses
              <span className={styles.tagGreen}>↑ 15%</span>
            </div>
            <div className={styles.chartWrap}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Donut + top coaches */}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Distribución paquetes</div>
            <div className={styles.donutRow}>
              <div className={styles.donutChart}>
                <Doughnut data={donutData} options={donutOptions} />
              </div>
              <div className={styles.donutLegend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: WINE }} />
                  <span>Premium — 30%</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: ROSE }} />
                  <span>Esencial — 45%</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: BLUSH }} />
                  <span>Básico — 25%</span>
                </div>
              </div>
            </div>

            <div className={styles.panelTitle} style={{ marginTop: 'var(--space-md)' }}>
              Top coaches por ocupación
            </div>
            <div className={styles.miniList}>
              {[...clases]
                .sort((a, b) => b.cupoActual - a.cupoActual)
                .slice(0, 3)
                .map((c) => (
                  <div key={c.id} className={styles.miniItem}>
                    <div className={styles.miniAvatar}>{c.coachNombre?.[0] ?? '?'}</div>
                    <div>
                      <div className={styles.miniName}>{c.coachNombre}</div>
                      <div className={styles.miniSub}>{c.tipo} · {c.nombre}</div>
                    </div>
                    <div className={styles.miniRight}>
                      <div className={styles.miniVal}>{c.cupoActual}/{c.cupoMax}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* ── Three bottom widgets ── */}
        <div className={styles.threeGrid}>

          {/* Clases hoy */}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>
              Clases hoy
              <span className={styles.tagBlue}>{clasesHoy.length} clases</span>
            </div>
            <div className={styles.miniList}>
              {clasesHoy.length === 0 && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-lg)' }}>
                  Sin clases programadas hoy
                </p>
              )}
              {clasesHoy.map((c) => {
                const pct    = Math.round((c.cupoActual / c.cupoMax) * 100)
                const isFull = pct >= 100
                return (
                  <div key={c.id} className={styles.miniItem}>
                    <div className={styles.claseDay}>
                      <span>HOY</span>
                      <span className={styles.claseDayNum}>{dayNum}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.miniName}>{c.nombre}</div>
                      <div className={styles.miniSub}>{c.hora} · {c.coachNombre}</div>
                      <div className={styles.spotsBar} style={{ width: '100%', maxWidth: 80 }}>
                        <div className={styles.spotsFill} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <div className={styles.miniRight}>
                      <span className={isFull ? styles.tagRed : styles.tagGreen}>
                        {isFull ? 'Llena' : 'Abierta'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Últimas ventas */}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Últimas ventas</div>
            <div className={styles.miniList}>
              {ultimasVentas.map((t) => (
                <div key={t.id} className={styles.miniItem}>
                  <div className={styles.miniAvatar}>{t.clienteNombre?.[0] ?? '?'}</div>
                  <div>
                    <div className={styles.miniName}>{t.clienteNombre}</div>
                    <div className={styles.miniSub}>{t.paquete} · {t.fecha}</div>
                  </div>
                  <div className={styles.miniRight}>
                    <div className={styles.miniVal}>${t.monto.toLocaleString()}</div>
                    <span className={styles.tagGreen}>Pagado</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Paquetes por vencer */}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>
              Paquetes por vencer
              <span className={styles.tagYellow}>{paquetesPorVencer.length} usuarios</span>
            </div>
            <div className={styles.miniList}>
              {paquetesPorVencer.map((p, i) => (
                <div key={i} className={styles.miniItem}>
                  <div className={styles.miniAvatar}>{p.inicial}</div>
                  <div>
                    <div className={styles.miniName}>{p.nombre}</div>
                    <div className={styles.miniSub}>{p.detalle}</div>
                  </div>
                  <div className={styles.miniRight}>
                    <span className={TAG_MAP[p.tag]}>{p.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
