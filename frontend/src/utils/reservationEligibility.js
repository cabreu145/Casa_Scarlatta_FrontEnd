export const MEMBERSHIP_EXPIRY_RESERVATION_MESSAGE =
  'Tu paquete vence antes de la fecha de esta clase. Solo puedes reservar clases dentro de la vigencia de tu paquete.'

export function getMembershipEligibilityErrorMessage(error) {
  const code = String(error?.code ?? error?.message ?? error ?? '').trim().toUpperCase()
  return code.includes('MEMBERSHIP_EXPIRES_BEFORE_CLASS')
    ? MEMBERSHIP_EXPIRY_RESERVATION_MESSAGE
    : null
}
