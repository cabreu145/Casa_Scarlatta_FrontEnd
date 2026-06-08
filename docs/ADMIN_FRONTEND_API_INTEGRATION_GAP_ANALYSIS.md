# Admin Frontend API Integration Gap Analysis

Fecha: 2026-06-07  
Scope: frontend-only diagnóstico. Sin cambios de backend, sin refactor funcional.

## Resumen ejecutivo

El panel admin sigue en estado mixto:

- **API real parcial**: `Clases`.
- **Mock/local dominante**: `Coaches`, `Usuarios/clientes`, `Paquetes/membresías`, `POS`, `Transacciones/pagos`, `Gastos`, `Cortes`, `Reportes`, `Configuración`.
- **Legacy/dead code o auxiliar**: `AdminDashboard.jsx` sigue leyendo mocks y stores locales.

La integración más madura está en clases. El resto depende de stores persistidos, arrays hardcoded, `localStorage` vía Zustand persist, o helpers de negocio que todavía simulan backend.

## Inventario por módulo

> Fuente actual:
> - **API**: datos ya vienen de backend.
> - **mock/local**: datos salen de stores persistidos, arrays hardcoded o helpers locales.
> - **mixta**: mezcla API + fallback local/mock.

| Módulo | Componente principal | Store actual | Service actual | Fuente actual | Operaciones soportadas hoy | Endpoint backend esperado | Riesgo | Prioridad |
|---|---|---|---|---|---|---|---|---|
| Dashboard | `src/pages/admin/AdminDashboard.jsx`, `src/pages/admin/sections/DashboardSection.jsx` | `clasesStore`, `transaccionesStore`, `usuariosStore`, `reservasStore`, `paquetesStore` | `dashboardService`, `getDashboardMetrics` | mock/local | métricas, conteos, ingresos, actividad reciente | `GET /api/v1/admin/dashboard` o endpoints de métricas agregadas | Alto: métricas no confiables | Admin-4 |
| Clases | `src/pages/admin/sections/ClasesSection.jsx`, flujo en `AdminPanel.jsx` | `clasesStore` como cache/fallback | `clasesApiService`, `reservasService`, `buildClaseApiPayload` | **API-first** | listar, crear, editar, eliminar/desactivar, ver ocurrencias/disponibilidad | `GET/POST/PUT/DELETE /api/v1/clases`, `GET /api/v1/clases/{id}/ocurrencias`, `GET /api/v1/clases/{id}/disponibilidad` | Medio | **Admin-1** |
| Coaches | `src/pages/admin/sections/CoachesSection.jsx`, flujo en `AdminPanel.jsx` | `coachesStore` | `coachesService` (local), `coachesApiService.getCoachesApi()` | mock/local con lectura API parcial | listar, crear, editar, eliminar, activar/desactivar | `GET/POST/PUT/DELETE /api/v1/coaches`, opcional `GET /api/v1/coaches/{id}/agenda` | Alto: IDs mock y CRUD local | **Admin-1** |
| Usuarios/clientes | `src/pages/admin/sections/UsuariosSection.jsx`, flujo en `AdminPanel.jsx` | `usuariosStore`, `paquetesStore` | `usuariosService` | mock/local | listar, buscar, editar, eliminar, asignar paquete, ajustar datos | `GET/POST/PUT/PATCH/DELETE /api/v1/clientes`, `POST /api/v1/clientes/{id}/paquetes` | Alto: clientes falsos/locales | **Admin-2** |
| Paquetes/membresías | `src/pages/admin/sections/PaquetesSection.jsx`, flujo en `AdminPanel.jsx` | `paquetesStore`, `transaccionesStore` | no hay servicio admin backend real; client-side usa `membershipPackagesApiService` solo para catálogo público | mock/local | CRUD local, destacar paquete, beneficios, uso en POS | `GET/POST/PUT/PATCH/DELETE /api/v1/memberships/packages` (o equivalente admin) | Alto: catálogo admin no real | **Admin-2** |
| POS / productos / ventas | `src/pages/admin/sections/PuntoDeVentaSection.jsx` | `productosStore`, `paquetesStore`, `transaccionesStore`, `usuariosStore` | `ventaService` | mock/local | carrito, cobrar, aplicar paquete local, registrar venta local | `GET /api/v1/productos`, `POST /api/v1/ventas`, `POST /api/v1/ventas/{id}/pago` o equivalente | Muy alto: venta localStorage | **Admin-3** |
| Transacciones / pagos | `src/pages/admin/sections/ActividadSection.jsx`, `src/pages/admin/AdminFinanzas.jsx`, `src/pages/admin/AdminReportes.jsx` | `transaccionesStore`, `cortesStore`, `gastosStore` | `finanzasService`, `dashboardService` | mock/local | listar transacciones, KPIs, export, corte, totales | `GET /api/v1/admin/transacciones`, `GET /api/v1/admin/pagos`, `GET /api/v1/admin/finanzas/*` | Alto: reportes no auditables | **Admin-4** |
| Gastos | `src/pages/admin/AdminFinanzas.jsx` | `gastosStore` | `finanzasService` | mock/local | CRUD gasto, filtros, totales | `GET/POST/PUT/PATCH/DELETE /api/v1/gastos` | Alto | **Admin-4** |
| Cortes | `src/pages/admin/AdminFinanzas.jsx` | `cortesStore` | `finanzasService` | mock/local | abrir/cerrar corte, listar historial | `GET/POST /api/v1/cortes` | Alto | **Admin-4** |
| Reportes | `src/pages/admin/AdminReportes.jsx` | `clasesStore`, `coachesStore`, `transaccionesStore`, `tabuladorStore`, `paquetesStore`, `usuariosStore` | `finanzasService`, `getReporteCoaches` | mock/local | exportar, agrupar, KPIs, resúmenes | `GET /api/v1/admin/reportes/*`, `GET /api/v1/admin/coaches/reporte`, `GET /api/v1/admin/finanzas/resumen` | Alto | **Admin-4** |
| Configuración | `src/pages/admin/sections/ConfiguracionSection.jsx` | `configuracionStore` | ninguno backend real | mock/local | editar branding, imágenes, videos, textos | `GET/PUT /api/v1/configuracion`, media upload endpoints | Medio-Alto | **Admin-4** |

## Diagnóstico por módulo

### 1) Clases

Estado:

- Ya hay API real para catálogo y CRUD base.
- `AdminPanel.jsx` usa `useApiClasses` para activar lectura API.
- `ClasesSection.jsx` ya consume `getClasesPaginatedApi()`.
- `ClasesSection.jsx` ya consume API real para listado filtrado, create/update/delete y refetch.
- En create/update, frontend bloquea `fecha` específica y `publicarEn` porque backend actual solo cubre clase base.
- Sigue habiendo mutaciones locales en `clasesStore` para compatibilidad/fallback.

Riesgo:

- UI y store todavía asumen mezcla API + local.
- Delete/relaciones con reservas siguen delegando a helper local (`reservasService`).

Qué falta para cerrar:

- API admin consistente para delete.
- Unificar source of truth para CRUD admin.
- Separar fallback local de modo API de forma explícita.

### 2) Coaches

Estado:

- Listado y CRUD siguen en `coachesStore` con IDs/mock.
- `coachesApiService` solo expone `getCoachesApi()`.
- `AdminPanel.jsx` usa API solo para poblar datos de formulario de clases.

Riesgo:

- IDs tipo `coach-*` / persistencia local.
- No hay backend real para create/update/delete.

Qué falta:

- Endpoint CRUD completo de coaches.
- Agenda por coach si se quiere unificar reporte/admin.

### 3) Usuarios/clientes

Estado:

- Lista, edición, baja, asignación de paquete y ajustes siguen en `usuariosStore`.
- No hay servicio admin API real para clientes.
- `usuariosService` es lógica local, no backend.

Riesgo:

- Usuarios inventados o persistidos localmente.
- Asignación de paquete/estado de cliente no auditables.

Qué falta:

- CRUD real de clientes.
- Endpoint para asignación/actualización de membresía.

### 4) POS

Estado:

- Sigue completamente local en términos de inventario, carrito y cobro.
- `PuntoDeVentaSection.jsx` usa `productosStore`, `paquetesStore` y `transaccionesStore`.
- `ventaService` orquesta una venta local, con comentarios de migración futura.

Riesgo:

- Venta no sale de `localStorage`.
- No hay trazabilidad backend de inventario/ventas.

Qué falta:

- Catálogo real de productos.
- Endpoint de venta/cobro.
- Integración con movimientos/transacciones reales.

### 5) Dashboard / Reportes / Finanzas

Estado:

- `AdminDashboard.jsx` sigue leyendo mocks y stores locales; además se describe como legacy/dead code.
- `AdminReportes.jsx` y `AdminFinanzas.jsx` usan helpers de finanzas locales.
- `dashboardService` / `finanzasService` no son API-backed.

Riesgo:

- Métricas no confiables.
- Exportes y reportes no representan backend real.

Qué falta:

- Resumen admin real.
- Cortes, gastos y reportes con endpoints auditables.

### 6) Configuración

Estado:

- Persistida localmente en `configuracionStore`.
- No hay servicio backend real.

Riesgo:

- Cambios no viajan a servidor.

Qué falta:

- CRUD de configuración y media upload.

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

## Fases recomendadas de integración frontend

### Admin-1: Clases + Coaches

Objetivo:

- sacar `Clases` y `Coaches` de mock/local.
- unificar lectura API.

Backend necesario:

- CRUD completo de clases.
- CRUD completo de coaches.
- agenda básica por coach si se necesita dashboard.

### Admin-2: Usuarios + Membresías

Objetivo:

- clientes reales.
- paquetes reales.

Backend necesario:

- CRUD de clientes.
- asignación de membresías a cliente.
- CRUD admin de paquetes.

### Admin-3: POS

Objetivo:

- ventas reales.
- inventario real.

Backend necesario:

- catálogo productos.
- ventas/cobros.
- impacto en transacciones/movimientos.

### Admin-4: Finanzas / Reportes / Configuración

Objetivo:

- dashboard ejecutivo real.
- cortes y gastos auditables.
- reportes exportables.
- configuración persistida en backend.

Backend necesario:

- métricas y agregados admin.
- gastos.
- cortes.
- reportes.
- configuración.

## Orden recomendado para backend

1. **Clases + coaches**
   - menor riesgo de dominio.
   - ya existe base API parcial en frontend.
2. **Usuarios + membresías**
   - desbloquea dashboard admin útil.
   - reduce dependencia de stores locales.
3. **POS**
   - requiere trazabilidad y cambios de negocio.
   - mejor después de catálogo/usuarios.
4. **Finanzas / reportes / configuración**
   - capa más sensible y más agregada.
   - conviene integrar cuando fuentes primarias ya sean reales.

## Siguiente prompt recomendado para backend

`ADMIN-API-001: diseñar endpoints CRUD para clases, coaches, clientes y membresías, con payloads y permisos admin`

## Observaciones finales

- `AdminDashboard.jsx` aparece como legacy/dead code y no debería ser base de nueva integración.
- `Clases` ya está más cerca de API real que resto del admin.
- `POS`, `Usuarios`, `Paquetes`, `Finanzas` y `Configuración` siguen siendo mayormente mock/local.
