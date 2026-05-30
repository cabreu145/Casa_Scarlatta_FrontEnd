import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapBackendCoachesToFrontend } from '@/adapters/coachAdapter'

export async function getCoachesApi() {
  const payload = await httpGet(ENDPOINTS.coaches)
  return mapBackendCoachesToFrontend(Array.isArray(payload) ? payload : [])
}
