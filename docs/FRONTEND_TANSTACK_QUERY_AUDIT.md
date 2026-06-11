# Frontend TanStack Query Audit

Fecha: 2026-06-09
Repo: D:\Casa_Scarlatta_FrontEnd
Branch: local
Responsable: Codex

## Resumen ejecutivo

- Modulos auditados: auth/perfil, cliente, admin, coach, POS, finanzas, reportes, activity, home, navbar.
- TanStack Query ya cubre server state fuerte en cliente, coach, POS, finanzas, reportes y roster.
- Legacy/store aun viven en API mode como fallback en AdminDashboard, AdminFinanzas legacy, AdminReportes legacy y stores demo.
- Riesgo alto: cualquier pantalla que lea store como verdad en API mode.
- Accion: cerrar invalidaciones por mutacion y aislar dead code legacy.

## Tabla general

| Modulo | Archivo(s) | Lectura actual | Mutacion actual | Usa TanStack Query | Usa store/localStorage en API mode | Queries a invalidar | Riesgo | Accion |
|---|---|---|---|---|---|---|---|---|
| Auth/perfil | `src/context/AuthContext.jsx`, `src/features/perfil/*` | `auth/me` | editar perfil | parcial | si, solo fallback legacy | `auth.me` | P1 | Mantener query para identidad; fallback solo off |
| Cliente dashboard | `src/pages/cliente/ClientPanel.jsx` | memberships, estado financiero, pagos, coaches public, clases/reservas | compartir beneficiario, reservar/cancelar | si | si, en fallback | `myFinancialState`, `myMemberships`, `myPayments`, `reservations.me`, `classes.occurrences`, `occurrenceRoster.detail`, `spots.byOccurrence`, `waitlist.byOccurrence` | P0 | Seguir limpiando stores legacy por seccion |
| Cliente reservas | `src/pages/cliente/ClientPanel.jsx`, `src/features/reservas/*` | reservas reales + occurrences | reservar/cancelar/hold | si | si, en fallback | `reservations.me`, `classes.occurrences`, `occurrenceRoster.detail`, `spots.byOccurrence`, `waitlist.byOccurrence` | P0 | Mantener invalidaciones al centro |
| Cliente pagos/membresias | `src/pages/cliente/ClientPanel.jsx`, `src/features/pagos/*` | memberships, movimientos, pagos | compartir beneficiario | si | no en API mode | `myMemberships`, `myFinancialState`, `myCreditMovements`, `myPayments` | P1 | Ya alineado a Query |
| Cliente mis clases | `src/pages/cliente/ClientPanel.jsx`, `src/pages/cliente/MisClasesCard.jsx` | reservas y roster | cancelar reserva | parcial | si, fallback | `reservations.me`, `occurrenceRoster.detail` | P1 | Terminar de quitar stores del camino live |
| Admin dashboard | `src/pages/admin/sections/DashboardSection.jsx`, `src/pages/admin/AdminDashboard.jsx` | KPIs, ventas, stock, corte | export CSV | si en shell real | si en legacy dead code | `finance/*`, `cashClosings/*`, `reports/*` | P1 | Mantener `DashboardSection`; `AdminDashboard` dead code |
| Admin clases | `src/pages/admin/sections/ClasesSection.jsx`, `src/pages/admin/AdminPanel.jsx` | clases, occurrences, roster | create/edit/delete, enrollment, seat flow | parcial | si, parte legacy | `classes.list`, `classes.occurrences`, `occurrenceRoster.detail`, `spots.byOccurrence`, `reservations.me`, `clients.list` | P0 | Migrar mutations criticas a mutation hooks si faltan |
| Admin alumnos/roster | `src/pages/admin/AdminPanel.jsx`, `src/pages/admin/sections/ClasesSection.jsx` | roster por occurrence | inscribir/cancelar/no-show/seat | parcial | si, parte legacy | `occurrenceRoster.detail`, `classes.occurrences`, `classes.list`, `spots.byOccurrence`, `clients.list` | P0 | Refetch obligatorio tras cada mutacion |
| Admin coaches | `src/pages/admin/sections/CoachesSection.jsx`, `src/pages/admin/AdminPanel.jsx` | coaches list/public | create/update/status/avatar/delete | si | no en API mode | `coaches.list`, `coaches.public`, `adminBadges.coachesActive`, `classes.list`, `classes.occurrences` | P1 | Mantener invalidacion tras avatar/status CRUD |
| Admin usuarios/clientes | `src/pages/admin/sections/UsuariosSection.jsx`, `src/pages/admin/AdminPanel.jsx` | clients list/detail | create/update/delete/package/credits/beneficiaries | si | no en API mode | `clients.list`, `clients.detail`, `adminBadges.clientsActive`, `reports.users`, `financialState` | P0 | Query + invalidacion ya es camino correcto |
| Admin paquetes | `src/pages/admin/sections/PaquetesSection.jsx`, `src/pages/admin/packageApiPayload.js` | catalogo packages | create/update/status/featured/delete | si | no en API mode | `packages.list`, `packages.public`, `clients.detail`, `reports.packages`, `myMemberships` | P1 | Mantener API-first; fallback solo demo |
| Admin POS | `src/pages/admin/sections/PuntoDeVentaSection.jsx` | products, categories, sales, tickets | CRUD producto/categoria, venta, stock, status | si | si, UI carrito local | `posProducts`, `posProductCategories`, `posSales`, `posSaleDetail`, `cashClosings.today`, `adminClients`, `myFinancialState` | P0 | Carrito local ok; server state debe quedar en Query |
| Admin finanzas | `src/pages/admin/components/FinanzasApiSection.jsx`, `src/pages/admin/AdminFinanzas.jsx` | KPIs, day summary, historical, expenses, cuts | create/edit/cancel/delete expense, execute cut, export | si en API section | si, legacy dead code | `finance/*`, `expenses/*`, `cashClosings/*`, `reports.finances` | P0 | Dejar legacy solo fallback; no tocar datos en API mode |
| Admin reportes | `src/pages/admin/components/ReportesApiSection.jsx`, `src/pages/admin/AdminReportes.jsx` | reports agregados reales | export CSV/PDF | si en API section | si, legacy dead code | `reports/*`, `payTable.all` | P1 | Mantener shell visual; API mode real ya conectado |
| Admin actividad | `src/pages/admin/sections/ActividadSection.jsx` | eventos sistema | lectura real en API mode | si | si, solo fallback | `activity.list` | P1 | API mode real; legacy solo con flags off |
| Coach agenda | `src/pages/coach/CoachPanel.jsx` | agenda + roster | asistencia / roster flows | parcial | si, stores fallback | `coaches.me.agenda`, `occurrenceRoster.detail` | P1 | Separar agenda live de legacy visual |
| Coach roster | `src/pages/coach/CoachPanel.jsx` | roster por occurrence | marcar asistencia/no-show | parcial | si, fallback | `occurrenceRoster.detail`, `coachAgenda` | P1 | Usar mismo hook que admin |
| Waitlist | `src/features/waitlist/*`, `src/pages/cliente/ClientPanel.jsx` | waitlist por occurrence | unirse/salir | parcial | si en fallback | `waitlist.byOccurrence`, `occurrenceRoster.detail` | P1 | Mantener invalidacion por occurrence |
| Spots/holds | `src/features/clases/SeatSelector.jsx`, `src/features/reservas/*` | map de spots / hold | hold/confirm seat | parcial | si en fallback | `spots.byOccurrence`, `occurrenceRoster.detail`, `reservations.me` | P0 | No hacer reserva sin refetch de seat map |
| Navbar/session | `src/components/layout/Navbar.jsx` | user session + coach avatar | logout | parcial | si, fallback local | `auth.me`, `coaches.public` | P2 | Mantener query para avatar/session live |
| Home/landing publica | `src/features/home/*`, `src/pages/Nosotros.jsx` | coaches public, config fallback | n/a | parcial | si, config localStorage | `coaches.public`, `packages.public`, `configuracion` | P2 | Fallback aceptable hasta contrato configuracion |

## Modulos ya bastante alineados

- `DashboardSection.jsx`
- `ReportesApiSection.jsx`
- `FinanzasApiSection.jsx`
- `PuntoDeVentaSection.jsx`
- `ClientPanel.jsx`
- `CoachPanel.jsx`
- `CoachesSection.jsx`
- `UsuariosSection.jsx`
- `PaquetesSection.jsx`

## Stores legacy detectados en API mode

- `clasesStore`
- `coachesStore`
- `usuariosStore`
- `paquetesStore`
- `reservasStore`
- `transaccionesStore`
- `cortesStore`
- `gastosStore`
- `tabuladorStore`
- `actividadStore`
- `configuracionStore`

## Riesgos

- `AdminDashboard.jsx` puede reintroducir datos fake si alguien lo usa como panel real.
- `finanzasService.js` sigue siendo demo/legacy; no debe alimentar API mode.
- `tabuladorStore` sigue siendo source demo para pago coach cuando backend no aplica.
- `localStorage` sigue siendo state UI/fallback, no verdad backend.
- Notificaciones, configuración de correo y outbox ya tienen hooks Query; badge unread y panel deben invalidar/refetch con Query, no con store.
- `ConfiguracionCorreoSection` es API-only; passwords solo viajan si usuario los escribe.

## Addendum 2026-06-10

- `PaymentReturnPage` ya invalida finanzas, membresias, movimientos, pagos, notificaciones y actividad tras pago `approved + applied`.
- `spotHolds.byOccurrence` ya existe como key de invalidacion para mapa de asientos/holds.
- `occurrenceRoster.detail(occurrenceId, includeCanceled)` ya es key canonica para roster por occurrence.
- CRUD de paquetes y coaches sigue usando hooks Query para mutaciones; refresh manual queda fuera del flujo principal.
- RBAC frontend ya consume `GET /api/v1/auth/me` enriquecido y `GET/POST/PUT/PATCH/DELETE /api/v1/rbac/*` via TanStack Query.
- `Roles y permisos` en Configuracion ya no usa mocks/localStorage como source of truth en API mode.
