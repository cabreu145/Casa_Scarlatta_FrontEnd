import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import PaquetesSection from './PaquetesSection'

describe('PaquetesSection', () => {
  test('renderiza catalogo API, inactiva con modal y oculta historial real', async () => {
    const user = userEvent.setup()
    const setSearch = vi.fn()
    const setStatus = vi.fn()
    const onPageChange = vi.fn()
    const onToggleActive = vi.fn()
    const onToggleFeatured = vi.fn()
    const openModal = vi.fn()
    const setModalEditPaquete = vi.fn()
    const setEditPaqueteForm = vi.fn()
    const eliminarPaquete = vi.fn().mockResolvedValue(undefined)

    render(
      <PaquetesSection
        paquetes={[
          {
            id: 1,
            name: '',
            display_name: '1 clase · válido por 7 días',
            credits: 12,
            price_mxn: 2100,
            duration_days: 30,
            is_active: true,
            is_featured: true,
            benefits: ['Acceso a clases'],
          },
        ]}
        transacciones={[]}
        usuarios={[]}
        openModal={openModal}
        setModalEditPaquete={setModalEditPaquete}
        setEditPaqueteForm={setEditPaqueteForm}
        eliminarPaquete={eliminarPaquete}
        marcarDestacado={vi.fn()}
        useApiMode
        isLoading={false}
        error=""
        total={1}
        page={1}
        pageSize={20}
        search=""
        setSearch={setSearch}
        status="active"
        setStatus={setStatus}
        onPageChange={onPageChange}
        onToggleActive={onToggleActive}
        onToggleFeatured={onToggleFeatured}
      />
    )

    expect(screen.getByText('1 clase · válido por 7 días')).toBeInTheDocument()
    expect(screen.getByText(/12 clases/)).toBeInTheDocument()
    expect(screen.getByText(/Disponible.*Reportes/, { selector: 'span' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+ Nuevo Paquete' }))
    expect(openModal).toHaveBeenCalledWith('paquete')

    await user.click(screen.getByRole('button', { name: /Editar/ }))
    expect(setModalEditPaquete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    expect(setEditPaqueteForm).toHaveBeenCalledWith(expect.objectContaining({ nombre: '' }))

    await user.click(screen.getByRole('button', { name: /Inactivar/i }))
    expect(screen.getAllByText('Inactivar paquete')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Inactivar paquete' }))
    expect(eliminarPaquete).toHaveBeenCalledWith(1)
    expect(screen.queryByText('Inactivar paquete')).not.toBeInTheDocument()
  })
})
