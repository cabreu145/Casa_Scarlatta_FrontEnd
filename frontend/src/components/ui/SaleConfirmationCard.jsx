import { useMemo, useState } from 'react'
import { CheckCircle2, ImageIcon, MessageCircle, ReceiptText, X } from 'lucide-react'
import styles from './SaleConfirmationCard.module.css'

function money(value) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function translatePaymentMethod(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  return {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    other: 'Otro',
  }[raw] || raw || 'No definido'
}

function formatDateTime(value) {
  if (!value) return 'N/D'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function SaleConfirmationCard({
  folio,
  paymentMethod,
  dateTime,
  subtotalAmount,
  taxAmount,
  totalAmount,
  publicTicketImageUrl,
  publicTicketUrl,
  onViewTicket,
  onSendWhatsApp,
  onClose,
}) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const resolvedPublicUrl = useMemo(() => publicTicketImageUrl || publicTicketUrl || '', [publicTicketImageUrl, publicTicketUrl])

  const shareHint = useMemo(() => {
    if (publicTicketImageUrl) return 'ticket para compartir por WhatsApp Web.'
    if (publicTicketUrl) return 'Sin imagen público. Ticket público disponible.'
    return 'No hay link público de ticket disponible.'
  }, [publicTicketImageUrl, publicTicketUrl])
  const hasTax = Number(taxAmount ?? 0) > 0

  function handleViewTicket() {
    if (!resolvedPublicUrl) {
      setError('No hay link público disponible para este ticket.')
      return
    }
    setError('')
    onViewTicket?.()
  }

  function handleShare() {
    const normalized = String(phone ?? '').replace(/[^\d]/g, '')
    if (!normalized) {
      setError('Ingresa número telefónico.')
      return
    }
    if (!resolvedPublicUrl) {
      setError('No hay link público disponible para enviar el ticket por WhatsApp.')
      return
    }
    setError('')
    onSendWhatsApp?.(normalized)
  }

  return (
    <div className={styles.card} role="dialog" aria-modal="true" aria-label="Venta completada">
      <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Cerrar">
        <X size={17} />
      </button>

      <div className={styles.header}>
        <div className={styles.iconWrap} aria-hidden="true">
          <CheckCircle2 size={28} />
        </div>
        <div className={styles.headerText}>
          <div className={styles.kicker}>Venta completada</div>
          <h2 className={styles.title}>Ticket POS listo</h2>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <span>Folio</span>
          <strong>{folio || 'N/D'}</strong>
        </div>
        <div className={styles.summaryItem}>
          <span>Método</span>
          <strong>{translatePaymentMethod(paymentMethod)}</strong>
        </div>
        <div className={styles.summaryItem}>
          <span>Fecha / hora</span>
          <strong>{formatDateTime(dateTime)}</strong>
        </div>
      </div>

      {resolvedPublicUrl && (
        <div className={styles.preview}>
          <div className={styles.previewLabel}>
            <ImageIcon size={14} />
            Vista  del ticket
          </div>
          <div className={styles.previewFrame}>
            <img src={resolvedPublicUrl} alt="Ticket público" className={styles.previewImage} />
          </div>
        </div>
      )}

      <div className={styles.amounts}>
        <div className={styles.amountRow}>
          <span>Subtotal</span>
          <strong>{money(subtotalAmount)}</strong>
        </div>
        {hasTax && (
          <div className={styles.amountRow}>
            <span>Impuesto</span>
            <strong>{money(taxAmount)}</strong>
          </div>
        )}
        <div className={styles.amountRow + ' ' + styles.amountRowTotal}>
          <span>Total</span>
          <strong>{money(totalAmount)}</strong>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.primaryButton} type="button" onClick={handleViewTicket}>
          <ReceiptText size={16} />
          Ver ticket
        </button>
      </div>

      <div className={styles.whatsappBox}>
        <div className={styles.whatsappHeader}>
          <MessageCircle size={16} />
          Enviar por WhatsApp
        </div>
        <div className={styles.whatsappHint}>{shareHint}</div>
        <div className={styles.whatsappForm}>
          <input
            className={styles.input}
            placeholder="Número telefónico"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <button className={styles.secondaryButton} type="button" onClick={handleShare}>
            Enviar por WhatsApp
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.footer}>
        <button className={styles.ghostButton} type="button" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
