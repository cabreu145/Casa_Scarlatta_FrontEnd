import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import SaleConfirmationCard from './SaleConfirmationCard'

describe('SaleConfirmationCard', () => {
  const onViewTicket = vi.fn()
  const onSendWhatsApp = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    onViewTicket.mockReset()
    onSendWhatsApp.mockReset()
    onClose.mockReset()
  })

  test('renderiza resumen y usa urls publicas', async () => {
    const user = userEvent.setup()

    render(
      <SaleConfirmationCard
        folio='POS-000100'
        paymentMethod='cash'
        dateTime='2026-06-08T12:00:00'
        subtotalAmount={200}
        taxAmount={32}
        totalAmount={232}
        publicTicketImageUrl='http://api.test/api/v1/public/tickets/abc123.png'
        publicTicketUrl='http://api.test/api/v1/public/tickets/abc123'
        onViewTicket={onViewTicket}
        onSendWhatsApp={onSendWhatsApp}
        onClose={onClose}
      />
    )

    expect(screen.getByRole('dialog', { name: /Venta completada/i })).toBeInTheDocument()
    expect(screen.getByText('Venta completada')).toBeInTheDocument()
    expect(screen.getByText('POS-000100')).toBeInTheDocument()
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
    expect(screen.getByText('$200.00')).toBeInTheDocument()
    expect(screen.getByText('$32.00')).toBeInTheDocument()
    expect(screen.getByText('$232.00')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Descargar PDF/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ver ticket/i }))
    expect(onViewTicket).toHaveBeenCalledTimes(1)

    await user.type(screen.getAllByRole('textbox').at(-1), '(55) 1234-5678')
    await user.click(screen.getByRole('button', { name: /Enviar por WhatsApp/i }))
    expect(onSendWhatsApp).toHaveBeenCalledWith('5512345678')

    await user.click(screen.getAllByRole('button', { name: /Cerrar/i })[0])
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
