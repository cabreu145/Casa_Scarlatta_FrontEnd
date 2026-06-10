/**
 * brand.js
 * ─────────────────────────────────────────────────────
 * Identidad visual oficial de Casa Scarlatta.
 *
 * ✅ CÓMO USAR:
 *    Si quieres cambiar un color, tipografía o logo,
 *    cámbialo aquí y se actualizará en toda la app.
 *
 * ✅ LOGOS:
 *    Los archivos PNG están en /public/brand/
 *    Úsalos así: <img src={BRAND.logos.isotipo} />
 * ─────────────────────────────────────────────────────
 */

export const BRAND = {
  nombre:    'Casa Scarlatta',
  subtitulo: 'Wellness Center',
  slogan:    'Equilibrio entre fluidez y fuerza',

  //── Colores oficiales ──────────────────
  colores: {
    vino:       '#7B1E22', // principal — botones, acentos, nav
    rosa:       '#E07ABB', // slow. — cursiva, acentos suaves
    blush:      '#F3E6E3', // fondo claro, navbar, cards
    taupe:      '#A69A93', // labels, texto secundario
    negroCs:    '#1A1A1A', // fondo oscuro — Stryde X, sidebar
    rojoStryde: '#C0152A', // rojo — wordmark Stryde X
    crema:      '#F5EDE8', // fondo principal de la app
  },

  //── Tipografía oficial ─────────────────
  tipografia: {
    display: "'Cinzel', serif",          // títulos, headings de sección
    body:    "'Montserrat', sans-serif", // párrafos, botones, nav
  },

  //── Logos PNG (en /public/brand/) ──────
  logos: {
    isotipo:     '/brand/CASA_SCARLATTA_ISOTIPO.png', // monograma C/S
    wordmark:    '/brand/CASA_SCARLATTA_LOGO.png',    // "CASA SCARLATTA WELLNESS CENTER"
    slow:        '/brand/LOGO_SLOW.png',              // cursiva "slow."
    slowIsotipo: '/brand/SLOW_ISOTIPO.png',           // onda decorativa slow.
    strydeX:     '/brand/STRYDE_X_T.png',             // wordmark "STRYDE X"
    isotipoSX:   '/brand/Isotipo_SX.png',             // isotipo >>X standalone
  },
}
