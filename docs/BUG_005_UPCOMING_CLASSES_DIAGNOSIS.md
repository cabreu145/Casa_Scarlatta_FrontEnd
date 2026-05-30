# BUG-005 - Diagnóstico de "Mis próximas clases"

## Resumen del bug
En Dashboard Cliente, el bloque **"Mis próximas clases"** está limitado a 2 elementos y no ofrece un patrón UX escalable cuando el usuario tiene más reservas futuras confirmadas.

## Causa probable
- Existe límite hardcodeado en `ClientPanel.jsx` sobre la lista de próximas reservas:
  - `upcomingReservas ... .slice(0, 2)`
- El bloque no es estático/mocked en API mode, pero sí está artificialmente truncado a 2, lo que provoca percepción de listado incompleto.

## Archivos implicados
- `frontend/src/pages/cliente/ClientPanel.jsx`
- `frontend/src/pages/cliente/ClassCard.jsx`
- `frontend/src/adapters/reservationAdapter.js`
- `frontend/src/stores/reservasStore.js`

## Flujo actual de datos
1. `reservasUsuario` se obtiene desde `reservasStore` filtrando por `userId`.
2. En API mode (`VITE_USE_API_RESERVATIONS=true`), `reservasStore` se sincroniza desde `GET /api/v1/reservas/me`.
3. `upcomingReservas`:
   - filtra `estado === 'confirmada'`
   - usa `getReservationOccurrenceDate(r)` + `classStartTime/claseHora` para determinar si es futura
   - ordena ascendente por fecha/hora
   - **limita con `.slice(0, 2)`**
4. Se mapea a `upcoming` y se renderiza en "Mis próximas clases".

## Source of truth esperado en API mode
- Debe mantenerse en reservas adaptadas de `GET /api/v1/reservas/me`.
- Ya se cumple para datos base.
- Problema principal es de **presentación/UX** (límite fijo y falta de mecanismo de expansión).

## Fuentes mock/local/hardcoded detectadas
- En API mode, "Mis próximas clases" no depende de mocks como verdad principal.
- Hardcode detectado:
  - `.slice(0, 2)` en cálculo de próximas clases.
- No se detectó uso de `reserved_at` como fecha de sesión en este bloque; usa campos de ocurrencia vía `getReservationOccurrenceDate` y hora de clase.

## Criterio recomendado para "próximas clases"
- Incluir reservas con:
  - estado `confirmada`
  - fecha/hora de ocurrencia `>= now` (hoy o futuro)
- Excluir:
  - `cancelada`, `completada`, `no_asistio`
- Orden:
  - ascendente por fecha de ocurrencia y hora de inicio.
- Si falta fecha de sesión real:
  - excluir del bloque de próximas o mostrar estado neutral separado, sin afirmar fecha.

## Propuesta UX mínima (sin romper diseño)
- Dashboard:
  - mostrar **3 a 5** tarjetas máximas (recomendado: 4).
  - mostrar contador de próximas totales.
  - agregar CTA discreto: **"Ver todas"** que navegue a `Mis clases` (con filtro `confirmada` y/o día correspondiente).
- Evitar listado infinito en dashboard.
- Mantener el dashboard como vista resumida.

## Clasificación
- **Frontend-only** para cierre de BUG-005 core.
- No requiere cambios backend para resolver límite/UX del bloque.

## Riesgos
- Si se aumenta límite sin control visual, puede romper altura del bloque en pantallas pequeñas.
- Si no se gestiona ausencia de fecha de sesión, puede reaparecer inconsistencia de reservas sin ocurrencia.
- Posible discrepancia de timezone al usar hora local para comparación futura/pasada (ya mitigado parcialmente con occurrence fields).

## Tests necesarios para implementación
- Unit:
  - selector/cálculo de próximas no limitado a 2 fijo.
  - orden ascendente por fecha/hora.
  - exclusión de estados no activos.
  - exclusión o tratamiento controlado de reservas sin fecha de sesión.
- UI:
  - render de máximo N tarjetas (N configurable).
  - empty state cuando no hay próximas.
  - CTA "Ver todas" navega correctamente a sección Mis clases.

## Recomendación de siguiente paso
Implementar fix frontend incremental:
1. Reemplazar `.slice(0, 2)` por límite visual configurable (ej. 4).
2. Añadir CTA "Ver todas" hacia Mis clases.
3. Mantener source of truth API mode desde `reservas/me` sin mezclar mocks.
