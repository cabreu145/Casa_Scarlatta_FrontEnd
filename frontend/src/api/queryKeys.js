export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  classes: {
    list: (params = {}) => ['classes', 'list', params],
    detail: (id) => ['classes', 'detail', id],
    occurrences: (classId, params = {}) => ['classes', 'occurrences', classId, params],
  },
  reservations: {
    me: (params = {}) => ['reservations', 'me', params],
    list: (params = {}) => ['reservations', 'list', params],
  },
  waitlist: {
    byOccurrence: (occurrenceId) => ['waitlist', 'byOccurrence', occurrenceId],
  },
  spots: {
    byOccurrence: (occurrenceId) => ['spots', 'byOccurrence', occurrenceId],
  },
  myFinancialState: ['client', 'me', 'financialState'],
  myMemberships: ['client', 'me', 'memberships'],
  myCreditMovements: (params = {}) => ['client', 'me', 'creditMovements', params],
  myPayments: (params = {}) => ['client', 'me', 'payments', params],
  occurrenceRoster: {
    detail: (occurrenceId, includeCanceled = false) => ['occurrenceRoster', occurrenceId, { includeCanceled: Boolean(includeCanceled) }],
  },
  adminBadges: {
    coachesActive: () => ['admin', 'badges', 'coachesActive'],
    clientsActive: () => ['admin', 'badges', 'clientsActive'],
  },
  coaches: {
    list: (params = {}) => ['coaches', 'list', params],
    detail: (id) => ['coaches', 'detail', id],
    public: () => ['coaches', 'public'],
  },
  clients: {
    list: (params = {}) => ['clients', 'list', params],
    detail: (id) => ['clients', 'detail', id],
  },
  packages: {
    list: (params = {}) => ['packages', 'list', params],
    public: (params = {}) => ['packages', 'public', params],
  },
  adminClients: (params = {}) => ['admin', 'clients', params],
  adminClientDetail: (clientId) => ['admin', 'clients', clientId],
  adminPackages: (params = {}) => ['admin', 'packages', params],
  activity: {
    list: (params = {}) => ['activity', 'list', params],
  },
  emailConfig: {
    detail: () => ['emailConfig', 'detail'],
  },
  notifications: {
    list: (params = {}) => ['notifications', 'list', params],
    unreadCount: () => ['notifications', 'unreadCount'],
  },
  emailOutbox: {
    list: (params = {}) => ['emailOutbox', 'list', params],
  },
  expenses: {
    list: (params = {}) => ['expenses', 'list', params],
    detail: (id) => ['expenses', 'detail', id],
  },
  posProducts: (params = {}) => ['admin', 'pos', 'products', params],
  posProductCategories: (params = {}) => ['admin', 'pos', 'productCategories', params],
  posSales: (params = {}) => ['admin', 'pos', 'sales', params],
  posSaleDetail: (saleId) => ['admin', 'pos', 'sales', saleId],
  posSaleTicket: (saleId) => ['admin', 'pos', 'sales', saleId, 'ticket'],
  cashClosings: {
    today: ['cashClosings', 'today'],
    list: (params = {}) => ['cashClosings', 'list', params],
    detail: (id) => ['cashClosings', 'detail', id],
  },
  finance: {
    kpis: (params = {}) => ['finance', 'kpis', params],
    day: (date) => ['finance', 'day', date],
    historical: (params = {}) => ['finance', 'historical', params],
    categories: (params = {}) => ['finance', 'categories', params],
    lowStock: (params = {}) => ['finance', 'lowStock', params],
    recentSales: (params = {}) => ['finance', 'recentSales', params],
  },
  payTable: {
    all: ['payTable'],
    list: (params = {}) => ['payTable', 'list', params],
  },
  reports: {
    finance: (params = {}) => ['reports', 'finance', params],
    users: (params = {}) => ['reports', 'users', params],
    packages: (params = {}) => ['reports', 'packages', params],
    pos: (params = {}) => ['reports', 'pos', params],
    coaches: (params = {}) => ['reports', 'coaches', params],
    coachesPayments: (params = {}) => ['reports', 'coachesPayments', params],
    topClasses: (params = {}) => ['reports', 'topClasses', params],
    occupancyByDiscipline: (params = {}) => ['reports', 'occupancyByDiscipline', params],
  },
}
