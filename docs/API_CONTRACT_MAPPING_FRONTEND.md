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
| `frontend/src/services/clasesApiService.js` | `createClaseApi(payload)` | `POST /api/v1/clases` | `{ name, tipo, coach_id, day_name, start_time, duration_min, capacity_max, description, status }` | `ClassRead` | `classAdapter` + refresh store | Alta |
| `frontend/src/services/clasesApiService.js` | `updateClaseApi(id,payload)` | `PUT /api/v1/clases/{id}` | `{ name, tipo, coach_id, day_name, start_time, duration_min, capacity_max, description, status }` | `ClassRead` | `classAdapter` + refresh store | Alta |

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
