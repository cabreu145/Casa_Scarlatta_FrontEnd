import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPost } from '@/lib/http'
import {
  mapOccurrenceSpotsResponseToFrontend,
  mapReservationHoldPayload,
  mapSpotHoldResponseToFrontend,
} from '@/adapters/equipmentReservationAdapter'

export async function getOccurrenceSpotsApi({ occurrenceId }) {
  const endpoint = ENDPOINTS.occurrenceSpots
  if (!endpoint) {
    throw new Error('OCCURRENCE_SPOTS_ENDPOINT_MISSING')
  }

  const payload = await httpGet(endpoint(occurrenceId))
  return mapOccurrenceSpotsResponseToFrontend(payload ?? {})
}

export async function createSpotHoldApi({ occurrenceId, spotId }) {
  const endpoint = ENDPOINTS.spotHolds
  if (!endpoint) {
    throw new Error('SPOT_HOLD_ENDPOINT_MISSING')
  }

  const payload = await httpPost(endpoint, mapReservationHoldPayload({ occurrenceId, spotId }))
  return mapSpotHoldResponseToFrontend(payload ?? {})
}

export async function releaseSpotHoldApi({ holdId }) {
  const endpoint = ENDPOINTS.spotHoldById
  if (!endpoint) {
    throw new Error('SPOT_HOLD_ENDPOINT_MISSING')
  }

  const payload = await httpDelete(endpoint(holdId))
  return mapSpotHoldResponseToFrontend(payload ?? {})
}

