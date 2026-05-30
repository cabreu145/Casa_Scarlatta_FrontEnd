# CORE_STABILIZATION_BACKLOG.md

## Objetivo
Ordenar ejecución de estabilización core para BUG-001 a BUG-013 antes de nuevos módulos.

## Supuestos operativos
- No tocar backend en esta fase de planificación.
- No eliminar mocks aún; solo restringir su uso por flags.
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
  - Dashboard “Reservar clase” ahora usa el mismo criterio de filtrado que `/clases` (`getPublicClassesByDate` sobre clases API adaptadas/publicadas).
  - En modo API, `clasesStore` inicia vacío (`[]`) y deja de inyectar `CLASES_MOCK` como verdad inicial.

## BUG-003 - Reserva aparece en días incorrectos/repetidos
- Tipo: frontend data source + backend data model
- Owner sugerido: Frontend + Backend (validación de modelo)
- Dependencias: BUG-001
- Estado: Mitigado frontend (2026-05-29), pendiente cierre definitivo
- Done esperado:
  - reserva aparece solo en fecha/día correctos según contrato real.
  - sin duplicados por derivación local de día.
- Hallazgo técnico clave:
  - `ReservationRead` no incluye fecha/hora de ocurrencia de clase (`class_start_at`/`class_date`).
  - Frontend hoy cruza por `class_id` y usa `reserved_at` como fallback de fecha, generando desalineación por día.
- Implicación:
  - mitigación parcial posible en frontend; solución robusta requiere ampliar contrato backend.
- Mitigación aplicada:
  - no usar `reserved_at` como fecha de sesión.
  - matching diario por ocurrencia real (si existe), no por `class_id` plano.
  - neutral state cuando falta fecha de ocurrencia.
- Cierre definitivo backend pendiente:
  - modelo de ocurrencias,
  - `occurrence_id` (o equivalente),
  - o `class_start_at/class_date` reales no nulos de forma consistente.

## BUG-004 - Cr�ditos no descuentan/persisten correctamente
- Tipo: frontend data source + contrato backend integrado
- Owner sugerido: Frontend + Backend
- Dependencias: BUG-003
- Estado: Cerrado Core (2026-05-30)
- Alcance core cerrado:
  - cr�ditos/membres�a persistentes tras login, refresh, reservar y cancelar.
  - source of truth en modo API: `GET /api/v1/clientes/me/estado-financiero`.
  - `/auth/me` se mantiene para identidad/sesi�n, no para balance financiero.
  - `PagoModal` en modo API no simula compra persistente ni muta cr�ditos localmente.
- Fuera de alcance BUG-004 (pendiente separado):
  - compra self-service real.
  - transacciones reales de cliente enriquecidas.
  - integraci�n de pagos/pasarela => BUG-009 / Fase pagos.
## BUG-007 - Perfil no muestra datos personales correctamente
- Tipo: frontend UI/data hydration
- Owner sugerido: Frontend
- Dependencias: Auth estable
- Done esperado:
  - formulario perfila datos al abrir sección, sin requerir click para hidratar.

## BUG-008 - Paquetes/pagos muestra 0 clases restantes incorrectamente
- Tipo: frontend data source / UX listados
- Owner sugerido: Frontend + Backend (si falta endpoint)
- Dependencias: BUG-004
- Done esperado:
  - clases restantes coherentes con estado backend y persistentes tras refresh.

## BUG-010 - Coach “todas mis clases semana” vacío/inconsistente
- Tipo: frontend data source + posible gap backend
- Owner sugerido: Frontend + Backend
- Dependencias: BUG-013
- Done esperado:
  - listado semanal coach refleja clases realmente asignadas.

## BUG-011 - Métricas coach hardcodeadas/no dinámicas
- Tipo: frontend UI/data source
- Owner sugerido: Frontend
- Dependencias: BUG-010
- Done esperado:
  - métricas derivadas de datos reales o estado vacío controlado.

## BUG-012 - Coach “clases de hoy” no muestra asignadas
- Tipo: frontend data source/filtro temporal
- Owner sugerido: Frontend + Backend (si datos de fecha insuficientes)
- Dependencias: BUG-010
- Done esperado:
  - filtro de “hoy” consistente con timezone/fecha de backend.

## BUG-013 - Asignación de clases a coach no se refleja y repetición por días
- Tipo: backend data model + frontend integration
- Owner sugerido: Frontend + Backend
- Dependencias: ninguna (raíz de coach/admin)
- Done esperado:
  - clases asignadas por admin visibles en coach dashboard.
  - sin repetición incorrecta por reglas de recurrencia/fecha.

## P1 (alta importancia, no bloqueantes inmediatos)

## BUG-002 - Falta filtro en “Mis clases”
- Tipo: frontend UI
- Owner sugerido: Frontend
- Dependencias: BUG-003
- Done esperado:
  - filtros por estado (`confirmada`, `cancelada`, `completada`, `no_asistio`) en panel cliente.

## BUG-005 - “Próximas clases” limitado a 2 y UX insuficiente
- Tipo: frontend UI / UX
- Owner sugerido: Frontend
- Dependencias: BUG-003
- Done esperado:
  - componente muestra clases reales próximas con criterio UX escalable.

## BUG-006 - Paginación global en listados
- Tipo: UX/paginación + posible backend contract
- Owner sugerido: Frontend + Backend
- Dependencias: estabilización de integridad P0
- Done esperado:
  - estrategia de paginado por vistas de alto volumen (cliente/admin/coach), sin listados infinitos.

## P2 (posterior a estabilización core)

## BUG-009 - Integración Mercado Pago
- Tipo: integración de pagos
- Owner sugerido: Frontend + Backend
- Dependencias: P0 y P1 cerrados
- Done esperado:
  - flujo de compra real con entorno sandbox/prod, trazabilidad y manejo de errores.

## Mapa rápido frontend-only vs requiere backend
- Frontend-only probable: BUG-001, BUG-002, BUG-005, BUG-007, BUG-011
- Requiere backend (o validación backend): BUG-003, BUG-004, BUG-006, BUG-008, BUG-010, BUG-012, BUG-013, BUG-009

## Orden sugerido de ejecución (sprint técnico)
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

## Actualización 2026-05-29 (BUG-003)
- BUG-003 => **Cerrado end-to-end (frontend)**.
- Criterio de cierre aplicado:
  - reserva crea con `occurrence_id` obligatorio.
  - render y matching diario por `occurrence_id`.
  - waitlist migrada a `occurrenceId`.
- Pendiente posterior:
  - BUG-004 (créditos/paquetes) como siguiente prioridad P0.

`r`n
## Actualizaci�n 2026-05-30 (BUG-004 cierre core)
- Estado BUG-004 Core: **Cerrado**.
- Criterio de cierre cumplido:
  - cr�ditos/membres�a persisten tras login/reload/logout-login.
  - cr�ditos se refrescan tras reservar/cancelar.
  - dashboard cliente en modo API usa estado financiero backend como verdad.
- Pendiente separado (no bloquea cierre core):
  - compra self-service real y transacciones reales de cliente (BUG-009 / Fase pagos).


