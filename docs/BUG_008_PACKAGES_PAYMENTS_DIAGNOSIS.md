# BUG-008 - Diagnostico de Paquetes y Pagos (clases restantes en 0)

## Resumen del bug
En Dashboard Cliente > Paquetes y Pagos, UI puede mostrar `0 clases restantes` de forma incorrecta aun con membresia activa y creditos disponibles en backend.

## Relacion con BUG-004
BUG-004 resolvio base tecnica de estado financiero en modo API:
- fuente de verdad: `GET /api/v1/clientes/me/estado-financiero`
- refetch tras login/bootstrap, reservar, cancelar
- no usar `/auth/me` para balance financiero

BUG-008 queda como capa de presentacion/consumo en seccion Paquetes y Pagos:
- consistencia de metricas mostradas
- manejo correcto de loading vs cero real
- evitar mezcla de fuentes legacy/mock
- UX de historial y listados

## Que ya quedo resuelto por BUG-004
- Creditos y membresia persisten tras refresh/relogin.
- Creditos se actualizan tras reserva/cancelacion (refetch financiero).
- `PagoModal` en modo API no simula compra persistente local.
- `transactions=[]` puede venir del backend sin romper contrato.

## Causa probable restante
Bug principalmente frontend de consumo/UI:
1. `ClientPanel` combina datos de `financialStateStore` con datos legacy en misma vista.
2. Seccion planes usa `paquetesStore` (mock/local) para "Nuestros planes" aunque modo API activo.
3. Cuando `creditsBalance` inicial es `0` y carga async aun no termina, UI puede verse como "0 real" por falta de estado de carga explicito en bloque Paquetes y Pagos.
4. Historial mezcla comportamiento:
   - API mode: `creditMovements`/`transactions`
   - fallback: `transaccionesStore` mock/local
   Esto requiere separacion visual clara para no interpretar mock como real.

## Archivos implicados
- `D:/Casa_Scarlatta_FrontEnd/frontend/src/pages/cliente/ClientPanel.jsx`
- `D:/Casa_Scarlatta_FrontEnd/frontend/src/stores/financialStateStore.js`
- `D:/Casa_Scarlatta_FrontEnd/frontend/src/adapters/financialStateAdapter.js`
- `D:/Casa_Scarlatta_FrontEnd/frontend/src/services/financialStateApiService.js`
- `D:/Casa_Scarlatta_FrontEnd/frontend/src/features/pagos/PagoModal.jsx`
- `D:/Casa_Scarlatta_FrontEnd/frontend/src/stores/transaccionesStore.js`
- `D:/Casa_Scarlatta_FrontEnd/frontend/src/stores/paquetesStore.js`

## Flujo actual de datos (hallazgo)
1. API mode financiero activo (`useApiAuth && useApiReservations`).
2. `ClientPanel` toma:
   - clases restantes: `creditsBalance` (`financialStateStore`)
   - plan actual: `activeMembership.packageName`
   - usadas/total: `activeMembership.creditsUsed/creditsTotal`
3. Historial en API mode:
   - prioridad a `creditMovements`
   - fallback visual a `transactions` si no hay movimientos
4. En no API mode:
   - datos desde `authStore`, `paquetesStore`, `transaccionesStore`

## Source of truth esperado en modo API
- Creditos y membresia: `financialStateStore` (cargado desde `/clientes/me/estado-financiero`)
- Historial principal: `creditMovements` (ledger de credito)
- Transacciones: `transactions` cuando backend las provea (hoy puede venir `[]`)

No usar como verdad en API mode:
- `authStore.usuario.clasesPaquete`
- `transaccionesStore` mock/local
- `paquetesStore` como estado financiero del cliente

## Fuentes mock/local detectadas
- `transaccionesStore` persiste `TRANSACCIONES_MOCK` en localStorage.
- `paquetesStore` persiste catalogo local.
- `PagoModal` mantiene flujo simulado para modo no API.

## Frontend-only vs backend
Clasificacion actual: **frontend-only (core BUG-008)** con dependencia UX de datos backend parciales.

Backend hoy ya cubre contrato financiero core para BUG-008:
- `credits_balance`
- `active_membership` con `credits_available/used/total`
- `credit_movements`

Dependencia backend futura (no bloquea fix core):
- `transactions` enriquecidas para historial de pagos real (BUG-009/Fase pagos).

## UX/listado y paginacion
Necesidad detectada:
- Si `transactions=[]`, estado vacio controlado ya existe; mantener.
- Para `creditMovements` extensos, agregar limite visual + "ver mas" o paginacion simple (alineado con BUG-006). No implementar en esta fase de diagnostico.

## Propuesta de solucion minima (siguiente implementacion)
1. En bloque Paquetes y Pagos, separar estado:
   - `loading financiero`
   - `sin membresia`
   - `cero real`
2. En API mode, bloquear uso de cualquier metrica financiera legacy (`authStore`, stores mock).
3. Mantener catalogo planes local solo como catalogo comercial, no como estado de membresia activa.
4. Clarificar etiquetas UI:
   - "creditos disponibles" desde backend
   - "movimientos de credito" como historial principal
5. Limitar render inicial a datos financieros ya hidratados para evitar mostrar `0` temporal como definitivo.

## Riesgos
- Percepcion de "0" temporal si falta estado de carga claro.
- Confusion usuario si se mezcla historial mock con historial real.
- Regresion en modo fallback si no se encapsula bien por flags.

## Tests necesarios (para implementacion)
- API mode: Paquetes y Pagos usa solo `financialStateStore` para clases restantes.
- Render en carga: no interpretar default `0` como valor final.
- `activeMembership=null`: mostrar estado sin plan, no error.
- `transactions=[]`: mostrar empty state controlado.
- Fallback mode: flujo mock sigue estable con flags false.

## Recomendacion de siguiente paso
Implementar ajuste frontend puntual en `ClientPanel` (seccion Paquetes y Pagos) para distinguir loading/0 real y blindar source of truth financiero en modo API. Mantener compra self-service y transacciones reales fuera de alcance (BUG-009).

## Actualizacion implementacion (2026-05-30)
- BUG-008 corregido en frontend (ClientPanel) con estados explicitos en API mode.
- Se distingue visualmente: loading financiero, error financiero, sin membresia activa, 0 real, y creditos > 0.
- Clases restantes/plan/usadas/total en API mode ahora salen de inancialStateStore (creditsBalance + ctiveMembership).
- En API mode, historial principal mantiene creditMovements; con 	ransactions=[] se muestra estado vacio controlado.
- paquetesStore queda para catalogo comercial, no para estado financiero del cliente.
- Compra self-service y transacciones reales siguen fuera de alcance (BUG-009 / Fase pagos).

