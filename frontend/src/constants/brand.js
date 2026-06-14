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
 *    Los archivos PNG están en /publichttps://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/LOGO_YOGA3_ned3if.png
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

  //── Logos PNG (en /publichttps://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/LOGO_YOGA3_ned3if.png) ──────
  logos: {
    isotipo:     'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/CASA_SCARLATTA_ISOTIPO_mz2cxr.png', // monograma C/S
    wordmark:    'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472996/CASA_SCARLATTA_LOGO_onlyyy.png',    // "CASA SCARLATTA WELLNESS CENTER"
    slow:        'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/LOGO_SLOW_rvm3cv.png',              // cursiva "slow."
    slowIsotipo: 'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/SLOW_ISOTIPO_piojoa.png',           // onda decorativa slow.
    strydeX:     'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/STRYDE_X_T_bsgwov.png',             // wordmark "STRYDE X"
    isotipoSX:   'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/Isotipo_SX_wzpolg.png',             // isotipo >>X standalone
  },
}
