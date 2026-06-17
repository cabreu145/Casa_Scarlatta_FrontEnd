import { describe, expect, test } from 'vitest'
import { buildPackageApiPayload, validatePackageApiPayload } from './packageApiPayload'

describe('packageApiPayload', () => {
  test('mapea campos legacy y comparte paquete', () => {
    const payload = buildPackageApiPayload({
      nombre: ' Mensual 12 ',
      numClases: '12',
      precio: '2100',
      vigencia: '30',
      destacado: true,
      limitOneSpotPerOccurrence: true,
      descripcion: 'Acceso a clases\nReserva prioritaria',
      compartible: true,
      maxParticipantes: '1',
    })

    expect(payload).toEqual({
      name: 'Mensual 12',
      credits: 12,
      price_mxn: 2100,
      duration_days: 30,
      is_active: true,
      is_featured: true,
      benefits: ['Acceso a clases', 'Reserva prioritaria'],
      is_shareable: true,
      max_beneficiaries: 1,
      limit_one_spot_per_occurrence: true,
      purchase_once_per_user: false,
    })
    expect(validatePackageApiPayload(payload)).toBeNull()
  })

  test('rechaza credits 0', () => {
    const payload = buildPackageApiPayload({
      nombre: 'Cero',
      numClases: '0',
      precio: '0',
      vigencia: '30',
    })

    expect(payload.credits).toBeNull()
    expect(validatePackageApiPayload(payload)).toContain('créditos')
  })

  test('no manda unlimited ni type', () => {
    const payload = buildPackageApiPayload({
      nombre: 'Pack',
      clases: '8',
      tipo: 'individual',
      precio: '999',
      vigencia: '30',
      benefits: ['Uno'],
    })

    expect(payload).not.toHaveProperty('tipo')
    expect(payload).not.toHaveProperty('is_unlimited')
    expect(payload.credits).toBe(8)
  })

  test('name es opcional y shareable false fuerza max 0', () => {
    const payload = buildPackageApiPayload({
      nombre: '',
      clases: '12',
      precio: '2100',
      vigencia: '30',
      compartible: false,
      maxParticipantes: '3',
    })

    expect(payload.name).toBeNull()
    expect(payload.is_shareable).toBe(false)
    expect(payload.max_beneficiaries).toBe(0)
    expect(payload.limit_one_spot_per_occurrence).toBe(false)
    expect(payload.purchase_once_per_user).toBe(false)
    expect(validatePackageApiPayload(payload)).toBeNull()
  })

  test('shareable true exige beneficiarios', () => {
    const payload = buildPackageApiPayload({
      nombre: 'Compartible',
      clases: '12',
      precio: '2100',
      vigencia: '30',
      compartible: true,
      maxParticipantes: '0',
    })

    expect(validatePackageApiPayload(payload)).toContain('beneficiarios')
  })

  test('acepta snake_case para límite de un lugar por clase', () => {
    const payload = buildPackageApiPayload({
      nombre: 'Ilimitado controlado',
      clases: '30',
      precio: '2500',
      vigencia: '30',
      limit_one_spot_per_occurrence: true,
    })

    expect(payload.limit_one_spot_per_occurrence).toBe(true)
    expect(validatePackageApiPayload(payload)).toBeNull()
  })

  test('mapea purchaseOncePerUser en create y edit', () => {
    const payloadTrue = buildPackageApiPayload({
      nombre: 'First Class',
      clases: '1',
      precio: '300',
      vigencia: '7',
      purchaseOncePerUser: true,
    })
    const payloadFalse = buildPackageApiPayload({
      nombre: 'Mensual',
      clases: '12',
      precio: '2100',
      vigencia: '30',
      purchase_once_per_user: false,
    })

    expect(payloadTrue.purchase_once_per_user).toBe(true)
    expect(payloadFalse.purchase_once_per_user).toBe(false)
    expect(validatePackageApiPayload(payloadTrue)).toBeNull()
    expect(validatePackageApiPayload(payloadFalse)).toBeNull()
  })
})
