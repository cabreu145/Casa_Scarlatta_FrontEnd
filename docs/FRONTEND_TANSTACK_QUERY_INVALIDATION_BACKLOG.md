# Frontend TanStack Query Invalidation Backlog

Fecha: 2026-06-09
Repo: D:\Casa_Scarlatta_FrontEnd
Branch: local

## Objetivo

Backlog futuro para revisar invalidaciones/refetch despues de mutaciones API.
No implementar aun. Solo roadmap.
Este bloque va despues del backlog de email/notificaciones en el roadmap.

## Tabla de backlog

| Modulo | Mutacion | Queries a invalidar | Estado actual | Prioridad |
|---|---|---|---|---|
| Auth/perfil | editar perfil | `me`, `profile` | parcial | P1 |
| Cliente reservas | crear/cancelar reserva | `myReservations`, `occurrenceRoster`, `myFinancialState` | parcial | P0 |
| Cliente pagos/membresias | compartir/borrar beneficiario | `myMemberships`, `myFinancialState` | parcial | P1 |
| Admin clases | crear/editar/eliminar clase | `adminClasses`, `occurrences`, `occurrenceRoster` | parcial | P0 |
| Admin alumnos/roster | inscribir/cancelar/no-asistio | `occurrenceRoster`, `adminClasses`, `reservas` | parcial | P0 |
| Admin coaches | create/update/status/delete | `adminCoaches`, badges | parcial | P1 |
| Admin usuarios/clientes | create/update/delete/package/credits | `adminClients`, `adminClientDetail`, badges | parcial | P0 |
| Admin paquetes | create/update/status/featured/delete | `adminPackages`, `myMemberships`, selectors | parcial | P1 |
| Admin POS | productos/ventas/categorias | `posProducts`, `posSales`, `adminClients` | parcial | P0 |
| Admin finanzas | gastos/cortes/export | `finance/*`, `expenses/*`, `cashClosings/*` | parcial | P0 |
| Admin reportes | filtros/exports | `reports/*` | parcial | P2 |
| Admin actividad | eventos | `activity/*` | pendiente backend | P3 |
| Coach agenda | reservas propias | `coachAgenda`, `occurrenceRoster` | parcial | P1 |
| Coach roster | marcar asistencia/no-show | `occurrenceRoster`, `coachAgenda` | parcial | P1 |
| Waitlist | unirse/salir | `waitlist`, `occurrenceRoster` | parcial | P1 |
| Spots/holds | hold/reserva spot | `occurrenceRoster`, `seatMap`, `reservas` | parcial | P0 |

## Regla general

- Mutacion exitosa -> invalidateQueries por prefijo
- No mezclar source local con server state en API mode
- No usar refresh manual como unica estrategia

## Siguiente paso recomendado

1. Cerrar invalidaciones por modulo
2. Extraer helpers comunes de query keys
3. Añadir tests de refetch por mutacion critica
