# BUG_006_GLOBAL_PAGINATION_DIAGNOSIS.md

## Resumen del bug
Los listados principales de cliente, admin y coach no tienen estrategia global unificada de paginación/listado controlado. Hay mezcla de:
- listados resumen correctos con límite visual,
- tablas/listas sin paginación explícita,
- cargas completas desde endpoints sin `page/page_size`.

Riesgo: degradación UX/performance cuando crezca volumen real (reservas históricas, clases, usuarios, movimientos/transacciones).

## Inventario de listados por rol

### Cliente
1. Mis próximas clases  
- Archivo: `frontend/src/pages/cliente/ClientPanel.jsx`  
- Fuente: `reservasStore` (`GET /api/v1/reservas/me` en API mode)  
- Estado actual: límite visual configurable `UPCOMING_RESERVATIONS_LIMIT=4` + CTA "Ver todas"  
- Clasificación: resumen/dashboard (correcto para BUG-006)

2. Mis clases (por semana/día + filtro estado)  
- Archivo: `frontend/src/pages/cliente/ClientPanel.jsx`  
- Fuente: `reservasStore` (`GET /api/v1/reservas/me`)  
- Estado actual: sin paginación global; navegación semanal por tabs/día  
- Riesgo: si `reservas/me` crece mucho, costo de filtro/render local en cada cambio de estado/semana

3. Reservar clase (listado por día)  
- Archivo: `frontend/src/pages/cliente/ClientPanel.jsx`  
- Fuente: `clasesStore` + ocurrencias por rango (`GET /api/v1/clases` + `/clases/{id}/ocurrencias`)  
- Estado actual: segmentado por día; sin paginación explícita  
- Riesgo: alto volumen por día puede saturar render

4. Paquetes y pagos (movimientos/transacciones)  
- Archivo: `frontend/src/pages/cliente/ClientPanel.jsx`  
- Fuente API: `GET /api/v1/clientes/me/estado-financiero` (`credit_movements`, `transactions`)  
- Estado actual: render completo de arrays ordenados (sin límite/paginación)  
- Riesgo: crecimiento de historial

### Admin
1. Clases vista calendario  
- Archivo: `frontend/src/pages/admin/sections/ClasesSection.jsx`  
- Fuente: `useClasses(fechaSeleccionada)`  
- Estado actual: usa `InfiniteList` con `pageSize=12`  
- Clasificación: principal gestión (parcialmente resuelto)

2. Clases vista lista (tabla)  
- Archivo: `frontend/src/pages/admin/sections/ClasesSection.jsx`  
- Fuente: `clases` store/API  
- Estado actual: render de `ordenadas.map(...)` completo, sin paginación  
- Riesgo: alto en volumen grande

3. Historial reservas por usuario (modal)  
- Archivo: `frontend/src/pages/admin/AdminPanel.jsx`  
- Fuente: `reservasStore` filtrado local  
- Estado actual: `reservasU.slice().reverse().map(...)` completo, sin paginación  
- Riesgo: modal largo, costo DOM y lectura difícil

4. Otros listados admin (usuarios/coaches/paquetes/ventas)  
- Archivo principal: `frontend/src/pages/admin/AdminPanel.jsx`  
- Estado actual: varios listados usan mapeo completo local/store; sin estándar único de paginación

### Coach
1. Todas mis clases esta semana  
- Archivo: `frontend/src/pages/coach/CoachPanel.jsx`  
- Fuente API: `GET /api/v1/coaches/me/agenda?from&to`  
- Estado actual: render semanal completo de `agenda.occurrences`  
- Riesgo: bajo-medio por rango acotado (7 días), pero sigue sin paginación explícita

2. Clases de hoy  
- Archivo: `frontend/src/pages/coach/CoachPanel.jsx`  
- Fuente API: agenda occurrences filtradas por día  
- Estado actual: listado resumido, sin paginación (normal para dashboard)

3. Mis clases por día (tabla alumnos)  
- Archivo: `frontend/src/pages/coach/CoachPanel.jsx`  
- Fuente: agenda/filter local  
- Estado actual: sin paginación explícita

## Clasificación global (A/B/C)

### A) Resumen/dashboard (límite visual + CTA)
- Cliente: Mis próximas clases (ya correcto)
- Coach: Clases de hoy, métricas semanales (resumen)
- Recomendación: mantener límite visual fijo y navegación a vista principal

### B) Listado principal de gestión (paginación/filtros/búsqueda)
- Cliente: Mis clases (vista principal)
- Admin: Clases vista lista, usuarios/coaches, historial por usuario
- Coach: tabla semanal/mis clases por día
- Recomendación: paginación client-side inmediata cuando dataset venga ya acotado

### C) Alto volumen técnico (requiere backend pagination real)
- Cliente: movimientos de crédito/transacciones históricas
- Admin: reservas globales, usuarios, transacciones/ventas históricas, clases históricas grandes
- Recomendación: contrato backend con `page`, `page_size`, `total`, `items`

## Endpoints actuales y estado de paginación
- `GET /api/v1/clases`: sin paginación (full list)
- `GET /api/v1/reservas/me`: sin paginación (full list por usuario)
- `GET /api/v1/coaches/me/agenda?from&to`: acotado por rango, sin paginación
- `GET /api/v1/clientes/me/estado-financiero`: devuelve arrays (`credit_movements`, `transactions`) sin paginación
- `GET /api/v1/lista-espera?occurrenceId=...`: por ocurrencia, normalmente acotado

Conclusión:
- BUG-006 no se cierra frontend-only.
- Se puede mitigar parcialmente en frontend, pero cierre robusto requiere contrato backend de paginación en endpoints de alto volumen.

## Qué ya está bien
- Admin calendario usa `InfiniteList` (`pageSize=12`) en `ClasesSection`.
- Cliente "Mis próximas clases" ya tiene límite visual + CTA.
- Coach agenda está acotada por rango semanal (control natural de volumen).

## Quick wins frontend-only (Fase A)
1. Estandarizar componente de paginación visual para tablas/listas principales.
2. Aplicar límite inicial + "Ver más" en:
- historial de movimientos/transacciones cliente,
- historial de reservas en modal admin,
- vista lista de clases admin.
3. Mantener estados `loading/empty/error` consistentes.
4. Evitar render completo en modales largos.

## Contrato backend requerido (Fase B)
Definir formato estándar:
```json
{
  "page": 1,
  "page_size": 20,
  "total": 154,
  "items": []
}
```

Prioridad backend sugerida:
1. Reservas históricas (cliente/admin)
2. Usuarios/coaches (admin)
3. Transacciones/movimientos (cliente/admin)
4. Clases globales admin (si volumen crece)

También incluir filtros server-side por estado/fecha para reducir transferencia.

## Arquitectura futura (Fase C)
- Mantener hotfix actual anti-storm.
- Migrar gradualmente a TanStack Query (como propone `FRONTEND_FETCHING_ARCHITECTURE_PROPOSAL.md`).
- Coordinar endpoint agregado calendario/BFF para evitar fan-out N+1.
- Virtualización solo donde QA confirme volumen real alto.

## Riesgos técnicos
- Intentar resolver todo solo en frontend puede ocultar problema de volumen real.
- Duplicar cachés/manual paging + futuro Query incrementa complejidad.
- Sin backend pagination, admin puede degradar rápido en producción.
- Falta de estándar común genera UX inconsistente entre paneles.

## Tests necesarios
1. Unit:
- helper de paginación array (`page`, `pageSize`, `totalPages`),
- reset de página al cambiar filtro.
2. UI:
- empty/loading/error por página,
- "Ver más" y navegación de página.
3. Integración:
- contratos backend paginados cuando se implementen (`items/total/page`).

## Recomendación de siguiente paso
1. Implementar quick wins frontend en listados más críticos:
- Admin vista lista de clases,
- historial de reservas modal admin,
- historial cliente (movimientos/transacciones) con límite inicial.
2. En paralelo, abrir tarea backend para contrato de paginación estándar.
3. Dividir BUG-006 en sub-bugs por módulo para ejecución controlada.

## Propuesta de sub-bugs BUG-006
- BUG-006A: Cliente listados financieros/reservas (paginación visual)
- BUG-006B: Admin clases/usuarios/reservas (paginación visual inicial)
- BUG-006C: Contrato backend paginado (`page/page_size/total/items`)
- BUG-006D: Migración gradual a Query + consolidación de fetch

## Actualizaci�n 2026-05-30 (implementaci�n BUG-006A/B frontend-only)
- Se aplic� mitigaci�n frontend en listados ya cargados en memoria, sin cambios backend.
- Listados con paginaci�n visual agregada:
  - Cliente: Paquetes & Pagos (movimientos/transacciones).
  - Admin: Clases (vista lista).
  - Admin: Historial de reservas por usuario (modal).
- Alcance: UX/performance local en renderizado; no cambia source of truth ni endpoints.
- Pendiente estrat�gico: BUG-006C (contrato backend paginado real con `page/page_size/total/items`).

## Actualizaci�n 2026-05-30 (BUG-006C integraci�n frontend incremental)
- Se integr� adapter de paginaci�n tolerante a legacy/paginado: `paginationAdapter`.
- Endpoints paginados consumidos en frontend:
  - `GET /api/v1/clases?page=&page_size=` (parcial, vista lista admin con filtro `Todas`).
  - `GET /api/v1/reservas/me?page=&page_size=&status=&from=&to=` (servicio listo, integraci�n UI semanal queda pendiente controlada).
  - `GET /api/v1/clientes/me/credit-movements?page=&page_size=` (cliente historial en API mode).
- Compatibilidad mantenida:
  - si backend responde array legacy, frontend no rompe.
  - fallback mock/local sigue activo con flags false.
- Estado: BUG-006C frontend **parcialmente integrado**.

## Actualizaci�n 2026-05-30 (BUG-006C cierre slice Mis Clases)
- Cliente > Mis clases en API mode ahora consume paginado backend:
  - `GET /api/v1/reservas/me?page=&page_size=&status=&from=&to=`.
- Se mantiene navegaci�n semanal/d�a y filtro por estado.
- Reglas aplicadas:
  - `all` => sin `status` en query.
  - filtros espec�ficos => `status` expl�cito.
  - `from/to` calculados desde semana visible.
- Se agrega estado local de p�gina + loading/error aislado de secci�n.
- Tras cancelar reserva, se refetch de p�gina actual para mantener consistencia.
