import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import GastosSection from './GastosSection'
import { fechaLocal } from '@/utils/fecha'

const toastSuccess = vi.fn()
const toastError = vi.fn()
const createMutateAsync = vi.fn()
const updateMutateAsync = vi.fn()
const cancelMutateAsync = vi.fn()
const deleteMutateAsync = vi.fn()
const todayIso = fechaLocal(new Date())

const apiState = {
  list: {
    data: {
      page: 1,
      pageSize: 20,
      total: 2,
      items: [
        {
          id: 1,
          expenseDate: todayIso,
          category: 'insumos',
          description: 'Compra de agua y limpieza',
          amountMxn: 350,
          paymentMethod: 'cash',
          status: 'active',
          notes: 'Compra local',
        },
        {
          id: 2,
          expenseDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
          category: 'limpieza',
          description: 'Registro duplicado',
          amountMxn: 120,
          paymentMethod: 'card',
          status: 'cancelled',
          notes: '',
        },
      ],
    },
    isLoading: false,
    error: null,
  },
  detail: {
    data: {
      id: 1,
      expenseDate: todayIso,
      category: 'insumos',
      description: 'Compra de agua y limpieza',
      amountMxn: 350,
      paymentMethod: 'cash',
      status: 'active',
      notes: 'Compra local',
      createdAt: '2026-06-09T10:00:00-06:00',
      updatedAt: '2026-06-09T10:30:00-06:00',
      cancelledAt: null,
    },
    isLoading: false,
    error: null,
  },
}

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args) => toastSuccess(...args),
    error: (...args) => toastError(...args),
  },
}))

vi.mock('@/hooks/useApiQueries', () => ({
  useExpensesQuery: () => apiState.list,
  useExpenseDetailQuery: () => apiState.detail,
  useCreateExpenseMutation: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateExpenseMutation: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  useCancelExpenseMutation: () => ({ mutateAsync: cancelMutateAsync, isPending: false }),
  useDeleteExpenseMutation: () => ({ mutateAsync: deleteMutateAsync, isPending: false }),
}))

vi.mock('@/stores/gastosStore', () => ({
  useGastosStore: Object.assign(
    (selector) => (typeof selector === 'function' ? selector({ gastos: [] }) : { gastos: [] }),
    { setState: vi.fn() }
  ),
}))

describe('GastosSection', () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()
    createMutateAsync.mockReset()
    updateMutateAsync.mockReset()
    cancelMutateAsync.mockReset()
    deleteMutateAsync.mockReset()

    createMutateAsync.mockResolvedValue({ id: 3, expenseDate: todayIso })
    updateMutateAsync.mockResolvedValue({ id: 1, expenseDate: todayIso })
    cancelMutateAsync.mockResolvedValue({ id: 1, status: 'cancelled' })
    deleteMutateAsync.mockResolvedValue({ ok: true })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renderiza tabla, crea, edita, cancela y elimina gasto', async () => {
    const user = userEvent.setup()
    render(<GastosSection inPanel isActive useApiMode />)

    expect(screen.getByText('Gastos operativos')).toBeInTheDocument()
    expect(screen.getByText('Compra de agua y limpieza')).toBeInTheDocument()
    expect(screen.getByText('Registro duplicado')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Cancelado')).toBeInTheDocument()
    expect(screen.getAllByText('Efectivo').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Tarjeta').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /Nuevo gasto/i }))
    const createDialog = screen.getByRole('dialog', { name: /Nuevo gasto/i })
    await user.type(within(createDialog).getByLabelText(/Descripción/i), 'Compra de servilletas')
    await user.clear(within(createDialog).getByLabelText(/Monto/i))
    await user.type(within(createDialog).getByLabelText(/Monto/i), '0')
    await user.click(within(createDialog).getByRole('button', { name: /Guardar gasto/i }))
    expect(toastError).toHaveBeenCalledWith('El monto debe ser mayor a cero.')
    expect(createMutateAsync).not.toHaveBeenCalled()

    await user.clear(within(createDialog).getByLabelText(/Monto/i))
    await user.type(within(createDialog).getByLabelText(/Monto/i), '350')
    await user.click(within(createDialog).getByRole('button', { name: /Guardar gasto/i }))
    expect(createMutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      expenseDate: todayIso,
      category: 'insumos',
      description: 'Compra de servilletas',
      amountMxn: '350',
      paymentMethod: 'cash',
    }))

    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    const activeRow = rows[1]
    const cancelledRow = rows[2]

    await user.click(within(activeRow).getByRole('button', { name: /Editar/i }))
    const editDialog = screen.getByRole('dialog', { name: /Editar gasto/i })
    await user.clear(within(editDialog).getByLabelText(/Descripción/i))
    await user.type(within(editDialog).getByLabelText(/Descripción/i), 'Compra de agua actualizada')
    await user.click(within(editDialog).getByRole('button', { name: /Guardar cambios/i }))
    expect(updateMutateAsync).toHaveBeenCalledWith({
      id: 1,
      payload: expect.objectContaining({
        description: 'Compra de agua actualizada',
      }),
    })

    await user.click(within(activeRow).getByRole('button', { name: /Cancelar/i }))
    const cancelDialog = screen.getByRole('dialog', { name: /Cancelar gasto/i })
    await user.type(within(cancelDialog).getByLabelText(/Motivo opcional/i), 'Registro duplicado')
    await user.click(within(cancelDialog).getByRole('button', { name: /Confirmar cancelación/i }))
    expect(cancelMutateAsync).toHaveBeenCalledWith({ id: 1, reason: 'Registro duplicado' })

    await user.click(within(activeRow).getByRole('button', { name: /Eliminar/i }))
    const deleteDialog = screen.getByRole('dialog', { name: /Eliminar gasto/i })
    await user.click(within(deleteDialog).getByRole('button', { name: /Eliminar gasto/i }))
    expect(deleteMutateAsync).toHaveBeenCalledWith(1)

    expect(within(cancelledRow).getByRole('button', { name: /Editar/i })).toBeDisabled()
    expect(within(cancelledRow).getByRole('button', { name: /Cancelar/i })).toBeDisabled()
    expect(within(cancelledRow).getByRole('button', { name: /Eliminar/i })).toBeDisabled()

    await user.click(within(activeRow).getByRole('button', { name: /Ver/i }))
    const detailDialog = screen.getByRole('dialog', { name: /Detalle de gasto/i })
    expect(within(detailDialog).getByText('insumos')).toBeInTheDocument()
    expect(within(detailDialog).getByText('Compra de agua y limpieza')).toBeInTheDocument()
  })
})
