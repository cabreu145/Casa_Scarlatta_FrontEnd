import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import styles from './AdminPanel.module.css'
import { useCoachesStore }   from '@/stores/coachesStore'
import { useProductosStore } from '@/stores/productosStore'
import { useClasesStore }    from '@/stores/clasesStore'
import { usePaquetesStore }  from '@/stores/paquetesStore'
import { useUsuariosStore }  from '@/stores/usuariosStore'
import { borrarCoachService } from '@/services/coachesService'
import { useDisciplinasStore } from '@/stores/disciplinasStore'

// ── adminLinks export (used by other admin pages) ────────────────────────────
import { LayoutDashboard, Users, UserCheck, CalendarDays, Package, BarChart2, DollarSign } from 'lucide-react'
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
  dashboard: { title: 'Dashboard',        sub: 'Resumen general · Abril 2026'       },
  coaches:   { title: 'Coaches',          sub: 'Gestión y perfiles del equipo'       },
  clases:    { title: 'Clases',           sub: 'Calendario y gestión de clases'      },
  paquetes:  { title: 'Paquetes',         sub: 'Gestión y venta de paquetes'         },
  pos:       { title: 'Punto de Venta',   sub: 'Venta de productos en estudio'       },
  usuarios:  { title: 'Usuarios',         sub: 'Gestión de miembros activos'         },
  finanzas:  { title: 'Finanzas',         sub: 'Análisis financiero mensual'         },
  reportes:  { title: 'Reportes',         sub: 'Descarga y análisis de datos'        },
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

const ABBR_DIA = { Lunes: 'LUN', Martes: 'MAR', Miércoles: 'MIÉ', Jueves: 'JUE', Viernes: 'VIE', Sábado: 'SÁB', Domingo: 'DOM' }

// ── Tag helper ───────────────────────────────────────────────────────────────
function Tag({ color, children }) {
  const cls = {
    green:  styles.tagGreen,
    red:    styles.tagRed,
    yellow: styles.tagYellow,
    blue:   styles.tagBlue,
    pink:   styles.tagPink,
  }[color] || styles.tagGreen
  return <span className={`${styles.miniTag} ${cls}`}>{children}</span>
}

// ── FilterChips ──────────────────────────────────────────────────────────────
function FilterChips({ options, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((o) => (
        <button
          key={o}
          className={`${styles.filterChip}${active === o ? ' ' + styles.active : ''}`}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

// ── Category emoji fallback ──────────────────────────────────────────────────
function categoryEmoji(categoria) {
  return { Accesorios: '🎽', Nutrición: '🧴', Equipo: '🏋️', Ropa: '👕' }[categoria] || '📦'
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [modalType, setModalType]         = useState(null) // null | 'coach' | 'clase' | 'paquete' | 'usuario'
  const { coaches, agregarCoach, editarCoach, eliminarCoach } = useCoachesStore()
  const { productos, agregarProducto,
          editarProducto, eliminarProducto }               = useProductosStore()
  const { clases, agregarClase, editarClase, eliminarClase } = useClasesStore()
  const { paquetes, agregarPaquete, editarPaquete, eliminarPaquete, marcarDestacado } = usePaquetesStore()
  const { usuarios, agregarUsuario, editarUsuario }       = useUsuariosStore()
  const { disciplinas, agregarDisciplina, eliminarDisciplina } = useDisciplinasStore()

  const [cart, setCart]                   = useState([])
  const [posFilter, setPosFilter]         = useState('Todos')
  const [clasesFilter, setClasesFilter]   = useState('Todas')
  const [usersFilter, setUsersFilter]     = useState('Todos')

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
  const [coachForm, setCoachForm] = useState({ nombre: '', especialidad: '', disciplina: '', email: '', telefono: '', bio: '', estado: 'activo' })
  // Clase form — publicarEn: ISO datetime string o '' (publicar inmediatamente)
  const [claseForm, setClaseForm] = useState({ nombre: '', tipo: '', coach: '', dia: 'Lunes', hora: '07:00', duracion: '50', cupoMax: '15', descripcion: '', publicarEn: '' })
  // Clase — editar
  const [modalEditClase,  setModalEditClase]  = useState(null)  // clase | null
  const [editClaseForm,   setEditClaseForm]   = useState({ nombre: '', tipo: '', coach: '', dia: 'Lunes', hora: '07:00', duracion: '50', cupoMax: '15', descripcion: '', publicarEn: '' })
  // Paquete form (crear)
  const [paqueteForm, setPaqueteForm] = useState({ nombre: '', tipo: 'mensual', numClases: '', precio: '', vigencia: '', descripcion: '', destacado: false })
  // Paquete — editar
  const [modalEditPaquete, setModalEditPaquete] = useState(null)
  const [editPaqueteForm,  setEditPaqueteForm]  = useState({ nombre: '', precio: '', clases: '', vigencia: '', categoria: 'mensual', destacado: false, beneficios: [] })
  const [nuevoBeneficio,   setNuevoBeneficio]   = useState('')
  // Usuario form
  const [usuarioForm, setUsuarioForm] = useState({ nombre: '', email: '', telefono: '', nacimiento: '', password: '', paquete: 'ninguno', metodoPago: 'efectivo', notas: '' })

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

  function clearCart() { setCart([]) }

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

  function procesarVenta() {
    if (cart.length === 0) { alert('Agrega productos a la orden primero'); return }
    alert('✅ Venta procesada exitosamente')
    clearCart()
  }

  function showSection(name) {
    setActiveSection(name)
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

      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
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
            { id: 'finanzas', icon: '💰', label: 'Finanzas' },
            { id: 'reportes', icon: '📄', label: 'Reportes' },
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
          <div className={styles.adminProfile}>
            <div className={styles.adminAvatar}>A</div>
            <div>
              <div className={styles.adminName}>Administrador</div>
              <div className={styles.adminRole}>Casa Scarlatta</div>
            </div>
          </div>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ← Volver al sitio
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h1>{sec.title}</h1>
            <p>{sec.sub}</p>
          </div>
          <div className={styles.topbarRight}>
            <button className={styles.notifBtn}>
              🔔
              <span className={styles.notifDot} />
            </button>
          </div>
        </header>

        <div className={styles.content}>

          {/* ── DASHBOARD ── */}
          <section className={`${styles.section}${activeSection === 'dashboard' ? ' ' + styles.active : ''}`}>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}>👥</div>
                <div className={styles.kpiLabel}>Usuarios activos</div>
                <div className={styles.kpiValue}>142</div>
                <div className={`${styles.kpiChange} ${styles.up}`}>↑ 12% vs mes anterior</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}>📦</div>
                <div className={styles.kpiLabel}>Paquetes vendidos</div>
                <div className={styles.kpiValue}>38</div>
                <div className={`${styles.kpiChange} ${styles.up}`}>↑ 8% vs mes anterior</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}>💰</div>
                <div className={styles.kpiLabel}>Ingresos del mes</div>
                <div className={styles.kpiValue}>$47K</div>
                <div className={`${styles.kpiChange} ${styles.up}`}>↑ 15% vs mes anterior</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}>🔄</div>
                <div className={styles.kpiLabel}>Tasa renovación</div>
                <div className={styles.kpiValue}>78%</div>
                <div className={`${styles.kpiChange} ${styles.down}`}>↓ 3% vs mes anterior</div>
              </div>
            </div>

            <div className={styles.dashGrid}>
              {/* Bar chart */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>Ingresos mensuales</div>
                    <div className={styles.cardSub}>Últimos 8 meses</div>
                  </div>
                  <Tag color="green">↑ 15%</Tag>
                </div>
                <div className={styles.chartBars}>
                  {[
                    { h: '55%', label: 'Sep' },
                    { h: '62%', label: 'Oct' },
                    { h: '48%', label: 'Nov' },
                    { h: '70%', label: 'Dic' },
                    { h: '65%', label: 'Ene' },
                    { h: '72%', label: 'Feb' },
                    { h: '68%', label: 'Mar' },
                    { h: '80%', label: 'Abr' },
                  ].map(({ h, label }) => (
                    <div key={label} className={styles.barWrap}>
                      <div className={styles.bar} style={{ height: h }} />
                      <div className={styles.barLabel}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Donut + top coaches */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>Distribución paquetes</div>
                    <div className={styles.cardSub}>Mes actual</div>
                  </div>
                </div>
                <div className={styles.donutWrap}>
                  <div className={styles.donut} />
                  <div className={styles.donutLegend}>
                    <div className={styles.legendItem}>
                      <div className={styles.legendDot} style={{ background: '#6B1F2A' }} />
                      <span>Mensual — 45%</span>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={styles.legendDot} style={{ background: '#E8A4AD' }} />
                      <span>Quincenal — 25%</span>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={styles.legendDot} style={{ background: 'rgba(255,255,255,0.15)' }} />
                      <span>Por clase — 30%</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div className={styles.cardSub} style={{ marginBottom: 10 }}>Top coaches por clases</div>
                  <div className={styles.miniList}>
                    {[
                      { i: 'M', name: 'Mafer', sub: 'Stride · Flow', val: '24' },
                      { i: 'D', name: 'Daya',  sub: 'Flow',          val: '19' },
                      { i: 'C', name: 'Coste', sub: 'Stride',        val: '17' },
                    ].map(({ i, name, sub, val }) => (
                      <div key={name} className={styles.miniItem}>
                        <div className={styles.miniAvatar}>{i}</div>
                        <div><div className={styles.miniName}>{name}</div><div className={styles.miniSub}>{sub}</div></div>
                        <div className={styles.miniRight}><div className={styles.miniVal}>{val}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.fullGrid}>
              {/* Clases hoy */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Clases hoy</div>
                  <Tag color="blue">4 clases</Tag>
                </div>
                <div className={styles.miniList}>
                  {[
                    { name: 'Stride Power',  meta: '7:00 AM · Mafer · 8/15 lugares',  tag: 'green', label: 'Abierta' },
                    { name: 'Slow Flow',     meta: '9:00 AM · Majo · 15/15 lugares',  tag: 'red',   label: 'Llena'   },
                    { name: 'Stride HIIT',   meta: '7:00 PM · Coste · 5/15 lugares',  tag: 'green', label: 'Abierta' },
                  ].map(({ name, meta, tag, label }) => (
                    <div key={name} className={styles.miniItem}>
                      <div className={styles.claseDay}>
                        <span style={{ fontSize: 9 }}>HOY</span>
                        <span className={styles.dayNum}>25</span>
                      </div>
                      <div><div className={styles.miniName}>{name}</div><div className={styles.miniSub}>{meta}</div></div>
                      <div className={styles.miniRight}><Tag color={tag}>{label}</Tag></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Últimas ventas */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Últimas ventas</div>
                </div>
                <div className={styles.miniList}>
                  {[
                    { i: 'S', name: 'Sofía R.',     sub: 'Paquete Mensual · hace 10 min', val: '$1,200', tag: 'green',  label: 'Pagado'   },
                    { i: 'V', name: 'Valentina C.', sub: 'Agua + Smoothie · hace 25 min', val: '$120',   tag: 'green',  label: 'Pagado'   },
                    { i: 'A', name: 'Ana T.',        sub: 'Paquete 10 clases · hace 1h',   val: '$850',   tag: 'yellow', label: 'Pendiente'},
                  ].map(({ i, name, sub, val, tag, label }) => (
                    <div key={name} className={styles.miniItem}>
                      <div className={styles.miniAvatar}>{i}</div>
                      <div><div className={styles.miniName}>{name}</div><div className={styles.miniSub}>{sub}</div></div>
                      <div className={styles.miniRight}>
                        <div className={styles.miniVal}>{val}</div>
                        <Tag color={tag}>{label}</Tag>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paquetes por vencer */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Paquetes por vencer</div>
                  <Tag color="yellow">8 usuarios</Tag>
                </div>
                <div className={styles.miniList}>
                  {[
                    { i: 'L', name: 'Lucía M.',  sub: 'Vence en 2 días · 3 clases restantes', tag: 'red',    label: 'Urgente' },
                    { i: 'P', name: 'Paula G.',  sub: 'Vence en 5 días · 1 clase restante',   tag: 'yellow', label: 'Pronto'  },
                    { i: 'R', name: 'Regina H.', sub: 'Vence en 7 días · 5 clases restantes', tag: 'yellow', label: 'Pronto'  },
                  ].map(({ i, name, sub, tag, label }) => (
                    <div key={name} className={styles.miniItem}>
                      <div className={styles.miniAvatar}>{i}</div>
                      <div><div className={styles.miniName}>{name}</div><div className={styles.miniSub}>{sub}</div></div>
                      <div className={styles.miniRight}><Tag color={tag}>{label}</Tag></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── COACHES ── */}
          <section className={`${styles.section}${activeSection === 'coaches' ? ' ' + styles.active : ''}`}>
            <div className={styles.sectionTopRow}>
              <div />
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('coach')}>
                + Agregar Coach
              </button>
            </div>
            <div className={styles.coachesGrid}>
              {coaches.map((c) => {
                const iniciales = c.nombre.split(' ').slice(0, 2).map((w) => w[0]).join('')
                return (
                  <div key={c.id} className={styles.coachCard}>
                    <div className={styles.coachPhoto} style={{ overflow: 'hidden', padding: 0 }}>
                      {c.foto
                        ? <img src={c.foto} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', borderRadius: '50%' }} />
                        : iniciales}
                    </div>
                    <div className={styles.coachInfo}>
                      <div className={styles.coachName}>{c.nombre}</div>
                      <div className={styles.coachSpec}>{c.especialidad}</div>
                      <div className={styles.coachStats}>
                        <div className={styles.coachStat}>
                          <div className={styles.coachStatVal}>{c.clases ?? 0}</div>
                          <div className={styles.coachStatLabel}>Clases</div>
                        </div>
                        <div className={styles.coachStat}>
                          <div className={styles.coachStatVal}>{c.rating ?? '—'}</div>
                          <div className={styles.coachStatLabel}>Rating</div>
                        </div>
                        <div className={styles.coachStat}>
                          <div className={styles.coachStatVal}>{c.asist ?? '—'}</div>
                          <div className={styles.coachStatLabel}>Asistencia</div>
                        </div>
                      </div>
                      <div className={styles.coachActions}>
                        <button
                          className={styles.coachBtn}
                          onClick={() => {
                            setModalEditCoach(c)
                            const parts = (c.especialidad || '').split(' · ')
                            const disc  = disciplinas.includes(parts[0]) ? parts[0] : ''
                            const esp   = disc ? parts.slice(1).join(' · ') : (c.especialidad || '')
                            setEditCoachForm({
                              nombre:       c.nombre,
                              disciplina:   disc,
                              especialidad: esp,
                              email:        c.email || '',
                              telefono:     c.telefono || '',
                              bio:          c.bio || '',
                            })
                            setEditFotoPreview(c.foto || null)
                            setEditFotoPath(c.foto || null)
                          }}
                        >Editar</button>
                        <button
                          className={styles.coachBtn}
                          onClick={() => setModalHorarioCoach(c)}
                        >Horario</button>
                        {c.activo === false ? (
                          <button
                            className={styles.coachBtn}
                            style={{ color: '#4CAF50', borderColor: '#4CAF50' }}
                            onClick={() => {
                              editarCoach(c.id, { activo: true })
                              toast.success(`${c.nombre} reactivado`)
                            }}
                          >Reactivar</button>
                        ) : (
                          <button
                            className={styles.coachBtn}
                            style={{ color: '#b45309', borderColor: '#b45309' }}
                            onClick={() => {
                              eliminarCoach(c.id)
                              toast.success(`${c.nombre} dado de baja`)
                            }}
                          >Dar de baja</button>
                        )}
                        <button
                          className={styles.coachBtn}
                          style={{ color: '#ef4444', borderColor: '#ef4444' }}
                          onClick={async () => {
                            if (!window.confirm(`¿Eliminar permanentemente a ${c.nombre}? Esta acción no se puede deshacer.`)) return
                            const resultado = await borrarCoachService(c.id)
                            if (resultado.ok) toast.success(resultado.mensaje)
                            else toast.error(resultado.mensaje)
                          }}
                        >Eliminar</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── CLASES ── */}
          <section className={`${styles.section}${activeSection === 'clases' ? ' ' + styles.active : ''}`}>
            <div className={styles.sectionTopRow}>
              <FilterChips
                options={['Todas', 'Stride', 'Slow', 'Esta semana']}
                active={clasesFilter}
                onChange={setClasesFilter}
              />
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('clase')}>
                + Nueva Clase
              </button>
            </div>
            <div className={styles.card}>
              <div className={styles.clasesList}>
                {(clasesFilter === 'Todas' || clasesFilter === 'Esta semana'
                  ? clases
                  : clases.filter((c) => c.tipo === clasesFilter)
                ).map((c) => {
                  const pct          = c.cupoMax > 0 ? Math.round((c.cupoActual / c.cupoMax) * 100) : 0
                  const statusTag    = pct >= 100 ? 'red' : pct >= 80 ? 'yellow' : 'green'
                  const statusLabel  = pct >= 100 ? 'Llena' : pct >= 80 ? 'Casi llena' : 'Abierta'
                  const isProgramada = c.publicarEn && new Date(c.publicarEn) > new Date()
                  return (
                    <div key={c.id} className={styles.claseItem} style={{ opacity: isProgramada ? 0.75 : 1 }}>
                      <div className={styles.claseDay}>
                        <span style={{ fontSize: 9 }}>{ABBR_DIA[c.dia] || c.dia}</span>
                        <span className={styles.dayNum}>—</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={styles.claseName}>
                          {c.nombre}
                          {isProgramada && (
                            <span style={{ marginLeft: 8, fontSize: 10, background: 'rgba(217,119,6,0.18)', color: '#d97706', padding: '2px 8px', borderRadius: 10, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                              🕐 Prog. {new Date(c.publicarEn).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className={styles.claseMeta}>{c.hora} · {c.duracion} min · {c.coachNombre}</div>
                      </div>
                      <Tag color={c.tipo === 'Stride' ? 'pink' : 'blue'}>{c.tipo}</Tag>
                      <div className={styles.claseSpots}>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.cupoActual}/{c.cupoMax} lugares</div>
                        <div className={styles.spotsBar}>
                          <div className={styles.spotsFill} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      {!isProgramada && <Tag color={statusTag}>{statusLabel}</Tag>}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className={`${styles.btn} ${styles.btnGhost}`}
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => {
                            setModalEditClase(c)
                            const coachNombre = c.coachNombre === 'Sin asignar' ? '' : c.coachNombre
                            setEditClaseForm({
                              nombre:      c.nombre,
                              tipo:        c.tipo,
                              coach:       coachNombre,
                              dia:         c.dia,
                              hora:        c.hora,
                              duracion:    String(c.duracion || 50),
                              cupoMax:     String(c.cupoMax || 15),
                              descripcion: c.descripcion || '',
                              publicarEn:  c.publicarEn
                                ? new Date(c.publicarEn).toISOString().slice(0, 16)
                                : '',
                            })
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnGhost}`}
                          style={{ padding: '6px 8px', fontSize: 12, color: '#ef4444' }}
                          onClick={() => {
                            if (!window.confirm(`¿Eliminar la clase "${c.nombre}"?`)) return
                            eliminarClase(c.id)
                            toast.success('Clase eliminada')
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── PAQUETES ── */}
          <section className={`${styles.section}${activeSection === 'paquetes' ? ' ' + styles.active : ''}`}>
            <div className={styles.sectionTopRow}>
              <div />
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('paquete')}>
                + Nuevo Paquete
              </button>
            </div>
            <div className={styles.paquetesGrid}>
              {paquetes.map((p) => (
                <div key={p.id} className={`${styles.paqueteCard} ${p.destacado ? styles.featured : ''}`}>
                  {p.destacado && <div className={styles.paqueteBadge}>⭐ Más popular</div>}
                  <div className={styles.paqueteName}>{p.nombre}</div>
                  <div className={styles.paqueteClases}>
                    {p.clases === 0 ? 'Clases ilimitadas' : `${p.clases} clases`}
                    {p.vigencia ? ` · ${p.vigencia}` : ''}
                  </div>
                  <div className={styles.paquetePrice}>
                    ${p.precio.toLocaleString()}<span>/{p.categoria === 'mensual' ? 'mes' : 'paquete'}</span>
                  </div>
                  <div className={styles.paqueteStats}>
                    <div className={styles.paqueteStat}><strong>{p.beneficios.length}</strong>beneficios</div>
                    <div className={styles.paqueteStat}><strong>{p.categoria}</strong></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      className={`${styles.btn} ${styles.btnGhost}`}
                      style={{ fontSize: 11, padding: '6px' }}
                      onClick={() => {
                        setModalEditPaquete(p)
                        setEditPaqueteForm({
                          nombre:    p.nombre,
                          precio:    String(p.precio),
                          clases:    String(p.clases),
                          vigencia:  p.vigencia || '',
                          categoria: p.categoria,
                          destacado: p.destacado || false,
                          beneficios: [...(p.beneficios || [])],
                        })
                      }}
                    >✏️ Editar</button>
                    <button
                      className={`${styles.btn} ${styles.btnGhost}`}
                      style={{ fontSize: 11, padding: '6px', color: '#ef4444' }}
                      onClick={() => {
                        if (!window.confirm(`¿Eliminar el paquete "${p.nombre}"?`)) return
                        eliminarPaquete(p.id)
                        toast.success(`Paquete "${p.nombre}" eliminado`)
                      }}
                    >🗑 Eliminar</button>
                    {!p.destacado && (
                      <button
                        className={`${styles.btn} ${styles.btnGhost}`}
                        style={{ fontSize: 11, padding: '6px', gridColumn: '1/-1', color: '#d97706' }}
                        onClick={() => { marcarDestacado(p.id); toast.success(`"${p.nombre}" marcado como popular`) }}
                      >⭐ Marcar popular</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>Historial de ventas de paquetes</div>
                <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: 12 }}>📥 Exportar</button>
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th><th>Paquete</th><th>Fecha compra</th>
                      <th>Vencimiento</th><th>Clases rest.</th><th>Monto</th><th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Sofía Reyes</td><td>Mensual</td><td>01 Abr 2026</td>
                      <td>30 Abr 2026</td><td>—</td>
                      <td className={styles.mono}>$1,200</td>
                      <td><Tag color="green">Activo</Tag></td>
                    </tr>
                    <tr>
                      <td>Ana Torres</td><td>10 clases</td><td>15 Mar 2026</td>
                      <td>14 May 2026</td><td>3</td>
                      <td className={styles.mono}>$850</td>
                      <td><Tag color="yellow">Casi agotado</Tag></td>
                    </tr>
                    <tr>
                      <td>Lucía Mendoza</td><td>Mensual</td><td>01 Abr 2026</td>
                      <td>30 Abr 2026</td><td>—</td>
                      <td className={styles.mono}>$1,200</td>
                      <td><Tag color="green">Activo</Tag></td>
                    </tr>
                    <tr>
                      <td>Paula González</td><td>Por clase</td><td>25 Abr 2026</td>
                      <td>—</td><td>0</td>
                      <td className={styles.mono}>$120</td>
                      <td><Tag color="blue">Usada</Tag></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ── PUNTO DE VENTA ── */}
          <section className={`${styles.section}${activeSection === 'pos' ? ' ' + styles.active : ''}`}>
            <div className={styles.posGrid}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <FilterChips
                    options={['Todos', '📦 Paquetes', 'Accesorios', 'Nutrición', 'Equipo', 'Ropa']}
                    active={posFilter}
                    onChange={setPosFilter}
                  />
                  {posFilter !== '📦 Paquetes' && (
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      style={{ fontSize: 13, padding: '6px 14px' }}
                      onClick={() => { setProdModal('nuevo'); setProdForm({ nombre: '', categoria: posFilter === 'Todos' ? 'Accesorios' : posFilter, precio: '', stock: '', emoji: '' }) }}
                    >
                      + Agregar producto
                    </button>
                  )}
                </div>
                <div className={styles.productGrid}>
                  {(posFilter === '📦 Paquetes' ? PAQUETES_POS : productos.filter(
                      (p) => p.activo && (posFilter === 'Todos' || p.categoria === posFilter)
                    )).map((p) => {
                    const isPaquete = posFilter === '📦 Paquetes'
                    const emoji  = p.emoji || categoryEmoji(p.categoria)
                    const nombre = p.nombre ?? p.name
                    const precio = p.precio ?? p.price
                    return (
                      <div key={p.id ?? p.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                          className={styles.productCard}
                          onClick={() => addToCart({ name: nombre, price: precio, emoji })}
                        >
                          <div className={styles.productEmoji}>{emoji}</div>
                          <div className={styles.productName}>{nombre}</div>
                          <div className={styles.productPrice}>${precio.toLocaleString()}</div>
                        </button>
                        {!isPaquete && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              style={{ flex: 1, fontSize: 11, padding: '3px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-muted)' }}
                              onClick={() => { setProdForm({ nombre: p.nombre, categoria: p.categoria, precio: String(p.precio), stock: String(p.stock), emoji: p.emoji || '' }); setProdModal({ producto: p }) }}
                            >✏️</button>
                            <button
                              style={{ flex: 1, fontSize: 11, padding: '3px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, cursor: 'pointer', color: '#ef4444' }}
                              onClick={() => setConfirmarEliminarProd(p)}
                            >🗑</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={styles.cartSection}>
                <div className={styles.cartTitle}>🛒 Orden actual</div>
                <div className={styles.cartItems}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 13 }}>
                      Selecciona productos para agregar
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className={styles.cartItem}>
                        <span>{item.name}</span>
                        <span className={styles.cartItemPrice}>${item.price}</span>
                        <button className={styles.cartRemoveBtn} onClick={() => removeFromCart(idx)}>×</button>
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.cartTotal}>
                  <div className={styles.cartTotalRow}><span>Subtotal</span><span>${cartSubtotal.toLocaleString()}</span></div>
                  <div className={styles.cartTotalRow}><span>IVA (16%)</span><span>${cartIva.toLocaleString()}</span></div>
                  <div className={styles.cartTotalMain}><span>Total</span><span>${cartTotal.toLocaleString()}</span></div>
                </div>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ width: '100%', justifyContent: 'center', padding: 12 }}
                  onClick={procesarVenta}
                >
                  💳 Cobrar
                </button>
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ width: '100%', justifyContent: 'center', padding: 10, marginTop: 8 }}
                  onClick={clearCart}
                >
                  Limpiar orden
                </button>
              </div>
            </div>
          </section>

          {/* ── USUARIOS ── */}
          <section className={`${styles.section}${activeSection === 'usuarios' ? ' ' + styles.active : ''}`}>
            <div className={styles.kpiGrid} style={{ marginBottom: 24 }}>
              {[
                { label: 'Total usuarios',      val: '142', change: '↑ 12 nuevos este mes',      up: true  },
                { label: 'Con paquete activo',  val: '118', change: '83% del total',              up: true  },
                { label: 'Sin paquete',         val: '24',  change: 'Por renovar',               up: false },
                { label: 'Clases esta semana',  val: '387', change: '↑ 8% vs semana anterior',   up: true  },
              ].map(({ label, val, change, up }) => (
                <div key={label} className={styles.kpiCard}>
                  <div className={styles.kpiLabel}>{label}</div>
                  <div className={styles.kpiValue}>{val}</div>
                  <div className={`${styles.kpiChange} ${up ? styles.up : styles.down}`}>{change}</div>
                </div>
              ))}
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.usersFilters}>
                  <input className={styles.searchInput} placeholder="🔍 Buscar usuario..." type="text" />
                  {['Todos', 'Activos', 'Sin paquete', 'Por vencer'].map((f) => (
                    <button
                      key={f}
                      className={`${styles.filterChip}${usersFilter === f ? ' ' + styles.active : ''}`}
                      onClick={() => setUsersFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('usuario')}>
                  + Nuevo usuario
                </button>
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th><th>Paquete</th><th>Clases restantes</th>
                      <th>Vencimiento</th><th>Última clase</th><th>Total gastado</th>
                      <th>Estado</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios
                      .filter((u) => {
                        if (usersFilter === 'Activos')     return u.activo && u.paquete
                        if (usersFilter === 'Sin paquete') return !u.paquete
                        if (usersFilter === 'Por vencer')  return u.clasesPaquete !== 999 && u.clasesPaquete > 0 && u.clasesPaquete <= 2
                        return true
                      })
                      .map((u) => {
                        const restantes = u.clasesPaquete === 999 ? 'Ilimitadas' : (u.clasesPaquete ?? 0)
                        const tag   = u.activo && u.paquete ? 'green' : !u.paquete ? 'red' : 'yellow'
                        const label = u.activo && u.paquete ? 'Activo' : !u.paquete ? 'Sin paquete' : 'Inactivo'
                        return (
                          <tr key={u.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className={styles.miniAvatar} style={{ width: 28, height: 28, fontSize: 12 }}>{u.nombre[0]}</div>
                                {u.nombre}
                              </div>
                            </td>
                            <td>{u.paquete || '—'}</td>
                            <td>{restantes}</td>
                            <td>{u.paqueteInfo?.fechaVencimiento || '—'}</td>
                            <td>—</td>
                            <td className={styles.mono}>—</td>
                            <td><Tag color={tag}>{label}</Tag></td>
                            <td><button className={styles.coachBtn} style={{ width: 60 }}>Ver</button></td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ── FINANZAS ── */}
          <section className={`${styles.section}${activeSection === 'finanzas' ? ' ' + styles.active : ''}`}>
            <div className={styles.monthSelector}>
              <button className={styles.monthBtn}>‹</button>
              <div className={styles.monthName}>Abril 2026</div>
              <button className={styles.monthBtn}>›</button>
            </div>

            <div className={styles.financeSummary}>
              <div className={`${styles.financeCard} ${styles.highlight}`}>
                <div className={styles.financeLabel}>Ingresos totales</div>
                <div className={styles.financeAmount}>$47,280</div>
                <div className={styles.financeChange}>↑ 15% vs marzo</div>
              </div>
              <div className={styles.financeCard}>
                <div className={styles.financeLabel}>Paquetes vendidos</div>
                <div className={styles.financeAmount}>38</div>
                <div style={{ fontSize: 12, color: '#4CAF50', marginTop: 6 }}>↑ 8% vs marzo</div>
              </div>
              <div className={styles.financeCard}>
                <div className={styles.financeLabel}>Punto de venta</div>
                <div className={styles.financeAmount}>$3,840</div>
                <div style={{ fontSize: 12, color: '#4CAF50', marginTop: 6 }}>↑ 22% vs marzo</div>
              </div>
            </div>

            <div className={styles.dashGrid}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Desglose por categoría</div>
                </div>
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr><th>Categoría</th><th>Unidades</th><th>Ingresos</th><th>% del total</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Paquete Mensual</td><td>18</td><td className={styles.mono}>$21,600</td><td><Tag color="pink">45.7%</Tag></td></tr>
                      <tr><td>Paquete 10 clases</td><td>14</td><td className={styles.mono}>$11,900</td><td><Tag color="blue">25.2%</Tag></td></tr>
                      <tr><td>Clases individuales</td><td>98</td><td className={styles.mono}>$9,940</td><td><Tag color="yellow">21.0%</Tag></td></tr>
                      <tr><td>Punto de venta</td><td>—</td><td className={styles.mono}>$3,840</td><td><Tag color="green">8.1%</Tag></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Métricas clave</div>
                </div>
                <div className={styles.miniList}>
                  {[
                    { icon: '👥', name: 'Nuevos usuarios',  sub: 'Este mes',          val: '+12'   },
                    { icon: '🔄', name: 'Renovaciones',     sub: 'Tasa este mes',     val: '78%'   },
                    { icon: '💸', name: 'Ticket promedio',  sub: 'Por transacción',   val: '$1,244'},
                    { icon: '📈', name: 'LTV promedio',     sub: 'Por usuario',       val: '$4,200'},
                  ].map(({ icon, name, sub, val }) => (
                    <div key={name} className={styles.miniItem}>
                      <div style={{ fontSize: 20 }}>{icon}</div>
                      <div><div className={styles.miniName}>{name}</div><div className={styles.miniSub}>{sub}</div></div>
                      <div className={styles.miniRight}><div className={styles.miniVal}>{val}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── REPORTES ── */}
          <section className={`${styles.section}${activeSection === 'reportes' ? ' ' + styles.active : ''}`}>
            <div className={styles.reportCards}>
              {[
                { icon: '💰', name: 'Reporte financiero',       desc: 'Ingresos, egresos, desglose por categoría y comparativa mensual.'         },
                { icon: '👥', name: 'Reporte de usuarios',      desc: 'Lista completa, paquetes activos, historial de clases y gasto total.'       },
                { icon: '🗓', name: 'Reporte de clases',        desc: 'Asistencia por clase, ocupación promedio y clases más populares.'           },
                { icon: '📦', name: 'Reporte de paquetes',      desc: 'Ventas por tipo de paquete, renovaciones y cancelaciones.'                  },
                { icon: '🛒', name: 'Reporte punto de venta',   desc: 'Ventas de productos, inventario y productos más vendidos.'                  },
                { icon: '👤', name: 'Reporte de coaches',       desc: 'Clases impartidas, asistencia, rating y desempeño mensual.'                 },
              ].map(({ icon, name, desc }) => (
                <div key={name} className={styles.reportCard}>
                  <div className={styles.reportIcon}>{icon}</div>
                  <div className={styles.reportName}>{name}</div>
                  <div className={styles.reportDesc}>{desc}</div>
                  <div className={styles.reportActions}>
                    <button className={styles.reportBtn}>📊 Excel</button>
                    <button className={styles.reportBtn}>📄 CSV</button>
                    <button className={styles.reportBtn}>📑 PDF</button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>Historial de reportes descargados</div>
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr><th>Reporte</th><th>Período</th><th>Formato</th><th>Generado</th><th></th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Financiero</td><td>Marzo 2026</td>
                      <td><Tag color="green">Excel</Tag></td>
                      <td>01 Abr 2026</td>
                      <td><button className={styles.coachBtn} style={{ width: 80 }}>↓ Descargar</button></td>
                    </tr>
                    <tr>
                      <td>Usuarios</td><td>Q1 2026</td>
                      <td><Tag color="blue">CSV</Tag></td>
                      <td>15 Mar 2026</td>
                      <td><button className={styles.coachBtn} style={{ width: 80 }}>↓ Descargar</button></td>
                    </tr>
                    <tr>
                      <td>Clases</td><td>Febrero 2026</td>
                      <td><Tag color="pink">PDF</Tag></td>
                      <td>01 Mar 2026</td>
                      <td><button className={styles.coachBtn} style={{ width: 80 }}>↓ Descargar</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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
                <label className={styles.formLabel}>Especialidad</label>
                <input className={styles.formInput} placeholder="Ej: Stride · Funcional" value={coachForm.especialidad}
                  onChange={e => setCoachForm(f => ({ ...f, especialidad: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Disciplina principal
                  <button
                    type="button"
                    style={{ fontSize: 10, color: 'rgba(232,164,173,0.7)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setModalDisciplinas(true)}
                  >Gestionar lista</button>
                </label>
                <select className={styles.formSelect} value={coachForm.disciplina}
                  onChange={e => setCoachForm(f => ({ ...f, disciplina: e.target.value }))}>
                  <option value="">Seleccionar…</option>
                  {disciplinas.map((d) => <option key={d}>{d}</option>)}
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
                onClick={() => {
                  if (!coachForm.nombre.trim()) return
                  const spec = [coachForm.disciplina, coachForm.especialidad].filter(Boolean).join(' · ') || 'Stride'
                  agregarCoach({
                    nombre:       coachForm.nombre,
                    especialidad: spec,
                    bio:          coachForm.bio,
                    email:        coachForm.email,
                    telefono:     coachForm.telefono,
                    foto:         coachFotoPath || null,
                  })
                  toast.success(`${coachForm.nombre} agregado`)
                  setCoachForm({ nombre: '', especialidad: '', disciplina: '', email: '', telefono: '', bio: '', estado: 'activo' })
                  setCoachFotoPreview(null)
                  setCoachFotoPath(null)
                  closeModal()
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
                  {coaches.filter(c => c.activo !== false).map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Día de la semana</label>
                <select className={styles.formSelect} value={claseForm.dia}
                  onChange={e => setClaseForm(f => ({ ...f, dia: e.target.value }))}>
                  {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(d => <option key={d}>{d}</option>)}
                </select>
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
                  })
                  const msg = claseForm.publicarEn
                    ? `Clase programada para ${new Date(claseForm.publicarEn).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}`
                    : `Clase "${claseForm.nombre}" publicada`
                  toast.success(msg)
                  setClaseForm({ nombre: '', tipo: '', coach: '', dia: 'Lunes', hora: '07:00', duracion: '50', cupoMax: '15', descripcion: '', publicarEn: '' })
                  closeModal()
                }}
              >
                {claseForm.publicarEn ? '📅 Programar' : 'Publicar ahora'}
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
                  <option value="mensual">Mensual (ilimitado)</option>
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
                <input className={styles.formInput} placeholder="Ej: Sofía Reyes" value={usuarioForm.nombre}
                  onChange={e => setUsuarioForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input className={styles.formInput} type="email" placeholder="sofia@email.com" value={usuarioForm.email}
                  onChange={e => setUsuarioForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Teléfono</label>
                <input className={styles.formInput} type="tel" placeholder="+52 55 0000 0000" value={usuarioForm.telefono}
                  onChange={e => setUsuarioForm(f => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha de nacimiento</label>
                <input className={styles.formInput} type="date" value={usuarioForm.nacimiento}
                  onChange={e => setUsuarioForm(f => ({ ...f, nacimiento: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contraseña temporal</label>
                <input className={styles.formInput} type="password" placeholder="Mínimo 8 caracteres" value={usuarioForm.password}
                  onChange={e => setUsuarioForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Paquete inicial</label>
                <select className={styles.formSelect} value={usuarioForm.paquete}
                  onChange={e => setUsuarioForm(f => ({ ...f, paquete: e.target.value }))}>
                  <option value="ninguno">Sin paquete por ahora</option>
                  <option value="individual">Por clase — $120</option>
                  <option value="10clases">10 clases — $850</option>
                  <option value="mensual">Mensual — $1,200</option>
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
                  const clasesPaquete =
                    usuarioForm.paquete === 'ninguno'  ? 0   :
                    usuarioForm.paquete === 'mensual'  ? 999 :
                    usuarioForm.paquete === '10clases' ? 10  : 1
                  agregarUsuario({
                    nombre:          usuarioForm.nombre,
                    email:           usuarioForm.email,
                    telefono:        usuarioForm.telefono,
                    fechaNacimiento: usuarioForm.nacimiento,
                    rol:             'cliente',
                    activo:          true,
                    paquete:         usuarioForm.paquete === 'ninguno' ? null : usuarioForm.paquete,
                    clasesPaquete,
                    paqueteInfo: {
                      fechaCompra: new Date().toISOString().split('T')[0],
                      estado:      'Activo',
                      tipo:        'Individual',
                    },
                    notas: usuarioForm.notas,
                  })
                  toast.success(`${usuarioForm.nombre} dado de alta`)
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
                <label className={styles.formLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Disciplina principal
                  <button
                    type="button"
                    style={{ fontSize: 10, color: 'rgba(232,164,173,0.7)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setModalDisciplinas(true)}
                  >Gestionar lista</button>
                </label>
                <select
                  className={styles.formSelect}
                  value={editCoachForm.disciplina}
                  onChange={(e) => setEditCoachForm((f) => ({ ...f, disciplina: e.target.value }))}
                >
                  <option value="">Seleccionar…</option>
                  {disciplinas.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Especialidad / descripción</label>
                <input
                  className={styles.formInput}
                  placeholder="Ej: Funcional · Hiit"
                  value={editCoachForm.especialidad}
                  onChange={(e) => setEditCoachForm((f) => ({ ...f, especialidad: e.target.value }))}
                />
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
                  const spec = [editCoachForm.disciplina, editCoachForm.especialidad].filter(Boolean).join(' · ') || 'Stride'
                  editarCoach(modalEditCoach.id, {
                    nombre:       editCoachForm.nombre,
                    especialidad: spec,
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
                  {coaches.filter(c => c.activo !== false).map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
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
                          <td><Tag color={c.tipo === 'Stride' ? 'pink' : 'blue'}>{c.tipo}</Tag></td>
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

    </div>
  )
}
