import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapBackendOccurrencesToFrontend } from '@/adapters/occurrenceAdapter'

const inflightByKey = new Map()

function buildKey(claseId, from, to) {
  return `${claseId}|${from ?? ''}|${to ?? ''}`
}

export function clearOccurrencesInflightCache() {
  inflightByKey.clear()
}

export async function getOccurrencesByClassApi(claseId, { from, to, signal } = {}) {
  const key = buildKey(claseId, from, to)
  if (inflightByKey.has(key)) return inflightByKey.get(key)

  const request = httpGet(ENDPOINTS.claseOcurrencias(claseId, { from, to }), { signal })
    .then((payload) => mapBackendOccurrencesToFrontend(payload))
    .finally(() => {
      inflightByKey.delete(key)
    })

  inflightByKey.set(key, request)
  return request
}

export async function getOccurrencesForDateRangeApi(clasesIds = [], { from, to, signal } = {}) {
  const ids = Array.isArray(clasesIds) ? clasesIds : []
  const settled = await Promise.all(
    ids.map(async (claseId) => ({
      claseId,
      occurrences: await getOccurrencesByClassApi(claseId, { from, to, signal }),
    }))
  )
  return Object.fromEntries(settled.map(({ claseId, occurrences }) => [claseId, occurrences]))
}
