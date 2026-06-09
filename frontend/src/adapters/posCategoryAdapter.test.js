import { describe, expect, test } from 'vitest'
import { mapBackendProductCategoryToFrontend, mapBackendProductCategoriesToFrontend } from './posCategoryAdapter'

describe('posCategoryAdapter', () => {
  test('mapea categoria backend a ui', () => {
    const mapped = mapBackendProductCategoryToFrontend({
      id: 1,
      name: 'Toallas',
      slug: 'toallas',
      description: 'Accesorios de limpieza',
      is_active: true,
      created_at: '2026-06-09T10:00:00-06:00',
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
      createdAt: '2026-06-09T10:00:00-06:00',
    })
  })

  test('lista categorias mapea array', () => {
    const items = mapBackendProductCategoriesToFrontend([{ id: 2, name: 'Bebidas' }])
    expect(items[0]).toMatchObject({ id: 2, name: 'Bebidas', categoryId: 2 })
  })
})
