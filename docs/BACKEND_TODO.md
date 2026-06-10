# BACKEND_TODO.md

## Fase 0 - Base Tecnica
- [ ] Crear proyecto FastAPI con estructura por capas (`api`, `services`, `repositories`, `models`, `schemas`).
- [ ] Configurar PostgreSQL + SQLAlchemy 2 + Alembic.
- [ ] Configurar settings por entorno (`.env`) y CORS para frontend.
- [ ] Implementar manejo estandar de errores y logging.
- [ ] Definir modelo de autenticacion JWT.

## Fase 1 - Auth, Usuarios, Configuracion
- [ ] Implementar `POST /api/auth/login`, `POST /api/auth/registro`, `GET /api/auth/me`, logout.
- [ ] Implementar reset password request/confirm.
- [ ] Implementar CRUD de usuarios y perfil `me`.
- [ ] Implementar `GET/PUT /api/configuracion` con permisos admin.
- [ ] Integrar frontend AuthContext con API real.

## Fase 2 - Clases, Reservas, Lista De Espera
- [ ] Implementar CRUD de clases + disponibilidad.
- [ ] Implementar `POST /api/reservas` con validaciones (creditos, cupo, duplicado).
- [ ] Implementar cancelacion y `no_asistio`.
- [ ] Implementar waitlist (`GET/POST/DELETE`) y promocion automatica al liberar cupo.
- [ ] Integrar frontend (`reservasService`, `ClientPanel`, `SeatSelector`).

## Fase 3 - Paquetes, Productos, POS
- [ ] Implementar CRUD de paquetes y asignacion de paquete a usuario.
- [ ] Implementar CRUD de productos y descuento de stock.
- [ ] Implementar `POST /api/ventas` (sale + items + transaccion + asignacion paquete opcional).
- [ ] Integrar frontend POS (`PuntoDeVentaSection`, `ventaService`).

## Fase 4 - Finanzas, Gastos, Cortes, Reportes
- [ ] Implementar `GET /api/finanzas/kpis`, `/dia`, `/categorias`, `/corte-hoy`, `/exportar`.
- [ ] Implementar `POST/GET/DELETE /api/gastos`.
- [ ] Implementar `GET /api/cortes` y `POST /api/cortes/ejecutar`.
- [ ] Implementar `GET /api/reportes/coaches` con tabulador.
- [ ] Integrar frontend `AdminFinanzas`, `AdminReportes`, `Dashboard`.

## Fase 5 - Notificaciones, Actividad, Email, Uploads
- [ ] Implementar notificaciones (`GET`, `POST`, marcar leida).
- [ ] Implementar actividad (`POST/GET /api/actividad`).
- [ ] Implementar `POST /api/email/send` con proveedor real y cola outbox.
- [ ] Implementar `POST /api/upload-foto` (almacenamiento seguro).

## Fase 6 - Calidad Y Produccion
- [ ] Tests unitarios y de integracion para reservas, waitlist, ventas, auth.
- [ ] Seeds iniciales (admin, coaches, paquetes, clases, configuracion).
- [ ] Observabilidad (health, metrics, tracing basico).
- [ ] Hardening seguridad (rate limit login, auditoria admin, headers).
- [ ] Plan de migracion final: remover mocks/localStorage como fuente de verdad.
