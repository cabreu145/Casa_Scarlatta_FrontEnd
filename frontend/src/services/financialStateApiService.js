import { ENDPOINTS } from '@/constants/api'
import { httpGet } from '@/lib/http'
import { mapFinancialStateToFrontend } from '@/adapters/financialStateAdapter'

export async function getMyFinancialStateApi() {
  const payload = await httpGet(ENDPOINTS.miEstadoFinanciero)
  return mapFinancialStateToFrontend(payload ?? {})
}
