import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPost } from '@/lib/http'
import {
  mapOccurrenceSpotsResponseToFrontend,
  mapReservationHoldPayload,
  mapSpotHoldResponseToFrontend,
} from '@/adapters/equipmentReservationAdapter'

const inflightOccurrenceSpots = new Map()

export async function getOccurrenceSpotsApi({ occurrenceId }) {
  const endpoint = ENDPOINTS.occurrenceSpots
  if (!endpoint) {
    throw new Error('OCCURRENCE_SPOTS_ENDPOINT_MISSING')
  }

  const key = String(occurrenceId ?? '')
  if (inflightOccurrenceSpots.has(key)) {
    return inflightOccurrenceSpots.get(key)
  }

  const request = httpGet(endpoint(occurrenceId))
    .then((payload) => mapOccurrenceSpotsResponseToFrontend(payload ?? {}))
    .finally(() => {
      inflightOccurrenceSpots.delete(key)
    })

  inflightOccurrenceSpots.set(key, request)
  return request
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

