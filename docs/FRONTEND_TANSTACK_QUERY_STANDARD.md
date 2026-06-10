# Frontend TanStack Query Standard

Fecha: 2026-06-09
Repo: D:\Casa_Scarlatta_FrontEnd
Responsable: Codex

## Regla permanente

En API mode:

- lecturas con `useQuery`
- escrituras con `useMutation`
- invalidacion/refetch despues de mutaciones
- Zustand/localStorage solo para UI local o fallback legacy
- mock/demo nunca source of truth

## Catalogo unico

`src/api/queryKeys.js` es catalogo unico de keys.

### Convenciones

- keys estables
- parametros serializados dentro de objeto
- prefijos por dominio
- invalidar por prefijo cuando mutacion afecta varias vistas

### Ejemplos

```js
queryKeys.coaches.list(params)
queryKeys.coaches.public()
queryKeys.clients.list(params)
queryKeys.classes.list(params)
queryKeys.classes.occurrences(classId, range)
queryKeys.reservations.me(params)
queryKeys.occurrenceRoster.detail(occurrenceId, includeCanceled)
queryKeys.spots.byOccurrence(occurrenceId)
queryKeys.finances.kpis(params)
queryKeys.activity.list(params)
```

## Lecturas

- Toda lectura API real va por hook central en `src/hooks/useApiQueries.js` o wrapper equivalente.
- No hacer `fetch` manual dentro de componente si existe hook reusable.
- `enabled` controla carga diferida y modales.
- `placeholderData` o `keepPreviousData` solo cuando pagina/lista lo necesita.

## Mutaciones

- Toda escritura API real va por `useMutation`.
- Exito debe invalidar query afectada.
- Si mutacion cambia varias pantallas, invalidar por prefijo.
- No usar refresh manual como unica estrategia.

## Estados UI

- loading
- empty
- error
- success
- refetching

Regla:

- error no es empty
- empty no es error
- fallback legacy no debe disfrazarse de dato real

## Invalidaciones canonicas

### Reservas

Despues de `POST /reservas` o cancelacion:

- `reservations.me`
- `classes.occurrences`
- `occurrenceRoster.detail`
- `spots.byOccurrence`
- `financialState.me`
- `waitlist.byOccurrence`

### Admin alumnos / seat flow

- `occurrenceRoster.detail`
- `classes.occurrences`
- `classes.list`
- `spots.byOccurrence`
- `clients.list`
- `financialState` del cliente si aplica

### Coaches

- `coaches.list`
- `coaches.public`
- `adminBadges.coachesActive`
- `classes.list`
- `classes.occurrences`
- `coachAgenda.me`

### Clientes

- `clients.list`
- `clients.detail`
- `adminBadges.clientsActive`
- `reports.users`
- `financialState`

### Paquetes

- `packages.list`
- `packages.public`
- `clients.detail`
- `reports.packages`
- `myMemberships`

### POS

- `posProducts`
- `posSales`
- `finance.kpis`
- `finance.day`
- `finance.historical`
- `reports.pos`
- `cashClosings.today`

### Gastos / cortes

- `expenses.list`
- `finance.kpis`
- `finance.day`
- `finance.historical`
- `cashClosings.today`
- `cashClosings.list`

### Actividad

- `activity.list` ya es parte del estándar API mode

## Estados legacy permitidos

- `useApiMode === false`
- stores persistidos
- localStorage/sessionStorage
- mocks demo

## Estados legacy prohibidos en API mode

- stores como source of truth
- arrays staticos como verdad
- `Math.random()` en metricas visibles
- `page_size=1000`

## Patrón minimo de hook

```js
const query = useQuery({
  queryKey: queryKeys.domain.list(params),
  queryFn: () => getDomainApi(params),
  enabled,
  placeholderData: (prev) => prev,
})
```

## Patrón minimo de mutacion

```js
const mutation = useMutation({
  mutationFn: createDomainApi,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.domain.list() })
  },
})
```

## Nuevos dominios Query

- `notifications.list(params)`
- `notifications.unreadCount()`
- `emailConfig.detail()`
- `emailOutbox.list(params)`

## Mutaciones y invalidacion

- `markNotificationRead`, `markAllNotificationsRead`
- `updateEmailConfig`, `sendTestEmail`
- `retryEmailOutbox`
- Cada mutación invalida keys del dominio afectado; store legacy no participa en API mode.

## Roadmap de migracion

1. Admin clases / roster / seat flow
2. CoachPanel agenda / roster
3. Cliente reservas / mis clases / proximas clases
4. Admin usuarios/clientes
5. Admin coaches
6. Admin paquetes
7. Admin POS
8. Admin finanzas
9. Admin reportes
10. Admin actividad
