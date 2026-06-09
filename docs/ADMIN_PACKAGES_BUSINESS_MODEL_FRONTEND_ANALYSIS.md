# Admin Packages Business Model Frontend Analysis

Fecha: 2026-06-08
Scope: analisis frontend-only. Sin cambios de backend, servicios ni stores.

## Objetivo

Separar con precision tres conceptos que hoy se mezclan en UI:

1. `Package / paquete de catalogo`
2. `Client membership / membresia activa de cliente`
3. `Sale/payment / venta o pago`

Esto evita confundir:

- catalogo comercial
- membresia asignada a cliente
- transaccion economica
- historial de ventas

## Fuentes revisadas

- `frontend/src/pages/admin/sections/PaquetesSection.jsx`
- `frontend/src/stores/paquetesStore.js`
- `frontend/src/services/usuariosService.js`
- `frontend/src/stores/usuariosStore.js`
- `frontend/src/stores/transaccionesStore.js`
- `frontend/src/features/home/PricingSection.jsx`
- `frontend/src/pages/cliente/ClientPanel.jsx`
- `frontend/src/services/membershipPackagesApiService.js`
- usos de `membershipPackagesApiService` y `POST /api/v1/memberships`

## Hallazgo principal

`PaquetesSection.jsx` hoy mezcla dos capas:

- catalogo visual de paquetes
- historial de ventas de paquetes

El catalogo es una entidad de producto vendible. El historial pertenece a ventas o finanzas, no al CRUD de paquetes.

## A. Package / paquete de catalogo

Representa producto comercial vendible.

Campos visibles hoy en frontend:

- `nombre`
- `clases`
- `precio`
- `vigencia`
- `destacado`
- `beneficios`
- `categoria`

Uso frontend actual:

- landing / pricing
- compra online con Mercado Pago
- asignacion manual desde cliente
- POS legacy
- admin catalogo

Contrato backend probable / actual:

- `name`
- `credits`
- `price_mxn`
- `duration_days`
- `is_featured`
- `benefits` o `beneficios`
- `is_active`

Fuente real de catalogo API:

- `GET /api/v1/memberships/packages`
- `POST /api/v1/memberships/packages`
- `PUT /api/v1/memberships/packages/{package_id}`
- `DELETE /api/v1/memberships/packages/{package_id}`
- `PATCH /api/v1/memberships/packages/{package_id}/status`
- `PATCH /api/v1/memberships/packages/{package_id}/featured`

Estado frontend:

- `PricingSection.jsx` ya consume `GET /api/v1/memberships/packages` en API mode.
- `PaquetesSection.jsx` sigue leyendo `paquetesStore` legacy.
- `membershipPackagesApiService` existe y se usa como catalogo publico / comercial.

## B. Client membership / membresia de cliente

Representa relacion entre cliente y paquete.

No es el paquete mismo.

Campos esperados:

- cliente X
- paquete Y
- saldo de creditos
- fecha de compra o asignacion
- vencimiento
- movimientos
- reservas consumidas

Uso frontend actual:

- Admin > Usuarios > detalle cliente
- Dashboard cliente
- reserva / cancelacion
- estado financiero

Fuente backend actual / real:

- `GET /api/v1/clientes/me/estado-financiero`
- `GET /api/v1/clientes/me/credit-movements`
- `GET /api/v1/clientes/me/pagos`
- `GET /api/v1/clientes/{id}` para detalle admin
- `POST /api/v1/clientes/{id}/paquetes` para asignacion manual

Estado frontend:

- membresia activa ya se usa en `ClientPanel` y `clientAdapter`
- admin detalle cliente ya puede reflejar membresia real
- no debe confundirse con catalogo de paquetes

## C. Sale/payment / venta o pago

Representa transaccion economica.

No es el paquete ni la membresia.

Campos esperados:

- monto
- metodo
- fecha de compra
- cliente
- paquete vendido
- referencia / checkout / external reference
- origen: Mercado Pago, POS, efectivo, tarjeta

Uso frontend actual:

- historial de ventas de paquetes
- reportes
- finanzas
- retorno de Mercado Pago
- POS futuro

Fuentes backend / reales o probables:

- `POST /api/v1/pagos/checkout-preference`
- `GET /api/v1/pagos/estado?external_reference=...`
- `GET /api/v1/clientes/me/pagos`
- futuro POS: `POST /api/v1/ventas` o equivalente

Estado frontend:

- `Paquetes & Pagos` ya usa historial real de pagos del cliente.
- `PaquetesSection.jsx` usa `transaccionesStore` como historial visual legacy.
- ese historial no representa necesariamente ventas de paquetes reales backend.

## Clasificacion de campos actuales de Admin > Paquetes

| UI | Concepto | Backend probable | Estado |
|---|---|---|---|
| Nombre del paquete | package.name | `name` | existe |
| Tipo | derivacion visual / legacy | no claro | ambiguo |
| Numero de clases | package.credits | `credits` | existe |
| Precio | package.price_mxn | `price_mxn` | existe |
| Vigencia | package.duration_days | `duration_days` | existe |
| Mas popular | package.is_featured | `is_featured` | existe |
| Descripcion / beneficios | package.benefits / description | `benefits` existe, `description` revisar | parcial |

## Revision de `Tipo`

El formulario actual muestra `tipo` con valores legacy como:

- mensual
- pack

Observacion:

- backend real de catalogo no muestra un `type` can贸nico en lo ya validado.
- frontend hoy usa `categoria` / `tipo` para render y etiquetas.

Conclusi贸n:

- `type` no parece contrato backend estable para catalogo.
- en API mode debe tratarse como campo derivado o visual, no como verdad de negocio.
- si backend no lo persiste, conviene eliminarlo del form API mode o dejarlo solo como helper visual.

## Revision de ilimitado

Frontend actual soporta visualmente:

- `Premium`
- `Clases ilimitadas`
- `clases === 0` como proxy de ilimitado

Riesgo de negocio:

- `credits` numerico no distingue bien ilimitado vs cero real.

Opciones de contrato:

- `is_unlimited: true`
- `credits: null`
- convenci贸n `credits = 999`

Hallazgo:

- frontend hoy usa `0` como ilimitado en varios puntos.
- eso es util visual, pero es ambiguo para backend de catalogo.

Conclusi贸n:

- ilimitado no queda cerrado con contrato actual documentado.
- backend o contrato de paquete debe definir semantica explicita antes de integracion completa.

## Historial de ventas de paquetes

Bloque actual en `PaquetesSection.jsx`:

- `Historial de ventas de paquetes`
- columnas: Usuario, Paquete, Fecha compra, Vencimiento, Clases restantes, Monto, M茅todo

Hallazgo:

- esto no debe salir del CRUD de paquetes.
- hoy se alimenta desde `transaccionesStore`, que es historial legacy local.

Fuente correcta probable:

- POS sales
- Mercado Pago payments
- admin package assignments
- credit movements
- memberships

Endpoint futuro probable:

- `GET /api/v1/admin/package-sales`
- o `GET /api/v1/admin/transacciones?type=package`
- o reporte agregado en finanzas

Conclusi贸n:

- no mezclar con `GET /api/v1/memberships/packages`.
- el historial de ventas requiere contrato aparte.

## Uso de `POST /api/v1/memberships`

Busqueda frontend:

- no aparece uso directo relevante en el arbol actual para Admin > Paquetes.

Interpretacion:

- si existe, es mas cercano a alta/asignacion de membresia que a CRUD de catalogo.
- no debe usarse como fuente principal de `PaquetesSection` en API mode.

## Endpoints correctos por flujo

### Admin > Paquetes CRUD

- `GET /api/v1/memberships/packages?page=&page_size=&status=&search=`
- `POST /api/v1/memberships/packages`
- `PUT /api/v1/memberships/packages/{id}`
- `PATCH /api/v1/memberships/packages/{id}/status`
- `PATCH /api/v1/memberships/packages/{id}/featured`
- `DELETE /api/v1/memberships/packages/{id}`

### Landing / pricing

- `GET /api/v1/memberships/packages`

### Admin > Usuarios > cambiar paquete

- `POST /api/v1/clientes/{id}/paquetes`

### Cliente compra online

- `POST /api/v1/pagos/checkout-preference`

### POS

- pendiente futuro, probablemente `POST /api/v1/ventas`

## `membershipPackagesApiService` en frontend

Uso actual:

- `PricingSection.jsx`
- `ClientPanel.jsx`
- `AdminPanel.jsx` para selector de paquetes de cliente

Conclusi贸n:

- service actual debe seguir siendo catalogo de paquetes.
- no debe mutar en membresia ni en ventas.

## Gap contra backend

| Necesidad UI | Endpoint backend actual | Estado | Accion |
|---|---|---|---|
| CRUD catalogo paquetes | `/memberships/packages` | listo/parcial | integrar |
| Tipo de paquete | no claro | faltante/parcial | definir |
| Ilimitado | no claro | faltante | decidir negocio |
| Historial ventas paquetes | no claro | faltante | endpoint futuro |
| Asignar paquete a cliente | `/clientes/{id}/paquetes` | listo | ya integrado |
| Compra online | `/pagos/checkout-preference` | listo | no tocar |
| POS venta paquete | `/ventas` | pendiente | fase POS |

## Recomendacion

Antes de integrar `Admin > Paquetes` API-first completo, conviene cerrar dos decisiones:

1. Semantica de `type` y `ilimitado`.
2. Contrato separado para historial de ventas de paquetes.

Si esas dos piezas quedan definidas, el CRUD de catalogo puede entrar sin mezclar membresias ni ventas.

## Update 2026-06-08 - Business model

- Admin > Paquetes now maps to backend catalog `GET /api/v1/memberships/packages`.
- `type` is visual-only; not canonical backend field.
- No unlimited package: `credits` must stay finite and > 0.
- `benefits` persists as string list.
- Historial de ventas stays out of CRUD UI in API mode.

## Paquetes compartibles

Modelo frontend:
- paquete de cat醠ogo vendible
- `display_name` como fallback visual
- `credits` finito y > 0
- `benefits` lista de strings
- `is_shareable`
- `max_beneficiaries`

Buyer dashboard:
- `GET /api/v1/clientes/me/memberships`
- alta inicial de beneficiarios por email
- luego solo lectura

Admin detalle cliente:
- `shared_memberships`
- add/remove beneficiario con endpoints admin
- replacement = DELETE + POST

No usar:
- `type` persistente
- ilimitado
- `credits=0`

## MVP server state

Frontend MVP uses TanStack Query for server state. Zustand queda para fallback legacy y UI local. Lecturas con `useQuery`, mutaciones con `useMutation`, refetch con invalidate tras 茅xito. No usar `page_size=1000`.
