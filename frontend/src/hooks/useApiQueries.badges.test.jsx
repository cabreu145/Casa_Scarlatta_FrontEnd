import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import {
  getCoachesPaginatedApi,
} from '@/services/coachesApiService'
import {
  getClientsPaginatedApi,
} from '@/services/clientsApiService'
import {
  useAdminClientsActiveCountQuery,
  useAdminCoachesActiveCountQuery,
} from './useApiQueries'

vi.mock('@/services/coachesApiService', async () => {
  const actual = await vi.importActual('@/services/coachesApiService')
  return {
    ...actual,
    getCoachesPaginatedApi: vi.fn(),
  }
})

vi.mock('@/services/clientsApiService', async () => {
  const actual = await vi.importActual('@/services/clientsApiService')
  return {
    ...actual,
    getClientsPaginatedApi: vi.fn(),
  }
})

function renderWithQueryClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

function CoachesProbe() {
  const query = useAdminCoachesActiveCountQuery({ enabled: true })
  return <div>{String(query.data ?? '')}</div>
}

function ClientsProbe() {
  const query = useAdminClientsActiveCountQuery({ enabled: true })
  return <div>{String(query.data ?? '')}</div>
}

describe('useApiQueries badge counts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('usa total backend para coaches activos', async () => {
    getCoachesPaginatedApi.mockResolvedValue({ total: 7, items: [] })

    renderWithQueryClient(<CoachesProbe />)

    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument())
    expect(getCoachesPaginatedApi).toHaveBeenCalledWith({ page: 1, pageSize: 1, status: 'active' })
  })

  it('usa total backend para clientes activos', async () => {
    getClientsPaginatedApi.mockResolvedValue({ total: 19, items: [] })

    renderWithQueryClient(<ClientsProbe />)

    await waitFor(() => expect(screen.getByText('19')).toBeInTheDocument())
    expect(getClientsPaginatedApi).toHaveBeenCalledWith({ page: 1, pageSize: 1, status: 'active' })
  })
})
