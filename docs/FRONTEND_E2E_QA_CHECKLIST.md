# FRONTEND_E2E_QA_CHECKLIST.md

## Objetivo
Checklist de QA visual multi-rol para validar integraciÃ³n frontend-backend con APIs reales activas:
- Auth
- Clases (lectura)
- Reservas
- Waitlist

Sin cambios funcionales en backend ni refactor de frontend.

## Flags de ejecuciÃ³n QA
Configurar `frontend/.env`:
- `VITE_API_BASE_URL=http://127.0.0.1:8000`
- `VITE_API_PREFIX=/api/v1`
- `VITE_USE_API_AUTH=true`
- `VITE_USE_API_CLASSES=true`
- `VITE_USE_API_RESERVATIONS=true`
- `VITE_USE_API_WAITLIST=true`

## Datos demo
- Cliente: `cliente@casascarlatta.local / cliente123`
- Admin: `admin@casascarlatta.local / admin123`
- Coach: `coach@casascarlatta.local / coach123`
- Clase de prueba sugerida: `Clase Demo Reservable API` (si existe en backend local)

## Checklist por rol

## Cliente
- [ ] Login exitoso con credenciales demo.
- [ ] Logout limpia sesiÃ³n y redirige correctamente.
- [ ] Vista de clases carga datos reales sin errores de render.
- [ ] Reservar `Clase Demo Reservable API` (o clase disponible equivalente).
- [ ] Ver reserva en panel de cliente (`Mis clases` / historial).
- [ ] Cancelar reserva creada en misma sesiÃ³n.
- [ ] Confirmar refresco de reservas despuÃ©s de cancelar (`reservas/me`).
- [ ] Confirmar refresco de clases/cupo despuÃ©s de cancelar (`clases`).
- [ ] Unirse a waitlist en clase llena (si existe escenario).
- [ ] Salir de waitlist de la clase.
- [ ] Verificar que no hay promociÃ³n FIFO local en frontend al cancelar (backend source of truth).
- [ ] Verificar que waitlist visible por defecto no muestra entradas canceladas.

## Admin
- [ ] Login exitoso con credenciales admin.
- [ ] Panel admin carga clases reales sin romper UI.
- [ ] Validar que componentes admin toleran payload backend actual.
- [ ] Revisar vistas de reservas si el panel actual las expone.
- [ ] Revisar vistas de waitlist si el panel actual las expone.
- [ ] Confirmar que UI no dispara mutaciones no integradas en esta fase.

## Coach
- [ ] Login exitoso con credenciales coach.
- [ ] Ver clases asignadas (si UI actual lo soporta).
- [ ] Confirmar que UI no rompe si backend no entrega `coach_name` en algunos listados.
- [ ] Revisar vista de reservas/lista de clase (si UI actual la expone).

## Network esperado (DevTools)
Durante pruebas, validar requests:
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/clases`
- `POST /api/v1/reservas`
- `GET /api/v1/reservas/me`
- `POST /api/v1/reservas/{id}/cancelar`
- `GET /api/v1/lista-espera?occurrenceId=...`
- `POST /api/v1/lista-espera`
- `DELETE /api/v1/lista-espera/{id}`

## Contrato waitlist (backend actualizado)
- `GET /api/v1/lista-espera?occurrenceId=...` devuelve por defecto solo entradas activas:
  - `esperando`
  - `notificado`
- Para historial completo:
  - `includeCanceled=true`
- Para filtrar por estado:
  - `status=esperando|notificado|cancelado|asignado|expirado`
- El frontend actual debe operar sobre el default activo (sin `includeCanceled`).

## Criterios de salida QA
- Login/boot sesiÃ³n estable en 3 roles.
- Flujos crÃ­ticos cliente (reservar/cancelar/waitlist) sin error visible.
- Refetch de datos posterior a mutaciones observado en Network.
- Sin errores de consola bloqueantes.
- Sin regresiones en modo fallback cuando flags API se desactiven.

## Pendientes
- POS/finanzas.
- Notificaciones/email reales.
- Deuda de lint global.
- Evidencia visual/screenshots por flujo.
- QA multi-rol completo en navegador (corrida formal con registro).
- Confirmar si paneles admin/coach requieren endpoints adicionales.

