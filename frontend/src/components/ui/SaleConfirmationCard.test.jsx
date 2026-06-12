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

  test('oculta impuesto para venta nueva sin IVA y usa urls publicas', async () => {
    const user = userEvent.setup()

    render(
      <SaleConfirmationCard
        folio='POS-000100'
        paymentMethod='cash'
        dateTime='2026-06-08T12:00:00'
        subtotalAmount={200}
        taxAmount={0}
        totalAmount={200}
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
    expect(screen.getAllByText('$200.00').length).toBeGreaterThan(0)
    expect(screen.queryByText(/Impuesto/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Descargar PDF/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ver ticket/i }))
    expect(onViewTicket).toHaveBeenCalledTimes(1)

    await user.type(screen.getAllByRole('textbox').at(-1), '(55) 1234-5678')
    await user.click(screen.getByRole('button', { name: /Enviar por WhatsApp/i }))
    expect(onSendWhatsApp).toHaveBeenCalledWith('5512345678')

    await user.click(screen.getAllByRole('button', { name: /Cerrar/i })[0])
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('muestra impuesto si snapshot histórico sí lo trae', () => {
    render(
      <SaleConfirmationCard
        folio='POS-000101'
        paymentMethod='cash'
        dateTime='2026-06-08T12:00:00'
        subtotalAmount={100}
        taxAmount={16}
        totalAmount={116}
        publicTicketUrl='http://api.test/api/v1/public/tickets/abc124'
        onViewTicket={onViewTicket}
        onSendWhatsApp={onSendWhatsApp}
        onClose={onClose}
      />
    )

    expect(screen.getByText('Impuesto')).toBeInTheDocument()
    expect(screen.getByText('$16.00')).toBeInTheDocument()
    expect(screen.getByText('$116.00')).toBeInTheDocument()
  })
})
