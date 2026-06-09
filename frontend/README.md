# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Integración Auth API (Frontend)

Este frontend soporta dos modos para autenticación:

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
No se conectaron aún clases, reservas ni waitlist.


### Registro extendido (Auth API)
Cuando `VITE_USE_API_AUTH=true`, registro envía:
- requeridos: `email`, `name`, `password`
- opcionales: `phone`, `birth_date`, `gender`

El adapter normaliza género de UI a valores backend:
`femenino | masculino | otro | prefiero_no_decir`.

## Estado de cierre Auth
- Integración Auth API validada manualmente end-to-end.
- Registro extendido funcionando con backend real.
- `VITE_USE_API_AUTH=true` activa API real.
- `VITE_USE_API_AUTH=false` mantiene fallback a mocks/localStorage.

Siguiente módulo recomendado:
- Clases lectura con feature flag `VITE_USE_API_CLASSES`.

## Integración Clases Lectura (Feature Flag)

Variables:
- `VITE_USE_API_CLASSES=false` (default fallback)

Comportamiento:
- `VITE_USE_API_CLASSES=true`: frontend carga clases desde backend (`GET /api/v1/clases`, `GET /api/v1/clases/{id}`, `GET /api/v1/clases/{id}/disponibilidad`).
- Admin > Clases en API mode también usa `GET /api/v1/clases?page=&page_size=&search=&discipline=&status=&coach_id=`, `POST /api/v1/clases`, `PUT /api/v1/clases/{id}` y `DELETE /api/v1/clases/{id}`.
- Admin > Coaches en API mode usa `GET/POST/PUT/PATCH/DELETE /api/v1/coaches`, `POST /api/v1/coaches/{id}/avatar`, `GET /api/v1/coaches/public`, y `coachesStore` queda solo como fallback legacy cuando flags API están apagados.
- Create coach en API mode requiere `password`, `bio`, `instagram` y `public_profile_enabled`; update no modifica password. Avatar se sube por archivo, no por URL manual ni base64.
- En API mode, `Fecha específica` y `Programar publicación` quedan bloqueados hasta que exista contrato de ocurrencias/publicación.
- `VITE_USE_API_CLASSES=false`: frontend conserva flujo actual con mocks/store local.

Notas:
- Adapter `classAdapter` transforma payload backend a shape actual de UI.
- `duration_minutes` es alias preferido en frontend; backend también acepta `duration_min`.
- `description` se acepta en contrato, pero backend aún no la persiste.
- No se integraron aún reservas ni waitlist.

## Validación manual (backend real)
- Auth API y Clases lectura API validadas con flags activos.
- Backend clases no envía `coach_name`; frontend muestra fallback (`Coach #id`) sin romper UI.
- Modo fallback sigue disponible con flags en `false`.

Siguiente integración recomendada: Reservas API.

## Integración Reservas API (Feature Flag)

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
- Backend es source of truth cuando flag está activo.
- Waitlist API sigue pendiente.

## Integración Waitlist API (Feature Flag)

Variable:
- `VITE_USE_API_WAITLIST=false` (default fallback)

Comportamiento:
- `VITE_USE_API_WAITLIST=true`: alta/baja/consulta de lista de espera usando backend por ocurrencia.
- `VITE_USE_API_WAITLIST=false`: flujo local/mock actual.

Endpoints vigentes (API mode):
- `GET /api/v1/lista-espera?occurrenceId=...`
- `POST /api/v1/lista-espera` con `occurrence_id`

## Integración Cortes de Caja (API mode)

Variable:
- `VITE_USE_API_AUTH=true` habilita vista API-first de cortes en Admin.

Comportamiento:
- `GET /api/v1/cortes/hoy`
- `POST /api/v1/cortes/ejecutar`
- `GET /api/v1/cortes?page=&page_size=&from=&to=`
- `GET /api/v1/cortes/{id}`

Notas:
- Fecha e importes se formatean en frontend.
- Error duplicado `CASH_CLOSING_ALREADY_EXISTS` se muestra como mensaje claro.
- Historial y detalle usan TanStack Query.
- `DELETE /api/v1/lista-espera/{id}`

Notas:
- Backend es source of truth para FIFO/promoción cuando flag activo.
- Frontend no promueve localmente en cancelación cuando API waitlist está activa.
- No usar `GET /api/v1/lista-espera?claseId=...` en modo API actual.

Siguiente integración recomendada:
- Notificaciones reales / POS-finanzas (según roadmap), o endurecer QA E2E multi-rol.

## QA E2E Auth + Clases + Reservas + Waitlist

Fecha validación: `2026-05-29`.

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
- Login + sesión (`/auth/me`).
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
- En modo API waitlist activo no se realiza promoción FIFO local en frontend.

Pendientes:
- QA manual visual en navegador con captura de Network por interacción UI completa.

Checklist detallado multi-rol:
- Ver [docs/FRONTEND_E2E_QA_CHECKLIST.md](/D:/Casa_Scarlatta_FrontEnd/docs/FRONTEND_E2E_QA_CHECKLIST.md)
- Plantilla formal de ejecución QA: [docs/FRONTEND_E2E_QA_RUN_TEMPLATE.md](/D:/Casa_Scarlatta_FrontEnd/docs/FRONTEND_E2E_QA_RUN_TEMPLATE.md)

## Sprint Estabilización Core (avance)
- BUG-001 corregido: dashboard cliente “Reservar clase” ahora usa mismo criterio de clases que `/clases` cuando `VITE_USE_API_CLASSES=true`.
- Source of truth en modo API clases: backend + adapter + cache store (sin `CLASES_MOCK` como verdad inicial).
- BUG-003 mitigado en frontend:
  - `reserved_at` ya no se usa como fecha de sesión.
  - matching diario de reservas usa ocurrencia real cuando está disponible.
  - si no hay fecha de sesión, UI aplica estado neutral en filtros diarios.
- Pendientes inmediatos: cierre definitivo BUG-003 (modelo de ocurrencias backend) y BUG-005.

## Update 2026-05-29: cierre BUG-003 con occurrences
- Backend exige `occurrence_id` para `POST /api/v1/reservas`.
- Frontend ahora reserva por ocurrencia real y evita matching por `class_id` plano en modo API.
- Waitlist API migrada a ocurrencia:
  - `GET /api/v1/lista-espera?occurrenceId=...`
  - `POST /api/v1/lista-espera` con `occurrence_id`
  - `DELETE /api/v1/lista-espera/{id}`
- BUG-003 queda cerrado end-to-end (pendiente solo QA visual multi-rol de regresión).

## Hotfix performance de ocurrencias/waitlist (2026-05-29)
- Se aplicó dedupe in-flight para `GET /clases/{id}/ocurrencias` por llave `classId|from|to`.
- Se agregó AbortController en cargas por rango para evitar setState tras unmount/cambio rápido.
- Se eliminó precarga masiva de waitlist en dashboard; waitlist API queda bajo demanda.
- Próxima mejora recomendada: TanStack Query + endpoint bulk/BFF.

## Fix waitlist legacy classId (2026-05-29)
- En modo API (`VITE_USE_API_WAITLIST=true`) waitlist queda estrictamente por `occurrenceId`.
- Se removió refresco legacy por `claseId` tras cancelar reserva API.
- Si falta `occurrenceId`, no se dispara consulta waitlist en API mode.



## Integración BUG-004 Estado Financiero (2026-05-30)
- Endpoint fuente de verdad en modo API cliente:
  - `GET /api/v1/clientes/me/estado-financiero`
- En modo API, `/auth/me` se mantiene para identidad/sesión; no para balance de créditos.
- Frontend refresca estado financiero en:
  - bootstrap/login cliente
  - reserva (`POST /reservas`)
  - cancelación (`POST /reservas/{id}/cancelar`)

Campos usados en UI cliente:
- `credits_balance`
- `active_membership.package_name`
- `active_membership.credits_total|credits_used|credits_available`
- `credit_movements`
- `transactions` (puede venir `[]` temporalmente)

Nota PagoModal en modo API:
- Compra self-service aún no implementada.
- El modal muestra estado controlado: `Compra en línea aún no disponible en modo API`.
- El flujo local/mock de compra se mantiene solo como fallback cuando flags API están en `false`.

## Estado BUG-004 Core (cerrado)
- Estado: **Cerrado (core)**.
- Cubre: créditos/membresía persistentes tras login, refresh, reservar y cancelar usando `GET /api/v1/clientes/me/estado-financiero`.
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
- Métricas de coach en API mode derivan de `agenda.occurrences`.
- Source of truth: `GET /api/v1/coaches/me/agenda?from&to`.
- Sin hardcode ni fuente mock/local en API mode para card “Esta semana”.
- Siguiente bug recomendado: BUG-012.

## Estado BUG-012 (cerrado frontend)
- Sección “Clases de hoy” en CoachPanel API mode ahora deriva de `agenda.occurrences`.
- Source of truth: `GET /api/v1/coaches/me/agenda?from&to`.
- Filtro por `occurrenceDate` del día actual y orden por hora.
- Sin dependencia de `clasesStore`, `coachesStore`, `coachNombre` o `dia` de clase base en API mode.
- Bloque coach P0 (BUG-010/011/012) cerrado funcionalmente.

## Estado BUG-002 (cerrado frontend)
- “Mis clases” permite filtro por estado (`all`, `confirmada`, `cancelada`, `completada`, `no_asistio`).
- En API mode usa reservas adaptadas desde `GET /api/v1/reservas/me`.
- En modo fallback (`flags=false`) se mantiene soporte sobre reservas mock/local.

## Estado BUG-005 (cerrado frontend)
- “Mis próximas clases” en Dashboard Cliente ya no está limitado de forma rígida a 2.
- En API mode, usa reservas reales de `GET /api/v1/reservas/me` con criterio: `confirmada` + hoy/futuras + orden por ocurrencia.
- Límite visual configurable actual: `4` (`UPCOMING_RESERVATIONS_LIMIT`).
- Se agregó CTA “Ver todas” hacia “Mis clases” con filtro `confirmada`.
- BUG-006 permanece como siguiente paso para paginación/listados globales.

## Estado BUG-006A/B (mitigación frontend aplicada)
- Se añadieron controles de paginación visual en listados críticos ya cargados en memoria:
  - Cliente: historial de movimientos/transacciones en Paquetes & Pagos.
  - Admin: clases en vista lista.
  - Admin: historial de reservas en modal de usuario.
- No se modificaron endpoints ni reglas de negocio.
- BUG-006C queda pendiente para paginación backend real (`page/page_size/total/items`).

## Estado BUG-006C (frontend incremental)
- Se agregó compatibilidad de frontend con contrato paginado backend (`page/page_size/total/items`) sin romper legacy.
- Integraciones activas:
  - Admin clases (vista lista, filtro `Todas`) con paginación backend.
  - Cliente movimientos de crédito desde endpoint paginado dedicado.
- Se mantiene transición segura: respuestas array legacy siguen soportadas.
- Pendiente siguiente: migrar "Mis clases" cliente a paginación backend conservando UX semanal.

## Estado BUG-006C (cierre frontend alcance actual)
- Se cerró migración paginada de “Mis clases” cliente en API mode usando `reservas/me` paginado con `status/from/to`.
- Se conserva UX semanal/filtro y refetch tras cancelación.
- “Mis próximas clases” permanece estable y separado de este flujo.
- Legacy/fallback mock se mantiene para flags false.
- Próximo paso: paginación backend en listados admin globales cuando backend exponga contratos.

## Cierre pre-BUG-009
Core stabilization listo para QA final pre-Mercado Pago.
Siguiente módulo recomendado: BUG-009 (integración Mercado Pago).
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
- Landing usa catálogo backend real `GET /api/v1/memberships/packages` en API mode.
- Compra desde landing no procesa pago ahí: guarda intención y lleva a login o dashboard pagos.
- Usuario cliente autenticado va directo a `/cliente/dashboard?section=pagos&packageId=...`.
- Pago real sigue solo dentro de `ClientPanel` con `PagoModal` + backend checkout.
## Nota 2026-06-07 - Reservar visual premium
- `/reservar` recupera flujo visual premium: cards grandes STRYDE X / SLOW, paso sala -> clase -> spot.
- Reserva real sigue usando flujo actual por spots/holds; no se toca backend ni contratos.
- Público ve catálogo/clases; acciones de reservar siguen bajo auth de cliente.

## Admin Usuarios/clientes API-first

- Usa `GET/POST/PUT/DELETE /api/v1/clientes` y detalle real por id.
- Password solo en create; update no modifica password.
- Asignacion manual usa `/clientes/{id}/paquetes`; creditos usan `/clientes/{id}/credits`.
- Catalogo de asignacion viene de `GET /api/v1/memberships/packages`.
- `usuariosStore` y `paquetesStore` quedan solo como fallback con API desactivada.

## Paquetes admin en API mode

- Admin > Paquetes usa catálogo backend real `GET /api/v1/memberships/packages`.
- CRUD admin usa `POST/PUT/PATCH/DELETE /api/v1/memberships/packages`.
- `type` no es canónico.
- No existe ilimitado; `credits` siempre > 0.
- `benefits` se captura como lista de líneas.
- Historial de ventas queda como pendiente de Reportes en API mode.

## Paquetes compartibles

Frontend ya consume catálogo vendible y membresías compartidas:
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

Frontend MVP uses TanStack Query for server state. Zustand queda para fallback legacy y UI local. Lecturas con `useQuery`, mutaciones con `useMutation`, refetch con invalidate tras éxito. No usar `page_size=1000`.

## Integración POS API (Feature Flag)

Variable:
- `VITE_USE_API_POS=true` o el flag de API general que use la app para admin.

Comportamiento:
- `PuntoDeVentaSection` usa `GET /api/v1/productos`, `GET /api/v1/memberships/packages`, `GET /api/v1/clientes`, `GET /api/v1/ventas` y `POST /api/v1/ventas` en modo API.
- Carrito sigue local de UI; backend valida stock, total y beneficiarios.
- Venta exitosa abre modal con ticket, PDF y link público para WhatsApp Web.
- `public_ticket_url` es la URL recomendada para compartir.
- `POS` no usa Mercado Pago.
- Fallback legacy se conserva cuando flags API están en `false`.

## Integración Finanzas Admin (API mode)

Variable:
- usa mismo modo API admin que dashboard/POS.

Comportamiento:
- `DashboardSection` consume KPIs reales desde `/api/v1/finanzas/kpis`, `/api/v1/finanzas/dia`, `/api/v1/finanzas/categorias`, `/api/v1/finanzas/stock-bajo` y `/api/v1/finanzas/ventas-recientes`.
- Métricas visibles: ventas, gastos, neto, corte, métodos de pago, clientes activos, reservas, productos vendidos, paquetes vendidos, stock bajo y ventas recientes.
- Frontend solo formatea moneda/fecha y deja backend como source of truth en API mode.
- Fallback legacy se conserva cuando flags API están en `false`.

Notas:
- `useApiQueries` y TanStack Query manejan server state.
- `posApiService` maneja productos, ventas y tickets.
- No usar `page_size=1000`.
