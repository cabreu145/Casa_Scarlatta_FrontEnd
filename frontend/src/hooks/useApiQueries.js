import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'
import { getMyFinancialStateApi, getMyCreditMovementsPaginatedApi } from '@/services/financialStateApiService'
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
import {
  adjustClientCreditsApi,
  assignClientPackageApi,
  createClientApi,
  deleteClientApi,
  getClientByIdApi,
  getClientsPaginatedApi,
  updateClientApi,
} from '@/services/clientsApiService'
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

export function useCreatePosSaleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSaleApi,
    onSuccess: async (_, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'sales'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'products'] }),
        variables?.customerId
          ? queryClient.invalidateQueries({ queryKey: queryKeys.adminClientDetail(variables.customerId) })
          : Promise.resolve(),
        variables?.customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.myFinancialState }) : Promise.resolve(),
        variables?.customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] }),
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
