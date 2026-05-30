import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapCoachAgendaToFrontend } from '@/adapters/coachAgendaAdapter'

export async function getMyCoachAgendaApi({ from, to }) {
  const payload = await httpGet(ENDPOINTS.coachAgendaMe({ from, to }))
  return mapCoachAgendaToFrontend(payload ?? {})
}
