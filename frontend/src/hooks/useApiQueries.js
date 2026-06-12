import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'
import { getMyFinancialStateApi, getMyCreditMovementsPaginatedApi } from '@/services/financialStateApiService'
import { getClasesApi, getClasesPaginatedApi, getClaseByIdApi } from '@/services/clasesApiService'
import { useClasesStore } from '@/stores/clasesStore'
import { getOccurrencesByClassApi } from '@/services/occurrencesApiService'
import {
  addClientMembershipBeneficiaryApi,
  addMyMembershipBeneficiaryApi,
  getMyMembershipsApi,
  removeClientMembershipBeneficiaryApi,
  removeMyMembershipBeneficiaryApi,
} from '@/services/clientMembershipsApiService'
import { getMyPaymentsApi } from '@/services/clientPaymentsApiService'
import { getMembershipPackagesApi } from '@/services/membershipPackagesApiService'
import {
  cancelExpense,
  createExpense,
  deleteExpense,
  getExpenseDetail,
  listExpenses,
  updateExpense,
} from '@/services/expensesApiService'
import {
  executeCashClosing,
  getCashClosingDetail,
  getTodayCashClosingSummary,
  listCashClosings,
} from '@/services/cashClosingsApiService'
import {
  getFinanceCategories,
  getFinanceDaySummary,
  getFinanceKpis,
  getFinanceHistoricalApi,
  getLowStock,
  getRecentFinanceSales,
} from '@/services/financeApiService'
import {
  getCoachPaymentsReport,
  getCoachesReport,
  getFinanceReport,
  getOccupancyByDisciplineReport,
  getPackagesReport,
  getPosReport,
  getTopClassesReport,
  getUsersReport,
} from '@/services/reportsApiService'
import { getActivityApi } from '@/services/activityApiService'
import {
  getEmailConfigApi,
  sendTestEmailApi,
  updateEmailConfigApi,
} from '@/services/emailConfigApiService'
import { getPaymentStatusApi } from '@/services/paymentsApiService'
import {
  getSiteConfigurationApi,
  updateSiteConfigurationApi,
  uploadSiteConfigurationMediaApi,
} from '@/services/siteConfigurationApiService'
import {
  confirmPasswordResetApi,
  requestPasswordResetApi,
} from '@/services/authPasswordResetApiService'
import {
  getNotificationsApi,
  getUnreadNotificationsCountApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from '@/services/notificationsApiService'
import { getEmailOutboxApi, retryEmailOutboxApi } from '@/services/emailOutboxApiService'
import {
  createRoleApi,
  deleteRoleApi,
  getPermissionsApi,
  getRbacUsersApi,
  getRoleByIdApi,
  getRolesApi,
  getUserEffectivePermissionsApi,
  updateRoleApi,
  updateRolePermissionsApi,
  updateUserPermissionOverridesApi,
  updateUserRoleApi,
} from '@/services/rbacApiService'
import {
  cancelarReservaApi,
  crearReservaApi,
  getMisReservasPaginatedApi,
  getOccurrenceRosterApi,
} from '@/services/reservasApiService'
import {
  adjustClientCreditsApi,
  assignClientPackageApi,
  createClientApi,
  deleteClientApi,
  getClientByIdApi,
  getClientsPaginatedApi,
  updateClientApi,
} from '@/services/clientsApiService'
import { getCoachesPaginatedApi, getPublicCoachesApi } from '@/services/coachesApiService'
import {
  createSpotHoldApi,
  getOccurrenceSpotsApi,
  releaseSpotHoldApi,
} from '@/services/equipmentReservationApiService'
import {
  createProductApi,
  createSaleApi,
  deleteProductApi,
  getProductsApi,
  getSaleByIdApi,
  getSaleTicketApi,
  getSalesApi,
  updateProductApi,
  updateProductStatusApi,
} from '@/services/posApiService'
import {
  createProductCategoryApi,
  deleteProductCategoryApi,
  getProductCategoriesApi,
  updateProductCategoryApi,
  updateProductCategoryStatusApi,
} from '@/services/posCategoriesApiService'
import {
  createPayTableApi,
  deletePayTableApi,
  getPayTableApi,
  updatePayTableApi,
} from '@/services/payTableApiService'
import { getWaitlistByOccurrenceApi } from '@/services/waitlistApiService'

const shortDefaults = {
  staleTime: 30_000,
  retry: 1,
  refetchOnWindowFocus: false,
}

export function useMyFinancialStateQuery({ enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.myFinancialState,
    queryFn: getMyFinancialStateApi,
    enabled,
    ...shortDefaults,
  })
}

export function useMyMembershipsQuery({ enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.myMemberships,
    queryFn: getMyMembershipsApi,
    enabled,
    ...shortDefaults,
  })
}

export function useMyCreditMovementsQuery({ page = 1, pageSize = 8, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.myCreditMovements({ page, pageSize }),
    queryFn: () => getMyCreditMovementsPaginatedApi({ page, pageSize }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useMyPaymentsQuery({ page = 1, pageSize = 10, status, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.myPayments({ page, pageSize, status: status || 'all' }),
    queryFn: () => getMyPaymentsApi({ page, pageSize, status }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function usePaymentStatusQuery(externalReference, options = {}) {
  const {
    enabled = true,
    staleTime = 30_000,
    refetchOnMount = false,
    refetchOnWindowFocus = false,
    retry = 1,
    ...restOptions
  } = options

  return useQuery({
    queryKey: queryKeys.payments.status(externalReference),
    queryFn: () => getPaymentStatusApi({ externalReference }),
    enabled: Boolean(externalReference) && enabled,
    staleTime,
    refetchOnMount,
    refetchOnWindowFocus,
    retry,
    ...restOptions,
  })
}

export function useClassesQuery({
  page = 1,
  pageSize = 20,
  search,
  discipline,
  status,
  coachId,
  enabled = false,
  paginated = true,
} = {}) {
  const normalizedPageSize = Math.min(Math.max(1, Number(pageSize) || 20), 100)
  return useQuery({
    queryKey: paginated
      ? queryKeys.classes.list({ page, pageSize: normalizedPageSize, search: search || '', discipline: discipline || 'all', status: status || 'all', coachId: coachId || 'all' })
      : queryKeys.classes.list({ scope: 'all' }),
    queryFn: () => (paginated
      ? getClasesPaginatedApi({ page, pageSize: normalizedPageSize, search, discipline, status, coachId })
      : getClasesApi()),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useClassDetailQuery(id, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.classes.detail(id),
    queryFn: () => getClaseByIdApi(id),
    enabled: Boolean(enabled && id),
    ...shortDefaults,
  })
}

export function useClassOccurrencesQuery(classId, { from, to, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.classes.occurrences(classId, { from: from || '', to: to || '' }),
    queryFn: () => getOccurrencesByClassApi(classId, { from, to }),
    enabled: Boolean(enabled && classId),
    ...shortDefaults,
  })
}

export function useOccurrenceRosterQuery(occurrenceId, { includeCanceled = false, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.occurrenceRoster.detail(occurrenceId, includeCanceled),
    queryFn: () => getOccurrenceRosterApi(occurrenceId, { includeCanceled }),
    enabled: Boolean(enabled && occurrenceId),
    ...shortDefaults,
  })
}

export function useAdminCoachesActiveCountQuery({ enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.adminBadges.coachesActive(),
    queryFn: async () => {
      const response = await getCoachesPaginatedApi({ page: 1, pageSize: 1, status: 'active' })
      if (typeof response?.total === 'number') return response.total
      if (Array.isArray(response?.items)) return response.items.length
      if (Array.isArray(response)) return response.length
      return 0
    },
    enabled,
    ...shortDefaults,
  })
}

export function useAdminClientsActiveCountQuery({ enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.adminBadges.clientsActive(),
    queryFn: async () => {
      const response = await getClientsPaginatedApi({ page: 1, pageSize: 1, status: 'active' })
      if (typeof response?.total === 'number') return response.total
      if (Array.isArray(response?.items)) return response.items.length
      if (Array.isArray(response)) return response.length
      return 0
    },
    enabled,
    ...shortDefaults,
  })
}

export function usePublicCoachesQuery({ enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.coaches.public(),
    queryFn: getPublicCoachesApi,
    enabled,
    ...shortDefaults,
  })
}

export function useMembershipPackagesQuery({ enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.adminPackages({ scope: 'public' }),
    queryFn: getMembershipPackagesApi,
    enabled,
    ...shortDefaults,
  })
}

export function usePosProductsQuery({
  page = 1,
  pageSize = 20,
  search,
  category,
  status,
  enabled = false,
} = {}) {
  const normalizedPageSize = Math.min(Math.max(1, Number(pageSize) || 20), 100)
  return useQuery({
    queryKey: queryKeys.posProducts({ page, pageSize: normalizedPageSize, search: search || '', category: category || 'all', status: status || 'all' }),
    queryFn: () => getProductsApi({ page, pageSize: normalizedPageSize, search, category, status }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useProductCategoriesQuery({
  page = 1,
  pageSize = 20,
  search,
  status,
  enabled = false,
} = {}) {
  const normalizedPageSize = Math.min(Math.max(1, Number(pageSize) || 20), 100)
  return useQuery({
    queryKey: queryKeys.posProductCategories({ page, pageSize: normalizedPageSize, search: search || '', status: status || 'all' }),
    queryFn: () => getProductCategoriesApi({ page, pageSize: normalizedPageSize, search, status }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function usePosSalesQuery({
  page = 1,
  pageSize = 10,
  from,
  to,
  paymentMethod,
  status,
  enabled = false,
} = {}) {
  const normalizedPageSize = Math.min(Math.max(1, Number(pageSize) || 10), 100)
  return useQuery({
    queryKey: queryKeys.posSales({ page, pageSize: normalizedPageSize, from: from || '', to: to || '', paymentMethod: paymentMethod || 'all', status: status || 'all' }),
    queryFn: () => getSalesApi({ page, pageSize: normalizedPageSize, from, to, paymentMethod, status }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function usePosSaleDetailQuery(saleId, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.posSaleDetail(saleId),
    queryFn: () => getSaleByIdApi(saleId),
    enabled: Boolean(enabled && saleId),
    ...shortDefaults,
  })
}

export function usePosSaleTicketQuery(saleId, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.posSaleTicket(saleId),
    queryFn: () => getSaleTicketApi(saleId),
    enabled: Boolean(enabled && saleId),
    ...shortDefaults,
  })
}

export function useTodayCashClosingQuery({ enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.cashClosings.today,
    queryFn: getTodayCashClosingSummary,
    enabled,
    ...shortDefaults,
  })
}

export function useReservationsMeQuery({ page = 1, pageSize = 20, status, from, to, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.reservations.me({ page, pageSize, status: status || 'all', from: from || '', to: to || '' }),
    queryFn: () => getMisReservasPaginatedApi({ page, pageSize, status, from, to }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useCashClosingsQuery({
  page = 1,
  pageSize = 20,
  from,
  to,
  enabled = false,
} = {}) {
  const normalizedPageSize = Math.min(Math.max(1, Number(pageSize) || 20), 100)
  return useQuery({
    queryKey: queryKeys.cashClosings.list({
      page,
      pageSize: normalizedPageSize,
      from: from || '',
      to: to || '',
    }),
    queryFn: () => listCashClosings({ page, pageSize: normalizedPageSize, from, to }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useCashClosingDetailQuery(id, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.cashClosings.detail(id),
    queryFn: () => getCashClosingDetail(id),
    enabled: Boolean(enabled && id),
    ...shortDefaults,
  })
}

export function useExpensesQuery({
  page = 1,
  pageSize = 20,
  from,
  to,
  category,
  status,
  paymentMethod,
  enabled = false,
} = {}) {
  const normalizedPageSize = Math.min(Math.max(1, Number(pageSize) || 20), 100)
  return useQuery({
    queryKey: queryKeys.expenses.list({
      page,
      pageSize: normalizedPageSize,
      from: from || '',
      to: to || '',
      category: category || 'all',
      status: status || 'all',
      paymentMethod: paymentMethod || 'all',
    }),
    queryFn: () => listExpenses({
      page,
      pageSize: normalizedPageSize,
      from,
      to,
      category,
      status,
      paymentMethod,
    }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useFinanceKpisQuery({ from, to, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.finance.kpis({ from: from || '', to: to || '' }),
    queryFn: () => getFinanceKpis({ from, to }),
    enabled,
    ...shortDefaults,
  })
}

export function useFinanceDaySummaryQuery(date, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.finance.day(date || ''),
    queryFn: () => getFinanceDaySummary(date),
    enabled: Boolean(enabled && date),
    ...shortDefaults,
  })
}

export function useFinanceHistoricalQuery({ from, to, groupBy = 'day', enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.finance.historical({ from: from || '', to: to || '', groupBy: groupBy || 'day' }),
    queryFn: () => getFinanceHistoricalApi({ from, to, groupBy }),
    enabled,
    ...shortDefaults,
  })
}

export function useFinanceCategoriesQuery({ from, to, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.finance.categories({ from: from || '', to: to || '' }),
    queryFn: () => getFinanceCategories({ from, to }),
    enabled,
    ...shortDefaults,
  })
}

export function useFinanceLowStockQuery({ threshold = 5, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.finance.lowStock({ threshold }),
    queryFn: () => getLowStock({ threshold }),
    enabled,
    ...shortDefaults,
  })
}

export function useFinanceRecentSalesQuery({ limit = 10, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.finance.recentSales({ limit }),
    queryFn: () => getRecentFinanceSales({ limit }),
    enabled,
    ...shortDefaults,
  })
}

export function usePayTableQuery({ enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.payTable.all,
    queryFn: getPayTableApi,
    enabled,
    ...shortDefaults,
  })
}

export function useFinanceReportQuery({ from, to, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.finance({ from: from || '', to: to || '' }),
    queryFn: () => getFinanceReport({ from, to }),
    enabled,
    ...shortDefaults,
  })
}

export function useCoachPaymentsReportQuery({ from, to, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.coachesPayments({ from: from || '', to: to || '' }),
    queryFn: () => getCoachPaymentsReport({ from, to }),
    enabled,
    ...shortDefaults,
  })
}

export function useUsersReportQuery({ from, to, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.users({ from: from || '', to: to || '' }),
    queryFn: () => getUsersReport({ from, to }),
    enabled,
    ...shortDefaults,
  })
}

export function usePackagesReportQuery({ from, to, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.packages({ from: from || '', to: to || '' }),
    queryFn: () => getPackagesReport({ from, to }),
    enabled,
    ...shortDefaults,
  })
}

export function usePosReportQuery({ from, to, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.pos({ from: from || '', to: to || '' }),
    queryFn: () => getPosReport({ from, to }),
    enabled,
    ...shortDefaults,
  })
}

export function useCoachesReportQuery({ from, to, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.coaches({ from: from || '', to: to || '' }),
    queryFn: () => getCoachesReport({ from, to }),
    enabled,
    ...shortDefaults,
  })
}

export function useTopClassesReportQuery({ from, to, limit = 5, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.topClasses({ from: from || '', to: to || '', limit }),
    queryFn: () => getTopClassesReport({ from, to, limit }),
    enabled,
    ...shortDefaults,
  })
}

export function useOccupancyByDisciplineReportQuery({ from, to, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.occupancyByDiscipline({ from: from || '', to: to || '' }),
    queryFn: () => getOccupancyByDisciplineReport({ from, to }),
    enabled,
    ...shortDefaults,
  })
}

export function useExpenseDetailQuery(id, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: () => getExpenseDetail(id),
    enabled: Boolean(enabled && id),
    ...shortDefaults,
  })
}

export function useActivityQuery({
  page = 1,
  pageSize = 20,
  category,
  from,
  to,
  actorId,
  entityType,
  entityId,
  enabled = false,
} = {}) {
  const normalizedPageSize = Math.min(Math.max(1, Number(pageSize) || 20), 100)
  return useQuery({
    queryKey: queryKeys.activity.list({
      page,
      pageSize: normalizedPageSize,
      category: category || '',
      from: from || '',
      to: to || '',
      actorId: actorId || '',
      entityType: entityType || '',
      entityId: entityId || '',
    }),
    queryFn: () => getActivityApi({
      page,
      pageSize: normalizedPageSize,
      category,
      from,
      to,
      actorId,
      entityType,
      entityId,
    }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useEmailConfigQuery({ enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.emailConfig.detail(),
    queryFn: getEmailConfigApi,
    enabled,
    ...shortDefaults,
  })
}

export function useSiteConfigurationQuery({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.siteConfiguration.detail(),
    queryFn: getSiteConfigurationApi,
    enabled,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

export function useUpdateSiteConfigurationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSiteConfigurationApi,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.siteConfiguration.detail() }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
      ])
    },
  })
}

export function useUploadSiteConfigurationMediaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadSiteConfigurationMediaApi,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.siteConfiguration.detail() }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
      ])
    },
  })
}

export function useUpdateEmailConfigMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEmailConfigApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.emailConfig.detail() })
    },
  })
}

export function useSendTestEmailMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendTestEmailApi,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['emailOutbox'] }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
      ])
    },
  })
}

export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: requestPasswordResetApi,
  })
}

export function useConfirmPasswordResetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: confirmPasswordResetApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}

export function useNotificationsQuery({
  page = 1,
  pageSize = 10,
  unreadOnly = false,
  category,
  enabled = false,
} = {}) {
  const normalizedPageSize = Math.min(Math.max(1, Number(pageSize) || 10), 100)
  return useQuery({
    queryKey: queryKeys.notifications.list({
      page,
      pageSize: normalizedPageSize,
      unreadOnly: Boolean(unreadOnly),
      category: category || '',
    }),
    queryFn: () => getNotificationsApi({
      page,
      pageSize: normalizedPageSize,
      unreadOnly,
      category,
    }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useUnreadNotificationsCountQuery({ enabled = false, refetchInterval = 60_000 } = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: getUnreadNotificationsCountApi,
    enabled,
    refetchInterval,
    ...shortDefaults,
  })
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ])
    },
  })
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ])
    },
  })
}

export function useEmailOutboxQuery({
  page = 1,
  pageSize = 20,
  status,
  enabled = false,
} = {}) {
  const normalizedPageSize = Math.min(Math.max(1, Number(pageSize) || 20), 100)
  return useQuery({
    queryKey: queryKeys.emailOutbox.list({
      page,
      pageSize: normalizedPageSize,
      status: status || 'all',
    }),
    queryFn: () => getEmailOutboxApi({ page, pageSize: normalizedPageSize, status }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useRetryEmailOutboxMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: retryEmailOutboxApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['emailOutbox'] })
    },
  })
}

export function useRbacPermissionsQuery({ enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.rbac.permissions(),
    queryFn: getPermissionsApi,
    enabled,
    ...shortDefaults,
  })
}

export function useRbacRolesQuery({ page = 1, pageSize = 20, search, status, enabled = false } = {}) {
  const normalizedPageSize = Math.min(Math.max(1, Number(pageSize) || 20), 100)
  return useQuery({
    queryKey: queryKeys.rbac.roles({ page, pageSize: normalizedPageSize, search: search || '', status: status || 'all' }),
    queryFn: () => getRolesApi({ page, pageSize: normalizedPageSize, search, status }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useRbacRoleDetailQuery(roleId, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.rbac.roleDetail(roleId),
    queryFn: () => getRoleByIdApi(roleId),
    enabled: Boolean(enabled && roleId),
    ...shortDefaults,
  })
}

export function useRbacUsersQuery({ page = 1, pageSize = 20, search, role, status, enabled = false } = {}) {
  const normalizedPageSize = Math.min(Math.max(1, Number(pageSize) || 20), 100)
  return useQuery({
    queryKey: queryKeys.rbac.users({ page, pageSize: normalizedPageSize, search: search || '', role: role || 'all', status: status || 'all' }),
    queryFn: () => getRbacUsersApi({ page, pageSize: normalizedPageSize, search, role, status }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useRbacUserPermissionsQuery(userId, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.rbac.userPermissions(userId),
    queryFn: () => getUserEffectivePermissionsApi(userId),
    enabled: Boolean(enabled && userId),
    ...shortDefaults,
  })
}

export function useCreateRbacRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRoleApi,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
      ])
    },
  })
}

export function useUpdateRbacRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, payload }) => updateRoleApi(roleId, payload),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
        variables?.roleId ? queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roleDetail(variables.roleId) }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ['rbac', 'users'] }),
        queryClient.invalidateQueries({ queryKey: ['rbac', 'users', 'permissions'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
      ])
    },
  })
}

export function useUpdateRbacRolePermissionsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissionKeys }) => updateRolePermissionsApi(roleId, permissionKeys),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
        variables?.roleId ? queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roleDetail(variables.roleId) }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ['rbac', 'users'] }),
        queryClient.invalidateQueries({ queryKey: ['rbac', 'users', 'permissions'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
      ])
    },
  })
}

export function useDeleteRbacRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRoleApi,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
        queryClient.invalidateQueries({ queryKey: ['rbac', 'users'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
      ])
    },
  })
}

export function useUpdateRbacUserRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, payload }) => updateUserRoleApi(userId, payload),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rbac', 'users'] }),
        variables?.userId ? queryClient.invalidateQueries({ queryKey: queryKeys.rbac.userPermissions(variables.userId) }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['coaches'] }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
      ])
    },
  })
}

export function useUpdateRbacUserPermissionOverridesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, overrides }) => updateUserPermissionOverridesApi(userId, overrides),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rbac', 'users'] }),
        variables?.userId ? queryClient.invalidateQueries({ queryKey: queryKeys.rbac.userPermissions(variables.userId) }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
      ])
    },
  })
}

export function useWaitlistByOccurrenceQuery(occurrenceId, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.waitlist.byOccurrence(occurrenceId),
    queryFn: () => getWaitlistByOccurrenceApi(occurrenceId),
    enabled: Boolean(enabled && occurrenceId),
    ...shortDefaults,
  })
}

export function useOccurrenceSpotsQuery(occurrenceId, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.spots.byOccurrence(occurrenceId),
    queryFn: () => getOccurrenceSpotsApi({ occurrenceId }),
    enabled: Boolean(enabled && occurrenceId),
    ...shortDefaults,
  })
}

export function useAddMyMembershipBeneficiaryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ membershipId, email }) => addMyMembershipBeneficiaryApi(membershipId, email),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myFinancialState }),
      ])
    },
  })
}

export function useRemoveMyMembershipBeneficiaryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ membershipId, beneficiaryId }) => removeMyMembershipBeneficiaryApi(membershipId, beneficiaryId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myFinancialState }),
      ])
    },
  })
}

export function useCreatePayTableMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPayTableApi,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payTable.all }),
        queryClient.invalidateQueries({ queryKey: ['reports', 'coachesPayments'] }),
      ])
    },
  })
}

export function useUpdatePayTableMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => updatePayTableApi(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payTable.all }),
        queryClient.invalidateQueries({ queryKey: ['reports', 'coachesPayments'] }),
      ])
    },
  })
}

export function useDeletePayTableMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePayTableApi,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payTable.all }),
        queryClient.invalidateQueries({ queryKey: ['reports', 'coachesPayments'] }),
      ])
    },
  })
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProductApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'products'] })
    },
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateProductApi(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'products'] })
    },
  })
}

export function useUpdateProductStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => updateProductStatusApi(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'products'] })
    },
  })
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProductApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'products'] })
    },
  })
}

export function useCreateProductCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProductCategoryApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'productCategories'] })
    },
  })
}

export function useUpdateProductCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateProductCategoryApi(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'productCategories'] })
    },
  })
}

export function useUpdateProductCategoryStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => updateProductCategoryStatusApi(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'productCategories'] })
    },
  })
}

export function useDeleteProductCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProductCategoryApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'productCategories'] })
    },
  })
}

export function invalidatePosSaleSideEffects(queryClient, { customerId } = {}) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'pos'] }),
    queryClient.invalidateQueries({ queryKey: ['finance'] }),
    queryClient.invalidateQueries({ queryKey: ['cashClosings'] }),
    queryClient.invalidateQueries({ queryKey: ['reports'] }),
    queryClient.invalidateQueries({ queryKey: ['activity'] }),
    queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    queryClient.invalidateQueries({ queryKey: ['packages'] }),
    queryClient.invalidateQueries({ queryKey: ['clients'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myFinancialState }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myCreditMovements() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myPayments() }),
    customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(customerId) }) : Promise.resolve(),
    customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.adminClientDetail(customerId) }) : Promise.resolve(),
    customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.myFinancialState }) : Promise.resolve(),
    customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships }) : Promise.resolve(),
    customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.myCreditMovements() }) : Promise.resolve(),
    customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.myPayments() }) : Promise.resolve(),
    queryClient.invalidateQueries({ queryKey: queryKeys.packages.list() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.packages.public() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.packages() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.users() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.pos() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.finance() }),
  ])
}

export function invalidateClassSideEffects(queryClient, { classId, occurrenceId, coachId } = {}) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['classes'] }),
    queryClient.invalidateQueries({ queryKey: ['coaches'] }),
    queryClient.invalidateQueries({ queryKey: ['coachAgenda'] }),
    queryClient.invalidateQueries({ queryKey: ['reservations'] }),
    queryClient.invalidateQueries({ queryKey: ['spots'] }),
    queryClient.invalidateQueries({ queryKey: ['spotHolds'] }),
    queryClient.invalidateQueries({ queryKey: ['waitlist'] }),
    queryClient.invalidateQueries({ queryKey: ['reports'] }),
    queryClient.invalidateQueries({ queryKey: ['activity'] }),
    queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    classId ? queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(classId) }) : Promise.resolve(),
    classId ? queryClient.invalidateQueries({ queryKey: queryKeys.classes.list({}) }) : Promise.resolve(),
    classId ? queryClient.invalidateQueries({ queryKey: queryKeys.classes.occurrences(classId) }) : Promise.resolve(),
    occurrenceId ? queryClient.invalidateQueries({ queryKey: queryKeys.occurrenceRoster.detail(occurrenceId) }) : Promise.resolve(),
    occurrenceId ? queryClient.invalidateQueries({ queryKey: queryKeys.waitlist.byOccurrence(occurrenceId) }) : Promise.resolve(),
    occurrenceId ? queryClient.invalidateQueries({ queryKey: queryKeys.spots.byOccurrence(occurrenceId) }) : Promise.resolve(),
    occurrenceId ? queryClient.invalidateQueries({ queryKey: queryKeys.spotHolds.byOccurrence(occurrenceId) }) : Promise.resolve(),
    coachId ? queryClient.invalidateQueries({ queryKey: queryKeys.coaches.detail(coachId) }) : Promise.resolve(),
    queryClient.invalidateQueries({ queryKey: queryKeys.coaches.list() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.coaches.public() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.coachAgenda.me() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.topClasses() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.occupancyByDiscipline() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.coaches() }),
    Promise.resolve(useClasesStore.getState().loadClasesFromApi({ force: true }).catch(() => {})),
  ])
}

export function useCreatePosSaleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSaleApi,
    onSuccess: async (_, variables) => {
      await Promise.all([
        invalidatePosSaleSideEffects(queryClient, { customerId: variables?.customerId }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'sales'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'products'] }),
      ])
    },
  })
}

export function useExecuteCashClosingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: executeCashClosing,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cashClosings'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'sales'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'finanzas'] }),
      ])
    },
  })
}

function invalidateExpenseRelatedQueries(queryClient, expenseId) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    queryClient.invalidateQueries({ queryKey: ['cashClosings'] }),
    expenseId ? queryClient.invalidateQueries({ queryKey: queryKeys.expenses.detail(expenseId) }) : Promise.resolve(),
  ])
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createExpense,
    onSuccess: async () => {
      await invalidateExpenseRelatedQueries(queryClient)
    },
  })
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateExpense(id, payload),
    onSuccess: async (_, variables) => {
      await invalidateExpenseRelatedQueries(queryClient, variables?.id)
    },
  })
}

export function useCancelExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => cancelExpense(id, reason),
    onSuccess: async (_, variables) => {
      await invalidateExpenseRelatedQueries(queryClient, variables?.id)
    },
  })
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: async (_, expenseId) => {
      await invalidateExpenseRelatedQueries(queryClient, expenseId)
    },
  })
}

export function useAdminClientsQuery({ page = 1, pageSize = 20, search, status, membershipStatus, enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.adminClients({ page, pageSize, search: search || '', status: status || 'all', membershipStatus: membershipStatus || 'all' }),
    queryFn: () => getClientsPaginatedApi({ page, pageSize, search, status, membershipStatus }),
    enabled,
    placeholderData: (previousData) => previousData,
    ...shortDefaults,
  })
}

export function useAdminClientDetailQuery(clientId, { enabled = false } = {}) {
  return useQuery({
    queryKey: queryKeys.adminClientDetail(clientId),
    queryFn: () => getClientByIdApi(clientId),
    enabled: Boolean(enabled && clientId),
    ...shortDefaults,
  })
}

function invalidateAdminClients(queryClient, clientId) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] }),
    clientId ? queryClient.invalidateQueries({ queryKey: queryKeys.adminClientDetail(clientId) }) : Promise.resolve(),
  ])
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createClientApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] })
    },
  })
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateClientApi(id, payload),
    onSuccess: async (_, variables) => {
      await invalidateAdminClients(queryClient, variables?.id)
    },
  })
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteClientApi,
    onSuccess: async (_, clientId) => {
      await invalidateAdminClients(queryClient, clientId)
    },
  })
}

export function useAssignClientPackageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, packageId, notes }) => assignClientPackageApi(id, { packageId, notes }),
    onSuccess: async (_, variables) => {
      await invalidateAdminClients(queryClient, variables?.id)
    },
  })
}

export function useAdjustClientCreditsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount, reason, notes }) => adjustClientCreditsApi(id, { amount, reason, notes }),
    onSuccess: async (_, variables) => {
      await invalidateAdminClients(queryClient, variables?.id)
    },
  })
}

export function useAddClientMembershipBeneficiaryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clientId, membershipId, email }) => addClientMembershipBeneficiaryApi(clientId, membershipId, email),
    onSuccess: async (_, variables) => {
      await invalidateAdminClients(queryClient, variables?.clientId)
    },
  })
}

export function useRemoveClientMembershipBeneficiaryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clientId, membershipId, beneficiaryId }) => removeClientMembershipBeneficiaryApi(clientId, membershipId, beneficiaryId),
    onSuccess: async (_, variables) => {
      await invalidateAdminClients(queryClient, variables?.clientId)
    },
  })
}

// -- Asientos / holds / reservas --------------------------------------------

function invalidateSpotsAndHolds(queryClient, occurrenceId) {
  if (!occurrenceId) return Promise.resolve()
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.spots.byOccurrence(occurrenceId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.spotHolds.byOccurrence(occurrenceId) }),
  ])
}

export function invalidateReservationSideEffects(queryClient, { occurrenceId, classId } = {}) {
  return Promise.all([
    invalidateSpotsAndHolds(queryClient, occurrenceId),
    queryClient.invalidateQueries({ queryKey: queryKeys.reservations.me() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reservations.list() }),
    classId ? queryClient.invalidateQueries({ queryKey: queryKeys.classes.occurrences(classId) }) : Promise.resolve(),
    occurrenceId ? Promise.all([
      queryClient.invalidateQueries({ queryKey: ['occurrenceRoster', occurrenceId] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.occurrenceRoster.detail(occurrenceId) }),
    ]) : Promise.resolve(),
    occurrenceId ? queryClient.invalidateQueries({ queryKey: queryKeys.waitlist.byOccurrence(occurrenceId) }) : Promise.resolve(),
    queryClient.invalidateQueries({ queryKey: queryKeys.myFinancialState }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myCreditMovements() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.activity.list() }),
  ])
}

export function useCreateSpotHoldMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ occurrenceId, spotId }) => createSpotHoldApi({ occurrenceId, spotId }),
    onSuccess: async (_data, variables) => {
      await invalidateSpotsAndHolds(queryClient, variables?.occurrenceId)
    },
  })
}

export function useDeleteSpotHoldMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ holdId }) => releaseSpotHoldApi({ holdId }),
    onSuccess: async (_data, variables) => {
      await invalidateSpotsAndHolds(queryClient, variables?.occurrenceId)
    },
  })
}

export function useCreateReservationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ claseId, userId, asiento, occurrenceId, spotId, holdId }) =>
      crearReservaApi({ claseId, userId, asiento, occurrenceId, spotId, holdId }),
    onSuccess: async (_data, variables) => {
      await invalidateReservationSideEffects(queryClient, { occurrenceId: variables?.occurrenceId, classId: variables?.claseId })
    },
  })
}

export function useCancelReservationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reservationId }) => cancelarReservaApi(reservationId),
    onSuccess: async (_data, variables) => {
      await invalidateReservationSideEffects(queryClient, { occurrenceId: variables?.occurrenceId, classId: variables?.classId })
    },
  })
}
