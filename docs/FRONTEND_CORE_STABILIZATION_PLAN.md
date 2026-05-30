# FRONTEND_CORE_STABILIZATION_PLAN.md

## Resumen ejecutivo
El frontend ya integra Auth, Clases, Reservas y Waitlist contra backend real, pero QA visual reporta 13 bugs críticos (BUG-001 a BUG-013) con patrón común: mezcla de fuentes de datos (`API + mock + localStorage + hardcoded`) cuando flags API están activos.  
Objetivo de esta fase: estabilizar comportamiento core y asegurar que, en modo API activo, backend sea la única fuente de verdad funcional.

## Diagnóstico general
- Integración técnica de endpoints: completada.
- Estabilización de UX/data consistency: incompleta.
- Causa transversal: stores persistidos e información derivada local siguen influyendo en pantallas en modo API.
- Impacto:
  - inconsistencias de reservas/fechas/créditos
  - paneles con métricas hardcodeadas
  - datos de perfil/pagos desfasados
  - confianza operativa reducida en roles cliente/admin/coach

## Reglas de source of truth
- Con flag API activo por módulo, backend define estado actual.
- Stores Zustand en modo API: cache de UI + estado de interacción, no fuente autoritativa.
- Datos mock/hardcoded solo permitidos cuando flag del módulo está en `false`.
- Si falta endpoint/contrato backend: mostrar estado vacío controlado o banner “pendiente de integración”, nunca datos simulados como reales.

## Qué significa “modo API activo”
Un módulo está en modo API activo cuando su flag está en `true`:
- `VITE_USE_API_AUTH=true`
- `VITE_USE_API_CLASSES=true`
- `VITE_USE_API_RESERVATIONS=true`
- `VITE_USE_API_WAITLIST=true`

En ese estado:
- Lectura y escritura del dominio via API.
- Refetch/invalidación después de mutaciones.
- Sin side-effects de negocio locales (FIFO, créditos, cupos) como verdad final.

## Política: no mostrar mock/hardcoded cuando API flag está activo
- Prohibido renderizar métricas o listados hardcodeados en paneles activos con API.
- Prohibido mezclar “último estado local persistido” con respuesta API si genera contradicción funcional.
- Permitido:
  - placeholders de loading
  - empty states
  - mensajes de “pendiente de integración”

## Tabla de bugs (BUG-001 a BUG-013)
| Bug | Tipo | Severidad | Prioridad | Módulo afectado | Archivos probables a revisar | Frontend | Backend | Ambos | Dependencias |
|---|---|---|---|---|---|---|---|---|---|
| BUG-001 | frontend data source / frontend UI | Alta | P0 | Cliente Dashboard Reservar | `frontend/src/pages/cliente/ClientPanel.jsx`, `frontend/src/stores/clasesStore.js`, `frontend/src/hooks/useClasses.js` | Sí | No | No | Base para BUG-003/005 |
| BUG-002 | frontend UI | Media | P1 | Cliente Mis Clases filtros | `frontend/src/pages/cliente/ClientPanel.jsx`, `frontend/src/stores/reservasStore.js` | Sí | No | No | Depende de estabilizar BUG-003 |
| BUG-003 | frontend data source + backend data model | Alta | P0 | Reservas fecha/día | `frontend/src/adapters/reservationAdapter.js`, `frontend/src/services/reservasApiService.js`, `frontend/src/pages/Clases.jsx`, `frontend/src/pages/cliente/ClientPanel.jsx` | Sí | Sí | Sí | Bloquea BUG-005, impacta BUG-013 |
| BUG-004 | frontend data source + backend contract missing | Alta | P0 | Créditos/paquetes | `frontend/src/services/reservasService.js`, `frontend/src/stores/authStore.js`, `frontend/src/services/usuariosService.js`, `frontend/src/pages/cliente/ClientPanel.jsx` | Sí | Sí | Sí | Relacionado con BUG-008 |
| BUG-005 | frontend UI / UX-paginación | Media | P1 | Próximas clases | `frontend/src/pages/cliente/ClientPanel.jsx` | Sí | No | No | Depende de BUG-003 |
| BUG-006 | UX/paginación + backend contract missing | Media-Alta | P1 | Listados globales cliente/admin/coach | `frontend/src/pages/cliente/ClientPanel.jsx`, `frontend/src/pages/admin/*`, `frontend/src/pages/coach/*`, stores/list hooks | Sí | Sí | Sí | Transversal, después de P0 de integridad |
| BUG-007 | frontend UI / frontend data source | Alta | P0 | Perfil cliente | `frontend/src/pages/cliente/ClientPanel.jsx`, `frontend/src/services/usuariosService.js`, `frontend/src/context/AuthContext.jsx` | Sí | Posible | Sí | Relacionado con BUG-004 |
| BUG-008 | frontend data source / UX-paginación | Alta | P0 | Paquetes & Pagos | `frontend/src/pages/cliente/ClientPanel.jsx`, `frontend/src/stores/authStore.js`, `frontend/src/stores/transaccionesStore.js` | Sí | Sí | Sí | Depende de BUG-004; conecta BUG-006 |
| BUG-009 | integración de pagos | Alta (fuera alcance inmediato) | P2 | Contratación de paquetes web | `frontend/src/pages/cliente/ClientPanel.jsx`, futuros servicios de pagos | Sí | Sí | Sí | Después de estabilización core |
| BUG-010 | frontend data source / backend contract missing | Alta | P0 | Coach Dashboard clases semana | `frontend/src/pages/coach/*`, `frontend/src/stores/clasesStore.js`, `frontend/src/services/classService.js` | Sí | Sí | Sí | Relacionado con BUG-013 |
| BUG-011 | frontend UI / frontend data source | Alta | P0 | Coach métricas hardcodeadas | `frontend/src/pages/coach/*` | Sí | No | No | Depende de BUG-010 |
| BUG-012 | frontend data source | Alta | P0 | Coach clases del día | `frontend/src/pages/coach/*`, filtros fecha/hora | Sí | Posible | Sí | Depende de BUG-010 |
| BUG-013 | backend data model + frontend data source | Alta | P0 | Admin asignación coach y repetición por días | `frontend/src/pages/admin/sections/ClasesSection.jsx`, `frontend/src/pages/coach/*`, adapters clases/reservas | Sí | Sí | Sí | Vinculado a BUG-003 y BUG-010/012 |

## Clasificación agregada por tipo
- frontend UI: BUG-001, 002, 005, 007, 011
- frontend data source: BUG-001, 003, 004, 007, 008, 010, 012, 013
- backend contract missing: BUG-004, 006, 010
- backend data model: BUG-003, 013
- UX/paginación: BUG-005, 006, 008
- integración de pagos: BUG-009

## Dependencias clave entre bugs
1. BUG-001 -> habilita validación funcional de flujo de reserva desde dashboard.
2. BUG-003 -> prerequisite para confiabilidad de “mis clases” y próximas clases (BUG-005).
3. BUG-004 -> prerequisite de indicadores de créditos/paquetes (BUG-008).
4. BUG-010 -> prerequisite para eliminar hardcode coach (BUG-011) y clases del día (BUG-012).
5. BUG-013 cruza Admin+Coach y posiblemente backend model; requiere coordinación con BUG-003/010.

## Estrategia de estabilización (sin implementar aún)
1. Congelar regla “API mode sin mock data visible”.
2. Corregir integridad de datos de reservas/fechas/créditos (P0 funcional).
3. Corregir dashboards por rol para eliminar hardcoded y dependencias locales en modo API.
4. Estabilizar listados y UX/paginación (P1).
5. Dejar pagos (Mercado Pago) en P2 tras estabilidad core.

## Criterio de cierre de estabilización core
- Todos los P0 en Pass en corrida QA multi-rol.
- Sin hardcoded funcional en paneles con flags API activos.
- Métricas/estados consistentes entre pantalla y backend tras refresh.
- Documentación actualizada de contratos y gaps restantes.

## Avance Sprint (2026-05-29)
### BUG-001
- Estado: corregido.
- Causa raíz:
  - Dashboard cliente filtraba clases por `dia/fecha` estricta.
  - `/clases` usa `getPublicClassesByDate`, que tolera clases API sin `dia/fecha`.
  - Resultado: en dashboard no aparecían clases reales que sí eran visibles en `/clases`.
- Ajuste aplicado:
  - Dashboard “Reservar clase” migra a misma lógica de `/clases` para obtener clases por día.
  - En `VITE_USE_API_CLASSES=true`, `clasesStore` arranca con `[]` para evitar mostrar `CLASES_MOCK` como verdad inicial.
- Source of truth final (clases en modo API):
  - Backend (`GET /api/v1/clases`) + adapter + cache store.
- Pendientes relacionados:
  - BUG-003 (fechas/repeticiones de reservas).
  - BUG-005 (UI/UX de próximas clases y cantidad visible).

### BUG-003
- Estado: mitigación frontend aplicada (no cierre definitivo).
- Ajuste implementado:
  - `reserved_at` dejó de mapearse como fecha de sesión.
  - matching “reservada/cancelable” por día exige fecha de ocurrencia real cuando API está activa.
  - vistas diarias excluyen reservas sin fecha de sesión y muestran estado neutral.
- Deuda técnica pendiente:
  - backend hoy puede devolver `class_date` y `class_start_at` en `null`.
  - para cierre definitivo se requiere modelo real de ocurrencias.
  - criterio mínimo de cierre definitivo: `occurrence_id` o `class_start_at/class_date` consistentes no nulos para matching por sesión.

## Avance de cierre definitivo BUG-003 (2026-05-29)
- Cierre parcial previo reemplazado por cierre end-to-end frontend con contrato backend de ocurrencias.
- Reglas vigentes:
  - sesión reservable = `occurrence_id`.
  - `class_id` solo metadata de clase base.
  - `reserved_at` nunca fecha de sesión.
- Resultado:
  - elimina repetición falsa de reservas por días al segmentar por ocurrencia real.

## Hotfix request-storm (2026-05-29)
- Estado: aplicado.
- Alcance táctico:
  - dedupe de llamadas de ocurrencias por llave `classId|from|to`.
  - requests abortables en cambio de rango/unmount.
  - waitlist sin precarga masiva; carga bajo demanda.
- Deuda técnica recomendada:
  - migrar a TanStack Query + endpoint bulk/BFF para ocurrencias y waitlist.
