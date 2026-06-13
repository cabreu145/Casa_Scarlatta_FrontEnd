import { useCallback, useState, useRef, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import PasswordInput from '@/components/ui/PasswordInput'
import DashboardSection from './sections/DashboardSection'
import CoachesSection from './sections/CoachesSection'
import ClasesSection from './sections/ClasesSection'
import PaquetesSection from './sections/PaquetesSection'
import PuntoDeVentaSection from './sections/PuntoDeVentaSection'
import PosEntityModal from './components/PosEntityModal'
import UsuariosSection from './sections/UsuariosSection'
import CortesSection from './sections/CortesSection'
import GastosSection from './sections/GastosSection'
import ActividadSection from './sections/ActividadSection'
import ConfiguracionSection from './sections/ConfiguracionSection'
import ModalPago from '../../features/pagos/ModalPago'
import {
  logReservaCreada, logReservaCancelada, logUsuarioNuevo,
  logPaqueteVendido, logInsumoVendido, logCorteCaja,
  logClaseCreada, logClaseEliminada,
  logCoachAgregado, logCoachEliminado,
} from '@/services/actividadService'
import { procesarVentaService, getDailyIncome, getIncomeByCategory } from '../../services/ventaService'
import { crearCoachService } from '@/services/coachesService'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import styles from './AdminPanel.module.css'
import { useTransaccionesStore }       from '@/stores/transaccionesStore'
import { useGastosStore, TIPOS_GASTO } from '@/stores/gastosStore'
import { useCortesStore }              from '@/stores/cortesStore'
import { useAuthStore }                from '@/stores/authStore'
import { useCoachesStore }   from '@/stores/coachesStore'
import { useProductosStore } from '@/stores/productosStore'
import { useClasesStore }      from '@/stores/clasesStore'
import { useReservasStore }    from '@/stores/reservasStore'
import { usePaquetesStore }    from '@/stores/paquetesStore'
import { useUsuariosStore }    from '@/stores/usuariosStore'
import { useListaEsperaStore } from '@/stores/listaEsperaStore'
import { reservarClase as reservarClaseService, cancelarReserva as cancelarReservaService, eliminarClaseConReservas, marcarNoAsistio } from '@/services/reservasService'
import { borrarCoachService } from '@/services/coachesService'
import { useDisciplinasStore } from '@/stores/disciplinasStore'
import SeatSelector from '@/features/clases/SeatSelector'
import { FinanzasSection } from './AdminFinanzas'
import { ReportesSection } from './AdminReportes'
import CompartirPaquete from '@/features/paquetes/CompartirPaquete'
import { createClaseApi, createClassOccurrenceApi, updateClaseApi } from '@/services/clasesApiService'
import {
  createCoachApi,
  deleteCoachApi,
  getCoachesPaginatedApi,
  uploadCoachAvatarApi,
  updateCoachApi,
  updateCoachStatusApi,
} from '@/services/coachesApiService'
import { buildClaseApiPayload } from './classApiPayload'
import { buildCoachApiPayload, validateCoachApiPayload } from './coachApiPayload'
import { buildPackageApiPayload, validatePackageApiPayload } from './packageApiPayload'
import { buildPosProductApiPayload, validatePosProductApiPayload } from './posApiPayload'
import {
  buildClientEnrollmentLabel,
} from './adminClassOccurrenceUtils'
import PaginationControls from '@/components/ui/PaginationControls'
import { paginateArray } from '@/utils/paginationUtils'
import { getClassDisplayTime } from '@/utils/classSchedule'
import {
  formatPackagePriceLabel,
  formatPackageCreditsLabel,
  formatPackageShareabilityLabel,
  formatPackageValidityLabel,
  getPackageBenefits,
  getPackageDisplayName,
  getPackageCredits,
} from '@/utils/packageDisplay'
import { queryKeys } from '@/api/queryKeys'
import {
  useAdminClientDetailQuery,
  useAdminClientsQuery,
  useAdminClientsActiveCountQuery,
  useAdminCoachesActiveCountQuery,
  invalidateClassSideEffects,
  useCreateProductMutation,
  useDeleteProductMutation,
  useOccurrenceRosterQuery,
  useProductCategoriesQuery,
  useUpdateProductMutation,
} from '@/hooks/useApiQueries'
import { COACHES_SELECTOR_PAGE_SIZE } from './adminCoachesApiUtils'
import { ADMIN_PACKAGES_PAGE_SIZE, buildAdminPackagesApiQuery } from './adminPackagesApiUtils'
import { resolveCoachAvatarUrl } from '@/adapters/coachAdapter'
import {
  ADMIN_SECTION_PERMISSIONS,
  canAccessAdminSection,
  hasAnyPermission,
  hasPermission,
  isRole,
} from '@/auth/permissions'
import {
  adjustClientCreditsApi,
  assignClientPackageApi,
  createClientApi,
  deleteClientApi,
  getClientByIdApi,
  getClientsPaginatedApi,
  updateClientApi,
} from '@/services/clientsApiService'
import { buildClientApiPayload, validateClientApiPayload } from './clientApiPayload'
import { ADMIN_CLIENTS_PAGE_SIZE, buildAdminClientsApiQuery } from './adminClientsApiUtils'
import {
  createMembershipPackageApi,
  deleteMembershipPackageApi,
  getMembershipPackagesPaginatedApi,
  updateMembershipPackageApi,
  updateMembershipPackageFeaturedApi,
  updateMembershipPackageStatusApi,
} from '@/services/membershipPackagesApiService'
import {
  addClientMembershipBeneficiaryApi,
  removeClientMembershipBeneficiaryApi,
} from '@/services/clientMembershipsApiService'

function pad2(value) {
  return String(value).padStart(2, '0')
}

function buildOccurrencePayloadFromClassForm(form, classPayload = {}) {
  const occurrenceDate = String(form?.fecha ?? '').trim()
  const startTime = String(form?.hora ?? '07:00').trim() || '07:00'
  const durationMin = Number(classPayload?.duration_minutes ?? form?.duracion ?? 50) || 50
  const capacityMax = Number(classPayload?.capacity_max ?? form?.cupoMax ?? 15) || 15
  const startDate = new Date(`${occurrenceDate}T${startTime}:00`)
  const endDate = new Date(startDate)
  endDate.setMinutes(endDate.getMinutes() + durationMin)
  const endAt = `${endDate.getFullYear()}-${pad2(endDate.getMonth() + 1)}-${pad2(endDate.getDate())}T${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}:00`
  return {
    occurrence_date: occurrenceDate,
    start_at: `${occurrenceDate}T${startTime}:00`,
    end_at: endAt,
    duration_min: durationMin,
    capacity_max: capacityMax,
    coach_id: classPayload?.coach_id ?? null,
    status: 'programada',
  }
}

// ── adminLinks export (used by other admin pages) ────────────────────────────
import { LayoutDashboard, Users, UserCheck, CalendarDays, Package, BarChart2, DollarSign, Menu, X } from 'lucide-react'
export const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/paquetes',  icon: Package,         label: 'Paquetes'  },
  { to: '/admin/coaches',   icon: UserCheck,       label: 'Coaches'   },
  { to: '/admin/clases',    icon: CalendarDays,    label: 'Clases'    },
  { to: '/admin/usuarios',  icon: Users,           label: 'Usuarios'  },
  { to: '/admin/finanzas',  icon: DollarSign,      label: 'Finanzas'  },
  { to: '/admin/gastos',    icon: DollarSign,      label: 'Gastos'    },
  { to: '/admin/cortes',    icon: DollarSign,      label: 'Cortes'    },
  { to: '/admin/reportes',  icon: BarChart2,       label: 'Reportes'  },
]

// ── Section metadata ─────────────────────────────────────────────────────────
const SECTIONS = {
  dashboard: { title: 'Dashboard',        sub: ''                                    },
  coaches:   { title: 'Coaches',          sub: 'Gestión y perfiles del equipo'       },
  clases:    { title: 'Clases',           sub: 'Calendario y gestión de clases'      },
  paquetes:  { title: 'Paquetes',         sub: 'Gestión y venta de paquetes'         },
  pos:       { title: 'Punto de Venta',   sub: 'Venta de productos en estudio'       },
  usuarios:  { title: 'Usuarios',         sub: 'Gestión de miembros activos'         },
  finanzas:  { title: 'Finanzas',         sub: 'Resumen financiero del estudio'       },
  gastos:    { title: 'Gastos',           sub: 'Control de gastos operativos'        },
  cortes:    { title: 'Cortes',           sub: 'Corte diario e historial de caja'     },
  reportes:  { title: 'Reportes',         sub: 'Descarga y análisis de datos'        },
  actividad:      { title: 'Actividad',      sub: 'Historial de eventos del sistema'    },
  configuracion:  { title: 'Configuración', sub: 'Ajustes del estudio'                 },
}

// ── POS products ─────────────────────────────────────────────────────────────
const PRODUCTS = [
  { emoji: '💧', name: 'Agua natural',     price: 25  },
  { emoji: '🫧', name: 'Agua mineral',     price: 30  },
  { emoji: '🥤', name: 'Smoothie verde',   price: 90  },
  { emoji: '🍓', name: 'Smoothie proteína',price: 110 },
  { emoji: '👕', name: 'Top deportivo',    price: 380 },
  { emoji: '🩱', name: 'Leggings CS',      price: 650 },
  { emoji: '🧴', name: 'Proteína',         price: 280 },
  { emoji: '🏋️', name: 'Toalla CS',        price: 180 },
  { emoji: '✨', name: 'Colágeno',         price: 95  },
]

const PAQUETES_POS = [
  { emoji: '📦', name: 'Básico — 8 clases',    price: 999  },
  { emoji: '📦', name: 'Esencial — 16 clases',  price: 1499 },
  { emoji: '⭐', name: 'Premium — 24 clases',  price: 1999 },
]

// ── Tag helper ───────────────────────────────────────────────────────────────
function Tag({ color, children }) {
  const cls = {
    green:  styles.tagGreen,
    red:    styles.tagRed,
    yellow: styles.tagYellow,
    blue:   styles.tagBlue,
    pink:   styles.tagPink,
    gray:   styles.tagGray,
  }[color] || styles.tagGreen
  return <span className={`${styles.miniTag} ${cls}`}>{children}</span>
}

// ── Category emoji fallback ──────────────────────────────────────────────────
function categoryEmoji(categoria) {
  return { Accesorios: '🎽', Nutrición: '🧴', Equipo: '🏋️', Ropa: '👕' }[categoria] || '📦'
}

function resolveMembershipErrorMessage(error) {
  const raw = String(error?.message ?? '').trim()
  if (raw === 'SHARED_CREDITS_NOT_DIVISIBLE') {
    return 'Este paquete no se puede dividir exactamente entre los beneficiarios seleccionados.'
  }
  if (raw === 'SHARED_BENEFICIARY_CHANGE_ADMIN_ONLY') {
    return 'Los cambios posteriores deben solicitarse a administración.'
  }
  if (raw === 'SHARED_MEMBERSHIP_HAS_CONSUMPTION') {
    return 'No se pueden modificar beneficiarios porque ya hay consumo de créditos.'
  }
  if (raw === 'BENEFICIARY_NOT_FOUND') {
    return 'No encontramos un cliente con ese correo.'
  }
  if (raw === 'BENEFICIARY_ROLE_INVALID') {
    return 'El beneficiario debe ser un cliente registrado.'
  }
  return raw || 'No se pudo actualizar la membresía compartida.'
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AdminPanel({ initialSection = 'dashboard' }) {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState(initialSection)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [modalType, setModalType]         = useState(null) // null | 'coach' | 'clase' | 'paquete' | 'usuario'
  const useApiClasses = import.meta.env.VITE_USE_API_CLASSES === 'true'
  const useApiReservations = import.meta.env.VITE_USE_API_RESERVATIONS === 'true'
  const useApiCoaches = useApiClasses
  const useApiClients = import.meta.env.VITE_USE_API_AUTH === 'true'
  const useApiPackages = useApiClients
  const useApiExpenses = useApiClients
  const useApiPos = useApiClasses || useApiClients
  const useApiMode = useApiClasses || useApiClients || useApiPackages || useApiExpenses || useApiPos || useApiCoaches
  const coachesBadgeQuery = useAdminCoachesActiveCountQuery({ enabled: useApiCoaches })
  const clientsBadgeQuery = useAdminClientsActiveCountQuery({ enabled: useApiClients })
  const [apiCoaches, setApiCoaches] = useState([])
  const [apiCoachList, setApiCoachList] = useState([])
  const [apiCoachesLoading, setApiCoachesLoading] = useState(false)
  const [apiCoachesError, setApiCoachesError] = useState('')
  const [apiCoachListLoading, setApiCoachListLoading] = useState(false)
  const [apiCoachListError, setApiCoachListError] = useState('')
  const [coachesSearch, setCoachesSearch] = useState('')
  const [coachesStatus, setCoachesStatus] = useState('Todos')
  const [coachesRefreshToken, setCoachesRefreshToken] = useState(0)
  const [clasesRefreshToken, setClasesRefreshToken] = useState(0)
  const [apiClients, setApiClients] = useState([])
  const [apiClientsLoading, setApiClientsLoading] = useState(false)
  const [apiClientsError, setApiClientsError] = useState('')
  const [apiClientsTotal, setApiClientsTotal] = useState(0)
  const [apiClientsPage, setApiClientsPage] = useState(1)
  const [apiClientsRefreshToken, setApiClientsRefreshToken] = useState(0)
  const [apiClientDetailLoading, setApiClientDetailLoading] = useState(false)
  const [apiPackages, setApiPackages] = useState([])
  const [apiPackagesLoading, setApiPackagesLoading] = useState(false)
  const [apiPackagesError, setApiPackagesError] = useState('')
  const [apiPackagesTotal, setApiPackagesTotal] = useState(0)
  const [apiPackagesPage, setApiPackagesPage] = useState(1)
  const [apiPackagesSearch, setApiPackagesSearch] = useState('')
  const [apiPackagesStatus, setApiPackagesStatus] = useState('active')
  const [apiPackagesRefreshToken, setApiPackagesRefreshToken] = useState(0)
  const [rangoDash, setRangoDash]         = useState('mes')
  const [modalPago, setModalPago]         = useState(false)
  const { coaches, agregarCoach, editarCoach, eliminarCoach } = useCoachesStore()
  const { productos, agregarProducto,
          editarProducto, eliminarProducto }               = useProductosStore()
  const { clases, agregarClase, editarClase, loadClasesFromApi } = useClasesStore()
  const { reservas: todasReservas, getReservasByClase } = useReservasStore()
  const { paquetes, agregarPaquete, editarPaquete, eliminarPaquete, marcarDestacado } = usePaquetesStore()
  const { usuarios, agregarUsuario, editarUsuario, eliminarUsuario } = useUsuariosStore()
  const { getPorClase: getListaEspera } = useListaEsperaStore()
  const { disciplinas, agregarDisciplina, eliminarDisciplina } = useDisciplinasStore()

  // ── Finanzas stores ──────────────────────────────────────────────────────────
  const { transacciones }                                               = useTransaccionesStore()
  const { cortes, ejecutarCorte }                                       = useCortesStore()
  const { usuario, logout }                                             = useAuthStore()
  const { gastos, registrarGasto, eliminarGasto }                       = useGastosStore()

  // ── Finanzas state ───────────────────────────────────────────────────────────
  const [rangoFin,   setRangoFin]   = useState('mes')
  const [modalGasto, setModalGasto] = useState(false)
  const [formGasto,  setFormGasto]  = useState({ concepto: '', monto: '', tipo: TIPOS_GASTO.OPERATIVO })

  // ── Finanzas computed ────────────────────────────────────────────────────────
  const finHoy = new Date().toISOString().split('T')[0]   // 'YYYY-MM-DD' UTC

  // Filtra por rango usando comparación de strings para evitar problemas de zona horaria
  function filtrarPorRango(arr, rango, campo = 'fecha') {
    const hoy     = finHoy
    const semana  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const mesActual = hoy.slice(0, 7) // 'YYYY-MM'
    return arr.filter(item => {
      const f = item[campo] ?? ''
      if (rango === 'dia')    return f === hoy
      if (rango === 'semana') return f >= semana
      return f.slice(0, 7) === mesActual
    })
  }

  const txFin = useMemo(() =>
    filtrarPorRango(transacciones, rangoFin)
      .sort((a, b) => (b.fecha > a.fecha ? 1 : -1)),
    [transacciones, rangoFin, finHoy]
  )

  const finTotalIngresos = useMemo(() => txFin.filter(tx => tx.monto > 0).reduce((s, tx) => s + tx.monto, 0), [txFin])
  const finTicketProm    = txFin.length > 0 ? Math.round(finTotalIngresos / txFin.length) : 0
  const finIngresosDia   = useMemo(() => getDailyIncome(),                             [transacciones])
  const finGastosRango   = useMemo(() => filtrarPorRango(gastos, rangoFin),            [gastos, rangoFin, finHoy])
  const finGastosTotales = useMemo(() => finGastosRango.reduce((s, g) => s + g.monto, 0), [finGastosRango])
  const finUtilidad      = finTotalIngresos - finGastosTotales
  const yaHayCorteHoy    = cortes.some(c => c.fecha === finHoy)

  const [cart, setCart]                   = useState([])
  const [posFilter, setPosFilter]         = useState('Todos')
  const [clasesFilter, setClasesFilter]   = useState('Todas')
  const [usersFilter, setUsersFilter]     = useState('Todos')
  const [usersSearch, setUsersSearch]     = useState('')
  const queryClient = useQueryClient()
  const adminClientsQueryParams = useMemo(
    () => buildAdminClientsApiQuery({
      page: apiClientsPage,
      pageSize: ADMIN_CLIENTS_PAGE_SIZE,
      search: usersSearch,
      filter: usersFilter,
    }),
    [apiClientsPage, usersFilter, usersSearch]
  )
  const adminClientsQuery = useAdminClientsQuery({
    ...adminClientsQueryParams,
    enabled: useApiClients,
  })
  const apiClientsFromQuery = adminClientsQuery.data?.items ?? []
  const apiClientsTotalFromQuery = adminClientsQuery.data?.total ?? 0
  const apiClientsLoadingFromQuery = adminClientsQuery.isLoading
  const apiClientsErrorFromQuery = adminClientsQuery.error?.message ?? ''
  const sectionPermissions = useMemo(() => ADMIN_SECTION_PERMISSIONS, [])
  const visibleAdminSections = useMemo(
    () => Object.keys(SECTIONS).filter((sectionId) => canAccessAdminSection(usuario, sectionId)),
    [usuario]
  )
  const firstVisibleAdminSection = visibleAdminSections[0] ?? 'dashboard'
  const canManageSettings = hasPermission(usuario, 'settings.read')
  const canReadRoles = hasPermission(usuario, 'roles.read')
  const canReadPayTable = hasPermission(usuario, 'pay_table.read')
  const canManagePayTable = hasPermission(usuario, 'pay_table.manage')
  const canReadClassRoster = hasAnyPermission(usuario, ['classes.roster.read', 'classes.roster.manage'])
  const canManageClassRoster = hasPermission(usuario, 'classes.roster.manage')
  const canManageReservations = hasPermission(usuario, 'reservations.manage')

  const denyPermission = useCallback((message = 'No tienes permisos para esta acción.') => {
    toast.error(message)
  }, [])

  const canCreateCoach = hasPermission(usuario, 'coaches.create')
  const canUpdateCoach = hasPermission(usuario, 'coaches.update')
  const canDeleteCoach = hasPermission(usuario, 'coaches.delete')
  const canManageCoachAvatar = hasPermission(usuario, 'coaches.avatar.manage')
  const canCreateClass = hasPermission(usuario, 'classes.create')
  const canUpdateClass = hasPermission(usuario, 'classes.update')
  const canDeleteClass = hasPermission(usuario, 'classes.delete')
  const canCreatePackage = hasPermission(usuario, 'packages.create')
  const canUpdatePackage = hasPermission(usuario, 'packages.update')
  const canDeletePackagePermission = hasPermission(usuario, 'packages.delete')
  const canManageFeaturedPackages = hasPermission(usuario, 'packages.featured.manage')
  const canReadUsers = hasAnyPermission(usuario, ['users.read', 'clients.read'])
  const canCreateUser = hasPermission(usuario, 'clients.create')
  const canDeleteUser = hasAnyPermission(usuario, ['clients.delete', 'users.delete'])
  const canReadPos = hasAnyPermission(usuario, ['pos.read', 'pos.sell', 'pos.products.manage'])
  const canSellPos = hasPermission(usuario, 'pos.sell')
  const canManagePosProducts = hasPermission(usuario, 'pos.products.manage')

  // Product CRUD state
  const [prodModal, setProdModal]               = useState(null) // null | 'nuevo' | { producto }
  const [prodForm, setProdForm]                 = useState({ nombre: '', categoria: 'Accesorios', categoryId: '', precio: '', stock: '', emoji: '' })
  const [confirmarEliminarProd, setConfirmarEliminarProd] = useState(null)

  // Coach avatar — crear
  const [coachAvatarPreview, setCoachAvatarPreview] = useState(null)
  const [coachAvatarFile, setCoachAvatarFile] = useState(null)
  const fotoCreateRef = useRef(null)

  // Coach — editar modal
  const [modalEditCoach,  setModalEditCoach]  = useState(null)
  const [editCoachForm,   setEditCoachForm]   = useState({ nombre: '', disciplina: '', especialidad: '', email: '', telefono: '', bio: '', instagram: '', avatar_url: '', public_profile_enabled: true, estado: 'activo' })
  const [editAvatarPreview, setEditAvatarPreview] = useState(null)
  const [editAvatarFile, setEditAvatarFile] = useState(null)
  const fotoEditRef = useRef(null)

  // Disciplinas modal
  const [modalDisciplinas, setModalDisciplinas] = useState(false)
  const [nuevaDisciplina,  setNuevaDisciplina]  = useState('')

  // Coach — horario modal
  const [modalHorarioCoach, setModalHorarioCoach] = useState(null)

  // Coach form
  const [coachForm, setCoachForm] = useState({ nombre: '', especialidad: '', disciplina: 'Stryde X', email: '', telefono: '', bio: '', estado: 'activo', instagram: '', avatar_url: '', public_profile_enabled: true, password: '' })
  // Clase form — publicarEn: ISO datetime string o '' (publicar inmediatamente)
  //              fecha:      YYYY-MM-DD o '' (si vacío → clase recurrente cada semana)
  const [claseForm, setClaseForm] = useState({ nombre: '', tipo: '', coach: '', dia: 'Lunes', hora: '07:00', duracion: '50', descripcion: '', publicarEn: '', fecha: '' })
  // Clase — ver alumnos
  const [modalAlumnosClase, setModalAlumnosClase] = useState(null) // clase | null
  const [alumnoAgregarId,   setAlumnoAgregarId]   = useState('')
  const [adminSeatSelector, setAdminSeatSelector] = useState(null) // { cls, userId } | null
  // Clase — selección múltiple
  const [selectMode,         setSelectMode]         = useState(false)
  const [selectedIds,        setSelectedIds]        = useState(new Set())
  const [userSelectMode,     setUserSelectMode]     = useState(false)
  const [userSelectedIds,    setUserSelectedIds]    = useState(new Set())
  // Clase — editar
  const [modalEditClase,  setModalEditClase]  = useState(null)  // clase | null
  const [editClaseForm,   setEditClaseForm]   = useState({ nombre: '', tipo: '', coach: '', dia: 'Lunes', hora: '07:00', duracion: '50', descripcion: '', publicarEn: '', fecha: '' })
  // Paquete form (crear)
  const [paqueteForm, setPaqueteForm] = useState({
    nombre: '',
    numClases: '',
    precio: '',
    vigencia: '',
    descripcion: '',
    destacado: false,
    isShareable: false,
    maxBeneficiaries: 0,
  })
  // Paquete — editar
  const [modalEditPaquete, setModalEditPaquete] = useState(null)
  const [editPaqueteForm,  setEditPaqueteForm]  = useState({
    nombre: '',
    precio: '',
    clases: '',
    vigencia: '',
    destacado: false,
    beneficios: [],
    isShareable: false,
    maxBeneficiaries: 0,
  })
  const [nuevoBeneficio,   setNuevoBeneficio]   = useState('')
  // Usuario form
  const [usuarioForm, setUsuarioForm] = useState({ nombre: '', email: '', telefono: '', nacimiento: '', password: '', paquete: 'ninguno', metodoPago: 'efectivo', notas: '' })
  const [editClientForm, setEditClientForm] = useState({ nombre: '', email: '', telefono: '', estado: 'active' })
  const [clientCreditForm, setClientCreditForm] = useState({ amount: '', notes: '' })
  // Usuario — ver detalle
  const [modalVerUsuario, setModalVerUsuario] = useState(null)
  const [reservasModalPage, setReservasModalPage] = useState(1)
  const apiClientDetailQuery = useAdminClientDetailQuery(modalVerUsuario?.id, {
    enabled: useApiClients && Boolean(modalVerUsuario?.id),
  })
  const modalVerUsuarioResolved = useApiClients && apiClientDetailQuery.data
    ? apiClientDetailQuery.data
    : modalVerUsuario
  const modalAlumnosOccurrenceId = modalAlumnosClase?.occurrenceId ?? modalAlumnosClase?.occurrence_id ?? null
  const occurrenceRosterQuery = useOccurrenceRosterQuery(modalAlumnosOccurrenceId, {
    includeCanceled: false,
    enabled: useApiClasses && canReadClassRoster && Boolean(modalAlumnosOccurrenceId && modalAlumnosClase),
  })
  // Usuario — asignar paquete desde modal Ver
  const [asignarPaqueteForm, setAsignarPaqueteForm] = useState({ paqueteNombre: '', metodoPago: 'efectivo' })
  const [compartirAdminData, setCompartirAdminData] = useState({ activo: false, participantes: [] })
  const [sharedMembershipEmails, setSharedMembershipEmails] = useState({})
  const [sharedMembershipActionKey, setSharedMembershipActionKey] = useState('')
  const [cederClaseUserId, setCederClaseUserId] = useState('')
  // Asignación pendiente de pago: se aplica al procesar la venta en POS
  const [pendingAsignacion, setPendingAsignacion] = useState(null)
  // null | { userId, userName, paqSel, fechaVencimiento, metodoPago }
  // Notas editables en modal Ver
  const [editNotas, setEditNotas] = useState('')
  const coachesForClassForms = useApiCoaches ? apiCoaches : coaches
  const clientsForAdmin = useApiClients ? apiClientsFromQuery : usuarios
  const packagesForAdmin = useApiPackages ? apiPackages : paquetes
  const packagesForClients = useApiPackages ? apiPackages.filter((pkg) => pkg.isActive !== false) : paquetes
  const currentEditCoachAvatar = editAvatarPreview || resolveCoachAvatarUrl(modalEditCoach?.avatarUrl ?? modalEditCoach?.foto)
  const createProductMutation = useCreateProductMutation()
  const updateProductMutation = useUpdateProductMutation()
  const deleteProductMutation = useDeleteProductMutation()
  const productCategoriesQuery = useProductCategoriesQuery({
    page: 1,
    pageSize: 100,
    status: 'active',
    enabled: useApiPos,
  })

  const loadApiCoaches = useCallback(async () => {
    if (!useApiCoaches) return
    setApiCoachesLoading(true)
    setApiCoachesError('')
    try {
      const { items } = await getCoachesPaginatedApi({
        page: 1,
        pageSize: COACHES_SELECTOR_PAGE_SIZE,
      })
      setApiCoaches(items ?? [])
    } catch (error) {
      setApiCoaches([])
      setApiCoachesError(error?.message ?? 'No se pudieron cargar coaches')
    } finally {
      setApiCoachesLoading(false)
    }
  }, [logCoachEliminado, useApiCoaches])

  const loadApiCoachList = useCallback(async () => {
    if (!useApiCoaches) return
    setApiCoachListLoading(true)
    setApiCoachListError('')
    try {
      const { items } = await getCoachesPaginatedApi({
        page: 1,
        pageSize: COACHES_SELECTOR_PAGE_SIZE,
        search: coachesSearch,
        status: coachesStatus,
      })
      setApiCoachList(items ?? [])
    } catch (error) {
      setApiCoachList([])
      setApiCoachListError(error?.message ?? 'No se pudieron cargar coaches')
    } finally {
      setApiCoachListLoading(false)
    }
  }, [coachesSearch, coachesStatus, useApiCoaches])

  const loadApiClients = useCallback(async () => {
    if (!useApiClients) return
    const query = buildAdminClientsApiQuery({
      page: apiClientsPage,
      pageSize: ADMIN_CLIENTS_PAGE_SIZE,
      search: usersSearch,
      filter: usersFilter,
    })
    setApiClientsLoading(true)
    setApiClientsError('')
    try {
      const response = await getClientsPaginatedApi(query)
      setApiClients(response.items ?? [])
      setApiClientsTotal(response.total ?? 0)
    } catch (error) {
      setApiClients([])
      setApiClientsTotal(0)
      setApiClientsError(error?.message ?? 'No se pudieron cargar los clientes')
    } finally {
      setApiClientsLoading(false)
    }
  }, [apiClientsPage, useApiClients, usersFilter, usersSearch])

  const loadApiPackages = useCallback(async () => {
    if (!useApiPackages) return
    const query = buildAdminPackagesApiQuery({
      page: apiPackagesPage,
      pageSize: ADMIN_PACKAGES_PAGE_SIZE,
      search: apiPackagesSearch,
      status: apiPackagesStatus,
    })
    setApiPackagesLoading(true)
    setApiPackagesError('')
    try {
      const response = await getMembershipPackagesPaginatedApi(query)
      setApiPackages(response.items ?? [])
      setApiPackagesTotal(response.total ?? 0)
    } catch (error) {
      setApiPackages([])
      setApiPackagesTotal(0)
      setApiPackagesError(error?.message ?? 'No se pudieron cargar los paquetes')
    } finally {
      setApiPackagesLoading(false)
    }
  }, [apiPackagesPage, apiPackagesRefreshToken, apiPackagesSearch, apiPackagesStatus, useApiPackages])

  const openClientDetail = useCallback(async (client) => {
    if (!canReadUsers) {
      denyPermission('No tienes permisos para ver usuarios.')
      return
    }
    setAsignarPaqueteForm({ paqueteNombre: client.paquete || '', metodoPago: 'efectivo' })
    setEditNotas(client.notas || '')
    setCederClaseUserId('')
    if (!useApiClients) {
      setModalVerUsuario(client)
      return
    }
    setModalVerUsuario(client)
  }, [canReadUsers, denyPermission, useApiClients])

  const refreshClientDetail = useCallback(async (clientId) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminClientDetail(clientId) })
    return queryClient.fetchQuery({
      queryKey: queryKeys.adminClientDetail(clientId),
      queryFn: () => getClientByIdApi(clientId),
    })
  }, [queryClient])

  const handleDeleteClients = useCallback(async (ids) => {
    if (!canDeleteUser) {
      denyPermission()
      return
    }
    const clientIds = Array.isArray(ids) ? ids : [ids]
    if (!useApiClients) {
      clientIds.forEach((id) => eliminarUsuario(id))
      return
    }
    await Promise.all(clientIds.map((id) => deleteClientApi(id)))
    await queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] })
  }, [canDeleteUser, denyPermission, eliminarUsuario, queryClient, useApiClients])

  const handleSavePackage = useCallback(async () => {
    if (modalEditPaquete ? !canUpdatePackage : !canCreatePackage) {
      denyPermission()
      return
    }
    const isEdit = Boolean(modalEditPaquete)
    const form = isEdit ? editPaqueteForm : paqueteForm

    if (useApiPackages) {
      const payload = buildPackageApiPayload(form)
      const validationError = validatePackageApiPayload(payload)
      if (validationError) {
        toast.error(validationError)
        return
      }
      try {
        if (isEdit) {
          await updateMembershipPackageApi(modalEditPaquete.id, payload)
        } else {
          await createMembershipPackageApi(payload)
          setApiPackagesPage(1)
        }
        await Promise.all([
          loadApiPackages(),
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.list() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.public() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.adminPackages() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships }),
        ])
        if (isEdit) {
          setModalEditPaquete(null)
          setNuevoBeneficio('')
        } else {
          setPaqueteForm({
            nombre: '',
            numClases: '',
            precio: '',
            vigencia: '',
            descripcion: '',
            destacado: false,
            isShareable: false,
            maxBeneficiaries: 0,
          })
          closeModal()
        }
        toast.success(`Paquete "${getPackageDisplayName(payload)}" ${isEdit ? 'actualizado' : 'creado'}`)
      } catch (error) {
        toast.error(error?.message ?? 'No se pudo guardar el paquete')
      }
      return
    }

    if (isEdit) {
      editarPaquete(modalEditPaquete.id, {
        nombre:     editPaqueteForm.nombre || null,
        precio:     Number(editPaqueteForm.precio) || 0,
        clases:     Number(editPaqueteForm.clases) || 0,
        vigencia:   editPaqueteForm.vigencia,
        destacado:  editPaqueteForm.destacado,
        beneficios: editPaqueteForm.beneficios,
        isShareable: Boolean(editPaqueteForm.isShareable),
        maxBeneficiaries: Number(editPaqueteForm.maxBeneficiaries) || 0,
      })
      toast.success(`Paquete "${editPaqueteForm.nombre || 'Paquete'}" actualizado`)
      setModalEditPaquete(null)
      setNuevoBeneficio('')
      return
    }

    agregarPaquete({
      nombre:     paqueteForm.nombre || null,
      precio:     Number(paqueteForm.precio) || 0,
      clases:     Number(paqueteForm.numClases) || 0,
      vigencia:   Number(paqueteForm.vigencia) || 0,
      beneficios: paqueteForm.descripcion ? [paqueteForm.descripcion] : [],
      destacado:  paqueteForm.destacado,
      isShareable: Boolean(paqueteForm.isShareable),
      maxBeneficiaries: Number(paqueteForm.isShareable ? paqueteForm.maxBeneficiaries : 0) || 0,
    })
    toast.success(`Paquete "${paqueteForm.nombre || 'Paquete'}" creado`)
    setPaqueteForm({
      nombre: '',
      numClases: '',
      precio: '',
      vigencia: '',
      descripcion: '',
      destacado: false,
      isShareable: false,
      maxBeneficiaries: 0,
    })
    closeModal()
  }, [
    agregarPaquete,
    buildPackageApiPayload,
    canCreatePackage,
    canUpdatePackage,
    closeModal,
    createMembershipPackageApi,
    denyPermission,
    editarPaquete,
    editPaqueteForm,
    modalEditPaquete,
    paqueteForm,
    setApiPackagesPage,
    loadApiPackages,
    setModalEditPaquete,
    setNuevoBeneficio,
    updateMembershipPackageApi,
    useApiPackages,
    validatePackageApiPayload,
    queryClient,
  ])

  const handleDeletePackage = useCallback(async (packageId) => {
    if (!canDeletePackagePermission) {
      denyPermission()
      return
    }
    if (useApiPackages) {
      try {
        await deleteMembershipPackageApi(packageId)
        await Promise.all([
          loadApiPackages(),
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.list() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.public() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.adminPackages() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships }),
        ])
        toast.success('Paquete inactivado')
      } catch (error) {
        toast.error(error?.message ?? 'No se pudo eliminar el paquete')
      }
      return
    }
    eliminarPaquete(packageId)
    toast.success('Paquete eliminado')
  }, [canDeletePackagePermission, deleteMembershipPackageApi, denyPermission, eliminarPaquete, loadApiPackages, queryClient, useApiPackages])

  const handleTogglePackageStatus = useCallback(async (packageId, isActive) => {
    if (!canUpdatePackage) {
      denyPermission()
      return
    }
    if (useApiPackages) {
      try {
        await updateMembershipPackageStatusApi(packageId, isActive)
        await Promise.all([
          loadApiPackages(),
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.list() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.public() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.adminPackages() }),
        ])
      } catch (error) {
        toast.error(error?.message ?? 'No se pudo actualizar el paquete')
      }
      return
    }
    const current = paquetes.find((item) => item.id === packageId)
    if (current) {
      editarPaquete(packageId, { ...current, activo: isActive })
    }
  }, [canUpdatePackage, denyPermission, editarPaquete, loadApiPackages, paquetes, queryClient, updateMembershipPackageStatusApi, useApiPackages])

  const handleTogglePackageFeatured = useCallback(async (packageId, isFeatured) => {
    if (!canManageFeaturedPackages) {
      denyPermission()
      return
    }
    if (useApiPackages) {
      try {
        await updateMembershipPackageFeaturedApi(packageId, isFeatured)
        await Promise.all([
          loadApiPackages(),
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.list() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.packages.public() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.adminPackages() }),
        ])
      } catch (error) {
        toast.error(error?.message ?? 'No se pudo actualizar el paquete destacado')
      }
      return
    }
    marcarDestacado(packageId)
  }, [canManageFeaturedPackages, denyPermission, loadApiPackages, marcarDestacado, queryClient, updateMembershipPackageFeaturedApi, useApiPackages])

  useEffect(() => {
    setReservasModalPage(1)
  }, [modalVerUsuario?.id])

  useEffect(() => {
    if (!useApiClasses) return
    let active = true
    loadClasesFromApi({ status: 'programada' }).catch(() => {
      if (!active) return
    })
    return () => { active = false }
  }, [loadClasesFromApi, useApiClasses])

  useEffect(() => {
    if (!useApiCoaches) return
    loadApiCoaches()
  }, [loadApiCoaches, useApiCoaches, coachesRefreshToken])

  useEffect(() => {
    if (!useApiCoaches) return
    loadApiCoachList()
  }, [loadApiCoachList, useApiCoaches, coachesRefreshToken])

  useEffect(() => {
    if (useApiClients) return
  }, [useApiClients])

  useEffect(() => {
    if (!useApiPackages) return
    loadApiPackages()
  }, [loadApiPackages, useApiPackages])

  useEffect(() => {
    setApiClientsPage(1)
  }, [usersFilter, usersSearch])

  useEffect(() => {
    setApiPackagesPage(1)
  }, [apiPackagesSearch, apiPackagesStatus])

  const handleSaveCoach = useCallback(async () => {
    if (modalEditCoach ? !canUpdateCoach : !canCreateCoach) {
      denyPermission()
      return
    }
    const form = modalEditCoach ? editCoachForm : coachForm
    const avatarFile = modalEditCoach ? editAvatarFile : coachAvatarFile
    if (!form.nombre.trim()) return
    if (useApiCoaches) {
      try {
        const payload = buildCoachApiPayload(form, { isCreate: !modalEditCoach })
        const validationError = validateCoachApiPayload(payload, { isCreate: !modalEditCoach })
        if (validationError) {
          toast.error(validationError)
          return
        }
        const coachId = modalEditCoach?.coachId ?? modalEditCoach?.id ?? null
        const resultado = modalEditCoach
          ? await updateCoachApi(coachId, payload)
          : await createCoachApi(payload)
        if (!resultado) {
          toast.error('No se pudo guardar coach')
          return
        }
        const savedCoachId = resultado.coachId ?? resultado.id ?? coachId
        if (avatarFile && savedCoachId) {
          if (!canManageCoachAvatar) {
            toast.error('No tienes permisos para subir avatar de coach.')
          } else {
            try {
              await uploadCoachAvatarApi(savedCoachId, avatarFile)
            } catch (avatarError) {
              toast.error('Coach guardado, pero no se pudo subir la foto. Puedes editarlo e intentar de nuevo.')
              console.error('[admin] avatar upload failed', avatarError)
            }
          }
        }
        toast.success(`${form.nombre} ${modalEditCoach ? 'actualizado' : 'agregado'}`)
        if (!modalEditCoach) {
          logCoachAgregado({ nombre: form.nombre })
        }
        clearAvatarSelection(setCoachAvatarPreview, setCoachAvatarFile)
        clearAvatarSelection(setEditAvatarPreview, setEditAvatarFile)
        setCoachForm({ nombre: '', especialidad: '', disciplina: 'Stryde X', email: '', telefono: '', bio: '', estado: 'activo', password: '', instagram: '', public_profile_enabled: true })
        setEditCoachForm({ nombre: '', disciplina: '', especialidad: '', email: '', telefono: '', bio: '', instagram: '', public_profile_enabled: true, estado: 'activo' })
        setModalEditCoach(null)
        closeModal()
        await Promise.all([
          loadApiCoaches(),
          loadApiCoachList(),
          queryClient.invalidateQueries({ queryKey: queryKeys.coaches.public() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.coaches.list() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.adminBadges.coachesActive() }),
        ])
      } catch (error) {
        toast.error(error?.message ?? 'No se pudo guardar coach')
      }
      return
    }
    if (!modalEditCoach) {
      const resultado = await crearCoachService({
        nombre:       form.nombre,
        email:        form.email,
        password:     form.password || '123456',
        especialidad: form.disciplina || 'Stryde X',
        bio:          form.bio,
        foto:         coachAvatarPreview || null,
        instagram:    form.instagram || null,
      })
      if (resultado.ok) {
        if (avatarFile && resultado.coach?.coachId) {
          if (!canManageCoachAvatar) {
            toast.error('No tienes permisos para subir avatar de coach.')
          } else {
            try {
              await uploadCoachAvatarApi(resultado.coach.coachId, avatarFile)
            } catch (avatarError) {
              toast.error('Coach creado, pero no se pudo subir la foto. Puedes editarlo e intentar de nuevo.')
              console.error('[admin] avatar upload failed', avatarError)
            }
          }
        }
        toast.success(`${form.nombre} agregado`)
        logCoachAgregado({ nombre: form.nombre })
        clearAvatarSelection(setCoachAvatarPreview, setCoachAvatarFile)
        setCoachForm({ nombre: '', especialidad: '', disciplina: 'Stryde X', email: '', telefono: '', bio: '', estado: 'activo', password: '', instagram: '', public_profile_enabled: true })
        closeModal()
        await Promise.all([
          loadApiCoaches(),
          loadApiCoachList(),
          queryClient.invalidateQueries({ queryKey: queryKeys.coaches.public() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.coaches.list() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.adminBadges.coachesActive() }),
        ])
      } else {
        toast.error(resultado.mensaje)
      }
      return
    }

    editarCoach(modalEditCoach.id, {
      nombre:       form.nombre,
      especialidad: form.disciplina || 'Stryde X',
      bio:          form.bio,
      email:        form.email,
      telefono:     form.telefono,
      foto:         editAvatarPreview || modalEditCoach.foto || null,
      instagram:    form.instagram || null,
    })
    if (avatarFile) {
      if (!canManageCoachAvatar) {
        toast.error('No tienes permisos para subir avatar de coach.')
      } else {
        try {
          await uploadCoachAvatarApi(modalEditCoach.coachId ?? modalEditCoach.id, avatarFile)
        } catch (avatarError) {
          toast.error('Coach guardado, pero no se pudo subir la foto. Puedes editarlo e intentar de nuevo.')
          console.error('[admin] avatar upload failed', avatarError)
        }
      }
    }
    const userLogin = usuarios.find(
      (u) => u.email === modalEditCoach.email && u.rol === 'coach'
    )
    if (userLogin && form.email !== modalEditCoach.email) {
      editarUsuario(userLogin.id, { email: form.email, nombre: form.nombre })
    } else if (userLogin) {
      editarUsuario(userLogin.id, { nombre: form.nombre })
    }
    toast.success(`${form.nombre} actualizado`)
    setModalEditCoach(null)
    await Promise.all([
      loadApiCoaches(),
      loadApiCoachList(),
      queryClient.invalidateQueries({ queryKey: queryKeys.coaches.public() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.coaches.list() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminBadges.coachesActive() }),
    ])
  }, [
    canCreateCoach,
    canManageCoachAvatar,
    canUpdateCoach,
    clearAvatarSelection,
    coachForm,
    coachAvatarFile,
    coachAvatarPreview,
    closeModal,
    denyPermission,
    editCoachForm,
    editAvatarFile,
    editAvatarPreview,
    editarCoach,
    editarUsuario,
    logCoachAgregado,
    loadApiCoachList,
    loadApiCoaches,
    modalEditCoach,
    queryClient,
    usuarios,
    useApiCoaches,
  ])

  const handleToggleCoachStatus = useCallback(async (coach) => {
    if (!coach) return
    if (!canUpdateCoach) {
      denyPermission()
      return
    }
    if (useApiCoaches) {
      try {
        const nextStatus = coach.status === 'active' ? 'inactive' : 'active'
        await updateCoachStatusApi(coach.coachId ?? coach.id, nextStatus)
        toast.success(`${coach.nombre ?? coach.name} ${nextStatus === 'active' ? 'reactivado' : 'dado de baja'}`)
        await Promise.all([
          loadApiCoaches(),
          loadApiCoachList(),
          queryClient.invalidateQueries({ queryKey: queryKeys.coaches.public() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.coaches.list() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.adminBadges.coachesActive() }),
        ])
      } catch (error) {
        toast.error(error?.message ?? 'No se pudo actualizar coach')
      }
      return
    }
    if (coach.activo === false) {
      editarCoach(coach.id, { activo: true })
      toast.success(`${coach.nombre} reactivado`)
    } else {
      eliminarCoach(coach.id)
      toast.success(`${coach.nombre} dado de baja`)
    }
  }, [canUpdateCoach, denyPermission, editarCoach, eliminarCoach, loadApiCoaches, loadApiCoachList, queryClient, useApiCoaches])

  const handleDeleteCoach = useCallback(async (coach) => {
    if (!coach) return
    if (!canDeleteCoach) {
      denyPermission()
      return
    }
    if (useApiCoaches) {
      try {
        const result = await deleteCoachApi(coach.coachId ?? coach.id)
        if (result) {
          toast.success(`${coach.nombre ?? coach.name} eliminado`)
          await Promise.all([
            loadApiCoaches(),
            loadApiCoachList(),
            queryClient.invalidateQueries({ queryKey: queryKeys.coaches.public() }),
            queryClient.invalidateQueries({ queryKey: queryKeys.coaches.list() }),
            queryClient.invalidateQueries({ queryKey: queryKeys.adminBadges.coachesActive() }),
          ])
        }
      } catch (error) {
        toast.error(error?.message ?? 'No se pudo eliminar coach')
      }
      return
    }
    const resultado = await borrarCoachService(coach.id)
    if (resultado.ok) {
      toast.success(resultado.mensaje)
      logCoachEliminado({ nombre: coach.nombre })
    } else {
      toast.error(resultado.mensaje)
    }
  }, [canDeleteCoach, denyPermission, loadApiCoaches, loadApiCoachList, queryClient, useApiCoaches])

  function closeModal() {
    clearAvatarSelection(setCoachAvatarPreview, setCoachAvatarFile)
    clearAvatarSelection(setEditAvatarPreview, setEditAvatarFile)
    setPaqueteForm({
      nombre: '',
      numClases: '',
      precio: '',
      vigencia: '',
      descripcion: '',
      destacado: false,
      isShareable: false,
      maxBeneficiaries: 0,
    })
    setSharedMembershipEmails({})
    setSharedMembershipActionKey('')
    setModalType(null)
  }
  function openModal(type) {
    const permissionByModal = {
      coach: canCreateCoach,
      clase: canCreateClass,
      paquete: canCreatePackage,
      usuario: canCreateUser,
    }
    if (Object.prototype.hasOwnProperty.call(permissionByModal, type) && !permissionByModal[type]) {
      denyPermission()
      return
    }
    setModalType(type)
  }

  // Cart helpers
  const cartSubtotal = cart.reduce((s, i) => s + i.price, 0)
  const cartIva      = 0
  const cartTotal    = cartSubtotal

  function addToCart(product) {
    setCart((current) => {
      const normalizedType = String(product?.type ?? 'product').trim().toLowerCase()
      const beneficiaryKey = normalizedType === 'package'
        ? JSON.stringify(product?.beneficiaries ?? product?.beneficiariesText ?? [])
        : ''
      const existingIndex = current.findIndex((item) => (
        String(item.type ?? 'product').trim().toLowerCase() === normalizedType
        && String(item.id ?? item.productId ?? item.packageId) === String(product.id ?? product.productId ?? product.packageId)
        && (
          normalizedType !== 'package'
          || JSON.stringify(item.beneficiaries ?? item.beneficiariesText ?? []) === beneficiaryKey
        )
      ))

      if (existingIndex >= 0) {
        return current.map((item, index) => (
          index === existingIndex
            ? { ...item, quantity: Number(item.quantity ?? 1) + 1 }
            : item
        ))
      }

      return [...current, { quantity: 1, ...product }]
    })
  }

  function removeFromCart(idx) {
    setCart((c) => c.filter((_, i) => i !== idx))
  }

  function updateCartItemQuantity(idx, quantity) {
    setCart((current) => current.map((item, index) => (
      index === idx
        ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
        : item
    )))
  }

  function updateCartItem(idx, changes) {
    setCart((current) => current.map((item, index) => (
      index === idx
        ? { ...item, ...changes }
        : item
    )))
  }

  function clearCart() {
    setCart([])
    setPendingAsignacion(null)
  }

  async function handleSaveProducto() {
    const productCategoryId = prodForm.categoryId
      || (productCategoriesQuery.data?.items ?? []).find((category) => String(category.name ?? category.nombre ?? '') === String(prodForm.categoria ?? ''))?.id
      || null
    if (useApiPos && !productCategoryId) {
      toast.error('Selecciona una categoría válida.')
      return
    }
    const payload = buildPosProductApiPayload({
      nombre: prodForm.nombre,
      categoria: prodForm.categoria,
      categoryId: productCategoryId,
      precio: prodForm.precio,
      stock: prodForm.stock,
      status: prodModal === 'nuevo'
        ? 'active'
        : (prodModal?.producto?.status ?? (prodModal?.producto?.isActive === false || prodModal?.producto?.activo === false ? 'inactive' : 'active')),
      description: '',
    })
    const validationError = validatePosProductApiPayload(payload)
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      if (useApiPos) {
        if (prodModal === 'nuevo') {
          await createProductMutation.mutateAsync(payload)
          toast.success('Producto agregado')
        } else {
          await updateProductMutation.mutateAsync({
            id: prodModal.producto.id,
            payload,
          })
          toast.success('Producto actualizado')
        }
      } else {
        const datos = {
          nombre:    prodForm.nombre,
          categoria: prodForm.categoria,
          categoryId: productCategoryId,
          precio:    Number(prodForm.precio) || 0,
          stock:     Number(prodForm.stock)  || 0,
          imagen:    null,
          activo:    true,
          emoji:     prodForm.emoji || categoryEmoji(prodForm.categoria),
        }
        if (prodModal === 'nuevo') {
          agregarProducto(datos)
          toast.success('Producto agregado')
        } else {
          editarProducto(prodModal.producto.id, datos)
          toast.success('Producto actualizado')
        }
      }
      setProdModal(null)
      setProdForm({ nombre: '', categoria: 'Accesorios', categoryId: '', precio: '', stock: '', emoji: '' })
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo guardar el producto')
    }
  }

  async function handleEliminarProducto() {
    try {
      if (useApiPos) {
        await deleteProductMutation.mutateAsync(confirmarEliminarProd.id)
        toast.success('Producto inactivado')
      } else {
        eliminarProducto(confirmarEliminarProd.id)
        toast.success('Producto eliminado')
      }
      setConfirmarEliminarProd(null)
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo inactivar el producto')
    }
  }

  function handleCobrar() {
    if (cart.length === 0) { toast.error('Agrega productos a la orden primero'); return }
    setModalPago(true)
  }

  function procesarVenta() {
    if (cart.length === 0) { toast.error('Agrega productos a la orden primero'); return }

    // Si hay una asignación pendiente, activar el paquete ahora que se cobró
    if (pendingAsignacion) {
      const { userId, userName, paqSel, fechaVencimiento, metodoPago } = pendingAsignacion
      const clasesPaquete = getPackageCredits(paqSel)
      editarUsuario(userId, {
        paquete:      paqSel.nombre,
        clasesPaquete,
        paqueteInfo: {
          fechaCompra:      new Date().toISOString().split('T')[0],
          fechaVencimiento,
          estado:           'Activo',
          metodoPago,
          precio:           paqSel.precio,
        },
      })
      toast.success(`✅ Paquete "${paqSel.nombre}" activado para ${userName}`)
      setPendingAsignacion(null)
    } else {
      toast.success('✅ Venta procesada exitosamente')
    }
    clearCart()
  }

  function showSection(name) {
    if (!canAccessAdminSection(usuario, name)) {
      denyPermission('No tienes permisos para ver este módulo.')
      return
    }
    setActiveSection(name)
    setIsSidebarOpen(false)
  }

  function showSectionWithFilter(sectionId, filterKey, filterValue) {
    showSection(sectionId)
    if (filterKey === 'usersFilter') setUsersFilter(filterValue)
  }

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isSidebarOpen])

  useEffect(() => {
    if (canAccessAdminSection(usuario, activeSection)) return
    setActiveSection(firstVisibleAdminSection)
  }, [activeSection, firstVisibleAdminSection, usuario])

  // ── Finanzas handlers ────────────────────────────────────────────────────────
  function handleCerrarDia() {
    const now = new Date()
    const mes = now.toLocaleString('es-MX', { month: 'long' })
    const año = now.getFullYear()
    const ingresosCat = getIncomeByCategory('dia')
    ejecutarCorte({
      fecha:              finHoy,
      periodo:            `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${año}`,
      tipo:               'diario',
      ingresosPaquetes:   ingresosCat.paquetes,
      ingresosProductos:  ingresosCat.productos,
      totalIngresos:      finIngresosDia.total,
      totalEfectivo:      finIngresosDia.efectivo,
      totalTarjeta:       finIngresosDia.tarjeta,
      totalTransferencia: finIngresosDia.transferencia,
      totalReservas:      0,
      totalCancelaciones: 0,
      ejecutadoPor:       usuario?.id ?? null,
      estado:             'cerrado',
    })
    toast.success('¡Corte de caja realizado!')
    logCorteCaja({
      total:          finIngresosDia.total,
      efectivo:       finIngresosDia.efectivo,
      tarjeta:        finIngresosDia.tarjeta,
      transferencia:  finIngresosDia.transferencia,
      ejecutadoPor:   usuario?.nombre ?? 'Administrador',
    })
  }

  function handleGuardarGasto() {
    if (!formGasto.concepto.trim() || !formGasto.monto) {
      toast.error('Completa concepto y monto.')
      return
    }
    registrarGasto({
      concepto: formGasto.concepto.trim(),
      monto:    parseFloat(formGasto.monto),
      tipo:     formGasto.tipo,
      adminId:  usuario?.id ?? null,
    })
    toast.success('Gasto registrado.')
    setModalGasto(false)
    setFormGasto({ concepto: '', monto: '', tipo: TIPOS_GASTO.OPERATIVO })
  }

  function validateCoachAvatarFile(file) {
    if (!file) return 'Selecciona una imagen válida.'
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) return 'La foto debe ser JPG, PNG o WEBP.'
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) return 'La foto no debe superar 5 MB.'
    return null
  }

  function setAvatarSelection(file, setPreview, setFile) {
    if (!file) return false
    const error = validateCoachAvatarFile(file)
    if (error) {
      toast.error(error)
      return false
    }
    setPreview((prev) => {
      if (typeof prev === 'string' && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev)
      }
      return URL.createObjectURL(file)
    })
    setFile(file)
    return true
  }

  function clearAvatarSelection(setPreview, setFile) {
    setPreview((prev) => {
      if (typeof prev === 'string' && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev)
      }
      return null
    })
    setFile(null)
  }

  const sec = SECTIONS[activeSection] ?? SECTIONS[firstVisibleAdminSection] ?? {
    title: 'Acceso restringido',
    sub: 'No tienes permisos para ver módulos administrativos.',
  }

  return (
    <div className={styles.root}>
      {isSidebarOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarLogo}>
          <span className={styles.logoBrand}>Casa Scarlatta</span>
          <div className={styles.logoStudio}>Admin</div>
          <span className={styles.logoBadge}>Panel Administrativo</span>
        </div>

        <div className={styles.navSection}>
          <div className={styles.navLabel}>Principal</div>
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard'    },
            {
              id: 'coaches',
              icon: '👤',
              label: 'Coaches',
              badge: useApiCoaches
                ? String(coachesBadgeQuery.data ?? apiCoachList.length ?? coaches.length)
                : String(coaches.length),
            },
            { id: 'clases',    icon: '🗓', label: 'Clases'       },
            { id: 'paquetes',  icon: '📦', label: 'Paquetes'     },
          ].filter(({ id }) => canAccessAdminSection(usuario, id)).map(({ id, icon, label, badge }) => (
            <button
              key={id}
              className={`${styles.navItem}${activeSection === id ? ' ' + styles.active : ''}`}
              onClick={() => showSection(id)}
            >
              <span className={styles.navIcon}>{icon}</span>
              {label}
              {badge && <span className={styles.badgeCount}>{badge}</span>}
            </button>
          ))}
        </div>

        <div className={styles.navSection}>
          <div className={styles.navLabel}>Operación</div>
          {[
            { id: 'pos',       icon: '🛒', label: 'Punto de Venta' },
            {
              id: 'usuarios',
              icon: '👥',
              label: 'Usuarios',
              badge: useApiClients
                ? String(clientsBadgeQuery.data ?? apiClientsTotal ?? usuarios.length)
                : String(usuarios.length),
            },
          ].filter(({ id }) => canAccessAdminSection(usuario, id)).map(({ id, icon, label, badge }) => (
            <button
              key={id}
              className={`${styles.navItem}${activeSection === id ? ' ' + styles.active : ''}`}
              onClick={() => showSection(id)}
            >
              <span className={styles.navIcon}>{icon}</span>
              {label}
              {badge && <span className={styles.badgeCount}>{badge}</span>}
            </button>
          ))}
        </div>

        <div className={styles.navSection}>
          <div className={styles.navLabel}>Análisis</div>
          {[
            { id: 'finanzas',      icon: '💰', label: 'Finanzas'       },
            { id: 'gastos',        icon: '🧾', label: 'Gastos'         },
            { id: 'cortes',        icon: '🧾', label: 'Cortes'         },
            { id: 'reportes',      icon: '📄', label: 'Reportes'       },
            { id: 'actividad',     icon: '📋', label: 'Actividad'      },
            { id: 'configuracion', icon: '⚙️', label: 'Configuración'  },
          ].filter(({ id }) => canAccessAdminSection(usuario, id)).map(({ id, icon, label }) => (
            <button
              key={id}
              className={`${styles.navItem}${activeSection === id ? ' ' + styles.active : ''}`}
              onClick={() => showSection(id)}
            >
              <span className={styles.navIcon}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <button className={styles.backBtn} onClick={() => { setIsSidebarOpen(false); navigate('/') }}>
            ← Volver al sitio
          </button>
          <button
            className={styles.backBtn}
            style={{ color: '#E8A4AD', borderColor: 'rgba(232,164,173,0.2)', marginTop: 8 }}
            onClick={() => { logout(); navigate('/login') }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setIsSidebarOpen((v) => !v)}
              aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className={styles.topbarHeading}>
              <h1>{sec.title}</h1>
              {sec.sub && <p>{sec.sub}</p>}
            </div>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.adminProfile} style={{ padding: '6px 10px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ textAlign: 'right' }}>
                <div className={styles.adminName}>Administrador</div>
                <div className={styles.adminRole}>Casa Scarlatta</div>
              </div>
              <div className={styles.adminAvatar}>A</div>
            </div>
          </div>
        </header>

        <div className={styles.content}>

          {/* ── DASHBOARD ── */}
          <section className={`${styles.section}${activeSection === 'dashboard' ? ' ' + styles.active : ''}`}>
            <DashboardSection
              rangoDash={rangoDash}
              setRangoDash={setRangoDash}
              showSection={showSection}
              showSectionWithFilter={showSectionWithFilter}
            />
          </section>

          {/* ── COACHES ── */}
          <section className={`${styles.section}${activeSection === 'coaches' ? ' ' + styles.active : ''}`}>
            <CoachesSection
              coaches={useApiCoaches ? apiCoachList : coaches}
              useApiMode={useApiCoaches}
              isLoading={apiCoachListLoading}
              error={apiCoachListError}
              search={coachesSearch}
              setSearch={setCoachesSearch}
              status={coachesStatus}
              setStatus={setCoachesStatus}
              openModal={openModal}
              setModalEditCoach={setModalEditCoach}
              setEditCoachForm={setEditCoachForm}
              setEditAvatarPreview={setEditAvatarPreview}
              setEditAvatarFile={setEditAvatarFile}
              setModalHorarioCoach={setModalHorarioCoach}
              onToggleStatus={handleToggleCoachStatus}
              onDeleteCoach={handleDeleteCoach}
            />
          </section>

          {/* ── CLASES ── */}
          <section className={`${styles.section}${activeSection === 'clases' ? ' ' + styles.active : ''}`}>
            <ClasesSection
              clases={clases}
              clasesFilter={clasesFilter}
              setClasesFilter={setClasesFilter}
              selectMode={selectMode}
              setSelectMode={setSelectMode}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              coaches={coachesForClassForms}
              disciplinas={disciplinas}
              openModal={openModal}
              setModalAlumnosClase={setModalAlumnosClase}
              setAlumnoAgregarId={setAlumnoAgregarId}
              setModalEditClase={setModalEditClase}
              setEditClaseForm={setEditClaseForm}
              claseForm={claseForm}
              setClaseForm={setClaseForm}
              refreshToken={clasesRefreshToken}
            />
          </section>

          {/* ── PAQUETES ── */}
          <section className={`${styles.section}${activeSection === 'paquetes' ? ' ' + styles.active : ''}`}>
            <PaquetesSection
              paquetes={packagesForAdmin}
              transacciones={transacciones}
              usuarios={clientsForAdmin}
              openModal={openModal}
              setModalEditPaquete={setModalEditPaquete}
              setEditPaqueteForm={setEditPaqueteForm}
              eliminarPaquete={handleDeletePackage}
              marcarDestacado={handleTogglePackageFeatured}
              useApiMode={useApiPackages}
              isLoading={apiPackagesLoading}
              error={apiPackagesError}
              total={apiPackagesTotal}
              page={apiPackagesPage}
              pageSize={ADMIN_PACKAGES_PAGE_SIZE}
              search={apiPackagesSearch}
              setSearch={setApiPackagesSearch}
              status={apiPackagesStatus}
              setStatus={setApiPackagesStatus}
              onPageChange={setApiPackagesPage}
              onToggleActive={handleTogglePackageStatus}
              onToggleFeatured={handleTogglePackageFeatured}
            />
          </section>

          {/* ── PUNTO DE VENTA ── */}
          <section className={`${styles.section}${activeSection === 'pos' ? ' ' + styles.active : ''}`}>
            <PuntoDeVentaSection
              useApiMode={useApiPos}
              isActive={activeSection === 'pos'}
              paquetes={useApiPackages ? packagesForClients : paquetes}
              productos={productos}
              agregarProducto={agregarProducto}
              editarProducto={editarProducto}
              eliminarProducto={eliminarProducto}
              cart={cart}
              posFilter={posFilter}
              setPosFilter={setPosFilter}
              prodModal={prodModal}
              setProdModal={setProdModal}
              prodForm={prodForm}
              setProdForm={setProdForm}
              confirmarEliminarProd={confirmarEliminarProd}
              setConfirmarEliminarProd={setConfirmarEliminarProd}
              pendingAsignacion={pendingAsignacion}
              cartSubtotal={cartSubtotal}
              cartIva={cartIva}
              cartTotal={cartTotal}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              updateCartItemQuantity={updateCartItemQuantity}
              updateCartItem={updateCartItem}
              clearCart={clearCart}
              handleCobrar={handleCobrar}
              handleSaveProducto={handleSaveProducto}
              handleEliminarProducto={handleEliminarProducto}
            />
          </section>

          {/* ── USUARIOS ── */}
          <section className={`${styles.section}${activeSection === 'usuarios' ? ' ' + styles.active : ''}`}>
            <UsuariosSection
              usuarios={clientsForAdmin}
              paquetes={packagesForClients}
              usersFilter={usersFilter}
              setUsersFilter={setUsersFilter}
              usersSearch={usersSearch}
              setUsersSearch={setUsersSearch}
              userSelectMode={userSelectMode}
              setUserSelectMode={setUserSelectMode}
              userSelectedIds={userSelectedIds}
              setUserSelectedIds={setUserSelectedIds}
              eliminarUsuario={handleDeleteClients}
              openModal={openModal}
              onViewClient={openClientDetail}
              useApiMode={useApiClients}
              isLoading={apiClientsLoadingFromQuery}
              error={apiClientsErrorFromQuery}
              total={apiClientsTotalFromQuery}
              page={apiClientsPage}
              pageSize={ADMIN_CLIENTS_PAGE_SIZE}
              onPageChange={setApiClientsPage}
            />
          </section>

          {/* ── FINANZAS ── */}
          <section className={`${styles.section}${activeSection === 'finanzas' ? ' ' + styles.active : ''}`}>
            <FinanzasSection inPanel />
          </section>

          {/* ── GASTOS ── */}
          <section className={`${styles.section}${activeSection === 'gastos' ? ' ' + styles.active : ''}`}>
            <GastosSection inPanel isActive={activeSection === 'gastos'} useApiMode={useApiExpenses} />
          </section>

          {/* ── CORTES ── */}
          <section className={`${styles.section}${activeSection === 'cortes' ? ' ' + styles.active : ''}`}>
            <CortesSection inPanel isActive={activeSection === 'cortes'} />
          </section>

          {/* ── REPORTES ── */}
          <section className={`${styles.section}${activeSection === 'reportes' ? ' ' + styles.active : ''}`}>
            <ReportesSection inPanel />
          </section>

          {/* ── ACTIVIDAD ── */}
          <section className={`${styles.section}${activeSection === 'actividad' ? ' ' + styles.active : ''}`}>
            <ActividadSection useApiMode={useApiMode} />
          </section>

          {/* ── CONFIGURACIÓN ── */}
          <section className={`${styles.section}${activeSection === 'configuracion' ? ' ' + styles.active : ''}`}>
            <ConfiguracionSection currentUser={usuario} />
          </section>

        </div>
      </main>

      {/* ── MODAL OVERLAY ── */}
      <div
        className={`${styles.modalOverlay}${modalType ? ' ' + styles.open : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
      >

        {/* ── COACH ── */}
        {modalType === 'coach' && (
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Agregar Coach</div>
              <button className={styles.modalClose} onClick={closeModal}>×</button>
            </div>

            <input
              ref={fotoCreateRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => setAvatarSelection(e.target.files?.[0], setCoachAvatarPreview, setCoachAvatarFile)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16, gap: 8 }}>
              <div
                onClick={() => fotoCreateRef.current?.click()}
                style={{ cursor: 'pointer', width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}
              >
                {coachAvatarPreview ? (
                  <img src={coachAvatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 28 }}>📷</span>
                )}
              </div>
              <button
                type="button"
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => fotoCreateRef.current?.click()}
              >
                {coachAvatarPreview ? 'Cambiar foto' : 'Subir foto'}
              </button>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>JPG, PNG o WEBP. Máximo 5 MB.</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                <input
                  type="checkbox"
                  checked={Boolean(coachForm.public_profile_enabled)}
                  onChange={(e) => setCoachForm((f) => ({ ...f, public_profile_enabled: e.target.checked }))}
                />
                Perfil público visible
              </label>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre completo</label>
                <input className={styles.formInput} placeholder="Ej: Mafer García" value={coachForm.nombre}
                  onChange={e => setCoachForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado</label>
                <select className={styles.formSelect} value={coachForm.estado}
                  onChange={e => setCoachForm(f => ({ ...f, estado: e.target.value }))}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Disciplina</label>
                <select className={styles.formSelect} value={coachForm.disciplina}
                  onChange={e => setCoachForm(f => ({ ...f, disciplina: e.target.value }))}>
                  <option value="Stryde X">Stryde X</option>
                  <option value="Slow">Slow</option>
                  <option value="Ambas">Ambas</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input className={styles.formInput} type="email" placeholder="coach@casascarlatta.com" value={coachForm.email}
                  onChange={e => setCoachForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Teléfono</label>
                <input className={styles.formInput} type="tel" placeholder="+52 55 0000 0000" value={coachForm.telefono}
                  onChange={e => setCoachForm(f => ({ ...f, telefono: e.target.value }))} />
                </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contraseña inicial</label>
                <PasswordInput
                  className={styles.formInput}
                  placeholder="Mínimo 8 caracteres"
                  value={coachForm.password || ''}
                  onChange={e => setCoachForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                  required
                />
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  Contraseña inicial para acceso del coach.
                </p>
                </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Biografía / Descripción</label>
                <textarea className={styles.formInput} rows={3} placeholder="Breve descripción del coach y su experiencia…"
                  value={coachForm.bio} onChange={e => setCoachForm(f => ({ ...f, bio: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Instagram (URL)</label>
                <input className={styles.formInput} type="url" placeholder="https://instagram.com/nombre_coach"
                  value={coachForm.instagram} onChange={e => setCoachForm(f => ({ ...f, instagram: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={closeModal}>Cancelar</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSaveCoach}
              >
                Guardar Coach
              </button>
            </div>
          </div>
        )}

        {/* ── CLASE ── */}
        {modalType === 'clase' && (
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Nueva Clase</div>
              <button className={styles.modalClose} onClick={closeModal}>×</button>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre de la clase</label>
                <input className={styles.formInput} placeholder="Ej: Stride Power" value={claseForm.nombre}
                  onChange={e => setClaseForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo / Disciplina</label>
                <select className={styles.formSelect} value={claseForm.tipo}
                  onChange={e => setClaseForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="">Seleccionar…</option>
                  {disciplinas.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Coach</label>
                <select className={styles.formSelect} value={claseForm.coach}
                  onChange={e => setClaseForm(f => ({ ...f, coach: e.target.value }))}>
                  <option value="">Seleccionar coach…</option>
                  {coachesForClassForms.filter(c => {
                    if (c.activo === false) return false
                    const esp = c.especialidad
                    if (!esp || esp === 'Ambas') return true
                    const claseEsSlow = claseForm.tipo?.toLowerCase().includes('slow')
                    return claseEsSlow ? esp.toLowerCase().includes('slow') : !esp.toLowerCase().includes('slow')
                  }).map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Fecha específica
                  <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)', marginLeft: 6 }}>
                    — vacío = clase recurrente
                  </span>
                </label>
                <input
                  className={styles.formInput}
                  type="date"
                  value={claseForm.fecha}
                  onChange={e => {
                    const fecha = e.target.value
                    if (fecha) {
                      const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
                      const dia = DIAS_ES[new Date(fecha + 'T12:00:00').getDay()]
                      setClaseForm(f => ({ ...f, fecha, dia }))
                    } else {
                      setClaseForm(f => ({ ...f, fecha: '' }))
                    }
                  }}
                />
                {claseForm.fecha && (
                  <p style={{ fontSize: 11, color: 'rgba(232,164,173,0.7)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
                    Clase única para el {new Date(claseForm.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Día de la semana</label>
                <select className={styles.formSelect} value={claseForm.dia}
                  onChange={e => setClaseForm(f => ({ ...f, dia: e.target.value }))}>
                  {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(d => <option key={d}>{d}</option>)}
                </select>
                {claseForm.fecha && (
                  <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, fontFamily: 'var(--font-body)' }}>
                    Auto-calculado desde la fecha
                  </p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hora de inicio</label>
                <input className={styles.formInput} type="time" value={claseForm.hora}
                  onChange={e => setClaseForm(f => ({ ...f, hora: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Duración (minutos)</label>
                <input className={styles.formInput} type="number" min="30" max="120" placeholder="50" value={claseForm.duracion}
                  onChange={e => setClaseForm(f => ({ ...f, duracion: e.target.value }))} />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Descripción</label>
                <textarea className={styles.formInput} rows={2} placeholder="Descripción breve de la clase…"
                  value={claseForm.descripcion} onChange={e => setClaseForm(f => ({ ...f, descripcion: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>

              {/* ── Programar publicación ── */}
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🕐 Programar publicación</span>
                  <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>
                    — dejar vacío para publicar ahora
                  </span>
                </label>
                <input
                  className={styles.formInput}
                  type="datetime-local"
                  value={claseForm.publicarEn}
                  onChange={e => setClaseForm(f => ({ ...f, publicarEn: e.target.value }))}
                />
                {claseForm.publicarEn && (
                  <p style={{ fontSize: 11, color: 'rgba(232,164,173,0.7)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
                    La clase se publicará el {new Date(claseForm.publicarEn).toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={closeModal}>Cancelar</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={async () => {
                  if (!claseForm.nombre.trim()) return
                  const payload = buildClaseApiPayload({ form: claseForm, coaches: coachesForClassForms })
                  if (useApiClasses) {
                    if (!Array.isArray(coachesForClassForms) || coachesForClassForms.length === 0) {
                      toast.error('No hay coaches registrados en backend. Sincroniza coaches antes de crear clases.')
                      return
                    }
                    if (!Number.isInteger(payload.coach_id)) {
                      toast.error('Selecciona un coach válido para guardar en API mode')
                      return
                    }
                    if (claseForm.publicarEn) {
                      toast.error('Programar publicación no está soportado todavía por backend')
                      return
                    }
                    const createdClase = await createClaseApi(payload)
                    let createdOccurrence = null
                    let occurrenceFailed = false
                    if (claseForm.fecha) {
                      const occurrencePayload = buildOccurrencePayloadFromClassForm(claseForm, payload)
                      try {
                        createdOccurrence = await createClassOccurrenceApi(createdClase?.id, occurrencePayload)
                      } catch (_occurrenceError) {
                        occurrenceFailed = true
                        await invalidateClassSideEffects(queryClient, {
                          classId: createdClase?.id,
                          coachId: createdClase?.coachId ?? createdClase?.coach_id ?? payload.coach_id,
                        })
                        await loadClasesFromApi({ force: true, status: 'programada' })
                        toast.error('La clase base se creó, pero no se pudo programar la sesión en calendario.')
                      }
                    }
                    if (occurrenceFailed) {
                      setClaseForm({ nombre: '', tipo: '', coach: '', dia: 'Lunes', hora: '07:00', duracion: '50', cupoMax: '15', descripcion: '', publicarEn: '', fecha: '' })
                      closeModal()
                      return
                    }
                    await invalidateClassSideEffects(queryClient, {
                      classId: createdClase?.id,
                      occurrenceId: createdOccurrence?.occurrenceId ?? createdOccurrence?.id ?? null,
                      coachId: createdClase?.coachId ?? createdClase?.coach_id ?? payload.coach_id,
                    })
                    await loadClasesFromApi({ force: true, status: 'programada' })
                  } else {
                    const coachObj = coaches.find(c => c.nombre === claseForm.coach)
                    agregarClase({
                      nombre:      claseForm.nombre,
                      tipo:        claseForm.tipo,
                      coachId:     coachObj?.id ?? null,
                      coachNombre: claseForm.coach || 'Sin asignar',
                      dia:         claseForm.dia,
                      hora:        claseForm.hora,
                      duracion:    Number(claseForm.duracion) || 50,
                      cupoMax:     claseForm.tipo === 'Slow' ? 10 : 14,
                      cupoActual:  0,
                      descripcion: claseForm.descripcion,
                      publicarEn:  claseForm.publicarEn || null,
                      fecha:       claseForm.fecha || null,
                    })
                  }
                  const msg = claseForm.fecha
                    ? `Clase "${claseForm.nombre}" creada y sesión programada para el ${new Date(claseForm.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}`
                    : claseForm.publicarEn
                          ? `Clase programada para ${new Date(claseForm.publicarEn).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}`
                      : `Clase "${claseForm.nombre}" publicada`
                  toast.success(msg)
                  logClaseCreada({
                    nombre:      claseForm.nombre,
                    coachNombre: claseForm.coach || 'Sin asignar',
                    dia:         claseForm.dia,
                    hora:        claseForm.hora,
                  })
                  setClaseForm({ nombre: '', tipo: '', coach: '', dia: 'Lunes', hora: '07:00', duracion: '50', cupoMax: '15', descripcion: '', publicarEn: '', fecha: '' })
                  closeModal()
                }}
              >
                {claseForm.fecha ? '📅 Crear para esta fecha' : claseForm.publicarEn ? '📅 Programar' : 'Publicar ahora'}
              </button>
            </div>
          </div>
        )}

        {/* ── PAQUETE ── */}
        {modalType === 'paquete' && (
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Nuevo Paquete</div>
              <button className={styles.modalClose} onClick={closeModal}>×</button>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre del paquete (opcional)</label>
                <input
                  className={styles.formInput}
                  placeholder="Ej: Mensual 12"
                  value={paqueteForm.nombre}
                  onChange={(event) => setPaqueteForm((form) => ({ ...form, nombre: event.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Número de clases / créditos</label>
                <input
                  className={styles.formInput}
                  type="number"
                  min="1"
                  placeholder="Ej: 12"
                  value={paqueteForm.numClases}
                  onChange={(event) => setPaqueteForm((form) => ({ ...form, numClases: event.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Precio (MXN)</label>
                <input
                  className={styles.formInput}
                  type="number"
                  min="0"
                  placeholder="Ej: 1200"
                  value={paqueteForm.precio}
                  onChange={(event) => setPaqueteForm((form) => ({ ...form, precio: event.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vigencia en días</label>
                <input
                  className={styles.formInput}
                  type="number"
                  min="1"
                  placeholder="Ej: 30"
                  value={paqueteForm.vigencia}
                  onChange={(event) => setPaqueteForm((form) => ({ ...form, vigencia: event.target.value }))}
                />
              </div>

              <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
                <input
                  type="checkbox"
                  id="destacado"
                  checked={paqueteForm.destacado}
                  onChange={(event) => setPaqueteForm((form) => ({ ...form, destacado: event.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--wine)', cursor: 'pointer' }}
                />
                <label htmlFor="destacado" className={styles.formLabel} style={{ margin: 0, cursor: 'pointer' }}>
                  Marcar como "Más popular"
                </label>
              </div>

              {/* <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
                <input
                  type="checkbox"
                  id="shareable"
                  checked={paqueteForm.isShareable}
                  onChange={(event) => setPaqueteForm((form) => ({
                    ...form,
                    isShareable: event.target.checked,
                    maxBeneficiaries: event.target.checked ? Math.max(Number(form.maxBeneficiaries) || 1, 1) : 0,
                  }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--wine)', cursor: 'pointer' }}
                />
                <label htmlFor="shareable" className={styles.formLabel} style={{ margin: 0, cursor: 'pointer' }}>
                  Permitir compartir paquete
                </label>
              </div> */}

              {/* <div className={styles.formGroup}>
                <label className={styles.formLabel}>Número máximo de beneficiarios</label>
                <input
                  className={styles.formInput}
                  type="number"
                  min="1"
                  disabled={!paqueteForm.isShareable}
                  placeholder={paqueteForm.isShareable ? 'Ej: 1' : 'Activa el paquete compartible'}
                  value={paqueteForm.maxBeneficiaries}
                  onChange={(event) => setPaqueteForm((form) => ({ ...form, maxBeneficiaries: event.target.value }))}
                />
                <small style={{ color: 'var(--muted)', display: 'block', marginTop: 6 }}>
                  {paqueteForm.isShareable
                    ? `Compartible con hasta ${Number(paqueteForm.maxBeneficiaries) || 1} ${Number(paqueteForm.maxBeneficiaries) === 1 ? 'beneficiario' : 'beneficiarios'}`
                    : 'No compartible'}
                </small>
              </div> */}

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>{useApiPackages ? 'Beneficios' : 'Descripción'}</label>
                <textarea
                  className={styles.formInput}
                  rows={2}
                  placeholder={useApiPackages ? 'Una línea por beneficio...' : 'Beneficios e información adicional del paquete...'}
                  value={paqueteForm.descripcion}
                  onChange={(event) => setPaqueteForm((form) => ({ ...form, descripcion: event.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={closeModal}>Cancelar</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSavePackage}
              >
                Guardar Paquete
              </button>
            </div>
          </div>
        )}
        {/* ── USUARIO ── */}
        {modalType === 'usuario' && (
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Nuevo Usuario</div>
              <button className={styles.modalClose} onClick={closeModal}>×</button>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre completo</label>
                <input className={styles.formInput} autoComplete="name" placeholder="Ej: Sofía Reyes" value={usuarioForm.nombre}
                  onChange={e => setUsuarioForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              {!useApiClients && <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha de nacimiento</label>
                <input className={styles.formInput} type="date" value={usuarioForm.nacimiento}
                  onChange={e => setUsuarioForm(f => ({ ...f, nacimiento: e.target.value }))} />
              </div>}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input className={styles.formInput} type="email" autoComplete="off" placeholder="sofia@email.com" value={usuarioForm.email}
                  onChange={e => setUsuarioForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contraseña temporal</label>
                <PasswordInput className={styles.formInput} autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={usuarioForm.password}
                  onChange={e => setUsuarioForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Teléfono</label>
                <input className={styles.formInput} type="tel" autoComplete="tel" placeholder="+52 55 0000 0000" value={usuarioForm.telefono}
                  onChange={e => setUsuarioForm(f => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Paquete inicial</label>
                <select className={styles.formSelect} value={usuarioForm.paquete}
                  onChange={e => setUsuarioForm(f => ({ ...f, paquete: e.target.value }))}>
                  <option value="ninguno">Sin paquete por ahora</option>
                  {packagesForClients.map(p => (
                    <option key={p.id} value={useApiClients ? String(p.id) : getPackageDisplayName(p)}>
                      {getPackageDisplayName(p)} — {formatPackagePriceLabel(p)} ({formatPackageCreditsLabel(p)})
                    </option>
                  ))}
                </select>
              </div>
              {!useApiClients && usuarioForm.paquete !== 'ninguno' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Método de pago</label>
                  <select className={styles.formSelect} value={usuarioForm.metodoPago}
                    onChange={e => setUsuarioForm(f => ({ ...f, metodoPago: e.target.value }))}>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              )}
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>{useApiClients ? 'Notas de asignacion inicial' : 'Notas / Observaciones'}</label>
                <textarea className={styles.formInput} rows={2} placeholder="Lesiones, preferencias, cómo nos encontró…"
                  value={usuarioForm.notas} onChange={e => setUsuarioForm(f => ({ ...f, notas: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={closeModal}>Cancelar</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={async () => {
                  if (useApiClients) {
                    const payload = buildClientApiPayload(usuarioForm, { isCreate: true })
                    const validationError = validateClientApiPayload(payload, { isCreate: true })
                    if (validationError) {
                      toast.error(validationError)
                      return
                    }
                    try {
                      const created = await createClientApi(payload)
                      if (usuarioForm.paquete !== 'ninguno') {
                        await assignClientPackageApi(created.id, {
                          packageId: Number(usuarioForm.paquete),
                          notes: usuarioForm.notas,
                        })
                      }
                      toast.success(`${usuarioForm.nombre} dado de alta`)
                      setApiClientsPage(1)
                      await queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] })
                      setUsuarioForm({ nombre: '', email: '', telefono: '', nacimiento: '', password: '', paquete: 'ninguno', metodoPago: 'efectivo', notas: '' })
                      closeModal()
                    } catch (error) {
                      toast.error(error?.message ?? 'No se pudo crear el cliente')
                    }
                    return
                  }
                  if (!usuarioForm.nombre.trim() || !usuarioForm.email.trim()) return
                    const paqSel = paquetes.find(p => String(p.id) === String(usuarioForm.paquete) || getPackageDisplayName(p) === usuarioForm.paquete)
                  let fechaVencimiento = null
                  if (paqSel?.vigencia) {
                    const dias = parseInt(paqSel.vigencia) || 30
                    const v = new Date(); v.setDate(v.getDate() + dias)
                    fechaVencimiento = v.toISOString().split('T')[0]
                  }
                  // Crear usuario SIN paquete — se asigna solo al confirmar el cobro en POS
                  const nuevoUsuario = agregarUsuario({
                    nombre:          usuarioForm.nombre,
                    email:           usuarioForm.email,
                    password:        usuarioForm.password,
                    telefono:        usuarioForm.telefono,
                    fechaNacimiento: usuarioForm.nacimiento,
                    rol:             'cliente',
                    activo:          true,
                    paquete:         null,
                    clasesPaquete:   0,
                    paqueteInfo:     null,
                    notas:           usuarioForm.notas,
                    fechaRegistro:   new Date().toISOString().split('T')[0],
                  })
                  toast.success(`${usuarioForm.nombre} dado de alta`)
                  logUsuarioNuevo({ nombre: usuarioForm.nombre, email: usuarioForm.email })
                  if (paqSel) {
                    // Guardar asignación pendiente: se ejecuta al cobrar en POS
                    setPendingAsignacion({
                      userId:           nuevoUsuario.id,
                      userName:         usuarioForm.nombre,
                      paqSel,
                      fechaVencimiento,
                      metodoPago:       usuarioForm.metodoPago,
                    })
                    const labelClases = useApiPackages
                      ? formatPackageCreditsLabel(paqSel)
                      : formatPackageCreditsLabel(paqSel)
                    setCart([{ name: `${getPackageDisplayName(paqSel)} — ${labelClases}`, price: paqSel.precio, emoji: '📦', cliente: usuarioForm.nombre }])
                    setPosFilter('📦 Paquetes')
                    setActiveSection('pos')
                    toast(`💳 Cobra el paquete para activarlo`, { icon: '🛒', duration: 4000 })
                  }
                  setUsuarioForm({ nombre: '', email: '', telefono: '', nacimiento: '', password: '', paquete: 'ninguno', metodoPago: 'efectivo', notas: '' })
                  closeModal()
                }}
              >
                Dar de alta
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL PRODUCTO ── */}
      {prodModal && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => { if (e.target === e.currentTarget) setProdModal(null) }}
        >
          <PosEntityModal
            title={prodModal === 'nuevo' ? 'Agregar producto' : 'Editar producto'}
            ariaLabel={prodModal === 'nuevo' ? 'Agregar producto' : 'Editar producto'}
            onClose={() => setProdModal(null)}
            footer={(
              <>
                <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={() => setProdModal(null)}>Cancelar</button>
                <button className={`${styles.btn} ${styles.btnPrimary}`} type="button" onClick={handleSaveProducto}>
                  {prodModal === 'nuevo' ? 'Agregar' : 'Guardar cambios'}
                </button>
              </>
            )}
          >
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre</label>
                <input className={styles.formInput} placeholder="Ej: Botella CS" value={prodForm.nombre}
                  onChange={(e) => setProdForm((f) => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Categoría</label>
                {useApiPos ? (
                  <>
                    <select
                      className={styles.formSelect}
                      value={String(prodForm.categoryId ?? '')}
                      onChange={(e) => {
                        const selectedId = e.target.value
                        const selectedCategory = (productCategoriesQuery.data?.items ?? []).find((category) => String(category.id) === String(selectedId))
                        setProdForm((f) => ({
                          ...f,
                          categoryId: selectedId,
                          categoria: selectedCategory?.name ?? selectedCategory?.nombre ?? '',
                        }))
                      }}
                      disabled={(productCategoriesQuery.data?.items ?? []).length === 0}
                    >
                      <option value="">Selecciona categoría</option>
                      {(productCategoriesQuery.data?.items ?? []).map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name ?? category.nombre}
                        </option>
                      ))}
                    </select>
                    {!(productCategoriesQuery.data?.items ?? []).length && (
                      <div className={`${styles.formGroupFull}`} style={{ fontSize: 12, color: 'var(--muted)' }}>
                        Crea una categoría antes de registrar productos.
                      </div>
                    )}
                  </>
                ) : (
                  <select className={styles.formSelect} value={prodForm.categoria}
                    onChange={(e) => setProdForm((f) => ({ ...f, categoria: e.target.value }))}>
                    {['Accesorios', 'Nutrición', 'Equipo', 'Ropa'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Precio (MXN)</label>
                <input className={styles.formInput} type="number" min="0" placeholder="Ej: 350" value={prodForm.precio}
                  onChange={(e) => setProdForm((f) => ({ ...f, precio: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Stock inicial</label>
                <input className={styles.formInput} type="number" min="0" placeholder="Ej: 20" value={prodForm.stock}
                  onChange={(e) => setProdForm((f) => ({ ...f, stock: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Emoji (opcional)</label>
                <input className={styles.formInput} maxLength={2} placeholder="🎽" value={prodForm.emoji}
                  onChange={(e) => setProdForm((f) => ({ ...f, emoji: e.target.value }))} />
              </div>
            </div>
          </PosEntityModal>
        </div>
      )}

      {/* ── EDITAR COACH ── */}
      {modalEditCoach && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => { if (e.target === e.currentTarget) setModalEditCoach(null) }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Editar coach — {modalEditCoach.nombre}</div>
              <button className={styles.modalClose} onClick={() => setModalEditCoach(null)}>×</button>
            </div>

            <input
              ref={fotoEditRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => setAvatarSelection(e.target.files?.[0], setEditAvatarPreview, setEditAvatarFile)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16, gap: 8 }}>
              <div
                onClick={() => fotoEditRef.current?.click()}
                style={{ cursor: 'pointer', width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                {currentEditCoachAvatar
                  ? <img src={currentEditCoachAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 28, fontWeight: 700 }}>{String(modalEditCoach?.nombre ?? 'C').charAt(0).toUpperCase()}</span>}
              </div>
              <button
                type="button"
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => fotoEditRef.current?.click()}
              >
                {currentEditCoachAvatar ? 'Cambiar foto' : 'Subir foto'}
              </button>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>JPG, PNG o WEBP. Máximo 5 MB.</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                <input
                  type="checkbox"
                  checked={Boolean(editCoachForm.public_profile_enabled)}
                  onChange={(e) => setEditCoachForm((f) => ({ ...f, public_profile_enabled: e.target.checked }))}
                />
                Perfil público visible
              </label>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Contraseña no se modifica aquí. Usa flujo de recuperación para cambio.
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre completo</label>
                <input
                  className={styles.formInput}
                  placeholder="Ej: Mafer García"
                  value={editCoachForm.nombre}
                  onChange={(e) => setEditCoachForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Disciplina</label>
                <select
                  className={styles.formSelect}
                  value={editCoachForm.disciplina}
                  onChange={(e) => setEditCoachForm((f) => ({ ...f, disciplina: e.target.value }))}
                >
                  <option value="Stryde X">Stryde X</option>
                  <option value="Slow">Slow</option>
                  <option value="Ambas">Ambas</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado</label>
                <select
                  className={styles.formSelect}
                  value={editCoachForm.estado}
                  onChange={(e) => setEditCoachForm((f) => ({ ...f, estado: e.target.value }))}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
<div className={styles.formGroup}>
                <label className={styles.formLabel}>Teléfono</label>
                <input
                  className={styles.formInput}
                  type="tel"
                  placeholder="+52 55 0000 0000"
                  value={editCoachForm.telefono}
                  onChange={(e) => setEditCoachForm((f) => ({ ...f, telefono: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Email</label>
                <input
                  className={styles.formInput}
                  type="email"
                  value={editCoachForm.email}
                  onChange={(e) => setEditCoachForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Biografía / Descripción</label>
                <textarea
                  className={styles.formInput}
                  rows={3}
                  placeholder="Breve descripción del coach y su experiencia…"
                  value={editCoachForm.bio}
                  onChange={(e) => setEditCoachForm((f) => ({ ...f, bio: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Instagram (URL)</label>
                <input
                  className={styles.formInput}
                  type="url"
                  placeholder="https://instagram.com/nombre_coach"
                  value={editCoachForm.instagram}
                  onChange={(e) => setEditCoachForm((f) => ({ ...f, instagram: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalEditCoach(null)}>
                Cancelar
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSaveCoach}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDITAR CLASE ── */}
      {modalEditClase && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => { if (e.target === e.currentTarget) setModalEditClase(null) }}
        >
          <div className={styles.modal} style={{ maxWidth: 560 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Editar clase</div>
              <button className={styles.modalClose} onClick={() => setModalEditClase(null)}>×</button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre de la clase</label>
                <input className={styles.formInput} placeholder="Ej: Stride Power"
                  value={editClaseForm.nombre}
                  onChange={e => setEditClaseForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo / Disciplina</label>
                <select className={styles.formSelect} value={editClaseForm.tipo}
                  onChange={e => setEditClaseForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="">Seleccionar…</option>
                  {disciplinas.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Coach</label>
                <select className={styles.formSelect} value={editClaseForm.coach}
                  onChange={e => setEditClaseForm(f => ({ ...f, coach: e.target.value }))}>
                  <option value="">Sin asignar</option>
                  {coachesForClassForms.filter(c => {
                    if (c.activo === false) return false
                    const esp = c.especialidad
                    if (!esp || esp === 'Ambas') return true
                    const claseEsSlow = editClaseForm.tipo?.toLowerCase().includes('slow')
                    return claseEsSlow ? esp.toLowerCase().includes('slow') : !esp.toLowerCase().includes('slow')
                  }).map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Fecha específica
                  <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)', marginLeft: 6 }}>
                    — vacío = recurrente
                  </span>
                </label>
                <input
                  className={styles.formInput}
                  type="date"
                  value={editClaseForm.fecha}
                  onChange={e => {
                    const fecha = e.target.value
                    if (fecha) {
                      const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
                      const dia = DIAS_ES[new Date(fecha + 'T12:00:00').getDay()]
                      setEditClaseForm(f => ({ ...f, fecha, dia }))
                    } else {
                      setEditClaseForm(f => ({ ...f, fecha: '' }))
                    }
                  }}
                />
                {editClaseForm.fecha && (
                  <p style={{ fontSize: 11, color: 'rgba(232,164,173,0.7)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
                    Clase única — {new Date(editClaseForm.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Día de la semana</label>
                <select className={styles.formSelect} value={editClaseForm.dia}
                  onChange={e => setEditClaseForm(f => ({ ...f, dia: e.target.value }))}>
                  {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hora de inicio</label>
                <input className={styles.formInput} type="time" value={editClaseForm.hora}
                  onChange={e => setEditClaseForm(f => ({ ...f, hora: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Duración (minutos)</label>
                <input className={styles.formInput} type="number" min="30" max="120"
                  value={editClaseForm.duracion}
                  onChange={e => setEditClaseForm(f => ({ ...f, duracion: e.target.value }))} />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Descripción</label>
                <textarea className={styles.formInput} rows={2}
                  value={editClaseForm.descripcion}
                  onChange={e => setEditClaseForm(f => ({ ...f, descripcion: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>

              {/* ── Programar publicación ── */}
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🕐 Programar publicación</span>
                  <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)' }}>
                    — dejar vacío para publicar de inmediato
                  </span>
                </label>
                <input
                  className={styles.formInput}
                  type="datetime-local"
                  value={editClaseForm.publicarEn}
                  onChange={e => setEditClaseForm(f => ({ ...f, publicarEn: e.target.value }))}
                />
                {editClaseForm.publicarEn && (
                  <p style={{ fontSize: 11, color: 'rgba(232,164,173,0.7)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
                    Se publicará el {new Date(editClaseForm.publicarEn).toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalEditClase(null)}>
                Cancelar
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={async () => {
                  if (!editClaseForm.nombre.trim()) return
                  const payload = buildClaseApiPayload({
                    form: editClaseForm,
                    coaches: coachesForClassForms,
                    fallbackCoachId: modalEditClase?.coachId,
                  })
                  if (useApiClasses) {
                    if (!Array.isArray(coachesForClassForms) || coachesForClassForms.length === 0) {
                      toast.error('No hay coaches registrados en backend. Sincroniza coaches antes de editar clases.')
                      return
                    }
                    if (!Number.isInteger(payload.coach_id)) {
                      toast.error('Selecciona un coach válido para guardar en API mode')
                      return
                    }
                    if (editClaseForm.publicarEn) {
                      toast.error('Programar publicación no está soportado todavía por backend')
                      return
                    }
                    const updatedClase = await updateClaseApi(modalEditClase.id, payload)
                    let editedOccurrence = null
                    let occurrenceFailed = false
                    if (editClaseForm.fecha && !modalEditClase?.occurrenceId) {
                      const occurrencePayload = buildOccurrencePayloadFromClassForm(editClaseForm, payload)
                      try {
                        editedOccurrence = await createClassOccurrenceApi(updatedClase?.id ?? modalEditClase.id, occurrencePayload)
                      } catch (_occurrenceError) {
                        occurrenceFailed = true
                        await invalidateClassSideEffects(queryClient, {
                          classId: updatedClase?.id ?? modalEditClase.id,
                          coachId: updatedClase?.coachId ?? updatedClase?.coach_id ?? payload.coach_id,
                        })
                        await loadClasesFromApi({ force: true, status: 'programada' })
                        toast.error('La clase se actualizó, pero no se pudo programar la sesión en calendario.')
                      }
                    }
                    if (occurrenceFailed) {
                      setModalEditClase(null)
                      return
                    }
                    await invalidateClassSideEffects(queryClient, {
                      classId: updatedClase?.id ?? modalEditClase.id,
                      occurrenceId: editedOccurrence?.occurrenceId ?? editedOccurrence?.id ?? modalEditClase?.occurrenceId ?? null,
                      coachId: updatedClase?.coachId ?? updatedClase?.coach_id ?? payload.coach_id,
                    })
                    await loadClasesFromApi({ force: true, status: 'programada' })
                  } else {
                    const coachObj = coaches.find(c => c.nombre === editClaseForm.coach)
                    editarClase(modalEditClase.id, {
                      nombre:      editClaseForm.nombre,
                      tipo:        editClaseForm.tipo,
                      coachId:     coachObj?.id ?? modalEditClase.coachId ?? null,
                      coachNombre: editClaseForm.coach || 'Sin asignar',
                      dia:         editClaseForm.dia,
                      hora:        editClaseForm.hora,
                      duracion:    Number(editClaseForm.duracion) || 50,
                      cupoMax:     editClaseForm.tipo === 'Slow' ? 10 : 14,
                      descripcion: editClaseForm.descripcion,
                      publicarEn:  editClaseForm.publicarEn || null,
                      fecha:       editClaseForm.fecha || null,
                    })
                  }
                  toast.success(`Clase "${editClaseForm.nombre}" actualizada`)
                  setModalEditClase(null)
                }}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ALUMNOS DE CLASE ── */}
      {modalAlumnosClase && (() => {
        const cls      = modalAlumnosClase
        const occurrenceId = cls.occurrenceId ?? cls.occurrence_id ?? null
        const rosterStudents = useApiClasses
          ? (occurrenceRosterQuery.data?.students ?? [])
          : todasReservas.filter((r) => {
              const matchesOccurrence = occurrenceId
                ? String(r.occurrenceId ?? '') === String(occurrenceId)
                : String(r.claseId ?? '') === String(cls.id)
              return matchesOccurrence && (r.estado === 'confirmada' || r.estado === 'no_asistio')
            })
        const inscritos = rosterStudents.map((r) => ({
          ...r,
          nombreUsuario:
            r.name ??
            r.nombreUsuario ??
            clientsForAdmin.find((client) => Number(client.id) === Number(r.userId ?? r.user_id))?.name ??
            clientsForAdmin.find((client) => Number(client.id) === Number(r.userId ?? r.user_id))?.nombre ??
            usuarios.find((u) => u.id === (r.userId ?? r.user_id))?.nombre ??
            `Usuario #${r.userId ?? r.user_id}`,
        }))
        const idsInscritos = new Set(inscritos.map((r) => Number(r.userId ?? r.user_id)))
        const disponibles = useApiClients
          ? (clientsForAdmin ?? []).filter((u) => !idsInscritos.has(Number(u.id)) && String(u.status ?? u.estado ?? 'active') === 'active')
          : usuarios.filter((u) => !idsInscritos.has(u.id) && u.rol === 'cliente')
        const rosterLoading = useApiClasses ? occurrenceRosterQuery.isLoading : false
        const rosterError = useApiClasses ? occurrenceRosterQuery.error : null
        const rosterErrorMessage = !canReadClassRoster
          ? 'No tienes permisos para ver alumnos de esta ocurrencia.'
          : rosterError
          ? (rosterError?.status === 403
            ? 'No tienes permisos para ver alumnos de esta ocurrencia.'
            : rosterError?.status === 404
              ? 'Ocurrencia no encontrada.'
              : rosterError?.status === 401
                ? 'Sesión expirada o no autenticado.'
                : (rosterError?.message ?? 'No se pudo cargar roster de alumnos.')
          )
          : ''
        const dayLabel = cls.dia ?? cls.discipline ?? 'Sin día'
        const timeLabel = getClassDisplayTime(cls)
        const rosterCount = useApiClasses
          ? (occurrenceRosterQuery.data?.capacityCurrent ?? inscritos.length ?? 0)
          : (cls.cupoActual ?? inscritos.length ?? 0)

        async function handleCancelar(r) {
          if (!canManageReservations) {
            toast.error('No tienes permisos para cancelar reservas.')
            return
          }
          const res = await cancelarReservaService(r.id, r.userId)
          if (res.ok) {
            toast.success(`Reserva de ${r.nombreUsuario} cancelada`)
            if (useApiMode && occurrenceId) {
              await queryClient.invalidateQueries({ queryKey: queryKeys.occurrenceRoster.detail(occurrenceId, false) })
            }
          }
          else toast.error(res.error)
        }

        async function handleAgregar() {
          if (!canManageReservations) {
            toast.error('No tienes permisos para inscribir alumnos.')
            return
          }
          if (!alumnoAgregarId) return
          const userId = Number(alumnoAgregarId)
          const usuario = useApiClients
            ? (clientsForAdmin ?? []).find((u) => Number(u.id) === userId)
            : usuarios.find(u => u.id === userId)
          if (useApiClasses && !occurrenceId) {
            toast.error('Selecciona una fecha de ocurrencia para inscribir alumno')
            return
          }
          const res = await reservarClaseService(userId, cls.id, null, occurrenceId)
          if (res.ok) {
            toast.success(`${usuario?.nombre ?? usuario?.name ?? 'Cliente'} inscrito en ${cls.nombre}`)
            setAlumnoAgregarId('')
            if (useApiMode && occurrenceId) {
              await queryClient.invalidateQueries({ queryKey: queryKeys.occurrenceRoster.detail(occurrenceId, false) })
              await queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] })
            }
          } else if (res.error === 'Sin créditos disponibles' && !useApiReservations) {
            const { agregarReserva } = useReservasStore.getState()
            const { actualizarCupo } = useClasesStore.getState()
            agregarReserva({
              userId,
              claseId:     cls.id,
              occurrenceId,
              claseNombre: cls.nombre,
              claseHora:   getClassDisplayTime(cls),
              claseDia:    cls.dia,
              coachNombre: cls.coachNombre,
              tipo:        cls.tipo,
              asiento:     null,
              estado:      'confirmada',
              fecha:       cls.fecha ?? new Date().toISOString().split('T')[0],
            })
            actualizarCupo(cls.id, 1)
            toast.success(`${usuario?.nombre ?? usuario?.name ?? 'Cliente'} inscrito manualmente (sin créditos descontados)`)
            setAlumnoAgregarId('')
            if (useApiMode && occurrenceId) {
              await queryClient.invalidateQueries({ queryKey: queryKeys.occurrenceRoster.detail(occurrenceId, false) })
            }
          } else {
            toast.error(res.error)
          }
        }

        return (
          <div
            className={`${styles.modalOverlay} ${styles.open}`}
            onClick={e => { if (e.target === e.currentTarget) setModalAlumnosClase(null) }}
          >
            <div className={styles.modal} style={{ maxWidth: 640, width: '90vw', maxHeight: '85vh', overflowY: 'auto' }}>
              <div className={styles.modalHeader}>
                <div>
                  <div className={styles.modalTitle}>Alumnos — {cls.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                    {dayLabel} · {timeLabel} · {rosterCount}/{cls.cupoMax} inscritos
                  </div>
                </div>
                <button className={styles.modalClose} onClick={() => setModalAlumnosClase(null)}>×</button>
              </div>

              {/* Lista de inscritos */}
              <div style={{ marginBottom: 20 }}>
                {rosterLoading ? (
                  <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                    Cargando roster de alumnos...
                  </p>
                ) : rosterErrorMessage ? (
                  <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                    {rosterErrorMessage}
                  </p>
                ) : inscritos.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                    {useApiClasses && occurrenceId
                      ? 'Listado de alumnos pendiente de endpoint por ocurrencia.'
                      : 'Nadie inscrito aún'}
                  </p>
                ) : (
                  <table className={styles.table} style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        <th>Detalle</th>
                        <th>Estado</th>
                        <th>Asiento</th>
                        <th style={{ textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inscritos.map(r => (
                        <tr key={r.reservationId ?? r.id}>
                          <td style={{ fontWeight: 500 }}>{r.nombreUsuario}</td>
                          <td>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              {r.email ?? r.phone ?? `Usuario #${r.userId ?? r.user_id}`}
                            </div>
                          </td>
                          <td>
                            {String(r.status ?? r.estado ?? '').toLowerCase() === 'no_asistio'
                              ? <span className={`${styles.miniTag} ${styles.tagYellow}`}>No asistió</span>
                              : String(r.status ?? r.estado ?? '').toLowerCase() === 'completada'
                                ? <span className={`${styles.miniTag} ${styles.tagBlue}`}>Completado</span>
                                : <span className={`${styles.miniTag} ${styles.tagGreen}`}>Confirmado</span>
                            }
                          </td>
                          <td>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              {r.equipmentLabel ?? r.equipment_label ?? r.equipmentType ?? r.equipment_type
                                ? `${r.equipmentLabel ?? r.equipment_label ?? r.equipmentType ?? r.equipment_type}${r.spotLabel ?? r.spot_label ? ` ${r.spotLabel ?? r.spot_label}` : ''}`
                                : (r.spotLabel ?? r.spot_label ?? '—')}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              {String(r.status ?? r.estado ?? '').toLowerCase() === 'confirmada' && (
                                <button
                                  className={`${styles.btn} ${styles.btnGhost}`}
                                  style={{ fontSize: 11, padding: '4px 10px', color: '#F59E0B', borderColor: 'rgba(245,158,11,0.3)' }}
                                  disabled={!canManageClassRoster}
                                  title={canManageClassRoster ? 'Marcar ausente' : 'No tienes permisos para gestionar roster'}
                                  onClick={async () => {
                                    if (!canManageClassRoster) {
                                      toast.error('No tienes permisos para gestionar roster.')
                                      return
                                    }
                                    const res = await marcarNoAsistio(r.reservationId ?? r.id)
                                    if (res.ok) {
                                      toast.success(`${r.nombreUsuario} marcado como no asistió`)
                                      if (useApiMode && occurrenceId) {
                                        await queryClient.invalidateQueries({ queryKey: queryKeys.occurrenceRoster.detail(occurrenceId, false) })
                                      }
                                    }
                                    else toast.error(res.error)
                                  }}
                                >
                                  Marcar ausente
                                </button>
                              )}
                              {String(r.status ?? r.estado ?? '').toLowerCase() === 'confirmada' && (
                                <button
                                  className={`${styles.btn} ${styles.btnGhost}`}
                                  style={{ fontSize: 11, padding: '4px 10px', color: '#ef4444' }}
                                  disabled={!canManageReservations}
                                  title={canManageReservations ? 'Cancelar reserva' : 'No tienes permisos para cancelar reservas'}
                                  onClick={() => handleCancelar({
                                    ...r,
                                    id: r.reservationId ?? r.id,
                                    userId: r.userId ?? r.user_id,
                                    nombreUsuario: r.nombreUsuario,
                                  })}
                                >
                                  Cancelar reserva
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Lista de espera */}
              {(() => {
                const enEspera = getListaEspera(cls.id)
                if (!enEspera.length) return null
                return (
                  <div style={{ marginTop: 20, borderTop: '1px solid var(--neutral-border)', paddingTop: 16 }}>
                    <div style={{
                      fontFamily: 'var(--font-body)', fontSize: 12,
                      color: '#F59E0B', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      marginBottom: 10,
                    }}>
                      ⏳ Lista de espera ({enEspera.length})
                    </div>
                    {enEspera.map((e, i) => (
                      <div key={e.id} style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: i < enEspera.length - 1
                          ? '1px solid var(--neutral-border)' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: 'rgba(245,158,11,0.15)',
                            color: '#F59E0B', fontSize: 11, fontWeight: 700,
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0,
                          }}>
                            {i + 1}
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 13, color: '#fff',
                          }}>
                            {e.nombre}
                          </span>
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 11, color: 'var(--text-muted)',
                        }}>
                          {new Date(e.timestamp).toLocaleTimeString('es-MX',
                            { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    <div style={{
                      marginTop: 10, padding: '8px 12px',
                      background: 'rgba(245,158,11,0.06)',
                      borderRadius: 8, border: '1px solid rgba(245,158,11,0.15)',
                      fontFamily: 'var(--font-body)', fontSize: 11,
                      color: 'rgba(245,158,11,0.7)',
                    }}>
                      {/* [BACKEND] → El backend notificará automáticamente al
                          primero en la lista cuando se libere un lugar.
                          Implementar: webhook en cancelarReserva →
                          notificación push/email → link con token de 30min
                          para confirmar la reserva. */}
                      💡 El primero en la lista será notificado automáticamente cuando se libere un lugar.
                    </div>
                  </div>
                )
              })()}

              {/* Agregar alumno manualmente */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Inscribir alumno manualmente
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    className={styles.formSelect}
                    style={{ flex: 1, fontSize: 13 }}
                    value={alumnoAgregarId}
                    onChange={e => setAlumnoAgregarId(e.target.value)}
                  >
                    <option value="">Seleccionar usuario…</option>
                    {disponibles.map(u => (
                      <option key={u.id} value={u.id}>
                        {useApiClients
                          ? buildClientEnrollmentLabel(u)
                          : `${u.nombre} ${u.paquete ? `· ${u.paquete}` : '· Sin paquete'}`}
                      </option>
                    ))}
                  </select>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}
                    onClick={handleAgregar}
                    disabled={!alumnoAgregarId || (useApiClasses && !occurrenceId) || !canManageReservations}
                  >
                    + Inscribir
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}
                    onClick={() => alumnoAgregarId && setAdminSeatSelector({ cls, userId: Number(alumnoAgregarId) })}
                    disabled={!alumnoAgregarId || (useApiClasses && !occurrenceId) || !canManageReservations}
                  >
                    🪑 Elegir asiento
                  </button>
                </div>
                {alumnoAgregarId && (() => {
                  const u = useApiClients
                    ? (clientsForAdmin ?? []).find((uu) => Number(uu.id) === Number(alumnoAgregarId))
                    : usuarios.find(uu => uu.id === Number(alumnoAgregarId))
                  if (!u) return null
                  return (
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
                      {useApiClients
                        ? (Number(u.clasesPaquete ?? u.creditsBalance ?? u.creditos ?? 0) > 0
                          ? `${Number(u.clasesPaquete ?? u.creditsBalance ?? u.creditos ?? 0)} crédito(s) disponibles`
                          : '⚠️ Sin créditos — backend validará la reserva')
                        : (u.clasesPaquete > 0 ? `${u.clasesPaquete} crédito(s) disponibles` : '⚠️ Sin créditos — se inscribirá sin descontar')}
                    </p>
                  )
                })()}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalAlumnosClase(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── HORARIO COACH ── */}
      {modalHorarioCoach && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => { if (e.target === e.currentTarget) setModalHorarioCoach(null) }}
        >
          <div className={styles.modal} style={{ maxWidth: 560 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Horario — {modalHorarioCoach.nombre}</div>
              <button className={styles.modalClose} onClick={() => setModalHorarioCoach(null)}>×</button>
            </div>
            {(() => {
              const clasesCoach = clases.filter(
                (c) => String(c.coachId) === String(modalHorarioCoach.id) || c.coachNombre === modalHorarioCoach.nombre
              )
              return clasesCoach.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: 14 }}>
                  Este coach no tiene clases asignadas
                </p>
              ) : (
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr><th>Clase</th><th>Tipo</th><th>Día</th><th>Hora</th><th>Cupo</th></tr>
                    </thead>
                    <tbody>
                      {clasesCoach.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                          <td><Tag color={!c.tipo?.toLowerCase().includes('slow') ? 'pink' : 'blue'}>{c.tipo}</Tag></td>
                          <td>{c.dia}</td>
                          <td>{getClassDisplayTime(c)}</td>
                          <td style={{ color: 'var(--muted)', fontSize: 12 }}>{c.cupoActual}/{c.cupoMax}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })()}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalHorarioCoach(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRMAR ELIMINAR PRODUCTO ── */}
      {confirmarEliminarProd && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmarEliminarProd(null) }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Eliminar producto</div>
              <button className={styles.modalClose} onClick={() => setConfirmarEliminarProd(null)}>×</button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>
              ¿Eliminar <strong>{confirmarEliminarProd.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setConfirmarEliminarProd(null)}>Cancelar</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleEliminarProducto}
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDITAR PAQUETE ── */}
      {modalEditPaquete && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => { if (e.target === e.currentTarget) setModalEditPaquete(null) }}
        >
          <div className={styles.modal} style={{ maxWidth: 520 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Editar paquete</div>
              <button className={styles.modalClose} onClick={() => setModalEditPaquete(null)}>×</button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre (opcional)</label>
                <input className={styles.formInput} value={editPaqueteForm.nombre}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Precio (MXN)</label>
                <input className={styles.formInput} type="number" min="0" value={editPaqueteForm.precio}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, precio: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Créditos</label>
                <input className={styles.formInput} type="number" min="1" value={editPaqueteForm.clases}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, clases: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vigencia en días</label>
                <input className={styles.formInput} type="number" min="1" placeholder="Ej: 30" value={editPaqueteForm.vigencia}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, vigencia: e.target.value }))} />
              </div>
              <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="destEdit" checked={editPaqueteForm.destacado}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, destacado: e.target.checked }))} />
                <label htmlFor="destEdit" className={styles.formLabel} style={{ margin: 0 }}>Marcar como popular</label>
              </div>

             {/*  <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="shareEdit"
                  checked={editPaqueteForm.isShareable}
                  onChange={e => setEditPaqueteForm(f => ({
                    ...f,
                    isShareable: e.target.checked,
                    maxBeneficiaries: e.target.checked ? Math.max(Number(f.maxBeneficiaries) || 1, 1) : 0,
                  }))}
                />
                <label htmlFor="shareEdit" className={styles.formLabel} style={{ margin: 0 }}>Permitir compartir paquete</label>
              </div> */}

              {/* <div className={styles.formGroup}>
                <label className={styles.formLabel}>Máximo de beneficiarios</label>
                <input
                  className={styles.formInput}
                  type="number"
                  min="1"
                  disabled={!editPaqueteForm.isShareable}
                  value={editPaqueteForm.maxBeneficiaries}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, maxBeneficiaries: e.target.value }))}
                />
                <small style={{ color: 'var(--muted)', display: 'block', marginTop: 6 }}>
                  {editPaqueteForm.isShareable
                    ? `Compartible con hasta ${Number(editPaqueteForm.maxBeneficiaries) || 1} ${Number(editPaqueteForm.maxBeneficiaries) === 1 ? 'beneficiario' : 'beneficiarios'}`
                    : 'No compartible'}
                </small>
              </div> */}

              {/* Beneficios */}
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Beneficios</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {editPaqueteForm.beneficios.map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        className={styles.formInput}
                        value={b}
                        onChange={e => setEditPaqueteForm(f => {
                          const bs = [...f.beneficios]; bs[i] = e.target.value; return { ...f, beneficios: bs }
                        })}
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={() => setEditPaqueteForm(f => ({ ...f, beneficios: f.beneficios.filter((_, j) => j !== i) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 18, lineHeight: 1 }}
                      >×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className={styles.formInput}
                    placeholder="Nuevo beneficio..."
                    value={nuevoBeneficio}
                    onChange={e => setNuevoBeneficio(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && nuevoBeneficio.trim()) {
                        setEditPaqueteForm(f => ({ ...f, beneficios: [...f.beneficios, nuevoBeneficio.trim()] }))
                        setNuevoBeneficio('')
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={() => {
                      if (!nuevoBeneficio.trim()) return
                      setEditPaqueteForm(f => ({ ...f, beneficios: [...f.beneficios, nuevoBeneficio.trim()] }))
                      setNuevoBeneficio('')
                    }}>+ Agregar</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalEditPaquete(null)}>Cancelar</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSavePackage}
              >Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
      {/* ── VER USUARIO ── */}
      {modalVerUsuario && (() => {
        const u = modalVerUsuarioResolved ?? modalVerUsuario
        const reservasU = useApiClients
          ? (u.recentReservations ?? [])
          : todasReservas.filter(r => String(r.userId) === String(u.id))
        const reservasOrdenadas = reservasU.slice().reverse()
        const paginatedReservasModal = paginateArray(reservasOrdenadas, { page: reservasModalPage, pageSize: 8 })
        const paqActivo = packagesForClients.find(p => getPackageDisplayName(p) === u.paquete)
        const restantes = Number(u.clasesPaquete ?? 0)
        const tag   = u.activo && u.paquete ? 'green' : !u.paquete ? 'red' : 'yellow'
        const label = u.activo && u.paquete ? 'Activo' : !u.paquete ? 'Sin paquete' : 'Inactivo'
        const [vistaVer, setVistaVer] = [null, null] // placeholder, manejado abajo

        return (
          <div
            className={`${styles.modalOverlay} ${styles.open}`}
            onClick={e => { if (e.target === e.currentTarget) setModalVerUsuario(null) }}
          >
            <div className={styles.modal} style={{ maxWidth: 580, padding: 0, overflow: 'hidden' }}>

              {/* Header con avatar */}
              <div style={{ background: 'linear-gradient(135deg, var(--crimson) 0%, #5C1018 100%)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {u.nombre[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-display)' }}>{u.nombre}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-body)', marginTop: 2 }}>{u.email}</div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)', background: u.activo && u.paquete ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)', color: u.activo && u.paquete ? '#4ade80' : '#f87171', border: `1px solid ${u.activo && u.paquete ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                  {label}
                </span>
                <button className={styles.modalClose} onClick={() => setModalVerUsuario(null)} style={{ color: 'rgba(255,255,255,0.7)', marginLeft: 8 }}>×</button>
              </div>

              <div style={{ padding: '24px 28px', maxHeight: '70vh', overflowY: 'auto' }}>

                {/* ── DATOS DEL CLIENTE ── */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', marginBottom: 12 }}>Datos del cliente</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                    {(() => {
                      const paqActivo = packagesForClients.find(p => getPackageDisplayName(p) === u.paquete)
                      const vencimientoDisplay = (() => {
                        if (u.paqueteInfo?.fechaVencimiento) return u.paqueteInfo.fechaVencimiento
                        if (!u.paqueteInfo?.fechaCompra || !paqActivo?.vigencia) return '—'
                        const dias = parseInt(paqActivo.vigencia) || 30
                        const d = new Date(u.paqueteInfo.fechaCompra + 'T00:00:00')
                        d.setDate(d.getDate() + dias)
                        return d.toISOString().split('T')[0]
                      })()
                      return [
                        { label: 'Teléfono',        val: u.telefono || '—' },
                        { label: 'Nacimiento',       val: u.fechaNacimiento || '—' },
                        { label: 'Paquete activo',   val: u.paquete || 'Sin paquete' },
                        { label: 'Clases restantes', val: String(restantes) },
                        { label: 'Fecha de compra',  val: u.paqueteInfo?.fechaCompra || '—' },
                        { label: 'Vencimiento',      val: vencimientoDisplay },
                      ]
                    })().map(({ label, val }) => (
                      <div key={label} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--muted-2)' }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{val}</div>
                      </div>
                    ))}
                </div>
                {useApiClients && (
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input className={styles.formInput} value={editClientForm.nombre} placeholder="Nombre"
                      onChange={(event) => setEditClientForm((form) => ({ ...form, nombre: event.target.value }))} />
                      <input className={styles.formInput} value={editClientForm.email} placeholder="Email"
                        onChange={(event) => setEditClientForm((form) => ({ ...form, email: event.target.value }))} />
                      <input className={styles.formInput} value={editClientForm.telefono} placeholder="Telefono"
                        onChange={(event) => setEditClientForm((form) => ({ ...form, telefono: event.target.value }))} />
                      <select className={styles.formSelect} value={editClientForm.estado}
                        onChange={(event) => setEditClientForm((form) => ({ ...form, estado: event.target.value }))}>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                      </select>
                      <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={async () => {
                        const payload = buildClientApiPayload(editClientForm)
                        const validationError = validateClientApiPayload(payload)
                        if (validationError) return toast.error(validationError)
                        try {
                          await updateClientApi(u.id, payload)
                          await refreshClientDetail(u.id)
                          toast.success('Cliente actualizado')
                        } catch (error) {
                          toast.error(error?.message ?? 'No se pudo actualizar el cliente')
                        }
                      }}>
                        Guardar datos
                      </button>
                    </div>
                  )}

                {useApiClients && (u.sharedMemberships ?? []).length > 0 && (
                  <div style={{ marginTop: 24, padding: '16px 18px', background: 'rgba(123,30,34,0.08)', borderRadius: 12, border: '1px solid rgba(123,30,34,0.18)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', marginBottom: 12 }}>
                      Membresías compartidas
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {(u.sharedMemberships ?? []).map((membership) => {
                        const beneficiaries = membership.beneficiaries ?? []
                        const emailKey = String(membership.membershipId ?? membership.packageId ?? '')
                        const currentEmail = sharedMembershipEmails[emailKey] ?? ''
                        const actionKey = sharedMembershipActionKey
                        return (
                          <div key={emailKey || membership.packageId} style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>
                                  {membership.displayName ?? membership.packageName ?? 'Paquete'}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                                  {membership.creditsAvailable ?? 0} créditos disponibles
                                  {membership.expiresAt ? ` · Vence ${membership.expiresAt}` : ''}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                                  {membership.isShareable
                                    ? `Compartible con hasta ${membership.maxBeneficiaries ?? 1} ${(membership.maxBeneficiaries ?? 1) === 1 ? 'beneficiario' : 'beneficiarios'}`
                                    : 'No compartible'}
                                </div>
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                                {membership.status ?? 'active'}
                              </div>
                            </div>

                            <div style={{ marginTop: 12 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.86)', marginBottom: 8 }}>
                                Beneficiarios
                              </div>
                              {beneficiaries.length === 0 ? (
                                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Sin beneficiarios configurados.</div>
                              ) : (
                                <div style={{ display: 'grid', gap: 8 }}>
                                  {beneficiaries.map((beneficiary) => (
                                    <div key={beneficiary.beneficiaryId ?? beneficiary.email} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                      <div>
                                        <div style={{ color: 'rgba(255,255,255,0.9)' }}>{beneficiary.name || beneficiary.email || 'Beneficiario'}</div>
                                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{beneficiary.email || 'Sin email'}</div>
                                      </div>
                                      <button
                                        className={`${styles.btn} ${styles.btnGhost}`}
                                        style={{ fontSize: 11, padding: '6px 10px' }}
                                        disabled={actionKey === `${emailKey}:${beneficiary.beneficiaryId}:remove`}
                                        onClick={async () => {
                                          if (!beneficiary.beneficiaryId) return
                                          const confirmRemove = window.confirm('Quitar beneficiario del paquete compartido?')
                                          if (!confirmRemove) return
                                          setSharedMembershipActionKey(`${emailKey}:${beneficiary.beneficiaryId}:remove`)
                                          try {
                                            await removeClientMembershipBeneficiaryApi(u.id, membership.membershipId, beneficiary.beneficiaryId)
                                            await refreshClientDetail(u.id)
                                            toast.success('Beneficiario removido')
                                          } catch (error) {
                                            toast.error(resolveMembershipErrorMessage(error))
                                          } finally {
                                            setSharedMembershipActionKey('')
                                          }
                                        }}
                                      >
                                        Quitar
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {membership.isShareable && (
                              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                                <input
                                  className={styles.formInput}
                                  type="email"
                                  placeholder="Email del beneficiario"
                                  value={currentEmail}
                                  onChange={(event) => setSharedMembershipEmails((state) => ({
                                    ...state,
                                    [emailKey]: event.target.value,
                                  }))}
                                />
                                <button
                                  className={`${styles.btn} ${styles.btnPrimary}`}
                                  style={{ whiteSpace: 'nowrap' }}
                                  disabled={actionKey === `${emailKey}:add`}
                                  onClick={async () => {
                                    const email = String(currentEmail ?? '').trim()
                                    if (!email) {
                                      toast.error('Ingresa correo del beneficiario.')
                                      return
                                    }
                                    setSharedMembershipActionKey(`${emailKey}:add`)
                                    try {
                                      await addClientMembershipBeneficiaryApi(u.id, membership.membershipId, email)
                                      await refreshClientDetail(u.id)
                                      setSharedMembershipEmails((state) => ({ ...state, [emailKey]: '' }))
                                      toast.success('Beneficiario agregado')
                                    } catch (error) {
                                      toast.error(resolveMembershipErrorMessage(error))
                                    } finally {
                                      setSharedMembershipActionKey('')
                                    }
                                  }}
                                >
                                  Agregar beneficiario
                                </button>
                              </div>
                            )}

                            {!membership.isShareable && (
                              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
                                Paquete no compartible.
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                  {!useApiClients && <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', marginBottom: 6 }}>
                      📝 Notas / Observaciones
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <textarea
                        value={editNotas}
                        onChange={e => setEditNotas(e.target.value)}
                        placeholder="Lesiones, preferencias, cómo nos encontró…"
                        rows={2}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--muted-2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none' }}
                      />
                      <button
                        className={`${styles.btn} ${styles.btnGhost}`}
                        style={{ alignSelf: 'flex-start', padding: '7px 12px', fontSize: 12 }}
                        onClick={() => {
                          editarUsuario(u.id, { notas: editNotas })
                          setModalVerUsuario({ ...u, notas: editNotas })
                          toast.success('Notas actualizadas')
                        }}
                      >
                        Guardar
                      </button>
                    </div>
                  </div>}
                </div>

                {/* ── ASIGNAR / CAMBIAR PAQUETE ── */}
                <div style={{ marginBottom: 24, padding: '16px 18px', background: 'rgba(123,30,34,0.12)', borderRadius: 10, border: '1px solid rgba(123,30,34,0.25)' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', marginBottom: 12 }}>
                    {u.paquete ? 'Cambiar paquete' : 'Asignar paquete'}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <select
                        className={styles.formSelect}
                        value={asignarPaqueteForm.paqueteNombre}
                        onChange={e => {
                          setAsignarPaqueteForm(f => ({ ...f, paqueteNombre: e.target.value }))
                          setCompartirAdminData({ activo: false, participantes: [] })
                        }}
                      >
                        <option value="">Sin paquete</option>
                        {packagesForClients.map(p => (
                          <option key={p.id} value={useApiClients ? String(p.id) : getPackageDisplayName(p)}>
                            {getPackageDisplayName(p)} — {formatPackagePriceLabel(p)} ({formatPackageCreditsLabel(p)})
                          </option>
                        ))}
                      </select>
                    </div>
                    {!useApiClients && <div style={{ flex: 1 }}>
                      <select
                        className={styles.formSelect}
                        value={asignarPaqueteForm.metodoPago}
                        onChange={e => setAsignarPaqueteForm(f => ({ ...f, metodoPago: e.target.value }))}
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>}
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={async () => {
                        if (useApiClients) {
                          const packageId = Number(asignarPaqueteForm.paqueteNombre)
                          if (!packageId) return toast.error('Selecciona un paquete valido.')
                          try {
                            await assignClientPackageApi(u.id, {
                              packageId,
                              notes: `Asignacion manual admin para ${u.nombre}`,
                            })
                            await refreshClientDetail(u.id)
                            toast.success('Paquete asignado')
                          } catch (error) {
                            toast.error(error?.message ?? 'No se pudo asignar el paquete')
                          }
                          return
                        }
                        const paqSel = paquetes.find(p => String(p.id) === String(asignarPaqueteForm.paqueteNombre) || getPackageDisplayName(p) === asignarPaqueteForm.paqueteNombre)
                        if (!paqSel) {
                          editarUsuario(u.id, { paquete: null, clasesPaquete: 0, paqueteInfo: null })
                          setModalVerUsuario(null)
                          toast.success(`Paquete removido de ${u.nombre}`)
                          return
                        }
                        // Si hay compartir activo, asignar el paquete dividido a todos de inmediato
                        if (compartirAdminData.activo && compartirAdminData.participantes.length > 0 && paqSel.clases > 0) {
                          const todosIds = [u.id, ...compartirAdminData.participantes.map(p => p.id)]
                          useUsuariosStore.getState().asignarPaqueteCompartido(todosIds, paqSel.nombre, paqSel.clases)
                          const clasesPorPersona = Math.floor(paqSel.clases / todosIds.length)
                          const nombres = compartirAdminData.participantes.map(p => p.nombre ?? p.name).join(', ')
                          setModalVerUsuario(null)
                          setCompartirAdminData({ activo: false, participantes: [] })
                          toast.success(`✅ Paquete compartido: ${clasesPorPersona} clases para ${u.nombre}, ${nombres}`)
                          return
                        }
                        let fechaVencimiento = null
                        if (paqSel.vigencia) {
                          const dias = parseInt(paqSel.vigencia) || 30
                          const v = new Date(); v.setDate(v.getDate() + dias)
                          fechaVencimiento = v.toISOString().split('T')[0]
                        }
                        setPendingAsignacion({
                          userId:          u.id,
                          userName:        u.nombre,
                          paqSel,
                          fechaVencimiento,
                          metodoPago:      asignarPaqueteForm.metodoPago,
                        })
                        const labelClases = formatPackageCreditsLabel(paqSel)
                        setCart([{ name: `${getPackageDisplayName(paqSel)} — ${labelClases}`, price: paqSel.precio, emoji: '📦', cliente: u.nombre }])
                        setPosFilter('📦 Paquetes')
                        setModalVerUsuario(null)
                        setActiveSection('pos')
                        toast(`💳 Cobra para activar el paquete`, { icon: '🛒', duration: 4000 })
                      }}
                    >
                      Guardar
                    </button>
                  </div>

                  {/* Compartir paquete — comentado, pendiente de implementación futura */}
                  {/* {asignarPaqueteForm.paqueteNombre && (
                    <CompartirPaquete
                      paquete={paquetes.find(p => String(p.id) === String(asignarPaqueteForm.paqueteNombre) || getPackageDisplayName(p) === asignarPaqueteForm.paqueteNombre)}
                      usuarioActualId={u.id}
                      variant="dark"
                      onChange={setCompartirAdminData}
                    />
                  )} */}
                </div>

                {useApiClients && (
                  <div style={{ marginBottom: 24, padding: '16px 18px', borderRadius: 10, border: '1px solid var(--muted-2)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                      Ajuste manual de creditos
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 10 }}>
                      <input className={styles.formInput} type="number" value={clientCreditForm.amount} placeholder="+2 o -1"
                        onChange={(event) => setClientCreditForm((form) => ({ ...form, amount: event.target.value }))} />
                      <input className={styles.formInput} value={clientCreditForm.notes} placeholder="Motivo administrativo"
                        onChange={(event) => setClientCreditForm((form) => ({ ...form, notes: event.target.value }))} />
                      <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={async () => {
                        const amount = Number(clientCreditForm.amount)
                        if (!Number.isFinite(amount) || amount === 0) return toast.error('El ajuste debe ser distinto de cero.')
                        try {
                          await adjustClientCreditsApi(u.id, {
                            amount,
                            reason: 'manual_adjustment',
                            notes: clientCreditForm.notes,
                          })
                          await refreshClientDetail(u.id)
                          setClientCreditForm({ amount: '', notes: '' })
                          toast.success('Creditos actualizados')
                        } catch (error) {
                          toast.error(error?.message ?? 'No se pudieron ajustar los creditos')
                        }
                      }}>
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}

                {/* ── CEDER CLASE ── */}
                {!useApiClients && u.paquete && (u.clasesPaquete ?? 0) > 0 && (
                  <div style={{ marginBottom: 24, padding: '16px 18px', background: 'rgba(123,30,34,0.08)', borderRadius: 10, border: '1px solid rgba(123,30,34,0.2)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', marginBottom: 12 }}>
                      Ceder clase a otro usuario
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
                      Descuenta 1 clase de <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{u.nombre}</strong> ({u.clasesPaquete} disponibles) y se la asigna al usuario seleccionado.
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <select
                        className={styles.formSelect}
                        style={{ flex: 1 }}
                        value={cederClaseUserId}
                        onChange={e => setCederClaseUserId(e.target.value)}
                      >
                        <option value="">Seleccionar beneficiario…</option>
                        {usuarios.filter(c => c.id !== u.id).map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nombre ?? c.name} {c.paquete ? `— ${c.clasesPaquete ?? 0} clases` : '(sin paquete)'}
                          </option>
                        ))}
                      </select>
                      <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ whiteSpace: 'nowrap' }}
                        disabled={!cederClaseUserId}
                        onClick={() => {
                          const beneficiario = usuarios.find(c => String(c.id) === String(cederClaseUserId))
                          if (!beneficiario) return
                          editarUsuario(u.id, { clasesPaquete: (u.clasesPaquete ?? 0) - 1 })
                          editarUsuario(beneficiario.id, { clasesPaquete: (beneficiario.clasesPaquete ?? 0) + 1 })
                          setModalVerUsuario(prev => ({ ...prev, clasesPaquete: (prev.clasesPaquete ?? 0) - 1 }))
                          setCederClaseUserId('')
                          toast.success(`✅ 1 clase cedida a ${beneficiario.nombre ?? beneficiario.name}`)
                        }}
                      >
                        Ceder 1 clase
                      </button>
                    </div>
                  </div>
                )}

                {useApiClients && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                      Movimientos recientes ({u.recentCreditMovements?.length ?? 0})
                    </div>
                    {(u.recentCreditMovements?.length ?? 0) === 0 ? (
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Sin movimientos recientes.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {u.recentCreditMovements.map((movement, index) => (
                          <div key={movement.id ?? `movement-${index}`} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, border: '1px solid var(--muted-2)', borderRadius: 8 }}>
                            <span>{movement.reason ?? 'Movimiento'}</span>
                            <strong>{movement.amount > 0 ? '+' : ''}{movement.amount}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── HISTORIAL DE RESERVAS ── */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', marginBottom: 12 }}>
                    Historial de reservas ({reservasU.length})
                  </div>
                  {reservasU.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                      Este usuario no tiene reservas registradas.
                    </div>
                  ) : (
                    <div style={{ borderRadius: 8, border: '1px solid var(--muted-2)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {['Clase', 'Fecha', 'Hora', 'Estado'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--muted-2)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedReservasModal.items.map((r, i) => (
                            <tr key={r.id} style={{ borderBottom: i < paginatedReservasModal.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                              <td style={{ padding: '9px 12px', fontSize: 13, fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.85)' }}>{r.claseNombre}</td>
                              <td style={{ padding: '9px 12px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--muted)' }}>{r.fecha || r.claseDia}</td>
                              <td style={{ padding: '9px 12px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--muted)' }}>{getClassDisplayTime(r)}</td>
                              <td style={{ padding: '9px 12px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-body)', background: r.estado === 'confirmada' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', color: r.estado === 'confirmada' ? '#4ade80' : '#f87171', border: `1px solid ${r.estado === 'confirmada' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
                                  {r.estado === 'confirmada' ? 'Confirmada' : 'Cancelada'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {reservasU.length > 0 && (
                    <PaginationControls
                      page={paginatedReservasModal.page}
                      totalPages={paginatedReservasModal.totalPages}
                      label="Historial"
                      compact
                      onPrev={() => setReservasModalPage((p) => Math.max(1, p - 1))}
                      onNext={() => setReservasModalPage((p) => Math.min(paginatedReservasModal.totalPages, p + 1))}
                    />
                  )}
                </div>

              </div>

              {/* Footer */}
              <div style={{ padding: '16px 28px', borderTop: '1px solid var(--muted-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalVerUsuario(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── GESTIONAR DISCIPLINAS ── */}
      {modalDisciplinas && (
        <div
          className={`${styles.modalOverlay} ${styles.open}`}
          onClick={(e) => { if (e.target === e.currentTarget) setModalDisciplinas(false) }}
        >
          <div className={styles.modal} style={{ maxWidth: 400 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Gestionar disciplinas</div>
              <button className={styles.modalClose} onClick={() => setModalDisciplinas(false)}>×</button>
            </div>

            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
              Estas disciplinas aparecen en los formularios de coaches. Agrega o elimina las que necesites.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {disciplinas.map((d) => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid var(--muted-2)' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{d}</span>
                  <button
                    onClick={() => eliminarDisciplina(d)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 20, lineHeight: 1, padding: '0 4px' }}
                    title="Eliminar"
                  >×</button>
                </div>
              ))}
              {disciplinas.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '16px 0', fontFamily: 'var(--font-body)' }}>
                  No hay disciplinas. Agrega una abajo.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className={styles.formInput}
                placeholder="Nueva disciplina… (ej: Pilates)"
                value={nuevaDisciplina}
                onChange={(e) => setNuevaDisciplina(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nuevaDisciplina.trim()) {
                    agregarDisciplina(nuevaDisciplina.trim())
                    setNuevaDisciplina('')
                  }
                }}
                style={{ flex: 1 }}
              />
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  if (!nuevaDisciplina.trim()) return
                  agregarDisciplina(nuevaDisciplina.trim())
                  setNuevaDisciplina('')
                }}
              >+ Agregar</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalDisciplinas(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEAT SELECTOR (admin: inscribir con asiento) ── */}
      {adminSeatSelector && (
        <SeatSelector
          cls={adminSeatSelector.cls}
          targetUserId={adminSeatSelector.userId}
          adminForce
          onSuccess={async () => {
            const u = usuarios.find(u => u.id === adminSeatSelector.userId)
            toast.success(`${u?.nombre ?? 'Alumno'} inscrito correctamente`)
            setAdminSeatSelector(null)
            setAlumnoAgregarId('')
            const occurrenceId = adminSeatSelector.cls.occurrenceId ?? adminSeatSelector.cls.occurrence_id ?? null
            if (useApiMode && occurrenceId) {
              await queryClient.invalidateQueries({ queryKey: queryKeys.occurrenceRoster.detail(occurrenceId, false) })
            }
          }}
          onClose={() => setAdminSeatSelector(null)}
        />
      )}

      {modalPago && (
        <ModalPago
          total={cartTotal}
          items={cart}
          onCerrar={() => setModalPago(false)}
          onPagar={async ({ metodoPago, montoPagado, cambio }) => {
            const resultado = await procesarVentaService({
              items:             cart,
              subtotal:          cartSubtotal,
              total:             cartTotal,
              metodoPago,
              montoPagado,
              cambio,
              pendingAsignacion,
              adminId:           null,
            })
            if (resultado.ok) {
              setModalPago(false)
              clearCart()
              toast.success(resultado.mensaje)
            } else {
              toast.error(resultado.mensaje)
            }
          }}
        />
      )}

      {/* ── MODAL GASTO ── */}
      {modalGasto && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalGasto(false)}
        >
          <div
            style={{ background: '#1E1014', borderRadius: 16, padding: 32, width: '90%', maxWidth: 400, border: '1px solid #3C2A2E' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--text-primary)', fontSize: 20, margin: '0 0 24px' }}>Registrar gasto</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>Concepto</label>
                <input type="text" placeholder="Ej. Pago de luz, Sueldo coach..." value={formGasto.concepto} onChange={e => setFormGasto(p => ({ ...p, concepto: e.target.value }))} autoFocus
                  style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>Monto ($)</label>
                <input type="number" placeholder="0" min="0" value={formGasto.monto} onChange={e => setFormGasto(p => ({ ...p, monto: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 18, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A69A93', marginBottom: 6 }}>Tipo</label>
                <select value={formGasto.tipo} onChange={e => setFormGasto(p => ({ ...p, tipo: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', background: '#2C1A1E', border: '1px solid #3C2A2E', borderRadius: 8, color: 'white', fontFamily: 'var(--font-body)', fontSize: 14, boxSizing: 'border-box' }}>
                  <option value="operativo">Operativo</option>
                  <option value="sueldo">Sueldo</option>
                  <option value="servicio">Servicio</option>
                  <option value="insumo">Insumo</option>
                  <option value="inventario">Inventario</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
              <button onClick={handleGuardarGasto}
                style={{ padding: 14, borderRadius: 8, border: 'none', background: 'var(--brand-wine)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, cursor: 'pointer' }}>
                Guardar gasto
              </button>
              <button onClick={() => setModalGasto(false)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #3C2A2E', background: 'transparent', color: '#A69A93', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
