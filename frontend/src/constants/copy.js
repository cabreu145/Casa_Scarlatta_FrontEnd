/**
 * copy.js
 * ─────────────────────────────────────────────────────
 * Todos los textos visibles de la interfaz.
 *
 * ✅ CÓMO USAR:
 *    import { COPY } from '../constants/copy'
 *    <h1>{COPY.home.heroTagline}</h1>
 *
 * ✅ Si necesitas cambiar cualquier texto de la app,
 *    búscalo aquí por sección. No busques en los JSX.
 * ─────────────────────────────────────────────────────
 */

export const COPY = {

  //── Navegación ─────────────────────────
  nav: {
    inicio:   'Inicio',
    clases:   'Clases',
    stryde:   'Stryde',
    slow:     'Slow',
    nosotros: 'Nosotros',
    contacto: 'Contacto',
    login:    'Iniciar sesión',
  },

  //── Home ───────────────────────────────
  home: {
    heroTagline: 'EQUILIBRIO ENTRE FLUIDEZ Y FUERZA',
    heroSub:     'Estudio de movimiento enfocado en el bienestar integral',
    heroCta:     'Reservar',
    disciplinas: 'NUESTRAS DISCIPLINAS',
    membresias:  'TU EXPERIENCIA EN CASA SCARLATTA',
  },

  //── Disciplina slow. ───────────────────
  slow: {
    nombre:      'slow.',
    tagline:     'Fluye. Respira. Conecta contigo.',
    descripcion: 'Movimiento consciente que te ayuda a conectar contigo, respirar y encontrar equilibrio.',
    tags:        'Movimiento · Respiración · Presencia',
    cta:         'Ver clases slow.',
    concepto:    'MÁS QUE ENTRENAMIENTO, ES ALINEACIÓN.',
    slogan:      'TU RITMO. TU ESPACIO. TU BIENESTAR.',
  },

  //── Disciplina STRYDE X ────────────────
  strydeX: {
    nombre:      'STRYDE X',
    tagline:     'Stronger Every Stryde',
    descripcion: 'Entrenamiento de alta intensidad que combina fuerza y cardio para llevar tu rendimiento al siguiente nivel.',
    tags:        'Fuerza · Resistencia · Disciplina',
    cta:         'Ver clases STRYDE X',
    concepto:    'LA FUERZA NO SE ENCUENTRA. SE CONSTRUYE.',
    slogan:      'TODO EN UNA SESIÓN. MÁXIMO RENDIMIENTO.',
  },

  //── Autenticación ──────────────────────
  auth: {
    login:         'Iniciar sesión',
    registro:      'Crear cuenta',
    subtitulo:     'Tu espacio. Tu ritmo. Tu bienestar.',
    bienvenida:    'Bienvenido a tu espacio de equilibrio.',
    emailLabel:    'Correo electrónico',
    passwordLabel: 'Contraseña',
    nombreLabel:   'Nombre completo',
  },

  //── Dashboard cliente ──────────────────
  cliente: {
    titulo:    'Mi Dashboard',
    misClases: 'Mis Clases',
    miPerfil:  'Mi Perfil',
    pagos:     'Pagos y Paquetes',
  },

  //── Dashboard coach ────────────────────
  coach: {
    titulo:    'Dashboard Coach',
    misClases: 'Mis Clases',
  },

  //── Dashboard admin ────────────────────
  admin: {
    titulo:   'Panel Admin',
    paquetes: 'Paquetes',
    coaches:  'Coaches',
    clases:   'Clases',
    usuarios: 'Usuarios',
    finanzas: 'Finanzas',
    reportes: 'Reportes',
  },

  //── Estados y mensajes ─────────────────
  estados: {
    cargando:      'Cargando...',
    sinClases:     'No hay clases disponibles',
    errorGeneral:  'Algo salió mal. Intenta de nuevo.',
    reservaExito:  '¡Clase reservada con éxito!',
    cancelaExito:  'Reserva cancelada',
    sinResultados: 'No se encontraron resultados',
  },
}
