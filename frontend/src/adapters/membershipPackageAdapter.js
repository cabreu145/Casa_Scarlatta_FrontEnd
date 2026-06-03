export function mapMembershipPackageToFrontend(payload = {}) {
  const credits = payload.credits ?? payload.clases ?? 0
  return {
    id: payload.id ?? null,
    nombre: payload.name ?? payload.nombre ?? 'Paquete',
    precio: payload.price_mxn ?? payload.precio ?? 0,
    creditos: credits,
    clases: credits,
    vigencia: payload.vigencia ?? null,
<<<<<<< HEAD
    descripcion: payload.description ?? payload.descripcion ?? '',
    beneficios: Array.isArray(payload.beneficios) ? payload.beneficios : [],
    destacado: Boolean(payload.destacado),
    isActive: payload.is_active ?? payload.isActive ?? true,
    raw: payload ?? {},
=======
    beneficios: Array.isArray(payload.beneficios) ? payload.beneficios : [],
    destacado: Boolean(payload.destacado),
    isActive: payload.is_active ?? payload.isActive ?? true,
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
  }
}
