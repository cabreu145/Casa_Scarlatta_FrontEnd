import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import PaquetesSection from './PaquetesSection'

describe('PaquetesSection', () => {
  test('renderiza catálogo API y oculta historial real', async () => {
    const user = userEvent.setup()
    const setSearch = vi.fn()
    const setStatus = vi.fn()
    const onPageChange = vi.fn()
    const onToggleActive = vi.fn()
    const onToggleFeatured = vi.fn()
    const openModal = vi.fn()
    const setModalEditPaquete = vi.fn()
    const setEditPaqueteForm = vi.fn()
    const eliminarPaquete = vi.fn()

    render(
      <PaquetesSection
        paquetes={[
          {
            id: 1,
            nombre: 'Mensual 12',
            creditos: 12,
            precio: 2100,
            durationDays: 30,
            isActive: true,
            isFeatured: true,
            beneficios: ['Acceso a clases'],
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
        status="all"
        setStatus={setStatus}
        onPageChange={onPageChange}
        onToggleActive={onToggleActive}
        onToggleFeatured={onToggleFeatured}
      />
    )

    expect(screen.getByText('Mensual 12')).toBeInTheDocument()
    expect(screen.getByText(/12 créditos/)).toBeInTheDocument()
    expect(screen.getByText('Disponible próximamente en Reportes', { selector: 'span' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+ Nuevo Paquete' }))
    expect(openModal).toHaveBeenCalledWith('paquete')

    await user.click(screen.getByRole('button', { name: /Desactivar/i }))
    expect(onToggleActive).toHaveBeenCalledWith(1, false)
  })
})
