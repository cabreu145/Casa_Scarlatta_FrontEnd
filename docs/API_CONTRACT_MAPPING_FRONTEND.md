# API_CONTRACT_MAPPING_FRONTEND.md

## Contrato vigente (modo API actual)
Aplica cuando:
- `VITE_USE_API_AUTH=true`
- `VITE_USE_API_CLASSES=true`
- `VITE_USE_API_RESERVATIONS=true`
- `VITE_USE_API_WAITLIST=true`

Reglas clave:
- Backend es source of truth en modo API.
- `POST /api/v1/reservas` requiere `occurrence_id`.
- Si falta `occurrence_id`, error esperado: `OCCURRENCE_REQUIRED`.
- Waitlist se consulta por ocurrencia, no por clase.
- Matching de reserva en UI: por `occurrence_id` (no por `class_id` plano).
- `reserved_at` solo representa fecha/hora de creación de reserva.

## Mapeo frontend -> backend (vigente)

| Archivo frontend | Función actual | Endpoint backend | Request esperado | Response esperado | Transformación necesaria | Prioridad |
|---|---|---|---|---|---|---|
| `frontend/src/context/AuthContext.jsx` | `login(email,password)` | `POST /api/v1/auth/login` | `{ email, password }` | `{ access_token, token_type, user }` | Guardar token + map user backend a shape UI | Alta |
| `frontend/src/context/AuthContext.jsx` | bootstrap sesión | `GET /api/v1/auth/me` | Header `Authorization: Bearer <token>` | `user` autenticado | map snake_case/camelCase | Alta |
| `frontend/src/context/AuthContext.jsx` | `register(datos)` | `POST /api/v1/auth/registro` | `{ email, name, password, phone?, birth_date?, gender? }` | user/auth payload | normalizar aliases de UI | Alta |
| `frontend/src/services/clasesApiService.js` | `getClasesApi()` | `GET /api/v1/clases` | Bearer token | `ClassRead[]` | `classAdapter.mapBackendClassesToFrontend` | Alta |
| `frontend/src/services/clasesApiService.js` | `getClaseByIdApi(id)` | `GET /api/v1/clases/{id}` | Bearer token | `ClassRead` | `classAdapter.mapBackendClassToFrontendClass` | Alta |
| `frontend/src/services/occurrencesApiService.js` | `getOccurrencesByClassApi(claseId,{from,to})` | `GET /api/v1/clases/{id}/ocurrencias` | query `from,to` | `ClassOccurrenceRead[]` | `occurrenceAdapter` (`id -> occurrenceId`) | Alta |
| `frontend/src/services/reservasApiService.js` | `getMisReservasApi()` | `GET /api/v1/reservas/me` | Bearer token | `ReservationRead[]` | `reservationAdapter` | Alta |
| `frontend/src/services/reservasApiService.js` | `crearReservaApi({claseId,userId,occurrenceId,asiento})` | `POST /api/v1/reservas` | `{ clase_id, user_id, occurrence_id, seat_number? }` | `ReservationRead` | `occurrence_id` obligatorio | Alta |
| `frontend/src/services/reservasApiService.js` | `cancelarReservaApi(id)` | `POST /api/v1/reservas/{id}/cancelar` | `{}` | `ReservationActionRead` | refetch/invalidate | Alta |
| `frontend/src/services/waitlistApiService.js` | `getWaitlistByOccurrenceApi(occurrenceId)` | `GET /api/v1/lista-espera?occurrenceId=...` | query `occurrenceId` | `{ occurrence_id, entries[] }` | `waitlistAdapter` | Alta |
| `frontend/src/services/waitlistApiService.js` | `unirseWaitlistApi({occurrenceId,userId})` | `POST /api/v1/lista-espera` | `{ occurrence_id, user_id }` | `WaitlistEntryRead` | `mapJoinWaitlistPayload` | Alta |
| `frontend/src/services/waitlistApiService.js` | `salirWaitlistApi(entryId)` | `DELETE /api/v1/lista-espera/{id}` | path `id` | `WaitlistEntryRead` | sync cache/refetch | Alta |
| `frontend/src/features/clases/SeatSelector.jsx` | `confirm()` reserva con asiento | `POST /api/v1/reservas` | incluye `occurrence_id` | reserva confirmada | no reservar por `class_id` plano | Alta |
| `frontend/src/services/financialStateApiService.js` | `getMyFinancialStateApi()` | `GET /api/v1/clientes/me/estado-financiero` | Bearer token (rol cliente) | `{ user_id, credits_balance, active_membership, credit_movements, transactions }` | `financialStateAdapter` (snake_case -> camelCase) | Alta |

## Waitlist en modo API (vigente)
- `GET /api/v1/lista-espera?occurrenceId=...`
- `POST /api/v1/lista-espera` con `occurrence_id`
- `DELETE /api/v1/lista-espera/{id}`

## Notas de mapeo de reservas (vigente)
- `reserved_at` => `fechaCreacionReserva`.
- Fecha/hora de sesión => `class_date` o `class_start_at`.
- Si faltan datos de ocurrencia, UI no debe afirmar reserva diaria por `class_id`.

## Notas BUG-004 (vigente)
- En modo API, `/auth/me` se usa para identidad/sesión, no para balance financiero.
- Créditos y membresía visibles en dashboard cliente salen de `GET /clientes/me/estado-financiero`.
- Tras reservar/cancelar, frontend debe refrescar estado financiero.
- `transactions` puede venir temporalmente vacío (`[]`) y la UI debe mostrar estado controlado.

## Legacy / histórico (no usar en modo API actual)
Los siguientes contratos se mantienen solo por compatibilidad de fallback/mock cuando flags API están en `false`:

- `GET /api/v1/lista-espera?claseId=...`
- `getWaitlistByClaseApi(claseId)`
- `syncClaseApi(claseId)` como ruta principal en API mode
- `POST /api/v1/reservas` sin `occurrence_id`
- matching de reservas por `class_id` plano
## Mapeo Coach Agenda (vigente)
| Archivo frontend | Función actual | Endpoint backend | Request esperado | Response esperado | Transformación necesaria | Prioridad |
|---|---|---|---|---|---|---|
| `frontend/src/services/coachAgendaApiService.js` | `getMyCoachAgendaApi({from,to})` | `GET /api/v1/coaches/me/agenda?from=...&to=...` | query `from`,`to` (max 30 días) + Bearer coach | `{ coach, from, to, occurrences[] }` | `coachAgendaAdapter` (snake_case -> camelCase) | Alta |

Notas:
- Coach dashboard en API mode consume agenda por ocurrencia real.
- No usar matching por `coachNombre` ni `class_id` plano como criterio principal en API mode.

## Mapeo Coaches Admin (vigente)
| Archivo frontend | Función actual | Endpoint backend | Request esperado | Response esperado | Transformación necesaria | Prioridad |
|---|---|---|---|---|---|---|
| `frontend/src/services/coachesApiService.js` | `getCoachesPaginatedApi({page,pageSize,search,status})` | `GET /api/v1/coaches?page=&page_size=&search=&status=` | query `page`,`page_size`,`search`,`status` | `{ page, page_size, total, items[] }` o array legacy | `coachAdapter` + `paginationAdapter` | Alta |
| `frontend/src/services/coachesApiService.js` | `getPublicCoachesApi()` | `GET /api/v1/coaches/public` | n/a | `{ coach_id, name, specialties[], primary_discipline, bio, instagram, avatar_url }[]` | `coachAdapter` | Alta |
| `frontend/src/services/coachesApiService.js` | `createCoachApi(payload)` / `updateCoachApi(id,payload)` / `updateCoachStatusApi(id,status)` / `deleteCoachApi(id)` | `POST/PUT/PATCH/DELETE /api/v1/coaches` | create: `{ name, email, phone, password, status, specialties[], bio, instagram, public_profile_enabled }`; update: same sin `password` | `CoachRead` | `coachApiPayload` + `coachAdapter` | Alta |
| `frontend/src/services/coachesApiService.js` | `uploadCoachAvatarApi(coachId, file)` | `POST /api/v1/coaches/{id}/avatar` | `multipart/form-data` con `file` | `CoachRead` | `coachAdapter` | Alta |

Notas:
- Admin > Coaches en API mode ya usa backend real como source of truth.
- `coachesStore` queda como fallback legacy para flags API en `false`.

## Mapeo RBAC / Roles y permisos (vigente)

| Archivo frontend | Funcion actual | Endpoint backend | Request esperado | Response esperado | Transformacion necesaria | Prioridad |
|---|---|---|---|---|---|---|
| `frontend/src/context/AuthContext.jsx` + `frontend/src/adapters/authAdapter.js` | bootstrap/login `auth/me` | `GET /api/v1/auth/me` | Bearer token | usuario con `role`, `rol`, `roleCode`, `roleName`, `permissions[]` | normalizar aliases legacy + catalogo de permisos efectivo | Alta |
| `frontend/src/services/rbacApiService.js` | `getPermissionsApi()` | `GET /api/v1/rbac/permissions` | Bearer admin | `Permission[]` | `snake_case -> camelCase` | Alta |
| `frontend/src/services/rbacApiService.js` | `getRolesApi(params)` | `GET /api/v1/rbac/roles?page=&page_size=&search=&status=` | query estandar | paginado `{ page, page_size, total, items[] }` | adapter RBAC | Alta |
| `frontend/src/services/rbacApiService.js` | `getRoleByIdApi(roleId)` | `GET /api/v1/rbac/roles/{role_id}` | path `role_id` | detalle rol | adapter RBAC | Alta |
| `frontend/src/services/rbacApiService.js` | `createRoleApi(payload)` | `POST /api/v1/rbac/roles` | `{ code, name, description, base_role, is_active, permission_keys[] }` | rol creado | payload builder + adapter | Alta |
| `frontend/src/services/rbacApiService.js` | `updateRoleApi(roleId,payload)` | `PUT /api/v1/rbac/roles/{role_id}` | mismo shape sin cambiar `code` cuando backend lo proteja | rol actualizado | payload builder + adapter | Alta |
| `frontend/src/services/rbacApiService.js` | `updateRolePermissionsApi(roleId, permissionKeys)` | `PUT /api/v1/rbac/roles/{role_id}/permissions` | `{ permission_keys: [] }` | rol/permisos actualizados | payload builder | Alta |
| `frontend/src/services/rbacApiService.js` | `deleteRoleApi(roleId)` | `DELETE /api/v1/rbac/roles/{role_id}` | path `role_id` | baja logica o confirmacion backend | sin mocks | Alta |
| `frontend/src/services/rbacApiService.js` | `getRbacUsersApi(params)` | `GET /api/v1/rbac/users?page=&page_size=&search=&role=&status=` | query estandar | paginado usuarios RBAC | adapter RBAC | Alta |
| `frontend/src/services/rbacApiService.js` | `updateUserRoleApi(userId,payload)` | `PATCH /api/v1/rbac/users/{user_id}/role` | preferido `{ role_code }`, compat `{ role_id }` si backend acepta | confirmacion backend | payload builder | Alta |
| `frontend/src/services/rbacApiService.js` | `getUserEffectivePermissionsApi(userId)` | `GET /api/v1/rbac/users/{user_id}/permissions` | path `user_id` | permisos de rol + overrides + efectivos | adapter RBAC | Alta |
| `frontend/src/services/rbacApiService.js` | `updateUserPermissionOverridesApi(userId, overrides)` | `PUT /api/v1/rbac/users/{user_id}/permissions` | `{ overrides: [{ permission_key, effect }] }` | permisos efectivos actualizados | payload builder + adapter | Alta |

Notas:
- Frontend oculta modulos y acciones por UX usando `permissions[]` de `/auth/me`.
- Backend sigue siendo source of truth; `403` manda.
- `cajero_pos` usa shell limitado a POS en `/cajero/dashboard`.
- `pay_table.read` / `pay_table.manage` gobiernan tabulador.
- `users.*` gobierna gestion de usuarios genericos; compat visual con `clients.*` se mantiene donde aplica.
- `coach_id` es identidad canónica en frontend API mode.
- `public_profile_enabled` controla visibilidad pública; `avatar_url` es string persistido por backend.
- `avatar_url` llega desde backend y frontend lo resuelve como URL pública; no se captura manualmente en form.
| `frontend/src/services/clasesApiService.js` | `createClaseApi(payload)` | `POST /api/v1/clases` | `{ name, discipline, coach_id, capacity_max, duration_minutes, description, status, day_name, start_time }` | `ClassRead` | `classAdapter` + refresh store | Alta |
| `frontend/src/services/clasesApiService.js` | `updateClaseApi(id,payload)` | `PUT /api/v1/clases/{id}` | `{ name, discipline, coach_id, capacity_max, duration_minutes, description, status, day_name, start_time }` | `ClassRead` | `classAdapter` + refresh store | Alta |

Notas:
- `status` UI `activa` se normaliza a API `programada`.
- `description` se acepta en contrato, pero backend todavía no la persiste.
- `day_name` y `start_time` se mantienen para compatibilidad de calendario legacy.

Notas BUG-013:
- En API mode admin no debe usar `coachNombre` como identidad.
- Identidad canónica de asignación coach: `coach_id` (coaches.id backend).

## Actualización BUG-006C (contrato paginado backend)
- Frontend ya consume de forma incremental contrato paginado `{ page, page_size, total, items }`.
- Endpoints integrados en esta fase:
  - `/api/v1/clases?page=&page_size=` (admin vista lista, filtro `Todas`).
  - `/api/v1/clientes/me/credit-movements?page=&page_size=` (cliente historial).
  - `/api/v1/reservas/me?page=&page_size=&status=&from=&to=` (servicio preparado; integración UI semanal pendiente).
- Se mantiene compatibilidad con respuesta legacy array para transición.

## Actualización BUG-006C (Mis clases cliente)
- `ClientPanel` en API mode consume `GET /api/v1/reservas/me?page=&page_size=&status=&from=&to=` para sección “Mis clases”.
- `status` se deriva del filtro UI (`all` omite parámetro).
- `from/to` se derivan del rango semanal visible.
- Se conserva fallback legacy/mock cuando flags API están en false.

## Nota 2026-06-03
- Reserva por equipo/lugar usa `EquipmentReservationPanel`.
- Source of truth: backend spots + holds.
- STRYDE: bench + treadmill. SLOW: mat.
- Do not use label as unique id; use spot_id for actions.

## Nota 2026-06-03 - Landing paquetes -> dashboard pagos
- Landing compra usa catálogo backend `GET /api/v1/memberships/packages`.
- Botón Comprar no procesa pago en landing; solo guarda intención y redirige a login o dashboard pagos.
- Post-login seguro: `redirect` interno solo si empieza con `/`.
- Dashboard pagos recibe `section=pagos&packageId=...` para resaltar paquete y abrir `PagoModal` real dentro de cliente autenticado.

## Mapeo Clientes Admin

| Funcion | Endpoint | Payload/Query |
|---|---|---|
| `getClientsPaginatedApi` | `GET /api/v1/clientes` | `page,page_size,search,status,membership_status` |
| `createClientApi` | `POST /api/v1/clientes` | `name,email,phone,password,status` |
| `getClientByIdApi` | `GET /api/v1/clientes/{id}` | detalle real |
| `updateClientApi` | `PUT /api/v1/clientes/{id}` | `name,email,phone,status`; sin password |
| `deleteClientApi` | `DELETE /api/v1/clientes/{id}` | baja logica |
| `assignClientPackageApi` | `POST /api/v1/clientes/{id}/paquetes` | `package_id,notes` |
| `adjustClientCreditsApi` | `POST /api/v1/clientes/{id}/credits` | `amount,reason,notes` |

Adapter: `clientAdapter`. Payload: `clientApiPayload`. Paginacion maxima frontend: 100.

## Update 2026-06-08 - Paquetes admin

- Admin > Paquetes ya usa `/api/v1/memberships/packages` como catálogo backend.
- CRUD admin usa `POST/PUT/PATCH/DELETE /api/v1/memberships/packages`.
- `POST /api/v1/memberships` no se usa para catálogo admin.
- `type` no es canónico y se oculta en API mode.
- `credits` es finito y mayor a 0.
- `benefits` persiste como lista de strings.
- Historial de ventas queda fuera de esta pantalla en API mode.

## Paquetes compartibles y beneficiarios

Frontend consume:
- `GET /api/v1/memberships/packages`
- `GET /api/v1/memberships/packages?page=&page_size=&status=&search=`
- `GET /api/v1/clientes/me/memberships`
- `POST /api/v1/clientes/me/memberships/{membership_id}/beneficiaries`
- `DELETE /api/v1/clientes/me/memberships/{membership_id}/beneficiaries/{beneficiary_id}`
- `GET /api/v1/clientes/{id}` -> `shared_memberships`
- `POST /api/v1/clientes/{id}/memberships/{membership_id}/beneficiaries`
- `DELETE /api/v1/clientes/{id}/memberships/{membership_id}/beneficiaries/{beneficiary_id}`

Reglas frontend:
- `name` es opcional; si falta, mostrar `display_name`.
- `credits` siempre finito > 0.
- `type` no es contrato backend.
- `benefits` es lista de strings.
- `is_shareable` + `max_beneficiaries` controla UI de compartir paquete.
- Buyer: solo alta inicial de beneficiarios; después queda solo lectura.
- Admin: puede agregar/quitar/reemplazar mientras no haya consumo.
- Errores backend esperados: `SHARED_CREDITS_NOT_DIVISIBLE`, `SHARED_BENEFICIARY_CHANGE_ADMIN_ONLY`, `SHARED_MEMBERSHIP_HAS_CONSUMPTION`, `BENEFICIARY_NOT_FOUND`.

## MVP server state

Frontend MVP uses TanStack Query for server state. Zustand queda para fallback legacy y UI local. Lecturas con `useQuery`, mutaciones con `useMutation`, refetch con invalidate tras éxito. No usar `page_size=1000`.
- Admin badges de Coaches/Usuarios ya usan totales backend.
- Avatares de coach usan `avatar_url` / `avatarUrl` con fallback visual.
- `Admin > Actividad` usa `GET /api/v1/actividad` como source of truth en API mode; `GET /api/v1/audit` queda legacy básico.
- Configuración > Correo usa `GET/PUT /api/v1/configuracion/email`.
- Notificaciones usan `GET /api/v1/notificaciones`, `unread-count`, `read` y `read-all`.
- Outbox correo usa `GET /api/v1/email/outbox` y `POST /api/v1/email/outbox/{id}/retry`.

## Mapeo POS (vigente)
| Archivo frontend | Función actual | Endpoint backend | Request esperado | Response esperado | Transformación necesaria | Prioridad |
|---|---|---|---|---|---|---|
| `frontend/src/services/posApiService.js` | `getProductsApi({ page, pageSize, search, category, status })` | `GET /api/v1/productos?page=&page_size=&search=&category=&status=` | query paginada | `{ page, page_size, total, items[] }` | `posAdapter` | Alta |
| `frontend/src/services/posApiService.js` | `createProductApi(payload)` / `updateProductApi(id,payload)` / `updateProductStatusApi(id,status)` / `deleteProductApi(id)` | `POST/PUT/PATCH/DELETE /api/v1/productos` | `{ name, category, price_mxn, stock, status, description? }` | `ProductRead` | `posApiPayload` + `posAdapter` | Alta |
| `frontend/src/services/posApiService.js` | `createSaleApi(payload)` | `POST /api/v1/ventas` | `{ customer_id, items[], payment_method, subtotal_mxn, tax_rate: 0, tax_mxn: 0, total_mxn, notes? }` | `SaleRead` con `ticket_url`, `ticket_pdf_url`, `public_ticket_url` | `posApiPayload` + `posAdapter` | Alta |
| `frontend/src/services/posApiService.js` | `getSalesApi({ page, pageSize, from, to, paymentMethod, status })` | `GET /api/v1/ventas?page=&page_size=&from=&to=&payment_method=&status=` | query filtrada | `{ page, page_size, total, items[] }` | `posAdapter` + `paginationAdapter` | Alta |
| `frontend/src/services/posApiService.js` | `getSaleByIdApi(id)` / `getSaleTicketApi(id)` / `getSaleTicketPdfUrl(id)` / `getPublicTicketUrl(token)` | `GET /api/v1/ventas/{id}` / `GET /api/v1/ventas/{id}/ticket` / `GET /api/v1/ventas/{id}/ticket.pdf` / `GET /api/v1/public/tickets/{token}` | path/token | venta/ticket/ticket PDF/public ticket | `posAdapter` | Alta |

Notas POS:
- Carrito queda local de UI; server state va con TanStack Query.
- `public_ticket_url` se usa para WhatsApp Web en MVP.
- POS no usa Mercado Pago.
- POS cobra precio final sin desglose de IVA para ventas nuevas.
- En ventas nuevas: `subtotal_mxn === total_mxn`, `tax_rate = 0`, `tax_mxn = 0`.
- Si ticket histórico trae `tax_mxn > 0`, frontend lo respeta como snapshot y no lo recalcula.

## Mapeo Reportes operativos (vigente)
| Archivo frontend | Función actual | Endpoint backend | Request esperado | Response esperado | Transformación necesaria | Prioridad |
|---|---|---|---|---|---|---|
| `frontend/src/services/reportsApiService.js` | `getFinanceReport({from,to})` | `GET /api/v1/reportes/finanzas?from=&to=` | query `from`,`to` | reporte financiero operativo | `reportAdapter` | Alta |
| `frontend/src/services/reportsApiService.js` | `getUsersReport({from,to})` | `GET /api/v1/reportes/usuarios?from=&to=` | query `from`,`to` | reporte usuarios | `reportAdapter` | Alta |
| `frontend/src/services/reportsApiService.js` | `getPackagesReport({from,to})` | `GET /api/v1/reportes/paquetes?from=&to=` | query `from`,`to` | reporte paquetes | `reportAdapter` | Alta |
| `frontend/src/services/reportsApiService.js` | `getPosReport({from,to})` | `GET /api/v1/reportes/pos?from=&to=` | query `from`,`to` | reporte POS | `reportAdapter` | Alta |
| `frontend/src/services/reportsApiService.js` | `getCoachesReport({from,to})` | `GET /api/v1/reportes/coaches?from=&to=` | query `from`,`to` | reporte coaches | `reportAdapter` | Alta |
| `frontend/src/services/reportsApiService.js` | `getTopClassesReport({from,to,limit})` | `GET /api/v1/reportes/top-clases?from=&to=&limit=5` | query `from`,`to`,`limit` | top clases | `reportAdapter` | Alta |
| `frontend/src/services/reportsApiService.js` | `getOccupancyByDisciplineReport({from,to})` | `GET /api/v1/reportes/ocupacion-por-disciplina?from=&to=` | query `from`,`to` | ocupacion por disciplina | `reportAdapter` | Alta |

Notas:
- `AdminReportes` conserva shell visual original; export CSV/PDF se arma en frontend con datos ya cargados por API mode.
- Export legacy con mocks solo sigue cuando flags API están en `false`.

## Mapeo Admin Clases / CoachPanel (vigente)

Frontend consume:
- `GET /api/v1/clases?page=&page_size=&search=&discipline=&status=&coach_id=`
- `GET /api/v1/clases/{id}/ocurrencias?from=&to=`
- `GET /api/v1/coaches`
- `POST /api/v1/reservas`
- `GET /api/v1/clientes?page=&page_size=&search=&status=active`

Reglas frontend:
- Clase base no trae fecha de sesión; la vista de calendario usa occurrences.
- Acciones de alumnos/manual enrollment usan `occurrenceId` cuando existe.
- `AdminPanel` y `CoachPanel` no deben mostrar roster falso cuando count > 0 y listado detallado no existe.
- Manual enrollment usa clientes reales; usuarios hardcoded solo fallback legacy.

## Roster por occurrence (vigente)

Frontend consume:
- `GET /api/v1/reservas/ocurrencias/{occurrence_id}/alumnos`
- `GET /api/v1/reservas/ocurrencias/{occurrence_id}/alumnos?includeCanceled=true`

Reglas frontend:
- Endpoint privado; enviar `Authorization`.
- Admin ve cualquier occurrence.
- Coach solo ve occurrences asignadas.
- Cliente recibe 403.
- Roster detallado sustituye placeholder cuando respuesta llega bien.
- Manual enrollment y seat flow invalidan roster tras éxito.

## Regla permanente

- Toda lectura/mutacion contra backend real en API mode va por TanStack Query.
- Zustand/localStorage no son source of truth de datos backend.
- Mocks/demo solo fallback cuando flags API estan apagadas.

## Addendum 2026-06-10

- `GET /api/v1/reservas/ocurrencias/{occurrence_id}/alumnos` y `GET /api/v1/reservas/ocurrencias/{occurrence_id}/alumnos?includeCanceled=true` quedan como roster privado canonico.
- Notificaciones, configuracion de correo y outbox ya usan hooks Query para lectura/mutacion.
- `PaymentReturnPage` invalida estado financiero, membresias, movimientos, pagos, notificaciones y actividad tras pago aplicado.

## Site configuration (vigente)

| Archivo frontend | Función | Endpoint backend | Uso |
|---|---|---|---|
| `frontend/src/services/siteConfigurationApiService.js` | `getSiteConfigurationApi()` | `GET /api/v1/configuracion/site` | Configuración pública persistente |
| `frontend/src/services/siteConfigurationApiService.js` | `updateSiteConfigurationApi(payload)` | `PUT /api/v1/configuracion/site` | Guardado con `settings.update` |
| `frontend/src/services/siteConfigurationApiService.js` | `uploadSiteConfigurationMediaApi({ field, file })` | `POST /api/v1/configuracion/site/upload` | Upload multipart de imágenes |

Reglas:
- `siteConfiguration.detail()` es server state canónico en API mode.
- `configuracionStore` no pisa backend; queda fallback API off/error controlado.
- Home, Nosotros, Clases y Contacto consumen `useEffectiveSiteConfiguration`.
- `/media/site/...` se resuelve contra `VITE_API_BASE_URL`, no contra Vite.
- Upload acepta JPG, PNG y WEBP; video local muestra error MVP controlado.
- Máximos: 6 slides Hero y 8 elementos Nosotros.
