# BUG-009 - Diagnóstico Integración Mercado Pago

## Resumen del bug
La compra de paquetes desde web app no está integrada a una pasarela real. En modo API, la UI evita mutar créditos localmente y muestra estado controlado, pero no existe checkout real ni trazabilidad de pago end-to-end.

## Estado actual
- Core estabilizado cerrado (auth/clases/reservas/waitlist/financial state).
- En modo API, fuente financiera actual:
  - `GET /api/v1/clientes/me/estado-financiero`
  - `GET /api/v1/clientes/me/credit-movements?page=&page_size=`
- `PagoModal` en API mode muestra: `Compra en línea aún no disponible en modo API`.

## Flujo frontend actual detectado
1. Cliente abre `PagoModal` desde `ClientPanel` sección Paquetes & Pagos.
2. Selecciona paquete desde `paquetesStore` (catálogo local persistido).
3. Si API mode activo (`VITE_USE_API_AUTH && VITE_USE_API_RESERVATIONS`):
   - corta flujo de compra y no persiste compra.
4. Si fallback/mock:
   - ejecuta `asignarPaqueteService` (local),
   - muta `usuariosStore`/`authStore`,
   - registra `transaccionesStore` local.

## Fuentes mock/local detectadas
- `frontend/src/stores/paquetesStore.js` (catálogo y mutaciones locales, localStorage `casa-scarlatta-paquetes-v2`).
- `frontend/src/stores/transaccionesStore.js` (historial mock/localStorage `casa-scarlatta-transacciones`).
- `frontend/src/stores/usuariosStore.js` (asignación local de paquete/créditos).
- `frontend/src/services/usuariosService.js` (`asignarPaqueteService` local).
- `frontend/src/features/pagos/PagoModal.jsx` (flujo simulado con TODO backend).

## Brechas backend para Mercado Pago
Se requiere backend primero para no exponer secretos y para asegurar consistencia de negocio:
- Endpoint crear checkout/preferencia (cliente autenticado).
- Endpoint webhook Mercado Pago (server-to-server) con verificación de firma.
- Endpoint consulta estado de pago (polling/control post-return).
- Servicio de aplicación de compra aprobada:
  - alta de transacción de pago,
  - asignación de membresía/paquete,
  - alta de `credit_movements`,
  - idempotencia por `external_payment_id`.
- Modelo persistente de pagos/transacciones externas (si no está completo para este caso).

## Brechas frontend para Mercado Pago
- Servicio API de pagos/checkouts (crear checkout, consultar estado).
- Botón comprar en `PagoModal` en API mode (sin simulación local).
- Estado de procesamiento, error, éxito y pendiente.
- Manejo de retorno desde checkout (query params/redirect result).
- Refetch financiero tras pago aprobado:
  - `GET /clientes/me/estado-financiero`
  - `GET /clientes/me/credit-movements`.

## Opción recomendada para Casa Scarlatta
### Recomendación: Checkout Pro (preferencia creada por backend)
Motivo:
- Mayor simplicidad para primer release.
- Seguridad: secreto Mercado Pago solo en backend.
- Menor superficie PCI en frontend.
- Permite sandbox/prod por configuración backend.
- Escala luego a Bricks si UX lo requiere.

## Flujo propuesto end-to-end
1. Frontend (`PagoModal`) solicita crear checkout:
   - `POST /api/v1/pagos/checkout-preference` con `package_id`.
2. Backend valida usuario/rol/paquete y crea preferencia en MP.
3. Frontend redirige a `init_point` (o `sandbox_init_point` en sandbox).
4. Mercado Pago redirige a `success|pending|failure` URL frontend.
5. Webhook backend confirma estado real del pago.
6. Backend aplica compra aprobada de forma idempotente:
   - transacción,
   - membresía/créditos,
   - movimientos.
7. Frontend consulta estado (`GET /api/v1/pagos/{external_reference}` o similar) y refresca estado financiero.

## Endpoints backend requeridos (propuestos)
- `POST /api/v1/pagos/checkout-preference`
  - req: `{ package_id }`
  - res: `{ checkout_url, external_reference, preference_id, sandbox }`
- `POST /api/v1/pagos/webhook/mercadopago`
  - interno, sin sesión, verificación firma.
- `GET /api/v1/pagos/estadoexternal_reference=...`
  - para frontend post-redirección.
- (Opcional) `GET /api/v1/clientes/me/transaccionespage=&page_size=`
  - si se separa historial de pagos del ledger de créditos.

## Cambios frontend requeridos
- Nuevo servicio `paymentsApiService` (crear preferencia + consultar estado).
- Actualizar `PagoModal`:
  - API mode: usar backend checkout, no `asignarPaqueteService`.
  - fallback/mock: mantener comportamiento actual con flags false.
- Pantalla/estado post-checkout (success/pending/failure).
- Refetch estado financiero y movimientos luego de pago aprobado.
- Mensajería UX clara para estados pendientes/rechazados.

## Seguridad y secrets
- Nunca exponer Access Token de Mercado Pago en frontend.
- Public key solo si se adopta Brick en fase posterior.
- Firmas webhook obligatorias en backend.
- Idempotencia obligatoria para evitar doble asignación de créditos.
- Auditoría de eventos de pago y reconciliación.

## Sandbox / producción
- Variables backend por entorno:
  - credenciales sandbox/prod,
  - webhook URL por entorno,
  - return URLs frontend por entorno.
- Frontend no debe decidir credenciales; solo consume contrato backend.

## Webhooks
- Fuente de verdad final del estado de pago debe ser webhook/backend.
- Redirección frontend sola no alcanza para confirmar aprobación.
- Reintentos webhook + idempotencia por `payment_id`/`external_reference`.

## Estados UI requeridos
- `idle`: selección de paquete.
- `creating_checkout`: creando preferencia.
- `redirecting`: redirigiendo a pago.
- `pending`: pago pendiente.
- `approved`: compra aplicada, refrescar estado financiero.
- `rejected|failed`: mostrar error y opción reintentar.

## Tests necesarios
- Frontend:
  - `PagoModal` API mode llama crear preferencia y no muta stores locales.
  - Manejo success/pending/failure post-retorno.
  - Refetch financiero tras aprobación.
- Backend:
  - crear preferencia con rol cliente.
  - webhook válido/invalid signature.
  - idempotencia de aplicación de compra.
  - no doble crédito en reintentos webhook.

## Riesgos
- Sin idempotencia: doble carga de créditos.
- Sin webhook robusto: estados inconsistentes frontend/backend.
- Dependencia de catálogo local de paquetes: desalineación con backend.
- Ambigüedad entre `transactions` financieras y `credit_movements`.

## Plan incremental recomendado
1. Backend: contratos de checkout + webhook + estado (primero).
2. Backend: persistencia de transacción externa + aplicación de compra idempotente.
3. Frontend: integrar `PagoModal` con checkout backend (sin SDK todavía).
4. Frontend: post-pago + refetch financiero.
5. QA sandbox end-to-end multi-rol + casos de error/pending.
6. Fase posterior: evaluar Bricks para UX embebida.

## Conclusión de prioridad
BUG-009 es **mixto frontend + backend + integración externa** y **debe iniciar por backend** para habilitar contrato seguro de pago.

## Actualización implementación frontend fase 1 (2026-05-31)
- Frontend integrado con backend para checkout de pagos:
  - `POST /api/v1/pagos/checkout-preference`
  - `GET /api/v1/pagos/estadoexternal_reference=...`
- `PagoModal` en API mode ahora:
  - crea preferencia backend,
  - guarda `external_reference` en `sessionStorage`,
  - redirige a `checkout_url`,
  - no muta créditos/stores locales.
- Se agregó retorno post-pago con rutas:
  - `/pago/success`
  - `/pago/pending`
  - `/pago/failure`
- El retorno consulta estado real backend (no asume éxito por redirect).
- Si `approved` + `applied=true`, refresca estado financiero y movimientos.
- Polling controlado para `pending/created` (sin request storm).
- Pendiente posterior:
  - QA sandbox completo end-to-end con webhook backend y evidencia visual/HAR.

## Actualización QA sandbox frontend (2026-05-31)
- Checkout backend validado desde frontend (fase técnica local):
  - `POST /api/v1/pagos/checkout-preference` retorna `checkout_url`, `external_reference`, `preference_id`, `status=created`.
- Consulta de estado validada:
  - `GET /api/v1/pagos/estadoexternal_reference=...` retorna `created/applied=false` en local sin webhook público.
- Verificación financiera:
  - sin pago aprobado, créditos y movimientos no cambian (comportamiento correcto).
- Cierre E2E total pendiente:
  - requiere webhook real (ngrok + notification_url habilitado) para validar `approved+applied=true` y actualización automática post-pago.

## Actualización QA frontend final (2026-06-02)
- La validación técnica de frontend sigue correcta:
  - sin SDK Mercado Pago en `frontend/package.json`,
  - sin Access Token ni secretos MP en frontend,
  - checkout se crea vía backend,
  - frontend consulta estado real y no aprueba por redirect.
- Hallazgo nuevo:
  - desalineación de catálogo entre frontend y backend.
  - `package_id=1` crea preferencia correctamente.
  - `package_id=2..5` responden `PACKAGE_NOT_FOUND`.
- Resultado observado en esta corrida:
  - `GET /pagos/estado` permaneció en `created/applied=false`.
  - créditos y movimientos financieros no cambiaron (`13 -> 13`, sin nuevo movimiento de compra).
- Conclusión:
  - BUG-009 no puede declararse cerrado aún desde frontend.
  - Antes del cierre definitivo se requiere:
    - alinear IDs/catálogo de paquetes frontend-backend,
    - repetir pago sandbox realmente aprobado,
    - observar `approved + applied=true` y refetch financiero posterior.

## QA final BUG-009 (2026-06-02)
- Frontend pudo abrir el checkout sandbox y navegar hasta la pantalla de pago.
- La compra con tarjeta de prueba termino en fallo del proveedor; no se alcanzo `approved`.
- La ruta de cuenta sandbox quedo bloqueada por reCAPTCHA en automatizacion.
- Estado final: backend correcto, pero BUG-009 no cierra hasta tener un pago sandbox realmente aprobado.

## Actualizacion frontend QA manual final ready (2026-06-02)
- Catalogo backend integrado en API mode:
  - `ClientPanel` ya consume `GET /api/v1/memberships/packages`.
  - `paquetesStore` queda solo como fallback cuando flags API estan `false`.
  - `PagoModal` envia `package_id` backend real del catalogo activo.
- `PaymentReturnPage` reforzada para QA manual:
  - estados visibles: `created`, `pending`, `approved + applied=true`, `approved + applied=false`, `rejected/failed`.
  - boton `Verificar estado del pago` para revalidaci?n manual contra `GET /api/v1/pagos/estadoexternal_reference=...`.
  - evidencia visible no sensible: `external_reference`, `status`, `applied`, `package_id`, `amount`, `credits`, `approved_at`, `applied_at`.
- Criterio de cierre formal BUG-009 no cambia:
  - requiere observar `approved + applied=true` desde backend y refetch financiero posterior.
  - si sandbox/proveedor no aprueba, bloqueo es externo y no por frontend.

## Actualizacion 2026-06-02 (PaymentReturnPage estados finales)
- `PaymentReturnPage` ya distingue sin falso exito:
  - `approved + applied=true` => exito real y refetch financiero.
  - `approved + applied=false` => pago aprobado, actualizacion backend pendiente.
  - `pending|in_process` => acreditacion pendiente, sin cr?ditos todavia.
  - `created + applied=false` => preferencia creada, esperando confirmacion.
  - `failed|rejected|cancelled` => pago no procesado, sin cambios de cr?ditos.
  - `/pago/failure` con `payment_id=null` + `external_reference` => consulta backend y muestra fallo controlado, sin exito falso.
- Regla vigente:
  - frontend siempre consulta `GET /api/v1/pagos/estadoexternal_reference=...`.
  - redirect `success|pending|failure` no confirma pago por si solo.
- Gap backend opcional:
  - para mensajes mas especificos por OXXO/SPEI/efectivo conviene exponer `payment_method_id`, `payment_type_id`, `status_detail` en `GET /pagos/estado`.
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 6793846 (feat: add payment tracking tests and implement payment UI logic)

## Nota de re-integracion frontend (2026-06-02)
- Paquetes en API mode vuelven a consumirse desde `GET /api/v1/memberships/packages`.
- `PagoModal` vuelve a crear checkout con backend y `PaymentReturnPage` vuelve a consultar estado por `external_reference`.

- PaymentReturnPage tiene vista amigable para usuario final y detalles t?cnicos colapsables para soporte.
- Paquetes & Pagos muestra "Estado de pagos recientes" con tracking local temporal desde este navegador.
- Tracking local no es source of truth; backend sigue decidiendo aprobado/aplicado.
<<<<<<< HEAD
=======
>>>>>>> 55c0f14 (feat: add membership and payment adapters with corresponding tests)
=======
>>>>>>> 6793846 (feat: add payment tracking tests and implement payment UI logic)
