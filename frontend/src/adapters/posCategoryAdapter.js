function normalizeString(value, fallback = '') {
  const raw = String(value ?? '').trim()
  return raw || fallback
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const raw = String(value ?? '').trim().toLowerCase()
  return ['1', 'true', 'active', 'activo', 'si', 'sí', 'yes'].includes(raw)
}

export function mapBackendProductCategoryToFrontend(item = {}) {
  const name = normalizeString(item.name ?? item.nombre, 'Categoría')
  return {
    id: item.id ?? item.category_id ?? item.categoryId ?? null,
    categoryId: item.id ?? item.category_id ?? item.categoryId ?? null,
    name,
    nombre: name,
    slug: normalizeString(item.slug ?? item.code ?? '', ''),
    description: normalizeString(item.description ?? item.descripcion, ''),
    isActive: toBoolean(item.is_active ?? item.isActive ?? item.activo ?? item.status === 'active'),
    active: toBoolean(item.is_active ?? item.isActive ?? item.activo ?? item.status === 'active'),
    activo: toBoolean(item.is_active ?? item.isActive ?? item.activo ?? item.status === 'active'),
    raw: item,
  }
}

export function mapBackendProductCategoriesToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendProductCategoryToFrontend)
}
