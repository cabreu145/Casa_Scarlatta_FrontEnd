# BUG_003_RESERVATION_DATE_DIAGNOSIS.md

## Resumen del bug
BUG-003 reporta que, al reservar una clase para un día específico (ej. 30 mayo 2026), la reserva aparece en días adyacentes (29, 30, etc.) y además se muestra como confirmada/cancelable donde no corresponde.

## Diagnóstico técnico (causa probable)
La causa es combinada (frontend + contrato backend actual):

1. El frontend no tiene un identificador de **ocurrencia concreta** de clase en la reserva (fecha/hora programada de esa sesión).
2. Aunque backend ya expone `class_date` y `class_start_at`, actualmente pueden venir `null` mientras no exista modelo real de ocurrencias.
3. Varias vistas frontend resuelven estado “reservada” por `claseId` (y no por `claseId + fecha ocurrencia`), lo que provoca “contaminación” entre días para clases recurrentes.
4. El adapter de reservas usa `reserved_at` (momento de creación de reserva) como fallback para `fecha` de clase, dato que no representa necesariamente la fecha real de la sesión.

## Archivos implicados
- Frontend adapter/reservas:
  - `frontend/src/adapters/reservationAdapter.js`
  - `frontend/src/services/reservasApiService.js`
  - `frontend/src/services/reservasService.js`
  - `frontend/src/stores/reservasStore.js`
- Frontend vistas/filtrado por día:
  - `frontend/src/pages/Clases.jsx`
  - `frontend/src/pages/cliente/ClientPanel.jsx`
  - `frontend/src/features/clases/SeatSelector.jsx`
  - `frontend/src/services/classService.js`
- Backend contrato observado:
  - `D:\Casa_Scarlatta_Backend\app\schemas\reservation.py`
  - `D:\Casa_Scarlatta_Backend\app\api\v1\reservations.py`

## Flujo actual de datos (resumen)
1. `POST /api/v1/reservas` crea reserva con `{ clase_id, user_id, seat_number? }`.
2. `GET /api/v1/reservas/me` devuelve `ReservationRead` con:
   - `id`, `user_id`, `class_id`, `status`, `reserved_at`, `checked_in_at`,
   - `class_start_at`, `class_date`, `class_start_time`, `class_name`, `class_status`.
3. `reservationAdapter` en frontend (antes de mitigación):
   - enriquece desde `classesById[class_id]` para `claseNombre`, `hora`, `dia`, `tipo`.
   - define `fecha` como `classData.fecha ?? reserved_at ?? today`.
4. Vistas consumen esa estructura:
   - `/clases` marca `miReserva` por `claseId` + estado confirmada.
   - `SeatSelector` calcula asientos ocupados por `claseId` + confirmada.
   - `ClientPanel` agrupa/filtra por `r.fecha` o `r.claseDia` fallback.

## Campos disponibles actualmente (backend)
Según `ReservationRead`:
- `id`
- `user_id`
- `class_id`
- `status`
- `reserved_at`
- `checked_in_at` (opcional)
- `class_start_at` (puede venir `null`)
- `class_date` (puede venir `null`)
- `class_start_time`
- `class_name`
- `class_status`

Campo aún faltante para cierre robusto:
- `occurrence_id` (o equivalente de ocurrencia concreta), o garantía de `class_start_at/class_date` no nulos.

## Qué dato falta para resolver de raíz
Falta un campo de **fecha/hora de ocurrencia de clase reservada** (o identificador de ocurrencia) en el contrato de reservas.

Opciones válidas de contrato backend:
- `class_start_at` (datetime absoluto recomendado),
- o `class_date` + `start_time`,
- o `occurrence_id` referenciable.

## ¿Se puede corregir solo en frontend?
Parcialmente, con mitigación limitada:
- Se puede reducir el error visual evitando usar `reserved_at` como `fecha` de clase.
- Se puede restringir “reservada/cancelable” a contextos con fecha explícita y no por `claseId` plano.

Pero corrección robusta de negocio requiere backend porque hoy no existe el dato de ocurrencia en la reserva.

## Clasificación de alcance
- Frontend-only: mitigación visual parcial.
- Requiere backend: corrección definitiva.
- Diagnóstico final: **ambos**.

## Propuesta de solución mínima (sin implementar aún)
### Fase A (frontend, mitigación)
1. En adapter de reservas, no inferir `fecha` desde `reserved_at` como fecha de clase.
2. En vistas (`/clases`, `SeatSelector`, `ClientPanel`), evitar resolver estado reservado por `claseId` únicamente cuando existen clases recurrentes.
3. Si falta fecha de ocurrencia, mostrar estado neutral controlado (no afirmar reserva en día incorrecto).

### Fase B (backend + frontend, solución real)
1. Backend expone en `ReservationRead` la ocurrencia reservada (`class_start_at` recomendado).
2. Frontend adapta mapper y filtros diarios por `claseId + class_start_at` (o `occurrence_id`).
3. Ajuste en reglas de “cancelable”, “ocupado”, “mis clases” y “próximas clases”.

## Riesgos
- Si se aplica solo mitigación frontend, puede ocultarse info válida en algunos casos.
- Si no se agrega campo de ocurrencia backend, persistirán ambigüedades en clases recurrentes.
- Cambios en filtros de día impactan BUG-005 y vistas coach/admin relacionadas (BUG-010/012/013).

## Tests necesarios
### Unitarios frontend
- `reservationAdapter`:
  - no usar `reserved_at` como fecha de clase cuando no hay `classData.fecha`.
  - map correcto cuando backend incluya `class_start_at` (futuro).
- Vistas:
  - `/clases` no marca “reservada” en día incorrecto para misma `class_id`.
  - `SeatSelector` no bloquea asientos de ocurrencias no correspondientes.

### Integración/E2E
- Reservar clase para fecha A y verificar que solo aparece en fecha A.
- Verificar cancelación solo en ocurrencia correcta.
- Verificar “Mis clases” y “Próximas clases” sin duplicados por días.

## Recomendación de siguiente paso
1. Implementar mitigación frontend controlada para reducir falsa repetición visual (sin inventar fechas).
2. Abrir gap técnico backend para extender `ReservationRead` con fecha/hora de ocurrencia.
3. Luego corregir BUG-005 y validaciones cruzadas en coach/admin.

## Mitigación frontend aplicada (2026-05-29)
- `reservationAdapter` actualizado:
  - `reserved_at` se conserva como `fechaCreacionReserva` (ya no se usa como fecha de sesión).
  - mapea `class_start_at`, `class_date`, `class_start_time`, `class_name`, `class_status`.
  - `fecha/fechaSesion` solo se llena con ocurrencia real (`class_date` o `class_start_at`) o `classData.fecha` cuando exista; no se inventa desde `reserved_at`.
- `/clases`:
  - estado reservada/cancelable en grilla diaria no se afirma por `class_id` plano cuando API reservas está activa.
  - requiere fecha de ocurrencia para marcar reserva en día seleccionado.
- `ClientPanel` (`Mis clases` y `Próximas clases`):
  - filtros diarios en modo API usan solo fecha de ocurrencia real.
  - reservas confirmadas sin fecha de sesión quedan fuera de filtros diarios y muestran mensaje neutral.
- `SeatSelector`:
  - ocupación de asientos y reserva existente solo se evalúan por ocurrencia cuando existe fecha seleccionada + fecha de ocurrencia; evita bloquear por otra ocurrencia ambigua.

## Estado posterior a mitigación
- BUG-003: mitigado en frontend.
- Cierre definitivo: pendiente hasta que backend entregue ocurrencia real no nula (`class_date`/`class_start_at` consistente u `occurrence_id`).

## Cierre end-to-end BUG-003 (2026-05-29)
- Estado: cerrado end-to-end en frontend con modelo de ocurrencias activo.
- Backend source of truth:
  - `class_occurrences`
  - reserva nueva requiere `occurrence_id`
- Decisión aplicada frontend:
  - matching de reserva por `occurrence_id`.
  - `class_date` / `class_start_at` como fecha real de sesión.
  - `reserved_at` solo `fechaCreacionReserva`.
- Waitlist:
  - consulta por `occurrenceId`.
  - alta con `occurrence_id`.
  - baja por `entry_id`.
- Riesgo residual:
  - QA visual multi-rol pendiente para confirmar flujos admin/coach.

## Nota de regresión UI (2026-05-29)
- Incidente: crash en `ClassCard` por `.slice()` sobre `cls.date = null` tras integración de ocurrencias.
- Fix aplicado frontend: render null-safe con fallback (`Sin fecha`, `Sin horario`, `Sin tipo`, `Por definir`).
- Alcance: solo presentación; sin cambio de reglas de reserva/waitlist.

## Hotfix performance táctico (2026-05-29)
- Síntoma: tormenta de requests `GET /clases/{id}/ocurrencias` y `GET /lista-espera?occurrenceId=...` causando `ERR_INSUFFICIENT_RESOURCES`.
- Causa principal frontend:
  - `ClientPanel` recalculaba `resWeekDays` en cada render y disparaba efecto de ocurrencias continuamente.
  - precarga masiva de waitlist por múltiples ocurrencias al montar.
- Fix aplicado:
  - dedupe in-flight por `classId+from+to` en `occurrencesApiService`.
  - AbortController en cargas de ocurrencias (`Clases` y `ClientPanel`).
  - eliminación de precarga masiva waitlist al montar; waitlist queda bajo demanda por acción.
  - bloqueo mínimo store waitlist para evitar fetch duplicado simultáneo por `occurrenceId`.

## Corrección llamada legacy waitlist (2026-05-29)
- Se eliminó uso de `syncClaseApi(claseId)` en cancelación API.
- En modo API waitlist, refresh de lista de espera ocurre solo por `occurrenceId`.
- Si reserva API no trae `occurrenceId`, no se consulta waitlist (sin fallback a `claseId`).
