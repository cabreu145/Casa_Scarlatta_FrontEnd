/**
 * emailService.js
 * ─────────────────────────────────────────────────────
 * Servicio centralizado de correos electrónicos.
 *
 * ESTADO ACTUAL: Todos los métodos simulan el envío
 * mostrando un console.info. El flujo completo está
 * implementado — solo falta conectar el backend.
 *
 * [BACKEND] CÓMO CONECTAR:
 * 1. Tu compañero crea el endpoint: POST /api/email/send
 * 2. El endpoint recibe: { plantilla, destinatario, datos }
 * 3. El servidor usa SendGrid / Resend / Nodemailer para enviar
 * 4. En cada función de este archivo, descomentar el fetch()
 *    y comentar el console.info de simulación.
 *
 * Plantillas necesarias en el backend:
 *   - bienvenida:          cuenta creada, link de acceso
 *   - reset_password:      link para restablecer contraseña
 *   - reserva_confirmada:  detalle completo de la clase reservada
 *   - reserva_cancelada:   confirmación de cancelación
 *   - lista_espera_lugar:  se asignó un lugar automáticamente
 *   - lista_espera_unirse: confirmación de entrada a lista de espera
 * ─────────────────────────────────────────────────────
 */

// [BACKEND] Importar cuando el endpoint esté listo:
// import { httpPost } from '@/lib/http'

/**
 * Función base de envío.
 * [BACKEND] → POST /api/email/send
 * Body: { plantilla: string, destinatario: string, datos: object }
 * Response: { ok: boolean, messageId?: string, error?: string }
 */
async function enviarEmail({ plantilla, destinatario, datos }) {
  // [BACKEND] Descomentar cuando el endpoint esté listo:
  // try {
  //   const res = await httpPost('/api/email/send', {
  //     plantilla,
  //     destinatario,
  //     datos,
  //   })
  //   return res
  // } catch (err) {
  //   console.error('[emailService] Error enviando email:', err)
  //   return { ok: false, error: err.message }
  // }

  // Simulación mientras no hay backend:
  console.info(
    `[emailService] 📧 SIMULADO → plantilla: "${plantilla}"` +
    ` | para: ${destinatario}` +
    ` | datos:`, datos
  )
  return { ok: true, simulado: true }
}

// ── Funciones públicas ────────────────────────────────────────────────────

/**
 * Email de bienvenida al crear una cuenta nueva.
 * Se llama desde AuthContext.register()
 * [BACKEND] → Plantilla "bienvenida"
 *   datos: { nombre, email, fechaRegistro }
 */
export async function emailBienvenida({ nombre, email }) {
  return enviarEmail({
    plantilla:    'bienvenida',
    destinatario: email,
    datos: {
      nombre,
      email,
      fechaRegistro: new Date().toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
      linkAcceso: `${window.location.origin}/login`,
    },
  })
}

/**
 * Email de restablecimiento de contraseña.
 * Se llama desde AuthContext.resetPassword()
 * [BACKEND] → Plantilla "reset_password"
 *   datos: { nombre, email, linkReset, expiracion }
 *   El backend genera el token y el link real.
 *   El frontend solo avisa que se solicitó el reset.
 */
export async function emailResetPassword({ nombre, email }) {
  return enviarEmail({
    plantilla:    'reset_password',
    destinatario: email,
    datos: {
      nombre,
      email,
      // [BACKEND] El backend genera el link con token seguro:
      // linkReset: `${origin}/reset-password?token=TOKEN_GENERADO`
      // expiracion: '24 horas'
      linkReset:   `${window.location.origin}/login`,
      expiracion:  '24 horas',
    },
  })
}

/**
 * Email de confirmación de reserva de clase.
 * Se llama desde reservasService.reservarClase()
 * [BACKEND] → Plantilla "reserva_confirmada"
 *   datos: { nombre, claseNombre, coachNombre, dia, hora,
 *            fecha, ubicacion, asiento, linkCancelar }
 */
export async function emailReservaConfirmada({
  nombre, email, claseNombre, coachNombre,
  dia, hora, fecha, asiento,
}) {
  return enviarEmail({
    plantilla:    'reserva_confirmada',
    destinatario: email,
    datos: {
      nombre,
      claseNombre,
      coachNombre,
      dia,
      hora,
      fecha:      fecha ?? dia,
      asiento:    asiento ?? 'Sin asiento asignado',
      ubicacion:  'Casa Scarlatta',
      // [BACKEND] Generar link con token para cancelar sin login:
      // linkCancelar: `${origin}/cancelar-reserva?token=TOKEN`
      linkCancelar: `${window.location.origin}/cliente/dashboard`,
    },
  })
}

/**
 * Email de confirmación de cancelación de reserva.
 * Se llama desde reservasService.cancelarReserva()
 * [BACKEND] → Plantilla "reserva_cancelada"
 *   datos: { nombre, claseNombre, dia, hora }
 */
export async function emailReservaCancelada({
  nombre, email, claseNombre, dia, hora,
}) {
  return enviarEmail({
    plantilla:    'reserva_cancelada',
    destinatario: email,
    datos: {
      nombre,
      claseNombre,
      dia,
      hora,
      linkReservar: `${window.location.origin}/clases`,
    },
  })
}

/**
 * Email cuando se asigna automáticamente un lugar de lista de espera.
 * Se llama desde reservasService cuando alguien cancela
 * y hay personas en lista de espera.
 * [BACKEND] → Plantilla "lista_espera_lugar"
 *   datos: { nombre, claseNombre, coachNombre, dia, hora,
 *            fecha, linkAcceso }
 * [BACKEND] IMPORTANTE: Este email reemplaza la lógica de
 *   "30 minutos para confirmar". Ahora el lugar se asigna
 *   automáticamente y el email solo notifica.
 */
export async function emailLugarAsignado({
  nombre, email, claseNombre, coachNombre,
  dia, hora, fecha,
}) {
  return enviarEmail({
    plantilla:    'lista_espera_lugar',
    destinatario: email,
    datos: {
      nombre,
      claseNombre,
      coachNombre,
      dia,
      hora,
      fecha:       fecha ?? dia,
      ubicacion:   'Casa Scarlatta',
      mensaje:     '¡Se liberó un espacio y fue asignado automáticamente!',
      linkAcceso:  `${window.location.origin}/cliente/dashboard`,
    },
  })
}

/**
 * Email de confirmación al unirse a lista de espera.
 * [BACKEND] → Plantilla "lista_espera_unirse"
 *   datos: { nombre, claseNombre, posicion, dia, hora }
 */
export async function emailListaEsperaUnirse({
  nombre, email, claseNombre, posicion, dia, hora,
}) {
  return enviarEmail({
    plantilla:    'lista_espera_unirse',
    destinatario: email,
    datos: {
      nombre,
      claseNombre,
      posicion,
      dia,
      hora,
      mensaje: `Eres el número ${posicion} en la lista de espera.` +
               ` Te avisaremos si se libera un lugar.`,
    },
  })
}
