import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import ClasesSection from './ClasesSection'

const toastError = vi.fn()
const toastSuccess = vi.fn()
const agregarClase = vi.fn()
const loadClasesFromApi = vi.fn()
const limpiarClase = vi.fn()
const getPorClase = vi.fn(() => [])
const invalidateQueries = vi.fn()

let currentPermissions = ['classes.read', 'classes.create', 'classes.update', 'classes.delete', 'classes.roster.read']

vi.mock('react-hot-toast', () => ({
  default: {
    error: (...args) => toastError(...args),
    success: (...args) => toastSuccess(...args),
  },
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries,
    }),
  }
})

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    usuario: {
      id: 1,
      permissions: currentPermissions,
    },
  }),
}))

vi.mock('@/stores/clasesStore', () => ({
  useClasesStore: Object.assign(() => ({ agregarClase }), {
    getState: () => ({ loadClasesFromApi }),
  }),
}))

vi.mock('@/stores/listaEsperaStore', () => ({
  useListaEsperaStore: Object.assign(() => ({ getPorClase }), {
    getState: () => ({ limpiarClase }),
  }),
}))

vi.mock('@/hooks/useClasses', () => ({
  useClasses: () => ({
    classes: [
      {
        id: 1,
        nombre: 'Clase Demo',
        tipo: 'Stryde X',
        coachNombre: 'Coach Demo',
        dia: 'Lunes',
        hora: '07:00',
        duracion: 50,
        cupoActual: 0,
        cupoMax: 10,
        fecha: '2026-06-09',
      },
    ],
  }),
}))

vi.mock('@/components/ui/DateNavigator', () => ({
  default: () => <div data-testid="date-navigator" />,
}))

vi.mock('@/components/ui/InfiniteList', () => ({
  default: ({ items, renderItem }) => <div>{items.map((item) => renderItem(item))}</div>,
}))

vi.mock('@/components/ui/PaginationControls', () => ({
  default: () => <div data-testid="pagination-controls" />,
}))

vi.mock('@/services/reservasService', () => ({
  eliminarClaseConReservas: vi.fn(),
}))

vi.mock('@/services/actividadService', () => ({
  logClaseEliminada: vi.fn(),
  logClaseCreada: vi.fn(),
}))

vi.mock('@/services/clasesApiService', () => ({
  createClaseApi: vi.fn(),
  deleteClaseApi: vi.fn(),
  getClasesPaginatedApi: vi.fn(),
}))

vi.mock('@/services/occurrencesApiService', () => ({
  getOccurrencesForDateRangeApi: vi.fn(),
}))

vi.mock('@/hooks/useApiQueries', () => ({
  invalidateClassSideEffects: vi.fn(),
}))

vi.mock('../classApiPayload', () => ({
  buildClaseApiPayload: vi.fn(),
}))

vi.mock('../adminClassesApiUtils', () => ({
  buildAdminClasesApiQuery: vi.fn(),
}))

vi.mock('../adminClassOccurrenceUtils', () => ({
  buildAdminClassOccurrenceRows: vi.fn(),
  filterAdminClassRows: vi.fn(),
}))

function renderSection() {
  return render(
    <ClasesSection
      clases={[{ id: 1, nombre: 'Clase Demo', tipo: 'Stryde X', coachNombre: 'Coach Demo', dia: 'Lunes', hora: '07:00', duracion: 50, cupoActual: 0, cupoMax: 10, fecha: '2026-06-09' }]}
      clasesFilter="Todas"
      setClasesFilter={vi.fn()}
      selectMode={false}
      setSelectMode={vi.fn()}
      selectedIds={new Set()}
      setSelectedIds={vi.fn()}
      coaches={[{ id: 1, nombre: 'Coach Demo' }]}
      disciplinas={[]}
      openModal={vi.fn()}
      setModalAlumnosClase={vi.fn()}
      setAlumnoAgregarId={vi.fn()}
      setModalEditClase={vi.fn()}
      setEditClaseForm={vi.fn()}
      claseForm={{}}
      setClaseForm={vi.fn()}
      refreshToken={0}
    />
  )
}

describe('ClasesSection permisos', () => {
  beforeEach(() => {
    currentPermissions = ['classes.read', 'classes.create', 'classes.update', 'classes.delete', 'classes.roster.read']
    toastError.mockReset()
    toastSuccess.mockReset()
    agregarClase.mockReset()
    loadClasesFromApi.mockReset()
    limpiarClase.mockReset()
    getPorClase.mockReset()
    getPorClase.mockReturnValue([])
    invalidateQueries.mockReset()
    vi.stubEnv('VITE_USE_API_CLASSES', 'false')
  })

  test('admin con permisos ve crear, importar, editar y borrar', () => {
    renderSection()

    expect(screen.getByRole('button', { name: '+ Nueva Clase' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '📊 Importar Excel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🗑' })).toBeInTheDocument()
    expect(screen.getByTitle('Ver alumnos')).toBeEnabled()
  })

  test('usuario sin permisos ve roster bloqueado y no ve acciones de edición', () => {
    currentPermissions = ['classes.read']

    renderSection()

    expect(screen.queryByRole('button', { name: '+ Nueva Clase' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '📊 Importar Excel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Eliminar/i })).not.toBeInTheDocument()
    expect(screen.getByTitle('No tienes permisos para ver alumnos')).toBeDisabled()
  })
})
