import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import {
  mapBackendAvailabilityToFrontend,
  mapBackendClassToFrontendClass,
  mapBackendClassesToFrontend,
} from '@/adapters/classAdapter'

export async function getClasesApi() {
  const payload = await httpGet(ENDPOINTS.clasesList)
  return mapBackendClassesToFrontend(Array.isArray(payload) ? payload : [])
}

export async function getClaseByIdApi(id) {
  const payload = await httpGet(ENDPOINTS.claseById(id))
  return mapBackendClassToFrontendClass(payload ?? {})
}

export async function getDisponibilidadClaseApi(id) {
  const payload = await httpGet(ENDPOINTS.claseDisponibilidad(id))
  return mapBackendAvailabilityToFrontend(payload ?? {})
}
