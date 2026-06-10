import styles from '../AdminPanel.module.css'

const sizeClassMap = {
  default: '',
  sm: styles.modalSm,
  lg: styles.modalLg,
}

export default function PosEntityModal({
  title,
  ariaLabel,
  onClose,
  children,
  footer,
  className = '',
  size = 'default',
}) {
  const modalClassName = [styles.modal, sizeClassMap[size], className].filter(Boolean).join(' ')

  return (
    <div
      className={modalClassName}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.modalHeader}>
        <div className={styles.modalTitle}>{title}</div>
        <button className={styles.modalClose} type="button" aria-label="Cerrar" onClick={onClose}>×</button>
      </div>

      <div className={styles.modalBody}>
        {children}
      </div>

      {footer && <div className={styles.modalFooter}>{footer}</div>}
    </div>
  )
}
