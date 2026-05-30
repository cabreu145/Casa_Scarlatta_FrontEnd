import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPost } from '@/lib/http'
import {
  mapBackendWaitlistEntryToFrontend,
  mapBackendWaitlistListToFrontend,
  mapJoinWaitlistPayload,
} from '@/adapters/waitlistAdapter'

const useApiWaitlist = import.meta.env.VITE_USE_API_WAITLIST === 'true'

export async function getWaitlistByClaseApi(claseId) {
  if (useApiWaitlist) {
    throw new Error('WAITLIST_OCCURRENCE_REQUIRED')
  }
  const payload = await httpGet(ENDPOINTS.waitlistByClase(claseId))
  return mapBackendWaitlistListToFrontend(payload)
}

export async function getWaitlistByOccurrenceApi(occurrenceId) {
  const payload = await httpGet(ENDPOINTS.waitlistByOccurrence(occurrenceId))
  return mapBackendWaitlistListToFrontend(payload)
}

export async function unirseWaitlistApi({ occurrenceId, claseId, userId }) {
  const body = mapJoinWaitlistPayload({ occurrenceId, claseId, userId })
  const payload = await httpPost(ENDPOINTS.waitlist, body)
  return mapBackendWaitlistEntryToFrontend(payload)
}

export async function salirWaitlistApi(entryId) {
  const payload = await httpDelete(ENDPOINTS.waitlistEntryById(entryId))
  return mapBackendWaitlistEntryToFrontend(payload)
}

