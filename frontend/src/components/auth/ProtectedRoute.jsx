import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const rolDashboard = {
  cliente: '/cliente/dashboard',
  coach: '/coach/dashboard',
  admin: '/admin/dashboard',
}

export default function ProtectedRoute({ children, rolRequerido }) {
  const { isAuthenticated, usuario, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        fontFamily: 'var(--font-body)',
        color: 'var(--text-secondary)',
      }}>
        Cargando...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (rolRequerido && usuario?.rol !== rolRequerido) {
    const destino = rolDashboard[usuario?.rol] || '/login'
    return <Navigate to={destino} replace />
  }

  return children
}
