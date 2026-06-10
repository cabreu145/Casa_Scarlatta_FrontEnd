import { Component } from 'react'
import { logger } from './loggerService'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    logger.error('React error boundary activado', {
      error:     error?.message,
      stack:     error?.stack,
      component: info?.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          height:         '100vh',
          fontFamily:     'var(--font-body)',
          color:          'var(--text-primary)',
          gap:            16,
          padding:        24,
          textAlign:      'center',
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Algo salió mal</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400 }}>
            Ocurrió un error inesperado. Por favor recarga la página.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding:      '10px 24px',
              borderRadius: 8,
              border:       'none',
              cursor:       'pointer',
              fontFamily:   'var(--font-body)',
              fontSize:     14,
              fontWeight:   600,
              background:   'var(--wine, #7B1E22)',
              color:        '#fff',
            }}
          >
            Recargar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
