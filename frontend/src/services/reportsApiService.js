import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import {
  mapBackendCoachesReportToFrontend,
  mapBackendFinanceReportToFrontend,
  mapBackendOccupancyByDisciplineReportToFrontend,
  mapBackendPackagesReportToFrontend,
  mapBackendPosReportToFrontend,
  mapBackendTopClassesReportToFrontend,
  mapBackendUsersReportToFrontend,
} from '@/adapters/reportAdapter'

function normalizeRange(params = {}) {
  return {
    from: String(params.from ?? '').trim() || undefined,
    to: String(params.to ?? '').trim() || undefined,
  }
}

function normalizeLimit(value, fallback = 5) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, 50)
}

export async function getFinanceReport(params = {}) {
  const payload = await httpGet(ENDPOINTS.reportesFinanzas(normalizeRange(params)))
  return mapBackendFinanceReportToFrontend(payload)
}

export async function getUsersReport(params = {}) {
  const payload = await httpGet(ENDPOINTS.reportesUsuarios(normalizeRange(params)))
  return mapBackendUsersReportToFrontend(payload)
}

export async function getPackagesReport(params = {}) {
  const payload = await httpGet(ENDPOINTS.reportesPaquetes(normalizeRange(params)))
  return mapBackendPackagesReportToFrontend(payload)
}

export async function getPosReport(params = {}) {
  const payload = await httpGet(ENDPOINTS.reportesPos(normalizeRange(params)))
  return mapBackendPosReportToFrontend(payload)
}

export async function getCoachesReport(params = {}) {
  const payload = await httpGet(ENDPOINTS.reportesCoaches(normalizeRange(params)))
  return mapBackendCoachesReportToFrontend(payload)
}

export async function getTopClassesReport(params = {}) {
  const payload = await httpGet(
    ENDPOINTS.reportesTopClases({
      ...normalizeRange(params),
      limit: normalizeLimit(params.limit, 5),
    })
  )
  return mapBackendTopClassesReportToFrontend(payload)
}

export async function getOccupancyByDisciplineReport(params = {}) {
  const payload = await httpGet(ENDPOINTS.reportesOcupacionPorDisciplina(normalizeRange(params)))
  return mapBackendOccupancyByDisciplineReportToFrontend(payload)
}
