import { useState, useRef, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import PasswordInput from '@/components/ui/PasswordInput'
import DashboardSection from './sections/DashboardSection'
import CoachesSection from './sections/CoachesSection'
import ClasesSection from './sections/ClasesSection'
import PaquetesSection from './sections/PaquetesSection'
import PuntoDeVentaSection from './sections/PuntoDeVentaSection'
import UsuariosSection from './sections/UsuariosSection'
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
import { reservarClase as reservarClaseService, cancelarReserva as cancelarReservaService, eliminarClaseConReservas } from '@/services/reservasService'
import { borrarCoachService } from '@/services/coachesService'
import { useDisciplinasStore } from '@/stores/disciplinasStore'
import SeatSelector from '@/features/clases/SeatSelector'
import { FinanzasSection } from './AdminFinanzas'
import { ReportesSection } from './AdminReportes'
import CompartirPaquete from '@/features/paquetes/CompartirPaquete'

// ── adminLinks export (used by other admin pages) ────────────────────────────
import { LayoutDashboard, Users, UserCheck, CalendarDays, Package, BarChart2, DollarSign, Menu, X } from 'lucide-react'
export const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/paquetes',  icon: Package,         label: 'Paquetes'  },
  { to: '/admin/coaches',   icon: UserCheck,       label: 'Coaches'   },
  { to: '/admin/clases',    icon: CalendarDays,    label: 'Clases'    },
  { to: '/admin/usuarios',  icon: Users,           label: 'Usuarios'  },
  { to: '/admin/finanzas',  icon: DollarSign,      label: 'Finanzas'  },
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
  { emoji: '⭐', name: 'Premium — Ilimitadas',  price: 1999 },
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

// ── Main component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [modalType, setModalType]         = useState(null) // null | 'coach' | 'clase' | 'paquete' | 'usuario'
  const [rangoDash, setRangoDash]         = useState('mes')
  const [modalPago, setModalPago]         = useState(false)
  const { coaches, agregarCoach, editarCoach, eliminarCoach } = useCoachesStore()
  const { productos, agregarProducto,
          editarProducto, eliminarProducto }               = useProductosStore()
  const { clases, agregarClase, editarClase } = useClasesStore()
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

  // Product CRUD state
  const [prodModal, setProdModal]               = useState(null) // null | 'nuevo' | { producto }
  const [prodForm, setProdForm]                 = useState({ nombre: '', categoria: 'Accesorios', precio: '', stock: '', emoji: '' })
  const [confirmarEliminarProd, setConfirmarEliminarProd] = useState(null)

  // Coach foto — crear
  const [coachFotoPreview, setCoachFotoPreview] = useState(null)
  const [coachFotoPath,    setCoachFotoPath]    = useState(null)
  const fotoCreateRef = useRef(null)

  // Coach — editar modal
  const [modalEditCoach,  setModalEditCoach]  = useState(null)
  const [editCoachForm,   setEditCoachForm]   = useState({ nombre: '', disciplina: '', especialidad: '', email: '', telefono: '', bio: '' })
  const [editFotoPreview, setEditFotoPreview] = useState(null)
  const [editFotoPath,    setEditFotoPath]    = useState(null)
  const fotoEditRef = useRef(null)

  // Disciplinas modal
  const [modalDisciplinas, setModalDisciplinas] = useState(false)
  const [nuevaDisciplina,  setNuevaDisciplina]  = useState('')

  // Coach — horario modal
  const [modalHorarioCoach, setModalHorarioCoach] = useState(null)

  // Coach form
  const [coachForm, setCoachForm] = useState({ nombre: '', especialidad: '', disciplina: 'Stryde X', email: '', telefono: '', bio: '', estado: 'activo' })
  // Clase form — publicarEn: ISO datetime string o '' (publicar inmediatamente)
  //              fecha:      YYYY-MM-DD o '' (si vacío → clase recurrente cada semana)
  const [claseForm, setClaseForm] = useState({ nombre: '', tipo: '', coach: '', dia: 'Lunes', hora: '07:00', duracion: '50', cupoMax: '15', descripcion: '', publicarEn: '', fecha: '' })
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
  const [editClaseForm,   setEditClaseForm]   = useState({ nombre: '', tipo: '', coach: '', dia: 'Lunes', hora: '07:00', duracion: '50', cupoMax: '15', descripcion: '', publicarEn: '', fecha: '' })
  // Paquete form (crear)
  const [paqueteForm, setPaqueteForm] = useState({ nombre: '', tipo: 'clases', numClases: '', precio: '', vigencia: '', descripcion: '', destacado: false })
  // Paquete — editar
  const [modalEditPaquete, setModalEditPaquete] = useState(null)
  const [editPaqueteForm,  setEditPaqueteForm]  = useState({ nombre: '', precio: '', clases: '', vigencia: '', categoria: 'mensual', destacado: false, beneficios: [] })
  const [nuevoBeneficio,   setNuevoBeneficio]   = useState('')
  // Usuario form
  const [usuarioForm, setUsuarioForm] = useState({ nombre: '', email: '', telefono: '', nacimiento: '', password: '', paquete: 'ninguno', metodoPago: 'efectivo', notas: '' })
  // Usuario — ver detalle
  const [modalVerUsuario, setModalVerUsuario] = useState(null)
  // Usuario — asignar paquete desde modal Ver
  const [asignarPaqueteForm, setAsignarPaqueteForm] = useState({ paqueteNombre: '', metodoPago: 'efectivo' })
  const [compartirAdminData, setCompartirAdminData] = useState({ activo: false, participantes: [] })
  const [cederClaseUserId, setCederClaseUserId] = useState('')
  // Asignación pendiente de pago: se aplica al procesar la venta en POS
  const [pendingAsignacion, setPendingAsignacion] = useState(null)
  // null | { userId, userName, paqSel, fechaVencimiento, metodoPago }
  // Notas editables en modal Ver
  const [editNotas, setEditNotas] = useState('')

  function closeModal() { setModalType(null) }
  function openModal(type) { setModalType(type) }

  // Cart helpers
  const cartSubtotal = cart.reduce((s, i) => s + i.price, 0)
  const cartIva      = Math.round(cartSubtotal * 0.16)
  const cartTotal    = cartSubtotal + cartIva

  function addToCart(product) {
    setCart((c) => [...c, product])
  }

  function removeFromCart(idx) {
    setCart((c) => c.filter((_, i) => i !== idx))
  }

  function clearCart() {
    setCart([])
    setPendingAsignacion(null)
  }

  function handleSaveProducto() {
    if (!prodForm.nombre.trim()) return
    const datos = {
      nombre:    prodForm.nombre,
      categoria: prodForm.categoria,
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
    setProdModal(null)
    setProdForm({ nombre: '', categoria: 'Accesorios', precio: '', stock: '', emoji: '' })
  }

  function handleEliminarProducto() {
    eliminarProducto(confirmarEliminarProd.id)
    toast.success('Producto eliminado')
    setConfirmarEliminarProd(null)
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
      const clasesPaquete = paqSel.clases === 0 ? 999 : paqSel.clases
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

  async function uploadFoto(file, setPreview, setPath) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      setPreview(base64) // preview inmediato
      try {
        const ext      = file.name.split('.').pop().toLowerCase()
        const filename = `coach-${Date.now()}.${ext}`
        const res  = await fetch('/api/upload-foto', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ base64, filename }),
        })
        const data = await res.json()
        setPath(data.path || base64) // path del servidor o base64 como fallback
      } catch {
        setPath(base64) // fallback: guardar base64 en el store
      }
    }
    reader.readAsDataURL(file)
  }

  const sec = SECTIONS[activeSection]

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
            { id: 'coaches',   icon: '👤', label: 'Coaches',  badge: String(coaches.length) },
            { id: 'clases',    icon: '🗓', label: 'Clases'       },
            { id: 'paquetes',  icon: '📦', label: 'Paquetes'     },
          ].map(({ id, icon, label, badge }) => (
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
            { id: 'usuarios',  icon: '👥', label: 'Usuarios', badge: String(usuarios.length) },
          ].map(({ id, icon, label, badge }) => (
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
            { id: 'reportes',      icon: '📄', label: 'Reportes'       },
            { id: 'actividad',     icon: '📋', label: 'Actividad'      },
            { id: 'configuracion', icon: '⚙️', label: 'Configuración'  },
          ].map(({ id, icon, label }) => (
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
              coaches={coaches}
              openModal={openModal}
              setModalEditCoach={setModalEditCoach}
              setEditCoachForm={setEditCoachForm}
              setEditFotoPreview={setEditFotoPreview}
              setEditFotoPath={setEditFotoPath}
              setModalHorarioCoach={setModalHorarioCoach}
              editarCoach={editarCoach}
              eliminarCoach={eliminarCoach}
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
              coaches={coaches}
              disciplinas={disciplinas}
              openModal={openModal}
              setModalAlumnosClase={setModalAlumnosClase}
              setAlumnoAgregarId={setAlumnoAgregarId}
              setModalEditClase={setModalEditClase}
              setEditClaseForm={setEditClaseForm}
              claseForm={claseForm}
              setClaseForm={setClaseForm}
            />
          </section>

          {/* ── PAQUETES ── */}
          <section className={`${styles.section}${activeSection === 'paquetes' ? ' ' + styles.active : ''}`}>
            <PaquetesSection
              paquetes={paquetes}
              transacciones={transacciones}
              usuarios={usuarios}
              openModal={openModal}
              setModalEditPaquete={setModalEditPaquete}
              setEditPaqueteForm={setEditPaqueteForm}
              eliminarPaquete={eliminarPaquete}
              marcarDestacado={marcarDestacado}
            />
          </section>

          {/* ── PUNTO DE VENTA ── */}
          <section className={`${styles.section}${activeSection === 'pos' ? ' ' + styles.active : ''}`}>
            <PuntoDeVentaSection
              paquetes={paquetes}
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
              clearCart={clearCart}
              handleCobrar={handleCobrar}
              handleSaveProducto={handleSaveProducto}
              handleEliminarProducto={handleEliminarProducto}
            />
          </section>

          {/* ── USUARIOS ── */}
          <section className={`${styles.section}${activeSection === 'usuarios' ? ' ' + styles.active : ''}`}>
            <UsuariosSection
              usuarios={usuarios}
              paquetes={paquetes}
              usersFilter={usersFilter}
              setUsersFilter={setUsersFilter}
              usersSearch={usersSearch}
              setUsersSearch={setUsersSearch}
              userSelectMode={userSelectMode}
              setUserSelectMode={setUserSelectMode}
              userSelectedIds={userSelectedIds}
              setUserSelectedIds={setUserSelectedIds}
              eliminarUsuario={eliminarUsuario}
              openModal={openModal}
              setModalVerUsuario={setModalVerUsuario}
              setAsignarPaqueteForm={setAsignarPaqueteForm}
              setEditNotas={setEditNotas}
              setCederClaseUserId={setCederClaseUserId}
            />
          </section>

          {/* ── FINANZAS ── */}
          <section className={`${styles.section}${activeSection === 'finanzas' ? ' ' + styles.active : ''}`}>
            <FinanzasSection inPanel />
          </section>

          {/* ── REPORTES ── */}
          <section className={`${styles.section}${activeSection === 'reportes' ? ' ' + styles.active : ''}`}>
            <ReportesSection inPanel />
          </section>

          {/* ── ACTIVIDAD ── */}
          <section className={`${styles.section}${activeSection === 'actividad' ? ' ' + styles.active : ''}`}>
            <ActividadSection />
          </section>

          {/* ── CONFIGURACIÓN ── */}
          <section className={`${styles.section}${activeSection === 'configuracion' ? ' ' + styles.active : ''}`}>
            <ConfiguracionSection />
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

            {/* Foto upload */}
            <input
              ref={fotoCreateRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => uploadFoto(e.target.files?.[0], setCoachFotoPreview, setCoachFotoPath)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16, gap: 8 }}>
              <div
                onClick={() => fotoCreateRef.current?.click()}
                style={{ cursor: 'pointer', width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                {coachFotoPreview
                  ? <img src={coachFotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 28 }}>📷</span>}
              </div>
              <button
                type="button"
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => fotoCreateRef.current?.click()}
              >
                {coachFotoPreview ? 'Cambiar foto' : 'Subir foto (opcional)'}
              </button>
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
                  placeholder="Por defecto: 123456"
                  value={coachForm.password || ''}
                  onChange={e => setCoachForm(f => ({ ...f, password: e.target.value }))} />
                </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Biografía / Descripción</label>
                <textarea className={styles.formInput} rows={3} placeholder="Breve descripción del coach y su experiencia…"
                  value={coachForm.bio} onChange={e => setCoachForm(f => ({ ...f, bio: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={closeModal}>Cancelar</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={async () => {
                  if (!coachForm.nombre.trim()) return
                  const resultado = await crearCoachService({
                    nombre:       coachForm.nombre,
                    email:        coachForm.email,
                    password:     coachForm.password || '123456',
                    especialidad: coachForm.disciplina || 'Stryde X',
                    bio:          coachForm.bio,
                    foto:         coachFotoPath || null,
                  })
                  if (resultado.ok) {
                  toast.success(`${coachForm.nombre} agregado`)
                  logCoachAgregado({ nombre: coachForm.nombre })
                  setCoachForm({ nombre: '', especialidad: '', disciplina: 'Stryde X', email: '', telefono: '', bio: '', estado: 'activo', password: '' })
                  setCoachFotoPreview(null)
                  setCoachFotoPath(null)
                  closeModal()
                  } else {
                    toast.error(resultado.mensaje)
                  }
                }}
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
                  {coaches.filter(c => {
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
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cupo máximo</label>
                <input className={styles.formInput} type="number" min="1" max="50" placeholder="15" value={claseForm.cupoMax}
                  onChange={e => setClaseForm(f => ({ ...f, cupoMax: e.target.value }))} />
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
                onClick={() => {
                  if (!claseForm.nombre.trim()) return
                  const coachObj = coaches.find(c => c.nombre === claseForm.coach)
                  agregarClase({
                    nombre:      claseForm.nombre,
                    tipo:        claseForm.tipo,
                    coachId:     coachObj?.id ?? null,
                    coachNombre: claseForm.coach || 'Sin asignar',
                    dia:         claseForm.dia,
                    hora:        claseForm.hora,
                    duracion:    Number(claseForm.duracion) || 50,
                    cupoMax:     Number(claseForm.cupoMax) || 15,
                    cupoActual:  0,
                    descripcion: claseForm.descripcion,
                    publicarEn:  claseForm.publicarEn || null,
                    fecha:       claseForm.fecha || null,
                  })
                  const msg = claseForm.fecha
                    ? `Clase "${claseForm.nombre}" creada para el ${new Date(claseForm.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}`
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
                <label className={styles.formLabel}>Nombre del paquete</label>
                <input className={styles.formInput} placeholder="Ej: Mensual Ilimitado" value={paqueteForm.nombre}
                  onChange={e => setPaqueteForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo</label>
                <select className={styles.formSelect} value={paqueteForm.tipo}
                  onChange={e => setPaqueteForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="clases">Paquete de clases</option>
                  <option value="individual">Por clase individual</option>
                </select>
              </div>
              {paqueteForm.tipo === 'clases' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Número de clases</label>
                  <input className={styles.formInput} type="number" min="1" placeholder="Ej: 10" value={paqueteForm.numClases}
                    onChange={e => setPaqueteForm(f => ({ ...f, numClases: e.target.value }))} />
                </div>
              )}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Precio (MXN)</label>
                <input className={styles.formInput} type="number" min="0" placeholder="Ej: 1200" value={paqueteForm.precio}
                  onChange={e => setPaqueteForm(f => ({ ...f, precio: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vigencia (días)</label>
                <input className={styles.formInput} type="number" min="0" placeholder="30 · dejar 0 para sin límite" value={paqueteForm.vigencia}
                  onChange={e => setPaqueteForm(f => ({ ...f, vigencia: e.target.value }))} />
              </div>
              <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
                <input type="checkbox" id="destacado" checked={paqueteForm.destacado}
                  onChange={e => setPaqueteForm(f => ({ ...f, destacado: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--wine)', cursor: 'pointer' }} />
                <label htmlFor="destacado" className={styles.formLabel} style={{ margin: 0, cursor: 'pointer' }}>
                  Marcar como "Más popular"
                </label>
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.formLabel}>Descripción</label>
                <textarea className={styles.formInput} rows={2} placeholder="Beneficios e información adicional del paquete…"
                  value={paqueteForm.descripcion} onChange={e => setPaqueteForm(f => ({ ...f, descripcion: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={closeModal}>Cancelar</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  if (!paqueteForm.nombre.trim()) return
                  agregarPaquete({
                    nombre:     paqueteForm.nombre,
                    precio:     Number(paqueteForm.precio) || 0,
                    clases:     paqueteForm.tipo === 'mensual' ? 0 : Number(paqueteForm.numClases) || 1,
                    vigencia:   paqueteForm.vigencia ? `${paqueteForm.vigencia} días` : 'Mensual',
                    categoria:  paqueteForm.tipo === 'mensual' ? 'mensual' : 'pack',
                    beneficios: paqueteForm.descripcion ? [paqueteForm.descripcion] : [],
                    destacado:  paqueteForm.destacado,
                  })
                  toast.success(`Paquete "${paqueteForm.nombre}" creado`)
                  setPaqueteForm({ nombre: '', tipo: 'mensual', numClases: '', precio: '', vigencia: '', descripcion: '', destacado: false })
                  closeModal()
                }}
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
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha de nacimiento</label>
                <input className={styles.formInput} type="date" value={usuarioForm.nacimiento}
                  onChange={e => setUsuarioForm(f => ({ ...f, nacimiento: e.target.value }))} />
              </div>
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
                  {paquetes.map(p => (
                    <option key={p.id} value={p.nombre}>
                      {p.nombre} — ${p.precio.toLocaleString()} {p.clases === 0 ? '(ilimitadas)' : `(${p.clases} clases)`}
                    </option>
                  ))}
                </select>
              </div>
              {usuarioForm.paquete !== 'ninguno' && (
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
                <label className={styles.formLabel}>Notas / Observaciones</label>
                <textarea className={styles.formInput} rows={2} placeholder="Lesiones, preferencias, cómo nos encontró…"
                  value={usuarioForm.notas} onChange={e => setUsuarioForm(f => ({ ...f, notas: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={closeModal}>Cancelar</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  if (!usuarioForm.nombre.trim() || !usuarioForm.email.trim()) return
                  const paqSel = paquetes.find(p => p.nombre === usuarioForm.paquete)
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
                    const labelClases = paqSel.clases === 0 ? 'Ilimitadas' : `${paqSel.clases} clases`
                    setCart([{ name: `${paqSel.nombre} — ${labelClases}`, price: paqSel.precio, emoji: paqSel.clases === 0 ? '⭐' : '📦', cliente: usuarioForm.nombre }])
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
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{prodModal === 'nuevo' ? 'Agregar producto' : 'Editar producto'}</div>
              <button className={styles.modalClose} onClick={() => setProdModal(null)}>×</button>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre</label>
                <input className={styles.formInput} placeholder="Ej: Botella CS" value={prodForm.nombre}
                  onChange={(e) => setProdForm((f) => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Categoría</label>
                <select className={styles.formSelect} value={prodForm.categoria}
                  onChange={(e) => setProdForm((f) => ({ ...f, categoria: e.target.value }))}>
                  {['Accesorios', 'Nutrición', 'Equipo', 'Ropa'].map((c) => <option key={c}>{c}</option>)}
                </select>
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
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setProdModal(null)}>Cancelar</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSaveProducto}>
                {prodModal === 'nuevo' ? 'Agregar' : 'Guardar cambios'}
              </button>
            </div>
          </div>
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

            {/* Foto upload */}
            <input
              ref={fotoEditRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => uploadFoto(e.target.files?.[0], setEditFotoPreview, setEditFotoPath)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16, gap: 8 }}>
              <div
                onClick={() => fotoEditRef.current?.click()}
                style={{ cursor: 'pointer', width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                {editFotoPreview
                  ? <img src={editFotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 28, fontWeight: 700 }}>{modalEditCoach.nombre.charAt(0).toUpperCase()}</span>}
              </div>
              <button
                type="button"
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => fotoEditRef.current?.click()}
              >
                {editFotoPreview ? 'Cambiar foto' : 'Subir foto'}
              </button>
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
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalEditCoach(null)}>
                Cancelar
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  if (!editCoachForm.nombre.trim()) return
                  editarCoach(modalEditCoach.id, {
                    nombre:       editCoachForm.nombre,
                    especialidad: editCoachForm.disciplina || 'Stryde X',
                    bio:          editCoachForm.bio,
                    email:        editCoachForm.email,
                    telefono:     editCoachForm.telefono,
                    foto:         editFotoPath || modalEditCoach.foto || null,
                  })
                  // Sincronizar usuario de login asociado
                  const userLogin = usuarios.find(
                    (u) => u.email === modalEditCoach.email && u.rol === 'coach'
                  )
                  if (userLogin && editCoachForm.email !== modalEditCoach.email) {
                    editarUsuario(userLogin.id, { email: editCoachForm.email, nombre: editCoachForm.nombre })
                  } else if (userLogin) {
                    editarUsuario(userLogin.id, { nombre: editCoachForm.nombre })
                  }
                  toast.success(`${editCoachForm.nombre} actualizado`)
                  setModalEditCoach(null)
                }}
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
                  {coaches.filter(c => {
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
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cupo máximo</label>
                <input className={styles.formInput} type="number" min="1" max="50"
                  value={editClaseForm.cupoMax}
                  onChange={e => setEditClaseForm(f => ({ ...f, cupoMax: e.target.value }))} />
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
                onClick={() => {
                  if (!editClaseForm.nombre.trim()) return
                  const coachObj = coaches.find(c => c.nombre === editClaseForm.coach)
                  editarClase(modalEditClase.id, {
                    nombre:      editClaseForm.nombre,
                    tipo:        editClaseForm.tipo,
                    coachId:     coachObj?.id ?? modalEditClase.coachId ?? null,
                    coachNombre: editClaseForm.coach || 'Sin asignar',
                    dia:         editClaseForm.dia,
                    hora:        editClaseForm.hora,
                    duracion:    Number(editClaseForm.duracion) || 50,
                    cupoMax:     Number(editClaseForm.cupoMax) || 15,
                    descripcion: editClaseForm.descripcion,
                    publicarEn:  editClaseForm.publicarEn || null,
                    fecha:       editClaseForm.fecha || null,
                  })
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
        const inscritos = getReservasByClase(cls.id)   // solo confirmadas
        const inscrUser = inscritos.map(r => ({
          ...r,
          nombreUsuario: usuarios.find(u => u.id === r.userId)?.nombre ?? `Usuario #${r.userId}`,
        }))
        // Usuarios que NO están inscritos ya
        const idsInscritos = new Set(inscritos.map(r => r.userId))
        const disponibles  = usuarios.filter(u => !idsInscritos.has(u.id) && u.rol === 'cliente')

        function handleCancelar(r) {
          const res = cancelarReservaService(r.id, r.userId)
          if (res.ok) toast.success(`Reserva de ${r.nombreUsuario} cancelada`)
          else toast.error(res.error)
        }

        function handleAgregar() {
          if (!alumnoAgregarId) return
          const userId = Number(alumnoAgregarId)
          const usuario = usuarios.find(u => u.id === userId)
          // Admin override: si el usuario no tiene créditos, igual lo metemos directo
          const res = reservarClaseService(userId, cls.id)
          if (res.ok) {
            toast.success(`${usuario?.nombre} inscrito en ${cls.nombre}`)
            setAlumnoAgregarId('')
          } else if (res.error === 'Sin créditos disponibles') {
            // Force: agregar sin descontar crédito
            const { agregarReserva } = useReservasStore.getState()
            const { actualizarCupo } = useClasesStore.getState()
            agregarReserva({
              userId,
              claseId:     cls.id,
              claseNombre: cls.nombre,
              claseHora:   cls.hora,
              claseDia:    cls.dia,
              coachNombre: cls.coachNombre,
              tipo:        cls.tipo,
              asiento:     null,
              estado:      'confirmada',
              fecha:       cls.fecha ?? new Date().toISOString().split('T')[0],
            })
            actualizarCupo(cls.id, 1)
            toast.success(`${usuario?.nombre} inscrito manualmente (sin créditos descontados)`)
            setAlumnoAgregarId('')
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
                    {cls.dia} · {cls.hora} · {cls.cupoActual}/{cls.cupoMax} inscritos
                  </div>
                </div>
                <button className={styles.modalClose} onClick={() => setModalAlumnosClase(null)}>×</button>
              </div>

              {/* Lista de inscritos */}
              <div style={{ marginBottom: 20 }}>
                {inscrUser.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                    Nadie inscrito aún
                  </p>
                ) : (
                  <table className={styles.table} style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        <th>Estado</th>
                        <th style={{ textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inscrUser.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 500 }}>{r.nombreUsuario}</td>
                          <td>
                            <span className={`${styles.miniTag} ${styles.tagGreen}`}>Confirmado</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className={`${styles.btn} ${styles.btnGhost}`}
                              style={{ fontSize: 11, padding: '4px 10px', color: '#ef4444' }}
                              onClick={() => handleCancelar(r)}
                            >
                              Cancelar reserva
                            </button>
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
                            fontSize: 13, color: 'var(--text-primary)',
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
                        {u.nombre} {u.paquete ? `· ${u.paquete}` : '· Sin paquete'}
                      </option>
                    ))}
                  </select>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}
                    onClick={handleAgregar}
                    disabled={!alumnoAgregarId}
                  >
                    + Inscribir
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}
                    onClick={() => alumnoAgregarId && setAdminSeatSelector({ cls, userId: Number(alumnoAgregarId) })}
                    disabled={!alumnoAgregarId}
                  >
                    🪑 Elegir asiento
                  </button>
                </div>
                {alumnoAgregarId && (() => {
                  const u = usuarios.find(uu => uu.id === Number(alumnoAgregarId))
                  if (!u) return null
                  return (
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
                      {u.clasesPaquete === 999 ? 'Clases ilimitadas' : u.clasesPaquete > 0 ? `${u.clasesPaquete} crédito(s) disponibles` : '⚠️ Sin créditos — se inscribirá sin descontar'}
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
                          <td>{c.hora}</td>
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
                <label className={styles.formLabel}>Nombre</label>
                <input className={styles.formInput} value={editPaqueteForm.nombre}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Precio ($)</label>
                <input className={styles.formInput} type="number" min="0" value={editPaqueteForm.precio}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, precio: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Clases (0 = ilimitadas)</label>
                <input className={styles.formInput} type="number" min="0" value={editPaqueteForm.clases}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, clases: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vigencia</label>
                <input className={styles.formInput} placeholder="Ej: Mensual, 30 días" value={editPaqueteForm.vigencia}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, vigencia: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Categoría</label>
                <select className={styles.formSelect} value={editPaqueteForm.categoria}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, categoria: e.target.value }))}>
                  <option value="mensual">Mensual</option>
                  <option value="pack">Pack de clases</option>
                </select>
              </div>
              <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="destEdit" checked={editPaqueteForm.destacado}
                  onChange={e => setEditPaqueteForm(f => ({ ...f, destacado: e.target.checked }))} />
                <label htmlFor="destEdit" className={styles.formLabel} style={{ margin: 0 }}>Marcar como popular</label>
              </div>

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
                    placeholder="Nuevo beneficio…"
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
                onClick={() => {
                  if (!editPaqueteForm.nombre.trim()) return
                  editarPaquete(modalEditPaquete.id, {
                    nombre:     editPaqueteForm.nombre,
                    precio:     Number(editPaqueteForm.precio) || 0,
                    clases:     Number(editPaqueteForm.clases) || 0,
                    vigencia:   editPaqueteForm.vigencia,
                    categoria:  editPaqueteForm.categoria,
                    destacado:  editPaqueteForm.destacado,
                    beneficios: editPaqueteForm.beneficios,
                  })
                  toast.success(`Paquete "${editPaqueteForm.nombre}" actualizado`)
                  setModalEditPaquete(null)
                  setNuevoBeneficio('')
                }}
              >Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VER USUARIO ── */}
      {modalVerUsuario && (() => {
        const u = modalVerUsuario
        const reservasU = todasReservas.filter(r => String(r.userId) === String(u.id))
        const paqActivo = paquetes.find(p => p.nombre === u.paquete)
        const restantes = u.clasesPaquete === 999 ? 'Ilimitadas' : (u.clasesPaquete ?? 0)
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
                      const paqActivo = paquetes.find(p => p.nombre === u.paquete)
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
                  <div style={{ marginTop: 10 }}>
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
                  </div>
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
                        {paquetes.map(p => (
                          <option key={p.id} value={p.nombre}>
                            {p.nombre} — ${p.precio.toLocaleString()} {p.clases === 0 ? '(ilimitadas)' : `(${p.clases} clases)`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <select
                        className={styles.formSelect}
                        value={asignarPaqueteForm.metodoPago}
                        onChange={e => setAsignarPaqueteForm(f => ({ ...f, metodoPago: e.target.value }))}
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const paqSel = paquetes.find(p => p.nombre === asignarPaqueteForm.paqueteNombre)
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
                        const labelClases = paqSel.clases === 0 ? 'Ilimitadas' : `${paqSel.clases} clases`
                        setCart([{ name: `${paqSel.nombre} — ${labelClases}`, price: paqSel.precio, emoji: paqSel.clases === 0 ? '⭐' : '📦', cliente: u.nombre }])
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
                      paquete={paquetes.find(p => p.nombre === asignarPaqueteForm.paqueteNombre)}
                      usuarioActualId={u.id}
                      variant="dark"
                      onChange={setCompartirAdminData}
                    />
                  )} */}
                </div>

                {/* ── CEDER CLASE ── */}
                {u.paquete && (u.clasesPaquete ?? 0) > 0 && (
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
                          {reservasU.slice().reverse().map((r, i) => (
                            <tr key={r.id} style={{ borderBottom: i < reservasU.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                              <td style={{ padding: '9px 12px', fontSize: 13, fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.85)' }}>{r.claseNombre}</td>
                              <td style={{ padding: '9px 12px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--muted)' }}>{r.fecha || r.claseDia}</td>
                              <td style={{ padding: '9px 12px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--muted)' }}>{r.claseHora}</td>
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
          onSuccess={() => {
            const u = usuarios.find(u => u.id === adminSeatSelector.userId)
            toast.success(`${u?.nombre ?? 'Alumno'} inscrito correctamente`)
            setAdminSeatSelector(null)
            setAlumnoAgregarId('')
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
