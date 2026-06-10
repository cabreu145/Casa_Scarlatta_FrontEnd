# Admin Activity Audit

Fecha: 2026-06-09
Repo: D:\Casa_Scarlatta_FrontEnd
Branch: local
Responsable: Frontend

## Resumen ejecutivo

- Seccion revisada: `Admin > Actividad`
- Estado actual: API-first en modo API, legacy demo solo con flags apagadas
- Fuente real: `GET /api/v1/actividad`
- Fuente legacy básica: `GET /api/v1/audit`
- Riesgo residual: bajo, pendiente solo invalidaciones futuras cuando mutaciones toquen actividad

## Hallazgos

### UI actual

- `src/pages/admin/sections/ActividadSection.jsx`
- En API mode consume TanStack Query con filtros y paginacion
- En fallback legacy conserva store local
- Categorias UI:
  - reservas
  - cancelaciones
  - usuarios
  - paquetes
  - ventas POS
  - cortes
  - clases
  - coaches
  - sesiones cliente
  - lista espera

### Fuente real

- Endpoint validado:
  - `GET /api/v1/actividad?page=&page_size=&category=&from=&to=&actor_id=&entity_type=&entity_id=`
- Respuesta paginada con `items`, `total`, `page`, `page_size`
- Campos utiles:
  - `category`
  - `action`
  - `title`
  - `description`
  - `actor_name`
  - `actor_role`
  - `entity_type`
  - `entity_id`
  - `metadata`
  - `created_at`

### Estado recomendado

- API mode: lista real, error controlado, empty real
- Fallback legacy: store demo solo si flags API apagadas
- No usar `GET /api/v1/audit` como fuente principal

## Contrato usado por frontend

```http
GET /api/v1/actividad?page=&page_size=&category=&from=&to=&actor_id=&entity_type=&entity_id=
```

### Mapeo UI

- `Todos` -> sin `category`
- `Reservas` -> `reservas`
- `Cancelaciones` -> `cancelaciones`
- `Usuarios` -> `usuarios`
- `Paquetes` -> `paquetes`
- `Ventas POS` -> `ventas_pos`
- `Cortes` -> `cortes`
- `Clases` -> `clases`
- `Coaches` -> `coaches`
- `Sesiones cliente` -> `sesiones_cliente`
- `Lista espera` -> `lista_espera`

## Nota

- `GET /api/v1/audit` queda legacy compatible y basico.
- `actividadStore` queda solo fallback demo cuando API mode esta apagado.
- Backend ya valido en local con `total=36` eventos en respuesta real.
