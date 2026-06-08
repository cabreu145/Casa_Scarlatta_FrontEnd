import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import UsuariosSection from './UsuariosSection'

function renderSection(overrides = {}) {
  const props = {
    usuarios: [{
      id: 1,
      nombre: 'Cliente API',
      email: 'cliente@api.local',
      rol: 'cliente',
      activo: true,
      paquete: 'Mensual 12',
      creditsBalance: 8,
      reservationsCount: 3,
      activeMembership: { expiresAt: '2026-07-07' },
    }],
    paquetes: [],
    usersFilter: 'Todos',
    setUsersFilter: vi.fn(),
    usersSearch: '',
    setUsersSearch: vi.fn(),
    userSelectMode: false,
    setUserSelectMode: vi.fn(),
    userSelectedIds: new Set(),
    setUserSelectedIds: vi.fn(),
    eliminarUsuario: vi.fn(),
    openModal: vi.fn(),
    onViewClient: vi.fn(),
    useApiMode: true,
    total: 1,
    page: 1,
    pageSize: 20,
    onPageChange: vi.fn(),
    ...overrides,
  }
  render(<UsuariosSection {...props} />)
  return props
}

describe('UsuariosSection API mode', () => {
  it('muestra datos backend y abre detalle', () => {
    const props = renderSection()
    expect(screen.getByText('Cliente API')).toBeInTheDocument()
    expect(screen.getByText('Mensual 12')).toBeInTheDocument()
    expect(screen.getByText('2026-07-07')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }))
    expect(props.onViewClient).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it('envia cambios de filtro al contenedor', () => {
    const props = renderSection()
    fireEvent.click(screen.getByRole('button', { name: 'Sin paquete' }))
    expect(props.setUsersFilter).toHaveBeenCalledWith('Sin paquete')
  })
})
