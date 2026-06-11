import { Navigate, useLocation } from 'react-router-dom'

export default function NuevaContrasena() {
  const location = useLocation()
  const search = location.search || ''
  return <Navigate to={`/recuperar-contrasena${search}`} replace />
}
