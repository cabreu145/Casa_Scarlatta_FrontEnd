import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PageWrapper from '@/components/layout/PageWrapper'

import ScrollToTop from '@/components/layout/ScrollToTop'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'

const Clases      = lazy(() => import('@/pages/Clases'))
const Suet        = lazy(() => import('@/pages/Suet'))
const Flow        = lazy(() => import('@/pages/Flow'))
const Yoga        = lazy(() => import('@/pages/Yoga'))
const Nosotros    = lazy(() => import('@/pages/Nosotros'))
const Contacto    = lazy(() => import('@/pages/Contacto'))
const Login       = lazy(() => import('@/pages/Login'))
const Registro    = lazy(() => import('@/pages/Registro'))
const RecuperarContrasena = lazy(() => import('@/pages/RecuperarContrasena'))
const NuevaContrasena     = lazy(() => import('@/pages/NuevaContrasena'))
const Reservar    = lazy(() => import('@/pages/Reservar'))
const TerminosCondiciones = lazy(() => import('@/pages/TerminosCondiciones'))

const ClientPanel = lazy(() => import('@/pages/cliente/ClientPanel'))
const CoachPanel  = lazy(() => import('@/pages/coach/CoachPanel'))
const AdminPanel  = lazy(() => import('@/pages/admin/AdminPanel'))
const PaymentReturnPage = lazy(() => import('@/features/pagos/PaymentReturnPage'))
const EquipmentReservationDebugPage = lazy(() => import('@/features/reservas/EquipmentReservationDebugPage'))

const DASHBOARD_PREFIXES = ['/cliente/', '/coach/', '/admin/', '/cajero/']

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
        <Suspense fallback={
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100vh', fontFamily: 'var(--font-body)',
            fontSize: 14, color: 'var(--text-muted)'
          }}>
            Cargando...
          </div>
        }>
          <Routes location={location} key={location.pathname}>
            <Route path="/cliente/dashboard" element={<ProtectedRoute rolRequerido="cliente"><ClientPanel /></ProtectedRoute>} />
            <Route path="/cliente/calendario" element={<Navigate to="/cliente/dashboard" replace />} />
            <Route path="/cliente/mis-clases" element={<Navigate to="/cliente/dashboard" replace />} />
            <Route path="/cliente/pagos" element={<Navigate to="/cliente/dashboard" replace />} />
            <Route path="/cliente/perfil" element={<Navigate to="/cliente/dashboard" replace />} />

            <Route path="/coach/dashboard" element={<ProtectedRoute rolRequerido="coach"><CoachPanel /></ProtectedRoute>} />
            <Route path="/coach/mis-clases" element={<Navigate to="/coach/dashboard" replace />} />

            <Route path="/admin/dashboard" element={<ProtectedRoute rolRequerido="admin"><AdminPanel /></ProtectedRoute>} />
            <Route path="/cajero/dashboard" element={<ProtectedRoute rolRequerido="cajero_pos"><AdminPanel initialSection="pos" /></ProtectedRoute>} />
            <Route path="/admin/coaches"  element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/usuarios" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/clases"   element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/paquetes" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/finanzas" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/gastos"   element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/cortes"   element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/reportes" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/pago/success" element={<PaymentReturnPage />} />
            <Route path="/pago/pending" element={<PaymentReturnPage />} />
            <Route path="/pago/failure" element={<PaymentReturnPage />} />
            {import.meta.env.DEV && <Route path="/__debug/equipment-panel" element={<EquipmentReservationDebugPage />} />}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <AnimatePresence mode="sync">
        <Suspense fallback={
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100vh', fontFamily: 'var(--font-body)',
            fontSize: 14, color: 'var(--text-muted)'
          }}>
            Cargando...
          </div>
        }>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/clases" element={<PageWrapper><Clases /></PageWrapper>} />
            <Route path="/stryde-x" element={<PageWrapper><Suet /></PageWrapper>} />
            <Route path="/slow" element={<PageWrapper><Flow /></PageWrapper>} />
            <Route path="/yoga" element={<PageWrapper><Yoga /></PageWrapper>} />
            <Route path="/nosotros" element={<PageWrapper><Nosotros /></PageWrapper>} />
            <Route path="/contacto" element={<PageWrapper><Contacto /></PageWrapper>} />
            <Route path="/terminos-y-condiciones" element={<PageWrapper><TerminosCondiciones /></PageWrapper>} />
            <Route path="/reservar" element={<PageWrapper><Reservar /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/registro" element={<PageWrapper><Registro /></PageWrapper>} />
            <Route path="/recuperar-contrasena" element={<PageWrapper><RecuperarContrasena /></PageWrapper>} />
            <Route path="/nueva-contrasena" element={<PageWrapper><NuevaContrasena /></PageWrapper>} />
            <Route path="/pago/success" element={<PaymentReturnPage />} />
            <Route path="/pago/pending" element={<PaymentReturnPage />} />
            <Route path="/pago/failure" element={<PaymentReturnPage />} />
            {import.meta.env.DEV && <Route path="/__debug/equipment-panel" element={<EquipmentReservationDebugPage />} />}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
