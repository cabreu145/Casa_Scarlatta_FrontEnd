import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import styles from './CompraModal.module.css'

export default function CompraModal({ paquete, compartido, partnerNombre, onClose }) {
  const { usuario, actualizarPerfil } = useAuth()
  const navigate = useNavigate()

  const tieneMetodoPago = !!usuario?.metodoPago
  const [step, setStep] = useState('detalle')

  const [cardNum, setCardNum] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')

  const clasesDisplay = paquete.clases === 0 ? '∞' : paquete.clases
  const clasesLabel = paquete.clases === 0 ? 'Ilimitadas' : paquete.clases === 1 ? 'Clase' : 'Clases'
  const clasesCompradas = paquete.clases === 0 ? 999 : compartido ? Math.floor(paquete.clases / 2) : paquete.clases
  const tipo = compartido && partnerNombre ? `Compartido con ${partnerNombre}` : 'Individual'

  const completarCompra = (metodoPago) => {
    actualizarPerfil({
      paquete: paquete.nombre,
      clasesPaquete: clasesCompradas,
      clasesPaqueteTotal: clasesCompradas,
      paqueteInfo: {
        fechaCompra: new Date().toISOString().split('T')[0],
        estado: 'Activo',
        tipo,
      },
      ...(metodoPago ? { metodoPago } : {}),
    })
    setStep('exito')
  }

  const handleContinuar = () => {
    if (tieneMetodoPago) {
      completarCompra(null)
    } else {
      setStep('metodo')
    }
  }

  const formatCardNum = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExp = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  const handlePagar = () => {
    if (!cardNum || !cardExp || !cardCvv || !cardName) {
      toast.error('Completa todos los campos')
      return
    }
    const ultimos4 = cardNum.replace(/\s/g, '').slice(-4)
    completarCompra({ tipo: 'tarjeta', ultimos4, marca: 'Visa' })
  }

  const handleCerrar = () => {
    if (step === 'exito') navigate('/cliente/pagos')
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) handleCerrar() }}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={handleCerrar} aria-label="Cerrar">✕</button>

        {/* ── Step: detalle ── */}
        {step === 'detalle' && (
          <>
            <div className={styles.countBlock}>
              <span className={styles.countNum}>{clasesDisplay}</span>
              <span className={styles.countLabel}>{clasesLabel}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.body}>
              <h2 className={styles.nombre}>{paquete.nombre}</h2>
              <div className={styles.priceRow}>
                <span className={styles.price}>${paquete.precio.toLocaleString()}</span>
                <span className={styles.priceSuffix}>
                  {' '}MX {paquete.categoria === 'mensual' ? '/mes' : `/ ${paquete.vigencia}`}
                </span>
              </div>
              <ul className={styles.beneficios}>
                {paquete.beneficios.map((b) => (
                  <li key={b} className={styles.beneficio}>
                    <span className={styles.check}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              {compartido && partnerNombre && (
                <p className={styles.sharedNote}>
                  👥 Compartido con <strong>{partnerNombre}</strong> · {clasesCompradas} clases para ti
                </p>
              )}
              {tieneMetodoPago && (
                <div className={styles.savedCard}>
                  <span className={styles.savedCardIcon}>💳</span>
                  <span className={styles.savedCardText}>
                    {usuario.metodoPago.marca} •••• {usuario.metodoPago.ultimos4}
                  </span>
                </div>
              )}
              <button className={styles.ctaPrimary} onClick={handleContinuar}>
                {tieneMetodoPago ? `Pagar $${paquete.precio.toLocaleString()} MX` : 'Agregar método de pago'}
              </button>
            </div>
          </>
        )}

        {/* ── Step: metodo de pago ── */}
        {step === 'metodo' && (
          <div className={styles.body}>
            <div className={styles.mpHeader}>
              <h2 className={styles.methodTitle}>Método de pago</h2>
              <p className={styles.methodSub}>Ingresa los datos de tu tarjeta de forma segura</p>
            </div>
            <div className={styles.mpBadge}>
              <span className={styles.mpPowered}>Procesado por</span>
              <span className={styles.mpLogo}>MercadoPago</span>
            </div>
            <div className={styles.cardForm}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Número de tarjeta</label>
                <input
                  className={styles.fieldInput}
                  placeholder="0000 0000 0000 0000"
                  value={cardNum}
                  onChange={(e) => setCardNum(formatCardNum(e.target.value))}
                  maxLength={19}
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Vencimiento</label>
                  <input
                    className={styles.fieldInput}
                    placeholder="MM/AA"
                    value={cardExp}
                    onChange={(e) => setCardExp(formatExp(e.target.value))}
                    maxLength={5}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>CVV</label>
                  <input
                    className={styles.fieldInput}
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    maxLength={3}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Nombre en la tarjeta</label>
                <input
                  className={styles.fieldInput}
                  placeholder="Como aparece en la tarjeta"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.pagoSummary}>
              <span className={styles.summaryNombre}>{paquete.nombre}</span>
              <span className={styles.summaryPrecio}>${paquete.precio.toLocaleString()} MX</span>
            </div>
            <button className={styles.ctaPrimary} onClick={handlePagar}>
              Pagar ${paquete.precio.toLocaleString()} MX
            </button>
            <button className={styles.ctaBack} onClick={() => setStep('detalle')}>
              ← Volver
            </button>
          </div>
        )}

        {/* ── Step: exito ── */}
        {step === 'exito' && (
          <div className={styles.exitoContainer}>
            <div className={styles.exitoIcon}>✓</div>
            <h2 className={styles.exitoTitle}>¡Compra exitosa!</h2>
            <p className={styles.exitoSub}>
              Tu paquete <strong>{paquete.nombre}</strong> ya está activo.
            </p>
            {clasesCompradas !== 999 && (
              <p className={styles.exitoClases}>{clasesCompradas} clases disponibles</p>
            )}
            {clasesCompradas === 999 && (
              <p className={styles.exitoClases}>Clases ilimitadas activadas</p>
            )}
            <button className={styles.ctaPrimary} style={{ marginTop: 8 }} onClick={handleCerrar}>
              Ir a mis paquetes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
