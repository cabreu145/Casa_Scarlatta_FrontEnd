import { Link } from 'react-router-dom'
import styles from './Button.module.css'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  to,
  onClick,
  disabled,
  type = 'button',
  className = '',
  ...rest
}) {
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    className,
  ].filter(Boolean).join(' ')

  if (to) {
    return <Link to={to} className={cls} {...rest}>{children}</Link>
  }

  if (href) {
    return <a href={href} className={cls} {...rest}>{children}</a>
  }

  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}
