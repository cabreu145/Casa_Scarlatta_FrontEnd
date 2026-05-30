# FRONTEND_BACKEND_INTEGRATION_PLAN.md

## Objetivo
Preparar integración del frontend (`D:\Casa_Scarlatta_FrontEnd`) con backend real (`D:\Casa_Scarlatta_Backend`) para los módulos:
- Auth
- Clases
- Reservas
- Waitlist

Sin cambios de código en esta fase. Solo plan y mapeo de contrato.

## Estado Actual Del Frontend
### Arquitectura funcional actual
- Estado global con Zustand persistido en localStorage (`auth`, `clases`, `reservas`, `lista-espera`, etc.).
- Lógica de negocio crítica en frontend, especialmente en `frontend/src/services/reservasService.js`.
- Cliente HTTP preparado pero inactivo (`frontend/src/lib/http.js` retorna `null`).
- Endpoints declarados en `frontend/src/constants/api.js`, pero con prefijo `/api` (sin `/v1`).

### Punto clave
Hoy el frontend es "frontend-first":
- Reserva/cancelación/promoción waitlist y ajuste de créditos sucede en cliente.
- Con backend real, esa lógica debe migrar al servidor y frontend quedarse como orquestador de UI + consumo API.

## Estado Backend Relevante (referencia documental)
Según `README.md` y docs backend:
- Fase 2 cerrada (clases/reservas/waitlist/consistencia base).
- Tests: 34 passed.
- Alembic head: `8f3a2a1b9c4d`.
- Endpoints backend activos están bajo prefijo `/api/v1/*`.

Memoria consultada por título exacto:
- `Casa Scarlatta - Backend Fase 2 Closed` (ID 16)

## Servicios Frontend Que Dependen De Mocks/LocalStorage
### Auth
- `frontend/src/context/AuthContext.jsx`
  - `login`: busca en `mockUsers` + `usuariosStore`.
  - `register`: crea usuario en store local.
  - `resetPassword`: cambia password en store local.

### Clases
- `frontend/src/stores/clasesStore.js`: fuente de verdad local `CLASES_MOCK`.
- `frontend/src/hooks/useClasses.js`: solo lectura local.
- `frontend/src/pages/Clases.jsx` y `frontend/src/pages/admin/sections/ClasesSection.jsx` dependen de store local.

### Reservas
- `frontend/src/services/reservasService.js`: aplica reglas de negocio completas en frontend.
- `frontend/src/stores/reservasStore.js`: persist local de reservas.

### Waitlist
- `frontend/src/stores/listaEsperaStore.js`: alta/baja/FIFO local.

### Perfil/usuarios impactados por reservas
- `frontend/src/services/usuariosService.js`: actualiza crédito y perfil en local.

## Endpoints Backend Disponibles (Auth + Clases + Reservas + Waitlist)
> Fuente: `D:\Casa_Scarlatta_Backend\README.md` + docs de fase.

### Auth
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/registro`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/reset-password/request`
- `POST /api/v1/auth/reset-password/confirm`

### Clases
- `GET /api/v1/clases`
- `GET /api/v1/clases/{id}`
- `GET /api/v1/clases/{id}/disponibilidad`
- `POST /api/v1/clases` (admin)
- `PUT /api/v1/clases/{id}` (admin)
- `DELETE /api/v1/clases/{id}` (admin)

### Reservas
- `GET /api/v1/reservas`
- `GET /api/v1/reservas/me`
- `GET /api/v1/reservas/{id}`
- `POST /api/v1/reservas`
- `PATCH /api/v1/reservas/{id}/cancel`
- `POST /api/v1/reservas/{id}/cancelar` (alias)
- `PATCH /api/v1/reservas/{id}/no-asistio`
- `POST /api/v1/reservas/{id}/no-asistio` (alias)
- `PATCH /api/v1/reservas/{id}/completar`
- `POST /api/v1/reservas/{id}/completar` (alias)

### Waitlist
- `GET /api/v1/lista-espera?occurrenceId=...`
- `POST /api/v1/lista-espera`
- `DELETE /api/v1/lista-espera/{id}`

## Mapa Frontend ? Backend (alto nivel)
### Auth
- `AuthContext.login` ? `POST /api/v1/auth/login`
- `AuthContext.register` ? `POST /api/v1/auth/registro`
- `AuthContext.resetPassword` ? `POST /api/v1/auth/reset-password/request` y `confirm`
- `ProtectedRoute` y bootstrap de sesión ? `GET /api/v1/auth/me`

### Clases lectura
- `useClasesStore` + `useClasses` + `Clases.jsx` ? `GET /api/v1/clases`
- disponibilidad en UI ? `GET /api/v1/clases/{id}/disponibilidad` (opcional incremental)

### Reservas
- `reservasService.reservarClase` ? `POST /api/v1/reservas`
- `reservasService.cancelarReserva` ? `POST /api/v1/reservas/{id}/cancelar` (o PATCH `/cancel`)
- `reservasService.marcarNoAsistio` ? `POST/PATCH /api/v1/reservas/{id}/no-asistio`
- historial propio cliente ? `GET /api/v1/reservas/me`

### Waitlist
- `listaEsperaStore.unirse` ? `POST /api/v1/lista-espera`
- `listaEsperaStore.getPorOccurrence ? GET /api/v1/lista-espera?occurrenceId=...`
- `listaEsperaStore.salir` ? `DELETE /api/v1/lista-espera/{id}`

## Diferencias De Naming / Campos Esperadas
## 1) Prefijo de ruta
- Frontend actual: `/api/...`
- Backend real: `/api/v1/...`
- Acción recomendada mínima: resolver desde `BASE_URL` + `API_PREFIX` o actualizar `ENDPOINTS` con `/v1`.

## 2) Nombres de campos
Patrón esperado:
- Frontend usa mayormente camelCase/español mixto:
  - `cupoMax`, `cupoActual`, `claseDia`, `claseHora`, `clasesPaquete`
- Backend usa típicamente snake_case:
  - `capacity_max`, `capacity_current`, `start_time`, etc.

Se requiere capa de adaptación DTO:
- `classApiToUi()`
- `reservationApiToUi()`
- `reservationUiToApi()`
- `waitlistApiToUi()`

## 3) IDs
- Frontend: `number` generado por `Date.now()` en mocks.
- Backend: probable `uuid` o enteros DB.
- Recomendación: normalizar frontend para aceptar `string | number` durante transición.

## 4) Reglas de negocio
- Frontend hoy aplica reglas localmente.
- Backend Fase 2 ya aplica reglas en servidor (cupo/crédito/duplicado/FIFO).
- Cambio esperado: frontend deja de mutar crédito/cupo manualmente tras respuesta de API.

## Estrategia De Feature Flag Por Módulo
Implementar flags en frontend (sin activar aún):
- `VITE_USE_API_AUTH=false`
- `VITE_USE_API_CLASSES=false`
- `VITE_USE_API_RESERVATIONS=false`
- `VITE_USE_API_WAITLIST=false`

Regla de uso:
- Si flag módulo = `true`: usar API real.
- Si flag módulo = `false`: mantener flujo actual (stores/mocks).
- Permite rollout gradual y rollback inmediato por módulo.

## Plan De Migración Por Fases
## Fase 1: Auth
Objetivo:
- Migrar login/registro/sesión a backend.

Cambios mínimos recomendados:
- Activar `http.js`.
- Ajustar `ENDPOINTS` a `/api/v1` para auth.
- En `AuthContext`:
  - `login` usando `httpPost`.
  - guardar `access_token` en localStorage.
  - bootstrap con `GET /auth/me`.

Validación:
- login/logout/refresh UI.
- rutas protegidas por rol funcionando.

## Fase 2: Clases (solo lectura)
Objetivo:
- Reemplazar `CLASES_MOCK` en vistas públicas/cliente/admin lectura.

Cambios mínimos:
- `useClasses` y fuentes de `Clases.jsx`/`ClientPanel` con `GET /api/v1/clases` bajo flag.
- mantener store local como fallback.

Validación:
- listado semanal, filtros `Stryde X/Slow`, estado de cupo.

## Fase 3: Reservas
Objetivo:
- Crear/cancelar/no-asistio vía backend.

Cambios mínimos:
- `reservasService` pasa de "write local" a llamadas API.
- posterior sincronización de stores con respuesta backend.
- eliminar mutaciones manuales de `cupoActual` y `clasesPaquete` en cliente cuando la API responda éxito.

Validación:
- reservar con/sin crédito.
- clase llena.
- duplicado.
- cancelar dentro/fuera ventana.

## Fase 4: Waitlist
Objetivo:
- Alta/baja/consulta de lista por API.

Cambios mínimos:
- `listaEsperaStore` adaptado a wrapper API (manteniendo interfaz pública actual).
- usar ID real de entry para DELETE.

Validación:
- unirse/retirarse.
- visualización de posición.
- promoción automática backend tras cancelación.

## Fase 5: Limpieza gradual de mocks
Objetivo:
- Reducir dependencias de `mockUsers`, `mockData`, stores persistidos como fuente de verdad.

Cambios mínimos:
- mantener mocks sólo para modo demo/dev flag-off.
- documentar “source of truth = backend” por módulo.

## Riesgos Principales
1. Divergencia de contrato (`/api` vs `/api/v1`, snake_case/camelCase).
2. Doble escritura (store local + backend) generando inconsistencias.
3. IDs mock numéricos vs IDs backend reales.
4. Dependencia actual de `reservasService` con reglas locales; requiere refactor controlado.
5. UX de latencia/errores: hoy se asume respuesta inmediata local.

## Tests / Manual QA Necesarios
### Auth
- login correcto/incorrecto.
- sesión persistida y `me` correcto.
- acceso por rol (cliente/coach/admin).

### Clases
- carga de clases por día.
- filtro por disciplina.
- consistencia de disponibilidad.

### Reservas
- reservar éxito.
- reservar sin crédito.
- reservar clase llena.
- reserva duplicada.
- cancelar y validar devolución de crédito.
- no-asistio y completar.

### Waitlist
- unirse duplicado bloqueado.
- límite por clase.
- salida de lista.
- promoción FIFO tras cancelación.

### Regresión UI
- SeatSelector.
- Clases pública.
- ClientPanel “Mis clases” y “Reservar”.
- Admin sección clases/reservas.

## Cambios Mínimos Recomendados (sin implementar aún)
1. Definir contrato DTO frontend?backend en un módulo `adapters/`.
2. Activar `http.js` con interceptor básico de token + manejo de errores.
3. Introducir feature flags por módulo.
4. Ajustar `constants/api.js` con prefijo versionado backend.
5. Migrar primero Auth, luego lectura clases, luego reservas, luego waitlist.

## Recomendación De Primer Módulo A Integrar
Auth.
Razón:
- bajo acoplamiento con reglas de negocio de cupo/crédito.
- habilita seguridad real para módulos posteriores.
- reduce riesgo de migrar reservas sin contexto de identidad backend.

## Actualización Implementada: Auth API (2026-05-28)

### Feature flag activo
- `VITE_USE_API_AUTH=true`: Auth contra backend real.
- `VITE_USE_API_AUTH=false`: flujo actual mock/localStorage.

### Variables de entorno
- `VITE_API_BASE_URL=http://localhost:8000`
- `VITE_API_PREFIX=/api/v1`
- `VITE_USE_API_AUTH=false` (default)

Archivo: `frontend/.env.example`.

### Endpoints conectados en Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/registro`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/reset-password/request`
- `POST /api/v1/auth/reset-password/confirm`

### Archivos implementados
- `frontend/src/lib/http.js`: cliente fetch real, auth bearer, parse de error `{ error: { code, message, details } }`.
- `frontend/src/constants/api.js`: base URL y prefijo versionado por env.
- `frontend/src/adapters/authAdapter.js`: mapeo backend user/token a shape frontend.
- `frontend/src/context/AuthContext.jsx`: doble modo API/mock sin romper stores.
- `frontend/src/stores/authStore.js`: sesión/token persistidos para UI.
- `frontend/src/pages/RecuperarContrasena.jsx`: request reset real cuando API flag on.
- `frontend/src/pages/NuevaContrasena.jsx`: confirm reset con token.

### Comportamiento de fallback
- Si API Auth desactivada: comportamiento anterior intacto.
- No se integraron aún clases/reservas/waitlist.


## Update 2026-05-28: Registro extendido habilitado

Se revierte fix temporal de registro mínimo. Auth API mantiene envío de perfil extendido desde formulario (teléfono, fecha de nacimiento, género) usando mapper de adapter.

Alcance:
- Solo Auth.
- Sin cambios en clases/reservas/waitlist.

Detalle técnico:
- Mapper filtra campos vacíos para no enviar `undefined/null`.
- Valores de género de UI se normalizan al enum backend permitido.

## Cierre Formal Auth API (2026-05-28)

Estado: cerrado y validado manualmente end-to-end.

Validaciones manuales completadas:
- Login API real funcional.
- Registro API real funcional con payload extendido.
- Sesión y bootstrap con `GET /api/v1/auth/me` funcional.
- Logout funcional.

Feature flag aplicado:
- `VITE_USE_API_AUTH=true` para backend real.
- `VITE_USE_API_AUTH=false` mantiene fallback mock/localStorage.

Payload final de registro validado:
```json
{
  "email": "...",
  "name": "...",
  "password": "...",
  "phone": "...",
  "birth_date": "...",
  "gender": "..."
}
```

Siguiente módulo recomendado:
- Clases lectura con `VITE_USE_API_CLASSES`.

## Update 2026-05-28: Clases lectura API integrada

Feature flag:
- `VITE_USE_API_CLASSES=true`: lectura de clases desde backend real.
- `VITE_USE_API_CLASSES=false`: fallback a mocks/store local.

Endpoints de lectura usados:
- `GET /api/v1/clases`
- `GET /api/v1/clases/{id}`
- `GET /api/v1/clases/{id}/disponibilidad`

Implementación:
- `frontend/src/adapters/classAdapter.js`: mapeo backend -> shape UI (`cupoMax`, `cupoActual`, `duracion`, `hora`, `coachNombre`, etc.).
- `frontend/src/services/clasesApiService.js`: cliente de lectura clases via `http.js`.
- `frontend/src/stores/clasesStore.js`: `loadClasesFromApi()` para cachear clases API en store y fallback local.
- `frontend/src/pages/Clases.jsx` y `frontend/src/pages/cliente/ClientPanel.jsx`: carga condicional por flag.
- `frontend/src/hooks/useClasses.js`: soporte de carga API para vistas admin de lectura.

Regla de consistencia:
- Con `VITE_USE_API_CLASSES=true`, no se muta cupo local como fuente de verdad (`actualizarCupo` no-op en store).

Limitación temporal conocida:
- El contrato backend actual de clases no expone `dia/fecha`; frontend las trata como visibles por día para no romper UI en lectura.

## Validación real Auth + Clases lectura (2026-05-28)

Estado validado contra backend real:
- Auth API activa y funcional con `VITE_USE_API_AUTH=true`.
- Clases lectura API activa y funcional con `VITE_USE_API_CLASSES=true`.
- `GET /api/v1/clases` responde datos reales (287 clases seed en entorno validado).

Compatibilidad de contrato:
- Backend de clases entrega `coach_id` y no entrega `coach_name`.
- Frontend mantiene fallback en adapter: `coachNombre = coach_name ?? coachNombre ?? "Coach #<id>"`.
- Resultado: render estable sin ruptura por ausencia de `coach_name`.

Fallback preservado:
- `VITE_USE_API_AUTH=false` -> mocks/localStorage para auth.
- `VITE_USE_API_CLASSES=false` -> mocks/store local para clases.

Próximo módulo recomendado:
- Reservas API.

## Update 2026-05-28: Reservas API integrada (sin waitlist)

Feature flag:
- `VITE_USE_API_RESERVATIONS=true`: reservas vía backend real.
- `VITE_USE_API_RESERVATIONS=false`: fallback mocks/localStorage.

Endpoints usados en frontend:
- `GET /api/v1/reservas/me`
- `GET /api/v1/reservas/{id}`
- `POST /api/v1/reservas`
- `POST /api/v1/reservas/{id}/cancelar`
- `POST /api/v1/reservas/{id}/no-asistio`
- `POST /api/v1/reservas/{id}/completar`

Implementación:
- `frontend/src/adapters/reservationAdapter.js`: mapeo backend -> shape UI de reservas.
- `frontend/src/services/reservasApiService.js`: cliente HTTP de reservas API.
- `frontend/src/services/reservasService.js`: switch por flag para crear/cancelar/no-asistio/completar y refetch de reservas/clases.
- `frontend/src/stores/reservasStore.js`: `setReservas` + `loadMisReservasFromApi` para cache UI.
- `frontend/src/pages/cliente/ClientPanel.jsx`: carga de `mis reservas` por API cuando flag activo.

Regla de consistencia:
- Con `VITE_USE_API_RESERVATIONS=true`, backend es source of truth para estado de reserva/cupos/créditos.
- Frontend evita lógica local de doble escritura y solo refresca cache/UI.

Fuera de alcance actual:
- Waitlist API sigue pendiente.

## Update 2026-05-29: Waitlist API integrada con fallback

Estado:
- Integración de waitlist implementada bajo flag.
- No se eliminó flujo mock/localStorage.

Flag:
- `VITE_USE_API_WAITLIST=true`: usa backend real para lista de espera.
- `VITE_USE_API_WAITLIST=false`: mantiene flujo local/mock.

Endpoints conectados:
- `GET /api/v1/lista-espera?occurrenceId=...`
- `POST /api/v1/lista-espera`
- `DELETE /api/v1/lista-espera/{id}`

Cambios funcionales clave:
- `listaEsperaStore` en modo API opera por `syncOccurrenceApi`, `unirse` y `salir` con `occurrenceId`.
- Si UI solo tiene `claseId/userId`, store resuelve `entryId` activo antes de `DELETE`.
- Con Reservas API + Waitlist API activas, frontend no hace promoción FIFO local al cancelar; backend es source of truth.
- Tras cancelación en modo API, frontend refresca reservas/clases y sincroniza waitlist de la clase (si disponible en cache).

Estado de source of truth:
- Auth API: backend.
- Clases lectura API: backend.
- Reservas API: backend.
- Waitlist API: backend (incluye FIFO/promoción).

## QA E2E Auth + Clases + Reservas + Waitlist (2026-05-29)

Flags usados en `frontend/.env`:
- `VITE_API_BASE_URL=http://127.0.0.1:8000`
- `VITE_API_PREFIX=/api/v1`
- `VITE_USE_API_AUTH=true`
- `VITE_USE_API_CLASSES=true`
- `VITE_USE_API_RESERVATIONS=true`
- `VITE_USE_API_WAITLIST=true`

Usuario demo:
- `cliente@casascarlatta.local / cliente123`

Flujos probados:
- Login API real + bootstrap sesión (`/auth/me`).
- Carga de clases reales.
- Crear reserva en clase reservable demo.
- Cancelar reserva y verificar refresco de reservas/clases.
- Unirse y salir de waitlist vía backend.

Endpoints validados:
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/clases`
- `POST /api/v1/reservas`
- `GET /api/v1/reservas/me`
- `POST /api/v1/reservas/{id}/cancelar`
- `GET /api/v1/lista-espera?occurrenceId=...`
- `POST /api/v1/lista-espera`
- `DELETE /api/v1/lista-espera/{id}`

Hallazgos:
- `GET /lista-espera` devuelve entradas con estado `cancelado`; frontend no rompe porque `getPorClase` filtra `estado === esperando`.
- En modo API waitlist activo, frontend no ejecuta promoción FIFO local después de cancelación de reserva.

Pendientes:
- QA visual asistido por navegador (DevTools/Network en UI) para evidencia de trazas desde interacción real de pantallas.



