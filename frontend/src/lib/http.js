/**
 * http.js
 * ─────────────────────────────────────────────────────
 * Cliente HTTP preconfigurado para llamadas al backend.
 *
 * ✅ CÓMO ACTIVAR CUANDO EL BACKEND ESTÉ LISTO:
 *    1. Asegúrate de que BASE_URL en constants/api.js
 *       apunte al servidor correcto
 *    2. Descomenta las líneas marcadas con [ACTIVAR]
 *    3. Los servicios en /services/ empezarán a hacer
 *       llamadas reales automáticamente
 *
 * Estado actual: preparado pero sin activar (mock)
 * ─────────────────────────────────────────────────────
 */

// El token se leerá de localStorage cuando haya autenticación JWT real
function getToken() {
  return localStorage.getItem('token') ?? null
}

/**
 * Realiza una petición GET al backend.
 * @param {string} endpoint - URL completa del endpoint
 * @returns {Promise<any>} Datos de la respuesta
 */
export async function httpGet(endpoint) {
  // [ACTIVAR cuando haya backend]
  // const res = await fetch(endpoint, {
  //   headers: { Authorization: `Bearer ${getToken()}` },
  // })
  // if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  // return res.json()

  return null
}

/**
 * Realiza una petición POST al backend.
 * @param {string} endpoint - URL completa del endpoint
 * @param {object} body - Datos a enviar
 * @returns {Promise<any>} Datos de la respuesta
 */
export async function httpPost(endpoint, body) {
  // [ACTIVAR cuando haya backend]
  // const res = await fetch(endpoint, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Authorization: `Bearer ${getToken()}`,
  //   },
  //   body: JSON.stringify(body),
  // })
  // if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  // return res.json()

  return null
}

/**
 * Realiza una petición PUT al backend (actualizar recurso existente).
 * @param {string} endpoint - URL completa del endpoint
 * @param {object} body - Datos actualizados
 * @returns {Promise<any>} Datos de la respuesta
 */
export async function httpPut(endpoint, body) {
  // [ACTIVAR cuando haya backend]
  // const res = await fetch(endpoint, {
  //   method: 'PUT',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Authorization: `Bearer ${getToken()}`,
  //   },
  //   body: JSON.stringify(body),
  // })
  // if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  // return res.json()

  return null
}

/**
 * Realiza una petición DELETE al backend.
 * @param {string} endpoint - URL completa del endpoint
 * @returns {Promise<any>} Confirmación de eliminación
 */
export async function httpDelete(endpoint) {
  // [ACTIVAR cuando haya backend]
  // const res = await fetch(endpoint, {
  //   method: 'DELETE',
  //   headers: { Authorization: `Bearer ${getToken()}` },
  // })
  // if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  // return res.json()

  return null
}
