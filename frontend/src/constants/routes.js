/**
 * routes.js
 * Todas las rutas de la app en un solo lugar.
 */

export const ROUTES = {
  home: '/',
  clases: '/clases',
  stryde: '/suet',
  slow: '/flow',
  nosotros: '/nosotros',
  contacto: '/contacto',
  reservar: '/reservar',
  login: '/login',
  registro: '/registro',

  cliente: {
    dashboard: '/cliente/dashboard',
    misClases: '/cliente/mis-clases',
    perfil: '/cliente/perfil',
    pagos: '/cliente/pagos',
  },

  coach: {
    dashboard: '/coach/dashboard',
    misClases: '/coach/mis-clases',
  },

  cajero: {
    dashboard: '/cajero/dashboard',
  },

  admin: {
    dashboard: '/admin/dashboard',
    paquetes: '/admin/paquetes',
    coaches: '/admin/coaches',
    clases: '/admin/clases',
    usuarios: '/admin/usuarios',
    finanzas: '/admin/finanzas',
    reportes: '/admin/reportes',
  },
}
