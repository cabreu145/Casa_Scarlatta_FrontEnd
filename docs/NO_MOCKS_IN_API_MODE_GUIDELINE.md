# NO_MOCKS_IN_API_MODE_GUIDELINE.md

## Objetivo
Definir regla obligatoria de consistencia de datos: cuando módulos API están activos, frontend no debe mostrar datos mock/hardcoded como si fueran reales.

## Definiciones
- Source of truth: origen autoritativo del estado de negocio actual.
- Cache UI: estado temporal/local para render y experiencia de usuario.
- Modo API activo: flag de módulo en `true`.

## Reglas por módulo

## Auth
Cuando `VITE_USE_API_AUTH=true`:
- No usar usuario mock como fuente de verdad.
- Sesión/usuario vigente debe derivar de `login` + `GET /auth/me`.
- Datos persistidos locales solo como cache transitoria.

## Clases
Cuando `VITE_USE_API_CLASSES=true`:
- No usar `CLASES_MOCK` como fuente de verdad.
- Listados/estado de clase deben reflejar API.
- Si faltan campos en contrato, usar fallback visual neutro (`N/D`, `Coach #id`) sin inventar datos de negocio.

## Reservas
Cuando `VITE_USE_API_RESERVATIONS=true`:
- No usar reservas mock/localStorage como fuente de verdad.
- Backend define estado de reserva, cupo y créditos.
- Frontend no debe mutar reglas core localmente como autoridad final.

## Waitlist
Cuando `VITE_USE_API_WAITLIST=true`:
- No usar waitlist mock/localStorage como fuente de verdad.
- Backend define altas/bajas/orden/promoción.
- Frontend usa lectura activa por defecto y cache local solo para render.

## Regla fallback
Mocks/localStorage pueden usarse solo cuando flag del módulo está en `false`.

## Si falta endpoint backend
- Mostrar estado vacío controlado.
- Mostrar mensaje “pendiente de integración”.
- Registrar gap en documentación técnica.
- No simular éxito con datos falsos.

## Patrón recomendado para stores
- Store = cache UI + estado de interacción (loading/error/selección).
- API = source of truth.
- Después de mutación:
  - invalidar/refrescar datos afectados
  - reconciliar store con respuesta API
- Evitar doble escritura conflictiva (`store local` + `backend`) para mismas reglas de negocio.

## Anti-patrones prohibidos en modo API activo
- Métricas hardcodeadas en dashboards.
- Inyectar registros mock en listados reales.
- Calcular créditos/cupos/FIFO localmente como estado final.
- Mostrar “historial local” mezclado con datos API sin etiqueta clara.

## Checklist rápido de cumplimiento
- [ ] Cada pantalla en modo API declara explícitamente fuente de datos backend.
- [ ] No existen imports mock usados para render funcional en modo API.
- [ ] Empty states definidos para datos no disponibles.
- [ ] Refetch posterior a mutaciones críticas implementado.
- [ ] QA visual confirma consistencia tras refresh/relogin.
