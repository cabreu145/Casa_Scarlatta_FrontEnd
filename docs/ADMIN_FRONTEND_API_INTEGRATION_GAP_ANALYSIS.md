# Admin Frontend API Integration Gap Analysis

Fecha: 2026-06-07  
Scope: frontend-only diagnÃ³stico. Sin cambios de backend, sin refactor funcional.

## Resumen ejecutivo

El panel admin sigue en estado mixto:

- **API real parcial**: `Clases`.
- **API-first ya cerrado**: `Clases`, `Coaches`, `POS`.
- **Mock/local dominante**: Usuarios/clientes, Paquetes/membresÃ­as, POS, Transacciones/pagos, Gastos, Cortes, Reportes, ConfiguraciÃ³n.
- **Legacy/dead code o auxiliar**: `AdminDashboard.jsx` sigue leyendo mocks y stores locales.

La integraciÃ³n mÃ¡s madura estÃ¡ en clases. El resto depende de stores persistidos, arrays hardcoded, `localStorage` vÃ­a Zustand persist, o helpers de negocio que todavÃ­a simulan backend.

## Inventario por mÃ³dulo

> Fuente actual:
> - **API**: datos ya vienen de backend.
> - **mock/local**: datos salen de stores persistidos, arrays hardcoded o helpers locales.
> - **mixta**: mezcla API + fallback local/mock.

| MÃ³dulo | Componente principal | Store actual | Service actual | Fuente actual | Operaciones soportadas hoy | Endpoint backend esperado | Riesgo | Prioridad |
|---|---|---|---|---|---|---|---|---|
| Dashboard | `src/pages/admin/AdminDashboard.jsx`, `src/pages/admin/sections/DashboardSection.jsx` | `clasesStore`, `transaccionesStore`, `usuariosStore`, `reservasStore`, `paquetesStore` | `dashboardService`, `getDashboardMetrics` | mock/local | mÃ©tricas, conteos, ingresos, actividad reciente | `GET /api/v1/admin/dashboard` o endpoints de mÃ©tricas agregadas | Alto: mÃ©tricas no confiables | Admin-4 |
| Clases | `src/pages/admin/sections/ClasesSection.jsx`, flujo en `AdminPanel.jsx` | `clasesStore` como cache/fallback | `clasesApiService`, `reservasService`, `buildClaseApiPayload` | **API-first** | listar, crear, editar, eliminar/desactivar, ver ocurrencias/disponibilidad | `GET/POST/PUT/DELETE /api/v1/clases`, `GET /api/v1/clases/{id}/ocurrencias`, `GET /api/v1/clases/{id}/disponibilidad` | Medio | **Admin-1** |
| Coaches | `src/pages/admin/sections/CoachesSection.jsx`, flujo en `AdminPanel.jsx` | `coachesStore` como fallback | `coachesApiService`, `coachApiPayload` | **API-first** | listar, crear, editar, eliminar, activar/desactivar, upload avatar, secciÃ³n pÃºblica | `GET/POST/PUT/PATCH/DELETE /api/v1/coaches`, `POST /api/v1/coaches/{id}/avatar`, `GET /api/v1/coaches/public`, opcional `GET /api/v1/coaches/{id}/agenda` | Medio: fallback legacy aÃºn presente | **Admin-1** |
| Usuarios/clientes | `src/pages/admin/sections/UsuariosSection.jsx`, flujo en `AdminPanel.jsx` | `usuariosStore`, `paquetesStore` | `usuariosService` | mock/local | listar, buscar, editar, eliminar, asignar paquete, ajustar datos | `GET/POST/PUT/PATCH/DELETE /api/v1/clientes`, `POST /api/v1/clientes/{id}/paquetes` | Alto: clientes falsos/locales | **Admin-2** |
| Paquetes/membresÃ­as | `src/pages/admin/sections/PaquetesSection.jsx`, flujo en `AdminPanel.jsx` | `paquetesStore`, `transaccionesStore` | no hay servicio admin backend real; client-side usa `membershipPackagesApiService` solo para catÃ¡logo pÃºblico | mock/local | CRUD local, destacar paquete, beneficios, uso en POS | `GET/POST/PUT/PATCH/DELETE /api/v1/memberships/packages` (o equivalente admin) | Alto: catÃ¡logo admin no real | **Admin-2** |
| POS / productos / ventas | `src/pages/admin/sections/PuntoDeVentaSection.jsx` | `productosStore`, `paquetesStore`, `transaccionesStore`, `usuariosStore` | `posApiService`, `useApiQueries` | **API-first** | catálogo real, carrito local, cobrar, venta de productos/paquetes, ticket | `GET/POST/PUT/PATCH/DELETE /api/v1/productos`, `POST /api/v1/ventas`, `GET /api/v1/ventas`, `GET /api/v1/ventas/{id}/ticket`, `GET /api/v1/ventas/{id}/ticket.pdf`, `GET /api/v1/public/tickets/{token}` | Medio: fallback legacy todavía existe | **Admin-3** |
| Transacciones / pagos | `src/pages/admin/sections/ActividadSection.jsx`, `src/pages/admin/AdminFinanzas.jsx`, `src/pages/admin/AdminReportes.jsx` | `transaccionesStore`, `cortesStore`, `gastosStore` | `finanzasService`, `dashboardService` | mock/local | listar transacciones, KPIs, export, corte, totales | `GET /api/v1/admin/transacciones`, `GET /api/v1/admin/pagos`, `GET /api/v1/admin/finanzas/*` | Alto: reportes no auditables | **Admin-4** |
| Gastos | `src/pages/admin/AdminFinanzas.jsx` | `gastosStore` | `finanzasService` | mock/local | CRUD gasto, filtros, totales | `GET/POST/PUT/PATCH/DELETE /api/v1/gastos` | Alto | **Admin-4** |
| Cortes | `src/pages/admin/AdminFinanzas.jsx` | `cortesStore` | `finanzasService` | mock/local | abrir/cerrar corte, listar historial | `GET/POST /api/v1/cortes` | Alto | **Admin-4** |
| Reportes | `src/pages/admin/AdminReportes.jsx` | `clasesStore`, `coachesStore`, `transaccionesStore`, `tabuladorStore`, `paquetesStore`, `usuariosStore` | `finanzasService`, `getReporteCoaches` | mock/local | exportar, agrupar, KPIs, resÃºmenes | `GET /api/v1/admin/reportes/*`, `GET /api/v1/admin/coaches/reporte`, `GET /api/v1/admin/finanzas/resumen` | Alto | **Admin-4** |
| ConfiguraciÃ³n | `src/pages/admin/sections/ConfiguracionSection.jsx` | `configuracionStore` | ninguno backend real | mock/local | editar branding, imÃ¡genes, videos, textos | `GET/PUT /api/v1/configuracion`, media upload endpoints | Medio-Alto | **Admin-4** |

## DiagnÃ³stico por mÃ³dulo

### 1) Clases

Estado:

- Ya hay API real para catÃ¡logo y CRUD base.
- `AdminPanel.jsx` usa `useApiClasses` para activar lectura API.
- `ClasesSection.jsx` ya consume `getClasesPaginatedApi()`.
- `ClasesSection.jsx` ya consume API real para listado filtrado, create/update/delete y refetch.
- En create/update, frontend bloquea `fecha` especÃ­fica y `publicarEn` porque backend actual solo cubre clase base.
- Sigue habiendo mutaciones locales en `clasesStore` para compatibilidad/fallback.

Riesgo:

- UI y store todavÃ­a asumen mezcla API + local.
- Delete/relaciones con reservas siguen delegando a helper local (`reservasService`).

QuÃ© falta para cerrar:

- API admin consistente para delete.
- Unificar source of truth para CRUD admin.
- Separar fallback local de modo API de forma explÃ­cita.

### 2) Coaches

Estado:

- `AdminPanel.jsx` ya usa API real para listado, create, edit, status toggle y delete en modo API.
- `coachesStore` queda como fallback legacy.
- `coachesApiService` ya expone `getCoachesPaginatedApi`, `getPublicCoachesApi`, `createCoachApi`, `updateCoachApi`, `updateCoachStatusApi`, `deleteCoachApi` y `uploadCoachAvatarApi`.
- `Admin > Clases` ya consume coaches reales para `coach_id`.

Riesgo:

- Fallback local todavÃ­a existe para flags API en `false`.
- Formulario legacy conserva campos no soportados por backend, pero no se envÃ­an en modo API.

QuÃ© falta:

- Si se quiere cerrar 100%, eliminar legacy/local de `AdminPanel.jsx` y `coachesStore` en rutas admin.

### 3) Usuarios/clientes

Estado:

- Lista, ediciÃ³n, baja, asignaciÃ³n de paquete y ajustes siguen en `usuariosStore`.
- No hay servicio admin API real para clientes.
- `usuariosService` es lÃ³gica local, no backend.

Riesgo:

- Usuarios inventados o persistidos localmente.
- AsignaciÃ³n de paquete/estado de cliente no auditables.

QuÃ© falta:

- CRUD real de clientes.
- Endpoint para asignaciÃ³n/actualizaciÃ³n de membresÃ­a.

### 4) POS

Estado:

- API-first en frontend para catálogo, ventas y tickets.
- `PuntoDeVentaSection.jsx` usa `posApiService` + TanStack Query para productos/ventas y carrito local para UI.
- Fallback legacy queda solo cuando flags API están apagadas.

Riesgo:

- Aún conviven helpers legacy/local para compatibilidad.

Qué falta:

- Cerrar acciones secundarias si aparecen en QA: detalle avanzado, filtros históricos, exportes.

### 5) Dashboard / Reportes / Finanzas

Estado:

- `AdminDashboard.jsx` sigue leyendo mocks y stores locales; ademÃ¡s se describe como legacy/dead code.
- `AdminReportes.jsx` y `AdminFinanzas.jsx` usan helpers de finanzas locales.
- `dashboardService` / `finanzasService` no son API-backed.

Riesgo:

- MÃ©tricas no confiables.
- Exportes y reportes no representan backend real.

QuÃ© falta:

- Resumen admin real.
- Cortes, gastos y reportes con endpoints auditables.

### 6) ConfiguraciÃ³n

Estado:

- Persistida localmente en `configuracionStore`.
- No hay servicio backend real.

Riesgo:

- Cambios no viajan a servidor.

QuÃ© falta:

- CRUD de configuraciÃ³n y media upload.

## Mocks, localStorage y fuentes locales detectadas

Archivos clave que siguen siendo locales/persistidos:

- `src/stores/coachesStore.js`
- `src/stores/usuariosStore.js`
- `src/stores/paquetesStore.js`
- `src/stores/productosStore.js`
- `src/stores/transaccionesStore.js`
- `src/stores/cortesStore.js`
- `src/stores/gastosStore.js`
- `src/stores/tabuladorStore.js`
- `src/stores/configuracionStore.js`
- `src/stores/reportesStore.js`
- `src/stores/actividadStore.js`
- `src/stores/disciplinasStore.js`
- `src/stores/listaEsperaStore.js`
- `src/stores/reservasStore.js`

Referencias en admin con mock/local duro:

- `mockUsers`
- `mockTransacciones`
- `ingresosUltimosMeses`
- `PRODUCTS`
- `PAQUETES_POS`
- `COACHES_MOCK`
- `CLASES_MOCK`
- `CORTES_MOCK`
- `TRANSACCIONES_MOCK`

## Fases recomendadas de integraciÃ³n frontend

### Admin-1: Clases + Coaches

Objetivo:

- sacar `Clases` y `Coaches` de mock/local.
- unificar lectura API.

Backend necesario:

- CRUD completo de clases.
- CRUD completo de coaches.
- agenda bÃ¡sica por coach si se necesita dashboard.

### Admin-2: Usuarios + MembresÃ­as

Objetivo:

- clientes reales.
- paquetes reales.

Backend necesario:

- CRUD de clientes.
- asignaciÃ³n de membresÃ­as a cliente.
- CRUD admin de paquetes.

### Admin-3: POS

Objetivo:

- ventas reales.
- inventario real.

Backend necesario:

- catÃ¡logo productos.
- ventas/cobros.
- impacto en transacciones/movimientos.

### Admin-4: Finanzas / Reportes / ConfiguraciÃ³n

Objetivo:

- dashboard ejecutivo real.
- cortes y gastos auditables.
- reportes exportables.
- configuraciÃ³n persistida en backend.

Backend necesario:

- mÃ©tricas y agregados admin.
- gastos.
- cortes.
- reportes.
- configuraciÃ³n.

## Orden recomendado para backend

1. **Clases + coaches**
   - menor riesgo de dominio.
   - ya existe base API parcial en frontend.
2. **Usuarios + membresÃ­as**
   - desbloquea dashboard admin Ãºtil.
   - reduce dependencia de stores locales.
3. **POS**
   - requiere trazabilidad y cambios de negocio.
   - mejor despuÃ©s de catÃ¡logo/usuarios.
4. **Finanzas / reportes / configuraciÃ³n**
   - capa mÃ¡s sensible y mÃ¡s agregada.
   - conviene integrar cuando fuentes primarias ya sean reales.

## Siguiente prompt recomendado para backend

`ADMIN-API-001: diseÃ±ar endpoints CRUD para clases, coaches, clientes y membresÃ­as, con payloads y permisos admin`

## Observaciones finales

- `AdminDashboard.jsx` aparece como legacy/dead code y no deberÃ­a ser base de nueva integraciÃ³n.
- `Clases` ya estÃ¡ mÃ¡s cerca de API real que resto del admin.
- `POS`, `Usuarios`, `Paquetes`, `Finanzas` y `ConfiguraciÃ³n` siguen siendo mayormente mock/local.

## Actualizacion Admin-2A clientes (2026-06-08)

- Admin > Usuarios/clientes ya es API-first en modo API.
- `clientsApiService` cubre listado paginado, create, detalle, update, baja logica, asignacion de paquete y ajuste de creditos.
- `clientAdapter` normaliza membresia, saldo, ultima visita, reservas y aliases legacy.
- `usuariosStore` y `paquetesStore` quedan solo como fallback cuando API esta desactivada.
- CRUD admin de paquetes sigue pendiente; selector de asignacion usa `GET /api/v1/memberships/packages`.
## Update 2026-06-08 - Paquetes admin

- `Admin > Paquetes` migra a source of truth backend con `GET /api/v1/memberships/packages?page=&page_size=&status=&search=`.
- CRUD real usa `POST/PUT/PATCH/DELETE /api/v1/memberships/packages`.
- `type` no es contrato canÃ³nico: se oculta en API mode.
- `credits` es finito y > 0; no existe ilimitado.
- `benefits` persiste como array de strings.
- Historial de ventas se oculta en API mode o se deja como â€œDisponible prÃ³ximamente en Reportesâ€.
- `POST /api/v1/memberships` no se usa para catÃ¡logo admin.

## Paquetes compartibles

Admin > Paquetes usa catálogo vendible:
- `GET /api/v1/memberships/packages`
- `GET /api/v1/memberships/packages?page=&page_size=&status=&search=`
- `POST /api/v1/memberships/packages`
- `PUT /api/v1/memberships/packages/{id}`
- `PATCH /api/v1/memberships/packages/{id}/status`
- `PATCH /api/v1/memberships/packages/{id}/featured`
- `DELETE /api/v1/memberships/packages/{id}`

Campos UI actuales:
- `name` opcional, fallback visual `display_name`
- `credits` finito > 0
- `price_mxn`
- `duration_days`
- `is_active`
- `is_featured`
- `benefits`
- `is_shareable`
- `max_beneficiaries`

Paquetes compartidos:
- buyer configura beneficiarios desde `/clientes/me/memberships`
- admin gestiona beneficiarios desde `GET /api/v1/clientes/{id}` -> `shared_memberships`
- buyer deja de editar beneficiarios después de alta inicial
- admin usa DELETE + POST para reemplazo

## MVP server state

Frontend MVP uses TanStack Query for server state. Zustand queda para fallback legacy y UI local. Lecturas con `useQuery`, mutaciones con `useMutation`, refetch con invalidate tras Ã©xito. No usar `page_size=1000`.
