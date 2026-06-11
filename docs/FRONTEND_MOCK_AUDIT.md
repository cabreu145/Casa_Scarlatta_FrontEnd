# Frontend Mock / Hardcoded Data Audit

Fecha: 2026-06-09
Repo: D:\Casa_Scarlatta_FrontEnd\frontend
Branch: Disenio_Cabreu
Responsable: Codex

## Resumen ejecutivo

- Total hallazgos documentados: 27
- Criticos P0/P1: 11
- Backend ya existe, falta conectar: 10
- Backend faltante: 4
- Fallback legacy aceptable: 11
- Recomendacion de prioridad: cerrar primero finanzas legacy, luego limpieza de stores demo y config hardcoded.

## Tabla general

| ID | Area | Pantalla/componente | Archivo | Tipo | Que esta mockeado/hardcodeado | Fuente actual | Backend existente | Backend requerido | Prioridad | Recomendacion |
|---|---|---|---|---|---|---|---|---|---|---|
| ADM-01 | AdminDashboard | `AdminDashboard` legacy | `frontend/src/pages/admin/AdminDashboard.jsx` | A | `mockTransacciones`, `ingresosUltimosMeses`, `paquetesPorVencer`, KPIs y chart data staticos | Mock/local stores | Si, via `DashboardSection` + `/api/v1/finanzas/*` | No para este archivo; ya hay replacement activo | P3 | Dejar como dead code o eliminar despues |
| ADM-02 | Finanzas | `FinanzasSection` | `frontend/src/pages/admin/AdminFinanzas.jsx` | A/C | API mode usa KPIs, gastos, cortes y export real; legacy queda solo fallback | `useApiQueries` + `finanzasService` fallback | Si: `/api/v1/finanzas/kpis`, `/dia`, `/categorias`, `/ventas-recientes`, `/finanzas/exportar`, `/cortes/*`, `/gastos/*` | No para API mode; legacy solo off | P0 | Reactivar API mode con backend real; dejar legacy solo como fallback |
| ADM-03 | Finanzas | Serie historica grafica | `frontend/src/services/finanzasService.js` | A/E | `Math.random()` queda solo en demo legacy; API mode usa backend real | Legacy/calculos locales | Si, endpoints de finanzas y cortes | No para API mode | P0 | Mantener solo legacy/demo y no usar como source of truth |
| ADM-04 | Finanzas | Corte de caja legacy | `frontend/src/pages/admin/AdminFinanzas.jsx` | A/C | Corte, gastos del dia y neto ya salen de backend en API mode; legacy queda fallback | `useApiQueries` + stores fallback | Si: `/api/v1/cortes/hoy`, `/api/v1/cortes/ejecutar`, `/api/v1/cortes`, `/api/v1/cortes/{id}`, `/api/v1/gastos` | No para API mode | P0 | Mantener legacy solo para flags API off |
| REP-01 | Reportes | Reporte financiero/usuarios | `frontend/src/pages/admin/AdminReportes.jsx` | C | En API mode consume `/api/v1/reportes/*`; legacy usa `mockUsers`, `ingresosUltimosMeses` y tablas locales | `reportsApiService` + legacy fallback | Si: endpoints de reportes agregados | No para API mode; legacy solo fallback | P0 | Ya conectado en API mode; mantener fallback solo off |
| REP-02 | Reportes | Tabulador de pagos | `frontend/src/stores/tabuladorStore.js` + `AdminReportes.jsx` | D | Tabulador editable persiste en localStorage y se usa para pago por coach | localStorage | No hay endpoint real visible en frontend | Si: tabulador backend por disciplina/rango | P1 | No seguir con mock si se quiere reporte de coach formal |
| REP-03 | Reportes | Reporte de coaches | `frontend/src/pages/admin/AdminReportes.jsx` + `finanzasService.js` | A/C/E | API mode usa reporte real; legacy calcula ocupacion y pago por coach con tabulador local | `reportsApiService` + `finanzasService` fallback | Parcial: `GET /api/v1/coaches/me/agenda` existe, pero pago agregado no | Si: reporte de coaches backend o BFF | P1 | Separar agenda real de reporte de pago |
| REP-04 | Reportes | Metricas generales / top 5 / estado clientes | `frontend/src/pages/admin/AdminReportes.jsx` | C | API mode usa endpoints reales; legacy usa arrays y stores locales | `reportsApiService` + fallback legacy | Backend existe para fuentes base y reportes agregados | Si: agregados de reportes | P0 | No mostrar como dato real en API mode |
| REP-05 | Reportes | Export Excel/PDF local | `frontend/src/pages/admin/AdminReportes.jsx` | C | API mode deja export avanzada pendiente; legacy exporta desde arrays locales | Calculos locales | Hay backend de reportes y finanzas/export CSV, pero no export completo legacy | Si: endpoints de reportes/export agregados | P2 | Mantener solo si se etiqueta como legacy |
| HOME-01 | Home/Config | Config global del estudio | `frontend/src/stores/configuracionStore.js` | D | Defaults hardcoded: textos, imagenes, carousel, links, horarios | localStorage + defaults | No hay API de configuracion visible | Si: `/api/v1/configuracion` o equivalente | P1 | Backend faltante; ahora es fuente unica de contenido home |
| HOME-02 | Home | Hero carousel | `frontend/src/features/home/HeroCarousel.jsx` | D | Slides, videoId y URLs salen de `configuracionStore` | localStorage | No hay endpoint real de contenido home | Si: config media/home | P2 | Backend requerido para contenido editable |
| HOME-03 | Home | Disciplinas section | `frontend/src/features/home/DisciplinasSection.jsx` | D | Imagenes y rutas vienen de `configuracionStore` con defaults locales | localStorage | No hay endpoint real de contenido home | Si: config media/home | P2 | Backend requerido para contenido editable |
| HOME-04 | Home | Coaches CTA | `frontend/src/features/home/CoachesCtaSection.jsx` | D | Banner sale de `configuracionStore` | localStorage | No hay endpoint real de contenido home | Si: config media/home | P2 | Backend requerido para imagen editable |
| LEG-01 | Paquetes | Catalogo legacy | `frontend/src/stores/paquetesStore.js` | B/C | Paquetes iniciales con nombres fijos, incluido `Premium` con clases ilimitadas en demo | localStorage | Si: `/api/v1/memberships/packages` ya existe | No para API mode; fallback solo off | P1 | Mantener solo demo legacy, no fuente real |
| LEG-02 | Coach pay | Tabulador legacy | `frontend/src/stores/tabuladorStore.js` | D | Rango de pago por disciplina en localStorage | localStorage | No visible | Si: backend de tabulador | P1 | Backend requerido si se quiere reporteo real |
| LEG-03 | Finanzas/legacy | Transacciones legacy | `frontend/src/stores/transaccionesStore.js` | B/C | Historial y KPIs viejos dependian de este store | localStorage | Si: POS, ventas, finanzas reales ya existen | No para API mode | P1 | Seguir solo como fallback demo |
| LEG-04 | Finanzas/legacy | Cortes legacy | `frontend/src/stores/cortesStore.js` | B/C | Cortes y resumen historico locales | localStorage | Si: `/api/v1/cortes/*` existe | No para API mode | P1 | Mantener solo fallback legacy |
| LEG-05 | Usuarios/legacy | Clientes legacy | `frontend/src/stores/usuariosStore.js` | B/C | Lista y detalle viejo de clientes | localStorage | Si: `/api/v1/clientes` ya existe | No para API mode | P1 | Mantener solo fallback demo |
| LEG-06 | Coaches/legacy | Coaches legacy | `frontend/src/stores/coachesStore.js` | B/C | Coaches mock y fotos/fallbacks de equipo | localStorage | Si: `/api/v1/coaches` y `/api/v1/coaches/public` existen | No para API mode | P1 | Mantener solo fallback demo |
| LEG-07 | POS/legacy | Productos legacy | `frontend/src/stores/productosStore.js` | B/C | Productos demo/seed locales | localStorage | Si: `/api/v1/productos` y `/api/v1/productos/categorias` existen | No para API mode | P1 | Mantener solo fallback demo |
| LEG-08 | Reservas/legacy | Reservas legacy | `frontend/src/stores/reservasStore.js` | B/C | Reservas en localStorage, historico y estados antiguos | localStorage | Si: `/api/v1/reservas/*` existe | No para API mode | P1 | Mantener solo fallback demo |
| LEG-09 | Waitlist/legacy | Lista de espera legacy | `frontend/src/stores/listaEsperaStore.js` | B/C | Cola local para modo demo | localStorage | Si: waitlist backend existe | No para API mode | P2 | Mantener solo fallback demo |
| MIX-01 | Cliente | `ClientPanel` | `frontend/src/pages/cliente/ClientPanel.jsx` | B/C | Mixto: API real en finanzas/membresias, pero fallback store para reservas/clases y algunas pantallas | TanStack Query + stores legacy | Si: auth, clases, reservas, finanzas, memberships, beneficiaries | No para API mode | P1 | Seguir limpiando dependencia a stores legacy por seccion |
| MIX-02 | Coach | `CoachPanel` | `frontend/src/pages/coach/CoachPanel.jsx` | B/C/D | Agenda real via API, pero `PERF_BARS` y parte de metricas siguen locales | API + stores legacy | Si: `GET /api/v1/coaches/me/agenda` existe | Si para metricas/pagos coach agregados | P2 | Separar agenda real de metricas demo |
| MIX-03 | POS | `PuntoDeVentaSection` | `frontend/src/pages/admin/sections/PuntoDeVentaSection.jsx` | B/C | Carrito local de UI, preview subtotal/IVA/total y fallback demo cuando API off | TanStack Query + UI local | Si: productos, categorias, ventas, tickets, clientes, paquetes existen | No para carrito; si para futuro POS avanzado | P1 | Mantener carrito local; no inventar source of truth |
| MIX-04 | Pricing | `PricingSection` | `frontend/src/features/home/PricingSection.jsx` | B/C | Usa `paquetesStore` si API off y `getMembershipPackagesApi` si API on | API + fallback legacy | Si: `/api/v1/memberships/packages` existe | No | P2 | Fallback aceptable, ya existe API path |
| MIX-05 | Payments tracking | `paymentTracking` / intent helpers | `frontend/src/features/pagos/paymentTracking.js`, `frontend/src/utils/packagePurchaseIntent.js` | B | Guarda refs pendientes y tracking en localStorage/sessionStorage | Web storage | No aplica como source of truth | No | P3 | Aceptable como UI state; no confundir con dato real |

## Hallazgos por area

### AdminDashboard
- `AdminDashboard.jsx` sigue mockeado y no debe tomarse como panel activo. Usa `mockTransacciones`, `ingresosUltimosMeses` y `paquetesPorVencer`.
- Panel activo real es `DashboardSection.jsx`, ya API-backed con `/api/v1/finanzas/*`.
- Riesgo real: si alguien reutiliza `AdminDashboard.jsx`, reintroduce datos inventados.

### Finanzas
- `AdminFinanzas.jsx` sigue siendo legacy pesado. Calcula utilidad neta, ticket promedio, ingresos historicos y corte con stores.
- `finanzasService.js` hace calculo local y usa `Math.random()` para serie diaria. Eso es mock critico.
- Backend ya existe para KPIs, resumen del dia, categorias, stock bajo, ventas recientes, export CSV, cortes y gastos.
- Recomendacion: migrar o desactivar legacy para API mode; dejar solo fallback demo.

### Reportes
- `AdminReportes.jsx` ya usa backend real de reportes operativos en modo API.
- `mockUsers`, `ingresosUltimosMeses` y `useTabuladorStore` quedan solo para fallback legacy.
- Backend ya cubre finanzas, usuarios, paquetes, POS, coaches, top clases y ocupacion por disciplina.
- Reportes agregados no reemplazan reporteo contable/fiscal formal.

### POS
- POS activo ya esta bastante API-first. Queda carrito local de UI, que es correcto.
- No hay mock critico visible en ventas/tickets cuando API mode esta activo; el riesgo es el fallback legacy y previews calculados localmente.
- `page_size=100` aparece en servicios, no `1000`.
- El punto sensible es evitar que el fallback demo se use como verdad en API mode.

### Usuarios/clientes
- `ClientPanel.jsx` ya consume backend para estado financiero, memberships y movimientos de credito, pero aun mezcla stores legacy para reservas/clases y algunas pantallas.
- `usuariosStore` sigue existiendo como fallback demo y debe considerarse legacy.
- No hay mock critico visible en API mode para cliente, pero si hay riesgo en fallback cuando flags estan off.

### Paquetes
- `paquetesStore` sigue siendo demo puro con paquetes fijos, incluido `Premium` con clase ilimitada. Eso ya no representa backend real.
- `PricingSection` ya puede leer backend real, pero conserva fallback demo si API flags estan apagadas.
- `displayName` ya existe como fallback visual backend, pero el store legacy sigue teniendo nombres y precios inventados.

### Coach
- `CoachPanel.jsx` ya usa `GET /api/v1/coaches/me/agenda` para API mode.
- Aun conserva `PERF_BARS` y parte de las metricas locales como fallback visual cuando API esta off.
- El tablero de coach necesita backend agregado solo para pagos/metricas detalladas.

### Cliente
- `ClientPanel.jsx` ya esta muy cerca de API-first completo.
- Fallback legacy aun existe para reservas/clases, pero esta detras de flags.
- No se detecto mock critico visible en modo API, pero sigue habiendo mezcla de stores en modo demo.

## Endpoints backend existentes que ya se pueden conectar

| Area | Endpoint | Uso sugerido | Frontend pendiente |
|---|---|---|---|
| Finanzas | `/api/v1/finanzas/kpis` | KPIs reales del dashboard/admin | Dashboard/API mode |
| Finanzas | `/api/v1/finanzas/dia` | Resumen del dia y gastos recientes | Dashboard/API mode |
| Finanzas | `/api/v1/finanzas/categorias` | Desglose por categorias | Dashboard/API mode |
| Finanzas | `/api/v1/finanzas/stock-bajo` | Lista de productos con stock bajo | Dashboard/API mode |
| Finanzas | `/api/v1/finanzas/ventas-recientes` | Tabla de ventas recientes | Dashboard/API mode |
| Finanzas | `/api/v1/finanzas/exportar` | CSV operativo | Dashboard UI export |
| Cortes | `/api/v1/cortes/hoy` | Resumen corte del dia | CortesSection |
| Cortes | `/api/v1/cortes/ejecutar` | Ejecutar corte | CortesSection |
| Cortes | `/api/v1/cortes?page=&page_size=&from=&to=` | Historial cortes | CortesSection |
| Cortes | `/api/v1/cortes/{id}` | Detalle con ventas incluidas | CortesSection |
| Gastos | `/api/v1/gastos` | CRUD gastos | GastosSection |
| Coaches | `/api/v1/coaches` | CRUD coaches admin | CoachesSection |
| Coaches | `/api/v1/coaches/public` | Landing / seccion publica coaches | Home/Nosotros |
| Clientes | `/api/v1/clientes` | CRUD clientes admin | UsuariosSection |
| Paquetes | `/api/v1/memberships/packages` | Catalogo admin/publico | Paquetes/Pricing |
| POS | `/api/v1/productos` | Productos POS | PuntoDeVentaSection |
| POS | `/api/v1/productos/categorias` | Categorias POS | PuntoDeVentaSection |
| POS | `/api/v1/ventas` | Ventas POS | PuntoDeVentaSection |
| Cliente | `/api/v1/clientes/me/memberships` | Membresias y beneficiarios | ClientPanel |
| Cliente | `/api/v1/clientes/me/estado-financiero` | Estado financiero cliente | ClientPanel |
| Reservas | `/api/v1/reservas/*` | Reservas reales | ClientPanel / reservas |

## Endpoints backend faltantes sugeridos

| Area | Endpoint sugerido | Motivo | Prioridad |
|---|---|---|---|
| Reportes | `/api/v1/reportes/finanzas` | Reporte financiero agregado formal | P0 |
| Reportes | `/api/v1/reportes/usuarios` | KPI / estado de clientes / cohortes | P1 |
| Reportes | `/api/v1/reportes/paquetes` | Ventas, renovaciones, compartidos | P1 |
| Reportes | `/api/v1/reportes/pos` | Ticket promedio, mix de pagos, ventas por categoria | P1 |
| Reportes | `/api/v1/reportes/coaches` | Ocupacion, pago por coach, asistencia | P1 |
| Reportes | `/api/v1/reportes/top-clases` | Top 5 clases mas llenas | P2 |
| Reportes | `/api/v1/reportes/ocupacion-por-disciplina` | SLOW/STRYDE y tendencias | P2 |
| Configuracion | `/api/v1/configuracion` | Home/carousel/textos/imagenes | P1 |
| Tabulador | `/api/v1/tabulador` | Pagos coach por disciplina | P1 |
| Finanzas historicas | `/api/v1/finanzas/historico` | Serie historica real sin random | P1 |

## Quick wins frontend

- Dejar `AdminDashboard.jsx` como dead code y documentar que dashboard real ya es `DashboardSection.jsx`.
- Mover `AdminFinanzas.jsx` y `AdminReportes.jsx` a estado legacy claro o migrarlos a API real por fases.
- `AdminReportes.jsx` ya migró a API mode con `/api/v1/reportes/*`; legacy queda solo fallback.
- Quitar cualquier uso de `Math.random()` en metricas financieras visibles.
- Mantener `paquetesStore`, `usuariosStore`, `coachesStore`, `cortesStore`, `transaccionesStore`, `reservasStore` solo como fallback demo.

## Requiere backend

- Reportes agregados de coaches, usuarios, paquetes, POS y estado de clientes avanzado.
- Configuracion global editable del estudio.
- Tabulador de pagos por coach/disciplina.
- Serie historica financiera real para evitar graficas con random.
- Top clases y ocupacion por disciplina como agregados formales.

## Recomendacion de roadmap

1. Cerrar reportes y finanzas legacy de AdminReportes/AdminFinanzas.
2. Definir backend de configuracion y tabulador.
3. Eliminar o aislar stores demo no usados en API mode.
4. Revisar home sections con contenido editable.
5. Limpieza final de dead code (`AdminDashboard.jsx`) y arrays staticos visibles.

## Quick fix aplicado

- `AdminFinanzas.jsx` usa backend real en modo API.
- `AdminReportes.jsx` usa backend real de reportes en modo API.
- CSV/PDF de reportes ya salen de datos reales, no de mocks, en modo API.
- `finanzasService.js` marcado como legacy/demo only para calculos locales.
- Mocks se conservan solo para fallback legacy con flags API apagadas.
- BadgeCount de Coaches y Usuarios ya sale de totales backend en API mode.
- Avatares de coach ya priorizan `avatar_url` / `avatarUrl` con fallback de iniciales.
- `Admin > Actividad` ya consume `GET /api/v1/actividad` en API mode; `GET /api/v1/audit` queda legacy basico.
- Notificaciones, correo y outbox ya tienen hooks Query; badge unread y panel no dependen de store legacy en API mode.


## Quick fix clases
- Admin > Clases usa occurrences para fecha en API mode.
- Roster detallado por occurrence ya usa backend real.
- `AdminPanel` y `CoachPanel` invalidan roster tras inscripción manual o seat flow.

## Estado TanStack Query

- API mode debe usar `useQuery`/`useMutation` para server state.
- Zustand/localStorage quedan solo para fallback legacy y UI local.
- No usar mocks como verdad en API mode.
- `AdminDashboard.jsx` sigue siendo legacy/dead code; `DashboardSection.jsx` es shell vivo.

## Addendum 2026-06-10

- `PaymentReturnPage` ya invalida finanzas, membresias, movimientos, pagos, notificaciones y actividad tras pago `approved + applied`.
- `spotHolds.byOccurrence` ya existe y se invalida desde mutation hooks.
- `occurrenceRoster.detail(occurrenceId, includeCanceled)` ya es key canonica para roster privado.
- Refresh manual queda como fallback legacy solamente.
- `Configuracion > Roles y permisos` ya consume backend real RBAC (`/api/v1/rbac/*`) en API mode.
- `/auth/me` ya hidrata `roleCode`, `roleName` y `permissions`; frontend usa esos permisos para ocultar modulos sensibles por UX.
