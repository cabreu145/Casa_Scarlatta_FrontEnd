# CORE_STABILIZATION_BACKLOG.md

## Objetivo
Ordenar ejecuciÃ³n de estabilizaciÃ³n core para BUG-001 a BUG-013 antes de nuevos mÃ³dulos.

## Supuestos operativos
- No tocar backend en esta fase de planificaciÃ³n.
- No eliminar mocks aÃºn; solo restringir su uso por flags.
- Fuente de verdad en modo API: backend.

## P0 (bloqueantes funcionales)

## BUG-001 - Dashboard cliente no muestra clases reales para reservar
- Tipo: frontend data source / UI
- Owner sugerido: Frontend
- Dependencias: ninguna
- Estado: Corregido (frontend, 2026-05-29)
- Done esperado:
  - misma fuente de clases en `/clases` y bloque reservar de dashboard cuando `VITE_USE_API_CLASSES=true`.
 - Resultado aplicado:
  - Dashboard â€œReservar claseâ€ ahora usa el mismo criterio de filtrado que `/clases` (`getPublicClassesByDate` sobre clases API adaptadas/publicadas).
  - En modo API, `clasesStore` inicia vacÃ­o (`[]`) y deja de inyectar `CLASES_MOCK` como verdad inicial.

## BUG-003 - Reserva aparece en dÃ­as incorrectos/repetidos
- Tipo: frontend data source + backend data model
- Owner sugerido: Frontend + Backend (validaciÃ³n de modelo)
- Dependencias: BUG-001
- Estado: Mitigado frontend (2026-05-29), pendiente cierre definitivo
- Done esperado:
  - reserva aparece solo en fecha/dÃ­a correctos segÃºn contrato real.
  - sin duplicados por derivaciÃ³n local de dÃ­a.
- Hallazgo tÃ©cnico clave:
  - `ReservationRead` no incluye fecha/hora de ocurrencia de clase (`class_start_at`/`class_date`).
  - Frontend hoy cruza por `class_id` y usa `reserved_at` como fallback de fecha, generando desalineaciÃ³n por dÃ­a.
- ImplicaciÃ³n:
  - mitigaciÃ³n parcial posible en frontend; soluciÃ³n robusta requiere ampliar contrato backend.
- MitigaciÃ³n aplicada:
  - no usar `reserved_at` como fecha de sesiÃ³n.
  - matching diario por ocurrencia real (si existe), no por `class_id` plano.
  - neutral state cuando falta fecha de ocurrencia.
- Cierre definitivo backend pendiente:
  - modelo de ocurrencias,
  - `occurrence_id` (o equivalente),
  - o `class_start_at/class_date` reales no nulos de forma consistente.

## BUG-004 - Créditos no descuentan/persisten correctamente
- Tipo: frontend data source + contrato backend integrado
- Owner sugerido: Frontend + Backend
- Dependencias: BUG-003
- Estado: Cerrado Core (2026-05-30)
- Alcance core cerrado:
  - créditos/membresía persistentes tras login, refresh, reservar y cancelar.
  - source of truth en modo API: `GET /api/v1/clientes/me/estado-financiero`.
  - `/auth/me` se mantiene para identidad/sesión, no para balance financiero.
  - `PagoModal` en modo API no simula compra persistente ni muta créditos localmente.
- Fuera de alcance BUG-004 (pendiente separado):
  - compra self-service real.
  - transacciones reales de cliente enriquecidas.
  - integración de pagos/pasarela => BUG-009 / Fase pagos.
## BUG-007 - Perfil no muestra datos personales correctamente
- Tipo: frontend UI/data hydration
- Owner sugerido: Frontend
- Dependencias: Auth estable
- Done esperado:
  - formulario perfila datos al abrir secciÃ³n, sin requerir click para hidratar.

## BUG-008 - Paquetes/pagos muestra 0 clases restantes incorrectamente
- Tipo: frontend data source / UX listados
- Owner sugerido: Frontend + Backend (si falta endpoint)
- Dependencias: BUG-004
- Done esperado:
  - clases restantes coherentes con estado backend y persistentes tras refresh.

## BUG-010 - Coach â€œtodas mis clases semanaâ€ vacÃ­o/inconsistente
- Tipo: frontend data source + posible gap backend
- Owner sugerido: Frontend + Backend
- Dependencias: BUG-013
- Done esperado:
  - listado semanal coach refleja clases realmente asignadas.

## BUG-011 - MÃ©tricas coach hardcodeadas/no dinÃ¡micas
- Tipo: frontend UI/data source
- Owner sugerido: Frontend
- Dependencias: BUG-010
- Done esperado:
  - mÃ©tricas derivadas de datos reales o estado vacÃ­o controlado.

## BUG-012 - Coach â€œclases de hoyâ€ no muestra asignadas
- Tipo: frontend data source/filtro temporal
- Owner sugerido: Frontend + Backend (si datos de fecha insuficientes)
- Dependencias: BUG-010
- Done esperado:
  - filtro de â€œhoyâ€ consistente con timezone/fecha de backend.

## BUG-013 - AsignaciÃ³n de clases a coach no se refleja y repeticiÃ³n por dÃ­as
- Tipo: backend data model + frontend integration
- Owner sugerido: Frontend + Backend
- Dependencias: ninguna (raÃ­z de coach/admin)
- Done esperado:
  - clases asignadas por admin visibles en coach dashboard.
  - sin repeticiÃ³n incorrecta por reglas de recurrencia/fecha.

## P1 (alta importancia, no bloqueantes inmediatos)

## BUG-002 - Falta filtro en â€œMis clasesâ€
- Tipo: frontend UI
- Owner sugerido: Frontend
- Dependencias: BUG-003
- Done esperado:
  - filtros por estado (`confirmada`, `cancelada`, `completada`, `no_asistio`) en panel cliente.

## BUG-005 - â€œPrÃ³ximas clasesâ€ limitado a 2 y UX insuficiente
- Tipo: frontend UI / UX
- Owner sugerido: Frontend
- Dependencias: BUG-003
- Done esperado:
  - componente muestra clases reales prÃ³ximas con criterio UX escalable.

## BUG-006 - PaginaciÃ³n global en listados
- Tipo: UX/paginaciÃ³n + posible backend contract
- Owner sugerido: Frontend + Backend
- Dependencias: estabilizaciÃ³n de integridad P0
- Done esperado:
  - estrategia de paginado por vistas de alto volumen (cliente/admin/coach), sin listados infinitos.

## P2 (posterior a estabilizaciÃ³n core)

## BUG-009 - IntegraciÃ³n Mercado Pago
- Tipo: integraciÃ³n de pagos
- Owner sugerido: Frontend + Backend
- Dependencias: P0 y P1 cerrados
- Done esperado:
  - flujo de compra real con entorno sandbox/prod, trazabilidad y manejo de errores.

## Mapa rÃ¡pido frontend-only vs requiere backend
- Frontend-only probable: BUG-001, BUG-002, BUG-005, BUG-007, BUG-011
- Requiere backend (o validaciÃ³n backend): BUG-003, BUG-004, BUG-006, BUG-008, BUG-010, BUG-012, BUG-013, BUG-009

## Orden sugerido de ejecuciÃ³n (sprint tÃ©cnico)
1. BUG-001
2. BUG-003
3. BUG-004
4. BUG-008
5. BUG-007
6. BUG-013
7. BUG-010
8. BUG-011
9. BUG-012
10. BUG-002
11. BUG-005
12. BUG-006
13. BUG-009

## ActualizaciÃ³n 2026-05-29 (BUG-003)
- BUG-003 => **Cerrado end-to-end (frontend)**.
- Criterio de cierre aplicado:
  - reserva crea con `occurrence_id` obligatorio.
  - render y matching diario por `occurrence_id`.
  - waitlist migrada a `occurrenceId`.
- Pendiente posterior:
  - BUG-004 (crÃ©ditos/paquetes) como siguiente prioridad P0.

`r`n
## Actualización 2026-05-30 (BUG-004 cierre core)
- Estado BUG-004 Core: **Cerrado**.
- Criterio de cierre cumplido:
  - créditos/membresía persisten tras login/reload/logout-login.
  - créditos se refrescan tras reservar/cancelar.
  - dashboard cliente en modo API usa estado financiero backend como verdad.
- Pendiente separado (no bloquea cierre core):
  - compra self-service real y transacciones reales de cliente (BUG-009 / Fase pagos).



## Actualización 2026-05-30 (BUG-010 cierre frontend)
- Estado BUG-010: **Corregido (frontend)**.
- Tabla “Todas mis clases esta semana” en API mode usa `agenda.occurrences` desde `GET /api/v1/coaches/me/agenda?from&to`.
- En API mode ya no depende de `clasesStore`, `coachesStore` ni matching por nombre.
- BUG-011 y BUG-012 quedan como siguientes.

## Actualización 2026-05-30 (BUG-011 cierre frontend)
- Estado BUG-011: **Corregido (frontend)**.
- En API mode, métricas de coach derivan de `agenda.occurrences` (`GET /api/v1/coaches/me/agenda?from&to`).
- Ya no se usan métricas hardcodeadas ni fuentes mock/local como verdad en API mode.
- Siguiente bug recomendado: BUG-012.

## Actualización 2026-05-30 (BUG-012 cierre frontend)
- Estado BUG-012: **Corregido (frontend)**.
- “Clases de hoy” en API mode deriva de `agenda.occurrences` (`GET /api/v1/coaches/me/agenda?from&to`).
- Filtro por `occurrenceDate` (fecha real), orden por hora, sin depender de `dia` de clase base.
- Sin uso de `clasesStore/coachesStore/coachNombre` como verdad en API mode para este bloque.
- Bloque coach P0 (BUG-010/011/012) queda cerrado funcionalmente en frontend.

## Actualización 2026-05-30 (BUG-002 cierre frontend)
- Estado BUG-002: **Corregido (frontend)**.
- “Mis clases” ahora permite filtro por estado: `all`, `confirmada`, `cancelada`, `completada`, `no_asistio`.
- Source of truth en API mode: `GET /api/v1/reservas/me`.
- El filtro también funciona en fallback mock/local cuando flags API están en false.

## Actualización 2026-05-30 (BUG-005 diagnóstico)
- Estado BUG-005: **Diagnosticado (frontend-only)**.
- Hallazgo principal: bloque “Mis próximas clases” en dashboard cliente aplica límite hardcodeado (`.slice(0, 2)`), recortando listado real.
- Source of truth en API mode confirmado: reservas adaptadas desde `GET /api/v1/reservas/me`.
- Pendiente implementación:
  - criterio explícito de “próximas” (hoy/futuras, estado `confirmada`, orden por ocurrencia),
  - límite UX configurable/no estático (3-5),
  - CTA “Ver todas” hacia “Mis clases” filtrado.

## Actualización 2026-05-30 (BUG-005 cierre frontend)
- Estado BUG-005: **Corregido (frontend)**.
- “Mis próximas clases” usa helper con criterio explícito (confirmadas, hoy/futuras, orden por ocurrencia).
- Source of truth en API mode: `GET /api/v1/reservas/me`.
- Se elimina límite rígido de 2 y se aplica límite visual configurable (`4`) + CTA “Ver todas”.
- BUG-006 queda como siguiente para estrategia global de paginación/listados.

## Actualización 2026-05-30 (BUG-006 diagnóstico)
- Estado BUG-006: **Diagnosticado**.
- Clasificación: **estrategia mixta frontend + backend**.
- Hallazgos:
  - existen listados ya controlados (ej. `InfiniteList` en calendario admin, resumen de próximas clases cliente),
  - persisten tablas/listas sin paginación en vistas principales (admin lista de clases, historial reservas modal admin, historiales cliente).
  - endpoints API clave siguen sin contrato paginado (`page/page_size/total/items`).
- Primer paso recomendado:
  - ejecutar quick wins frontend en listados críticos (límite visual + "ver más"/paginación client-side),
  - abrir tarea backend paralela para contrato paginado estándar.

## Actualización 2026-05-30 (BUG-006A/B mitigación frontend)
- Estado BUG-006A/B: **Aplicado (frontend-only)**.
- Mitigaciones implementadas:
  - Cliente historial financiero con paginación visual.
  - Admin clases (vista lista) con paginación visual.
  - Admin historial de reservas por usuario (modal) con paginación visual.
- Estado BUG-006C: **Pendiente** (contrato backend paginado: `page`, `page_size`, `total`, `items`).
- Primer siguiente paso recomendado: abrir implementación backend de paginación por endpoint crítico.

## Actualización 2026-05-30 (BUG-006C frontend parcial)
- Estado BUG-006C frontend: **Parcialmente integrado**.
- Integrado:
  - adapter de respuesta paginada/legacy.
  - cliente movimientos de crédito desde endpoint paginado dedicado.
  - admin clases (vista lista, filtro `Todas`) consumiendo paginación backend.
- Pendiente:
  - migrar "Mis clases" cliente a paginación backend por rango/filtro sin romper agrupación semanal.
  - extender paginación backend a listados admin globales cuando endpoints estén disponibles.

## Actualización 2026-05-30 (BUG-006C cierre frontend)
- Estado BUG-006C frontend: **Cerrado para alcance cliente/admin actual**.
- Integrado en cliente:
  - Mis clases paginado backend por semana/filtro (`reservas/me?page&page_size&status&from&to`).
- Integrado en admin:
  - Clases vista lista paginada backend (filtro `Todas`).
- Integrado en cliente pagos:
  - credit-movements paginado backend.
- Pendiente posterior (fuera de este cierre): endpoints admin globales paginados (`users/reservas/coaches`) según disponibilidad backend.

## Cierre Core antes de BUG-009
Estado de estabilización core consolidado (frontend):
- [x] BUG-001
- [x] BUG-002
- [x] BUG-003 (end-to-end con `occurrence_id`)
- [x] BUG-004 Core
- [x] BUG-005
- [x] BUG-006 Core actual
  - BUG-006A/B aplicado
  - BUG-006C cerrado para alcance cliente/admin actual
  - pendiente posterior no bloqueante: paginación admin global (`users/reservas/coaches`) cuando backend exponga contratos paginados
- [x] BUG-007
- [x] BUG-008
- [x] BUG-010
- [x] BUG-011
- [x] BUG-012
- [x] BUG-013

Salida de esta fase:
- Core estabilizado y listo para QA final multi-rol pre-BUG-009.
- BUG-009 (Mercado Pago) queda como siguiente módulo grande sin bloqueo por deuda core.

- BUG-009 frontend re-integrado: paquetes backend + checkout backend + retorno por external_reference.
