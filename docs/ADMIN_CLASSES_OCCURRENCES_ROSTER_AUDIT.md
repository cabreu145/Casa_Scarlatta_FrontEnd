# Admin Classes / Occurrences Roster Audit

Fecha: 2026-06-09  
Repo: Casa_Scarlatta_FrontEnd  
Estado: API mode integrado

## Resumen ejecutivo

- Admin > Clases y CoachPanel consumen roster real por occurrence.
- Endpoint privado usado: `GET /api/v1/reservas/ocurrencias/{occurrence_id}/alumnos`.
- Admin manual enrollment y seat flow invalidan roster al guardar.
- Hardcoded students fuera de API mode.
- No hay placeholder honesto cuando endpoint responde bien.

## Endpoint conectado

```http
GET /api/v1/reservas/ocurrencias/{occurrence_id}/alumnos
GET /api/v1/reservas/ocurrencias/{occurrence_id}/alumnos?includeCanceled=true
```

Permisos:
- `admin`: ve cualquier occurrence.
- `coach`: solo occurrences asignadas.
- `cliente`: 403.
- sin JWT: 401.

## Response usado por frontend

```json
{
  "occurrence_id": 10,
  "class_id": 3,
  "class_name": "Clase Demo STRYDE Semana QA",
  "discipline": "stryde",
  "date": "2026-06-09",
  "start_time": "07:00",
  "end_time": "07:50",
  "coach_id": 1,
  "coach_name": "Coach Demo",
  "capacity_max": 15,
  "capacity_current": 2,
  "students": [
    {
      "reservation_id": 100,
      "user_id": 5,
      "name": "Cliente Demo",
      "email": "cliente@demo.local",
      "phone": "9810000000",
      "status": "confirmada",
      "checked_in_at": null,
      "spot_id": 12,
      "spot_label": "01",
      "equipment_type": "bench",
      "created_at": "2026-06-09T10:00:00-06:00"
    }
  ]
}
```

## Mapeo frontend

- `occurrence_id -> occurrenceId`
- `class_id -> classId`
- `class_name -> className`
- `start_time -> startTime`
- `end_time -> endTime`
- `coach_id -> coachId`
- `coach_name -> coachName`
- `capacity_max -> capacityMax`
- `capacity_current -> capacityCurrent`
- `reservation_id -> reservationId`
- `user_id -> userId`
- `checked_in_at -> checkedInAt`
- `spot_id -> spotId`
- `spot_label -> spotLabel`
- `equipment_type -> equipmentType`
- `created_at -> createdAt`

## UI actual

- Admin modal lista alumnos reales por occurrence.
- Coach modal lista alumnos reales por occurrence.
- Empty state solo aparece si roster viene vacío.
- Error 401/403/404 se muestra como error controlado, no como "no hay alumnos".
- Inscripción manual refetcha roster después de éxito.

