import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapBackendOccurrencesToFrontend } from '@/adapters/occurrenceAdapter'

const inflightByKey = new Map()
const cachedByKey = new Map()
let cacheGeneration = 0
export const OCCURRENCES_CONCURRENCY_LIMIT = 3
export const OCCURRENCES_CACHE_TTL_MS = 30_000

function buildKey(claseId, from, to) {
  return `${claseId}|${from ?? ''}|${to ?? ''}`
}

function getOccurrenceDate(occurrence = {}) {
  return String(
    occurrence.fecha
      ?? occurrence.occurrenceDate
      ?? occurrence.occurrence_date
      ?? '',
  ).slice(0, 10)
}

function getCachedOccurrences(claseId, from, to) {
  const exact = cachedByKey.get(buildKey(claseId, from, to))
  if (exact?.expiresAt > Date.now()) return exact.data
  if (exact) cachedByKey.delete(buildKey(claseId, from, to))

  for (const entry of cachedByKey.values()) {
    const coversRange = from && to && entry.from && entry.to && entry.from <= from && entry.to >= to
    if (entry.claseId !== claseId || entry.expiresAt <= Date.now() || !coversRange) continue
    return entry.data.filter((occurrence) => {
      const date = getOccurrenceDate(occurrence)
      return date >= from && date <= to
    })
  }
  return null
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
  clearOccurrencesCache()
}

export function clearOccurrencesCache() {
  cachedByKey.clear()
  cacheGeneration += 1
}

export async function getOccurrencesByClassApi(claseId, { from, to, signal } = {}) {
  const key = buildKey(claseId, from, to)
  const cached = getCachedOccurrences(claseId, from, to)
  if (cached) return cached
  if (inflightByKey.has(key)) return inflightByKey.get(key)

  const requestGeneration = cacheGeneration
  const request = httpGet(ENDPOINTS.claseOcurrencias(claseId, { from, to }), { signal })
    .then((payload) => {
      const data = mapBackendOccurrencesToFrontend(payload)
      if (requestGeneration === cacheGeneration) {
        cachedByKey.set(key, {
          claseId,
          from,
          to,
          data,
          expiresAt: Date.now() + OCCURRENCES_CACHE_TTL_MS,
        })
      }
      return data
    })
    .finally(() => {
      inflightByKey.delete(key)
    })

  inflightByKey.set(key, request)
  return request
}

export async function getOccurrencesForDateRangeApi(_clasesIds = [], params = {}) {
  const groupByClass = (occurrences) => occurrences.reduce((byClass, occurrence) => {
    const classId = occurrence.classId ?? occurrence.claseId
    if (classId === null || classId === undefined) return byClass
    const key = String(classId)
    if (!byClass[key]) byClass[key] = []
    byClass[key].push(occurrence)
    return byClass
  }, {})

  try {
    const payload = await httpGet(ENDPOINTS.clasesOcurrenciasBulk(params), { signal: params.signal })
    const rawItems = Array.isArray(payload) ? payload : (payload?.items ?? [])
    return groupByClass(mapBackendOccurrencesToFrontend(rawItems))
  } catch (error) {
    const validationErrors = error?.details?.errors ?? error?.response?.data?.error?.details?.errors ?? []
    const isRouteConflict = Number(error?.status ?? error?.response?.status) === 422 && validationErrors.some(
      (item) => Array.isArray(item?.loc) && item.loc.includes('class_id'),
    )
    if (!isRouteConflict) throw error

    const ids = Array.isArray(_clasesIds)
      ? [...new Set(_clasesIds.filter((id) => id !== null && id !== undefined))]
      : []
    const settled = await runWithConcurrency(ids, OCCURRENCES_CONCURRENCY_LIMIT, async (classId) => ({
      classId,
      occurrences: await getOccurrencesByClassApi(classId, params),
    }))
    return Object.fromEntries(settled.map(({ classId, occurrences }) => [classId, occurrences]))
  }
}
