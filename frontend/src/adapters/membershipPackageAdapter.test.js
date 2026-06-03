import { describe, expect, test } from 'vitest'
import { mapMembershipPackageToFrontend } from './membershipPackageAdapter'

describe('membershipPackageAdapter', () => {
  test('mapea catalogo backend a shape frontend', () => {
    expect(mapMembershipPackageToFrontend({
      id: 2,
      name: 'Mensual 12',
      credits: 12,
      price_mxn: 2100,
      is_active: true,
<<<<<<< HEAD
<<<<<<< HEAD
      description: 'Plan mensual',
=======
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
=======
      description: 'Plan mensual',
>>>>>>> 6793846 (feat: add payment tracking tests and implement payment UI logic)
    })).toEqual({
      id: 2,
      nombre: 'Mensual 12',
      precio: 2100,
      creditos: 12,
      clases: 12,
      vigencia: null,
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 6793846 (feat: add payment tracking tests and implement payment UI logic)
      descripcion: 'Plan mensual',
      beneficios: [],
      destacado: false,
      isActive: true,
      raw: {
        id: 2,
        name: 'Mensual 12',
        credits: 12,
        price_mxn: 2100,
        is_active: true,
        description: 'Plan mensual',
      },
<<<<<<< HEAD
=======
      beneficios: [],
      destacado: false,
      isActive: true,
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
=======
>>>>>>> 6793846 (feat: add payment tracking tests and implement payment UI logic)
    })
  })
})
