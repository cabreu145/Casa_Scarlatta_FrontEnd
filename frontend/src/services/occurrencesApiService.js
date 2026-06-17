import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapBackendOccurrencesToFrontend } from '@/adapters/occurrenceAdapter'

const inflightByKey = new Map()
export const OCCURRENCES_CONCURRENCY_LIMIT = 3

function buildKey(claseId, from, to) {
  return `${claseId}|${from ?? ''}|${to ?? ''}`
}

export async function runWithConcurrency(items = [], limit = OCCURRENCES_CONCURRENCY_LIMIT, worker) {
  const queue = Array.isArray(items) ? items : []
  const concurrency = Math.max(1, Number(limit) || OCCURRENCES_CONCURRENCY_LIMIT)
  const results = new Array(queue.length)
  let cursor = 0

  async function consume() {
    while (cursor < queue.length) {
      const index = cursor
      cursor += 1
      results[index] = await worker(queue[index], index)
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, queue.length) },
    () => consume(),
  )

  await Promise.all(workers)
  return results
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
  const ids = Array.isArray(clasesIds)
    ? [...new Set(clasesIds.filter((id) => id !== null && id !== undefined))]
    : []

  const settled = await runWithConcurrency(ids, OCCURRENCES_CONCURRENCY_LIMIT, async (claseId) => ({
    claseId,
    occurrences: await getOccurrencesByClassApi(claseId, { from, to, signal }),
  }))

  return Object.fromEntries(settled.map(({ claseId, occurrences }) => [claseId, occurrences]))
}
