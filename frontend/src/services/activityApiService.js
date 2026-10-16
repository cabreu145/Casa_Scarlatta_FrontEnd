import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapBackendActivityResponseToFrontend } from '@/adapters/activityAdapter'

export async function getActivityApi({
  page = 1,
  pageSize = 20,
  category,
  from,
  to,
  actorId,
  entityType,
  entityId,
  search,
} = {}) {
  const payload = await httpGet(ENDPOINTS.actividad({
    page,
    pageSize,
    category,
    from,
    to,
    actorId,
    entityType,
    entityId,
    search,
  }))
  return mapBackendActivityResponseToFrontend(payload ?? {})
}

