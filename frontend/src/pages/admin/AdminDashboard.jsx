import { LayoutDashboard, Users, CalendarDays, Package, BarChart2, DollarSign } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useClasesStore } from '@/stores/clasesStore'
import { mockUsers } from '@/data/mockUsers'
import { mockTransacciones, ingresosUltimosMeses } from '@/data/mockTransacciones'
import styles from '@/styles/dashboard.module.css'

export const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/admin/clases', icon: CalendarDays, label: 'Clases' },
  { to: '/admin/paquetes', icon: Package, label: 'Paquetes' },
  { to: '/admin/finanzas', icon: DollarSign, label: 'Finanzas' },
  { to: '/admin/reportes', icon: BarChart2, label: 'Reportes' },
]

const ingresoMax = Math.max(...ingresosUltimosMeses.map((m) => m.monto))

export default function AdminDashboard() {
  const { clases, reservas } = useClasesStore()
  const clientes = mockUsers.filter((u) => u.rol === 'cliente')
  const ingresosMes = mockTransacciones.reduce((acc, t) => acc + t.monto, 0)
  const ocupacionPromedio = clases.length
    ? Math.round(clases.reduce((acc, c) => acc + (c.cupoActual / c.cupoMax) * 100, 0) / clases.length)
    : 0

  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Panel de Administración</h1>
          <p className={styles.subtitle}>Resumen general del estudio</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Ingresos este mes</div>
            <div className={styles.statValue}>${ingresosMes.toLocaleString()}</div>
            <div className={styles.statSub}>+12% vs mes anterior</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Clases esta semana</div>
            <div className={styles.statValue}>{clases.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Clientes activos</div>
            <div className={styles.statValue}>{clientes.filter(c => c.activo).length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Ocupación promedio</div>
            <div className={styles.statValue}>{ocupacionPromedio}%</div>
          </div>
        </div>

        <div className={styles.panel} style={{ marginBottom: 'var(--space-lg)' }}>
          <div className={styles.panelTitle}>Ingresos últimos 6 meses</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, padding: '0 var(--space-sm)' }}>
            {ingresosUltimosMeses.map((m) => (
              <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>
                  ${Math.round(m.monto / 1000)}k
                </span>
                <div
                  style={{
                    width: '100%',
                    background: 'var(--brand-wine)',
                    borderRadius: '4px 4px 0 0',
                    height: `${Math.round((m.monto / ingresoMax) * 90)}px`,
                    opacity: m.mes === 'Abr' ? 1 : 0.55,
                    transition: 'height 0.4s ease',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {m.mes}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Últimas reservas</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reservas.slice(-5).reverse().map((r) => (
                <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-primary)' }}>{r.claseNombre}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{r.claseDia}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Clases más llenas</div>
            <div className={styles.barChart}>
              {[...clases]
                .sort((a, b) => b.cupoActual - a.cupoActual)
                .slice(0, 5)
                .map((c) => (
                  <div key={c.id} className={styles.barRow}>
                    <span className={styles.barLabel}>{c.nombre}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${Math.round((c.cupoActual / c.cupoMax) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.barValue}>{c.cupoActual}/{c.cupoMax}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
