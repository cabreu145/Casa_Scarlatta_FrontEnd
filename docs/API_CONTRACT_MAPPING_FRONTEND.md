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
