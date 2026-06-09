import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import DateNavigator from '@/components/ui/DateNavigator'
import {
  useCoachesReportQuery,
  useFinanceReportQuery,
  useOccupancyByDisciplineReportQuery,
  usePackagesReportQuery,
  usePosReportQuery,
  useTopClassesReportQuery,
  useUsersReportQuery,
} from '@/hooks/useApiQueries'
import { abrirReportePDF } from '@/utils/reportePDF'
import { buildReportFilename, downloadCsvFromRows } from '@/utils/reportExport'
import styles from '@/styles/dashboard.module.css'

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

function buildReportRange(periodoReporte) {
  const today = formatMeridaDate(new Date())
  const weekStart = formatMeridaDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))
  const monthStart = `${today.slice(0, 7)}-01`

  if (periodoReporte?.tipo === 'hoy') return { from: today, to: today, label: 'Hoy' }
  if (periodoReporte?.tipo === 'semana') return { from: weekStart, to: today, label: '7 días' }
  if (periodoReporte?.tipo === 'mes') return { from: monthStart, to: today, label: 'Mes actual' }
  if (periodoReporte?.tipo === 'fecha' && periodoReporte.fecha) {
    return { from: periodoReporte.fecha, to: periodoReporte.fecha, label: 'Fecha' }
  }
  if (periodoReporte?.tipo === 'rango' && periodoReporte.fechaDesde && periodoReporte.fechaHasta) {
    return { from: periodoReporte.fechaDesde, to: periodoReporte.fechaHasta, label: 'Rango personalizado' }
  }
  return { from: monthStart, to: today, label: 'Mes actual' }
}

function SectionCard({ title, subtitle, children, footer }) {
  return (
    <div style={{
      background: 'var(--neutral-card)',
      border: '1px solid var(--neutral-border)',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 16,
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>
      </div>
      {children}
      {footer}
    </div>
  )
}

function MetricCard({ label, value, helper, accent = 'var(--text-primary)' }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${accent}33`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: accent, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>{helper}</div>
    </div>
  )
}

function ReportCard({ icono, titulo, descripcion, onCsv, onPdf }) {
  return (
    <div style={{
      background: 'var(--neutral-card)',
      border: '1px solid var(--neutral-border)',
      borderRadius: 12,
      padding: '20px 22px',
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
        {onCsv && (
          <button
            type="button"
            onClick={onCsv}
            style={btnStyle('#1a472a', '#22c55e')}
          >
            CSV
          </button>
        )}
        {onPdf && (
          <button
            type="button"
            onClick={onPdf}
            style={btnStyle('#2d1b1b', '#ef4444')}
          >
            PDF
          </button>
        )}
      </div>
    </div>
  )
}

function btnStyle(bg, color) {
  return {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${color}44`,
    background: bg,
    color,
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.15s',
  }
}

function lineItemsFromSummary(finance, rangeLabel) {
  const summary = finance?.summary ?? {}
  return [
    { Concepto: 'Ingresos totales', Monto: summary.salesTotalMxn ?? 0, Detalle: `Ventas ${summary.salesCount ?? 0}` },
    { Concepto: 'Gastos totales', Monto: -(summary.expensesTotalMxn ?? 0), Detalle: `Cortes ${summary.cashClosingsCount ?? 0}` },
    { Concepto: 'Utilidad neta', Monto: summary.netTotalMxn ?? 0, Detalle: `Rango ${rangeLabel}` },
    { Concepto: 'Ticket promedio', Monto: summary.averageTicketMxn ?? 0, Detalle: 'Promedio operativo' },
    { Concepto: 'Efectivo', Monto: summary.paymentMethods?.cashMxn ?? 0, Detalle: 'Método de pago' },
    { Concepto: 'Tarjeta', Monto: summary.paymentMethods?.cardMxn ?? 0, Detalle: 'Método de pago' },
    { Concepto: 'Transferencia', Monto: summary.paymentMethods?.transferMxn ?? 0, Detalle: 'Método de pago' },
    { Concepto: 'Otro', Monto: summary.paymentMethods?.otherMxn ?? 0, Detalle: 'Método de pago' },
  ]
}

function usersRowsFromReport(users) {
  return [
    { Indicador: 'Clientes activos', Valor: users.activeClients ?? 0, Detalle: `Inactivos ${users.inactiveClients ?? 0}` },
    { Indicador: 'Nuevos', Valor: users.newClients ?? 0, Detalle: `Con membresía ${users.clientsWithActiveMembership ?? 0}` },
    { Indicador: 'Sin membresía', Valor: users.clientsWithoutMembership ?? 0, Detalle: `Con créditos ${users.clientsWithCredits ?? 0}` },
    { Indicador: 'Sin créditos', Valor: users.clientsWithoutCredits ?? 0, Detalle: 'Clientes activos sin saldo' },
  ]
}

function packagesRowsFromReport(packagesReport) {
  const topPackage = packagesReport.topPackage
  const rows = [
    { Indicador: 'Paquetes vendidos', Valor: packagesReport.packagesSold ?? 0, Detalle: `Ingresos ${formatMoneyMx(packagesReport.packagesRevenueMxn)}` },
    { Indicador: 'Compartibles vendidos', Valor: packagesReport.shareablePackagesSold ?? 0, Detalle: `Beneficiarios ${packagesReport.beneficiariesAssigned ?? 0}` },
  ]
  if (topPackage) {
    rows.push({
      Indicador: 'Paquete más vendido',
      Valor: topPackage.name || topPackage.displayName || 'Sin nombre',
      Detalle: `${topPackage.soldCount ?? 0} ventas · ${formatMoneyMx(topPackage.revenueMxn)}`,
    })
  }
  return rows
}

function posRowsFromReport(pos) {
  return [
    { Concepto: 'Ventas POS', Monto: pos.salesCount ?? 0, Detalle: `Ticket prom. ${formatMoneyMx(pos.averageTicketMxn)}` },
    { Concepto: 'Productos vendidos', Monto: pos.productsSold ?? 0, Detalle: `Ingresos ${formatMoneyMx(pos.productRevenueMxn)}` },
    { Concepto: 'Paquetes vendidos', Monto: pos.packageRevenueMxn ?? 0, Detalle: 'Ingresos por membresías' },
    { Concepto: 'Efectivo', Monto: pos.paymentMethods?.cashMxn ?? 0, Detalle: `Tarjeta ${formatMoneyMx(pos.paymentMethods?.cardMxn)}` },
    ...(pos.productCategories ?? []).map((item) => ({
      Concepto: item.category,
      Monto: item.totalMxn ?? 0,
      Detalle: `${item.itemsSold ?? 0} vendidos`,
    })),
  ]
}

function coachesRowsFromReport(coaches) {
  return coaches.map((coach) => ({
    Coach: coach.name,
    Clases: coach.classesCount ?? 0,
    Reservas: coach.reservationsCount ?? 0,
    Asistencias: coach.attendanceCount ?? 0,
    'No shows': coach.noShowCount ?? 0,
    'Ocupación %': coach.averageOccupancyPct ?? 0,
    Disciplina: coach.primaryDiscipline || '—',
  }))
}

function topClassesRowsFromReport(topClasses) {
  return topClasses.map((item) => ({
    Clase: item.name,
    Disciplina: item.discipline || '—',
    Reservas: item.reservationsCount ?? 0,
    Capacidad: item.capacityTotal ?? 0,
    'Ocupación %': item.occupancyPct ?? 0,
    Ocurrencias: item.occurrencesCount ?? 0,
  }))
}

function occupancyRowsFromReport(occupancy) {
  return occupancy.map((item) => ({
    Disciplina: item.discipline || '—',
    Ocurrencias: item.occurrencesCount ?? 0,
    Reservas: item.reservationsCount ?? 0,
    Capacidad: item.capacityTotal ?? 0,
    'Ocupación %': item.occupancyPct ?? 0,
  }))
}

export default function ReportesApiSection({ inPanel = false }) {
  const [periodoReporte, setPeriodoReporte] = useState({ tipo: 'todos' })
  const [navKey, setNavKey] = useState(0)
  const { from, to, label } = useMemo(() => buildReportRange(periodoReporte), [periodoReporte])

  const financeQuery = useFinanceReportQuery({ from, to, enabled: true })
  const usersQuery = useUsersReportQuery({ from, to, enabled: true })
  const packagesQuery = usePackagesReportQuery({ from, to, enabled: true })
  const posQuery = usePosReportQuery({ from, to, enabled: true })
  const coachesQuery = useCoachesReportQuery({ from, to, enabled: true })
  const topClassesQuery = useTopClassesReportQuery({ from, to, limit: 5, enabled: true })
  const occupancyQuery = useOccupancyByDisciplineReportQuery({ from, to, enabled: true })

  const hasError = [financeQuery, usersQuery, packagesQuery, posQuery, coachesQuery, topClassesQuery, occupancyQuery]
    .some((query) => Boolean(query.error))
  const isLoading = [financeQuery, usersQuery, packagesQuery, posQuery, coachesQuery, topClassesQuery, occupancyQuery]
    .some((query) => query.isLoading && !query.data)

  const finance = financeQuery.data ?? {
    summary: {
      salesCount: 0,
      salesTotalMxn: 0,
      expensesTotalMxn: 0,
      netTotalMxn: 0,
      averageTicketMxn: 0,
      cashClosingsCount: 0,
      paymentMethods: { cashMxn: 0, cardMxn: 0, transferMxn: 0, otherMxn: 0 },
    },
  }
  const users = usersQuery.data ?? {
    activeClients: 0,
    inactiveClients: 0,
    newClients: 0,
    clientsWithActiveMembership: 0,
    clientsWithoutMembership: 0,
    clientsWithCredits: 0,
    clientsWithoutCredits: 0,
  }
  const packagesReport = packagesQuery.data ?? {
    packagesSold: 0,
    packagesRevenueMxn: 0,
    shareablePackagesSold: 0,
    beneficiariesAssigned: 0,
    topPackage: null,
  }
  const pos = posQuery.data ?? {
    salesCount: 0,
    averageTicketMxn: 0,
    productsSold: 0,
    productRevenueMxn: 0,
    packageRevenueMxn: 0,
    paymentMethods: { cashMxn: 0, cardMxn: 0, transferMxn: 0, otherMxn: 0 },
    productCategories: [],
  }
  const coaches = coachesQuery.data?.items ?? []
  const topClasses = topClassesQuery.data?.items ?? []
  const occupancy = occupancyQuery.data?.items ?? []

  const financeRows = useMemo(() => lineItemsFromSummary(finance, label), [finance, label])
  const usersRows = useMemo(() => usersRowsFromReport(users), [users])
  const packagesRows = useMemo(() => packagesRowsFromReport(packagesReport), [packagesReport])
  const posRows = useMemo(() => posRowsFromReport(pos), [pos])
  const coachesRows = useMemo(() => coachesRowsFromReport(coaches), [coaches])
  const topClassesRows = useMemo(() => topClassesRowsFromReport(topClasses), [topClasses])
  const occupancyRows = useMemo(() => occupancyRowsFromReport(occupancy), [occupancy])

  const exportCsv = (prefix, rows, headers) => {
    downloadCsvFromRows({
      rows,
      headers,
      filename: buildReportFilename(prefix, from, to, 'csv'),
      emptyMessage: 'No hay datos para exportar.',
    })
  }

  const exportPdf = (tipo, titulo, rows, landscape = false) => {
    if (!rows.length) {
      toast('PDF vacío generado con encabezados.', { icon: 'ℹ️' })
    }
    abrirReportePDF({
      tipo,
      titulo,
      datos: rows,
      periodo: `${formatDateMx(from)} a ${formatDateMx(to)}`,
      landscape,
    })
  }

  return (
    <div className={inPanel ? undefined : styles.page}>
      <DateNavigator
        key={navKey}
        modo="libre"
        darkMode={true}
        inicial="todos"
        onChange={(r) => setPeriodoReporte(r)}
      />

      {periodoReporte.tipo !== 'todos' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          marginTop: -8,
          padding: '8px 14px',
          background: 'rgba(123,31,46,0.1)',
          border: '1px solid rgba(123,31,46,0.25)',
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 14 }}>📋</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#E8A4AD' }}>
            Reportes en rango: <strong>{label}</strong>
          </span>
          <button
            type="button"
            onClick={() => { setPeriodoReporte({ tipo: 'todos' }); setNavKey((k) => k + 1) }}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              padding: '0 4px',
            }}
            title="Limpiar filtro"
          >
            ×
          </button>
        </div>
      )}

      {isLoading && (
        <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
          Cargando reportes...
        </div>
      )}

      {hasError && (
        <div style={{
          marginBottom: 16,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 8,
          padding: '10px 14px',
          color: '#fca5a5',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
        }}>
          No se pudieron cargar los reportes.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        <MetricCard label="Ingresos" value={formatMoneyMx(finance.summary.salesTotalMxn)} helper={`${finance.summary.salesCount} ventas`} accent="#22c55e" />
        <MetricCard label="Gastos" value={formatMoneyMx(finance.summary.expensesTotalMxn)} helper={`Cortes ${finance.summary.cashClosingsCount}`} accent="#ef4444" />
        <MetricCard label="Utilidad neta" value={formatMoneyMx(finance.summary.netTotalMxn)} helper={`Ticket prom. ${formatMoneyMx(finance.summary.averageTicketMxn)}`} accent={finance.summary.netTotalMxn >= 0 ? '#22c55e' : '#ef4444'} />
        <MetricCard label="Efectivo" value={formatMoneyMx(finance.summary.paymentMethods.cashMxn)} helper={`Tarjeta ${formatMoneyMx(finance.summary.paymentMethods.cardMxn)}`} accent="#3b82f6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
        <ReportCard
          icono="💰"
          titulo="Reporte financiero"
          descripcion="Ingresos, gastos, utilidad neta y métodos de pago."
          onCsv={() => exportCsv('reporte-financiero', financeRows, ['Concepto', 'Monto', 'Detalle'])}
          onPdf={() => exportPdf('financiero', 'Reporte Financiero operativo', financeRows)}
        />
        <ReportCard
          icono="👥"
          titulo="Reporte de usuarios"
          descripcion="Estado de clientes y membresías activas."
          onCsv={() => exportCsv('reporte-usuarios', usersRows, ['Indicador', 'Valor', 'Detalle'])}
          onPdf={() => exportPdf('usuarios', 'Reporte de Usuarios operativo', usersRows)}
        />
        <ReportCard
          icono="📦"
          titulo="Reporte de paquetes"
          descripcion="Ventas de membresías y paquetes compartibles."
          onCsv={() => exportCsv('reporte-paquetes', packagesRows, ['Indicador', 'Valor', 'Detalle'])}
          onPdf={() => exportPdf('paquetes', 'Reporte de Paquetes operativo', packagesRows)}
        />
        <ReportCard
          icono="🛒"
          titulo="Reporte POS"
          descripcion="Ventas operativas, productos y categorías."
          onCsv={() => exportCsv('reporte-pos', posRows, ['Concepto', 'Monto', 'Detalle'])}
          onPdf={() => exportPdf('pdv', 'Reporte POS operativo', posRows, true)}
        />
        <ReportCard
          icono="👩‍🏫"
          titulo="Reporte de coaches"
          descripcion="Clases, reservas, asistencia y ocupación."
          onCsv={() => exportCsv('reporte-coaches', coachesRows, ['Coach', 'Clases', 'Reservas', 'Asistencias', 'No shows', 'Ocupación %', 'Disciplina'])}
          onPdf={() => exportPdf('coaches', 'Reporte de Coaches operativo', coachesRows, true)}
        />
        <ReportCard
          icono="🏃"
          titulo="Top clases"
          descripcion="Clases más llenas por rango seleccionado."
          onCsv={() => exportCsv('reporte-top-clases', topClassesRows, ['Clase', 'Disciplina', 'Reservas', 'Capacidad', 'Ocupación %', 'Ocurrencias'])}
          onPdf={() => exportPdf('clases', 'Top Clases operativo', topClassesRows, true)}
        />
        <ReportCard
          icono="📈"
          titulo="Ocupación por disciplina"
          descripcion="Reservas, capacidad y ocupación por disciplina."
          onCsv={() => exportCsv('reporte-ocupacion', occupancyRows, ['Disciplina', 'Ocurrencias', 'Reservas', 'Capacidad', 'Ocupación %'])}
          onPdf={() => exportPdf('clases', 'Ocupación por disciplina', occupancyRows, true)}
        />
      </div>

      <SectionCard title="Reporte financiero" subtitle={`Rango ${formatDateMx(from)} a ${formatDateMx(to)}`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <MetricCard label="Ingresos totales" value={formatMoneyMx(finance.summary.salesTotalMxn)} helper="Ventas POS y paquetes" accent="#22c55e" />
          <MetricCard label="Gastos totales" value={formatMoneyMx(finance.summary.expensesTotalMxn)} helper="Gastos activos del rango" accent="#ef4444" />
          <MetricCard label="Utilidad neta" value={formatMoneyMx(finance.summary.netTotalMxn)} helper="Ingresos - gastos" accent={finance.summary.netTotalMxn >= 0 ? '#22c55e' : '#ef4444'} />
          <MetricCard label="Ticket promedio" value={formatMoneyMx(finance.summary.averageTicketMxn)} helper={`${finance.summary.salesCount} ventas`} accent="var(--text-primary)" />
        </div>
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
        <SectionCard title="Reporte de usuarios" subtitle="Estado de clientes">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <MetricCard label="Activos" value={String(users.activeClients)} helper={`Inactivos ${users.inactiveClients}`} accent="#22c55e" />
            <MetricCard label="Nuevos" value={String(users.newClients)} helper={`Con membresía ${users.clientsWithActiveMembership}`} accent="#3b82f6" />
            <MetricCard label="Sin membresía" value={String(users.clientsWithoutMembership)} helper={`Con créditos ${users.clientsWithCredits}`} accent="#eab308" />
            <MetricCard label="Sin créditos" value={String(users.clientsWithoutCredits)} helper="Clientes activos sin saldo" accent="#ef4444" />
          </div>
        </SectionCard>

        <SectionCard title="Reporte de paquetes" subtitle="Ventas y beneficiarios">
          {packagesReport.topPackage ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <MetricCard label="Paquetes vendidos" value={String(packagesReport.packagesSold)} helper={`Ingresos ${formatMoneyMx(packagesReport.packagesRevenueMxn)}`} accent="#22c55e" />
              <MetricCard label="Compartibles vendidos" value={String(packagesReport.shareablePackagesSold)} helper={`Beneficiarios ${packagesReport.beneficiariesAssigned}`} accent="#3b82f6" />
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(123,31,46,0.2)',
                borderRadius: 10,
                padding: '12px 14px',
              }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Paquete más vendido
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)' }}>
                  {packagesReport.topPackage.name || packagesReport.topPackage.displayName || 'Sin nombre'}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {packagesReport.topPackage.soldCount} ventas · {formatMoneyMx(packagesReport.topPackage.revenueMxn)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
              No hay paquete top para este rango.
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
        <SectionCard title="Reporte POS" subtitle="Ventas operativas">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <MetricCard label="Ventas POS" value={String(pos.salesCount)} helper={`Ticket prom. ${formatMoneyMx(pos.averageTicketMxn)}`} accent="#22c55e" />
            <MetricCard label="Productos vendidos" value={String(pos.productsSold)} helper={`Ingresos ${formatMoneyMx(pos.productRevenueMxn)}`} accent="#3b82f6" />
            <MetricCard label="Paquetes vendidos" value={formatMoneyMx(pos.packageRevenueMxn)} helper="Ingresos por membresías" accent="#eab308" />
            <MetricCard label="Efectivo" value={formatMoneyMx(pos.paymentMethods.cashMxn)} helper={`Tarjeta ${formatMoneyMx(pos.paymentMethods.cardMxn)}`} accent="#ef4444" />
          </div>
          <div style={{ marginTop: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
            Categorías vendidas:
            {pos.productCategories.length > 0 ? (
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                {pos.productCategories.map((item) => (
                  <li key={item.category}>
                    {item.category} · {item.itemsSold} · {formatMoneyMx(item.totalMxn)}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ marginTop: 6 }}>No hay datos para este rango.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Reporte de coaches" subtitle="Clases, reservas y asistencia">
          <div style={{ marginBottom: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
            Tabulador de pago pendiente de backend.
          </div>
          {coaches.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Coach', 'Clases', 'Reservas', 'Asist.', 'No show', 'Ocupación', 'Disciplina'].map((head) => (
                    <th key={head} style={{ textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', padding: '8px 10px', borderBottom: '1px solid var(--neutral-border)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coaches.map((coach) => (
                  <tr key={coach.coachId ?? coach.name} style={{ borderBottom: '1px solid var(--neutral-border)' }}>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-body)', fontSize: 13 }}>{coach.name}</td>
                    <td style={{ padding: '10px' }}>{coach.classesCount}</td>
                    <td style={{ padding: '10px' }}>{coach.reservationsCount}</td>
                    <td style={{ padding: '10px' }}>{coach.attendanceCount}</td>
                    <td style={{ padding: '10px' }}>{coach.noShowCount}</td>
                    <td style={{ padding: '10px' }}>{coach.averageOccupancyPct}%</td>
                    <td style={{ padding: '10px' }}>{coach.primaryDiscipline || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>No hay datos para este rango.</div>
          )}
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
        <SectionCard title="Top clases" subtitle="Clases más llenas">
          {topClasses.length > 0 ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {topClasses.map((item) => (
                <div key={item.classId ?? item.name} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-primary)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {item.discipline || '—'} · {item.reservationsCount}/{item.capacityTotal} · {item.occupancyPct}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>No hay datos para este rango.</div>
          )}
        </SectionCard>

        <SectionCard title="Ocupación por disciplina" subtitle="Reservas y capacidad">
          {occupancy.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {occupancy.map((item) => (
                <div key={item.discipline} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(123,31,46,0.2)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)' }}>{item.discipline}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{item.occupancyPct}%</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {item.occurrencesCount} ocurrencias · {item.reservationsCount} reservas · {item.capacityTotal} capacidad
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>No hay datos para este rango.</div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
