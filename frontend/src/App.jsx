import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
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

function AnimatedRoutes() {
  const location = useLocation()
  return (
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
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <AnimatedRoutes />
      <Footer />
    </BrowserRouter>
  )
}
