import { describe, expect, test } from 'vitest'
import {
  mapBackendProductToFrontend,
  mapBackendSaleToFrontend,
} from './posAdapter'

describe('posAdapter', () => {
  test('mapea producto backend a frontend', () => {
    const result = mapBackendProductToFrontend({
      id: 10,
      name: 'Toalla',
      category: 'Accesorios',
      price_mxn: 120,
      stock: 5,
      status: 'active',
      description: 'Microfibra',
    })

    expect(result).toMatchObject({
      id: 10,
      nombre: 'Toalla',
      category: 'Accesorios',
      precio: 120,
      stock: 5,
      activo: true,
      description: 'Microfibra',
    })
  })

  test('mapea venta backend con urls de ticket', () => {
    const result = mapBackendSaleToFrontend({
      id: 100,
      folio: 'POS-000100',
      status: 'paid',
      customer_id: 1,
      total_mxn: 2340,
      payment_method: 'cash',
      created_at: '2026-06-08T12:00:00',
      ticket_url: '/api/v1/ventas/100/ticket',
      ticket_pdf_url: '/api/v1/ventas/100/ticket.pdf',
      public_ticket_url: 'http://127.0.0.1:8000/api/v1/public/tickets/abc123',
      items: [
        { type: 'product', item_id: 1, name: 'Toalla', quantity: 2, unit_price_mxn: 120, line_total_mxn: 240 },
      ],
    })

    expect(result).toMatchObject({
      id: 100,
      folio: 'POS-000100',
      totalMxn: 2340,
      paymentMethod: 'cash',
      ticketUrl: '/api/v1/ventas/100/ticket',
      ticketPdfUrl: '/api/v1/ventas/100/ticket.pdf',
      publicTicketUrl: 'http://127.0.0.1:8000/api/v1/public/tickets/abc123',
    })
    expect(result.items[0]).toMatchObject({
      type: 'product',
      itemId: 1,
      quantity: 2,
      unitPriceMxn: 120,
      lineTotalMxn: 240,
    })
  })
})
