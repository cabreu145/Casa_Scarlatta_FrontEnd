# FRONTEND_FETCHING_ARCHITECTURE_PROPOSAL.md

## 1. Problema frontend actual
El frontend ya corrigió BUG-003 con `occurrence_id`, pero el modelo de fetching actual sigue siendo manual y frágil para crecimiento:

- N+1 requests por rango/semana cuando se consulta ocurrencias por clase.
- Riesgo de ráfagas de `GET /clases/{id}/ocurrencias` y errores de navegador (`ERR_INSUFFICIENT_RESOURCES`).
- Fetching distribuido en `useEffect` con alto costo de mantenimiento.
- Riesgo de memory leaks y stale state por actualizaciones asíncronas tras unmount/cambio rápido de pantalla.
- Riesgo de duplicados por cargas simultáneas desde componentes distintos.
- Mezcla de server state con estado UI/local (Zustand) sin capa unificada de invalidación.

## 2. Hotfix aplicado (estado actual)
Se aplicó contención táctica para estabilizar producción local/dev sin refactor masivo:

- Dedupe in-flight de ocurrencias por llave `classId|from|to`.
- `AbortController` en cargas por cambio de rango y unmount.
- Eliminación de precarga masiva de waitlist en dashboard.
- Waitlist bajo demanda (solo cuando acción/flujo lo requiere).
- Bloqueo mínimo de fetch duplicado por `occurrenceId` en waitlist store.

Limitación del hotfix:
- Es una capa táctica de contención de spam.
- No reemplaza arquitectura de server state robusta.
- No resuelve por completo deuda de invalidación/consistencia entre vistas.

## 3. Propuesta frontend: migración a TanStack Query
Objetivo: reemplazar fetching manual de server state por patrón estándar y escalable.

Beneficios esperados:
- Dedupe automático de requests por query key.
- Caché centralizada por recurso.
- Stale-while-revalidate configurable.
- Manejo consistente de loading/error/success.
- Invalidación explícita post-mutación.
- Reducción sustancial de `useEffect` imperativos.

Query keys propuestas:
- `['classes']`
- `['calendar', from, to]`
- `['occurrences', classId, from, to]`
- `['waitlist', occurrenceId]`
- `['reservations', 'me']`
- `['membership', 'me']`
- `['creditMovements', 'me']`

## 4. Defaults recomendados de TanStack Query
Propuesta inicial (ajustable con QA real):

- `classes`:
  - `staleTime`: 60s
  - `gcTime` (cacheTime): 10m
  - `retry`: 1
  - `refetchOnWindowFocus`: false

- `calendar/occurrences`:
  - `staleTime`: 20s
  - `gcTime`: 5m
  - `retry`: 1
  - `refetchOnWindowFocus`: false

- `waitlist`:
  - `staleTime`: 10s
  - `gcTime`: 2m
  - `retry`: 0 o 1 (según UX)
  - `refetchOnWindowFocus`: false

- `reservations me`:
  - `staleTime`: 15s
  - `gcTime`: 5m
  - `retry`: 1
  - `refetchOnWindowFocus`: true solo en paneles críticos

- `membership/creditMovements`:
  - `staleTime`: 10s
  - `gcTime`: 5m
  - `retry`: 1
  - `refetchOnWindowFocus`: true

Invalidaciones post-mutación sugeridas:
- Reservar: invalidar `['reservations','me']`, `['calendar',from,to]`, `['occurrences', classId, from, to]`, `['waitlist', occurrenceId]` (si aplica).
- Cancelar: mismas invalidaciones que reservar.
- Join waitlist: invalidar `['waitlist', occurrenceId]`.
- Leave waitlist: invalidar `['waitlist', occurrenceId]`.
- Compra paquete: invalidar `['membership','me']`, `['creditMovements','me']`.
- Actualización perfil: invalidar `['profile','me']` (si se define), `['membership','me']` si la UI depende de datos cruzados.

## 5. Lazy loading frontend
Lineamientos propuestos:

- Waitlist completo: cargar solo al abrir detalle de clase/ocurrencia o interacción explícita (join/leave/estado).
- Asientos: cargar solo al abrir `SeatSelector`.
- Detalles pesados: bajo demanda por panel/accordion/modal.
- Historial largo (movimientos, reservas antiguas): paginado (cursor/offset) y sin prefetch agresivo.

## 6. Relación con endpoint bulk/BFF backend
Para escalar y evitar N+1 por clase, frontend debería migrar a un endpoint agregado:

- `GET /api/v1/calendario?from=YYYY-MM-DD&to=YYYY-MM-DD`

Payload esperado frontend (propuesta):
- clases con ocurrencias anidadas por rango.
- cupo disponible por ocurrencia.
- `user_reservation` por ocurrencia (si autenticado).
- `user_waitlist_entry` por ocurrencia (si autenticado).
- `has_waitlist` (boolean) sin lista completa por defecto.

Resultado esperado:
- Menos round-trips.
- Menos coordinación manual cross-store.
- Menor riesgo de request storm en semana con alto volumen.

## 7. Plan incremental frontend

### Fase 1
- Mantener hotfix anti-spam actual (dedupe + abort + lazy waitlist).

### Fase 2
- Introducir TanStack Query en recursos server-state nuevos (sin migrar todo de golpe).

### Fase 3
- Migrar lecturas de `occurrences/reservations/waitlist` a hooks de query.

### Fase 4
- Consumir endpoint bulk `calendario` cuando backend lo publique.

### Fase 5
- Retirar caches manuales tácticos (Map/Set in-flight) que queden duplicando Query Cache.

### Fase 6
- Evaluar virtualización/paginación avanzada en listados extensos según evidencia QA.

## 8. Qué no hacer

- No construir "React Query casero" en stores.
- No duplicar server state entre Zustand y TanStack Query.
- No reactivar precarga masiva de waitlist.
- No mezclar mocks con flags API activos.
- No renderizar listados infinitos sin paginación/virtualización.

## 9. Inconsistencias documentales legacy detectadas
Se detectaron referencias legacy que deben actualizarse a `occurrenceId` para modo API:

- `frontend/README.md`:
  - líneas con `GET /api/v1/lista-espera?claseId=...` (ej. secciones históricas de integración/QA).

- `docs/FRONTEND_BACKEND_INTEGRATION_PLAN.md`:
  - referencias a `GET /api/v1/lista-espera?claseId=...`.
  - referencias a `syncClaseApi` como ruta principal en modo API.

- `docs/API_CONTRACT_MAPPING_FRONTEND.md`:
  - filas legacy con `getWaitlistByClaseApi(claseId)` y `syncClaseApi(claseId)` en modo API.

- `docs/FRONTEND_E2E_QA_CHECKLIST.md`:
  - checklist de network con `GET /api/v1/lista-espera?claseId=...`.

- `docs/FRONTEND_E2E_QA_RUN_TEMPLATE.md`:
  - bloques legacy en network/contrato que aún mencionan `claseId`.

Notas:
- Parte de los documentos ya incluye versión correcta por `occurrenceId`, pero coexisten bloques viejos y nuevos.
- Recomendación: limpieza documental única por lote para evitar ambigüedad en QA.

## 10. Riesgos

- Migrar todo de golpe: alta probabilidad de regresiones en paneles cliente/admin/coach.
- Duplicar caché (Zustand + Query) sin política clara de ownership.
- Invalidaciones incompletas tras mutaciones (estado visual inconsistente).
- Dependencia de endpoint bulk/BFF aún no implementado en backend.
- Riesgo de timezone/rangos (from/to) en bordes de día y cambios rápidos de semana.

## 11. Qué puede hacerse solo frontend vs dependencia backend

### Solo frontend (inmediato)
- Introducir TanStack Query gradualmente en lecturas.
- Estandarizar query keys e invalidaciones.
- Reducir fetching manual y unificar loading/error.
- Limpiar documentación legacy de `claseId` en waitlist API mode.

### Depende de backend
- Endpoint bulk/BFF `GET /api/v1/calendario?from&to`.
- Contrato agregado con `user_reservation`, `user_waitlist_entry`, `has_waitlist`.
- Optimización estructural para eliminar N+1 de raíz sin fan-out desde frontend.

## 12. Recomendación priorizada
1. Limpiar documentación legacy de waitlist por `claseId` (rápido, bajo riesgo).
2. Preparar RFC interna de query keys + invalidación (sin código masivo).
3. Introducir TanStack Query primero en `reservations me` y `waitlist occurrence`.
4. Migrar ocurrencias por rango a query hooks.
5. Coordinar diseño de endpoint bulk/BFF con backend antes de remover hotfix táctico.
