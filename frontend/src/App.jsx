import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PageWrapper from '@/components/layout/PageWrapper'

import Home from '@/pages/Home'
import Clases from '@/pages/Clases'
import Suet from '@/pages/Suet'
import Flow from '@/pages/Flow'
import Nosotros from '@/pages/Nosotros'
import Contacto from '@/pages/Contacto'
import Reservar from '@/pages/Reservar'
import Login from '@/pages/Login'
import Registro from '@/pages/Registro'

import ClienteDashboard from '@/pages/cliente/ClienteDashboard'
import ClienteCalendario from '@/pages/cliente/ClienteCalendario'
import ClienteMisClases from '@/pages/cliente/ClienteMisClases'
import ClientePagos from '@/pages/cliente/ClientePagos'
import ClientePerfil from '@/pages/cliente/ClientePerfil'

import CoachPanel from '@/pages/coach/CoachPanel'
import CoachDashboard from '@/pages/coach/CoachDashboard'
import CoachMisClases from '@/pages/coach/CoachMisClases'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminPanel from '@/pages/admin/AdminPanel'
import AdminCoaches from '@/pages/admin/AdminCoaches'
import AdminUsuarios from '@/pages/admin/AdminUsuarios'
import AdminClases from '@/pages/admin/AdminClases'
import AdminPaquetes from '@/pages/admin/AdminPaquetes'
import AdminFinanzas from '@/pages/admin/AdminFinanzas'
import AdminReportes from '@/pages/admin/AdminReportes'

const DASHBOARD_PREFIXES = ['/cliente/', '/coach/', '/admin/']

function isDashboardRoute(pathname) {
  return DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p))
}

function AnimatedRoutes() {
  const location = useLocation()
  const dashboard = isDashboardRoute(location.pathname)

  if (dashboard) {
    return (
      <>
        <Navbar />
      <Routes location={location} key={location.pathname}>
        <Route path="/cliente/dashboard" element={<ProtectedRoute rolRequerido="cliente"><ClienteDashboard /></ProtectedRoute>} />
        <Route path="/cliente/calendario" element={<ProtectedRoute rolRequerido="cliente"><ClienteCalendario /></ProtectedRoute>} />
        <Route path="/cliente/mis-clases" element={<ProtectedRoute rolRequerido="cliente"><ClienteMisClases /></ProtectedRoute>} />
        <Route path="/cliente/pagos" element={<ProtectedRoute rolRequerido="cliente"><ClientePagos /></ProtectedRoute>} />
        <Route path="/cliente/perfil" element={<ProtectedRoute rolRequerido="cliente"><ClientePerfil /></ProtectedRoute>} />

        <Route path="/coach/dashboard" element={<ProtectedRoute rolRequerido="coach"><CoachPanel /></ProtectedRoute>} />
        <Route path="/coach/mis-clases" element={<ProtectedRoute rolRequerido="coach"><CoachMisClases /></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute rolRequerido="admin"><AdminPanel /></ProtectedRoute>} />
        <Route path="/admin/coaches" element={<ProtectedRoute rolRequerido="admin"><AdminCoaches /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute rolRequerido="admin"><AdminUsuarios /></ProtectedRoute>} />
        <Route path="/admin/clases" element={<ProtectedRoute rolRequerido="admin"><AdminClases /></ProtectedRoute>} />
        <Route path="/admin/paquetes" element={<ProtectedRoute rolRequerido="admin"><AdminPaquetes /></ProtectedRoute>} />
        <Route path="/admin/finanzas" element={<ProtectedRoute rolRequerido="admin"><AdminFinanzas /></ProtectedRoute>} />
        <Route path="/admin/reportes" element={<ProtectedRoute rolRequerido="admin"><AdminReportes /></ProtectedRoute>} />
      </Routes>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/clases" element={<PageWrapper><Clases /></PageWrapper>} />
          <Route path="/suet" element={<PageWrapper><Suet /></PageWrapper>} />
          <Route path="/flow" element={<PageWrapper><Flow /></PageWrapper>} />
          <Route path="/nosotros" element={<PageWrapper><Nosotros /></PageWrapper>} />
          <Route path="/contacto" element={<PageWrapper><Contacto /></PageWrapper>} />
          <Route path="/reservar" element={<PageWrapper><Reservar /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/registro" element={<PageWrapper><Registro /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
