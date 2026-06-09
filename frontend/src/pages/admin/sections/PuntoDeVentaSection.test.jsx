import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import PuntoDeVentaSection from './PuntoDeVentaSection'

const toastError = vi.fn()
const toastSuccess = vi.fn()
const mutateAsync = vi.fn()
const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)

vi.mock('react-hot-toast', () => ({
  default: {
    error: (...args) => toastError(...args),
    success: (...args) => toastSuccess(...args),
  },
}))

vi.mock('@/hooks/useApiQueries', () => ({
  useAdminClientsQuery: () => ({
    data: {
      items: [{ id: 1, name: 'Cliente Demo', email: 'cliente@demo.local' }],
      total: 1,
    },
    isLoading: false,
    error: null,
  }),
  useCreatePosSaleMutation: () => ({
    mutateAsync,
    isPending: false,
  }),
  useCreateProductCategoryMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 3, name: 'Accesorios' }),
  }),
  useUpdateProductCategoryMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 1, name: 'Accesorios' }),
  }),
  useUpdateProductCategoryStatusMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 1, name: 'Accesorios' }),
  }),
  useDeleteProductCategoryMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ ok: true }),
  }),
  useMembershipPackagesQuery: () => ({
    data: [
      {
        id: 2,
        name: 'Mensual 12',
        displayName: 'Mensual 12',
        credits: 12,
        priceMxn: 2100,
        durationDays: 30,
        isActive: true,
        isFeatured: true,
        isShareable: true,
        maxBeneficiaries: 1,
        benefits: ['Acceso a clases'],
      },
    ],
    isLoading: false,
    error: null,
  }),
  usePosProductsQuery: () => ({
    data: {
      items: [
        {
          id: 1,
          categoryId: 1,
          name: 'Toalla',
          category: 'Accesorios',
          priceMxn: 120,
          stock: 5,
          isActive: true,
          description: 'Microfibra',
        },
        {
          id: 9,
          categoryId: 1,
          name: 'Inactivo',
          category: 'Accesorios',
          priceMxn: 99,
          stock: 0,
          isActive: false,
          description: 'No sale',
        },
      ],
      total: 2,
    },
    isLoading: false,
    error: null,
  }),
  useProductCategoriesQuery: () => ({
    data: {
      items: [
        { id: 1, name: 'Accesorios', description: 'Categoría general', isActive: true },
      ],
    },
    isLoading: false,
    error: null,
  }),
  usePosSalesQuery: () => ({
    data: {
      items: [{
        id: 100,
        folio: 'POS-000100',
        customerId: 1,
        customerName: 'Cliente Demo',
        customerEmail: 'cliente@demo.local',
        totalMxn: 2340,
        paymentMethod: 'cash',
        createdAt: '2026-06-08T12:00:00',
      }],
    },
    isLoading: false,
    error: null,
  }),
}))

function Harness() {
  const [cart, setCart] = useState([])
  const [posFilter, setPosFilter] = useState('Todos')
  const [prodModal, setProdModal] = useState(null)
  const [prodForm, setProdForm] = useState({ nombre: '', categoria: 'Accesorios', categoryId: '', precio: '', stock: '', emoji: '' })
  const [confirmarEliminarProd, setConfirmarEliminarProd] = useState(null)

  const addToCart = (item) => {
    setCart((current) => [...current, { quantity: 1, ...item }])
  }
  const removeFromCart = (idx) => setCart((current) => current.filter((_, index) => index !== idx))
  const updateCartItemQuantity = (idx, quantity) => {
    setCart((current) => current.map((item, index) => (index === idx ? { ...item, quantity } : item)))
  }
  const updateCartItem = (idx, changes) => {
    setCart((current) => current.map((item, index) => (index === idx ? { ...item, ...changes } : item)))
  }
  const clearCart = () => setCart([])

  const totals = cart.reduce((acc, item) => {
    const line = Number(item.quantity ?? 1) * Number(item.unitPriceMxn ?? item.price ?? 0)
    acc.subtotal += line
    acc.total += line
    return acc
  }, { subtotal: 0, iva: 0, total: 0 })

  return (
    <PuntoDeVentaSection
      useApiMode
      isActive
      paquetes={[]}
      productos={[]}
      agregarProducto={vi.fn()}
      editarProducto={vi.fn()}
      eliminarProducto={vi.fn()}
      cart={cart}
      posFilter={posFilter}
      setPosFilter={setPosFilter}
      prodModal={prodModal}
      setProdModal={setProdModal}
      prodForm={prodForm}
      setProdForm={setProdForm}
      confirmarEliminarProd={confirmarEliminarProd}
      setConfirmarEliminarProd={setConfirmarEliminarProd}
      pendingAsignacion={null}
      cartSubtotal={totals.subtotal}
      cartIva={totals.iva}
      cartTotal={totals.total}
      addToCart={addToCart}
      removeFromCart={removeFromCart}
      updateCartItemQuantity={updateCartItemQuantity}
      updateCartItem={updateCartItem}
      clearCart={clearCart}
      handleCobrar={vi.fn()}
      handleSaveProducto={vi.fn()}
      handleEliminarProducto={vi.fn()}
    />
  )
}

describe('PuntoDeVentaSection', () => {
  beforeEach(() => {
    toastError.mockReset()
    toastSuccess.mockReset()
    mutateAsync.mockReset()
    windowOpen.mockClear()
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test')
    mutateAsync.mockResolvedValue({
      id: 100,
      folio: 'POS-000100',
      status: 'paid',
      customerId: 1,
      subtotalMxn: 2000,
      taxMxn: 340,
      totalMxn: 2340,
      paymentMethod: 'cash',
      createdAt: '2026-06-08T12:00:00',
      publicTicketUrl: 'http://api.test/api/v1/public/tickets/abc123',
      publicTicketImageUrl: 'http://api.test/api/v1/public/tickets/abc123.png',
      items: [],
    })
  })

  test('carga catalogo API, bloquea producto inactivo y genera venta con ticket', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(await screen.findByRole('button', { name: /Toalla/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mensual 12/i })).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()

    const recentSalesTable = screen.getByRole('table')
    expect(within(recentSalesTable).getByText('Cliente Demo')).toBeInTheDocument()
    expect(within(recentSalesTable).getByText(/08\/06\/2026/)).toBeInTheDocument()
    expect(within(recentSalesTable).getByText('Efectivo')).toBeInTheDocument()

    const buyerSelect = screen.getByText('Selecciona cliente', { selector: 'option' }).closest('select')
    await user.selectOptions(buyerSelect, '1')
    await user.click(screen.getByRole('button', { name: /Mensual 12/i }))
    await user.type(screen.getByPlaceholderText('emails separados por coma'), 'beneficiario@demo.local')

    await user.click(screen.getByRole('button', { name: /Cobrar/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      customerId: '1',
      paymentMethod: 'cash',
      subtotalMxn: expect.any(Number),
      taxMxn: expect.any(Number),
      totalMxn: expect.any(Number),
      items: expect.arrayContaining([
        expect.objectContaining({ type: 'package', id: 2, beneficiaries: ['beneficiario@demo.local'] }),
      ]),
    }))

    expect(await screen.findByText('Venta completada')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Ver ticket/i }))
    expect(windowOpen).toHaveBeenCalledWith('http://api.test/api/v1/public/tickets/abc123.png', '_blank', 'noopener,noreferrer')

    await user.type(screen.getAllByRole('textbox').at(-1), '(55) 1234-5678')
    await user.click(screen.getByRole('button', { name: /Enviar por WhatsApp/i }))
    expect(windowOpen).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/525512345678?text='), '_blank', 'noopener,noreferrer')
  }, 20000)

  test('producto inactivo queda deshabilitado', async () => {
    render(<Harness />)

    await userEvent.setup().selectOptions(screen.getAllByRole('combobox')[0], 'all')
    expect(screen.getByRole('button', { name: /Inactivo/i })).toBeDisabled()
  })

  test('paquete sin cliente no permite agregar', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /Mensual 12/i }))
    expect(toastError).toHaveBeenCalledWith('Selecciona cliente para vender paquete.')
  })

  test('abre modal de categoria', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /Nueva categor/i }))
    const dialog = screen.getByRole('dialog', { name: /Nueva categor/i })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('Nombre')).toBeInTheDocument()
    expect(within(dialog).getByText('Estado')).toBeInTheDocument()
    expect(within(dialog).getByText('Descripción')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /Guardar/i })).toBeInTheDocument()
  })
})
