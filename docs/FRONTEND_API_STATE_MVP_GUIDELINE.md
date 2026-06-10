# FRONTEND_API_STATE_MVP_GUIDELINE

Objetivo: estandarizar lecturas y mutaciones de server state en MVP React sin migrar toda app.

## Regla base

- `useQuery` para lecturas.
- `useMutation` para create/update/delete/status/assign.
- `invalidateQueries` o `refetch` tras mutaciones.
- `enabled: false` o queries condicionales para modales, detalle y carga bajo demanda.
- `Zustand` queda para fallback legacy, UI state local y preferencias no persistentes.
- `TanStack Query` queda para server state, cache, loading/error y sincronización con backend.
- `RTK Query` no entra en MVP.

## Lecturas normales

Usar `useQuery` para:

- listados admin.
- catálogos.
- detalle cliente.
- estado financiero.
- membresías cliente.
- paquetes.
- coaches.
- clases.

Ejemplo:

```js
useQuery({
  queryKey: ['adminPackages', { page, pageSize, status, search }],
  queryFn: () => getMembershipPackagesPaginatedApi({ page, pageSize, status, search }),
  enabled: useApiMode,
  keepPreviousData: true,
})
```

## Mutaciones

Usar `useMutation` para:

- crear.
- editar.
- inactivar.
- destacar.
- cancelar.
- asignar paquete.
- agregar beneficiario.
- quitar beneficiario.

Ejemplo:

```js
useMutation({
  mutationFn: createMembershipPackageApi,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['adminPackages'] })
  },
})
```

## Lazy loading

Usar `enabled: false` o query condicional para:

- detalle en modal.
- beneficiarios no visibles en listado.
- historial.
- vistas pesadas.
- datos que dependen de click.

Ejemplo:

```js
useQuery({
  queryKey: ['clientDetail', clientId],
  queryFn: () => getClientDetailApi(clientId),
  enabled: Boolean(clientId && modalOpen),
})
```

## Reglas MVP

- No pedir datos no visibles.
- No cargar todos detalle al montar listado.
- No usar `page_size=1000`.
- Invalidate tras mutaciones.
- No duplicar source of truth entre TanStack Query y Zustand.
- `keepPreviousData` cuando mejora UX.
- `Zustand` no compite con `useQuery` para server state.

## Fase recomendada

1. Admin > Paquetes.
2. Cliente > Paquetes & Pagos.
3. Admin > Usuarios.
4. POS futuro.

## Nota de adopción

Esta guía define estándar MVP. No obliga migración completa inmediata. Cada módulo puede entrar por partes si riesgo bajo y tests cubren refetch/invalidate.

## POS API-first

Lecturas:

- productos POS con `usePosProductsQuery`.
- ventas POS con `usePosSalesQuery`.
- detalle y ticket con `usePosSaleDetailQuery` y `usePosSaleTicketQuery` bajo demanda.

Mutaciones:

- create/update/status/delete de producto con `useMutation`.
- crear venta POS con `useCreatePosSaleMutation`.

Reglas extra:

- carrito sigue local de UI.
- venta final e historial salen de backend.
- invalidar productos/ventas tras crear venta.
- invalidar cliente/detalle/estado financiero si venta incluye paquete a cliente.
- no usar `page_size=1000`.
