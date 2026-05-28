# BACKEND_IMPLEMENTATION_ANALYSIS.md

## Resumen Ejecutivo
El frontend actual de Casa Scarlatta opera como SPA React con estado persistido en localStorage (Zustand) y reglas de negocio en servicios frontend. No existe integracion real HTTP: `frontend/src/lib/http.js` devuelve `null` y los stores usan mocks (`mockData.js`, `mockUsers.js`).

El backend FastAPI debe asumir toda logica critica: autenticacion, autorizacion por rol, reservas, cupos, lista de espera, paquetes/creditos, POS, finanzas, actividad, notificaciones y configuracion. El frontend esta preparado para migracion progresiva archivo por archivo, sin reescribir UI.

## Objetivo Del Backend
Construir API REST robusta en Python/FastAPI para reemplazar mocks/localStorage y centralizar:
- Fuente unica de verdad de datos.
- Reglas de negocio transaccionales (reservas/cupos/creditos/ventas).
- Seguridad (JWT, roles, auditoria).
- Observabilidad y trazabilidad operativa.
- Escalabilidad multiusuario real.

## Alcance Funcional
Incluido en primera version backend:
- Auth y sesiones por rol (`cliente`, `coach`, `admin`).
- Usuarios y perfiles.
- Coaches e informacion publica.
- Clases/sesiones y disponibilidad.
- Reservas + cancelacion + no asistencia.
- Lista de espera con asignacion automatica.
- Paquetes/membresias y creditos.
- POS: ventas de paquetes/productos, stock, transacciones.
- Finanzas: KPIs, gastos, cortes de caja, reportes.
- Configuracion editable del estudio.
- Actividad/auditoria y notificaciones.
- Servicio de email asincrono.

Fuera de alcance inicial (fase posterior):
- Gateway real de pagos online.
- Push notifications moviles.
- Multi-sede.
- BI avanzado externo.

## Modulos Requeridos Del Backend
- `auth`
- `users`
- `coaches`
- `classes`
- `reservations`
- `waitlist`
- `packages`
- `products`
- `sales` (POS)
- `transactions`
- `expenses`
- `cash_closings`
- `finance_reports`
- `activity_logs`
- `notifications`
- `settings`
- `emails`
- `uploads`

## Entidades Principales Del Dominio
- User
- Role
- CoachProfile
- ClassSession
- Reservation
- WaitlistEntry
- PackageDefinition
- UserPackageSubscription
- Product
- Sale
- SaleItem
- FinancialTransaction
- Expense
- CashClosing
- Notification
- ActivityEvent
- AppSetting
- EmailOutbox

## Modelo De Datos Sugerido
### User
- id (uuid)
- nombre
- email (unique)
- password_hash
- rol (`cliente|coach|admin`)
- activo
- telefono
- genero
- fecha_nacimiento
- fecha_registro
- coach_profile_id (nullable)
- created_at, updated_at

### CoachProfile
- id (uuid)
- user_id (fk users)
- especialidad
- bio
- foto_url
- instagram
- rating (nullable)
- activo

### ClassSession
- id (uuid)
- nombre
- tipo (`Stryde X|Slow`)
- dia_semana (nullable)
- fecha (nullable, YYYY-MM-DD)
- hora_inicio
- duracion_min
- coach_id (fk users nullable)
- coach_nombre_cache
- cupo_max
- cupo_actual
- descripcion
- publicar_en (nullable datetime)
- estado (`programada|cancelada|finalizada`)
- created_at, updated_at

### Reservation
- id (uuid)
- user_id (fk users)
- class_session_id (fk class_sessions)
- asiento (nullable)
- estado (`confirmada|cancelada|completada|no_asistio`)
- fecha_clase_cache
- hora_clase_cache
- tipo_cache
- coach_nombre_cache
- created_at, updated_at, canceled_at

### WaitlistEntry
- id (uuid)
- class_session_id (fk)
- user_id (fk)
- posicion
- estado (`esperando|notificado|expirado|asignado|cancelado`)
- joined_at
- notified_at (nullable)
- expires_at (nullable)

### PackageDefinition
- id (uuid)
- nombre
- precio
- clases (0=ilimitado)
- vigencia_dias
- categoria (`mensual|pack`)
- beneficios_json
- destacado
- activo

### UserPackageSubscription
- id (uuid)
- user_id
- package_id
- tipo (`individual|compartido`)
- clases_total
- clases_restantes
- vigencia_inicio
- vigencia_fin
- estado (`activo|vencido|cancelado`)
- grupo_id (nullable)
- metadata_json

### Product
- id (uuid)
- nombre
- categoria
- precio
- stock
- activo
- imagen_url

### Sale / SaleItem
- Sale:
  - id (uuid)
  - admin_id
  - user_id (nullable)
  - subtotal
  - iva
  - total
  - metodo_pago (`efectivo|tarjeta|transferencia`)
  - monto_pagado
  - cambio
  - canal (`recepcion|online`)
  - origen (`pdv|web`)
  - created_at
- SaleItem:
  - id (uuid)
  - sale_id
  - item_type (`paquete|producto`)
  - item_id (nullable)
  - nombre
  - cantidad
  - precio_unitario
  - total_linea

### FinancialTransaction
- id (uuid)
- user_id (nullable)
- tipo (`paquete|producto|reembolso|ajuste|gasto`)
- concepto
- monto
- fecha
- hora
- canal
- metodo_pago
- referencia
- metadata_json

### Expense
- id (uuid)
- concepto
- tipo (`operativo|sueldo|servicio|insumo|inventario`)
- monto
- admin_id
- fecha
- hora

### CashClosing
- id (uuid)
- fecha
- turno (`manana|tarde`)
- monto_inicial
- total_efectivo
- total_tarjeta
- total_transferencia
- total_ingresos
- monto_cierre
- total_reservas
- total_cancelaciones
- ejecutado_por
- estado (`cerrado`)

### Notification
- id (uuid)
- user_id
- tipo (`reserva|cancelacion|paquete|sistema`)
- titulo
- mensaje
- leida
- fecha
- created_at

### ActivityEvent
- id (uuid)
- tipo (catalogo equivalente a `TIPOS_EVENTO` en frontend)
- descripcion
- usuario_nombre
- usuario_id (nullable)
- meta_json
- timestamp
- fecha

### AppSetting
- key (pk)
- value_json
- updated_by
- updated_at

### EmailOutbox
- id (uuid)
- plantilla
- destinatario
- payload_json
- estado (`pending|sent|failed`)
- error
- attempts
- created_at, sent_at

## Relaciones Entre Entidades
- User 1:N Reservation
- User 1:N Notification
- User 1:N ActivityEvent (opcional)
- User 1:N Sale (como cliente opcional)
- User 1:N Expense (como admin)
- User 1:1 CoachProfile (rol coach)
- CoachProfile/User 1:N ClassSession
- ClassSession 1:N Reservation
- ClassSession 1:N WaitlistEntry
- PackageDefinition 1:N UserPackageSubscription
- User 1:N UserPackageSubscription
- Sale 1:N SaleItem

## Endpoints REST Necesarios
### Auth
- `POST /api/auth/login`
- `POST /api/auth/registro`
- `POST /api/auth/logout`
- `POST /api/auth/reset-password/request`
- `POST /api/auth/reset-password/confirm`
- `GET /api/auth/me`

### Usuarios
- `GET /api/usuarios`
- `GET /api/usuarios/{id}`
- `POST /api/usuarios`
- `PUT /api/usuarios/{id}`
- `DELETE /api/usuarios/{id}`
- `GET /api/usuarios/me`
- `GET /api/usuarios/{id}/progreso?mes=YYYY-MM`

### Coaches
- `GET /api/coaches`
- `GET /api/coaches/{id}`
- `POST /api/coaches`
- `PUT /api/coaches/{id}`
- `DELETE /api/coaches/{id}` (baja logica)
- `DELETE /api/coaches/{id}/hard`

### Clases
- `GET /api/clases`
- `GET /api/clases/{id}`
- `POST /api/clases`
- `PUT /api/clases/{id}`
- `DELETE /api/clases/{id}`
- `GET /api/clases/{id}/disponibilidad`

### Reservas
- `GET /api/reservas`
- `POST /api/reservas`
- `GET /api/reservas/{id}`
- `POST /api/reservas/{id}/cancelar`
- `POST /api/reservas/{id}/no-asistio`
- `POST /api/reservas/{id}/completar`

### Lista De Espera
- `GET /api/lista-espera?claseId=...`
- `POST /api/lista-espera`
- `DELETE /api/lista-espera/{id}`

### Paquetes
- `GET /api/paquetes`
- `POST /api/paquetes`
- `PUT /api/paquetes/{id}`
- `DELETE /api/paquetes/{id}`
- `POST /api/paquetes/comprar`
- `POST /api/paquetes/asignar`
- `POST /api/paquetes/compartir`

### Productos
- `GET /api/productos`
- `POST /api/productos`
- `PUT /api/productos/{id}`
- `DELETE /api/productos/{id}`
- `POST /api/productos/{id}/descontar-stock`

### Ventas / Transacciones / Finanzas
- `POST /api/ventas`
- `GET /api/transacciones`
- `GET /api/transacciones?ano=&mes=`
- `GET /api/finanzas/dia`
- `GET /api/finanzas/categorias?rango=`
- `GET /api/finanzas/kpis`
- `GET /api/finanzas/corte-hoy`
- `GET /api/finanzas/exportar`
- `GET /api/reportes/coaches`

### Gastos / Cortes
- `POST /api/gastos`
- `GET /api/gastos`
- `DELETE /api/gastos/{id}`
- `GET /api/cortes`
- `POST /api/cortes/ejecutar`

### Notificaciones / Actividad / Configuracion
- `GET /api/notificaciones`
- `POST /api/notificaciones`
- `POST /api/notificaciones/{id}/leida`
- `POST /api/actividad`
- `GET /api/actividad`
- `GET /api/configuracion`
- `PUT /api/configuracion`

### Email / Uploads
- `POST /api/email/send`
- `POST /api/upload-foto`

## Contratos Request/Response Sugeridos
### POST /api/auth/login
Request:
```json
{ "email": "cliente@casascarlatta.com", "password": "123456" }
```
Response 200:
```json
{ "access_token": "jwt", "token_type": "bearer", "user": { "id": "...", "rol": "cliente", "nombre": "...", "email": "..." } }
```

### POST /api/reservas
Request:
```json
{ "user_id": "uuid", "class_session_id": "uuid", "asiento": "Fila 1, Asiento 2" }
```
Response 201:
```json
{ "id": "uuid", "estado": "confirmada", "creditos_restantes": 7, "cupo_actual": 19 }
```

### POST /api/ventas
Request:
```json
{
  "items": [{ "item_type": "producto", "item_id": "uuid", "name": "Botella", "price": 350, "qty": 1 }],
  "subtotal": 350,
  "iva": 56,
  "total": 406,
  "metodo_pago": "efectivo",
  "monto_pagado": 500,
  "cambio": 94,
  "pending_asignacion": { "user_id": "uuid", "package_id": "uuid" }
}
```
Response 201:
```json
{ "sale_id": "uuid", "transaction_id": "uuid", "ok": true }
```

### Error estandar
```json
{ "error": { "code": "BUSINESS_RULE_VIOLATION", "message": "Sin creditos disponibles", "details": {} } }
```

## Reglas De Negocio Detectadas Desde El Frontend
- Cliente no puede reservar sin creditos, excepto ilimitado (`clasesPaquete=999`).
- No duplicar reserva confirmada por usuario+clase.
- Clase llena bloquea reserva directa.
- Cancelacion solo en estado confirmada.
- `no_asistio` no devuelve credito.
- Cancelacion devuelve credito si no ilimitado.
- Al cancelar y existir lista de espera: asignar al primero automaticamente, descontar credito, notificar/email.
- Umbral 80% de capacidad dispara notificacion admin.
- Eliminar coach deja clases en `Sin asignar`.
- Venta POS con paquete actualiza creditos y crea transaccion.
- Gasto siempre asociado a admin y fecha/hora.
- Corte por turno no debe duplicarse (`fecha+turno`).

## Flujo Completo De Reservas
1. Cliente elige clase disponible.
2. API valida auth, estado usuario, creditos, cupo, duplicado.
3. Crea reserva `confirmada` en transaccion DB.
4. Ajusta `cupo_actual` de clase.
5. Descuenta creditos/subscripcion usuario.
6. Crea actividad + notificaciones.
7. Encola email confirmacion.
8. Responde reserva + saldo actualizado.

Cancelacion:
1. Valida ownership + estado confirmada + ventana de cancelacion (configurable).
2. Cambia estado a `cancelada`.
3. Devuelve credito si aplica.
4. Decrementa cupo.
5. Si hay waitlist: promueve primer registro y vuelve a incrementar cupo (neto 0), descuenta credito nuevo usuario.
6. Encola emails cancelacion y lugar asignado.

## Flujo De Autenticacion Y Roles
- Login por email/password.
- JWT access token (y refresh opcional).
- RBAC:
  - `cliente`: reservas propias, perfil, pagos propios.
  - `coach`: ver clases asignadas, alumnos de su clase.
  - `admin`: CRUD operativo completo, finanzas y settings.
- Middleware de autorizacion por rol + ownership checks.

## Flujo De Clientes/Usuarios
- Registro cliente (publico) crea user activo rol cliente.
- Admin puede crear/editar/desactivar clientes.
- Perfil cliente editable excepto email.
- Progreso mensual calculado por mes y estados de reserva.

## Flujo De Coaches/Instructores
- Crear coach debe crear user rol coach de login.
- Baja logica coach: `activo=false` y clases sin asignar.
- Eliminacion dura: remover coach + user asociado (con restricciones/auditoria).

## Flujo De Clases/Sesiones
- Clase puede ser por `fecha` especifica o recurrente por `dia_semana`.
- Campo `publicar_en` controla visibilidad publica.
- Disponibilidad = `cupo_max - cupo_actual`.
- Import masivo (excel) en frontend hoy; backend debe soportar batch create opcional (`POST /api/clases/batch`).

## Flujo De Membresias, Creditos O Paquetes
- Paquetes con clases finitas o ilimitadas.
- Asignacion individual y compartida (grupo_id).
- Renovacion resetea/actualiza creditos y vigencia.
- Compra online y compra en recepcion comparten logica de transaccion.

## Flujo De Lista De Espera
- Unico registro activo por usuario+clase.
- Orden FIFO por `joined_at`.
- Estados: esperando/notificado/expirado/asignado/cancelado.
- Estrategia actual frontend: asignacion automatica directa al liberar lugar.

## Flujo De Notificaciones
- Eventos: reserva, cancelacion, paquete, sistema.
- Inbox por usuario (`leida` boolean).
- Triggers de backend en eventos de negocio.

## Flujo De POS/Ventas/Finanzas
- POS arma carrito de productos/paquetes.
- Checkout crea `sale`, `sale_items`, `financial_transaction`.
- Si venta de paquete para cliente: asignar subscripcion/creditos en misma transaccion.
- Finanzas consume transacciones + gastos + cortes para KPIs/reportes.

## Validaciones Necesarias
- Email unico y formato valido.
- Password hash obligatorio en alta/login.
- `cupo_actual <= cupo_max`.
- Montos no negativos salvo transacciones tipo reembolso.
- `metodo_pago` catalogo permitido.
- No duplicar corte por fecha+turno.
- No stock negativo en productos.
- Reserva solo para clases publicadas (segun caso de uso cliente).

## Manejo De Errores
- 400 validacion de payload.
- 401 no autenticado.
- 403 rol/permiso invalido.
- 404 recurso no encontrado.
- 409 conflicto de negocio (cupo, duplicado, creditos).
- 422 regla de dominio violada.
- 500 error interno.

Estandarizar `error.code` para frontend:
- `INSUFFICIENT_CREDITS`
- `CLASS_FULL`
- `DUPLICATE_RESERVATION`
- `RESERVATION_NOT_CANCELABLE`
- `INVALID_ROLE`
- `STOCK_UNAVAILABLE`

## Estados Posibles Por Entidad
- User: `activo|inactivo`
- CoachProfile: `activo|inactivo`
- ClassSession: `programada|cancelada|finalizada`
- Reservation: `confirmada|cancelada|completada|no_asistio`
- WaitlistEntry: `esperando|notificado|expirado|asignado|cancelado`
- UserPackageSubscription: `activo|vencido|cancelado`
- CashClosing: `cerrado`
- Notification: `leida=true|false`
- EmailOutbox: `pending|sent|failed`

## Seguridad Y Autorizacion Por Rol
- JWT bearer con expiracion corta.
- Password hashing con `passlib[argon2]` o `bcrypt`.
- CORS limitado a dominio frontend.
- Rate limit en login/reset password.
- Auditoria de operaciones admin.
- Validacion ownership (cliente solo ve/modifica lo suyo).
- Secrets solo por env vars.

## Variables De Entorno Sugeridas
- `APP_NAME=Casa Scarlatta API`
- `APP_ENV=dev|staging|prod`
- `APP_DEBUG=false`
- `API_PREFIX=/api`
- `DATABASE_URL=postgresql+psycopg://...`
- `REDIS_URL=redis://...` (colas/caching opcional)
- `JWT_SECRET_KEY=...`
- `JWT_ALGORITHM=HS256`
- `JWT_ACCESS_TOKEN_MINUTES=30`
- `JWT_REFRESH_TOKEN_DAYS=7`
- `CORS_ORIGINS=http://localhost:5173`
- `EMAIL_PROVIDER=resend|sendgrid|smtp`
- `EMAIL_API_KEY=...`
- `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD`
- `UPLOADS_DIR=./uploads`
- `TIMEZONE=America/Mexico_City`

## Estructura Recomendada Del Proyecto FastAPI
```text
backend/
  app/
    main.py
    api/
      deps.py
      v1/
        router.py
        endpoints/
          auth.py
          users.py
          coaches.py
          classes.py
          reservations.py
          waitlist.py
          packages.py
          products.py
          sales.py
          transactions.py
          expenses.py
          cash_closings.py
          finance_reports.py
          notifications.py
          activity.py
          settings.py
          emails.py
          uploads.py
    core/
      config.py
      security.py
      exceptions.py
      logging.py
    db/
      base.py
      session.py
      models/
        user.py
        coach.py
        class_session.py
        reservation.py
        waitlist.py
        package.py
        subscription.py
        product.py
        sale.py
        transaction.py
        expense.py
        cash_closing.py
        notification.py
        activity.py
        setting.py
        email_outbox.py
    schemas/
      auth.py
      users.py
      classes.py
      reservations.py
      ...
    repositories/
      users_repo.py
      reservations_repo.py
      ...
    services/
      auth_service.py
      reservation_service.py
      waitlist_service.py
      sales_service.py
      finance_service.py
      notification_service.py
      email_service.py
    workers/
      email_worker.py
      maintenance_jobs.py
  alembic/
  tests/
  pyproject.toml
```

## Capas Sugeridas
- Routers: HTTP I/O, auth deps, status codes.
- Schemas: Pydantic request/response.
- Services: reglas de negocio y transacciones.
- Repositories: consultas SQLAlchemy.
- Models: entidades ORM.
- Config: settings, security, startup.

## Librerias Recomendadas
- `fastapi`
- `uvicorn[standard]`
- `pydantic-settings`
- `sqlalchemy>=2`
- `alembic`
- `psycopg[binary]`
- `passlib[argon2]` o `bcrypt`
- `python-jose[cryptography]` o `pyjwt`
- `httpx`
- `tenacity` (retries)
- `structlog` o `loguru`
- `celery`/`rq` (opcional async jobs)
- `pytest`, `pytest-asyncio`, `factory-boy`

## Base De Datos Recomendada
PostgreSQL.
Motivos:
- Integridad referencial fuerte.
- Transacciones ACID para reservas/ventas.
- Buen soporte JSONB para metadata.
- Escalable para reporteria.

## Migraciones
- Alembic desde dia 1.
- Convencion: `YYYYMMDD_HHMM_<modulo>_<accion>.py`.
- Nunca editar migraciones aplicadas; crear nuevas.

## Seed Data Inicial
Semillas minimas:
- Usuario admin inicial.
- 2-3 coaches.
- 6 paquetes base (Basico, Esencial, Premium, Primera Clase, Pack 5, Pack 20).
- 8-12 clases ejemplo.
- Configuracion default (`horasCancelacion=6`, `maxListaEspera=10`).
- Catalogo base de productos.

## Estrategia Para Reemplazar Mocks/LocalStorage Del Frontend
1. Mantener interfaz de servicios frontend (`reservasService`, `ventaService`, etc.).
2. Activar `frontend/src/lib/http.js` con fetch real.
3. Migrar por modulo:
   - primero lectura (`GET`) + feature flag.
   - luego escrituras (`POST/PUT/DELETE`).
4. Reducir dependencia de stores persistidos para entidades de servidor.
5. Dejar Zustand como cache/UI state, no como fuente de verdad.

## Mapa Frontend ? Backend
- `frontend/src/context/AuthContext.jsx`
  - `login` ? `POST /api/auth/login`
  - `register` ? `POST /api/auth/registro`
  - `resetPassword` ? `POST /api/auth/reset-password/request`
- `frontend/src/services/reservasService.js`
  - `reservarClase` ? `POST /api/reservas`
  - `cancelarReserva` ? `POST /api/reservas/{id}/cancelar`
  - `marcarNoAsistio` ? `POST /api/reservas/{id}/no-asistio`
  - `eliminarClaseConReservas` ? `DELETE /api/clases/{id}` (+ cascada)
- `frontend/src/stores/listaEsperaStore.js`
  - `unirse` ? `POST /api/lista-espera`
  - `getPorClase` ? `GET /api/lista-espera?claseId=`
  - `salir` ? `DELETE /api/lista-espera/{id}`
- `frontend/src/services/usuariosService.js`
  - `registrarClienteService` ? `POST /api/usuarios`
  - `asignarPaqueteService` ? `POST /api/paquetes/asignar`
  - `editarPerfilService` ? `PUT /api/usuarios/{id}`
- `frontend/src/services/coachesService.js`
  - `crearCoachService` ? `POST /api/coaches`
  - `editarCoachService` ? `PUT /api/coaches/{id}`
  - `eliminarCoachService` ? `DELETE /api/coaches/{id}`
  - `borrarCoachService` ? `DELETE /api/coaches/{id}/hard`
- `frontend/src/services/paquetesService.js`
  - CRUD paquetes ? `/api/paquetes`
- `frontend/src/services/ventaService.js`
  - `procesarVentaService` ? `POST /api/ventas`
  - `getDailyIncome` ? `GET /api/finanzas/dia`
  - `getIncomeByCategory` ? `GET /api/finanzas/categorias`
- `frontend/src/services/finanzasService.js`
  - `getKpisFinanzas` ? `GET /api/finanzas/kpis`
  - `getDatosCorteHoy` ? `GET /api/finanzas/corte-hoy`
  - `getReporteCoaches` ? `GET /api/reportes/coaches`
  - `getTransaccionesParaExportar` ? `GET /api/finanzas/exportar`
- `frontend/src/stores/configuracionStore.js`
  - `get/actualizar` ? `GET/PUT /api/configuracion`
- `frontend/src/services/actividadService.js`
  - `registrar` ? `POST /api/actividad`
- `frontend/src/services/emailService.js`
  - `enviarEmail` ? `POST /api/email/send`
- `frontend/src/pages/admin/AdminPanel.jsx`
  - upload fotos actual (`fetch('/api/upload-foto')`) ? `POST /api/upload-foto`

## Plan De Implementacion Por Fases
### Fase 0 - Fundacion
- Scaffold FastAPI, settings, DB, Alembic, JWT, manejo errores.
- Modelos base: users, roles, classes, reservations, packages.

### Fase 1 - Auth + Usuarios + Configuracion
- Endpoints auth y usuarios.
- `/api/configuracion`.
- Integracion frontend login/registro/me.

### Fase 2 - Clases + Reservas + Waitlist
- Endpoints clases, disponibilidad, reservas.
- Reglas transaccionales cupo/creditos/duplicados.
- Promocion automatica waitlist.

### Fase 3 - Paquetes + Productos + POS
- CRUD paquetes/productos.
- `POST /api/ventas` con impacto en creditos y stock.
- Transacciones financieras persistentes.

### Fase 4 - Finanzas + Reportes + Cortes + Gastos
- KPIs y exportes.
- Gastos y cierres de caja por turno.
- Reporte coaches con tabulador.

### Fase 5 - Notificaciones + Email + Actividad
- Inbox notificaciones.
- Outbox emails asincrono.
- Auditoria de eventos.

### Fase 6 - Hardening
- Tests integracion, carga, seguridad.
- Observabilidad, backups, runbooks.

## Criterios De Aceptacion
- Todos los flujos core funcionan sin mocks/localStorage como fuente primaria.
- Reservas y ventas son transaccionales y consistentes.
- RBAC y ownership aplicados en todos endpoints.
- Frontend consume API real en auth, reservas, clases, pagos y admin.
- Cobertura minima de tests en servicios criticos.

## Riesgos Tecnicos
- Inconsistencias actuales entre `authStore` y `usuariosStore` en creditos.
- IDs actuales mixtos (number/string) y `Date.now()`; migracion a UUID requiere normalizacion.
- Logica de fechas con `dia` y `fecha` puede generar edge cases de timezone.
- Muchas reglas viven en frontend; riesgo de divergencia durante migracion parcial.
- Lista de espera y cupos requieren locking/transacciones para evitar race conditions.

## Preguntas Abiertas
- Politica exacta de vencimiento de paquetes (dias fijos vs calendario mensual).
- Regla final de cancelacion: horas antes, excepciones, penalizaciones.
- Confirmar si waitlist es auto-asignacion inmediata (actual) o ventana de confirmacion.
- Se requiere multi-sede en roadmap cercano?
- Se requiere facturacion fiscal CFDI en POS?
- Proveedor de email definitivo?

## Proximos Pasos Para Integrar Frontend Con APIs Reales
1. Implementar backend base (Fase 0-1).
2. Activar `http.js` y token handling en frontend.
3. Migrar auth + perfil primero.
4. Migrar clases/reservas/waitlist con pruebas E2E.
5. Migrar POS y finanzas.
6. Remover dependencias de mocks gradualmente y documentar contratos versionados.
