import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { mockUsers } from '@/data/mockUsers'
import { mockTransacciones, ingresosUltimosMeses } from '@/data/mockTransacciones'
import { useClasesStore } from '@/stores/clasesStore'
import styles from '@/styles/dashboard.module.css'

// Mock data for reports
const ingresosPorPaquete = [
  { nombre: 'Premium', monto: 7996, porcentaje: 52 },
  { nombre: 'Esencial', monto: 5996, porcentaje: 39 },
  { nombre: 'Básico', monto: 1998, porcentaje: 13 },
]

const horariosPico = [
  { turno: 'Mañana (6–11h)', clases: 18, porcentaje: 55 },
  { turno: 'Tarde (12–17h)', clases: 9, porcentaje: 27 },
  { turno: 'Noche (18–22h)', clases: 6, porcentaje: 18 },
]

const retencionData = {
  renovaron: 38,
  noRenovaron: 14,
  total: 52,
}

const distribucionPaquetes = [
  { paquete: 'Premium', cantidad: 18, porcentaje: 35 },
  { paquete: 'Esencial', cantidad: 22, porcentaje: 42 },
  { paquete: 'Básico', cantidad: 12, porcentaje: 23 },
]

const ingresoMax = Math.max(...ingresosUltimosMeses.map((m) => m.monto))

function BarRow({ label, pct, value, color }) {
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${pct}%`, background: color || 'var(--brand-wine)' }} />
      </div>
      <span className={styles.barValue}>{value}</span>
    </div>
  )
}

export default function AdminReportes() {
  const { clases } = useClasesStore()
  const clientes = mockUsers.filter((u) => u.rol === 'cliente')
  const clientesActivos = clientes.filter((u) => u.activo)
  const nuevosEsteMes = clientes.filter((u) => u.fechaRegistro >= '2026-04-01')

  const strideClases = clases.filter((c) => c.tipo === 'Stride')
  const slowClases = clases.filter((c) => c.tipo === 'Slow')
  const ocupStrideAvg = strideClases.length
    ? Math.round(strideClases.reduce((a, c) => a + (c.cupoActual / c.cupoMax) * 100, 0) / strideClases.length)
    : 0
  const ocupSlowAvg = slowClases.length
    ? Math.round(slowClases.reduce((a, c) => a + (c.cupoActual / c.cupoMax) * 100, 0) / slowClases.length)
    : 0

  const top5 = [...clases]
    .sort((a, b) => b.cupoActual - a.cupoActual)
    .slice(0, 5)
    .map((c) => ({
      nombre: c.nombre,
      reservas: c.cupoActual,
      tipo: c.tipo,
      porcentaje: Math.round((c.cupoActual / c.cupoMax) * 100),
    }))

  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Reportes</h1>
          <p className={styles.subtitle}>Métricas de negocio — Abril 2026</p>
        </div>

        {/* ── Sección 1: Ingresos ── */}
        <SectionTitle>1. Ingresos</SectionTitle>
        <div className={styles.contentGrid} style={{ marginBottom: 'var(--space-lg)' }}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Ingresos últimos 6 meses</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 110 }}>
              {ingresosUltimosMeses.map((m, i) => (
                <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>
                    ${Math.round(m.monto / 1000)}k
                  </span>
                  <div style={{
                    width: '100%',
                    background: 'var(--brand-wine)',
                    borderRadius: '4px 4px 0 0',
                    height: `${Math.round((m.monto / ingresoMax) * 80)}px`,
                    opacity: i === ingresosUltimosMeses.length - 1 ? 1 : 0.45 + (i * 0.1),
                  }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>{m.mes}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Ingresos por tipo de paquete</div>
            <div className={styles.barChart}>
              {ingresosPorPaquete.map((p) => (
                <BarRow
                  key={p.nombre}
                  label={p.nombre}
                  pct={p.porcentaje}
                  value={`$${p.monto.toLocaleString()}`}
                  color={p.nombre === 'Premium' ? 'var(--brand-wine)' : p.nombre === 'Esencial' ? 'var(--brand-rose)' : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Sección 2: Clases ── */}
        <SectionTitle>2. Clases</SectionTitle>
        <div className={styles.contentGrid} style={{ marginBottom: 'var(--space-lg)' }}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Top 5 clases más reservadas</div>
            <div className={styles.barChart}>
              {top5.map((c) => (
                <BarRow
                  key={c.nombre}
                  label={c.nombre}
                  pct={c.porcentaje}
                  value={`${c.reservas}`}
                  color={c.tipo === 'Slow' ? 'var(--brand-rose)' : undefined}
                />
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Horarios pico</div>
            <div className={styles.barChart} style={{ marginBottom: 'var(--space-xl)' }}>
              {horariosPico.map((h) => (
                <BarRow key={h.turno} label={h.turno} pct={h.porcentaje} value={`${h.clases} clases`} />
              ))}
            </div>
            <div className={styles.panelTitle}>Ocupación promedio por sala</div>
            <div className={styles.barChart}>
              <BarRow label="Stride" pct={ocupStrideAvg} value={`${ocupStrideAvg}%`} />
              <BarRow label="Slow" pct={ocupSlowAvg} value={`${ocupSlowAvg}%`} color="var(--brand-rose)" />
            </div>
          </div>
        </div>

        {/* ── Sección 3: Clientes ── */}
        <SectionTitle>3. Clientes</SectionTitle>
        <div className={styles.contentGrid} style={{ marginBottom: 'var(--space-lg)' }}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Activos vs inactivos</div>
            <div style={{ display: 'flex', gap: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
              <Metric label="Activos" value={clientesActivos.length} color="#228B22" />
              <Metric label="Inactivos" value={clientes.length - clientesActivos.length} color="#C83232" />
              <Metric label="Nuevos este mes" value={nuevosEsteMes.length} color="var(--brand-wine)" />
            </div>
            <div className={styles.barChart}>
              <BarRow
                label="Activos"
                pct={Math.round((clientesActivos.length / clientes.length) * 100)}
                value={`${clientesActivos.length}`}
                color="#228B22"
              />
              <BarRow
                label="Inactivos"
                pct={Math.round(((clientes.length - clientesActivos.length) / clientes.length) * 100)}
                value={`${clientes.length - clientesActivos.length}`}
                color="#C83232"
              />
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Retención de paquetes</div>
            <div style={{ display: 'flex', gap: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
              <Metric label="Renovaron" value={retencionData.renovaron} color="#228B22" />
              <Metric label="No renovaron" value={retencionData.noRenovaron} color="#C83232" />
            </div>
            <div className={styles.barChart}>
              <BarRow
                label="Renovaron"
                pct={Math.round((retencionData.renovaron / retencionData.total) * 100)}
                value={`${Math.round((retencionData.renovaron / retencionData.total) * 100)}%`}
                color="#228B22"
              />
              <BarRow
                label="No renovaron"
                pct={Math.round((retencionData.noRenovaron / retencionData.total) * 100)}
                value={`${Math.round((retencionData.noRenovaron / retencionData.total) * 100)}%`}
                color="#C83232"
              />
            </div>
          </div>
        </div>

        {/* ── Sección 4: Paquetes ── */}
        <SectionTitle>4. Paquetes</SectionTitle>
        <div className={styles.contentGrid}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Distribución por paquete</div>
            <div className={styles.barChart}>
              {distribucionPaquetes.map((p) => (
                <BarRow
                  key={p.paquete}
                  label={p.paquete}
                  pct={p.porcentaje}
                  value={`${p.cantidad} clientes`}
                  color={p.paquete === 'Premium' ? 'var(--brand-wine)' : p.paquete === 'Esencial' ? 'var(--brand-rose)' : undefined}
                />
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Individual vs Compartido</div>
            <div style={{ display: 'flex', gap: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
              <Metric label="Individual" value={44} />
              <Metric label="Compartido" value={8} color="var(--brand-rose)" />
            </div>
            <div className={styles.barChart}>
              <BarRow label="Individual" pct={85} value="44 clientes" />
              <BarRow label="Compartido" pct={15} value="8 clientes" color="var(--brand-rose)" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-heading)',
      fontSize: 18,
      color: 'var(--brand-wine)',
      margin: '0 0 var(--space-lg)',
      paddingBottom: 'var(--space-sm)',
      borderBottom: '1px solid var(--neutral-border)',
    }}>
      {children}
    </h2>
  )
}

function Metric({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: color || 'var(--brand-wine)', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  )
}
