# Admin Frontend Endpoint Contract Gap

Fecha: 2026-06-07  
Scope: diagnóstico frontend-first. No implementación. No backend changes.

## Objetivo

Convertir gap funcional del panel admin en contrato esperado por frontend, para comparar endpoint por endpoint contra backend real y cerrar integración por fases.

## Resumen ejecutivo

Estado actual del admin:

- **API parcial**: `Clases`.
- **Mixto**: `Clases` por `clasesStore` + `clasesApiService`.
- **Mock/local dominante**: `Dashboard admin`, `Coaches`, `Usuarios/clientes`, `Paquetes/membresías`, `POS/productos/ventas`, `Transacciones/pagos`, `Gastos`, `Cortes`, `Reportes`, `Configuración`.

`AdminDashboard.jsx` sigue siendo legacy/dead code y no debería tomarse como base de integración.

## Mapa rápido por módulo

| Módulo | Fuente actual | Estado | Prioridad | Frontend puede avanzar ya | Backend requerido primero |
|---|---|---:|---:|---:|---:|
| Dashboard admin | mock/local | faltante | P1 | no | sí |
| Clases | API-first | listo | **P0** | sí | no |
| Coaches | mock/local | faltante | **P0** | no | sí |
| Usuarios/clientes | mock/local | faltante | **P0** | no | sí |
| Paquetes/membresías | mock/local | faltante | **P0** | no | sí |
| POS/productos/ventas | mock/local | faltante | **P1** | no | sí |
| Transacciones/pagos | mock/local | faltante | P1 | no | sí |
| Gastos | mock/local | faltante | P2 | no | sí |
| Cortes | mock/local | faltante | P2 | no | sí |
| Reportes | mock/local | faltante | P2 | no | sí |
| Configuración | mock/local | faltante | P2 | no | sí |

## 1) Clases

### Operaciones UI detectadas

1. Listar clases
2. Buscar/filtrar clases
3. Crear clase
4. Editar clase
5. Eliminar/desactivar clase
6. Ver ocurrencias
7. Crear ocurrencia si UI lo permite
8. Editar/reasignar ocurrencia si UI lo espera
9. Ver disponibilidad/cupos

### Estado frontend actual

- Componente principal: `src/pages/admin/sections/ClasesSection.jsx`
- Contenedor: `src/pages/admin/AdminPanel.jsx`
- Store: `src/stores/clasesStore.js`
- Service: `src/services/clasesApiService.js`, `src/services/reservasService.js`
- Fuente actual: **mixta**
- UI ya puede consumir API real para lectura/lista y create/update.

### Contrato esperado

#### Clases - Listar

UI:
- Admin > Clases > listado

Endpoint esperado:
- `GET /api/v1/clases`

Request esperado:
- `page`, `page_size`, `search`, `discipline`, `status`, `coach_id` si aplica

Response esperado:
```json
{
  "items": [
    {
      "id": 1,
      "name": "Clase Demo",
      "discipline": "slow",
      "coach_id": 10,
      "coach_name": "Coach Demo",
      "capacity_max": 10,
      "duration_minutes": 50,
      "status": "activa"
    }
  ],
  "page": 1,
  "page_size": 12,
  "total": 1
}
```

Campos mínimos:
- `id`
- `name`
- `discipline`
- `coach_id`
- `coach_name`
- `status`
- `capacity_max`

Estado actual:
- listo para Admin > Clases en API mode
- crear/editar bloquean `fecha específica` y `programar publicación` hasta que exista contrato de ocurrencias/publicación

Prioridad:
- **P0**

Frontend puede avanzar ya:
- sí, para lectura/edición base

Backend requerido primero:
- no para lectura base; sí para cerrar delete, ocurrencias y consistencia total

#### Clases - Crear

UI:
- Admin > Clases > Crear clase

Endpoint esperado:
- `POST /api/v1/clases`

Request esperado:
```json
{
  "name": "Clase Demo",
  "discipline": "slow",
  "coach_id": 1,
  "capacity_max": 10,
  "duration_minutes": 50,
  "status": "activa"
}
```

Response esperado:
```json
{
  "id": 1,
  "name": "Clase Demo",
  "discipline": "slow",
  "coach_id": 1,
  "coach_name": "Coach Demo",
  "status": "activa"
}
```

Campos mínimos:
- `name`
- `discipline`
- `coach_id`
- `capacity_max`
- `duration_minutes`
- `status`

Estado actual:
- parcial

Prioridad:
- **P0**

Frontend puede avanzar ya:
- sí

Backend requerido primero:
- no

#### Clases - Editar

UI:
- Admin > Clases > editar

Endpoint esperado:
- `PUT /api/v1/clases/{id}`

Request esperado:
- mismo shape que create, con campos parciales o completos según backend

Response esperado:
- clase actualizada

Campos mínimos:
- `id`
- `name`
- `discipline`
- `coach_id`
- `status`

Estado actual:
- parcial

Prioridad:
- **P0**

Frontend puede avanzar ya:
- sí

Backend requerido primero:
- no

#### Clases - Eliminar / desactivar

UI:
- Admin > Clases > borrar o desactivar

Endpoint esperado:
- `DELETE /api/v1/clases/{id}` o `PATCH /api/v1/clases/{id}` con `status`

Request esperado:
- `id`

Response esperado:
- soft delete o confirmación de desactivación

Campos mínimos:
- `id`
- `status`

Estado actual:
- parcial / dependiente de helper local

Prioridad:
- **P0**

Frontend puede avanzar ya:
- no completamente

Backend requerido primero:
- sí, si se quiere delete real

#### Clases - Ocurrencias / disponibilidad

UI:
- Admin > detalle clase / agenda / cupos

Endpoint esperado:
- `GET /api/v1/clases/{id}/ocurrencias?from=&to=`
- `GET /api/v1/clases/{id}/disponibilidad`

Request esperado:
- `from`, `to`

Response esperado:
```json
{
  "items": [
    {
      "occurrence_id": 1,
      "class_id": 1,
      "start_at": "2026-06-07T09:00:00",
      "end_at": "2026-06-07T09:50:00",
      "capacity_used": 2,
      "capacity_max": 10
    }
  ]
}
```

Campos mínimos:
- `occurrence_id`
- `start_at`
- `end_at`
- `capacity_used`
- `capacity_max`

Estado actual:
- parcial

Prioridad:
- **P0**

Frontend puede avanzar ya:
- sí, si backend expone ocurrencias

Backend requerido primero:
- sí, para cerrar calendario/admin

## 2) Coaches

### Operaciones UI detectadas

1. Listar coaches
2. Crear coach
3. Editar coach
4. Activar/desactivar coach
5. Eliminar coach
6. Seleccionar coach en clase
7. Ver agenda/reporte si aplica

### Estado frontend actual

- Componente principal: `src/pages/admin/sections/CoachesSection.jsx`
- Contenedor: `src/pages/admin/AdminPanel.jsx`
- Store: `src/stores/coachesStore.js`
- Service: `src/services/coachesService.js`, `src/services/coachesApiService.js`
- Fuente actual: **mock/local**

### Contrato esperado

#### Coaches - Listar

Endpoint esperado:
- `GET /api/v1/coaches`

Request esperado:
- `page`, `page_size`, `search`, `status`

Response esperado:
```json
{
  "items": [
    {
      "coach_id": 1,
      "user_id": 10,
      "name": "Coach Demo",
      "email": "coach@demo.local",
      "phone": "5551234567",
      "status": "active",
      "specialties": ["slow", "stryde"],
      "avatar_url": null
    }
  ]
}
```

Campos mínimos:
- `coach_id`
- `name`
- `email`
- `status`

Estado actual:
- faltante

Prioridad:
- **P0**

Frontend puede avanzar ya:
- no

Backend requerido primero:
- sí

#### Coaches - Crear / Editar / Activar / Eliminar

Endpoint esperado:
- `POST /api/v1/coaches`
- `PUT /api/v1/coaches/{id}`
- `PATCH /api/v1/coaches/{id}/status`
- `DELETE /api/v1/coaches/{id}` o equivalente soft delete

Request esperado:
```json
{
  "name": "Coach Demo",
  "email": "coach@demo.local",
  "phone": "5551234567",
  "status": "active",
  "specialties": ["slow", "stryde"]
}
```

Response esperado:
- coach creado/actualizado con `coach_id`

Estado actual:
- faltante

Prioridad:
- **P0**

Frontend puede avanzar ya:
- no

Backend requerido primero:
- sí

## 3) Usuarios / clientes

### Operaciones UI detectadas

1. Listar clientes
2. Buscar/filtrar
3. Crear cliente
4. Editar cliente
5. Desactivar/eliminar
6. Ver detalle
7. Ver reservas
8. Ver membresía/créditos
9. Asignar paquete manual
10. Ajustar créditos si UI lo permite

### Estado frontend actual

- Componente principal: `src/pages/admin/sections/UsuariosSection.jsx`
- Contenedor: `src/pages/admin/AdminPanel.jsx`
- Store: `src/stores/usuariosStore.js`, `src/stores/paquetesStore.js`
- Service: `src/services/usuariosService.js`
- Fuente actual: **mock/local**

### Contrato esperado

#### Clientes - Listar

Endpoint esperado:
- `GET /api/v1/clientes`

Request esperado:
- `page`, `page_size`, `search`, `status`, `membership_status`

Response esperado:
```json
{
  "items": [
    {
      "id": 1,
      "name": "Cliente Demo",
      "email": "cliente@demo.local",
      "phone": "5551234567",
      "role": "cliente",
      "status": "active",
      "credits_balance": 12,
      "active_membership": "Mensual 12",
      "last_visit": "2026-06-07",
      "reservations_count": 8
    }
  ]
}
```

Estado actual:
- faltante

Prioridad:
- **P0**

Frontend puede avanzar ya:
- no

Backend requerido primero:
- sí

#### Clientes - Crear / Editar / Desactivar / Detalle

Endpoint esperado:
- `POST /api/v1/clientes`
- `PUT/PATCH /api/v1/clientes/{id}`
- `DELETE /api/v1/clientes/{id}`
- `GET /api/v1/clientes/{id}`

Request esperado:
```json
{
  "name": "Cliente Demo",
  "email": "cliente@demo.local",
  "phone": "5551234567",
  "status": "active"
}
```

Campos mínimos:
- `id`
- `name`
- `email`
- `phone`
- `status`
- `role`

Estado actual:
- faltante

Prioridad:
- **P0**

Frontend puede avanzar ya:
- no

Backend requerido primero:
- sí

#### Clientes - Asignar paquete / ajustar créditos

Endpoint esperado:
- `POST /api/v1/clientes/{id}/paquetes`
- `POST /api/v1/clientes/{id}/credits` o equivalente administrativo

Request esperado:
```json
{
  "package_id": 1,
  "notes": "Ajuste manual"
}
```

Estado actual:
- faltante

Prioridad:
- **P0**

Frontend puede avanzar ya:
- no

Backend requerido primero:
- sí

## 4) Paquetes / membresías

### Operaciones UI detectadas

1. Listar paquetes admin
2. Crear paquete
3. Editar paquete
4. Activar/desactivar
5. Destacar paquete
6. Asignar paquete a cliente
7. Editar precio/créditos/duración

### Estado frontend actual

- Componente principal: `src/pages/admin/sections/PaquetesSection.jsx`
- Contenedor: `src/pages/admin/AdminPanel.jsx`
- Store: `src/stores/paquetesStore.js`, `src/stores/transaccionesStore.js`
- Service: no hay servicio admin backend real
- Fuente actual: **mock/local**

### Contrato esperado

#### Paquetes - Listar

Endpoint esperado:
- `GET /api/v1/memberships/packages`

Request esperado:
- `page`, `page_size`, `status`, `search`

Response esperado:
```json
{
  "items": [
    {
      "id": 1,
      "name": "Mensual 12",
      "credits": 12,
      "price_mxn": 2100,
      "duration_days": 30,
      "is_active": true,
      "is_featured": false,
      "benefits": ["Acceso a clases"]
    }
  ]
}
```

Estado actual:
- faltante para admin

Prioridad:
- **P0**

Frontend puede avanzar ya:
- no para admin CRUD

Backend requerido primero:
- sí

#### Paquetes - Crear / Editar / Activar / Destacar

Endpoint esperado:
- `POST /api/v1/memberships/packages`
- `PUT/PATCH /api/v1/memberships/packages/{id}`
- `PATCH /api/v1/memberships/packages/{id}/status`
- `PATCH /api/v1/memberships/packages/{id}/featured`

Request esperado:
```json
{
  "name": "Mensual 12",
  "credits": 12,
  "price_mxn": 2100,
  "duration_days": 30,
  "is_active": true,
  "is_featured": false
}
```

Estado actual:
- faltante

Prioridad:
- **P0**

Frontend puede avanzar ya:
- no

Backend requerido primero:
- sí

#### Paquetes - Asignar a cliente

Endpoint esperado:
- `POST /api/v1/clientes/{id}/paquetes`

Estado actual:
- faltante

Prioridad:
- **P0**

Frontend puede avanzar ya:
- no

Backend requerido primero:
- sí

## 5) POS / productos / ventas

### Operaciones UI detectadas

1. Listar productos
2. Crear/editar/eliminar productos
3. Carrito
4. Cobrar venta
5. Vender producto
6. Vender paquete
7. Asociar venta a cliente
8. Registrar método de pago
9. Actualizar stock
10. Crear transacción

### Estado frontend actual

- Componente principal: `src/pages/admin/sections/PuntoDeVentaSection.jsx`
- Contenedor: `src/pages/admin/AdminPanel.jsx`
- Store: `src/stores/productosStore.js`, `src/stores/paquetesStore.js`, `src/stores/transaccionesStore.js`, `src/stores/usuariosStore.js`
- Service: `src/services/ventaService.js`
- Fuente actual: **mock/local**

### Contrato esperado

#### POS - Listar productos

Endpoint esperado:
- `GET /api/v1/productos`

Request esperado:
- `page`, `page_size`, `search`, `category`, `status`

Response esperado:
```json
{
  "items": [
    {
      "id": 1,
      "name": "Towel",
      "category": "merch",
      "price": 120,
      "stock": 20,
      "is_active": true
    }
  ]
}
```

Estado actual:
- faltante

Prioridad:
- **P1**

Frontend puede avanzar ya:
- no

Backend requerido primero:
- sí

#### POS - Cobrar venta / crear transacción

Endpoint esperado:
- `POST /api/v1/ventas`

Request esperado:
```json
{
  "customer_id": 1,
  "items": [
    { "type": "product", "id": 1, "quantity": 2, "price": 120 },
    { "type": "package", "id": 3, "quantity": 1, "price": 2100 }
  ],
  "payment_method": "cash",
  "total": 2340,
  "notes": "Venta caja"
}
```

Response esperado:
```json
{
  "id": 100,
  "status": "paid",
  "total": 2340,
  "payment_method": "cash"
}
```

Estado actual:
- faltante

Prioridad:
- **P1**

Frontend puede avanzar ya:
- no

Backend requerido primero:
- sí

## 6) Transacciones / pagos

### Operaciones UI detectadas

1. Listar transacciones
2. Filtrar por fecha/método/status
3. Ver pagos
4. Ver cortes/resumen
5. Exportar

### Estado frontend actual

- Componente principal: `src/pages/admin/sections/ActividadSection.jsx`, `src/pages/admin/AdminFinanzas.jsx`, `src/pages/admin/AdminReportes.jsx`
- Store: `src/stores/transaccionesStore.js`, `src/stores/cortesStore.js`
- Service: `src/services/finanzasService.js`, `src/services/dashboardService.js`
- Fuente actual: **mock/local**

### Contrato esperado

#### Transacciones - Listar

Endpoint esperado:
- `GET /api/v1/admin/transacciones`

Request esperado:
- `page`, `page_size`, `from`, `to`, `status`, `payment_method`

Response esperado:
```json
{
  "items": [
    {
      "id": 1,
      "type": "sale",
      "amount": 2300,
      "payment_method": "cash",
      "status": "paid",
      "created_at": "2026-06-07T10:00:00"
    }
  ]
}
```

Estado actual:
- faltante

Prioridad:
- **P1**

Frontend puede avanzar ya:
- no

Backend requerido primero:
- sí

## 7) Gastos

### Operaciones UI detectadas

1. Crear gasto
2. Editar gasto
3. Eliminar gasto
4. Listar gastos
5. Filtrar por fecha/categoría

### Estado frontend actual

- Componente principal: `src/pages/admin/AdminFinanzas.jsx`
- Store: `src/stores/gastosStore.js`
- Service: `src/services/finanzasService.js`
- Fuente actual: **mock/local**

### Contrato esperado

- `GET /api/v1/gastos`
- `POST /api/v1/gastos`
- `PUT/PATCH /api/v1/gastos/{id}`
- `DELETE /api/v1/gastos/{id}`

Payload mínimo:
```json
{
  "description": "Renta",
  "amount": 5000,
  "category": "fixed",
  "date": "2026-06-07"
}
```

Prioridad:
- **P2**

## 8) Cortes

### Operaciones UI detectadas

1. Abrir corte
2. Cerrar corte
3. Listar historial
4. Resumen por método de pago

### Estado frontend actual

- Componente principal: `src/pages/admin/AdminFinanzas.jsx`
- Store: `src/stores/cortesStore.js`
- Service: `src/services/finanzasService.js`
- Fuente actual: **mock/local**

### Contrato esperado

- `GET /api/v1/cortes`
- `POST /api/v1/cortes`

Payload mínimo:
```json
{
  "opened_at": "2026-06-07T09:00:00",
  "closed_at": null,
  "starting_cash": 1000
}
```

Prioridad:
- **P2**

## 9) Reportes

### Operaciones UI detectadas

1. Ventas por rango
2. Ingresos
3. Clases
4. Coaches
5. Paquetes
6. Exportación

### Estado frontend actual

- Componente principal: `src/pages/admin/AdminReportes.jsx`
- Store: `src/stores/clasesStore.js`, `src/stores/coachesStore.js`, `src/stores/transaccionesStore.js`, `src/stores/tabuladorStore.js`, `src/stores/paquetesStore.js`, `src/stores/usuariosStore.js`
- Service: `src/services/finanzasService.js`
- Fuente actual: **mock/local**

### Contrato esperado

- `GET /api/v1/admin/reportes/ventas`
- `GET /api/v1/admin/reportes/ingresos`
- `GET /api/v1/admin/reportes/clases`
- `GET /api/v1/admin/reportes/coaches`
- `GET /api/v1/admin/reportes/paquetes`
- `GET /api/v1/admin/reportes/export`

Request esperado:
- `from`, `to`, `format`

Prioridad:
- **P2**

## 10) Dashboard admin

### Operaciones UI detectadas

1. Métricas del mes
2. Últimas clases
3. Últimas transacciones
4. Ingresos
5. Resumen de ocupación

### Estado frontend actual

- Componente principal: `src/pages/admin/AdminDashboard.jsx`, `src/pages/admin/sections/DashboardSection.jsx`
- Store: `src/stores/clasesStore.js`, `src/stores/transaccionesStore.js`, `src/stores/usuariosStore.js`, `src/stores/reservasStore.js`, `src/stores/paquetesStore.js`
- Service: `src/services/dashboardService.js`
- Fuente actual: **mock/local**

### Contrato esperado

- `GET /api/v1/admin/dashboard`
- o endpoints agregados por widget

Response esperado:
```json
{
  "revenue_month": 120000,
  "active_clients": 340,
  "classes_today": 12,
  "occupancy_rate": 0.78
}
```

Prioridad:
- **P1**

## 11) Configuración

### Operaciones UI detectadas

1. Obtener configuración
2. Guardar configuración
3. Editar branding
4. Editar textos
5. Editar imágenes/videos
6. Subir media si UI lo permite

### Estado frontend actual

- Componente principal: `src/pages/admin/sections/ConfiguracionSection.jsx`
- Store: `src/stores/configuracionStore.js`
- Service: ninguno backend real
- Fuente actual: **mock/local**

### Contrato esperado

- `GET /api/v1/configuracion`
- `PUT/PATCH /api/v1/configuracion`
- upload media si aplica

Prioridad:
- **P2**

## Clases: estado especial

Frontend hoy ya tiene:

- lectura API parcial por `clasesApiService`
- create/update parcialmente API
- delete/desactivar todavía híbrido
- listado/ocurrencias/disponibilidad ya tienen shape cercano a backend

Campo crítico esperado por UI:

- `id`
- `name`
- `discipline`
- `coach_id`
- `coach_name`
- `capacity_max`
- `duration_minutes`
- `status`

## Coaches: estado especial

Frontend hoy todavía usa:

- IDs mock tipo `coach-*`
- store local persistido
- CRUD local

Backend mínimo requerido:

- CRUD coaches completo
- agenda si admin la necesita

## POS: estado especial

Frontend hoy sigue completamente local:

- productos hardcoded / store
- carrito local
- cobro local
- transacciones mock

Backend mínimo requerido:

- catálogo productos
- venta/cobro
- respuesta de transacción

## Usuarios/clientes: estado especial

Frontend hoy sigue local:

- clientes mock
- edición local
- asignación de paquete local
- créditos local

Backend mínimo requerido:

- CRUD clientes
- paquete a cliente
- balance/créditos reales

## Conclusión operativa

### Lo que frontend puede avanzar ya

- **Clases**: lectura/listado/create/update si backend ya responde el shape esperado.

### Lo que requiere backend primero

- Coaches
- Usuarios/clientes
- Paquetes admin
- POS
- Transacciones/pagos
- Gastos
- Cortes
- Reportes
- Configuración

## Siguiente paso backend recomendado

Tomar este documento y producir:

- `BACKEND_ADMIN_API_RECONCILIATION.md`

Objetivo backend:

- comparar endpoint por endpoint contra rutas reales existentes
- marcar `exists / partial / missing`
- definir payload real final
- devolver orden de implementación backend

## Conteo de operación documentadas

- Módulos: 11
- Operaciones UI documentadas: 56
- Módulos P0: 4
- Módulos que frontend puede avanzar ya: 1
- Módulos que requieren backend primero: 10
