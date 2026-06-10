# Admin Activity Audit

Fecha: 2026-06-09
Repo: D:\Casa_Scarlatta_FrontEnd
Branch: local
Responsable: Frontend

## Resumen ejecutivo

- Seccion revisada: `Admin > Actividad`
- Estado actual: legacy/mock
- Backend real detectado: ninguno en repo para `GET /api/v1/audit`
- Riesgo: medio, porque UI muestra historial como si fuera source of truth en fallback
- Recomendacion: bloquear vista en API mode hasta existir contrato backend real

## Hallazgos

### UI actual

- `src/pages/admin/sections/ActividadSection.jsx`
- Usa `useActividadStore`
- Filtra eventos locales por tipo, fecha y usuario
- Lista categorias:
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

### Lógica legacy

- Fuente: store local
- Orden: filtro -> slice page size -> render
- Estado vacio: muestra "No hay eventos registrados aun"
- Limpieza: borra historial local
- No hay paginacion real de backend
- No hay permisos reales de admin/coach/cliente

### Backend

- No se encontro endpoint real de audit en repo
- No se encontro contrato confiable para eventos de sistema
- No se debe inventar data en API mode

## Gap backend sugerido

```http
GET /api/v1/actividad?page=&page_size=&category=&from=&to=&actor_id=
```

### Response sugerido

```json
{
  "page": 1,
  "page_size": 20,
  "total": 0,
  "items": [
    {
      "id": 1,
      "category": "reservas",
      "action": "reserva_creada",
      "description": "Cliente Demo reservo Clase Demo",
      "actor_name": "Admin Demo",
      "actor_id": 1,
      "created_at": "2026-06-09T10:00:00-06:00",
      "meta": {}
    }
  ]
}
```

## Estado actual recomendado

- API mode: mostrar placeholder honesto
- Fallback legacy: mantener store local
- No mostrar mock como verdad

## Pendientes

- Contrato backend de audit
- Filtros reales por actor, categoria, rango
- Invalidacion TanStack al mutar eventos si backend llega
