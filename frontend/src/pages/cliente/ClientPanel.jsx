import { useState, useMemo, useEffect, useCallback } from 'react'
import PagoModal from '@/features/pagos/PagoModal'
import EquipmentReservationPanel from '@/features/reservas/EquipmentReservationPanel'
import SeatSelector from '@/features/clases/SeatSelector'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home, CalendarDays, PlusCircle, User, CreditCard, LogOut, ArrowLeft,
  MapPin, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { useReservasStore }      from '@/stores/reservasStore'
import { useClasesStore }        from '@/stores/clasesStore'
import { useUsuariosStore }      from '@/stores/usuariosStore'
import { useCoachesStore }       from '@/stores/coachesStore'
import { usePaquetesStore }      from '@/stores/paquetesStore'
import { useTransaccionesStore } from '@/stores/transaccionesStore'
import { useListaEsperaStore }   from '@/stores/listaEsperaStore'
import { useFinancialStateStore } from '@/stores/financialStateStore'
import { reservarClase, cancelarReserva } from '@/services/reservasService'
import { editarPerfilService }            from '@/services/usuariosService'
import { getPublicClassesByDate, getReservationOccurrenceDate, isPublished } from '@/services/classService'
import { clearOccurrencesInflightCache, getOccurrencesForDateRangeApi } from '@/services/occurrencesApiService'
import { logListaEsperaUnirse, logListaEsperaSalir } from '@/services/actividadService'
import { getMyCreditMovementsPaginatedApi } from '@/services/financialStateApiService'
import { getMembershipPackagesApi } from '@/services/membershipPackagesApiService'
import { getMisReservasPaginatedApi } from '@/services/reservasApiService'
import {
  hoyLocal,
  DAYS_ES, DAYS_ABBR, MONTHS_ES,
  buildWeek, weekRangeLabel, formatHour, formatFechaISO,
} from '@/utils/formatters'
import { formatClassDate, getClassDisplayDate, getClassDisplayTime, getClassTimeToken } from '@/utils/classSchedule'
import s from './ClientPanel.module.css'
import MisClasesCard from './MisClasesCard'
import ClassCard from './ClassCard'
import RecentPaymentsStatusPanel from './RecentPaymentsStatusPanel'
import { buildPerfilFormFromUser, resolvePerfilCompleto } from './profileFormUtils'
import { resolveFinancialUiState } from './financialUiUtils'
import { filterReservationsByStatus } from './reservationFilters'
import { getUpcomingReservations, UPCOMING_RESERVATIONS_LIMIT } from './upcomingReservations'
import { buildMisClasesApiFilters } from './misClasesPagination'
import { normalizeDiscipline } from '@/utils/discipline'
import PaginationControls from '@/components/ui/PaginationControls'
import { clampPage, paginateArray } from '@/utils/paginationUtils'

const AVATAR_COLORS = [
  { bg: 'var(--brand-wine-13)',  text: '#7B1E2B' },
  { bg: 'rgba(194,107,122,0.18)', text: '#b05060' },
  { bg: 'rgba(154,123,107,0.18)', text: '#7A6560' },
  { bg: 'rgba(92,16,24,0.13)',   text: '#5C1018'  },
]

function avatarStyle(name) {
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

const SECTION_META = {
  inicio:   { title: 'Inicio',             sub: 'Jueves, 24 de abril · Casa Scarlatta' },
  clases:   { title: 'Mis Clases',         sub: 'Clases reservadas'                    },
  reservar: { title: 'Reservar Clase',     sub: 'Clases disponibles esta semana'       },
  perfil:   { title: 'Mi Perfil',          sub: 'Información personal'                 },
  pagos:    { title: 'Paquetes & Pagos',   sub: 'Plan actual y transacciones'          },
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DisciplinePill({ d }) {
  return d === 'STRYDE'
    ? <span className={`${s.pill} ${s.pillStride}`}>STRYDE</span>
    : <span className={`${s.pill} ${s.pillSlow}`}>SLOW</span>
}

function StatusPill({ status }) {
  const map = {
    confirmada: s.statusConfirmada,
    cancelada:  s.statusCancelada,
    pendiente:  s.statusPendiente,
    no_asistio: s.statusCancelada,
    completada: s.statusConfirmada,
  }
  const labels = {
    confirmada: 'Confirmada',
    cancelada:  'Cancelada',
    pendiente:  'Pendiente',
    no_asistio: 'NNo asistió',
    completada: 'Completada',
  }
  return <span className={`${s.statusPill} ${map[status] ?? ''}`}>{labels[status] ?? status}</span>
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Mapea una reserva al shape interno usado por MisClasesCard / ClassCard
function toClsShape(r) {
  const timeToken = getClassTimeToken(r)
  const displayDate = formatClassDate(getClassDisplayDate({
    classDate: r.classDate ?? r.class_date ?? r.fecha ?? null,
    occurrenceDate: r.occurrenceDate ?? r.occurrence_date ?? r.fecha ?? null,
    classStartAt: r.classStartAt ?? r.class_start_at ?? null,
    startAt: r.startAt ?? r.start_at ?? null,
    fecha: r.fecha ?? null,
  }))
  return {
    id:         r.id,
    title:      r.claseNombre,
    coach:      r.coachNombre,
    date:       r.claseDia,
    claseFecha: r.fecha,
    displayDate,
    time:       timeToken ?? r.claseHora ?? null,
    displayTime: getClassDisplayTime(r),
    discipline: normalizeDiscipline(r.discipline ?? r.classDiscipline ?? r.tipo) === 'slow' ? 'SLOW' : normalizeDiscipline(r.discipline ?? r.classDiscipline ?? r.tipo) === 'stryde' ? 'STRYDE' : null,
    status:     r.estado,
    location:   '',
  }
}

const MIS_CLASES_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'cancelada', label: 'Canceladas' },
  { value: 'completada', label: 'Completadas' },
  { value: 'no_asistio', label: 'No asistió' },
]

export default function ClientPanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario, logout } = useAuth()

  // â”€â”€ Stores â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { reservas, loadMisReservasFromApi } = useReservasStore()
  const { clases, loadClasesFromApi }   = useClasesStore()
  const { usuarios } = useUsuariosStore()
  const { coaches }   = useCoachesStore()
  const { paquetes }  = usePaquetesStore()
  const { getTransaccionesByUsuario } = useTransaccionesStore()
  const listaEsperaStore = useListaEsperaStore()
  const {
    financialState,
    creditsBalance,
    activeMembership,
    creditMovements,
    transactions,
    isLoading: isFinancialStateLoading,
    error: financialStateError,
    loadFinancialState,
  } = useFinancialStateStore()

  const useApiAuth = import.meta.env.VITE_USE_API_AUTH === 'true'
  const useApiClasses = import.meta.env.VITE_USE_API_CLASSES === 'true'
  const useApiReservations = import.meta.env.VITE_USE_API_RESERVATIONS === 'true'
  const useApiWaitlist = import.meta.env.VITE_USE_API_WAITLIST === 'true'
  const useApiFinancialState = useApiAuth && useApiReservations
  const [apiMembershipPackages, setApiMembershipPackages] = useState([])
  const [isMembershipPackagesLoading, setIsMembershipPackagesLoading] = useState(false)
  const [membershipPackagesError, setMembershipPackagesError] = useState('')
  const sectionQuery = new URLSearchParams(location.search).get('section')
  const packageIdQuery = new URLSearchParams(location.search).get('packageId')

  const historialPagos = useApiFinancialState
    ? (transactions ?? [])
    : (usuario?.id ? getTransaccionesByUsuario(usuario.id) : [])
  const historialMovimientosCredito = useApiFinancialState ? (creditMovements ?? []) : []
  const paquetesDisponibles = useApiFinancialState ? apiMembershipPackages : paquetes

  // Mapa nombre â†’ foto para todos los componentes de esta pÃ¡gina
  const coachFotoByName = useMemo(
    () => Object.fromEntries(coaches.map((c) => [c.nombre, c.foto]).filter(([, f]) => f)),
    [coaches]
  )

  // â”€â”€ Secciones UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [activeSection, setActiveSection] = useState(sectionQuery === 'pagos' ? 'pagos' : 'inicio')
  const [weekOff,    setWeekOff]    = useState(0)
  const [dayIdx,     setDayIdx]     = useState(0)
  const [resWeekOff, setResWeekOff] = useState(0)
  const [resDayIdx,  setResDayIdx]  = useState(0)
  const [misClasesStatusFilter, setMisClasesStatusFilter] = useState('all')
  const [pagoModal, setPagoModal] = useState(null)
  const [seatSelectorClass, setSeatSelectorClass] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [occurrencesByClass, setOccurrencesByClass] = useState({})
  const [financialHistoryPage, setFinancialHistoryPage] = useState(1)
  const [financialRefreshTick, setFinancialRefreshTick] = useState(0)
  const [misClasesPage, setMisClasesPage] = useState(1)
  const [misClasesPageState, setMisClasesPageState] = useState({
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    isLoading: false,
    error: null,
  })
  const [apiCreditMovementsPage, setApiCreditMovementsPage] = useState({
    items: [],
    page: 1,
    pageSize: 8,
    total: 0,
    totalPages: 1,
    isLoading: false,
    error: null,
  })
  const weekDays = useMemo(() => buildWeek(weekOff), [weekOff])
  const resWeekDays = useMemo(() => buildWeek(resWeekOff), [resWeekOff])
  const [selectedPackageId, setSelectedPackageId] = useState(packageIdQuery ?? null)
  const requestFinancialRefresh = useCallback(() => {
    setFinancialRefreshTick((tick) => tick + 1)
  }, [])
  const apiClassIdsSignature = useMemo(
    () => clases
      .map((c) => c?.id)
      .filter((id) => id !== null && id !== undefined)
      .map((id) => String(id))
      .filter((id, index, array) => array.indexOf(id) === index)
      .sort()
      .join('|'),
    [clases]
  )

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isSidebarOpen])

  useEffect(() => {
    if (!useApiClasses) return
    loadClasesFromApi().catch((err) => {
      if (import.meta.env.DEV) {
        console.error('[ClientPanel] No se pudo cargar clases API, fallback cache/store', err)
      }
    })
  }, [loadClasesFromApi, useApiClasses])

  useEffect(() => {
    if (!useApiReservations) return
    loadMisReservasFromApi().catch((err) => {
      if (import.meta.env.DEV) {
        console.error('[ClientPanel] No se pudo cargar reservas API, fallback cache/store', err)
      }
    })
  }, [loadMisReservasFromApi, useApiReservations])

  useEffect(() => {
    if (!useApiFinancialState || usuario?.rol !== 'cliente') return
    loadFinancialState({ enabled: true, force: financialRefreshTick > 0 }).catch((err) => {
      if (import.meta.env.DEV) {
        console.error('[ClientPanel] No se pudo cargar estado financiero API', err)
      }
    })
  }, [financialRefreshTick, loadFinancialState, useApiFinancialState, usuario?.rol])

  useEffect(() => {
    if (!useApiFinancialState || activeSection !== 'pagos') return
    let active = true
    setIsMembershipPackagesLoading(true)
    setMembershipPackagesError('')
    getMembershipPackagesApi()
      .then((items) => {
        if (!active) return
        setApiMembershipPackages(items)
        setIsMembershipPackagesLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setApiMembershipPackages([])
        setMembershipPackagesError(err.message || 'No se pudo cargar catálogo de paquetes')
        setIsMembershipPackagesLoading(false)
      })
    return () => { active = false }
  }, [activeSection, useApiFinancialState])

  useEffect(() => {
    if (!sectionQuery) return
    if (sectionQuery === 'pagos' && activeSection !== 'pagos') {
      setActiveSection('pagos')
    }
  }, [activeSection, sectionQuery])

  useEffect(() => {
    setSelectedPackageId(packageIdQuery ?? null)
  }, [packageIdQuery])

  useEffect(() => {
    if (!useApiClasses || !clases.length) return
    const from = resWeekDays[0]?.isoDate
    const to = resWeekDays[resWeekDays.length - 1]?.isoDate
    if (!from || !to) return
    const controller = new AbortController()
    let active = true
    const classIds = Array.from(new Set(clases.map((c) => c.id)))
    getOccurrencesForDateRangeApi(classIds, { from, to, signal: controller.signal })
      .then((data) => {
        if (active) setOccurrencesByClass(data)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        if (active) setOccurrencesByClass({})
      })
    return () => {
      active = false
      controller.abort()
      clearOccurrencesInflightCache()
    }
  }, [apiClassIdsSignature, resWeekDays[0]?.isoDate, resWeekDays[resWeekDays.length - 1]?.isoDate, useApiClasses])

  // â”€â”€ Datos del usuario â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const userName = usuario?.nombre ?? 'Cliente'
  const userInitial = userName.charAt(0).toUpperCase()
  const financialUiState = useMemo(() => resolveFinancialUiState({
    useApiFinancialState,
    financialState,
    activeMembership,
    creditsBalance,
    isFinancialStateLoading,
    financialStateError,
    usuario,
  }), [
    useApiFinancialState,
    financialState,
    activeMembership,
    creditsBalance,
    isFinancialStateLoading,
    financialStateError,
    usuario,
  ])
  const planNombre = financialUiState.planNombre
  const clasesTotal = financialUiState.clasesTotal
  const selectedPackage = useMemo(
    () => paquetesDisponibles.find((p) => String(p.id) === String(selectedPackageId)) ?? null,
    [paquetesDisponibles, selectedPackageId]
  )

  // Perfil completo desde el store (incluye campos que authStore no persiste)
  const perfilCompleto  = useMemo(
    () => resolvePerfilCompleto({ useApiAuth, usuario, usuarios }),
    [useApiAuth, usuario, usuarios]
  )

  // Estado del formulario de perfil
  const [perfilForm, setPerfilForm] = useState(null)   // se inicializa al abrir la secciÃ³n
  const [isPerfilDirty, setIsPerfilDirty] = useState(false)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)

  function initPerfilForm() {
    if (!perfilCompleto) return
    setPerfilForm(buildPerfilFormFromUser(perfilCompleto))
    setIsPerfilDirty(false)
  }

  useEffect(() => {
    if (!perfilCompleto) return
    if (isPerfilDirty && perfilForm) return
    setPerfilForm(buildPerfilFormFromUser(perfilCompleto))
  }, [isPerfilDirty, perfilCompleto])

  async function handleGuardarPerfil(e) {
    e.preventDefault()
    if (!perfilForm || !usuario?.id) return
    setGuardandoPerfil(true)
    const nombre = [perfilFormSafe.nombre, perfilFormSafe.apellido].filter(Boolean).join(' ')
    const resultado = await editarPerfilService(usuario.id, {
      nombre,
      telefono:        perfilFormSafe.telefono,
      genero:          perfilFormSafe.genero,
      fechaNacimiento: perfilFormSafe.fechaNacimiento,
    })
    if (resultado.ok) toast.success(resultado.mensaje)
    else toast.error(resultado.mensaje)
    if (resultado.ok) setIsPerfilDirty(false)
    setGuardandoPerfil(false)
  }
  const clasesRestantes = financialUiState.clasesRestantes
  const clasesUsadas = financialUiState.clasesUsadas

  const meta = SECTION_META[activeSection]

  function goTo(section) { setActiveSection(section) }
  function goToMisClasesConfirmadas() {
    setMisClasesStatusFilter('confirmada')
    setActiveSection('clases')
  }
  function goToAndClose(section) {
    setActiveSection(section)
    setIsSidebarOpen(false)
  }

  // â”€â”€ Reservas del usuario â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const reservasUsuario = usuario?.id
    ? reservas.filter((r) => r.userId === usuario.id)
    : []
  const reservasUsuarioFiltradas = useMemo(
    () => filterReservationsByStatus(reservasUsuario, misClasesStatusFilter),
    [misClasesStatusFilter, reservasUsuario]
  )
  const reservasMisClasesSource = useApiReservations ? (misClasesPageState.items ?? []) : reservasUsuarioFiltradas
  const financialHistoryPageSize = 8
  const sortedHistorialPagos = useMemo(
    () => [...historialPagos].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? '')),
    [historialPagos]
  )
  const financialHistorySource = useApiFinancialState ? (apiCreditMovementsPage.items ?? []) : sortedHistorialPagos
  const paginatedFinancialHistory = useMemo(
    () => useApiFinancialState
      ? {
          items: apiCreditMovementsPage.items ?? [],
          page: apiCreditMovementsPage.page ?? financialHistoryPage,
          totalPages: apiCreditMovementsPage.totalPages ?? 1,
          totalItems: apiCreditMovementsPage.total ?? (apiCreditMovementsPage.items?.length ?? 0),
        }
      : paginateArray(financialHistorySource, { page: financialHistoryPage, pageSize: financialHistoryPageSize }),
    [apiCreditMovementsPage, financialHistoryPage, financialHistorySource, useApiFinancialState]
  )
  const normalizedFinancialHistoryPage = clampPage(financialHistoryPage, paginatedFinancialHistory.totalPages)

  useEffect(() => {
    if (financialHistoryPage !== normalizedFinancialHistoryPage) {
      setFinancialHistoryPage(normalizedFinancialHistoryPage)
    }
  }, [financialHistoryPage, normalizedFinancialHistoryPage])

  useEffect(() => {
    setFinancialHistoryPage(1)
  }, [useApiFinancialState, historialMovimientosCredito.length, historialPagos.length])

  useEffect(() => {
    setMisClasesPage(1)
  }, [misClasesStatusFilter, weekOff])

  useEffect(() => {
    if (!useApiReservations || activeSection !== 'clases' || !usuario?.id) return
    const { status, from, to } = buildMisClasesApiFilters(misClasesStatusFilter, weekDays)
    if (!from || !to) return
    let active = true
    setMisClasesPageState((prev) => ({ ...prev, isLoading: true, error: null }))
    getMisReservasPaginatedApi({ page: misClasesPage, pageSize: 10, status, from, to })
      .then((result) => {
        if (!active) return
        const totalPages = Math.max(1, Math.ceil((result.total ?? 0) / (result.pageSize || 10)))
        setMisClasesPageState({
          items: result.items ?? [],
          page: result.page ?? misClasesPage,
          pageSize: result.pageSize ?? 10,
          total: result.total ?? 0,
          totalPages,
          isLoading: false,
          error: null,
        })
      })
      .catch((err) => {
        if (!active) return
        setMisClasesPageState((prev) => ({
          ...prev,
          isLoading: false,
          error: err?.message ?? 'No se pudo cargar Mis clases',
        }))
      })
    return () => { active = false }
  }, [activeSection, misClasesPage, misClasesStatusFilter, useApiReservations, usuario?.id, weekDays])

  useEffect(() => {
    if (!useApiFinancialState || usuario?.rol !== 'cliente') return
    let active = true
    setApiCreditMovementsPage((prev) => ({ ...prev, isLoading: true, error: null }))
    getMyCreditMovementsPaginatedApi({ page: financialHistoryPage, pageSize: financialHistoryPageSize })
      .then((result) => {
        if (!active) return
        const totalPages = Math.max(1, Math.ceil((result.total ?? 0) / (result.pageSize || financialHistoryPageSize)))
        setApiCreditMovementsPage({
          items: result.items ?? [],
          page: result.page ?? financialHistoryPage,
          pageSize: result.pageSize ?? financialHistoryPageSize,
          total: result.total ?? 0,
          totalPages,
          isLoading: false,
          error: null,
        })
      })
      .catch((err) => {
        if (!active) return
        setApiCreditMovementsPage((prev) => ({
          ...prev,
          isLoading: false,
          error: err?.message ?? 'No se pudieron cargar movimientos',
        }))
      })
    return () => { active = false }
  }, [financialHistoryPage, financialHistoryPageSize, financialRefreshTick, useApiFinancialState, usuario?.rol])

  const now   = new Date()
  const today = hoyLocal()

  // Dynamic date string for header/hero (e.g. "Miércoles, 13 de mayo")
  const fechaHoyStr = `${DAYS_ES[now.getDay()]}, ${now.getDate()} de ${MONTHS_ES[now.getMonth()].toLowerCase()}`

  // Returns the real ISO date of a recurring class based on its day-of-week,
  // so corrupted r.fecha (UTC offset bug) doesn't make a past class look future.
  function realClassDate(r) {
    const clase = clases.find(c => c.id === r.claseId)
    if (clase?.fecha) return clase.fecha          // specific-date class â†’ trust it
    if (!clase?.dia)  return r.fecha ?? today      // no weekday info â†’ fallback
    const targetIdx = DAYS_ES.indexOf(clase.dia)
    if (targetIdx < 0) return r.fecha ?? today
    const diff = targetIdx - now.getDay()
    const d = new Date(now)
    d.setDate(now.getDate() + diff)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  const upcomingResult = getUpcomingReservations(reservasUsuario, {
    useApiReservations,
    now,
    limit: UPCOMING_RESERVATIONS_LIMIT,
    getOccurrenceDate: (r) => getReservationOccurrenceDate(r),
    getLocalDate: (r) => realClassDate(r),
    getLocalHour: (r) => r.claseHora ?? clases.find(c => c.id === r.claseId)?.hora ?? null,
  })
  const upcomingReservas = upcomingResult.items
  const totalUpcomingReservas = upcomingResult.total

  const upcoming = upcomingReservas.map(r => {
    const cls = toClsShape(r)
    cls.claseFecha = useApiReservations ? (getReservationOccurrenceDate(r) ?? null) : realClassDate(r)
    cls.displayDate = formatClassDate(getClassDisplayDate({
      classDate: cls.claseFecha,
      occurrenceDate: cls.claseFecha,
      fecha: cls.claseFecha,
    }))
    return cls
  })
  const nextClass = upcoming[0] ?? null
  const reservasSinFechaSesion = useApiReservations
    ? reservasUsuario.filter((r) => r.estado === 'confirmada' && !getReservationOccurrenceDate(r))
    : []

  // Métricas reales para el dashboard
  const confirmadas   = reservasUsuario.filter((r) => r.estado === 'confirmada').length
  const canceladas    = reservasUsuario.filter((r) => r.estado === 'cancelada').length
  const noAsistio     = reservasUsuario.filter((r) => r.estado === 'no_asistio').length
  const clamasTomadas = reservasUsuario.filter(
    (r) => r.estado === 'completada' || r.estado === 'no_asistio'
  ).length

  // Métricas de progreso mensual
  // [BACKEND] -> GET /api/usuarios/:id/progreso?mes=YYYY-MM
  // Cuando haya backend: reemplazar este bloque por una llamada HTTP
  // y mostrar los datos del servidor directamente.

  const mesActual = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const getReservationDiscipline = (item) => normalizeDiscipline(
    item?.discipline ?? item?.classDiscipline ?? item?.tipo ?? item?._raw?.discipline
  )

  const esMesActual = (r) => {
    if (r.fecha) return r.fecha.startsWith(mesActual)
    // Clases recurrentes (sin fecha) se consideran del mes actual si están confirmadas
    return true
  }

  const clasesTomadasEsteMes = reservasUsuario.filter(r => {
    if (r.estado !== 'completada' && r.estado !== 'confirmada') return false
    return esMesActual(r)
  }).length

  const strideEsteMes = reservasUsuario.filter(r => {
    if (r.estado !== 'completada' && r.estado !== 'confirmada') return false
    return esMesActual(r) && getReservationDiscipline(r) !== 'slow'
  }).length

  const slowEsteMes = reservasUsuario.filter(r => {
    if (r.estado !== 'completada' && r.estado !== 'confirmada') return false
    const fechaR = r.fecha ?? ''
    return fechaR.startsWith(mesActual) && getReservationDiscipline(r) === 'slow'
  }).length

  // [BACKEND] â†’ Este valor deberÃ­a venir del perfil del usuario
  // como usuario.metaMensual o del paquete activo.
  const metaMensual = clasesTotal > 0 && (useApiFinancialState || usuario?.clasesPaquete !== 999)
    ? clasesTotal
    : 20

  const pctProgreso = metaMensual > 0
    ? Math.min(100, Math.round((clasesTomadasEsteMes / metaMensual) * 100))
    : 0

  const pctPaquete = clasesTotal > 0 && (useApiFinancialState || usuario?.clasesPaquete !== 999)
    ? Math.min(100, Math.round((clasesUsadas / clasesTotal) * 100))
    : 0

  const getDayAvail = (day) => {
    if (useApiClasses) {
      const sessions = []
      for (const c of clases.filter(isPublished)) {
        const occs = occurrencesByClass?.[c.id] ?? []
        for (const occ of occs) {
          if (occ.fecha !== day.isoDate) continue
          const occurrenceTime = getClassTimeToken(occ) ?? getClassTimeToken(c) ?? null
          sessions.push({
            _raw: { ...c, occurrenceId: occ.occurrenceId, fecha: occ.fecha, hora: occurrenceTime ?? c.hora ?? null },
            id: c.id,
            occurrenceId: occ.occurrenceId,
            title: occ.claseNombre ?? c.nombre,
            coach: c.coachNombre,
            date: c.dia,
            fecha: occ.fecha,
            time: occurrenceTime ?? c.hora ?? null,
            displayTime: getClassDisplayTime(occ),
            discipline: getReservationDiscipline(c) === 'slow' ? 'SLOW' : getReservationDiscipline(c) === 'stryde' ? 'STRYDE' : null,
            spots: Math.max(0, (occ.cupoMax ?? c.cupoMax) - (occ.cupoActual ?? c.cupoActual)),
            capacity: occ.cupoMax ?? c.cupoMax,
          })
        }
      }
      const seenKeys = new Set()
      return sessions.filter((session, index) => {
        const key = `${session.occurrenceId ?? session.id}:${session.fecha ?? ''}:${session.time ?? ''}:${index}`
        if (seenKeys.has(key)) return false
        seenKeys.add(key)
        return true
      })
    }
    return getPublicClassesByDate(clases.filter(isPublished), new Date(`${day.isoDate}T00:00:00`)).map((c) => ({
      _raw:       c,
      id:         c.id,
      occurrenceId: c.occurrenceId ?? null,
      title:      c.nombre,
      coach:      c.coachNombre,
      date:       c.dia,
      fecha:      c.fecha ?? null,
      time:       getClassTimeToken(c) ?? c.hora ?? null,
      displayTime: getClassDisplayTime(c),
      discipline: getReservationDiscipline(c) === 'slow' ? 'SLOW' : getReservationDiscipline(c) === 'stryde' ? 'STRYDE' : null,
      spots:      Math.max(0, c.cupoMax - c.cupoActual),
      capacity:   c.cupoMax,
    }))
  }

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleCancelReserva(reservaId) {
    const resultado = await cancelarReserva(reservaId, usuario.id)
    if (resultado.ok) toast.success('Reserva cancelada. Te enviamos confirmación por correo 📧')
    else toast.error(resultado.error)
    if (resultado.ok && useApiReservations && activeSection === 'clases') {
      const { status, from, to } = buildMisClasesApiFilters(misClasesStatusFilter, weekDays)
      try {
        const result = await getMisReservasPaginatedApi({ page: misClasesPage, pageSize: 10, status, from, to })
        const totalPages = Math.max(1, Math.ceil((result.total ?? 0) / (result.pageSize || 10)))
        const safePage = Math.min(misClasesPage, totalPages)
        if (safePage !== misClasesPage) {
          setMisClasesPage(safePage)
          return
        }
        setMisClasesPageState({
          items: result.items ?? [],
          page: result.page ?? misClasesPage,
          pageSize: result.pageSize ?? 10,
          total: result.total ?? 0,
          totalPages,
          isLoading: false,
          error: null,
        })
      } catch {
        // noop: mantener estado local y toast ya mostrado
      }
    }
  }

  async function handleReserveClass(av) {
    if (!usuario?.id) return
    const resultado = await reservarClase(usuario.id, av.id, null, av.occurrenceId ?? av._raw?.occurrenceId ?? null)
    if (!resultado.ok) {
      toast.error(resultado.error)
      return
    }
    toast.success('Tu reserva quedó confirmada. Revisa tu correo con los detalles 📧')
    goTo('clases')
  }

  async function handleUnirseListaEspera(av) {
    if (!usuario?.id) return
    const resultado = await listaEsperaStore.unirse({
      claseId: av.id,
      occurrenceId: av.occurrenceId ?? av._raw?.occurrenceId ?? null,
      userId:  usuario.id,
      nombre:  userName,
    })
    if (!resultado.ok) {
      toast.error(resultado.error)
      return
    }
    const posicion = listaEsperaStore.getPosicion(av.occurrenceId ?? av._raw?.occurrenceId ?? av.id, usuario.id)
    toast.success(
      `¡Estás en la lista de espera! Posición #${posicion}. ` +
      `Te enviaremos un correo si se libera un lugar.`,
      { duration: 5000 }
    )
    logListaEsperaUnirse({
      usuarioNombre: userName,
      usuarioId:     usuario.id,
      claseNombre:   av.title,
      posicion,
    })
    // [BACKEND] â†’ POST /api/email/send { plantilla: 'lista_espera_unirse' }
    const uData = usuarios.find(u => u.id === usuario?.id)
    if (uData?.email) {
      import('@/services/emailService').then(({ emailListaEsperaUnirse }) => {
        emailListaEsperaUnirse({
          nombre:      userName,
          email:       uData.email,
          claseNombre: av.title,
          posicion,
          dia:         av.date,
          hora:        av.time,
        }).catch(() => {})
      })
    }
  }

  async function handleSalirListaEspera(av) {
    const resultado = await listaEsperaStore.salir({
      claseId: av.id,
      occurrenceId: av.occurrenceId ?? av._raw?.occurrenceId ?? null,
      userId: usuario.id,
    })
    if (!resultado?.ok) {
      toast.error(resultado?.error || 'No se pudo salir de lista de espera')
      return
    }
    toast('Saliste de la lista de espera', { icon: 'â†©ï¸' })
    logListaEsperaSalir({
      usuarioNombre: userName,
      usuarioId:     usuario.id,
      claseNombre:   av.title,
    })
  }

  const navGroups = [
    {
      label: 'Principal',
      links: [
        { key: 'inicio',   icon: Home,        label: 'Inicio'        },
        { key: 'clases',   icon: CalendarDays, label: 'Mis Clases', badge: upcoming.length },
        { key: 'reservar', icon: PlusCircle,   label: 'Reservar Clase' },
      ],
    },
    {
      label: 'Cuenta',
      links: [
        { key: 'perfil', icon: User,       label: 'Mi Perfil'        },
        { key: 'pagos',  icon: CreditCard, label: 'Paquetes & Pagos' },
      ],
    },
  ]

  return (
    <div className={s.root}>
      {isSidebarOpen && (
        <div className={s.sidebarBackdrop} onClick={() => setIsSidebarOpen(false)} />
      )}
      {/* â”€â”€ SIDEBAR â”€â”€ */}
      <aside className={`${s.sidebar} ${isSidebarOpen ? s.sidebarOpen : ''}`}>
        <div className={s.sidebarLogo}>
          <span className={s.brandTag}>casa</span>
          <span className={s.brandName}>Scarlatta</span>
          <span className={s.clientPill}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4"/></svg>
            Mi Portal
          </span>
        </div>

        {navGroups.map(group => (
          <nav key={group.label} className={s.navGroup}>
            <div className={s.navGroupLabel}>{group.label}</div>
            {group.links.map(({ key, icon: Icon, label, badge }) => (
              <button
                key={key}
                className={`${s.navLink} ${activeSection === key ? s.active : ''}`}
                onClick={() => goToAndClose(key)}
              >
                <span className={s.navIcon}><Icon size={16} strokeWidth={1.8} /></span>
                {label}
                {badge > 0 && <span className={s.navBadge}>{badge}</span>}
              </button>
            ))}
          </nav>
        ))}

        <div className={s.sidebarFooter}>
          <button className={s.logoutLink} onClick={() => { logout(); setIsSidebarOpen(false); navigate('/') }}>
            <LogOut size={14} strokeWidth={2} />
            Cerrar sesión
          </button>
          <button className={s.backBtn} onClick={() => { setIsSidebarOpen(false); navigate('/') }}>
            <ArrowLeft size={13} /> Volver al sitio
          </button>
        </div>
      </aside>

      {/* â”€â”€ MAIN â”€â”€ */}
      <main className={s.main}>
        {/* TOPBAR */}
        <div className={s.topbar}>
          <button
            className={s.mobileMenuBtn}
            onClick={() => setIsSidebarOpen((v) => !v)}
            aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div>
            <div className={s.topbarTitle}>{meta.title}</div>
            <div className={s.topbarSub}>{activeSection === 'inicio' ? `${fechaHoyStr} · Casa Scarlatta` : meta.sub}</div>
          </div>
          <div className={s.topbarRight}>
            <div className={s.topbarProfile}>
              <div>
                <div className={s.topbarName}>{userName}</div>
                <div className={s.topbarPlan}>Paquete {planNombre} · {clasesRestantes} clases</div>
              </div>
              <div className={s.topbarAvatar}>{userInitial}</div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className={s.content}>

          {/* â•â•â• INICIO â•â•â• */}
          <div className={`${s.section} ${activeSection === 'inicio' ? s.active : ''}`}>
            {/* Hero */}
            <div className={s.heroCard}>
              <div className={s.heroLeft}>
                <div className={s.heroGreeting}>Hola, {userName.split(' ')[0]} 👋</div>
                <div className={s.heroSub}>Bienvenido de vuelta a tu espacio · {fechaHoyStr}</div>
                {nextClass && (
                  <div className={s.heroNext}>
                    <div>
                      <div className={s.heroNextLabel}>Próxima clase</div>
                      <div className={s.heroNextClass}>{nextClass.title}</div>
                      <div className={s.heroNextMeta}>{nextClass.coach} · {nextClass.location || 'Sala Principal'}</div>
                    </div>
                    <div className={s.heroNextDivider} />
                    <div>
                      <div className={s.heroNextTime}>{formatHour(nextClass.time ?? nextClass.displayTime)}</div>
                      <div className={s.heroNextDay}>{nextClass.displayDate ?? nextClass.date}</div>
                    </div>
                  </div>
                )}
                <button className={s.btnHero} onClick={() => goTo('clases')}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                  Ver clase
                </button>
              </div>
              <div className={s.heroRight}>
                <div className={s.classesRemainingRing}>
                  <div className={s.ringNum}>{clasesRestantes}</div>
                  <div className={s.ringLabel}>clases disponibles</div>
                </div>
              </div>
            </div>

            {/* Banner créditos bajos */}
            {typeof clasesRestantes === 'number' && clasesRestantes <= 2 && (
              <div style={{
                background: 'var(--brand-wine-08)', border: '1px solid var(--brand-wine-22)',
                borderRadius: 12, padding: '10px 16px', marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--wine)',
              }}>
                <span>⚠️ Solo te quedan <strong>{clasesRestantes}</strong> crédito{clasesRestantes !== 1 ? 's' : ''}. ¡Renueva tu paquete pronto!</span>
                <button
                  onClick={() => goTo('pagos')}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                    padding: '6px 14px', borderRadius: 20, border: '1.5px solid var(--wine)',
                    background: 'transparent', color: 'var(--wine)', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  Renovar
                </button>
              </div>
            )}

            {/* Stats */}
            <div className={s.statsGrid}>
              <div className={`${s.statCard} ${s.wine}`}>
                <div className={`${s.statIcon} ${s.wine}`}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div className={s.statLabel}>Clases disponibles</div>
                <div className={s.statValue}>{clasesRestantes}</div>
                <div className={s.statSub}>Paquete {planNombre}</div>
              </div>
              <div className={`${s.statCard} ${s.green}`}>
                <div className={`${s.statIcon} ${s.green}`}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className={s.statLabel}>Confirmadas</div>
                <div className={s.statValue}>{confirmadas}</div>
                <div className={s.statSub}>Activas</div>
              </div>
              <div className={`${s.statCard} ${s.amber}`}>
                <div className={`${s.statIcon} ${s.amber}`}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div className={s.statLabel}>Canceladas</div>
                <div className={s.statValue}>{canceladas}</div>
                <div className={s.statSub}>Historial</div>
              </div>
              <div className={`${s.statCard} ${s.muted}`}>
                <div className={`${s.statIcon} ${s.muted}`}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                </div>
                <div className={s.statLabel}>No asistió</div>
                <div className={s.statValue}>{noAsistio}</div>
                <div className={s.statSub}>Historial</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className={s.actionRow}>
              <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => goTo('reservar')}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Reservar clase
              </button>
              <button className={`${s.btn} ${s.btnOutline}`} onClick={() => goTo('clases')}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Ver mis clases
              </button>
              <button className={`${s.btn} ${s.btnSoft}`} onClick={() => goTo('pagos')}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                Renovar paquete
              </button>
            </div>

            {/* Bottom 2-col */}
            <div className={s.grid2}>
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <div>
                    <div className={s.cardTitle}>Mis próximas clases</div>
                    <div className={s.cardSubtitle}>Esta semana</div>
                  </div>
                  <span className={`${s.pill} ${s.pillStride}`} style={{ alignSelf: 'center' }}>{upcoming.length} reservadas</span>
                </div>
                <div className={s.cardBody}>
                  {totalUpcomingReservas > UPCOMING_RESERVATIONS_LIMIT && (
                    <div className={s.cardSubtitle} style={{ marginBottom: 10 }}>
                      Mostrando {UPCOMING_RESERVATIONS_LIMIT} de {totalUpcomingReservas} próximas clases.
                    </div>
                  )}
                  {upcoming.length > 0 ? upcoming.map(c => (
                    <ClassCard key={`${c.id}-${c.claseFecha ?? 'sin-fecha'}-${c.time ?? 'sin-hora'}`} cls={c} showCancel={false} coachFoto={coachFotoByName[c.coach] || null} />
                  )) : (
                    <div className={s.empty}>
                      <div className={s.emptyIcon}>📅</div>
                      <div className={s.emptyText}>No tienes próximas clases reservadas.</div>
                    </div>
                  )}
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" className={`${s.btn} ${s.btnSm} ${s.btnOutline}`} onClick={goToMisClasesConfirmadas}>
                      Ver todas
                    </button>
                  </div>
                </div>
              </div>

              <div className={s.card}>
                <div className={s.cardHeader}>
                  <div className={s.cardTitle}>Mi progreso</div>
                  <div className={s.cardSubtitle}>{MONTHS_ES[new Date().getMonth()]} {new Date().getFullYear()}</div>
                </div>
                <div className={s.cardBody}>
                  {/* Clases completadas este mes */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{
                      fontSize: 12, color: 'var(--muted)', marginBottom: 10,
                      fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>
                      Clases este mes
                    </div>
                    <div className={s.progressWrap}>
                      <div className={s.progressLabel}>
                        <span>
                          {clasesTomadasEsteMes} de {metaMensual}{' '}
                          <strong>meta mensual</strong>
                        </span>
                        <strong>{pctProgreso}%</strong>
                      </div>
                      <div className={s.progressBar}>
                        <div className={s.progressFill} style={{ width: `${pctProgreso}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Paquete utilizado */}
                  {usuario?.clasesPaquete !== 999 && clasesTotal > 0 && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{
                        fontSize: 12, color: 'var(--muted)', marginBottom: 10,
                        fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        Paquete utilizado
                      </div>
                      <div className={s.progressWrap}>
                        <div className={s.progressLabel}>
                          <span>
                            {clasesUsadas} de {clasesTotal}{' '}
                            <strong>clases usadas</strong>
                          </span>
                          <strong>{pctPaquete}%</strong>
                        </div>
                        <div className={s.progressBar}>
                          <div className={s.progressFill} style={{ width: `${pctPaquete}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Desglose por disciplina */}
                  <div className={s.miniGrid}>
                    <div className={s.miniGridItem}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: 26,
                        fontWeight: 600, color: 'var(--wine)',
                      }}>
                        {strideEsteMes}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>STRYDE</div>
                    </div>
                    <div className={s.miniGridItem}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: 26,
                        fontWeight: 600, color: '#2464B4',
                      }}>
                        {slowEsteMes}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>SLOW</div>
                    </div>
                    <div className={s.miniGridItem}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: 26,
                        fontWeight: 600, color: 'var(--ink)',
                      }}>
                        {clasesTomadasEsteMes}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* â•â•â• MIS CLASES â•â•â• */}
          <div className={`${s.section} ${activeSection === 'clases' ? s.active : ''}`}>
	            <div className={s.clasesTopRow}>
	              <div>
	                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontStyle: 'italic', fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>Mis Clases</h1>
	                <p style={{ fontSize: 13, color: 'var(--muted)' }}>
	                  {misClasesStatusFilter === 'all'
	                    ? `${useApiReservations ? (misClasesPageState.total ?? 0) : reservasUsuario.filter(r => r.estado !== 'cancelada').length} clases reservadas en total`
	                    : `${useApiReservations ? (misClasesPageState.total ?? 0) : reservasUsuarioFiltradas.length} clases en este estado`}
	                </p>
	              </div>
	              <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => goTo('reservar')}>
	                + Reservar clase
	              </button>
	            </div>
	            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
	              {MIS_CLASES_FILTERS.map((opt) => (
	                <button
	                  key={opt.value}
	                  type="button"
	                  onClick={() => setMisClasesStatusFilter(opt.value)}
	                  className={`${s.pill} ${misClasesStatusFilter === opt.value ? s.pillStride : s.pillSlow}`}
	                  style={{ cursor: 'pointer' }}
	                >
	                  {opt.label}
	                </button>
	              ))}
	            </div>

            {/* Day nav row */}
            <div className={s.dayNavRow}>
              <button
                className={`${s.dayNavBtn} ${weekOff === 0 ? s.dayNavBtnOff : ''}`}
                onClick={() => { setWeekOff(w => Math.max(0, w - 1)); setDayIdx(0) }}
                disabled={weekOff === 0}
              ><ChevronLeft size={18} /></button>
              <div className={s.dayTabs}>
                {weekDays.map((day, i) => {
	                  const hasCls = reservasMisClasesSource.some((r) => {
	                    if (!useApiReservations) return (r.fecha ? r.fecha === day.isoDate : r.claseDia === day.fullName)
	                    const occurrenceDate = getReservationOccurrenceDate(r)
	                    if (!occurrenceDate) return false
	                    return occurrenceDate === day.isoDate
                  })
                  return (
                    <button
                      key={i}
                      className={`${s.dayTab} ${dayIdx === i ? s.dayTabActive : ''}`}
                      onClick={() => setDayIdx(i)}
                    >
                      <span className={s.dayTabAbbr}>{day.abbr}</span>
                      <span className={s.dayTabNum}>{day.num}</span>
                      {hasCls && <span className={s.dayTabDot} />}
                    </button>
                  )
                })}
              </div>
              <button
                className={s.dayNavBtn}
                onClick={() => { setWeekOff(w => w + 1); setDayIdx(0) }}
              ><ChevronRight size={18} /></button>
            </div>
            <p className={s.dayNavMonth}>{weekRangeLabel(weekDays).toUpperCase()}</p>

            {/* Classes for selected day */}
            {(() => {
              const day = weekDays[dayIdx]
	              const dayClasses = reservasMisClasesSource
	                .filter((r) => {
	                  if (!useApiReservations) return r.fecha ? r.fecha === day.isoDate : r.claseDia === day.fullName
	                  const occurrenceDate = getReservationOccurrenceDate(r)
                  if (!occurrenceDate) return false
                  return occurrenceDate === day.isoDate
                })
                .map(toClsShape)
              if (useApiReservations && misClasesPageState.isLoading) {
                return (
                  <div className={s.emptyDay}>
                    <div className={s.emptyDayIcon}>...</div>
                    <div className={s.emptyDayTitle}>Cargando clases...</div>
                  </div>
                )
              }
              if (useApiReservations && misClasesPageState.error) {
                return (
                  <div className={s.emptyDay}>
                    <div className={s.emptyDayIcon}>⚠</div>
                    <div className={s.emptyDayTitle}>No se pudo cargar Mis clases</div>
                    <p className={s.emptyDaySub}>Intenta cambiar de día o recargar sección.</p>
                  </div>
                )
              }
              return dayClasses.length > 0 ? (
                <div>
                  {dayClasses.map((c, index) => (
                    <MisClasesCard key={`${c.occurrenceId ?? c.id}-${c.claseFecha ?? day.isoDate}-${c.time ?? 'sin-hora'}-${index}`} cls={c} dayIsoDate={day.isoDate} onCancel={() => handleCancelReserva(c.id)} coachFoto={coachFotoByName[c.coach] || null} />
                  ))}
                  {useApiReservations && (
                    <PaginationControls
                      page={misClasesPageState.page}
                      totalPages={misClasesPageState.totalPages}
                      label="Mis clases"
                      onPrev={() => setMisClasesPage((p) => Math.max(1, p - 1))}
                      onNext={() => setMisClasesPage((p) => Math.min(misClasesPageState.totalPages, p + 1))}
                    />
                  )}
                </div>
              ) : (
                <div className={s.emptyDay}>
	                  <div className={s.emptyDayIcon}>📅</div>
	                  <div className={s.emptyDayTitle}>Sin clases el {day.fullName.toLowerCase()}</div>
	                  <p className={s.emptyDaySub}>
	                    {misClasesStatusFilter === 'all'
	                      ? 'No tienes ninguna clase reservada este dí­a'
	                      : 'No tienes clases en este estado.'}
	                  </p>
                  {useApiReservations && reservasSinFechaSesion.length > 0 && (
                    <p className={s.emptyDaySub}>Reserva sin fecha de sesiÃ³n disponible</p>
                  )}
                  <button className={`${s.btn} ${s.btnPrimary}`} style={{ marginTop: 16 }} onClick={() => goTo('reservar')}>
                    Reservar clase
                  </button>
                </div>
              )
            })()}
          </div>

          {/* â•â•â• RESERVAR â•â•â• */}
          <div className={`${s.section} ${activeSection === 'reservar' ? s.active : ''}`}>

            {/* Day nav row */}
            <div className={s.dayNavRow}>
              <button
                className={`${s.dayNavBtn} ${resWeekOff === 0 ? s.dayNavBtnOff : ''}`}
                onClick={() => { setResWeekOff(w => Math.max(0, w - 1)); setResDayIdx(0) }}
                disabled={resWeekOff === 0}
              ><ChevronLeft size={18} /></button>
              <div className={s.dayTabs}>
                {resWeekDays.map((day, i) => {
                  const hasCls = getDayAvail(day).length > 0
                  return (
                    <button
                      key={i}
                      className={`${s.dayTab} ${resDayIdx === i ? s.dayTabActive : ''}`}
                      onClick={() => setResDayIdx(i)}
                    >
                      <span className={s.dayTabAbbr}>{day.abbr}</span>
                      <span className={s.dayTabNum}>{day.num}</span>
                      {hasCls && <span className={s.dayTabDot} />}
                    </button>
                  )
                })}
              </div>
              <button
                className={s.dayNavBtn}
                onClick={() => { setResWeekOff(w => w + 1); setResDayIdx(0) }}
              ><ChevronRight size={18} /></button>
            </div>
            <p className={s.dayNavMonth}>{weekRangeLabel(resWeekDays).toUpperCase()}</p>

            {/* Filtered class list */}
            {(() => {
              const day      = resWeekDays[resDayIdx]
              const dayAvail = getDayAvail(day)
              return dayAvail.length > 0 ? (
                <div className={s.pubList}>
                  {dayAvail.map((av, index) => {
                    const alreadyBooked = reservasUsuario.find((r) => {
                      if (r.estado !== 'confirmada') return false
                      if (useApiReservations && av.occurrenceId) return Number(r.occurrenceId) === Number(av.occurrenceId)
                      return r.claseId === av.id
                    })
                    const isFull  = av.spots === 0
                    const isLow   = av.spots > 0 && av.spots <= 3
                    const initials  = av.coach.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    const { bg, text } = avatarStyle(av.coach)
                    const coachFoto = coachFotoByName[av.coach] || null
                    return (
                      <div key={`${av.occurrenceId ?? av.id}-${av.time ?? 'sin-hora'}-${index}`} className={`${s.pubCard} ${isFull ? s.pubCardFull : ''}`}>
                        <div className={s.pubAvatarWrap}>
                          <div className={s.pubAvatar} style={{ background: coachFoto ? 'transparent' : bg, overflow: 'hidden', padding: 0 }}>
                            {coachFoto ? (
                              <img src={coachFoto} alt={av.coach} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }} />
                            ) : (
                              <span className={s.pubAvatarInitials} style={{ color: text }}>{initials}</span>
                            )}
                          </div>
                        </div>
                        <div className={s.pubTime}>
                          <span className={s.pubTimeHour}>{formatHour(av.time ?? av.displayTime)}</span>
                          <span className={s.pubTimeDur}>50 min</span>
                        </div>
                        <div className={s.pubDivider} />
                        <div className={s.pubBody}>
                          <div className={s.pubTitleRow}>
                            <span className={s.pubClassName}>{av.title}</span>
                            <span className={`${s.pubTypeBadge} ${normalizeDiscipline(av.discipline ?? av.tipo ?? av._raw?.discipline) === 'stryde' ? s.pubBadgeStride : normalizeDiscipline(av.discipline ?? av.tipo ?? av._raw?.discipline) === 'slow' ? s.pubBadgeSlow : ''}`}>
                              {normalizeDiscipline(av.discipline ?? av.tipo ?? av._raw?.discipline) === 'slow' ? 'SLOW' : normalizeDiscipline(av.discipline ?? av.tipo ?? av._raw?.discipline) === 'stryde' ? 'STRYDE' : 'Sin tipo'}
                            </span>
                          </div>
                          <div className={s.pubMeta}>
                            <span className={s.pubMetaItem}>{av.coach}</span>
                          </div>
                        </div>
                        <div className={s.pubActions}>
                          {(() => {
                            const classTimeToken = getClassTimeToken(av)
                            const classTime = classTimeToken ? new Date(day.isoDate + 'T' + classTimeToken + ':00') : null
                            const isPast = classTime ? classTime <= new Date() : false
                            if (alreadyBooked) {
                              if (isPast) return (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0, display: 'inline-block' }} />
                                  Clase finalizada
                                </span>
                              )
                              return <span className={`${s.statusPill} ${s.statusConfirmada}`}>Reservada</span>
                            }
                            if (isPast) return (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0, display: 'inline-block' }} />
                                Clase finalizada
                              </span>
                            )
                            if (isFull) {
                              const waitlistKey = av.occurrenceId ?? av.id
                              const estaEnEspera = listaEsperaStore.estaEnLista(waitlistKey, usuario?.id)
                              const posicion     = estaEnEspera
                                ? listaEsperaStore.getPosicion(waitlistKey, usuario?.id)
                                : null
                              return estaEnEspera ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                  <span style={{
                                    fontSize: 11, color: '#F59E0B', fontWeight: 600,
                                    fontFamily: 'var(--font-body)',
                                  }}>
                                    â³ Lista de espera #{posicion}
                                  </span>
                                  <button
                                    onClick={() => handleSalirListaEspera(av)}
                                    style={{
                                      fontSize: 10, padding: '4px 10px', borderRadius: 6,
                                      border: '1px solid rgba(245,158,11,0.3)',
                                      background: 'transparent', color: '#F59E0B',
                                      fontFamily: 'var(--font-body)', cursor: 'pointer',
                                    }}
                                  >
                                    Salir de lista
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                  <span className={s.pubFullTag}>LLENO</span>
                                  {usuario?.id && (
                                    <button
                                      onClick={() => handleUnirseListaEspera(av)}
                                      style={{
                                        fontSize: 10, padding: '4px 10px', borderRadius: 6,
                                        border: '1px solid rgba(245,158,11,0.3)',
                                        background: 'rgba(245,158,11,0.08)',
                                        color: '#F59E0B', fontFamily: 'var(--font-body)',
                                        cursor: 'pointer', whiteSpace: 'nowrap',
                                      }}
                                    >
                                      â³ Unirse a lista de espera
                                    </button>
                                  )}
                                </div>
                              )
                            }
                            return (
                              <>
                                <span className={`${s.pubAvailTag} ${isLow ? s.pubAvailLow : s.pubAvailOk}`}>
                                  <span className={s.pubAvailDot} />
                                  {av.spots} {av.spots === 1 ? 'lugar' : 'lugares'}
                                </span>
                                <button
                                  className={s.pubReservarBtn}
                                  onClick={() => setSeatSelectorClass(av._raw ?? null)}
                                >
                                  RESERVAR
                                </button>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className={s.emptyDay}>
                  <div className={s.emptyDayIcon}>📅</div>
                  <div className={s.emptyDayTitle}>Sin clases el {day.fullName.toLowerCase()}</div>
                  <p className={s.emptyDaySub}>No hay clases disponibles este dí­a</p>
                </div>
              )
            })()}
          </div>

          {/* â•â•â• PERFIL â•â•â• */}
          <div className={`${s.section} ${activeSection === 'perfil' ? s.active : ''}`}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontStyle: 'italic', fontWeight: 400, color: 'var(--ink)' }}>Mi Perfil</h1>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Gestiona tu Información personal</p>
            </div>
            <div className={s.grid2} style={{ alignItems: 'start' }}>
              <div className={s.card}>
                <div className={s.profileAvatarWrap}>
                  <div className={s.profileAvatarLg}>{userInitial}</div>
                  <div className={s.profileNameDisplay}>{userName}</div>
                  <span className={s.profilePlanTag}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0L6.12 3.45H9.76L6.82 5.57L7.94 9.02L5 6.9L2.06 9.02L3.18 5.57L0.24 3.45H3.88L5 0Z"/></svg>
                    {planNombre}
                  </span>
                  <div className={s.miniStats}>
                    <div>
                      <div className={s.miniStatNum}>
                        {reservasUsuario.filter((r) => r.estado === 'confirmada' || r.estado === 'completada').length}
                      </div>
                      <div className={s.miniStatLabel}>Clases tomadas</div>
                    </div>
                    <div className={s.miniStatDivider} />
                    <div>
                      <div className={s.miniStatNum}>{clasesRestantes}</div>
                      <div className={s.miniStatLabel}>Disponibles</div>
                    </div>
                    <div className={s.miniStatDivider} />
                    <div>
                      <div className={s.miniStatNum}>{reservasUsuario.length}</div>
                      <div className={s.miniStatLabel}>Reservas totales</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={s.card}>
                <div className={s.cardHeader}>
                  <div className={s.cardTitle}>Información personal</div>
                </div>
                <div className={s.cardBody}>
                  <form onSubmit={handleGuardarPerfil}>
                    <div className={s.formRow}>
                      <div className={s.formGroup}>
                        <label className={s.formLabel}>Nombre</label>
                        <input
                          className={s.formInput}
                          type="text"
                          value={perfilForm?.nombre ?? ''}
                          onChange={(e) => {
                            setIsPerfilDirty(true)
                            setPerfilForm((p) => ({ ...(p ?? {}), nombre: e.target.value }))
                          }}
                        />
                      </div>
                      <div className={s.formGroup}>
                        <label className={s.formLabel}>Apellido</label>
                        <input
                          className={s.formInput}
                          type="text"
                          value={perfilForm?.apellido ?? ''}
                          onChange={(e) => {
                            setIsPerfilDirty(true)
                            setPerfilForm((p) => ({ ...(p ?? {}), apellido: e.target.value }))
                          }}
                        />
                      </div>
                    </div>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>Correo electrónico</label>
                      <input className={s.formInput} type="email" value={perfilForm?.email ?? ''} readOnly
                        style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    </div>
                    <div className={s.formRow}>
                      <div className={s.formGroup}>
                        <label className={s.formLabel}>Teléfono</label>
                        <input
                          className={s.formInput}
                          type="tel"
                          value={perfilForm?.telefono ?? ''}
                          onChange={(e) => {
                            setIsPerfilDirty(true)
                            setPerfilForm((p) => ({ ...(p ?? {}), telefono: e.target.value }))
                          }}
                        />
                      </div>
                      <div className={s.formGroup}>
                        <label className={s.formLabel}>Género</label>
                        <select
                          className={s.formInput}
                          value={perfilForm?.genero ?? 'Prefiero no decir'}
                          onChange={(e) => {
                            setIsPerfilDirty(true)
                            setPerfilForm((p) => ({ ...(p ?? {}), genero: e.target.value }))
                          }}
                        >
                          <option>Masculino</option>
                          <option>Femenino</option>
                          <option>Prefiero no decir</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnOutline}`}
                        style={{ fontSize: 12, padding: '9px 20px' }}
                        onClick={initPerfilForm}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className={`${s.btn} ${s.btnPrimary}`}
                        style={{ fontSize: 12, padding: '9px 20px' }}
                        disabled={guardandoPerfil}
                      >
                        {guardandoPerfil ? 'Guardando…' : 'Guardar cambios'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* â•â•â• PAGOS â•â•â• */}
          <div className={`${s.section} ${activeSection === 'pagos' ? s.active : ''}`}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontStyle: 'italic', fontWeight: 400, color: 'var(--ink)' }}>Paquetes & Pagos</h1>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Administra tu plan y revisa tus pagos</p>
            </div>

            <div className={s.planCurrent}>
              <div className={s.planNameTag}>Plan activo</div>
              <div className={s.planName}>{planNombre}</div>
              <div className={s.planClassesRow}>
                <div className={s.planClassesNum}>
                  {financialUiState.isLoading ? '...' : clasesRestantes}
                </div>
                <div className={s.planClassesSub}>clases restantes</div>
              </div>
              {useApiFinancialState && financialUiState.status === 'loading' && (
                <div className={s.planProgressLabel} style={{ color: 'var(--muted)' }}>
                  Cargando estado financiero...
                </div>
              )}
              {useApiFinancialState && financialUiState.status === 'error' && (
                <div className={s.planProgressLabel} style={{ color: '#b42318' }}>
                  No se pudo cargar estado financiero. Reintenta en unos segundos.
                </div>
              )}
              {useApiFinancialState && financialUiState.status === 'no_membership' && (
                <div className={s.planProgressLabel} style={{ color: 'var(--muted)' }}>
                  Sin membresía activa
                </div>
              )}
              {financialUiState.canShowProgress && (
                <>
                  <div className={s.planProgressBar}>
                    <div
                      className={s.planProgressFill}
                      style={{ width: `${Math.round((clasesUsadas / clasesTotal) * 100)}%` }}
                    />
                  </div>
                  <div className={s.planProgressLabel}>
                    {clasesUsadas} de {clasesTotal} clases usadas
                    {usuario?.paqueteInfo?.fechaVencimiento
                      ? ` · Vence ${formatFechaISO(usuario.paqueteInfo.fechaVencimiento)}`
                      : ''}
                  </div>
                </>
              )}
              {!useApiFinancialState && planNombre === 'Sin plan' && (
                <div className={s.planProgressLabel} style={{ color: 'var(--muted)' }}>
                  No tienes un paquete activo
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic', color: 'var(--ink)', marginBottom: 4 }}>Nuestros planes</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Elige el que mejor se adapte a tu ritmo</div>
              {selectedPackage && (
                <div style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(123,31,46,0.14)',
                  background: 'rgba(123,31,46,0.05)',
                  color: 'var(--ink)',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}>
                  Continúa tu compra de <strong>{selectedPackage.nombre}</strong>. El paquete quedó resaltado para que sigas el flujo desde aquí.
                </div>
              )}
            </div>

            <div className={`${s.grid3}`} style={{ marginBottom: 28 }}>
              {useApiFinancialState && isMembershipPackagesLoading ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  Cargando catálogo de paquetes...
                </div>
              ) : useApiFinancialState && membershipPackagesError ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#b42318', fontSize: 13 }}>
                  {membershipPackagesError}
                </div>
              ) : paquetesDisponibles.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  No hay paquetes activos disponibles.
                </div>
              ) : paquetesDisponibles.map((p) => {
                const esPlanActual = useApiFinancialState
                  ? activeMembership?.packageName === p.nombre
                  : usuario?.paquete === p.nombre
                const isSelectedPackage = selectedPackageId != null && String(p.id) === String(selectedPackageId)
                return (
                  <div
                    key={p.id}
                    className={`${s.pricingCard} ${p.destacado ? s.featured : ''}`}
                    style={isSelectedPackage ? { border: '1px solid rgba(123,31,46,0.35)', boxShadow: '0 18px 42px rgba(123,31,46,0.16)' } : undefined}
                  >
                    {isSelectedPackage && (
                      <span className={s.pricingTag} style={{ background: 'rgba(123,31,46,0.12)' }}>
                        Seleccionado
                      </span>
                    )}
                    {p.destacado && <span className={s.pricingTag}>Popular</span>}
                    <div className={s.pricingName}>{p.nombre}</div>
                    <div className={s.pricingClasses}>
                      {useApiFinancialState
                        ? `${p.creditos ?? p.clases ?? 0} créditos`
                        : p.clases === 0
                          ? 'Clases ilimitadas'
                          : `${p.clases} clases al mes`}
                    </div>
                    <div className={s.pricingPrice}>${p.precio.toLocaleString()}</div>
                    <div className={s.pricingPeriod}>{useApiFinancialState ? '' : 'pago mensual'}</div>
                    <div className={s.pricingFeatures}>
                      {(p.beneficios || []).map((b, i) => (
                        <div key={i} className={s.pricingFeature}>{b}</div>
                      ))}
                    </div>
                    <button
                      className={`${s.btnPricing} ${esPlanActual ? s.btnPricingPrimary : s.btnPricingOutline}`}
                      onClick={() => {
                        if (esPlanActual) return
                        setSelectedPackageId(String(p.id))
                        setPagoModal(p)
                      }}
                      disabled={esPlanActual}
                     >
                      {esPlanActual ? 'Plan actual' : isSelectedPackage ? 'Comprar ahora' : 'Seleccionar'}
                    </button>
                  </div>
                )
              })}
            </div>

            <RecentPaymentsStatusPanel enabled={useApiFinancialState && activeSection === 'pagos'} onFinancialRefreshRequested={requestFinancialRefresh} />

            <div className={s.card}>
              <div className={s.cardHeader}>
                <div className={s.cardTitle}>{useApiFinancialState ? 'Movimientos de crédito' : 'Historial de pagos'}</div>
                <div className={s.cardSubtitle}>{useApiFinancialState ? 'Actividad reciente de membresía' : 'Últimas transacciones'}</div>
              </div>
              <div className={s.cardBody}>
                {useApiFinancialState && apiCreditMovementsPage.isLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>
                    Cargando movimientos...
                  </div>
                ) : useApiFinancialState && apiCreditMovementsPage.error ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#b42318', fontSize: 13 }}>
                    No se pudieron cargar movimientos de crédito.
                  </div>
                ) : useApiFinancialState && (apiCreditMovementsPage.total ?? 0) === 0 && historialPagos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>
                    Aún no hay movimientos registrados.
                  </div>
                ) : useApiFinancialState && (apiCreditMovementsPage.total ?? 0) > 0 ? (
                  paginatedFinancialHistory.items.map((mv) => (
                      <div key={`mv-${mv.id ?? mv.createdAt}`} className={s.historyRow}>
                        <div className={s.historyIcon}>💳</div>
                        <div style={{ flex: 1 }}>
                          <div className={s.historyDesc}>{mv.type || 'Movimiento de crédito'}</div>
                          <div className={s.historyDate}>{mv.createdAt ? formatFechaISO(mv.createdAt.slice(0, 10)) : 'Sin fecha'}</div>
                        </div>
                        <div className={s.historyAmount} style={mv.amount < 0 ? { color: '#e53e3e' } : { color: '#16a34a' }}>
                          {mv.amount > 0 ? '+' : ''}{mv.amount}
                        </div>
                      </div>
                    ))
                ) : historialPagos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>
                    No hay transacciones registradas.
                  </div>
                ) : (
                  paginatedFinancialHistory.items.map(tx => (
                      <div key={tx.id} className={s.historyRow}>
                        <div className={s.historyIcon}>
                          {tx.tipo === 'reembolso' ? '↩️' : tx.tipo === 'producto' ? '🛍️' : '💳'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className={s.historyDesc}>{tx.concepto}</div>
                          <div className={s.historyDate}>{formatFechaISO(tx.fecha)}</div>
                        </div>
                        <div
                          className={s.historyAmount}
                          style={tx.monto < 0 ? { color: '#e53e3e' } : undefined}
                        >
                          {tx.monto < 0 ? '-' : ''}${Math.abs(tx.monto).toLocaleString()}
                        </div>
                      </div>
                    ))
                )}
                {(useApiFinancialState ? (apiCreditMovementsPage.total ?? 0) > 0 : financialHistorySource.length > 0) && (
                  <PaginationControls
                    page={paginatedFinancialHistory.page}
                    totalPages={paginatedFinancialHistory.totalPages}
                    label="Historial"
                    onPrev={() => setFinancialHistoryPage((p) => Math.max(1, p - 1))}
                    onNext={() => setFinancialHistoryPage((p) => Math.min(paginatedFinancialHistory.totalPages, p + 1))}
                  />
                )}
              </div>
            </div>
          </div>
          {pagoModal && (
          <PagoModal
          paquete={pagoModal}
          onClose={() => setPagoModal(null)}
          onSuccess={() => { setPagoModal(null); goTo('reservar') }}
          />
        )}
        </div>{/* /content */}
      </main>

      {seatSelectorClass && (
        useApiReservations && seatSelectorClass?.occurrenceId ? (
          <EquipmentReservationPanel
            occurrenceId={seatSelectorClass.occurrenceId}
            classId={seatSelectorClass.id}
            userId={usuario?.id}
            financialState={financialState}
            onClose={() => setSeatSelectorClass(null)}
          />
        ) : (
          <SeatSelector
            cls={seatSelectorClass}
            onClose={() => setSeatSelectorClass(null)}
          />
        )
      )}
    </div>
  )
}



