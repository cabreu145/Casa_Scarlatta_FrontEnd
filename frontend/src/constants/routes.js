/**
 * routes.js
 * ─────────────────────────────────────────────────────
 * Todas las rutas de la app en un solo lugar.
 *
 * ✅ CÓMO USAR:
 *    import { ROUTES } from '../constants/routes'
 *    navigate(ROUTES.cliente.dashboard)
 *    <Link to={ROUTES.clases}>Clases</Link>
 *
 * ❌ NUNCA escribas rutas como strings directamente en componentes.
 *    Si cambias una ruta, cámbiala aquí y se actualiza en toda la app.
 * ─────────────────────────────────────────────────────
 */

export const ROUTES = {
  //── Páginas públicas ───────────────────
  home:     '/',
  clases:   '/clases',
  stryde:   '/suet',
  slow:     '/flow',
  nosotros: '/nosotros',
  contacto: '/contacto',
  reservar: '/reservar',
  login:    '/login',
  registro: '/registro',

  //── Dashboard cliente ──────────────────
  cliente: {
    dashboard: '/cliente/dashboard',
    misClases: '/cliente/mis-clases',
    perfil:    '/cliente/perfil',
    pagos:     '/cliente/pagos',
  },

  //── Dashboard coach ────────────────────
  coach: {
    dashboard: '/coach/dashboard',
    misClases: '/coach/mis-clases',
  },

  //── Dashboard admin ────────────────────
  admin: {
    dashboard: '/admin/dashboard',
    paquetes:  '/admin/paquetes',
    coaches:   '/admin/coaches',
    clases:    '/admin/clases',
    usuarios:  '/admin/usuarios',
    finanzas:  '/admin/finanzas',
    reportes:  '/admin/reportes',
  },
}
