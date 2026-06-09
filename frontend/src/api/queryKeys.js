export const queryKeys = {
  myFinancialState: ['client', 'me', 'financialState'],
  myMemberships: ['client', 'me', 'memberships'],
  myCreditMovements: (params = {}) => ['client', 'me', 'creditMovements', params],
  myPayments: (params = {}) => ['client', 'me', 'payments', params],
  adminClients: (params = {}) => ['admin', 'clients', params],
  adminClientDetail: (clientId) => ['admin', 'clients', clientId],
  adminPackages: (params = {}) => ['admin', 'packages', params],
  posProducts: (params = {}) => ['admin', 'pos', 'products', params],
  posProductCategories: (params = {}) => ['admin', 'pos', 'productCategories', params],
  posSales: (params = {}) => ['admin', 'pos', 'sales', params],
  posSaleDetail: (saleId) => ['admin', 'pos', 'sales', saleId],
  posSaleTicket: (saleId) => ['admin', 'pos', 'sales', saleId, 'ticket'],
}
