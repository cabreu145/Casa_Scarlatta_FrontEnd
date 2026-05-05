/**
 * PagoModal.jsx
 * ─────────────────────────────────────────────────────
 * Modal de flujo de pago simulado (MercadoPago).
 * Listo para conectar al backend: busca el comentario
 * "TODO: BACKEND" para saber qué reemplazar.
 *
 * Usado en: ClientPanel (sección Paquetes & Pagos)
 * Depende de: usuariosService, authStore, usuariosStore
 * ─────────────────────────────────────────────────────
 */
import { useState } from 'react'
import { asignarPaqueteService } from '@/services/usuariosService'
import { useAuth } from '@/context/AuthContext'
import s from './PagoModal.module.css'

const STEPS = ['resumen', 'pago', 'procesando', 'exito']

export default function PagoModal({ paquete, onClose, onSuccess }) {
  const { usuario, actualizarClasesPaquete, actualizarPerfil } = useAuth()
  const [step, setStep]       = useState('resumen')
  const [metodo, setMetodo]   = useState('tarjeta')
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    numero: '',
    nombre: '',
    vencimiento: '',
    cvv: '',
  })

  function handleFormChange(e) {
    const { name, value } = e.target
    let v = value

    if (name === 'numero') {
      v = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
    }
    if (name === 'vencimiento') {
      v = value.replace(/\D/g, '').slice(0, 4)
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
    }
    if (name === 'cvv') {
      v = value.replace(/\D/g, '').slice(0, 4)
    }

    setForm((f) => ({ ...f, [name]: v }))
  }

  async function handlePagar() {
    setError('')

    // Validaciones básicas de tarjeta
    if (metodo === 'tarjeta') {
      const numLimpio = form.numero.replace(/\s/g, '')
      if (numLimpio.length < 16)      return setError('Número de tarjeta inválido')
      if (!form.nombre.trim())         return setError('Ingresa el nombre del titular')
      if (form.vencimiento.length < 5) return setError('Fecha de vencimiento inválida')
      if (form.cvv.length < 3)         return setError('CVV inválido')
    }

    setStep('procesando')

    // ── TODO: BACKEND ────────────────────────────────────────────────────────
    // Reemplaza este bloque con la llamada real a tu backend:
    //
    // const preferencia = await fetch('/api/pagos/crear-preferencia', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     paqueteId: paquete.id,
    //     userId:    usuario.id,
    //     monto:     paquete.precio,
    //     nombre:    paquete.nombre,
    //   }),
    // }).then(r => r.json())
    //
    // Luego redirige al usuario al checkout de MercadoPago:
    // window.location.href = preferencia.init_point
    //
    // O usa el SDK de MercadoPago Bricks para mostrar el formulario
    // embebido directamente aquí sin redirigir.
    // ────────────────────────────────────────────────────────────────────────

    // Simulación de procesamiento (2 segundos)
    await new Promise((r) => setTimeout(r, 2200))

    // Asignar paquete al usuario en los stores
    const resultado = await asignarPaqueteService(usuario.id, paquete, 'online')
    actualizarClasesPaquete(paquete.clases === 0 ? 999 : paquete.clases)
    actualizarPerfil({ paquete: paquete.nombre })
    console.log('resultado pago:', resultado)
    console.log('usuario.id:', usuario.id)
    setStep('exito')
    // onSuccess?.()
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget && step !== 'procesando') onClose()
  }

  return (
    <div className={s.overlay} onClick={handleOverlayClick}>
      <div className={s.modal}>

        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <div className={s.mpLogo}>
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#009EE3"/>
                <path d="M8 20C8 13.373 13.373 8 20 8s12 5.373 12 12-5.373 12-12 12S8 26.627 8 20z" fill="#009EE3"/>
                <path d="M20 12c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm3.5 11.5l-5-3V13h2v6.5l4 2.5-1 1.5z" fill="white"/>
              </svg>
              MercadoPago
            </div>
            <span className={s.headerSub}>Pago seguro</span>
          </div>
          {step !== 'procesando' && step !== 'exito' && (
            <button className={s.closeBtn} onClick={onClose}>✕</button>
          )}
        </div>

        {/* ── PASO: RESUMEN ── */}
        {step === 'resumen' && (
          <div className={s.body}>
            <div className={s.stepLabel}>Resumen de compra</div>
            <div className={s.paqueteCard}>
              <div className={s.paqueteInfo}>
                <div className={s.paqueteNombre}>{paquete.nombre}</div>
                <div className={s.paqueteDetalle}>
                  {paquete.clases === 0 ? 'Clases ilimitadas' : `${paquete.clases} clases`} · {paquete.vigencia}
                </div>
                <div className={s.paqueteBeneficios}>
                  {(paquete.beneficios || []).slice(0, 3).map((b, i) => (
                    <span key={i} className={s.beneficio}>✓ {b}</span>
                  ))}
                </div>
              </div>
              <div className={s.paquetePrecio}>
                <div className={s.precioNum}>${paquete.precio.toLocaleString()}</div>
                <div className={s.precioSub}>MXN</div>
              </div>
            </div>

            <div className={s.divider} />

            <div className={s.totalRow}>
              <span>Total a pagar</span>
              <span className={s.totalNum}>${paquete.precio.toLocaleString()} MXN</span>
            </div>

            <button className={s.btnPrimary} onClick={() => setStep('pago')}>
              Continuar al pago
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button className={s.btnGhost} onClick={onClose}>Cancelar</button>
          </div>
        )}

        {/* ── PASO: PAGO ── */}
        {step === 'pago' && (
          <div className={s.body}>
            <button className={s.backBtn} onClick={() => setStep('resumen')}>
              ← Volver
            </button>
            <div className={s.stepLabel}>Método de pago</div>

            {/* Selector de método */}
            <div className={s.metodoGrid}>
              {[
                { key: 'tarjeta', label: 'Tarjeta', icon: '💳' },
                { key: 'oxxo',    label: 'OXXO',    icon: '🏪' },
                { key: 'transfer',label: 'Transferencia', icon: '🏦' },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  className={`${s.metodoBtn} ${metodo === key ? s.metodoBtnActive : ''}`}
                  onClick={() => setMetodo(key)}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Formulario tarjeta */}
            {metodo === 'tarjeta' && (
              <div className={s.formWrap}>
                <div className={s.formGroup}>
                  <label className={s.label}>Número de tarjeta</label>
                  <input
                    className={s.input}
                    name="numero"
                    placeholder="1234 5678 9012 3456"
                    value={form.numero}
                    onChange={handleFormChange}
                    maxLength={19}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Nombre del titular</label>
                  <input
                    className={s.input}
                    name="nombre"
                    placeholder="Como aparece en la tarjeta"
                    value={form.nombre}
                    onChange={handleFormChange}
                  />
                </div>
                <div className={s.formRow}>
                  <div className={s.formGroup}>
                    <label className={s.label}>Vencimiento</label>
                    <input
                      className={s.input}
                      name="vencimiento"
                      placeholder="MM/AA"
                      value={form.vencimiento}
                      onChange={handleFormChange}
                      maxLength={5}
                    />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.label}>CVV</label>
                    <input
                      className={s.input}
                      name="cvv"
                      placeholder="123"
                      value={form.cvv}
                      onChange={handleFormChange}
                      maxLength={4}
                      type="password"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OXXO */}
            {metodo === 'oxxo' && (
              <div className={s.altMetodo}>
                <div className={s.altMetodoIcon}>🏪</div>
                <div className={s.altMetodoTitle}>Pago en OXXO</div>
                <p className={s.altMetodoDesc}>
                  Al confirmar, recibirás un código de barras para pagar en cualquier tienda OXXO.
                  El pago se acredita en hasta 24 horas.
                </p>
                {/* TODO: BACKEND — generar referencia OXXO con MercadoPago */}
              </div>
            )}

            {/* Transferencia */}
            {metodo === 'transfer' && (
              <div className={s.altMetodo}>
                <div className={s.altMetodoIcon}>🏦</div>
                <div className={s.altMetodoTitle}>Transferencia bancaria</div>
                <p className={s.altMetodoDesc}>
                  Al confirmar, recibirás los datos bancarios para realizar tu transferencia SPEI.
                  El pago se acredita en minutos.
                </p>
                {/* TODO: BACKEND — generar CLABE con MercadoPago */}
              </div>
            )}

            {error && <div className={s.errorMsg}>⚠️ {error}</div>}

            <div className={s.secureNote}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Pago 100% seguro con encriptación SSL
            </div>

            <button className={s.btnPrimary} onClick={handlePagar}>
              Pagar ${paquete.precio.toLocaleString()} MXN
            </button>
          </div>
        )}

        {/* ── PASO: PROCESANDO ── */}
        {step === 'procesando' && (
          <div className={s.body}>
            <div className={s.procesandoWrap}>
              <div className={s.spinner} />
              <div className={s.procesandoTitle}>Procesando pago…</div>
              <div className={s.procesandoSub}>No cierres esta ventana</div>
            </div>
          </div>
        )}

        {/* ── PASO: ÉXITO ── */}
        {step === 'exito' && (
          <div className={s.body}>
            <div className={s.exitoWrap}>
              <div className={s.exitoIcon}>✓</div>
              <div className={s.exitoTitle}>¡Pago exitoso!</div>
              <div className={s.exitoSub}>
                Tu paquete <strong>{paquete.nombre}</strong> ya está activo.
                {paquete.clases === 0
                  ? ' Tienes clases ilimitadas.'
                  : ` Tienes ${paquete.clases} clases disponibles.`}
              </div>
              <button className={s.btnPrimary} onClick={onClose}>
                Ir a reservar clases
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
