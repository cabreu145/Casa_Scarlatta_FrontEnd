# FRONTEND_E2E_QA_RUN_TEMPLATE.md

## 1) InformaciÃ³n general de ejecuciÃ³n
- Fecha de ejecuciÃ³n:
- Ambiente: (Local / QA / Staging)
- Frontend URL:
- Backend URL: `http://127.0.0.1:8000`
- API Prefix: `/api/v1`
- Branch frontend:
- Commit frontend:
- Backend versiÃ³n/commit (si aplica):
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
- Cliente: `cliente@casascarlatta.local / cliente123`
- Admin: `admin@casascarlatta.local / admin123`
- Coach: `coach@casascarlatta.local / coach123`
- Nota: validar contra seed backend actual si hubo reset reciente.
## 5) Navegador y dispositivo
- Navegador principal (nombre/versiÃ³n):
- Navegadores secundarios:
- Sistema operativo:
- Dispositivo:
- ResoluciÃ³n:
- Modo responsive probado: (SÃ­/No)

## 6) Matriz de ejecuciÃ³n por flujo
| Rol | Escenario | Pasos | Resultado esperado | Resultado obtenido | Status (Pass/Fail/Blocked) | Evidencia (screenshot/network) | Notas |
|---|---|---|---|---|---|---|---|
| Cliente | Login | 1) Abrir login 2) Ingresar credenciales 3) Entrar al panel | SesiÃ³n iniciada y `auth/me` exitoso | | | | |
| Cliente | Ver clases reales | 1) Ir a clases 2) Validar lista | Render sin errores y datos backend | | | | |
| Cliente | Reservar clase | 1) Seleccionar clase reservable 2) Confirmar reserva | `POST /reservas` ok y reflejo en panel | | | | |
| Cliente | Ver mis clases | 1) Abrir panel cliente 2) Revisar reservas | Reserva visible en estado correcto | | | | |
| Cliente | Cancelar reserva | 1) Cancelar reserva activa | `POST /reservas/{id}/cancelar` ok + refetch | | | | |
| Cliente | Unirse waitlist | 1) Clase llena 2) Unirse | `POST /lista-espera` ok y estado visible | | | | |
| Cliente | Salir waitlist | 1) Salir de waitlist | `DELETE /lista-espera/{id}` ok | | | | |
| Cliente | PromociÃ³n waitlist al cancelar | 1) Cancelar reserva con waitlist activa | Backend maneja FIFO; frontend no promueve local | | | | |
| Cliente | Waitlist default activa | 1) Consultar waitlist clase | Solo `esperando/notificado` por default | | | | |
| Admin | Login admin | 1) Login con admin | Acceso panel admin sin romper | | | | |
| Admin | Ver clases | 1) Abrir secciÃ³n clases | Datos backend renderizados | | | | |
| Admin | Revisar reservas (si UI soporta) | 1) Abrir secciÃ³n relacionada | Vista estable / sin crash | | | | |
| Admin | Revisar waitlist (si UI soporta) | 1) Abrir secciÃ³n relacionada | Vista estable / sin crash | | | | |
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
- ConfirmaciÃ³n QA: frontend opera con default activo (sin historial por defecto).

## 9) Errores de consola
| Timestamp | Pantalla | Error | Severidad | Impacto | Estado |
|---|---|---|---|---|---|
| | | | | | |

## 10) Bugs encontrados
| ID | Rol | Escenario | DescripciÃ³n | Severidad | Reproducible | Evidencia | Estado |
|---|---|---|---|---|---|---|---|
| BUG-001 |cliente |reservar clase desde el dashboard |importante |al momneto de entrar al dashboard "/cliente/dashboarden la sesccion de reservar clase " y darle click a resercar clase, no se muestran las clases listadas en "http://localhost:5173/clases" es decir en este apartado "http://localhost:5173/clases" se listan todas las clases de los tipos de categoria, y ahi si podriamos reservar...  |na | sin corregir| |

| BUG-002 |cliente |reservar clase desde el dashboard |importante |al momneto de entrar al dashboard "/cliente/dashboard en la seccion de mis clases" se muestran todas las clases lo cual esta bien, pero no tenemos un filtro para poder seleccionar si es clases completada, no asistida, cancelada etc   |na | sin corregir| |

| BUG-003 |cliente |reservar clase desde el dashboard cuando se arregle, pero se presenta en la resercacion de "/clases" |importante |al momneto de reservar una clase nueva para el dab 30 de mayo del 2026, la misma reserva se observa en los dias consiguientes del 29, 30 y sale condifmrada, se puede cancelar. Esto no deberia ser asi ....  |na | sin corregir| |

| BUG-004 |cliente |clases disponibles (creditos) |importante |al momneto de de comprar un nuevo paquete se aÃ±aden los creditos, pero  no se estan descontando del todo bien al reservar las clases, aunado a esto al refrescar la pagina se borran los creditos... |na | sin corregir| |

| BUG-005 |cliente |Mis proximas clases  |importante | en el dashboard, no se estan visualisando todas las clases reservadas, estan estaticas 2, aunado a este me gusaria que al corregir este bug, se tome en cuenta las mejores practicas de ui uix design para mostrar mis proximas clases sin romper el diseÃ±o y no mostrar en un listado indeterminable  |na | sin corregir| |

| BUG-006 |cliente, administrador, coach |Listados de datos   |importante | Se tiene que corregir todos los listados, para tener un paginado y no mostrar un listado infinito, se tienen que manejar paginados para todas las secciones donde las tengamos   |na | sin corregir| |

| BUG-007 |cliente |Dashboard mi perfil   |importante | No se estan mostrando los datos de informacion personal, aparecen sin informacion, hasta que se le da clik dentro del formulario, si se actualiza la data   |na | sin corregir| |

| BUG-008 |cliente |Dashboard Paeutes & Pagos   |importante | aqui igual se muestran 0 clases restantes y se tendria que validar que se esten restando al momento de reservar, si se estan mostrando las ultimas trasnacciones en el historial de pago, pero creo es importante validar con el bug 006, el listado de estos para que sea con un paginado con la ui uix pertinente... | sin corregir| |

| BUG-009 |cliente |Dashboard Paeutes & Pagos contratacion desde la web app   |importante | Actualmente, no se tiene un metodo de pago vinculado o pasarela, la que estariamos usando es la de Mercado Pago , ya se tienen los accesos para esto de prod y sandbox (pruebas) es de vital importancia corregir esto antes de pasar a otro modulo. | sin corregir| |

| BUG-010 |coach |Dashboard "Todas mis clases esta semana"   |importante | No se estan mostrando las clases que tienen asignadas los coach en la semana del filtro "Todas mis clases esta semana
Semana del"  el listado es "DÃ­a	Hora	Clase	Tipo	Alumnos	OcupaciÃ³n" | sin corregir| |

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

## 12) DecisiÃ³n Go/No-Go
- DecisiÃ³n: (GO / NO-GO / GO con riesgos)
- JustificaciÃ³n:
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

## 14) Avance de estabilizaciÃ³n (core)
Registrar cierre incremental de bugs sin perder trazabilidad:

| Bug | Estado | Fecha | Archivos modificados | Source of truth validado | QA recomendado | Pendientes relacionados |
|---|---|---|---|---|---|---|
| BUG-001 | Corregido | 2026-05-29 | `ClientPanel.jsx`, `clasesStore.js` | Clases API (`/api/v1/clases`) | Validar que `/clases` y dashboard muestran misma clase demo | BUG-003, BUG-005 |
| BUG-003 | Mitigado | 2026-05-29 | `reservationAdapter.js`, `Clases.jsx`, `ClientPanel.jsx`, `SeatSelector.jsx` | Reservas API (`/api/v1/reservas/me`) sin usar `reserved_at` como fecha de sesiÃ³n | Validar que reserva no se marca en dÃ­as incorrectos cuando falta ocurrencia | Cierre definitivo depende de ocurrencias backend |

## 15) QA especÃ­fico BUG-003
Checklist de cierre parcial:
- [ ] Reservar clase desde `/clases`.
- [ ] Confirmar que `reserved_at` no se muestra/usa como fecha de sesiÃ³n.
- [ ] Confirmar que la reserva no aparece confirmada/cancelable en dÃ­as incorrectos.
- [ ] Confirmar que si `class_date` y `class_start_at` vienen `null`, la UI queda neutral por dÃ­a (sin afirmar reserva diaria).
- [ ] Confirmar que `SeatSelector` no bloquea asientos por `class_id` plano sin ocurrencia.
- [ ] Confirmar que con flags API activos no se mezclan mocks en estas vistas.

Evidencia sugerida:
- Captura Network de `GET /api/v1/reservas/me` mostrando `class_date/class_start_at`.
- Capturas de `/clases`, `ClientPanel` (Mis clases/PrÃ³ximas), y `SeatSelector` en mismo caso de prueba.

## QA especÃ­fico BUG-003 (occurrences model)
- [ ] Crear reserva desde `/clases` enviando `occurrence_id`.
- [ ] Verificar en Network `POST /api/v1/reservas` con `occurrence_id` no nulo.
- [ ] Confirmar que reserva aparece solo en fecha/hora de su ocurrencia real.
- [ ] Confirmar que `reserved_at` se usa solo como fecha creaciÃ³n, no como fecha sesiÃ³n.
- [ ] Confirmar join waitlist con `occurrence_id` y consulta `GET /lista-espera?occurrenceId=...`.
- [ ] Confirmar que no se mezcla source mock con flags API activos.

## VerificaciÃ³n de performance (request storm)
- [ ] Cambiar rÃ¡pidamente semana/dÃ­a en `/clases` y `/cliente/dashboard`.
- [ ] Confirmar en Network que no hay rÃ¡faga repetida para misma llave `classId+from+to`.
- [ ] Confirmar que al navegar fuera de pantalla se abortan requests pendientes (sin error UI).
- [ ] Confirmar que no se dispara precarga masiva de `waitlist?occurrenceId=...` al montar dashboard.

## QA extra: validaciÃ³n de endpoint waitlist
- [ ] Reservar y cancelar una ocurrencia real.
- [ ] Confirmar que no existe request `GET /api/v1/lista-espera?occurrenceId=...`.
- [ ] Confirmar que waitlist API, si se consulta, usa solo `GET /api/v1/lista-espera?occurrenceId=...`.


## QA específico BUG-004 (estado financiero API)
- [ ] Login cliente y validar `GET /api/v1/clientes/me/estado-financiero`.
- [ ] Confirmar créditos/membresía desde endpoint financiero, no desde `/auth/me`.
- [ ] Reservar clase y validar refetch de estado financiero.
- [ ] Cancelar reserva y validar refetch de estado financiero.
- [ ] Validar estado vacío controlado cuando `transactions=[]`.
- [ ] Validar que PagoModal en modo API muestra “Compra en línea aún no disponible en modo API”.

## Resultado recomendado de ejecución manual BUG-004 Core
Marcar al ejecutar QA en navegador:
- [ ] Login cliente demo con flags API activos.
- [ ] `GET /api/v1/clientes/me/estado-financiero` visible en Network.
- [ ] Créditos dashboard reflejan `credits_balance`.
- [ ] Tras reservar: `POST /api/v1/reservas` + refetch financiero y créditos bajan.
- [ ] Tras cancelar: `POST /api/v1/reservas/{id}/cancelar` + refetch financiero y créditos suben.
- [ ] Refresh mantiene créditos/membresía desde backend.
- [ ] Logout/login mantiene créditos/membresía desde backend.
- [ ] `transactions=[]` muestra estado vacío controlado.
- [ ] `PagoModal` en API mode muestra “Compra en línea aún no disponible en modo API”.
- [ ] No usar `/auth/me` para balance ni stores mock como source of truth en API mode.


## QA específico BUG-010 (tabla semanal coach)
- [ ] Login con coach demo.
- [ ] Validar `GET /api/v1/coaches/me/agenda?from=...&to=...` en Network.
- [ ] Validar que “Todas mis clases esta semana” renderiza desde `agenda.occurrences`.
- [ ] Validar estados de loading, error controlado y empty state.
- [ ] Confirmar que en API mode no usa datos mock/local como fuente principal.

## QA específico BUG-011 (métricas coach)
- [ ] Login coach con flags API activos.
- [ ] Validar `GET /api/v1/coaches/me/agenda?from=...&to=...` en Network.
- [ ] Validar que métricas “Esta semana” derivan de `agenda.occurrences`.
- [ ] Con `occurrences=[]`, validar métricas en 0 real (sin números hardcodeados).
- [ ] Validar estados controlados de loading/error de métricas.
- [ ] Confirmar que en API mode no usa fuentes mock/local para métricas.

## QA específico BUG-012 (clases de hoy coach)
- [ ] Login coach con flags API activos.
- [ ] Validar `GET /api/v1/coaches/me/agenda?from=...&to=...` en Network.
- [ ] Confirmar que “Clases de hoy” se llena por `occurrenceDate` del día actual.
- [ ] Confirmar orden por hora (`startTime/startAt`).
- [ ] Validar estado loading: “Cargando clases de hoy...”.
- [ ] Validar empty state real: “No tienes clases asignadas hoy.”.
- [ ] Confirmar que en API mode no usa `dia` base, `coachNombre` ni fuentes mock/local como verdad.

## QA específico BUG-002 (filtro Mis Clases)
- [ ] Login cliente con flags API activos.
- [ ] Validar `GET /api/v1/reservas/me` en Network.
- [ ] Probar filtros: Todas, Confirmadas, Canceladas, Completadas, No asistió.
- [ ] Validar que cada filtro muestra solo estados correspondientes.
- [ ] Validar empty state por filtro: “No tienes clases en este estado.”.
- [ ] Confirmar que con flags API false el filtro funciona sobre fallback local/mock.
