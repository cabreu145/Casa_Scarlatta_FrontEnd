# Admin Legacy UI & Logic Audit

Fecha: 2026-06-09  
Repo: D:\Casa_Scarlatta_FrontEnd  
Branch: Disenio_Cabreu  
Responsable: Codex

## Resumen ejecutivo

- Secciones revisadas: Dashboard, Finanzas, Reportes, tabulador coach, exportaciones.
- Diferencias visuales encontradas: API-first conserva mayor parte de cards/tablas, pero reemplaza algunas graficas legacy por placeholders honestos y simplifica ciertos widgets.
- Diferencias de logica encontradas: tabulador coach sigue localStorage; `finanzasService.js` sigue teniendo `Math.random()` y calculos legacy; reportes legacy sigue siendo referencia de flujo pero no fuente de datos.
- Pendientes visibles: serie historica financiera detallada, pago coach formal, algunos textos legacy todavia visibles en archivos muertos.
- Requieren backend: tabulador coach, serie historica financiera detallada, posible reporte formal de pago coach.
- Requieren frontend: aislar legacy muerto, mantener labels honestos en API mode, evitar que mock/demo se vuelva verdad.
- Mejoras futuras aceptadas: configuracion/home y limpieza de dead code.

## Tabla general

| ID | Area | Pantalla/componente | Archivo | Tipo | Que esta mockeado/hardcodeado | Fuente actual | Backend existente | Backend requerido | Prioridad | Recomendacion |
|---|---|---|---|---|---|---|---|---|---|---|
| AUD-01 | Dashboard | `AdminDashboard` legacy | `frontend/src/pages/admin/AdminDashboard.jsx` | P3 | KPIs, chart data, paquetes por vencer, ultimas ventas hardcoded | `dashboardService` + stores legacy | No es fuente live; existe replacement en `DashboardSection` | No | P3 | Tratar como dead code / referencia visual |
| AUD-02 | Dashboard | `DashboardSection` API-first | `frontend/src/pages/admin/sections/DashboardSection.jsx` | P1 | No usa mock como verdad; usa API y conserva cards/flujo | `useApiQueries` + `exportFinanceCsv` | Si: `/api/v1/finanzas/*`, `/api/v1/reportes/*`, `/api/v1/gastos`, `/api/v1/cortes/*` | No | P1 | Mantener como fuente live |
| AUD-03 | Finanzas | `AdminFinanzas` legacy | `frontend/src/pages/admin/AdminFinanzas.jsx` | P3 | Legacy pesado con stores, calculos locales, export local | `finanzasService` + stores fallback | Si: replacement API existe | No | P3 | Mantener solo fallback demo |
| AUD-04 | Finanzas | `FinanzasApiSection` | `frontend/src/pages/admin/components/FinanzasApiSection.jsx` | P1 | Placeholder de serie historica; resto real | `useApiQueries` + `exportFinanceCsv` + `abrirReportePDF` | Si: KPIs, gastos, cortes, ventas recientes, export CSV | Si: serie historica detallada | P1 | Mantener honestidad del placeholder y documentar gap |
| AUD-05 | Reportes | `AdminReportes` legacy | `frontend/src/pages/admin/AdminReportes.jsx` | P3 | Tabulador editable local, exports legacy, arrays/mock | `useTabuladorStore`, `mockUsers`, `ingresosUltimosMeses` | Replacement existe en `ReportesApiSection` | Si: tabulador coach formal | P3 | Dejar como referencia de UX/logica, no de datos |
| AUD-06 | Reportes | `ReportesApiSection` | `frontend/src/pages/admin/components/ReportesApiSection.jsx` | P1 | Tabulador coach solo pendiente, resto real | `reportsApiService` + `downloadCsvFromRows` + `abrirReportePDF` | Si: `/api/v1/reportes/*` | Si: tabulador coach / pago coach | P1 | Mantener layout legacy, datos backend real |
| AUD-07 | Tabulador | `tabuladorStore` | `frontend/src/stores/tabuladorStore.js` | P1 | localStorage con rangos de pago por disciplina | Zustand persist | No visible en backend actual | Si: backend tabulador o pago coach | P1 | Documentar formula y extraer contrato backend |
| AUD-08 | Finanzas legacy | serie historica | `frontend/src/services/finanzasService.js` | P0 | `Math.random()` en serie historica diaria | local stores | Replacement parcial existe | Si: serie historica backend | P0 | No usar en API mode; marcar demo only |
| AUD-09 | Finanzas legacy | reporte coaches con pago | `frontend/src/services/finanzasService.js` + `AdminReportes.jsx` | P1 | Calcula `pagoClase` y `totalPago` desde tabulador local | stores + tabulador local | Parcial: agenda real existe, pago formal no | Si: reporte coaches/pago formal | P1 | Separar agenda real de pago coach |
| AUD-10 | Export | CSV/PDF reportes | `frontend/src/utils/reportExport.js`, `frontend/src/utils/reportePDF.js` | P2 | Helpers siguen permitiendo export desde datos ya cargados | datos reales en API mode | Si, en dashboards/reportes reales | No | P2 | Mantener, pero no exportar mocks en API mode |

## Dashboard

### Diseno legacy

- `AdminDashboard.jsx` mantiene cards, chart de ingresos, donut de paquetes, clases hoy, ultimas ventas y paquetes por vencer.
- Usa `dashboardService`, `mockTransacciones`, `ingresosUltimosMeses` y `clasesStore`.
- Es referencia visual y de flujo, pero no ruta principal live.

### Diseno API actual

- `DashboardSection.jsx` conserva cards, layout, widgets laterales y botones de accion.
- Fuente real en API mode: `useFinanceKpisQuery`, `useFinanceDaySummaryQuery`, `useFinanceCategoriesQuery`, `useFinanceLowStockQuery`, `useFinanceRecentSalesQuery`, `exportFinanceCsv`.
- Mantiene export CSV por tipo y rango.

### Diferencias

- Visualmente, el layout principal se conserva bien.
- Cambios visibles: donut/series de mocks reemplazadas por datos reales o listas compactas.
- `AdminDashboard.jsx` quedo como dead code y no debe usarse como referencia de datos.

### Datos legacy

- `ingresosUltimosMeses`
- `mockTransacciones`
- `paquetesPorVencer`
- `getDashboardMetrics`

### Datos reales actuales

- KPI de finanzas desde backend.
- Ventas recientes reales.
- Gastos recientes reales.
- Stock bajo real.

### Reparaciones sugeridas

- Mantener `DashboardSection` como referencia visual oficial.
- Marcar `AdminDashboard.jsx` como legacy/dead code definitivo.
- Si se quiere cerrar totalmente, eliminar dead code solo despues de estabilizacion final.

## Finanzas

### Diseno legacy

- `AdminFinanzas.jsx` legacy incluye KPIs, grafica historica, tabla de transacciones, corte de caja, registro de gastos y export local.
- Usa stores legacy y calculos locales.

### Diseno API actual

- `FinanzasApiSection.jsx` conserva cards, secciones, tablas, acciones de gasto/corte y exports.
- Usa backend real para KPIs, resumen del dia, categorias, ventas recientes, corte hoy, cortes historicos y gastos.

### Diferencias

- La UI conserva estructura general.
- Se reemplazo grafica historica fake por bloque honesto: `Serie historica detallada pendiente de backend.`
- Export CSV sale de backend real.
- PDF usa datos reales cargados en frontend.

### Logica legacy

- Utilidad neta calculada localmente desde transacciones + gastos.
- Ticket promedio calculado localmente.
- Corte de caja armado desde `transaccionesStore` y `cortesStore`.
- Registro de gastos local.

### Datos reales actuales

- `GET /api/v1/finanzas/kpis`
- `GET /api/v1/finanzas/dia`
- `GET /api/v1/finanzas/categorias`
- `GET /api/v1/finanzas/ventas-recientes`
- `GET /api/v1/finanzas/exportar`
- `GET /api/v1/gastos`
- `GET /api/v1/cortes/hoy`
- `POST /api/v1/cortes/ejecutar`
- `GET /api/v1/cortes`
- `GET /api/v1/cortes/{id}`

### Pendientes visibles

- Serie historica financiera detallada.
- Posible desglose historico mas fino por periodo.

### Reparaciones sugeridas

- Mantener placeholder honesto en vez de grafica inventada.
- Si se quiere grafica real, pedir backend historico agregado.

## Reportes

### Diseno legacy

- `AdminReportes.jsx` tiene cards de export, tabulador editable, reporte de coaches con pago por clase y metricas generales.
- Usa `mockUsers`, `ingresosUltimosMeses`, `tabuladorStore`, stores legacy y exports locales.

### Diseno API actual

- `ReportesApiSection.jsx` conserva cards, tabs visuales, tablas y botones CSV/PDF.
- Usa reportes backend reales por area.

### Diferencias

- Layout general se conserva.
- Tabulador coach ya no se presenta como dato real; se muestra como pendiente de backend.
- Exportaciones se generan desde datos reales.

### Logica legacy

- `useTabuladorStore` define pago por disciplina/rango.
- `getReporteCoaches` calcula clases, ocupacion y pago por coach.
- `exportarExcel` y `abrirReportePDF` operan sobre arrays locales.

### Datos reales actuales

- Reporte financiero.
- Reporte de usuarios.
- Reporte de paquetes.
- Reporte POS.
- Reporte de coaches.
- Top clases.
- Ocupacion por disciplina.

### Export CSV/PDF

| Reporte | CSV real | PDF real | Fuente de datos | Usa mock en API mode | Observaciones |
|---|---|---|---|---|---|
| Financiero | Si | Si | `reportsApiService` + datos adaptados | No | Incluye nota de reporte operativo MVP |
| Usuarios | Si | Si | `reportsApiService` | No | Estado de clientes y membresias |
| Paquetes | Si | Si | `reportsApiService` | No | Incluye shareable/topPackage |
| POS | Si | Si | `reportsApiService` | No | Ventas operativas, categorias, metodos |
| Coaches | Si | Si | `reportsApiService` | No | Pago coach real sigue pendiente |
| Top clases | Si | Si | `reportsApiService` | No | Ocupacion y reservas |
| Ocupacion por disciplina | Si | Si | `reportsApiService` | No | Agregado operativo |

### Reparaciones sugeridas

- Mantener `ReportesApiSection` como unica fuente live.
- Dejar `AdminReportes.jsx` solo como legado/referencia.
- Conservar PDF/CSV, pero siempre con datos backend reales en API mode.

## Tabulador de pago coach

### Archivos legacy revisados

- `frontend/src/stores/tabuladorStore.js`
- `frontend/src/pages/admin/AdminReportes.jsx`
- `frontend/src/services/finanzasService.js`

### CRUD local actual

- Persistencia en `localStorage` bajo `cs-tabulador`.
- Edicion por disciplina/rango.
- Reset global.

### Campos

- `disciplina`
- `min`
- `max`
- `pago`

### Formula de calculo

- Busca rango donde `asistentes >= min && asistentes <= max`.
- Retorna `pago` del rango.
- `getReporteCoaches` suma pago por clase para total coach.

### Relacion con asistencias

- Usa cantidad de asistentes por clase.
- No contempla ausencias, retrasos, sustituciones ni excepciones.

### Relacion con clases

- Opera por clase impartida y cupo actual.

### Relacion con disciplinas

- Tabulador por disciplina.

### Ejemplo de calculo

- Si una clase tiene 8 asistentes y el rango 7-12 paga 350, el pago de clase es 350.

### Que debe pasar a backend

- Catalogo de tabulador.
- Reglas de calculo por disciplina/rango.
- Reporte agregado de pago coach.

### Contrato backend sugerido

```txt
GET /api/v1/tabulador
POST /api/v1/tabulador
PUT /api/v1/tabulador/{id}
DELETE /api/v1/tabulador/{id}

GET /api/v1/reportes/coaches/pagos?from=&to=
```

## Serie historica financiera

### Como funcionaba en mock

- `finanzasService.js` genera serie con `Math.random()` para dia.
- En semana y mes usa agregados locales de transacciones.

### Que se removio o bloqueo

- En API mode, `FinanzasApiSection` ya no muestra serie inventada como dato real.
- Se reemplazo por texto honesto de pendiente.

### Que endpoint falta

```txt
GET /api/v1/finanzas/historico?from=&to=&group_by=day|week|month
```

### Contrato backend sugerido

```json
{
  "from": "2026-06-01",
  "to": "2026-06-09",
  "group_by": "day",
  "items": [
    {
      "date": "2026-06-01",
      "sales_total_mxn": 1200,
      "expenses_total_mxn": 300,
      "net_total_mxn": 900,
      "sales_count": 4,
      "average_ticket_mxn": 300,
      "cash_mxn": 500,
      "card_mxn": 700,
      "transfer_mxn": 0,
      "other_mxn": 0
    }
  ]
}
```

## Pendientes visibles del admin

| ID | Seccion | Texto visible | Archivo | Motivo | Backend requerido | Frontend requerido | Prioridad |
|---|---|---|---|---|---|---|---|
| PEND-01 | Finanzas | `Serie historica detallada pendiente de backend.` | `frontend/src/pages/admin/components/FinanzasApiSection.jsx` | No existe fuente historica detallada | Historico financiero agregado | Mantener placeholder honesto | P1 |
| PEND-02 | Reportes | `Tabulador de pago pendiente de backend.` | `frontend/src/pages/admin/components/ReportesApiSection.jsx` | Pago coach formal no existe | Tabulador/pago coach backend | Mantener texto claro | P1 |
| PEND-03 | Reportes legacy | `Editar tabulador` | `frontend/src/pages/admin/AdminReportes.jsx` | UI vieja sigue viva como referencia | Backend tabulador | No usar en API mode | P2 |
| PEND-04 | Finanzas legacy | `Ingresos historicos` | `frontend/src/pages/admin/AdminFinanzas.jsx` | Dead code legacy | Ninguno, ya existe reemplazo | Mantener solo fallback demo | P3 |
| PEND-05 | Dashboard legacy | `Panel de Administracion` legacy | `frontend/src/pages/admin/AdminDashboard.jsx` | Dead code con mocks | Ninguno, ya existe replacement | Marcar como no ruta live | P3 |

## Reparaciones frontend recomendadas

- Mantener `DashboardSection`, `FinanzasApiSection` y `ReportesApiSection` como fuentes live.
- Dejar `AdminDashboard.jsx`, `AdminFinanzas.jsx` y `AdminReportes.jsx` como legacy/fallback o dead code.
- Evitar reutilizar helpers legacy para datos en API mode.
- Seguir marcando pendientes de backend con copy explicito, no con mocks.

## Backend requerido

- Serie historica financiera agregada.
- Tabulador coach formal.
- Reporte de pago coach formal.

## Mejoras futuras aceptadas

- Limpieza de dead code.
- Posible remocion definitiva de legacy pages si no se usan como fallback.
- Refinar exportes contables/fiscales separados de reportes operativos MVP.
- Configuracion/home quedan fuera de esta ronda.

## Roadmap recomendado

1. Cerrar backend de serie historica financiera.
2. Cerrar backend de tabulador/pago coach.
3. Eliminar o aislar legacy dead code admin.
4. Consolidar exports y PDFs operativos.
5. Revisar configuracion/home y otras vistas mockeadas despues.
