# FRONTEND_E2E_QA_RUN_TEMPLATE.md

## 1) Información general de ejecución
- Fecha de ejecución:
- Ambiente: (Local / QA / Staging)
- Frontend URL:
- Backend URL: `http://127.0.0.1:8000`
- API Prefix: `/api/v1`
- Branch frontend:
- Commit frontend:
- Backend versión/commit (si aplica):
- Responsable QA:
- Participantes:
- Resultado general: (Pass / Fail / Blocked)

## 2) Flags usados
- `VITE_API_BASE_URL=`
- `VITE_API_PREFIX=`
- `VITE_USE_API_AUTH=`
- `VITE_USE_API_CLASSES=`
- `VITE_USE_API_RESERVATIONS=`
- `VITE_USE_API_WAITLIST=`

## 3) URLs usadas
- App frontend:
- API backend:
- Endpoint health (si aplica):
- Otros:

## 4) Credenciales demo
- Cliente: `cliente@casascarlatta.local / cliente999`
- Admin: `admin@casascarlatta.local / admin123`
- Coach: `coach@casascarlatta.local / coach123`
- Nota: validar contra seed backend actual si hubo reset reciente.
## 5) Navegador y dispositivo
- Navegador principal (nombre/versión):
- Navegadores secundarios:
- Sistema operativo:
- Dispositivo:
- Resolución:
- Modo responsive probado: (Sí/No)

## 6) Matriz de ejecución por flujo
| Rol | Escenario | Pasos | Resultado esperado | Resultado obtenido | Status (Pass/Fail/Blocked) | Evidencia (screenshot/network) | Notas |
|---|---|---|---|---|---|---|---|
| Cliente | Login | 1) Abrir login 2) Ingresar credenciales 3) Entrar al panel | Sesión iniciada y `auth/me` exitoso | | | | |
| Cliente | Ver clases reales | 1) Ir a clases 2) Validar lista | Render sin errores y datos backend | | | | |
| Cliente | Reservar clase | 1) Seleccionar clase reservable 2) Confirmar reserva | `POST /reservas` ok y reflejo en panel | | | | |
| Cliente | Ver mis clases | 1) Abrir panel cliente 2) Revisar reservas | Reserva visible en estado correcto | | | | |
| Cliente | Cancelar reserva | 1) Cancelar reserva activa | `POST /reservas/{id}/cancelar` ok + refetch | | | | |
| Cliente | Unirse waitlist | 1) Clase llena 2) Unirse | `POST /lista-espera` ok y estado visible | | | | |
| Cliente | Salir waitlist | 1) Salir de waitlist | `DELETE /lista-espera/{id}` ok | | | | |
| Cliente | Promoción waitlist al cancelar | 1) Cancelar reserva con waitlist activa | Backend maneja FIFO; frontend no promueve local | | | | |
| Cliente | Waitlist default activa | 1) Consultar waitlist clase | Solo `esperando/notificado` por default | | | | |
| Admin | Login admin | 1) Login con admin | Acceso panel admin sin romper | | | | |
| Admin | Ver clases | 1) Abrir sección clases | Datos backend renderizados | | | | |
| Admin | Revisar reservas (si UI soporta) | 1) Abrir sección relacionada | Vista estable / sin crash | | | | |
| Admin | Revisar waitlist (si UI soporta) | 1) Abrir sección relacionada | Vista estable / sin crash | | | | |
| Admin | Mutaciones no integradas | 1) Navegar acciones admin | No ejecutar mutaciones fuera de alcance | | | | |
| Coach | Login coach | 1) Login coach | Acceso panel coach sin romper | | | | |
| Coach | Clases asignadas (si UI soporta) | 1) Abrir clases | Vista estable | | | | |
| Coach | Fallback coach_name | 1) Revisar tarjetas/listas | No rompe por falta de `coach_name` | | | | |
| Coach | Reservas/lista clase (si UI soporta) | 1) Abrir vistas | Carga estable | | | | |

## 7) Network esperado (checklist)
- [ ] `POST /api/v1/auth/login`
- [ ] `GET /api/v1/auth/me`
- [ ] `GET /api/v1/clases`
- [ ] `POST /api/v1/reservas`
- [ ] `GET /api/v1/reservas/me`
- [ ] `POST /api/v1/reservas/{id}/cancelar`
- [ ] `GET /api/v1/lista-espera?occurrenceId=...`
- [ ] `POST /api/v1/lista-espera`
- [ ] `DELETE /api/v1/lista-espera/{id}`

## 8) Contrato waitlist validado
- Default (`GET /lista-espera?occurrenceId=...`): devuelve solo activos `esperando` y `notificado`.
- Historial: usar `includeCanceled=true`.
- Filtro por estado: `status=esperando|notificado|cancelado|asignado|expirado`.
- Confirmación QA: frontend opera con default activo (sin historial por defecto).

## 9) Errores de consola
| Timestamp | Pantalla | Error | Severidad | Impacto | Estado |
|---|---|---|---|---|---|
| | | | | | |

## 10) Bugs encontrados
| ID | Rol | Escenario | Descripción | Severidad | Reproducible | Evidencia | Estado |
|---|---|---|---|---|---|---|---|
| BUG-001 |cliente |reservar clase desde el dashboard |importante |al momneto de entrar al dashboard "/cliente/dashboarden la sesccion de reservar clase " y darle click a resercar clase, no se muestran las clases listadas en "http://localhost:5173/clases" es decir en este apartado "http://localhost:5173/clases" se listan todas las clases de los tipos de categoria, y ahi si podriamos reservar...  |na | sin corregir| |

| BUG-002 |cliente |reservar clase desde el dashboard |importante |al momneto de entrar al dashboard "/cliente/dashboard en la seccion de mis clases" se muestran todas las clases lo cual esta bien, pero no tenemos un filtro para poder seleccionar si es clases completada, no asistida, cancelada etc   |na | sin corregir| |

| BUG-003 |cliente |reservar clase desde el dashboard cuando se arregle, pero se presenta en la resercacion de "/clases" |importante |al momneto de reservar una clase nueva para el dab 30 de mayo del 2026, la misma reserva se observa en los dias consiguientes del 29, 30 y sale condifmrada, se puede cancelar. Esto no deberia ser asi ....  |na | sin corregir| |

| BUG-004 |cliente |clases disponibles (creditos) |importante |al momneto de de comprar un nuevo paquete se añaden los creditos, pero  no se estan descontando del todo bien al reservar las clases, aunado a esto al refrescar la pagina se borran los creditos... |na | sin corregir| |

| BUG-005 |cliente |Mis proximas clases  |importante | en el dashboard, no se estan visualisando todas las clases reservadas, estan estaticas 2, aunado a este me gusaria que al corregir este bug, se tome en cuenta las mejores practicas de ui uix design para mostrar mis proximas clases sin romper el diseño y no mostrar en un listado indeterminable  |na | sin corregir| |

| BUG-006 |cliente, administrador, coach |Listados de datos   |importante | Se tiene que corregir todos los listados, para tener un paginado y no mostrar un listado infinito, se tienen que manejar paginados para todas las secciones donde las tengamos   |na | sin corregir| |

| BUG-007 |cliente |Dashboard mi perfil   |importante | No se estan mostrando los datos de informacion personal, aparecen sin informacion, hasta que se le da clik dentro del formulario, si se actualiza la data   |na | sin corregir| |

| BUG-008 |cliente |Dashboard Paeutes & Pagos   |importante | aqui igual se muestran 0 clases restantes y se tendria que validar que se esten restando al momento de reservar, si se estan mostrando las ultimas trasnacciones en el historial de pago, pero creo es importante validar con el bug 006, el listado de estos para que sea con un paginado con la ui uix pertinente... | sin corregir| |

| BUG-009 |cliente |Dashboard Paeutes & Pagos contratacion desde la web app   |importante | Actualmente, no se tiene un metodo de pago vinculado o pasarela, la que estariamos usando es la de Mercado Pago , ya se tienen los accesos para esto de prod y sandbox (pruebas) es de vital importancia corregir esto antes de pasar a otro modulo. | sin corregir| |

| BUG-010 |coach |Dashboard "Todas mis clases esta semana"   |importante | No se estan mostrando las clases que tienen asignadas los coach en la semana del filtro "Todas mis clases esta semana
Semana del"  el listado es "Día	Hora	Clase	Tipo	Alumnos	Ocupación" | sin corregir| |

| BUG-011 |coach |Dashboard "esta semana"   |importante | Tiene data que debe estar hardcodeado, es decir no es dinamico ya que si en el bug 010 no se tiene calses asignadas como tiene esas metricas ?  | sin corregir| |

| BUG-012 |coach |Dashboard "Clases de hoy"   |importante | no se estan mostran las clases que tiene asginada el coach al dia del calendario es decir al dia actual....  | sin corregir| |

| BUG-013 |Admin |/admin/dashboard "clases" |importante | se asignan las clases al coach el coach no la spuede ver como explayamos en el bug -010, 011, 012. aunado a esto las clases que se asignan se estan repitiendo por dias y seria bueno validar a nivel backend esto tambien, ya que esto lo explayamos en el bug 003| sin corregir| |



## 11) Pendientes
- Pendiente 1:
- Pendiente 2:
- Pendiente 3:

Sugeridos:
- POS/finanzas (fuera de alcance actual).
- Notificaciones/email reales.
- Evidencia visual completa por flujo.
- Cierre QA multi-rol formal con acta.
- Confirmar endpoints adicionales requeridos por panel admin/coach.

## 12) Decisión Go/No-Go
- Decisión: (GO / NO-GO / GO con riesgos)
- Justificación:
- Riesgos abiertos:
- Mitigaciones:
- Aprobadores:

## 13) Anexos
- Enlace a capturas:
- Enlace a export de Network HAR:
- Enlace a tickets/incidencias:
- Referencias:
  - `docs/FRONTEND_E2E_QA_CHECKLIST.md`
  - `docs/FRONTEND_BACKEND_INTEGRATION_PLAN.md`
  - `docs/API_CONTRACT_MAPPING_FRONTEND.md`

## 14) Avance de estabilización (core)
Registrar cierre incremental de bugs sin perder trazabilidad:

| Bug | Estado | Fecha | Archivos modificados | Source of truth validado | QA recomendado | Pendientes relacionados |
|---|---|---|---|---|---|---|
| BUG-001 | Corregido | 2026-05-29 | `ClientPanel.jsx`, `clasesStore.js` | Clases API (`/api/v1/clases`) | Validar que `/clases` y dashboard muestran misma clase demo | BUG-003, BUG-005 |
| BUG-003 | Mitigado | 2026-05-29 | `reservationAdapter.js`, `Clases.jsx`, `ClientPanel.jsx`, `SeatSelector.jsx` | Reservas API (`/api/v1/reservas/me`) sin usar `reserved_at` como fecha de sesión | Validar que reserva no se marca en días incorrectos cuando falta ocurrencia | Cierre definitivo depende de ocurrencias backend |

## 15) QA específico BUG-003
Checklist de cierre parcial:
- [ ] Reservar clase desde `/clases`.
- [ ] Confirmar que `reserved_at` no se muestra/usa como fecha de sesión.
- [ ] Confirmar que la reserva no aparece confirmada/cancelable en días incorrectos.
- [ ] Confirmar que si `class_date` y `class_start_at` vienen `null`, la UI queda neutral por día (sin afirmar reserva diaria).
- [ ] Confirmar que `SeatSelector` no bloquea asientos por `class_id` plano sin ocurrencia.
- [ ] Confirmar que con flags API activos no se mezclan mocks en estas vistas.

Evidencia sugerida:
- Captura Network de `GET /api/v1/reservas/me` mostrando `class_date/class_start_at`.
- Capturas de `/clases`, `ClientPanel` (Mis clases/Próximas), y `SeatSelector` en mismo caso de prueba.

## QA específico BUG-003 (occurrences model)
- [ ] Crear reserva desde `/clases` enviando `occurrence_id`.
- [ ] Verificar en Network `POST /api/v1/reservas` con `occurrence_id` no nulo.
- [ ] Confirmar que reserva aparece solo en fecha/hora de su ocurrencia real.
- [ ] Confirmar que `reserved_at` se usa solo como fecha creación, no como fecha sesión.
- [ ] Confirmar join waitlist con `occurrence_id` y consulta `GET /lista-espera?occurrenceId=...`.
- [ ] Confirmar que no se mezcla source mock con flags API activos.

## Verificación de performance (request storm)
- [ ] Cambiar rápidamente semana/día en `/clases` y `/cliente/dashboard`.
- [ ] Confirmar en Network que no hay ráfaga repetida para misma llave `classId+from+to`.
- [ ] Confirmar que al navegar fuera de pantalla se abortan requests pendientes (sin error UI).
- [ ] Confirmar que no se dispara precarga masiva de `waitlist?occurrenceId=...` al montar dashboard.

## QA extra: validación de endpoint waitlist
- [ ] Reservar y cancelar una ocurrencia real.
- [ ] Confirmar que no existe request `GET /api/v1/lista-espera?occurrenceId=...`.
- [ ] Confirmar que waitlist API, si se consulta, usa solo `GET /api/v1/lista-espera?occurrenceId=...`.


## QA espec�fico BUG-004 (estado financiero API)
- [ ] Login cliente y validar `GET /api/v1/clientes/me/estado-financiero`.
- [ ] Confirmar cr�ditos/membres�a desde endpoint financiero, no desde `/auth/me`.
- [ ] Reservar clase y validar refetch de estado financiero.
- [ ] Cancelar reserva y validar refetch de estado financiero.
- [ ] Validar estado vac�o controlado cuando `transactions=[]`.
- [ ] Validar que PagoModal en modo API muestra �Compra en l�nea a�n no disponible en modo API�.

## Resultado recomendado de ejecuci�n manual BUG-004 Core
Marcar al ejecutar QA en navegador:
- [ ] Login cliente demo con flags API activos.
- [ ] `GET /api/v1/clientes/me/estado-financiero` visible en Network.
- [ ] Cr�ditos dashboard reflejan `credits_balance`.
- [ ] Tras reservar: `POST /api/v1/reservas` + refetch financiero y cr�ditos bajan.
- [ ] Tras cancelar: `POST /api/v1/reservas/{id}/cancelar` + refetch financiero y cr�ditos suben.
- [ ] Refresh mantiene cr�ditos/membres�a desde backend.
- [ ] Logout/login mantiene cr�ditos/membres�a desde backend.
- [ ] `transactions=[]` muestra estado vac�o controlado.
- [ ] `PagoModal` en API mode muestra �Compra en l�nea a�n no disponible en modo API�.
- [ ] No usar `/auth/me` para balance ni stores mock como source of truth en API mode.


## QA espec�fico BUG-010 (tabla semanal coach)
- [ ] Login con coach demo.
- [ ] Validar `GET /api/v1/coaches/me/agenda?from=...&to=...` en Network.
- [ ] Validar que �Todas mis clases esta semana� renderiza desde `agenda.occurrences`.
- [ ] Validar estados de loading, error controlado y empty state.
- [ ] Confirmar que en API mode no usa datos mock/local como fuente principal.

## QA espec�fico BUG-011 (m�tricas coach)
- [ ] Login coach con flags API activos.
- [ ] Validar `GET /api/v1/coaches/me/agenda?from=...&to=...` en Network.
- [ ] Validar que m�tricas �Esta semana� derivan de `agenda.occurrences`.
- [ ] Con `occurrences=[]`, validar m�tricas en 0 real (sin n�meros hardcodeados).
- [ ] Validar estados controlados de loading/error de m�tricas.
- [ ] Confirmar que en API mode no usa fuentes mock/local para m�tricas.

## QA espec�fico BUG-012 (clases de hoy coach)
- [ ] Login coach con flags API activos.
- [ ] Validar `GET /api/v1/coaches/me/agenda?from=...&to=...` en Network.
- [ ] Confirmar que �Clases de hoy� se llena por `occurrenceDate` del d�a actual.
- [ ] Confirmar orden por hora (`startTime/startAt`).
- [ ] Validar estado loading: �Cargando clases de hoy...�.
- [ ] Validar empty state real: �No tienes clases asignadas hoy.�.
- [ ] Confirmar que en API mode no usa `dia` base, `coachNombre` ni fuentes mock/local como verdad.

## QA espec�fico BUG-002 (filtro Mis Clases)
- [ ] Login cliente con flags API activos.
- [ ] Validar `GET /api/v1/reservas/me` en Network.
- [ ] Probar filtros: Todas, Confirmadas, Canceladas, Completadas, No asisti�.
- [ ] Validar que cada filtro muestra solo estados correspondientes.
- [ ] Validar empty state por filtro: �No tienes clases en este estado.�.
- [ ] Confirmar que con flags API false el filtro funciona sobre fallback local/mock.

## QA espec�fico BUG-005 (pr�ximas clases cliente)
- [ ] Login cliente con flags API activos.
- [ ] Validar `GET /api/v1/reservas/me` en Network.
- [ ] Confirmar que �Mis pr�ximas clases� muestra confirmadas de hoy/futuras ordenadas por ocurrencia.
- [ ] Confirmar que no usa `reserved_at` como fecha de sesi�n.
- [ ] Confirmar l�mite visual (m�x. 4) y texto �Mostrando 4 de N...� cuando aplique.
- [ ] Confirmar CTA �Ver todas� navega a �Mis clases� con filtro `confirmada`.
- [ ] Confirmar empty state: �No tienes pr�ximas clases reservadas.�.

## QA espec�fico BUG-006A/B (paginaci�n visual frontend)
- [ ] Cliente > Paquetes & Pagos: validar paginaci�n de movimientos/transacciones (Anterior/Siguiente).
- [ ] Admin > Clases (vista lista): validar paginaci�n visual y navegaci�n por p�ginas.
- [ ] Admin > Ver usuario > Historial reservas: validar paginaci�n en modal.
- [ ] Cambiar filtro/vista y confirmar reset de p�gina cuando aplica.
- [ ] Confirmar que no cambian endpoints ni source of truth en API mode.

## QA espec�fico BUG-006C (paginaci�n backend)
- [ ] Admin > Clases (vista lista, filtro `Todas`): validar request `GET /api/v1/clases?page=...&page_size=...`.
- [ ] Cliente > Paquetes & Pagos: validar request `GET /api/v1/clientes/me/credit-movements?page=...&page_size=...` al navegar p�ginas.
- [ ] Validar fallback de compatibilidad cuando backend responda array legacy (sin romper UI).
- [ ] Validar que `GET /api/v1/clientes/me/estado-financiero` sigue como resumen y no como historial paginado.

## QA espec�fico BUG-006C cierre (Mis clases cliente)
- [ ] En Cliente > Mis clases, validar request `GET /api/v1/reservas/me?page=...&page_size=10&from=...&to=...`.
- [ ] Cambiar filtro a `confirmada/cancelada/completada/no_asistio` y validar `status` en query.
- [ ] Cambiar semana y validar reset a p�gina 1 + nuevo `from/to`.
- [ ] Cancelar una reserva y validar refetch de p�gina actual.
- [ ] Confirmar que �Mis pr�ximas clases� sigue estable y no depende de este paginado semanal.

## QA final pre-BUG-009
Checklist de salida de estabilizaci�n core:
- [ ] Login cliente/admin/coach.
- [ ] Cliente reserva/cancela.
- [ ] Cliente Mis clases con filtro y paginaci�n backend.
- [ ] Cliente pr�ximas clases con CTA.
- [ ] Cliente Paquetes & Pagos con estado financiero y movimientos paginados.
- [ ] Admin Clases crear/editar con `coach_id`.
- [ ] Admin Clases vista lista paginada.
- [ ] Coach agenda semanal.
- [ ] Coach m�tricas.
- [ ] Coach clases de hoy.
- [ ] Waitlist por `occurrenceId`.
- [ ] Sin errores de consola bloqueantes.
- [ ] Sin requests legacy `lista-espera?claseId`.
- [ ] Sin mocks como source of truth con flags API activos.

## 16) Ejecuci�n QA final pre-BUG-009 (2026-05-30)
- Fecha: `2026-05-30`
- Ambiente: local dev (`frontend` + `backend`)
- URLs:
  - Frontend: `http://127.0.0.1:5173`
  - Backend: `http://127.0.0.1:8000`
- Flags activos:
  - `VITE_API_BASE_URL=http://127.0.0.1:8000`
  - `VITE_API_PREFIX=/api/v1`
  - `VITE_USE_API_AUTH=true`
  - `VITE_USE_API_CLASSES=true`
  - `VITE_USE_API_RESERVATIONS=true`
  - `VITE_USE_API_WAITLIST=true`
- Branch/commit: N/A (corrida QA sin cambios de l�gica)

Resultado por flujo:
- ? Login admin (`admin@casascarlatta.local / admin123`)
- ? Login coach (`coach@casascarlatta.local / coach123`)
- ? Login cliente (`cliente@casascarlatta.local / cliente123`) -> `401 Unauthorized`
- ? Flujos cliente bloqueados por autenticaci�n:
  - Reserva/cancelaci�n
  - Mis clases (filtro + paginaci�n backend)
  - Pr�ximas clases + CTA
  - Paquetes & Pagos con estado financiero/movimientos
  - Waitlist por `occurrenceId` en flujo cliente
- ? Backend health check: `GET /health` OK
- ? Frontend disponible: `http://127.0.0.1:5173` responde 200

Evidencia t�cnica corrida:
- `npm run test -- --run` -> `84 passed`
- `npm run build` -> `OK`
- Error bloqueante detectado:
  - `POST /api/v1/auth/login` con credencial cliente demo retorna `401`

Bugs encontrados en esta corrida:
- `QA-BLOCKER-001` (Severidad Alta): credencial demo cliente no autentica en entorno local actual.
  - Impacto: impide validar QA multi-rol completo pre-BUG-009.
  - Acci�n sugerida: re-seed backend local o validar contrase�a/estado de usuario cliente en DB local.

Decisi�n:
- `NO-GO` para iniciar BUG-009 hasta recuperar autenticaci�n cliente demo y completar QA E2E multi-rol.

## 17) Ejecución QA final pre-BUG-009 (2026-05-31)
- Fecha: `2026-05-31`
- Ambiente: local dev (`frontend` + `backend`)
- URLs:
  - Frontend: `http://127.0.0.1:5173`
  - Backend: `http://127.0.0.1:8000`
- Flags activos (`frontend/.env`):
  - `VITE_API_BASE_URL=http://127.0.0.1:8000`
  - `VITE_API_PREFIX=/api/v1`
  - `VITE_USE_API_AUTH=true`
  - `VITE_USE_API_CLASSES=true`
  - `VITE_USE_API_RESERVATIONS=true`
  - `VITE_USE_API_WAITLIST=true`

Resultado de verificación en esta sesión:
- Backend health: `GET /health` => `200 OK`.
- Login admin demo => `200 OK`.
- Login coach demo => `200 OK`.
- Login cliente demo (`cliente@casascarlatta.local / cliente123`) => `401 Unauthorized` (bloqueante).
- `npm run test -- --run` => `84 passed`.
- `npm run build` => `OK`.

Decisión:
- `NO-GO` para iniciar BUG-009 en este entorno hasta corregir autenticación del cliente demo.
- Acción recomendada: re-seed backend local o validar estado/password del cliente demo en base de datos local y repetir QA manual multi-rol.

## 18) Ejecucion QA final pre-BUG-009 (2026-05-31 - rerun credenciales cliente)
- Fecha: `2026-05-31`
- Ambiente: local dev (`frontend` + `backend`)
- URLs:
  - Frontend: `http://127.0.0.1:5173`
  - Backend: `http://127.0.0.1:8000`
- Flags activos (`frontend/.env`):
  - `VITE_API_BASE_URL=http://127.0.0.1:8000`
  - `VITE_API_PREFIX=/api/v1`
  - `VITE_USE_API_AUTH=true`
  - `VITE_USE_API_CLASSES=true`
  - `VITE_USE_API_RESERVATIONS=true`
  - `VITE_USE_API_WAITLIST=true`

Resultado de verificación en esta sesión:
- Login cliente demo (`cliente@casascarlatta.local / cliente999`) => `200 OK`.
- Login admin demo => `200 OK`.
- Login coach demo => `200 OK`.
- Backend health: `GET /health` => `200 OK`.
- `npm run test -- --run` => `84 passed`.
- `npm run build` => `OK`.

Estado QA pre-BUG-009:
- Se resuelve el bloqueo de autenticación de cliente reportado en corrida previa.
- Pendiente para declarar GO definitivo: corrida manual UI/Network multi-rol completa de la checklist (reserva/cancelación/waitlist/paginación).
- Decisión actual: `GO con riesgos` (técnico OK, cierre manual QA pendiente).

## 19) Ejecución QA manual UI/Network final pre-BUG-009 (2026-05-31)
- Fecha: `2026-05-31`
- Ambiente: local (`frontend` en `http://127.0.0.1:5173`, `backend` en `http://127.0.0.1:8000`)
- Flags activos:
  - `VITE_API_BASE_URL=http://127.0.0.1:8000`
  - `VITE_API_PREFIX=/api/v1`
  - `VITE_USE_API_AUTH=true`
  - `VITE_USE_API_CLASSES=true`
  - `VITE_USE_API_RESERVATIONS=true`
  - `VITE_USE_API_WAITLIST=true`

Resultado general:
- **GO con riesgos**

Flujos validados (UI/Network y API):
- Cliente:
  - Login cliente demo `cliente@casascarlatta.local / cliente999`: **PASS** (`POST /api/v1/auth/login` 200).
  - `GET /api/v1/auth/me`: **PASS**.
  - Carga clases (`GET /api/v1/clases` y paginado): **PASS**.
  - Reserva y cancelación: **PASS**
    - `POST /api/v1/reservas`
    - `GET /api/v1/reservas/me?page=...&page_size=...&from=...&to=...`
    - `POST /api/v1/reservas/{id}/cancelar`
    - refetch financiero `GET /api/v1/clientes/me/estado-financiero`.
  - Paquetes & Pagos (resumen + movimientos paginados): **PASS**
    - `GET /api/v1/clientes/me/estado-financiero`
    - `GET /api/v1/clientes/me/credit-movements?page=...&page_size=...`.
  - Waitlist por ocurrencia: **PASS**
    - `GET /api/v1/lista-espera?occurrenceId=...`
    - Validación negativa legacy `GET /api/v1/lista-espera?claseId=...` => **422 esperado**.
- Admin:
  - Login admin: **PASS**.
  - Clases paginadas en vista lista: **PASS** (`GET /api/v1/clases?page=...&page_size=...`).
  - Crear/editar clase con `coach_id` canónico: **PASS** (`POST`/`PUT /api/v1/clases`), con cleanup de clase temporal.
- Coach:
  - Login coach: **PASS**.
  - Agenda semanal: **PASS** (`GET /api/v1/coaches/me/agenda?from=...&to=...`).
  - Métricas y clases de hoy basadas en `agenda.occurrences`: **PASS** funcional.

Endpoints observados/validados:
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/clases`
- `GET /api/v1/clases?page=...&page_size=...`
- `GET /api/v1/clases/{id}/ocurrencias?from=...&to=...`
- `POST /api/v1/reservas`
- `GET /api/v1/reservas/me?page=...&page_size=...&status=...&from=...&to=...`
- `POST /api/v1/reservas/{id}/cancelar`
- `GET /api/v1/clientes/me/estado-financiero`
- `GET /api/v1/clientes/me/credit-movements?page=...&page_size=...`
- `GET /api/v1/lista-espera?occurrenceId=...`
- `POST /api/v1/clases`
- `PUT /api/v1/clases/{id}`
- `GET /api/v1/coaches/me/agenda?from=...&to=...`

Errores de consola:
- Sin evidencia de error bloqueante en esta corrida técnica.

Requests legacy detectados:
- No se detectó uso válido de `GET /api/v1/lista-espera?claseId=...` en flujo actual.
- La llamada legacy probada explícitamente retorna `422` (comportamiento esperado de contrato actual).

Bugs encontrados:
- No se detectaron bugs bloqueantes nuevos para pre-BUG-009.
- Observación de contrato backend local para reserva: requiere payload con `occurrence_id` y además `clase_id`/`user_id` en este entorno.

Decisión final:
- **GO con riesgos** para iniciar BUG-009.
- Riesgo residual: completar evidencia visual/capturas de la checklist manual completa en navegador para cierre de acta de QA formal.

- Nota 2026-06-02: BUG-009 frontend re-integrado con paquetes backend, checkout backend y retorno por external_reference.

- Nota 2026-06-03: Cliente > Paquetes & Pagos ya consume historial real desde `GET /api/v1/clientes/me/pagos`; el tracking local deja de ser fuente principal.

- Validar pantalla post-pago con vista amigable, detalles t?cnicos colapsables y panel "Estado de pagos recientes" en Paquetes & Pagos.
- Tracking local solo recuerda pagos iniciados desde este navegador; backend sigue confirmando estado real por external_reference.

## Nota 2026-06-03
- Reserva por equipo/lugar usa `EquipmentReservationPanel`.
- Source of truth: backend spots + holds.
- STRYDE: bench + treadmill. SLOW: mat.
- Do not use label as unique id; use spot_id for actions.
## Nota 2026-06-03 - Landing paquetes -> dashboard pagos
- Landing usa catálogo backend real `GET /api/v1/memberships/packages` en API mode.
- Click Comprar sin sesión:
  - guarda intención local `pending_package_purchase_id`
  - redirige a `/login?redirect=/cliente/dashboard?section=pagos&packageId=...`
- Click Comprar con cliente autenticado:
  - redirige directo a `/cliente/dashboard?section=pagos&packageId=...`
- En dashboard, paquete queda resaltado; compra real ocurre solo con `PagoModal` + checkout backend.
- Redirect post-login acepta solo rutas internas que empiezan con `/`.
## Nota 2026-06-07 - Reservar visual premium
- `/reservar` recupera flujo visual premium: cards grandes STRYDE X / SLOW, paso sala -> clase -> spot.
- Reserva real sigue usando flujo actual por spots/holds; no se toca backend ni contratos.
- Público ve catálogo/clases; acciones de reservar siguen bajo auth de cliente.
