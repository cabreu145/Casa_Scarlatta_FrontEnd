import { ENDPOINTS } from '@/constants/api'
import { httpPost } from '@/lib/http'

export async function requestPasswordResetApi(email) {
  return httpPost(ENDPOINTS.resetPasswordRequest, { email: String(email ?? '').trim() })
}

export async function confirmPasswordResetApi({ token, newPassword }) {
  return httpPost(ENDPOINTS.resetPasswordConfirm, {
    token: String(token ?? '').trim(),
    new_password: String(newPassword ?? ''),
  })
}
