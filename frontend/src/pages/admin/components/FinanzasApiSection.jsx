import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import DateNavigator from '@/components/ui/DateNavigator'
import {
  useCashClosingDetailQuery,
  useCashClosingsQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useExecuteCashClosingMutation,
  useExpensesQuery,
  useFinanceCategoriesQuery,
  useFinanceDaySummaryQuery,
  useFinanceHistoricalQuery,
  useFinanceKpisQuery,
  useFinanceRecentSalesQuery,
  useTodayCashClosingQuery,
} from '@/hooks/useApiQueries'
import { exportFinanceCsv } from '@/services/financeApiService'
import { abrirReportePDF } from '@/utils/reportePDF'
import { formatBusinessDateTime } from '@/utils/formatters'
import styles from '@/styles/dashboard.module.css'

const METODO_LABELS = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  other: 'Otro',
}

const METODO_ICONS = {
  cash: '💵',
  card: '💳',
  transfer: '📱',
  other: '🧾',
}

const DEFAULT_KPIS = {
  sales: { count: 0, subtotalMxn: 0, taxMxn: 0, totalMxn: 0 },
  expenses: { count: 0, totalMxn: 0 },
  net: { totalMxn: 0 },
  paymentMethods: { cashMxn: 0, cardMxn: 0, transferMxn: 0, otherMxn: 0 },
  cashClosing: { isClosed: false, lastClosingDate: null, todayClosingId: null },
  operations: { productsSold: 0, packagesSold: 0, activeClients: 0, reservationsCount: 0 },
}

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
  return formatBusinessDateTime(value)
}

function paymentMethodLabel(method) {
  const key = String(method ?? '').trim().toLowerCase()
  return METODO_LABELS[key] ?? (method ? String(method) : '—')
}

function getRangeLabel(rango, fechaEspecifica, fechaDesde, fechaHasta) {
  if (rango === 'fecha' && fechaEspecifica) return formatDateMx(fechaEspecifica)
  if (rango === 'rango' && fechaDesde && fechaHasta) {
    return `${formatDateMx(fechaDesde)} - ${formatDateMx(fechaHasta)}`
  }
  if (rango === 'semana') return 'Esta semana'
  if (rango === 'dia') return 'Hoy'
  if (rango === 'todos') return 'Todo'
  return 'Este mes'
}

function buildRange(rango, fechaEspecifica, fechaDesde, fechaHasta) {
  const hoy = formatMeridaDate(new Date())
  const monthStart = `${hoy.slice(0, 7)}-01`
  const weekStart = formatMeridaDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))

  if (rango === 'fecha' && fechaEspecifica) {
    return { from: fechaEspecifica, to: fechaEspecifica, label: 'Fecha' }
  }
  if (rango === 'rango' && fechaDesde && fechaHasta) {
    return { from: fechaDesde, to: fechaHasta, label: 'Rango' }
  }
  if (rango === 'dia') return { from: hoy, to: hoy, label: 'Hoy' }
  if (rango === 'semana') return { from: weekStart, to: hoy, label: 'Semana' }
  return { from: monthStart, to: hoy, label: 'Mes' }
}

function exportarExcelLocal(rows, filename, sheetName) {
  if (!rows.length) {
    toast.error('Sin datos para exportar')
    return
  }
  const header = Object.keys(rows[0])
  const ws = XLSX.utils.json_to_sheet(rows, { header })
  ws['!cols'] = header.map((col) => ({
    wch: Math.min(Math.max(col.length, ...rows.map((row) => String(row[col] ?? '').length)) + 2, 40),
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
  toast.success('Excel exportado')
}

function Badge({ color = 'green', children }) {
  const cls = {
    green: styles.tagGreen,
    red: styles.tagRed,
    yellow: styles.tagYellow,
    blue: styles.tagBlue,
    pink: styles.tagPink,
  }[color] || styles.tagGreen
  return <span className={cls}>{children}</span>
}

function KpiCard({ label, valor, sub, icono, color = 'var(--text-primary)', active = false, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--neutral-card)',
        border: `1px solid ${active ? '#7B1E22' : 'var(--neutral-border)'}`,
        borderRadius: 12,
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          {label}
        </div>
        <div className={styles.kpiIcon}>{icono}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: color || 'var(--text-primary)', lineHeight: 1, marginBottom: 8 }}>
        {valor}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}

function PanelTitle({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{title}</div>
        {sub ? <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div> : null}
      </div>
      {right}
    </div>
  )
}

function EmptyState({ children }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '20px 0',
      color: 'rgba(255,255,255,0.35)',
      fontFamily: 'var(--font-body)',
      fontSize: 13,
    }}>
      {children}
    </div>
  )
}

function formatCutHistoryItem(item = {}) {
  return {
    id: item.id ?? item.cashClosingId ?? null,
    date: item.date ?? null,
    isClosed: Boolean(item.isClosed),
    salesCount: Number(item.salesCount ?? 0),
    subtotalMxn: Number(item.subtotalMxn ?? 0),
    taxMxn: Number(item.taxMxn ?? 0),
    totalMxn: Number(item.totalMxn ?? 0),
    cashTotalMxn: Number(item.cashTotalMxn ?? 0),
    cardTotalMxn: Number(item.cardTotalMxn ?? 0),
    transferTotalMxn: Number(item.transferTotalMxn ?? 0),
    otherTotalMxn: Number(item.otherTotalMxn ?? 0),
    expensesTotalMxn: Number(item.expensesTotalMxn ?? 0),
    netTotalMxn: Number(item.netTotalMxn ?? 0),
    notes: item.notes ?? '',
    createdAt: item.createdAt ?? null,
  }
}

function resolveHistoricalGroupBy(rango) {
  if (rango === 'dia') return 'day'
  if (rango === 'semana') return 'day'
  if (rango === 'mes') return 'week'
  return 'day'
}

function formatHistoricalItem(item = {}) {
  return {
    label: item.label ?? '—',
    salesCount: Number(item.salesCount ?? 0),
    salesTotalMxn: Number(item.salesTotalMxn ?? 0),
    expensesTotalMxn: Number(item.expensesTotalMxn ?? 0),
    netTotalMxn: Number(item.netTotalMxn ?? 0),
    averageTicketMxn: Number(item.averageTicketMxn ?? 0),
    cashMxn: Number(item.cashMxn ?? 0),
    cardMxn: Number(item.cardMxn ?? 0),
    transferMxn: Number(item.transferMxn ?? 0),
    otherMxn: Number(item.otherMxn ?? 0),
  }
}

function buildTransactionRows({ sales = [], expenses = [] }) {
  const salesRows = sales.map((sale) => ({
    id: `sale-${sale.id ?? sale.folio}`,
    fecha: sale.createdAt,
    concepto: sale.customerName || sale.customerEmail || 'Venta mostrador',
    tipo: 'venta',
    metodoPago: sale.paymentMethod,
    monto: Number(sale.totalMxn ?? 0),
  }))

  const expenseRows = expenses.map((expense) => ({
    id: `expense-${expense.id ?? expense.expenseId}`,
    fecha: expense.createdAt ?? expense.expenseDate ?? null,
    concepto: expense.description || expense.category,
    tipo: 'gasto',
    metodoPago: expense.paymentMethod,
    monto: -Math.abs(Number(expense.amountMxn ?? expense.amount ?? 0)),
  }))

  return [...salesRows, ...expenseRows].sort((a, b) => {
    const at = new Date(a.fecha ?? 0).getTime()
    const bt = new Date(b.fecha ?? 0).getTime()
    return bt - at
  })
}

function formatTxExport(rows = []) {
  return rows.map((row) => ({
    Fecha: formatDateTimeMx(row.fecha),
    Concepto: row.concepto,
    Tipo: row.tipo,
    Metodo: paymentMethodLabel(row.metodoPago),
    Monto: row.monto,
  }))
}

function formatCutExport(rows = []) {
  return rows.map((row) => ({
    Fecha: formatDateMx(row.date),
    Estado: row.isClosed ? 'Cerrado' : 'Abierto',
    Ventas: row.salesCount,
    Subtotal: row.subtotalMxn,
    IVA: row.taxMxn,
    'Total ingresos': row.totalMxn,
    Efectivo: row.cashTotalMxn,
    Tarjeta: row.cardTotalMxn,
    Transferencia: row.transferTotalMxn,
    Otros: row.otherTotalMxn,
    Gastos: -Math.abs(row.expensesTotalMxn),
    Neto: row.netTotalMxn,
  }))
}

export default function FinanzasApiSection({ inPanel = false }) {
  const [rango, setRango] = useState('dia')
  const [fechaEspecifica, setFechaEspecifica] = useState(null)
  const [fechaDesde, setFechaDesde] = useState(null)
  const [fechaHasta, setFechaHasta] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroActivo, setFiltroActivo] = useState(null)
  const [txExpandidas, setTxExpandidas] = useState(false)
  const [filtroCortes, setFiltroCortes] = useState('todo')
  const [modalGasto, setModalGasto] = useState(false)
  const [modalCorte, setModalCorte] = useState(false)
  const [selectedCutId, setSelectedCutId] = useState(null)
  const [exportMessage, setExportMessage] = useState('')
  const [exportingType, setExportingType] = useState(null)
  const [formGasto, setFormGasto] = useState({
    expenseDate: formatMeridaDate(new Date()),
    category: 'insumos',
    description: '',
    amountMxn: '',
    paymentMethod: 'cash',
    notes: '',
  })
  const [formCorte, setFormCorte] = useState({ notes: '' })

  const dashboardRange = useMemo(
    () => buildRange(rango, fechaEspecifica, fechaDesde, fechaHasta),
    [rango, fechaEspecifica, fechaDesde, fechaHasta]
  )

  const kpisQuery = useFinanceKpisQuery({
    from: dashboardRange.from,
    to: dashboardRange.to,
    enabled: true,
  })
  const dayQuery = useFinanceDaySummaryQuery(dashboardRange.to, {
    enabled: dashboardRange.from === dashboardRange.to,
  })
  const categoriesQuery = useFinanceCategoriesQuery({
    from: dashboardRange.from,
    to: dashboardRange.to,
    enabled: true,
  })
  const recentSalesQuery = useFinanceRecentSalesQuery({
    limit: 10,
    enabled: true,
  })
  const historicalQuery = useFinanceHistoricalQuery({
    from: dashboardRange.from,
    to: dashboardRange.to,
    groupBy: resolveHistoricalGroupBy(rango),
    enabled: true,
  })
  const todayClosingQuery = useTodayCashClosingQuery({ enabled: true })
  const cashClosingsQuery = useCashClosingsQuery({
    page: 1,
    pageSize: 20,
    from: dashboardRange.from,
    to: dashboardRange.to,
    enabled: true,
  })
  const expensesQuery = useExpensesQuery({
    page: 1,
    pageSize: 20,
    from: dashboardRange.from,
    to: dashboardRange.to,
    status: 'active',
    enabled: true,
  })
  const executeCashClosingMutation = useExecuteCashClosingMutation()
  const createExpenseMutation = useCreateExpenseMutation()
  const deleteExpenseMutation = useDeleteExpenseMutation()
  const cutDetailQuery = useCashClosingDetailQuery(selectedCutId, {
    enabled: Boolean(selectedCutId),
  })

  const kpis = kpisQuery.data ?? DEFAULT_KPIS
  const todayClosing = todayClosingQuery.data ?? {
    date: formatMeridaDate(new Date()),
    isClosed: false,
    salesCount: 0,
    subtotalMxn: 0,
    taxMxn: 0,
    totalMxn: 0,
    cashTotalMxn: 0,
    cardTotalMxn: 0,
    transferTotalMxn: 0,
    otherTotalMxn: 0,
    expensesTotalMxn: 0,
    netTotalMxn: 0,
  }
  const daySummary = dayQuery.data ?? { recentSales: [], recentExpenses: [] }
  const categories = categoriesQuery.data ?? { expenseCategories: [], productCategories: [] }
  const recentSales = recentSalesQuery.data ?? []
  const expensesItems = expensesQuery.data?.items ?? []
  const dayExpenses = daySummary.recentExpenses ?? []
  const recentExpenses = dayExpenses.length > 0 ? dayExpenses : expensesItems.slice(0, 5)
  const cutsItems = (cashClosingsQuery.data?.items ?? []).map(formatCutHistoryItem)
  const cutDetail = cutDetailQuery.data ?? null
  const historicalItems = (historicalQuery.data?.items ?? []).map(formatHistoricalItem)
  const hasAnyError = Boolean(
    kpisQuery.error
    || todayClosingQuery.error
    || cashClosingsQuery.error
    || expensesQuery.error
    || recentSalesQuery.error
    || historicalQuery.error
  )
  const hasAnyLoading = (kpisQuery.isLoading && !kpisQuery.data) || (historicalQuery.isLoading && !historicalQuery.data)

  const txRows = useMemo(
    () => buildTransactionRows({ sales: recentSales, expenses: expensesItems.length ? expensesItems : recentExpenses }),
    [recentSales, expensesItems, recentExpenses]
  )

  const txFiltered = useMemo(() => {
    let rows = [...txRows]
    if (filtroActivo === 'ingresos') rows = rows.filter((row) => row.monto > 0)
    if (filtroActivo === 'gastos') rows = rows.filter((row) => row.monto < 0)
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      rows = rows.filter((row) =>
        row.concepto?.toLowerCase().includes(q)
        || row.tipo?.toLowerCase().includes(q)
        || paymentMethodLabel(row.metodoPago).toLowerCase().includes(q)
      )
    }
    return rows
  }, [txRows, filtroActivo, busqueda])

  const txVisible = txExpandidas ? txFiltered : txFiltered.slice(0, 5)
  const hayMasTx = txFiltered.length > 5

  const cutsFiltered = useMemo(() => {
    const hoy = formatMeridaDate(new Date())
    const hace7 = formatMeridaDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))
    const mes = hoy.slice(0, 7)
    if (filtroCortes === 'hoy') return cutsItems.filter((item) => item.date === hoy)
    if (filtroCortes === 'semana') return cutsItems.filter((item) => item.date && item.date >= hace7)
    if (filtroCortes === 'mes') return cutsItems.filter((item) => item.date?.startsWith(mes))
    return cutsItems
  }, [cutsItems, filtroCortes])

  const alertas = useMemo(() => {
    const lista = []
    if (Number(kpis.net.totalMxn) < 0) {
      lista.push({ tipo: 'danger', mensaje: `Utilidad negativa: ${formatMoneyMx(kpis.net.totalMxn)}` })
    }
    if (Number(kpis.sales.totalMxn) > 0 && Number(kpis.expenses.totalMxn) > Number(kpis.sales.totalMxn) * 0.8) {
      lista.push({ tipo: 'warning', mensaje: 'Los gastos superan el 80% de ingresos del rango.' })
    }
    if (todayClosing.isClosed) {
      lista.push({ tipo: 'info', mensaje: 'Corte de hoy ya está cerrado.' })
    }
    return lista
  }, [kpis, todayClosing.isClosed])

  const handleExportFinanceCsv = async (type) => {
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

  const handleExportTransactionsExcel = () => {
    exportarExcelLocal(
      formatTxExport(txFiltered),
      `finanzas_${dashboardRange.from}_${dashboardRange.to}.xlsx`,
      'Finanzas'
    )
  }

  const handleExportCutsExcel = () => {
    exportarExcelLocal(
      formatCutExport(cutsFiltered),
      `cortes_${dashboardRange.from}_${dashboardRange.to}.xlsx`,
      'Cortes'
    )
  }

  const handleExportCutsPdf = () => {
    abrirReportePDF({
      tipo: 'cortes',
      titulo: `Cortes de caja — ${getRangeLabel(rango, fechaEspecifica, fechaDesde, fechaHasta)}`,
      datos: formatCutExport(cutsFiltered),
      landscape: true,
    })
  }

  const handleCreateExpense = async () => {
    try {
      await createExpenseMutation.mutateAsync(formGasto)
      toast.success('Gasto registrado')
      setModalGasto(false)
      setFormGasto({
        expenseDate: formatMeridaDate(new Date()),
        category: 'insumos',
        description: '',
        amountMxn: '',
        paymentMethod: 'cash',
        notes: '',
      })
    } catch (error) {
      toast.error(error?.message || 'No se pudo registrar el gasto')
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    const ok = window.confirm('Eliminar gasto. Baja lógica, historial se conserva.')
    if (!ok) return
    try {
      await deleteExpenseMutation.mutateAsync(expenseId)
      toast.success('Gasto eliminado')
    } catch (error) {
      toast.error(error?.message || 'No se pudo eliminar el gasto')
    }
  }

  const handleExecuteCashClosing = async () => {
    try {
      await executeCashClosingMutation.mutateAsync({
        date: todayClosing.date ?? formatMeridaDate(new Date()),
        notes: formCorte.notes,
      })
      toast.success('Corte realizado')
      setModalCorte(false)
      setFormCorte({ notes: '' })
    } catch (error) {
      if (error?.code === 'CASH_CLOSING_ALREADY_EXISTS') {
        toast.error('Ya existe un corte para esta fecha.')
      } else {
        toast.error(error?.message || 'No se pudo ejecutar el corte')
      }
    }
  }

  const panel = {
    background: 'var(--neutral-card)',
    border: '1px solid var(--neutral-border)',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 16,
  }

  if (hasAnyLoading) {
    return (
      <div className={inPanel ? undefined : styles.page}>
        <div style={{ padding: 24, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
          Cargando finanzas...
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={inPanel ? undefined : styles.page}>
        <DateNavigator
          modo="libre"
          darkMode
          inicial="hoy"
          onChange={(value) => {
            const map = { hoy: 'dia', semana: 'semana', mes: 'mes', todos: 'todos', fecha: 'fecha', rango: 'rango' }
            setRango(map[value.tipo] ?? 'dia')
            setFechaEspecifica(value.fecha ?? null)
            setFechaDesde(value.fechaDesde ?? null)
            setFechaHasta(value.fechaHasta ?? null)
            setTxExpandidas(false)
          }}
        />

        {hasAnyError && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontFamily: 'var(--font-body)', fontSize: 13 }}>
            No se pudieron cargar los KPIs financieros.
          </div>
        )}

        {alertas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {alertas.map((alerta, idx) => (
              <div key={idx} style={{
                background: alerta.tipo === 'danger' ? 'rgba(239,68,68,0.08)' : alerta.tipo === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
                border: `1px solid ${alerta.tipo === 'danger' ? 'rgba(239,68,68,0.3)' : alerta.tipo === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}`,
                borderRadius: 8,
                padding: '10px 14px',
                color: alerta.tipo === 'danger' ? '#ef4444' : alerta.tipo === 'warning' ? '#f59e0b' : '#3b82f6',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
              }}>
                {alerta.mensaje}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <KpiCard
            label={`Ingresos — ${getRangeLabel(rango, fechaEspecifica, fechaDesde, fechaHasta)}`}
            valor={formatMoneyMx(kpis.sales.totalMxn)}
            sub={`${kpis.sales.count} ventas`}
            icono="💹"
            color="#22c55e"
            active={filtroActivo === 'ingresos'}
            onClick={() => setFiltroActivo((current) => (current === 'ingresos' ? null : 'ingresos'))}
          />
          <KpiCard
            label="Gastos"
            valor={formatMoneyMx(kpis.expenses.totalMxn)}
            sub={`${kpis.expenses.count} registros`}
            icono="📉"
            color="#ef4444"
            active={filtroActivo === 'gastos'}
            onClick={() => setFiltroActivo((current) => (current === 'gastos' ? null : 'gastos'))}
          />
          <KpiCard
            label="Utilidad neta"
            valor={formatMoneyMx(kpis.net.totalMxn)}
            sub="Ingresos - gastos"
            icono="📊"
            color={kpis.net.totalMxn >= 0 ? '#22c55e' : '#ef4444'}
          />
          <KpiCard
            label="Ticket promedio"
            valor={formatMoneyMx(kpis.sales.count > 0 ? kpis.sales.totalMxn / kpis.sales.count : 0)}
            sub="Por venta"
            icono="🎟️"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={panel}>
            <PanelTitle
              title="Ingresos históricos"
              sub={`Serie operativa ${historicalQuery.data?.groupBy ?? resolveHistoricalGroupBy(rango)}`}
              right={historicalItems.length > 0 ? <Badge color="blue"></Badge> : <Badge color="yellow">Sin datos</Badge>}
            />
            {historicalItems.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {historicalItems.map((item) => {
                  const maxSales = Math.max(...historicalItems.map((row) => Number(row.salesTotalMxn ?? 0)), 1)
                  const width = Math.max(8, Math.round((Number(item.salesTotalMxn ?? 0) / maxSales) * 100))
                  return (
                    <div key={item.label} style={{ display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontFamily: 'var(--font-body)', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatMoneyMx(item.salesTotalMxn)}</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--neutral-border)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${width}%`, height: '100%', background: '#7B1E22', borderRadius: 999 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>{item.salesCount} ventas</span>
                        <span>{formatMoneyMx(item.expensesTotalMxn)} gastos</span>
                        <span>Neto {formatMoneyMx(item.netTotalMxn)}</span>
                        <span>Ticket {formatMoneyMx(item.averageTicketMxn)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState>Sin serie histórica para este rango.</EmptyState>
            )}
          </div>

          <div style={panel}>
            <PanelTitle
              title={`Método de pago Punto de venta — Rango de fecha: ${getRangeLabel(rango, fechaEspecifica, fechaDesde, fechaHasta)}`}
              sub="Ventas del rango seleccionado"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Efectivo', kpis.paymentMethods.cashMxn],
                ['Tarjeta de crédito', kpis.paymentMethods.cardMxn],
                ['Transferencia', kpis.paymentMethods.transferMxn],
                ['Mercado Pago', kpis.paymentMethods.mercadoPagoMxn],
                ['Otro', kpis.paymentMethods.otherMxn],
              ].map(([method, amount]) => {
                const pct = Math.round((Number(amount ?? 0) / (kpis.sales.totalMxn || 1)) * 100)
                return (
                  <div key={method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {METODO_ICONS[method]} {paymentMethodLabel(method)}
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatMoneyMx(amount)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--neutral-border)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: '#7B1E22', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          {categories.expenseCategories.length > 0 ? categories.expenseCategories.map((item) => (
            <div key={`expense-${item.category}`} style={{ ...panel, marginBottom: 0, padding: '14px 18px' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>🧾 {item.category}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)' }}>
                {formatMoneyMx(item.totalMxn)}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {item.count} gasto{item.count !== 1 ? 's' : ''}
              </div>
            </div>
          )) : (
            <div style={{ ...panel, marginBottom: 0 }}>
              <PanelTitle title="Categorías de gastos" sub="Sin datos para este rango." />
              <EmptyState>Sin categorías de gastos.</EmptyState>
            </div>
          )}

          {categories.productCategories.length > 0 && categories.productCategories.map((item) => (
            <div key={`product-${item.category}`} style={{ ...panel, marginBottom: 0, padding: '14px 18px' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>🛍️ {item.category}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)' }}>
                {formatMoneyMx(item.totalMxn)}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {item.itemsSold} vendido{item.itemsSold !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>

        <div style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>
              Transacciones
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                ({txFiltered.length} registros)
              </span>
              {filtroActivo && (
                <button
                  onClick={() => setFiltroActivo(null)}
                  style={{
                    marginLeft: 10,
                    fontSize: 11,
                    fontFamily: 'var(--font-body)',
                    background: '#7B1E2233',
                    border: '1px solid #7B1E22',
                    color: '#E8A4AD',
                    borderRadius: 4,
                    padding: '2px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Filtro: {filtroActivo} ×
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                className={styles.searchInput}
                style={{ width: 180 }}
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(event) => {
                  setBusqueda(event.target.value)
                  setTxExpandidas(false)
                }}
              />
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                onClick={() => handleExportFinanceCsv('summary')}
                disabled={exportingType === 'summary'}
              >
                {exportingType === 'summary' ? 'Descargando...' : 'CSV'}
              </button>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                onClick={handleExportTransactionsExcel}
              >
                Excel
              </button>
            </div>
          </div>

          {exportMessage && (
            <div style={{ marginBottom: 12, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
              {exportMessage}
            </div>
          )}

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Tipo</th>
                <th>Método</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {txFiltered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState>Sin transacciones en este período</EmptyState>
                  </td>
                </tr>
              ) : txVisible.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDateTimeMx(row.fecha)}</td>
                  <td style={{ fontWeight: 500 }}>{row.concepto}</td>
                  <td>
                    <span className={`${styles.badge} ${row.tipo === 'venta' ? styles.badgeCompletada : styles.badgeCancelada}`}>
                      {row.tipo}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeConfirmada}`}>
                      {METODO_ICONS[row.metodoPago ?? 'cash']} {paymentMethodLabel(row.metodoPago)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: row.monto < 0 ? '#ef4444' : '#22c55e' }}>
                    {row.monto < 0 ? '−' : ''}{formatMoneyMx(Math.abs(row.monto))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hayMasTx && (
            <button
              onClick={() => setTxExpandidas((value) => !value)}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '9px 0',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {txExpandidas ? '▲ Ver menos' : `▼ Ver ${txFiltered.length - 5} más`}
            </button>
          )}
        </div>

        <div style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>
              Gastos — {getRangeLabel(rango, fechaEspecifica, fechaDesde, fechaHasta)}
            </div>
            <button
              onClick={() => setModalGasto(true)}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                background: '#7B1E22',
                color: '#fff',
              }}
            >
              + Registrar gasto
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Ingresos', val: kpis.sales.totalMxn, color: '#22c55e' },
              { label: 'Gastos', val: -kpis.expenses.totalMxn, color: '#ef4444' },
              { label: 'Utilidad', val: kpis.net.totalMxn, color: kpis.net.totalMxn >= 0 ? '#22c55e' : '#ef4444', bold: true },
            ].map(({ label, val, color, bold }) => (
              <div
                key={label}
                style={{
                  flex: '1 1 140px',
                  background: '#1E1014',
                  borderRadius: 10,
                  padding: '12px 16px',
                  border: `1px solid ${color}33`,
                }}
              >
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: bold ? 22 : 18, color }}>
                  {formatMoneyMx(val)}
                </div>
              </div>
            ))}
          </div>

          {expensesItems.length === 0 ? (
            <EmptyState>Sin gastos en este período</EmptyState>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Método</th>
                  <th>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expensesItems.map((expense) => (
                  <tr key={expense.id}>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDateMx(expense.expenseDate ?? expense.createdAt)}</td>
                    <td style={{ fontWeight: 500 }}>{expense.category}</td>
                    <td style={{ fontWeight: 500 }}>{expense.description}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeSlow}`}>
                        {paymentMethodLabel(expense.paymentMethod)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#ef4444' }}>
                      −{formatMoneyMx(expense.amountMxn)}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)' }}>
              Corte de caja — {formatDateMx(todayClosing.date)}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => setModalCorte(true)}
                disabled={todayClosing.isClosed || executeCashClosingMutation.isPending}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: todayClosing.isClosed || executeCashClosingMutation.isPending ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  background: todayClosing.isClosed ? '#2C1A1E' : '#7B1E22',
                  color: todayClosing.isClosed ? '#A69A93' : '#fff',
                  opacity: todayClosing.isClosed ? 0.7 : 1,
                }}
              >
                {todayClosing.isClosed ? 'El corte de hoy ya fue realizado.' : 'Realizar corte'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: '💵 Efectivo', val: todayClosing.cashTotalMxn, color: 'var(--text-primary)' },
              { label: '💳 Tarjeta', val: todayClosing.cardTotalMxn, color: 'var(--text-primary)' },
              { label: '📱 Transferencia', val: todayClosing.transferTotalMxn, color: 'var(--text-primary)' },
              { label: '🧾 Otros', val: todayClosing.otherTotalMxn, color: 'var(--text-primary)' },
              { label: '📊 Total ingresos', val: todayClosing.totalMxn, color: '#22c55e', border: '#22c55e44' },
              { label: '📉 Gastos del día', val: todayClosing.expensesTotalMxn, color: '#ef4444', border: '#ef444444', neg: true },
              { label: '💰 Neto a entregar', val: todayClosing.netTotalMxn, color: '#E8A4AD', border: '#7B1E22', bold: true },
            ].map(({ label, val, color, border, bold, neg }) => (
              <div
                key={label}
                style={{
                  background: '#2C1A1E',
                  borderRadius: 8,
                  padding: '12px 14px',
                  border: `1px solid ${border ?? '#3C2A2E'}`,
                }}
              >
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color, fontWeight: bold ? 600 : 400 }}>
                  {(neg && Number(val ?? 0) > 0) ? '−' : ''}{formatMoneyMx(Math.abs(val ?? 0))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Historial de cortes
              </div>
              <div style={{ display: 'flex', gap: 2, background: '#1E1014', padding: 3, borderRadius: 6 }}>
                {[
                  { v: 'hoy', l: 'Hoy' },
                  { v: 'semana', l: '7 días' },
                  { v: 'mes', l: 'Mes' },
                  { v: 'todo', l: 'Todo' },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => setFiltroCortes(v)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      background: filtroCortes === v ? '#7B1E22' : 'transparent',
                      color: filtroCortes === v ? '#fff' : '#A69A93',
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={handleExportCutsExcel}
                style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #22c55e44', background: '#1a472a', color: '#22c55e', fontFamily: 'var(--font-body)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
              >
                📊 Excel
              </button>
              <button
                onClick={handleExportCutsPdf}
                style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #ef444444', background: '#2d1b1b', color: '#ef4444', fontFamily: 'var(--font-body)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
              >
                📋 PDF
              </button>
            </div>
          </div>

          {cutsFiltered.length === 0 ? (
            <EmptyState>Sin cortes en este período</EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cutsFiltered.map((cut) => (
                <div
                  key={cut.id}
                  style={{
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: '#1E1014',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#F5EDE8' }}>
                        {formatDateMx(cut.date)} — Corte
                      </span>
                      <span style={{ fontSize: 11, color: '#A69A93' }}>{cut.salesCount} ventas</span>
                    </div>
                    <span className={`${styles.badge} ${cut.isClosed ? styles.badgeCompletada : styles.badgeConfirmada}`} style={{ fontSize: 11 }}>
                      {cut.isClosed ? 'Cerrado' : 'Abierto'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>
                    <div style={{ padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#6B5A55', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Ingresos del turno
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[
                          { label: 'Total ingresos', val: cut.totalMxn, color: '#22c55e', bold: true },
                          { label: 'Efectivo', val: cut.cashTotalMxn, color: '#A3E635' },
                          { label: 'Tarjeta', val: cut.cardTotalMxn, color: '#60A5FA' },
                          { label: 'Transferencia', val: cut.transferTotalMxn, color: '#A78BFA' },
                          { label: 'Otros', val: cut.otherTotalMxn, color: '#F97316' },
                        ].map(({ label, val, color, bold }) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>{label}</span>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 500, color }}>
                              {formatMoneyMx(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#6B5A55', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Gastos y resultado
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[
                          { label: 'Gastos', val: cut.expensesTotalMxn, color: '#ef4444' },
                          { label: 'Neto', val: cut.netTotalMxn, color: cut.netTotalMxn >= 0 ? '#22c55e' : '#ef4444', bold: true },
                        ].map(({ label, val, color, bold }) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>{label}</span>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 500, color }}>
                              {formatMoneyMx(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#6B5A55', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Caja fiscal
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[
                          { label: 'Subtotal', val: cut.subtotalMxn, color: '#A69A93' },
                          { label: 'IVA', val: cut.taxMxn, color: '#60A5FA' },
                          { label: 'Total cierre', val: cut.totalMxn, color: '#E8A4AD', bold: true },
                        ].map(({ label, val, color, bold }) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A69A93' }}>{label}</span>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 500, color }}>
                              {formatMoneyMx(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCutId(cut.id)}
                        style={{
                          marginTop: 10,
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1px solid rgba(232,164,173,0.22)',
                          background: 'rgba(123,30,34,0.12)',
                          color: '#E8A4AD',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                          fontSize: 12,
                        }}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={panel}>
          <PanelTitle title="Resumen del día" sub="Ventas y gastos recientes." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Ventas', value: formatMoneyMx(todayClosing.totalMxn), helper: `${todayClosing.salesCount} ventas`, color: '#22c55e' },
              { label: 'Gastos', value: formatMoneyMx(todayClosing.expensesTotalMxn), helper: 'Gastos activos del día', color: '#ef4444' },
              { label: 'Neto', value: formatMoneyMx(todayClosing.netTotalMxn), helper: 'Ingresos - gastos', color: todayClosing.netTotalMxn >= 0 ? '#22c55e' : '#ef4444' },
              { label: 'Corte', value: todayClosing.isClosed ? 'Cerrado' : 'Abierto', helper: todayClosing.date ? `Fecha ${formatDateMx(todayClosing.date)}` : 'Sin fecha', color: todayClosing.isClosed ? '#22c55e' : '#F59E0B' },
            ].map((item) => (
              <div key={item.label} style={{ background: '#2C1A1E', borderRadius: 8, padding: '12px 14px', border: `1px solid ${item.color}33` }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: item.color }}>{item.value}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.helper}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Ventas recientes
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
                      <Badge color="green">Pagado</Badge>
                    </div>
                  </div>
                )) : (
                  <EmptyState>Sin ventas registradas</EmptyState>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Gastos recientes
              </div>
              <div className={styles.miniList}>
                {recentExpenses.length > 0 ? recentExpenses.map((expense) => (
                  <div key={expense.id ?? expense.description} className={styles.miniItem}>
                    <div className={styles.miniAvatar}>🧾</div>
                    <div>
                      <div className={styles.miniName}>{expense.description || expense.category}</div>
                      <div className={styles.miniSub}>{expense.category} · {paymentMethodLabel(expense.paymentMethod)} · {formatDateTimeMx(expense.createdAt)}</div>
                    </div>
                    <div className={styles.miniRight}>
                      <div className={styles.miniVal}>{formatMoneyMx(expense.amountMxn)}</div>
                      <Badge color="red">Activo</Badge>
                    </div>
                  </div>
                )) : (
                  <EmptyState>Sin gastos recientes.</EmptyState>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <button
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
            onClick={() => handleExportFinanceCsv('sales')}
            disabled={exportingType === 'sales'}
          >
            {exportingType === 'sales' ? 'Descargando...' : 'CSV Ventas'}
          </button>
          <button
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
            onClick={() => handleExportFinanceCsv('expenses')}
            disabled={exportingType === 'expenses'}
          >
            {exportingType === 'expenses' ? 'Descargando...' : 'CSV Gastos'}
          </button>
          <button
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
            onClick={() => handleExportFinanceCsv('cash_closings')}
            disabled={exportingType === 'cash_closings'}
          >
            {exportingType === 'cash_closings' ? 'Descargando...' : 'CSV Cortes'}
          </button>
        </div>
      </div>

      {modalGasto && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalGasto(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Registrar gasto"
            style={{ background: '#1E1014', borderRadius: 16, padding: 32, width: '90%', maxWidth: 460, border: '1px solid #3C2A2E' }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, margin: '0 0 24px', color: '#F5EDE8' }}>
              Registrar gasto
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Fecha', key: 'expenseDate', type: 'date' },
                { label: 'Categoría', key: 'category', type: 'text' },
                { label: 'Descripción', key: 'description', type: 'text' },
                { label: 'Monto', key: 'amountMxn', type: 'number' },
                { label: 'Método', key: 'paymentMethod', type: 'select' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>{label}</label>
                  {type === 'select' ? (
                    <select
                      value={formGasto[key]}
                      onChange={(event) => setFormGasto((current) => ({ ...current, [key]: event.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, boxSizing: 'border-box' }}
                    >
                      {Object.entries(METODO_LABELS).map(([value, text]) => (
                        <option key={value} value={value}>{text}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={formGasto[key]}
                      onChange={(event) => setFormGasto((current) => ({ ...current, [key]: event.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  )}
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>Notas</label>
                <textarea
                  rows={3}
                  value={formGasto.notes}
                  onChange={(event) => setFormGasto((current) => ({ ...current, notes: event.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
              <button
                onClick={handleCreateExpense}
                disabled={createExpenseMutation.isPending}
                style={{ padding: 14, borderRadius: 8, border: 'none', background: '#7B1E22', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, cursor: 'pointer' }}
              >
                {createExpenseMutation.isPending ? 'Guardando...' : 'Guardar gasto'}
              </button>
              <button
                onClick={() => setModalGasto(false)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #3C2A2E', background: 'transparent', color: '#A69A93', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {modalCorte && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalCorte(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Corte de caja"
            style={{ background: '#1E1014', borderRadius: 16, padding: 32, width: '90%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', border: '1px solid #3C2A2E' }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, margin: '0 0 4px', color: '#F5EDE8' }}>
              Corte de caja
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', margin: '0 0 20px' }}>
              Hoy · {formatDateMx(todayClosing.date)}
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 14, color: '#F5EDE8', marginBottom: 4, fontWeight: 500 }}>
                Notas del corte
              </label>
              <textarea
                rows={3}
                value={formCorte.notes}
                onChange={(event) => setFormCorte({ notes: event.target.value })}
                style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
              <button
                onClick={handleExecuteCashClosing}
                disabled={executeCashClosingMutation.isPending}
                style={{ padding: 14, borderRadius: 8, border: 'none', background: '#7B1E22', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, cursor: 'pointer' }}
              >
                {executeCashClosingMutation.isPending ? 'Procesando...' : 'Confirmar corte'}
              </button>
              <button
                onClick={() => setModalCorte(false)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #3C2A2E', background: 'transparent', color: '#A69A93', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              {todayClosing.isClosed && (
                <div style={{ marginTop: 8, fontFamily: 'var(--font-body)', fontSize: 12, color: '#F59E0B' }}>
                  El corte de hoy ya fue realizado.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedCutId && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedCutId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Detalle de corte"
            style={{ background: '#1E1014', borderRadius: 16, padding: 32, width: '92%', maxWidth: 780, maxHeight: '90vh', overflowY: 'auto', border: '1px solid #3C2A2E' }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, margin: '0 0 4px', color: '#F5EDE8' }}>
              Detalle de corte
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', margin: '0 0 20px' }}>
              {cutDetail?.date ? formatDateMx(cutDetail.date) : '—'}
            </p>

            {cutDetail ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
                  {[
                    { label: 'Ventas', value: cutDetail.salesCount },
                    { label: 'Subtotal', value: formatMoneyMx(cutDetail.subtotalMxn) },
                    { label: 'IVA', value: formatMoneyMx(cutDetail.taxMxn) },
                    { label: 'Total', value: formatMoneyMx(cutDetail.totalMxn) },
                    { label: 'Gastos', value: formatMoneyMx(cutDetail.expensesTotalMxn) },
                    { label: 'Neto', value: formatMoneyMx(cutDetail.netTotalMxn) },
                  ].map((item) => (
                    <div key={item.label} style={{ background: '#2C1A1E', borderRadius: 8, padding: '12px 14px', border: '1px solid #3C2A2E' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A69A93', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#F5EDE8' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#F5EDE8', marginBottom: 12 }}>
                  Ventas incluidas
                </div>
                {cutDetail.sales?.length > 0 ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Folio</th>
                        <th>Cliente</th>
                        <th>Método</th>
                        <th>Subtotal</th>
                        <th>IVA</th>
                        <th>Total</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cutDetail.sales.map((sale) => (
                        <tr key={sale.saleId ?? sale.id}>
                          <td>{sale.folio}</td>
                          <td>{sale.customerName || sale.customerEmail || 'Venta mostrador'}</td>
                          <td>{paymentMethodLabel(sale.paymentMethod)}</td>
                          <td>{formatMoneyMx(sale.subtotalMxn)}</td>
                          <td>{formatMoneyMx(sale.taxMxn)}</td>
                          <td>{formatMoneyMx(sale.totalMxn)}</td>
                          <td>{formatDateTimeMx(sale.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState>Este corte no contiene ventas incluidas.</EmptyState>
                )}
              </>
            ) : (
              <EmptyState>Cargando detalle...</EmptyState>
            )}

            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => setSelectedCutId(null)}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #3C2A2E', background: 'transparent', color: '#A69A93', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
