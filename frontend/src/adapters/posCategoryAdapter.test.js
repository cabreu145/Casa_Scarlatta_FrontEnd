import { describe, expect, test } from 'vitest'
import { mapBackendProductCategoryToFrontend, mapBackendProductCategoriesToFrontend } from './posCategoryAdapter'

describe('posCategoryAdapter', () => {
  test('mapea categoría backend a ui', () => {
    const mapped = mapBackendProductCategoryToFrontend({
      id: 1,
      name: 'Toallas',
      slug: 'toallas',
      description: 'Accesorios de limpieza',
      is_active: true,
    })

    expect(mapped).toMatchObject({
      id: 1,
      categoryId: 1,
      name: 'Toallas',
      nombre: 'Toallas',
      slug: 'toallas',
      description: 'Accesorios de limpieza',
      isActive: true,
      activo: true,
    })
  })

  test('lista categorías mapea array', () => {
    const items = mapBackendProductCategoriesToFrontend([{ id: 2, name: 'Bebidas' }])
    expect(items[0]).toMatchObject({ id: 2, name: 'Bebidas', categoryId: 2 })
  })
})
