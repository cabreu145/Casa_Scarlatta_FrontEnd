import { ENDPOINTS } from '@/constants/api'
import { httpGet, httpPost, httpPut } from '@/lib/http'
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

export async function createClaseApi(payload) {
  const response = await httpPost(ENDPOINTS.clases, payload)
  return mapBackendClassToFrontendClass(response ?? {})
}

export async function updateClaseApi(id, payload) {
  const response = await httpPut(ENDPOINTS.claseById(id), payload)
  return mapBackendClassToFrontendClass(response ?? {})
}
