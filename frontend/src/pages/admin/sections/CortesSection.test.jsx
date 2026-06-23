import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import CortesSection from './CortesSection'

const toastSuccess = vi.fn()
const toastError = vi.fn()
const openMutateAsync = vi.fn()
const closeMutateAsync = vi.fn()
const executeMutateAsync = vi.fn()

/* ── shared mutable state ── */
const shiftState = {
  data: null,
  isLoading: false,
  error: null,
}

const listState = {
  data: {
    page: 1, pageSize: 20, total: 1,
    items: [
      {
        id: 11,
        date: '2026-06-19',
        shiftKey: 'turno_1',
        shiftLabel: 'Turno 1',
        status: 'closed',
        isOpen: false,
        isClosed: true,
        openingCashMxn: 500,
        expectedCashMxn: 1550,
        countedCashMxn: 1550,
        cashDifferenceMxn: 0,
        totalMxn: 2300,
        netTotalMxn: 2150,
      },
    ],
  },
  isLoading: false,
  error: null,
}

const detailState = {
  data: null,
  isLoading: false,
  error: null,
}

vi.mock('react-hot-toast', () => ({
  default: { success: (...a) => toastSuccess(...a), error: (...a) => toastError(...a) },
}))

vi.mock('@/hooks/useApiQueries', () => ({
  useCashShiftSummaryQuery: () => shiftState,
  useCashClosingsQuery: () => listState,
  useCashClosingDetailQuery: () => detailState,
  useOpenCashShiftMutation: () => ({ mutateAsync: openMutateAsync, isPending: false }),
  useExecuteCashShiftMutation: () => ({ mutateAsync: closeMutateAsync, isPending: false }),
  useExecuteCashClosingMutation: () => ({ mutateAsync: executeMutateAsync, isPending: false }),
}))

vi.mock('@/stores/cortesStore', () => ({
  useCortesStore: (selector) => {
    const store = { cortes: [], ejecutarCorte: vi.fn() }
    return selector ? selector(store) : store
  },
}))

describe('CortesSection', () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
    openMutateAsync.mockReset()
    closeMutateAsync.mockReset()
    executeMutateAsync.mockReset()
    shiftState.data = null
    shiftState.isLoading = false
    shiftState.error = null
    detailState.data = null
    detailState.isLoading = false
    detailState.error = null
  })

  test('muestra selector de turno', () => {
    render(<CortesSection inPanel isActive useApiMode />)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Turno 1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Turno 2').length).toBeGreaterThanOrEqual(1)
  })

  test('muestra formulario de apertura si turno no está abierto', () => {
    shiftState.data = {
      shiftKey: 'turno_1', shiftLabel: 'Turno 1',
      status: null, isOpen: false, isClosed: false,
    }
    render(<CortesSection inPanel isActive useApiMode />)
    expect(screen.getByText('Apertura de caja')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('500')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Abrir caja/i })).toBeInTheDocument()
  })

  test('abrir caja envía fecha, shiftKey y fondo inicial', async () => {
    const user = userEvent.setup()
    shiftState.data = { shiftKey: 'turno_1', shiftLabel: 'Turno 1', isOpen: false, isClosed: false }
    openMutateAsync.mockResolvedValue({ id: 10, status: 'open', isOpen: true })

    render(<CortesSection inPanel isActive useApiMode />)

    await user.clear(screen.getByPlaceholderText('500'))
    await user.type(screen.getByPlaceholderText('500'), '500')
    await user.click(screen.getByRole('button', { name: /Abrir caja/i }))

    expect(openMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ shiftKey: 'turno_1', opening_cash_mxn: 500 })
    )
    expect(toastSuccess).toHaveBeenCalledWith('Caja abierta correctamente.')
  })

  test('muestra resumen y formulario de cierre si turno está abierto', () => {
    shiftState.data = {
      shiftKey: 'turno_1', shiftLabel: 'Turno 1',
      status: 'open', isOpen: true, isClosed: false,
      openingCashMxn: 500, cashTotalMxn: 1200, expectedCashMxn: 1550,
      cardTotalMxn: 800, cashOutflowsMxn: 150, totalMxn: 2300, netTotalMxn: 2150,
    }
    render(<CortesSection inPanel isActive useApiMode />)
    expect(screen.getByText('Resumen del turno')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('1550')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cerrar corte/i })).toBeInTheDocument()
  })

  test('cerrar caja envía fecha, shiftKey y efectivo contado', async () => {
    const user = userEvent.setup()
    shiftState.data = {
      shiftKey: 'turno_1', shiftLabel: 'Turno 1',
      status: 'open', isOpen: true, isClosed: false,
      openingCashMxn: 500, expectedCashMxn: 1550,
    }
    closeMutateAsync.mockResolvedValue({ id: 10, status: 'closed', isClosed: true, cashDifferenceMxn: 0 })

    render(<CortesSection inPanel isActive useApiMode />)
    await user.type(screen.getByPlaceholderText('1550'), '1550')
    await user.click(screen.getByRole('button', { name: /Cerrar corte/i }))

    expect(closeMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ shiftKey: 'turno_1', counted_cash_mxn: 1550 })
    )
    expect(toastSuccess).toHaveBeenCalledWith('Corte ejecutado correctamente.')
  })

  test('muestra resumen final cuando turno está cerrado', () => {
    shiftState.data = {
      id: 10, shiftKey: 'turno_1', shiftLabel: 'Turno 1',
      status: 'closed', isOpen: false, isClosed: true,
      openingCashMxn: 500, expectedCashMxn: 1550,
      countedCashMxn: 1600, cashDifferenceMxn: 50,
    }
    render(<CortesSection inPanel isActive useApiMode />)
    expect(screen.getByText('Resumen final del turno')).toBeInTheDocument()
    expect(screen.getByText('Sobrante')).toBeInTheDocument()
  })

  test('muestra Faltante cuando diferencia es negativa', () => {
    shiftState.data = {
      id: 10, shiftKey: 'turno_1', shiftLabel: 'Turno 1',
      status: 'closed', isOpen: false, isClosed: true,
      expectedCashMxn: 1550, countedCashMxn: 1400, cashDifferenceMxn: -150,
    }
    render(<CortesSection inPanel isActive useApiMode />)
    expect(screen.getByText('Faltante')).toBeInTheDocument()
  })

  test('muestra Cuadrado cuando diferencia es cero', () => {
    shiftState.data = {
      id: 10, shiftKey: 'turno_1', shiftLabel: 'Turno 1',
      status: 'closed', isOpen: false, isClosed: true,
      expectedCashMxn: 1550, countedCashMxn: 1550, cashDifferenceMxn: 0,
    }
    render(<CortesSection inPanel isActive useApiMode />)
    expect(screen.getAllByText('Cuadrado').length).toBeGreaterThanOrEqual(1)
  })

  test('historial muestra columna de turno', () => {
    render(<CortesSection inPanel isActive useApiMode />)
    const table = screen.getByRole('table')
    expect(within(table).getByText('Turno 1')).toBeInTheDocument()
    expect(within(table).getAllByRole('columnheader').map(el => el.textContent)).toContain('Turno')
  })

  test('historial tiene filtro por turno', () => {
    render(<CortesSection inPanel isActive useApiMode />)
    const selects = screen.getAllByRole('combobox')
    const shiftFilter = selects.find(s => s.textContent?.includes('Todos los turnos'))
    expect(shiftFilter).toBeTruthy()
  })

  test('detalle muestra ventas y gastos', async () => {
    const user = userEvent.setup()
    detailState.data = {
      id: 11,
      date: '2026-06-19',
      shiftKey: 'turno_1',
      shiftLabel: 'Turno 1',
      openingCashMxn: 500,
      cashTotalMxn: 1200,
      cardTotalMxn: 800,
      transferTotalMxn: 300,
      otherTotalMxn: 0,
      expensesTotalMxn: 150,
      expectedCashMxn: 1550,
      countedCashMxn: 1550,
      cashDifferenceMxn: 0,
      totalMxn: 2300,
      netTotalMxn: 2150,
      sales: [{ id: 100, folio: 'POS-000100', customerName: 'Cliente Demo', paymentMethod: 'cash', subtotalMxn: 120, taxMxn: 0, totalMxn: 120, createdAt: '2026-06-19T08:15:00-06:00' }],
      expenses: [{ id: 55, expenseId: 55, category: 'operacion', description: 'Insumos', paymentMethod: 'cash', amountMxn: 150, expenseDate: '2026-06-19' }],
    }

    render(<CortesSection inPanel isActive useApiMode />)
    await user.click(screen.getAllByRole('button', { name: /Ver detalle/i })[0])

    const dialog = screen.getByRole('dialog', { name: /Detalle de corte/i })
    expect(within(dialog).getByText('Cliente Demo')).toBeInTheDocument()
    expect(within(dialog).getByText('Insumos')).toBeInTheDocument()
  })

  test('muestra mensaje de error amigable para CASH_SHIFT_ALREADY_OPEN', async () => {
    const user = userEvent.setup()
    shiftState.data = { shiftKey: 'turno_1', isOpen: false, isClosed: false }
    openMutateAsync.mockRejectedValue(Object.assign(new Error('CASH_SHIFT_ALREADY_OPEN'), { code: 'CASH_SHIFT_ALREADY_OPEN' }))

    render(<CortesSection inPanel isActive useApiMode />)
    await user.type(screen.getByPlaceholderText('500'), '500')
    await user.click(screen.getByRole('button', { name: /Abrir caja/i }))

    expect(toastError).toHaveBeenCalledWith('Este turno ya tiene caja abierta.')
  })
})
