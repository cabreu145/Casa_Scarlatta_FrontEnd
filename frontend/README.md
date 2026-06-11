# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Integraciï¿½n Auth API (Frontend)

Este frontend soporta dos modos para autenticaciï¿½n:

- Modo mock/demo: `VITE_USE_API_AUTH=false`
- Modo backend real: `VITE_USE_API_AUTH=true`

### Variables de entorno
Crear `frontend/.env` basado en `frontend/.env.example`:

- `VITE_API_BASE_URL=http://localhost:8000`
- `VITE_API_PREFIX=/api/v1`
- `VITE_USE_API_AUTH=false`

### Endpoints usados (cuando flag=true)
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/registro`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/reset-password/request`
- `POST /api/v1/auth/reset-password/confirm`

### Fallback
Con `VITE_USE_API_AUTH=false` se mantiene flujo actual basado en mocks/localStorage.
No se conectaron aï¿½n clases, reservas ni waitlist.


### Registro extendido (Auth API)
Cuando `VITE_USE_API_AUTH=true`, registro envï¿½a:
- requeridos: `email`, `name`, `password`
- opcionales: `phone`, `birth_date`, `gender`

El adapter normaliza gï¿½nero de UI a valores backend:
`femenino | masculino | otro | prefiero_no_decir`.

## Estado de cierre Auth
- Integraciï¿½n Auth API validada manualmente end-to-end.
- Registro extendido funcionando con backend real.
- `VITE_USE_API_AUTH=true` activa API real.
- `VITE_USE_API_AUTH=false` mantiene fallback a mocks/localStorage.

Siguiente mï¿½dulo recomendado:
- Clases lectura con feature flag `VITE_USE_API_CLASSES`.

## Integraciï¿½n Clases Lectura (Feature Flag)

Variables:
- `VITE_USE_API_CLASSES=false` (default fallback)

Comportamiento:
- `VITE_USE_API_CLASSES=true`: frontend carga clases desde backend (`GET /api/v1/clases`, `GET /api/v1/clases/{id}`, `GET /api/v1/clases/{id}/disponibilidad`).
- Admin > Clases en API mode tambiï¿½n usa `GET /api/v1/clases?page=&page_size=&search=&discipline=&status=&coach_id=`, `POST /api/v1/clases`, `PUT /api/v1/clases/{id}` y `DELETE /api/v1/clases/{id}`.
- Admin > Coaches en API mode usa `GET/POST/PUT/PATCH/DELETE /api/v1/coaches`, `POST /api/v1/coaches/{id}/avatar`, `GET /api/v1/coaches/public`, y `coachesStore` queda solo como fallback legacy cuando flags API estï¿½n apagados.
- Create coach en API mode requiere `password`, `bio`, `instagram` y `public_profile_enabled`; update no modifica password. Avatar se sube por archivo, no por URL manual ni base64.
- En API mode, `Fecha especï¿½fica` y `Programar publicaciï¿½n` quedan bloqueados hasta que exista contrato de ocurrencias/publicaciï¿½n.
- `VITE_USE_API_CLASSES=false`: frontend conserva flujo actual con mocks/store local.

Notas:
- Adapter `classAdapter` transforma payload backend a shape actual de UI.
- `duration_minutes` es alias preferido en frontend; backend tambiï¿½n acepta `duration_min`.
- `description` se acepta en contrato, pero backend aï¿½n no la persiste.
- No se integraron aï¿½n reservas ni waitlist.

## Validaciï¿½n manual (backend real)
- Auth API y Clases lectura API validadas con flags activos.
- Backend clases no envï¿½a `coach_name`; frontend muestra fallback (`Coach #id`) sin romper UI.
- Modo fallback sigue disponible con flags en `false`.

Siguiente integraciï¿½n recomendada: Reservas API.

## Integraciï¿½n Reservas API (Feature Flag)

Variable:
- `VITE_USE_API_RESERVATIONS=false` (default fallback)

Comportamiento:
- `VITE_USE_API_RESERVATIONS=true`: crear/leer/cancelar/no-asistio/completar reservas usando backend.
- `VITE_USE_API_RESERVATIONS=false`: flujo anterior con mocks/localStorage.

Endpoints usados:
- `GET /api/v1/reservas/me`
- `GET /api/v1/reservas/{id}`
- `POST /api/v1/reservas`
- `POST /api/v1/reservas/{id}/cancelar`
- `POST /api/v1/reservas/{id}/no-asistio`
- `POST /api/v1/reservas/{id}/completar`

Nota:
- Backend es source of truth cuando flag estï¿½ activo.
- Waitlist API sigue pendiente.

## Estado actual Admin Clases
- Admin > Clases usa occurrences para vista por fecha en API mode.
- Roster detallado por occurrence sigue pendiente de endpoint backend; UI muestra aviso honesto en vez de alumnos inventados.

## Integraciï¿½n Waitlist API (Feature Flag)

Variable:
- `VITE_USE_API_WAITLIST=false` (default fallback)

Comportamiento:
- `VITE_USE_API_WAITLIST=true`: alta/baja/consulta de lista de espera usando backend por ocurrencia.
- `VITE_USE_API_WAITLIST=false`: flujo local/mock actual.

Endpoints vigentes (API mode):
- `GET /api/v1/lista-espera?occurrenceId=...`
- `POST /api/v1/lista-espera` con `occurrence_id`

## Integraciï¿½n Cortes de Caja (API mode)

Variable:
- `VITE_USE_API_AUTH=true` habilita vista API-first de cortes en Admin.

Comportamiento:
- `GET /api/v1/cortes/hoy`
- `POST /api/v1/cortes/ejecutar`
- `GET /api/v1/cortes?page=&page_size=&from=&to=`
- `GET /api/v1/cortes/{id}`
- `GET /api/v1/finanzas/exportar?from=&to=&type=summary|sales|expenses|cash_closings`

Notas:
- Fecha e importes se formatean en frontend.
- Error duplicado `CASH_CLOSING_ALREADY_EXISTS` se muestra como mensaje claro.
- Historial y detalle usan TanStack Query.
- Exportaciï¿½n CSV usa filename de `Content-Disposition` y fallback `finanzas-<type>-<from>_<to>.csv`.
- `DELETE /api/v1/lista-espera/{id}`

Notas:
- Backend es source of truth para FIFO/promociï¿½n cuando flag activo.
- Frontend no promueve localmente en cancelaciï¿½n cuando API waitlist estï¿½ activa.
- No usar `GET /api/v1/lista-espera?claseId=...` en modo API actual.

Siguiente integraciï¿½n recomendada:
- Notificaciones reales / POS-finanzas (segï¿½n roadmap), o endurecer QA E2E multi-rol.

## QA E2E Auth + Clases + Reservas + Waitlist

Fecha validaciï¿½n: `2026-05-29`.

Flags usados:
- `VITE_API_BASE_URL=http://127.0.0.1:8000`
- `VITE_API_PREFIX=/api/v1`
- `VITE_USE_API_AUTH=true`
- `VITE_USE_API_CLASSES=true`
- `VITE_USE_API_RESERVATIONS=true`
- `VITE_USE_API_WAITLIST=true`

Usuario demo:
- `cliente@casascarlatta.local / cliente999`

Flujos probados:
- Login + sesiï¿½n (`/auth/me`).
- Carga clases reales (`/clases`).
- Crear reserva (`POST /reservas`) y ver reflejo en `GET /reservas/me`.
- Cancelar reserva (`POST /reservas/{id}/cancelar`) con refetch.
- Join/leave waitlist (`POST/DELETE /lista-espera`).

Endpoints validados:
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/clases`
- `POST /api/v1/reservas`
- `GET /api/v1/reservas/me`
- `POST /api/v1/reservas/{id}/cancelar`
- `GET /api/v1/lista-espera?occurrenceId=...`
- `POST /api/v1/lista-espera`
- `DELETE /api/v1/lista-espera/{id}`

Hallazgos:
- `GET /lista-espera` ahora devuelve por defecto solo estados activos (`esperando`, `notificado`).
- En modo API waitlist activo no se realiza promociï¿½n FIFO local en frontend.

Pendientes:
- QA manual visual en navegador con captura de Network por interacciï¿½n UI completa.

Checklist detallado multi-rol:
- Ver [docs/FRONTEND_E2E_QA_CHECKLIST.md](/D:/Casa_Scarlatta_FrontEnd/docs/FRONTEND_E2E_QA_CHECKLIST.md)
- Plantilla formal de ejecuciï¿½n QA: [docs/FRONTEND_E2E_QA_RUN_TEMPLATE.md](/D:/Casa_Scarlatta_FrontEnd/docs/FRONTEND_E2E_QA_RUN_TEMPLATE.md)

## Sprint Estabilizaciï¿½n Core (avance)
- BUG-001 corregido: dashboard cliente ï¿½Reservar claseï¿½ ahora usa mismo criterio de clases que `/clases` cuando `VITE_USE_API_CLASSES=true`.
- Source of truth en modo API clases: backend + adapter + cache store (sin `CLASES_MOCK` como verdad inicial).
- BUG-003 mitigado en frontend:
  - `reserved_at` ya no se usa como fecha de sesiï¿½n.
  - matching diario de reservas usa ocurrencia real cuando estï¿½ disponible.
  - si no hay fecha de sesiï¿½n, UI aplica estado neutral en filtros diarios.
- Pendientes inmediatos: cierre definitivo BUG-003 (modelo de ocurrencias backend) y BUG-005.

## Update 2026-05-29: cierre BUG-003 con occurrences
- Backend exige `occurrence_id` para `POST /api/v1/reservas`.
- Frontend ahora reserva por ocurrencia real y evita matching por `class_id` plano en modo API.
- Waitlist API migrada a ocurrencia:
  - `GET /api/v1/lista-espera?occurrenceId=...`
  - `POST /api/v1/lista-espera` con `occurrence_id`
  - `DELETE /api/v1/lista-espera/{id}`
- BUG-003 queda cerrado end-to-end (pendiente solo QA visual multi-rol de regresiï¿½n).

## Hotfix performance de ocurrencias/waitlist (2026-05-29)
- Se aplicï¿½ dedupe in-flight para `GET /clases/{id}/ocurrencias` por llave `classId|from|to`.
- Se agregï¿½ AbortController en cargas por rango para evitar setState tras unmount/cambio rï¿½pido.
- Se eliminï¿½ precarga masiva de waitlist en dashboard; waitlist API queda bajo demanda.
- Prï¿½xima mejora recomendada: TanStack Query + endpoint bulk/BFF.

## Fix waitlist legacy classId (2026-05-29)
- En modo API (`VITE_USE_API_WAITLIST=true`) waitlist queda estrictamente por `occurrenceId`.
- Se removiï¿½ refresco legacy por `claseId` tras cancelar reserva API.
- Si falta `occurrenceId`, no se dispara consulta waitlist en API mode.



## Integraciï¿½n BUG-004 Estado Financiero (2026-05-30)
- Endpoint fuente de verdad en modo API cliente:
  - `GET /api/v1/clientes/me/estado-financiero`
- En modo API, `/auth/me` se mantiene para identidad/sesiï¿½n; no para balance de crï¿½ditos.
- Frontend refresca estado financiero en:
  - bootstrap/login cliente
  - reserva (`POST /reservas`)
  - cancelaciï¿½n (`POST /reservas/{id}/cancelar`)

Campos usados en UI cliente:
- `credits_balance`
- `active_membership.package_name`
- `active_membership.credits_total|credits_used|credits_available`
- `credit_movements`
- `transactions` (puede venir `[]` temporalmente)

Nota PagoModal en modo API:
- Compra self-service aï¿½n no implementada.
- El modal muestra estado controlado: `Compra en lï¿½nea aï¿½n no disponible en modo API`.
- El flujo local/mock de compra se mantiene solo como fallback cuando flags API estï¿½n en `false`.

## Estado BUG-004 Core (cerrado)
- Estado: **Cerrado (core)**.
- Cubre: crï¿½ditos/membresï¿½a persistentes tras login, refresh, reservar y cancelar usando `GET /api/v1/clientes/me/estado-financiero`.
- `/auth/me` no se usa para balance financiero.
- `PagoModal` en modo API no simula compra persistente.

Pendiente separado:
- Compra self-service real + transacciones reales de cliente.
- Se mueve a BUG-009 / Fase pagos.

## Estado BUG-010 (cerrado frontend)
- BUG-010 corregido.
- Tabla "Todas mis clases esta semana" usa agenda real por ocurrencias.
- Source of truth: `GET /api/v1/coaches/me/agenda?from&to`.

## Estado BUG-011 (cerrado frontend)
- Mï¿½tricas de coach en API mode derivan de `agenda.occurrences`.
- Source of truth: `GET /api/v1/coaches/me/agenda?from&to`.
- Sin hardcode ni fuente mock/local en API mode para card ï¿½Esta semanaï¿½.
- Siguiente bug recomendado: BUG-012.

## Estado BUG-012 (cerrado frontend)
- Secciï¿½n ï¿½Clases de hoyï¿½ en CoachPanel API mode ahora deriva de `agenda.occurrences`.
- Source of truth: `GET /api/v1/coaches/me/agenda?from&to`.
- Filtro por `occurrenceDate` del dï¿½a actual y orden por hora.
- Sin dependencia de `clasesStore`, `coachesStore`, `coachNombre` o `dia` de clase base en API mode.
- Bloque coach P0 (BUG-010/011/012) cerrado funcionalmente.

## Estado BUG-002 (cerrado frontend)
- ï¿½Mis clasesï¿½ permite filtro por estado (`all`, `confirmada`, `cancelada`, `completada`, `no_asistio`).
- En API mode usa reservas adaptadas desde `GET /api/v1/reservas/me`.
- En modo fallback (`flags=false`) se mantiene soporte sobre reservas mock/local.

## Estado BUG-005 (cerrado frontend)
- ï¿½Mis prï¿½ximas clasesï¿½ en Dashboard Cliente ya no estï¿½ limitado de forma rï¿½gida a 2.
- En API mode, usa reservas reales de `GET /api/v1/reservas/me` con criterio: `confirmada` + hoy/futuras + orden por ocurrencia.
- Lï¿½mite visual configurable actual: `4` (`UPCOMING_RESERVATIONS_LIMIT`).
- Se agregï¿½ CTA ï¿½Ver todasï¿½ hacia ï¿½Mis clasesï¿½ con filtro `confirmada`.
- BUG-006 permanece como siguiente paso para paginaciï¿½n/listados globales.

## Estado BUG-006A/B (mitigaciï¿½n frontend aplicada)
- Se aï¿½adieron controles de paginaciï¿½n visual en listados crï¿½ticos ya cargados en memoria:
  - Cliente: historial de movimientos/transacciones en Paquetes & Pagos.
  - Admin: clases en vista lista.
  - Admin: historial de reservas en modal de usuario.
- No se modificaron endpoints ni reglas de negocio.
- BUG-006C queda pendiente para paginaciï¿½n backend real (`page/page_size/total/items`).

## Estado BUG-006C (frontend incremental)
- Se agregï¿½ compatibilidad de frontend con contrato paginado backend (`page/page_size/total/items`) sin romper legacy.
- Integraciones activas:
  - Admin clases (vista lista, filtro `Todas`) con paginaciï¿½n backend.
  - Cliente movimientos de crï¿½dito desde endpoint paginado dedicado.
- Se mantiene transiciï¿½n segura: respuestas array legacy siguen soportadas.
- Pendiente siguiente: migrar "Mis clases" cliente a paginaciï¿½n backend conservando UX semanal.

## Estado BUG-006C (cierre frontend alcance actual)
- Se cerrï¿½ migraciï¿½n paginada de ï¿½Mis clasesï¿½ cliente en API mode usando `reservas/me` paginado con `status/from/to`.
- Se conserva UX semanal/filtro y refetch tras cancelaciï¿½n.
- ï¿½Mis prï¿½ximas clasesï¿½ permanece estable y separado de este flujo.
- Legacy/fallback mock se mantiene para flags false.
- Prï¿½ximo paso: paginaciï¿½n backend en listados admin globales cuando backend exponga contratos.

## Cierre pre-BUG-009
Core stabilization listo para QA final pre-Mercado Pago.
Siguiente mï¿½dulo recomendado: BUG-009 (integraciï¿½n Mercado Pago).
- Paquetes en API mode ya vuelven a consumirse desde backend, con checkout y retorno post-pago activos.

- Paquetes & Pagos ahora incluye seguimiento local de pagos recientes y retorno post-pago amigable.
- Paquetes & Pagos ya usa historial real backend con `GET /api/v1/clientes/me/pagos`.
- `checkout_url` viene del backend; frontend no decide `init_point` ni `sandbox_init_point`.
- Tracking local queda solo como fallback puntual de retorno post-pago.

## Nota 2026-06-03
- Reserva por equipo/lugar usa `EquipmentReservationPanel`.
- Source of truth: backend spots + holds.
- STRYDE: bench + treadmill. SLOW: mat.
- Do not use label as unique id; use spot_id for actions.
## Nota 2026-06-03 - Landing paquetes
- Landing usa catï¿½logo backend real `GET /api/v1/memberships/packages` en API mode.
- Compra desde landing no procesa pago ahï¿½: guarda intenciï¿½n y lleva a login o dashboard pagos.
- Usuario cliente autenticado va directo a `/cliente/dashboard&packageId=...`.
- Pago real sigue solo dentro de `ClientPanel` con `PagoModal` + backend checkout.
## Nota 2026-06-07 - Reservar visual premium
- `/reservar` recupera flujo visual premium: cards grandes STRYDE X / SLOW, paso sala -> clase -> spot.
- Reserva real sigue usando flujo actual por spots/holds; no se toca backend ni contratos.
- Pï¿½blico ve catï¿½logo/clases; acciones de reservar siguen bajo auth de cliente.

## Admin Usuarios/clientes API-first

- Usa `GET/POST/PUT/DELETE /api/v1/clientes` y detalle real por id.
- Password solo en create; update no modifica password.
- Asignacion manual usa `/clientes/{id}/paquetes`; creditos usan `/clientes/{id}/credits`.
- Catalogo de asignacion viene de `GET /api/v1/memberships/packages`.
- `usuariosStore` y `paquetesStore` quedan solo como fallback con API desactivada.

## Paquetes admin en API mode

- Admin > Paquetes usa catï¿½logo backend real `GET /api/v1/memberships/packages`.
- CRUD admin usa `POST/PUT/PATCH/DELETE /api/v1/memberships/packages`.
- `type` no es canï¿½nico.
- No existe ilimitado; `credits` siempre > 0.
- `benefits` se captura como lista de lï¿½neas.
- Historial de ventas queda como pendiente de Reportes en API mode.

## Paquetes compartibles

Frontend ya consume catï¿½logo vendible y membresï¿½as compartidas:
- `GET /api/v1/memberships/packages`
- `GET /api/v1/clientes/me/memberships`
- `GET /api/v1/clientes/{id}` -> `shared_memberships`

Reglas:
- `name` opcional; mostrar `display_name` si falta
- `credits` siempre finito > 0
- `type` no es contrato backend
- no hay ilimitados
- `is_shareable` + `max_beneficiaries` controlan UI de compartir paquete
- buyer solo configura beneficiarios una vez
- admin puede corregir mientras no haya consumo

## MVP server state

Frontend MVP uses TanStack Query for server state. Zustand queda para fallback legacy y UI local. Lecturas con `useQuery`, mutaciones con `useMutation`, refetch con invalidate tras ï¿½xito. No usar `page_size=1000`.

## Integraciï¿½n POS API (Feature Flag)

Variable:
- `VITE_USE_API_POS=true` o el flag de API general que use la app para admin.

Comportamiento:
- `PuntoDeVentaSection` usa `GET /api/v1/productos`, `GET /api/v1/memberships/packages`, `GET /api/v1/clientes`, `GET /api/v1/ventas` y `POST /api/v1/ventas` en modo API.
- Carrito sigue local de UI; backend valida stock, total y beneficiarios.
- Venta exitosa abre modal con ticket, PDF y link pï¿½blico para WhatsApp Web.
- `public_ticket_url` es la URL recomendada para compartir.
- `POS` no usa Mercado Pago.
- `finanzasService` queda solo legacy/demo y fallback legacy se conserva cuando flags API estï¿½n en `false`.

## Integraciï¿½n Finanzas Admin (API mode)

Variable:
- usa mismo modo API admin que dashboard/POS.

Comportamiento:
- `DashboardSection` y `AdminFinanzas` consumen KPIs reales desde `/api/v1/finanzas/kpis`, `/api/v1/finanzas/dia`, `/api/v1/finanzas/categorias`, `/api/v1/finanzas/ventas-recientes`, `/api/v1/finanzas/exportar`, `/api/v1/gastos` y `/api/v1/cortes/*`.
- Mï¿½tricas visibles: ventas, gastos, neto, corte, mï¿½todos de pago, gastos recientes, ventas recientes e historial de cortes.
- Frontend solo formatea moneda/fecha y deja backend como source of truth en API mode.
- `finanzasService` queda solo legacy/demo y fallback legacy se conserva cuando flags API estï¿½n en `false`.

Notas:
- `useApiQueries` y TanStack Query manejan server state.
- `posApiService` maneja productos, ventas y tickets.
- No usar `page_size=1000`.

## Integraciï¿½n Reportes Admin (API mode)

- `AdminReportes` consume `/api/v1/reportes/finanzas`, `/usuarios`, `/paquetes`, `/pos`, `/coaches`, `/top-clases` y `/ocupacion-por-disciplina`.
- Reportes operativos reemplazan mocks legacy en modo API.
- CSV y PDF se generan en frontend con datos reales ya cargados por TanStack Query.
- Tabulador coach sigue pendiente de backend y no se expone como real.
- Fallback demo se conserva cuando flags API estï¿½n en `false`.

## Admin Clases / CoachPanel roster

- `AdminPanel` and `CoachPanel` consume real roster by occurrence.
- Private endpoint: `GET /api/v1/reservas/ocurrencias/{occurrence_id}/alumnos`.
- Manual enrollment and seat flow invalidate roster after save.
- Hardcoded students stay only as legacy fallback when API flags are off.

## Admin badges, avatars and activity

- Sidebar badgeCount for Coaches and Usuarios comes from backend totals in API mode.
- Coach avatars use `avatar_url` / `avatarUrl` when available, with initials fallback.
- `Admin > Actividad` uses `GET /api/v1/actividad` in API mode; `GET /api/v1/audit` stays legacy basic.

## TanStack Query

- Server state en API mode usa TanStack Query.
- `useQuery` para lecturas.
- `useMutation` para escrituras.
- `queryKeys.js` es catalogo unico de keys.
- Zustand/localStorage quedan solo para fallback legacy o UI local.
- No usar mocks como verdad cuando flags API estan activas.

## Notificaciones y correo

- `ConfiguraciÃ³n > Correo` consume `GET/PUT /api/v1/configuracion/email`.
- Prueba de correo usa `POST /api/v1/email/test`.
- Notificaciones usan `GET /api/v1/notificaciones`, `unread-count`, `read` y `read-all`.
- Outbox usa `GET /api/v1/email/outbox` y `POST /api/v1/email/outbox/{id}/retry`.
- Passwords nunca se muestran completos; solo `*_password_set`.

## Addendum 2026-06-10

- `PaymentReturnPage` ya invalida finanzas, membresias, movimientos, pagos, notificaciones y actividad tras pago `approved + applied`.
- `spotHolds.byOccurrence` y `occurrenceRoster.detail(occurrenceId, includeCanceled)` ya son keys canonicas.
- Refresh manual no sustituye TanStack Query en API mode.

## RBAC API-first

- `/api/v1/auth/me` hidrata `role`, `rol`, `roleCode`, `roleName` y `permissions`.
- `Configuracion > Roles y permisos` consume `GET/POST/PUT/PATCH/DELETE /api/v1/rbac/*`.
- Frontend oculta modulos y acciones por UX usando `permissions[]`; backend protege realmente endpoints sensibles.
- `cajero_pos` entra por `/cajero/dashboard` y usa shell limitado a POS.
- `pay_table.read` / `pay_table.manage` gobiernan tabulador.
- En API mode no usar mocks/localStorage como source of truth para RBAC.

## Site configuration API-first

- `GET /api/v1/configuracion/site` alimenta Home, Nosotros, Clases y Contacto.
- `PUT /api/v1/configuracion/site` persiste Admin > Configuración con permiso `settings.update`.
- `POST /api/v1/configuracion/site/upload` sube JPG, PNG o WEBP a `/media/site/`.
- `queryKeys.siteConfiguration.detail()` es key canónica; lecturas y mutaciones usan TanStack Query.
- `configuracionStore` y localStorage quedan solo fallback con API apagada o error controlado.
- Desktop y mobile consumen misma configuración; CSS responsive no sustituye imágenes configuradas.
- Upload de video local no está soportado en MVP. YouTube y URLs de video existentes siguen permitidos.
- `nombreEstudio` y `ciudad` ya persisten; PDFs legacy con branding fijo requieren migración independiente.
