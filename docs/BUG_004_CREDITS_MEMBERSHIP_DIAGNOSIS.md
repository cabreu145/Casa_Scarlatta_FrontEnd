# BUG-004 - Diagnóstico de créditos/membresía

## Resumen del bug
En modo API activo, la UI muestra créditos/paquete inconsistentes: pueden subir al comprar paquete en frontend local, no reflejar descuento correcto al reservar, y perderse tras refresh/relogin.

## Causa probable
Bug mixto (frontend + contrato backend no consumido): frontend sigue usando stores persistidos/mock como fuente principal para créditos/paquete/transacciones, mientras reservas ya opera contra backend como fuente de verdad.

## Archivos implicados
- `frontend/src/pages/cliente/ClientPanel.jsx`
- `frontend/src/stores/authStore.js`
- `frontend/src/services/reservasService.js`
- `frontend/src/services/reservasApiService.js`
- `frontend/src/services/usuariosService.js`
- `frontend/src/stores/usuariosStore.js`
- `frontend/src/stores/paquetesStore.js`
- `frontend/src/stores/transaccionesStore.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/adapters/authAdapter.js`
- `frontend/src/constants/api.js`
- `frontend/src/features/pagos/PagoModal.jsx`

## Flujo actual de datos (hallazgo)
1. Auth API:
- `AuthContext` hidrata usuario desde `/auth/me`.
- `authAdapter` intenta mapear créditos desde `credits_available`/equivalentes, con fallback a `0`.

2. Reservas API:
- `reservasService` en API mode crea/cancela reserva en backend y refresca reservas/clases.
- No refresca explícitamente créditos/membresía del usuario tras mutación.

3. Dashboard cliente (Paquetes & Pagos):
- Lee créditos y paquete desde `usuario` en `authStore` (`clasesPaquete`, `paquete`).
- Lee historial desde `transaccionesStore` (mock/localStorage).
- Lee catálogo desde `paquetesStore` (mock/localStorage).

4. Compra de paquete en UI actual:
- `PagoModal` llama `asignarPaqueteService` (local), que muta `usuariosStore` + `transaccionesStore`.
- También muta `authStore` local (`actualizarClasesPaquete`, `actualizarPerfil`).
- No hay flujo API real de compra/membresía aplicado como fuente de verdad en cliente.

## Fuentes mock/localStorage/hardcoded detectadas
- `authStore` persistido (`casa-scarlatta-auth`) usado como fuente visible de créditos.
- `usuariosStore` inicializado con `mockUsers`, con lógica local de créditos.
- `paquetesStore` catálogo persistido local (`casa-scarlatta-paquetes-v2`).
- `transaccionesStore` con `TRANSACCIONES_MOCK` persistido (`casa-scarlatta-transacciones`).
- `usuariosService` y `PagoModal` mantienen flujo local de asignación/compra.

## Endpoints backend actuales usados
- Auth:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
- Reservas:
  - `POST /api/v1/reservas` (con `occurrence_id`)
  - `GET /api/v1/reservas/me`
  - `POST /api/v1/reservas/{id}/cancelar`

## Endpoints backend faltantes en consumo frontend (o no integrados)
Según docs backend hay capacidad de membresías/créditos (Fase 2 cerrada funcional), pero frontend no consume aún un read-model estable para:
- membresía activa del cliente
- balance de créditos actual
- movimientos de crédito
- historial de pagos/transacciones real
- compra/asignación de paquete real en modo API (flujo online)

Notas:
- `ENDPOINTS` ya define rutas como `/paquetes`, `/paquetes/comprar`, `/transacciones`, pero no están integradas en flujo cliente actual de BUG-004.
- Si `/auth/me` no incluye balance de crédito definitivo, frontend requiere endpoint dedicado de membresía/ledger para consistencia post-reserva y post-refresh.

## Clasificación del bug
Mixto frontend + backend contract/read-model integration gap.

## ¿Se puede corregir frontend-only?
Mitigación parcial sí:
- dejar de usar stores local/mock como fuente de verdad en API mode para créditos/paquete/transacciones.
- refrescar usuario/membresía desde backend tras reservar/cancelar/login/reload.

Cierre robusto requiere backend disponible y contrato claro para:
- balance actual de créditos
- membresía activa
- movimientos/tx del usuario

## Propuesta de solución mínima (siguiente implementación)
1. En API mode, declarar backend como source of truth para créditos/membresía/pagos cliente.
2. Reemplazar lectura principal en `ClientPanel`:
- créditos y membresía desde endpoint backend (o `/auth/me` si ya trae datos completos y consistentes).
- historial desde endpoint backend (no `transaccionesStore` local).
3. Tras `reservar/cancelar`:
- invalidar/recargar datos de créditos+membresía.
4. Mantener fallback local solo con flags API en `false`.
5. Marcar `PagoModal`/`usuariosService` local como legacy en API mode cliente hasta integración real de compra backend.

## Impacto
- Reservas: evita desalineación entre crédito real y visual.
- Paquetes & Pagos: evita mostrar 0 o valores stale tras refresh.
- Refresh/relogin: elimina pérdida aparente de créditos por hidratación local incompleta.

## Riesgos
- Doble fuente de verdad temporal (authStore + endpoint membresía) si no se centraliza.
- Contrato backend insuficiente para UI de paquetes/historial si no hay endpoint user-centric consolidado.
- Regresiones en modo mock si no se encapsula por flags.

## Tests necesarios (para fase de implementación)
- API mode: créditos visibles vienen de backend, no de localStorage.
- Post `POST /reservas`: balance visible actualizado.
- Post cancelar reserva: balance visible actualizado.
- Reload/relogin: balance persiste según backend.
- Fallback: con flags en `false` flujo mock sigue operativo.

## Recomendación de siguiente paso
Implementación en frontend enfocada a BUG-004 con contrato backend vigente de membresía/créditos/transacciones. Si contrato user-centric no existe o es parcial, abrir mini-ajuste backend primero (endpoint de lectura consolidada de estado financiero del cliente).
