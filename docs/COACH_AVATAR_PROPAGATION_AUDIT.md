# Coach Avatar Propagation Audit

Fecha: 2026-06-09
Repo: D:\Casa_Scarlatta_FrontEnd
Branch: actual
Responsable: Frontend / Codex

## Resumen ejecutivo

- `GET /api/v1/coaches/public` sí trae `avatar_url` relativo, por ejemplo `/media/coaches/coach_1_....png`.
- `GET /api/v1/clases` sí trae `coach_id` y `coach_name`, pero no `avatar_url`.
- `GET /api/v1/clases/{id}/ocurrencias?from=&to=` también trae `coach_id` y `coach_name`, pero no `avatar_url`.
- Frontend debe enriquecer por `coach_id` usando `coaches/public`, no por nombre.
- Si alguna vista no tiene `coach_id`, ahí sí hay gap backend.

## Network validado

| Endpoint | Trae coach_id | Trae coach_name | Trae avatar_url | Trae avatarUrl | URL relativa /media | URL absoluta | Nota |
|---|---|---|---|---|---|---|---|
| `GET /api/v1/coaches/public` | Sí | Sí (`name`) | Sí | No | Sí | No | Fuente pública de avatar |
| `GET /api/v1/clases` | Sí | Sí | No | No | No | No | Enriquecer por `coach_id` |
| `GET /api/v1/clases/{id}/ocurrencias?from=&to=` | Sí | Sí | No | No | No | No | También trae `coach_id` en ocurrencias |

## Fuente correcta por vista

- Vista pública / reservar clase: `GET /api/v1/coaches/public` + match por `coach_id`.
- Admin: `GET /api/v1/coaches` + match por `coach_id`.
- Coach dashboard: `GET /api/v1/coaches/public` + match por `coach_id`, `userId` o email si backend lo expone.
- Cliente / Mis clases: `GET /api/v1/coaches/public` + match por `coach_id`.
- Navbar: si rol coach, misma fuente pública.

## Corrección frontend aplicada

- `CoachAvatar` ya resuelve rutas relativas de media contra `VITE_API_BASE_URL`.
- `Clases.jsx` usa `CoachAvatar` y enriquece por `coach_id`.
- `ClientPanel.jsx` usa mapa de coaches públicos por `coach_id`.
- `CoachPanel.jsx` usa coaches públicos para foto de topbar.
- `Navbar.jsx` usa coaches públicos para foto de usuario coach.
- `EquipmentReservationPanel.jsx` y `EquipmentSeatSelectorView.jsx` reciben `coachAvatarUrl`.
- `SeatSelector.jsx` fallback también respeta `coachAvatarUrl`.

## Gap backend solo si falta `coach_id`

- Si alguna respuesta de agenda, reservas o roster no trae `coach_id`, frontend no puede enriquecer de forma segura.
- En ese caso backend debe incluir `coach_id` o `coach_avatar_url` en ese payload.

## Pendiente

- Verificar en Network `GET /api/v1/coaches/me/agenda`, `GET /api/v1/reservas/me` y `GET /api/v1/reservas/ocurrencias/{occurrence_id}/alumnos` con sesión válida para confirmar si ya traen `coach_id` o ya llega avatar directo.
- Si ya traen `coach_id`, solo falta mapear/enriquecer en cada adapter.


