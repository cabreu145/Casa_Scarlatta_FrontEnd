import { useMemo } from 'react'
import { getDashboardMetrics } from '@/services/dashboardService'
import styles from '../AdminPanel.module.css'

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

export default function DashboardSection({ rangoDash, setRangoDash }) {
  const metricas = useMemo(() => getDashboardMetrics(rangoDash), [rangoDash])

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { value: 'dia',    label: 'Hoy'    },
          { value: 'semana', label: 'Semana' },
          { value: 'mes',    label: 'Mes'    },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setRangoDash(value)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              background: rangoDash === value
                ? 'var(--wine, #7B1E22)'
                : 'rgba(255,255,255,0.07)',
              color: rangoDash === value
                ? '#fff'
                : 'rgba(255,255,255,0.5)',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>👥</div>
          <div className={styles.kpiLabel}>Usuarios activos</div>
          <div className={styles.kpiValue}>{metricas.totalUsuarios}</div>
          <div className={`${styles.kpiChange} ${styles.up}`}>↑ 12% vs mes anterior</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>📦</div>
          <div className={styles.kpiLabel}>Paquetes vendidos</div>
          <div className={styles.kpiValue}>{metricas.paquetesVendidos}</div>
          <div className={`${styles.kpiChange} ${styles.up}`}>↑ 8% vs mes anterior</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>💰</div>
          <div className={styles.kpiLabel}>Ingresos del mes</div>
          <div className={styles.kpiValue}>${metricas.ingresosTotales.toLocaleString()}</div>
          <div className={`${styles.kpiChange} ${styles.up}`}>↑ 15% vs mes anterior</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>🔄</div>
          <div className={styles.kpiLabel}>Tasa renovación</div>
          <div className={styles.kpiValue}>{metricas.ocupacionPromedio}%</div>
          <div className={`${styles.kpiChange} ${styles.down}`}>↓ 3% vs mes anterior</div>
        </div>
      </div>

      <div className={styles.dashGrid}>
        {/* Bar chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Ingresos mensuales</div>
              <div className={styles.cardSub}>Últimos 8 meses</div>
            </div>
            <Tag color="green">↑ 15%</Tag>
          </div>
          <div className={styles.chartBars}>
            {[
              { h: '55%', label: 'Sep' },
              { h: '62%', label: 'Oct' },
              { h: '48%', label: 'Nov' },
              { h: '70%', label: 'Dic' },
              { h: '65%', label: 'Ene' },
              { h: '72%', label: 'Feb' },
              { h: '68%', label: 'Mar' },
              { h: '80%', label: 'Abr' },
            ].map(({ h, label }) => (
              <div key={label} className={styles.barWrap}>
                <div className={styles.bar} style={{ height: h }} />
                <div className={styles.barLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut + top coaches */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Distribución paquetes</div>
              <div className={styles.cardSub}>Mes actual</div>
            </div>
          </div>
          <div className={styles.donutWrap}>
            <div className={styles.donut} />
            <div className={styles.donutLegend}>
              <div className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: '#6B1F2A' }} />
                <span>Mensual — 45%</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: '#E8A4AD' }} />
                <span>Quincenal — 25%</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: 'rgba(255,255,255,0.15)' }} />
                <span>Por clase — 30%</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className={styles.cardSub} style={{ marginBottom: 10 }}>Top coaches por clases</div>
            <div className={styles.miniList}>
              {[
                { i: 'M', name: 'Mafer', sub: 'Stryde X · Flow', val: '24' },
                { i: 'D', name: 'Daya',  sub: 'Flow',           val: '19' },
                { i: 'C', name: 'Coste', sub: 'Stryde X',       val: '17' },
              ].map(({ i, name, sub, val }) => (
                <div key={name} className={styles.miniItem}>
                  <div className={styles.miniAvatar}>{i}</div>
                  <div><div className={styles.miniName}>{name}</div><div className={styles.miniSub}>{sub}</div></div>
                  <div className={styles.miniRight}><div className={styles.miniVal}>{val}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.fullGrid}>
        {/* Clases hoy */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Clases hoy</div>
            <Tag color="blue">4 clases</Tag>
          </div>
          <div className={styles.miniList}>
            {[
              { name: 'Stride Power',  meta: '7:00 AM · Mafer · 8/15 lugares',  tag: 'green', label: 'Abierta' },
              { name: 'Slow Flow',     meta: '9:00 AM · Majo · 15/15 lugares',  tag: 'red',   label: 'Llena'   },
              { name: 'Stride HIIT',   meta: '7:00 PM · Coste · 5/15 lugares',  tag: 'green', label: 'Abierta' },
            ].map(({ name, meta, tag, label }) => (
              <div key={name} className={styles.miniItem}>
                <div className={styles.claseDay}>
                  <span style={{ fontSize: 9 }}>HOY</span>
                  <span className={styles.dayNum}>25</span>
                </div>
                <div><div className={styles.miniName}>{name}</div><div className={styles.miniSub}>{meta}</div></div>
                <div className={styles.miniRight}><Tag color={tag}>{label}</Tag></div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas ventas */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Últimas ventas</div>
          </div>
          <div className={styles.miniList}>
            {[
              { i: 'S', name: 'Sofía R.',     sub: 'Paquete Mensual · hace 10 min', val: '$1,200', tag: 'green',  label: 'Pagado'   },
              { i: 'V', name: 'Valentina C.', sub: 'Agua + Smoothie · hace 25 min', val: '$120',   tag: 'green',  label: 'Pagado'   },
              { i: 'A', name: 'Ana T.',        sub: 'Paquete 10 clases · hace 1h',   val: '$850',   tag: 'yellow', label: 'Pendiente'},
            ].map(({ i, name, sub, val, tag, label }) => (
              <div key={name} className={styles.miniItem}>
                <div className={styles.miniAvatar}>{i}</div>
                <div><div className={styles.miniName}>{name}</div><div className={styles.miniSub}>{sub}</div></div>
                <div className={styles.miniRight}>
                  <div className={styles.miniVal}>{val}</div>
                  <Tag color={tag}>{label}</Tag>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paquetes por vencer */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Paquetes por vencer</div>
            <Tag color="yellow">8 usuarios</Tag>
          </div>
          <div className={styles.miniList}>
            {[
              { i: 'L', name: 'Lucía M.',  sub: 'Vence en 2 días · 3 clases restantes', tag: 'red',    label: 'Urgente' },
              { i: 'P', name: 'Paula G.',  sub: 'Vence en 5 días · 1 clase restante',   tag: 'yellow', label: 'Pronto'  },
              { i: 'R', name: 'Regina H.', sub: 'Vence en 7 días · 5 clases restantes', tag: 'yellow', label: 'Pronto'  },
            ].map(({ i, name, sub, tag, label }) => (
              <div key={name} className={styles.miniItem}>
                <div className={styles.miniAvatar}>{i}</div>
                <div><div className={styles.miniName}>{name}</div><div className={styles.miniSub}>{sub}</div></div>
                <div className={styles.miniRight}><Tag color={tag}>{label}</Tag></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
