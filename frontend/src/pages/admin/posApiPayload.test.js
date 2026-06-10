import { describe, expect, test } from 'vitest'
import {
  buildPosProductApiPayload,
  buildPosSaleApiPayload,
  validatePosProductApiPayload,
  validatePosSaleApiPayload,
} from './posApiPayload'

describe('posApiPayload', () => {
  test('producto normaliza campos legacy', () => {
    const payload = buildPosProductApiPayload({
      nombre: 'Toalla',
      categoria: 'Accesorios',
      categoryId: 1,
      precio: '120',
      stock: '5',
      status: 'active',
    })

    expect(payload).toMatchObject({
      name: 'Toalla',
      category_id: 1,
      category: 'Accesorios',
      price_mxn: 120,
      stock: 5,
      status: 'active',
    })
    expect(validatePosProductApiPayload(payload)).toBeNull()
  })

  test('producto invalido rechaza datos sucios', () => {
    expect(validatePosProductApiPayload({ name: '', category_id: 1, category: 'Accesorios', price_mxn: 120, stock: 5, status: 'active' })).toBeTruthy()
    expect(validatePosProductApiPayload({ name: 'Toalla', category_id: null, category: '', price_mxn: 120, stock: 5, status: 'active' })).toBeTruthy()
    expect(validatePosProductApiPayload({ name: 'Toalla', category_id: 1, category: 'Accesorios', price_mxn: -1, stock: 5, status: 'active' })).toBeTruthy()
    expect(validatePosProductApiPayload({ name: 'Toalla', category_id: 1, category: 'Accesorios', price_mxn: 120, stock: -1, status: 'active' })).toBeTruthy()
    expect(validatePosProductApiPayload({ name: 'Toalla', category_id: 1, category: 'Accesorios', price_mxn: 120, stock: 5, status: 'broken' })).toBeTruthy()
  })

  test('venta genera payload con beneficiarios', () => {
    const payload = buildPosSaleApiPayload({
      customerId: '1',
      paymentMethod: 'cash',
      notes: 'Venta en caja',
      items: [
        { type: 'product', id: 1, quantity: 2, unitPriceMxn: 120 },
        { type: 'package', id: 2, quantity: 1, unitPriceMxn: 2100, beneficiariesText: 'a@demo.local, b@demo.local' },
      ],
    })

    expect(payload).toMatchObject({
      customer_id: 1,
      payment_method: 'cash',
      subtotal_mxn: 2340,
      tax_mxn: 374.4,
      total_mxn: 2714.4,
      notes: 'Venta en caja',
    })
    expect(payload.items[1]).toMatchObject({
      type: 'package',
      id: 2,
      beneficiaries: ['a@demo.local', 'b@demo.local'],
    })
    expect(validatePosSaleApiPayload(payload)).toBeNull()
  })

  test('venta bloquea paquete sin cliente', () => {
    const payload = buildPosSaleApiPayload({
      paymentMethod: 'cash',
      items: [{ type: 'package', id: 2, quantity: 1, unitPriceMxn: 120 }],
    })

    expect(validatePosSaleApiPayload(payload)).toBe('Selecciona cliente para vender paquete.')
  })
})
