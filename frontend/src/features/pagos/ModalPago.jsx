/**
 * ModalPago.jsx
 * ─────────────────────────────────────────────────────
 * Modal de confirmación de pago para el POS.
 * Se abre al presionar "Cobrar" con la orden actual.
 *
 * Métodos de pago soportados:
 *   - Efectivo: muestra cambio a entregar
 *   - Tarjeta: instrucciones de terminal
 *   - Transferencia: instrucciones básicas
 *
 * ✅ CÓMO CONECTAR BACKEND:
 *    En handleConfirmar(), después de registrar
 *    en el store, hacer httpPost(ENDPOINTS.transacciones)
 *
 * Props:
 *   total    {number}   - Total a cobrar con IVA
 *   items    {Item[]}   - Items de la orden
 *   onPagar  {function} - Callback con { metodoPago, montoPagado, cambio }
 *   onCerrar {function} - Cerrar el modal sin pagar
 * ─────────────────────────────────────────────────────
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './ModalPago.module.css'

const METODOS = ['efectivo', 'tarjeta', 'transferencia']

function ModalPago({ total, items, onPagar, onCerrar }) {
  const [metodo, setMetodo]           = useState('efectivo')
  const [montoRecibido, setMonto]     = useState('')
  const [confirmando, setConfirmando] = useState(false)

  const monto      = parseFloat(montoRecibido) || 0
  const cambio     = Math.max(0, monto - total)
  const montoValido = metodo !== 'efectivo' || monto >= total

  const handleConfirmar = async () => {
    if (!montoValido) return
    setConfirmando(true)
    await onPagar({
      metodoPago:  metodo,
      montoPagado: metodo === 'efectivo' ? monto : total,
      cambio:      metodo === 'efectivo' ? cambio : 0,
    })
    setConfirmando(false)
  }

  return createPortal(
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <h2>Confirmar pago</h2>
        <p className={styles.totalLabel}>
          Total
          <strong>${total.toLocaleString()}</strong>
        </p>

        {/* Selector de método */}
        <div className={styles.metodos}>
          {METODOS.map(m => (
            <button
              key={m}
              className={metodo === m ? styles.metodoActivo : styles.metodo}
              onClick={() => setMetodo(m)}
            >
              {m === 'efectivo'      && '💵 Efectivo'}
              {m === 'tarjeta'       && '💳 Tarjeta'}
              {m === 'transferencia' && '📱 Transferencia'}
            </button>
          ))}
        </div>

        {/* Efectivo */}
        {metodo === 'efectivo' && (
          <div className={styles.efectivoWrap}>
            <label>Monto recibido</label>
            <input
              type="number"
              placeholder={`Mínimo $${total}`}
              value={montoRecibido}
              onChange={e => setMonto(e.target.value)}
              autoFocus
            />
            {monto >= total && (
              <div className={styles.cambio}>
                <span>Cambio a entregar</span>
                <strong>${cambio.toLocaleString()}</strong>
              </div>
            )}
            {monto > 0 && monto < total && (
              <p className={styles.errorMonto}>
                El monto es menor al total.
              </p>
            )}
          </div>
        )}

        {/* Tarjeta */}
        {metodo === 'tarjeta' && (
          <div className={styles.instrucciones}>
            <span className={styles.iconTerminal}>💳</span>
            <p>Inserte o acerque la tarjeta en la terminal.</p>
            <p className={styles.sub}>Confirme cuando el pago sea aprobado.</p>
          </div>
        )}

        {/* Transferencia */}
        {metodo === 'transferencia' && (
          <div className={styles.instrucciones}>
            <span className={styles.iconTerminal}>📱</span>
            <p>Solicite al cliente realizar la transferencia a:</p>
            <div className={styles.datosTransf}>
              <span>Banco: BBVA</span>
              <span>Cuenta: 1234 5678 9012 3456</span>
              <span>CLABE: 012 345 678 901 234 567</span>
              <span>Titular: Casa Scarlatta SC</span>
            </div>
            <p className={styles.sub}>Confirme cuando reciba el comprobante.</p>
          </div>
        )}

        {/* Acciones */}
        <div className={styles.acciones}>
          <button
            className={styles.btnConfirmar}
            onClick={handleConfirmar}
            disabled={!montoValido || confirmando}
          >
            {confirmando ? 'Procesando...' : '✓ Confirmar pago'}
          </button>
          <button className={styles.btnCancelar} onClick={onCerrar}>
            Cancelar
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}

export default ModalPago
