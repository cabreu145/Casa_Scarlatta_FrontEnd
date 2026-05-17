import { useState, useMemo, useEffect } from 'react'
import PagoModal from '@/features/pagos/PagoModal'
import SeatSelector from '@/features/clases/SeatSelector'
import { useNavigate } from 'react-router-dom'
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
import { reservarClase, cancelarReserva } from '@/services/reservasService'
import { editarPerfilService }            from '@/services/usuariosService'
import { isPublished }                    from '@/services/classService'
import { logListaEsperaUnirse, logListaEsperaSalir } from '@/services/actividadService'
import {
  hoyLocal,
  DAYS_ES, DAYS_ABBR, MONTHS_ES,
  buildWeek, weekRangeLabel, formatHour, formatFechaISO,
} from '@/utils/formatters'
import s from './ClientPanel.module.css'
import MisClasesCard from './MisClasesCard'
import ClassCard from './ClassCard'

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

// ── Helpers ───────────────────────────────────────────────────────────────────
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
    no_asistio: 'No asistió',
    completada: 'Completada',
  }
  return <span className={`${s.statusPill} ${map[status] ?? ''}`}>{labels[status] ?? status}</span>
}

// ── Component ─────────────────────────────────────────────────────────────────
// Mapea una reserva al shape interno usado por MisClasesCard / ClassCard
function toClsShape(r) {
  return {
    id:         r.id,
    title:      r.claseNombre,
    coach:      r.coachNombre,
    date:       r.claseDia,
    claseFecha: r.fecha,
    time:       r.claseHora,
    discipline: !r.tipo?.toLowerCase().includes('slow') ? 'STRYDE' : 'SLOW',
    status:     r.estado,
    location:   '',
  }
}

export default function ClientPanel() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  // ── Stores ────────────────────────────────────────────────────────────────
  const { reservas } = useReservasStore()
  const { clases }   = useClasesStore()
  const { usuarios } = useUsuariosStore()
  const { coaches }   = useCoachesStore()
  const { paquetes }  = usePaquetesStore()
  const { getTransaccionesByUsuario } = useTransaccionesStore()
  const listaEsperaStore = useListaEsperaStore()

  // Historial real de pagos del usuario
  const historialPagos = usuario?.id ? getTransaccionesByUsuario(usuario.id) : []

  // Mapa nombre → foto para todos los componentes de esta página
  const coachFotoByName = useMemo(
    () => Object.fromEntries(coaches.map((c) => [c.nombre, c.foto]).filter(([, f]) => f)),
    [coaches]
  )

  // ── Secciones UI ─────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState('inicio')
  const [weekOff,    setWeekOff]    = useState(0)
  const [dayIdx,     setDayIdx]     = useState(0)
  const [resWeekOff, setResWeekOff] = useState(0)
  const [resDayIdx,  setResDayIdx]  = useState(0)
  const [pagoModal, setPagoModal] = useState(null)
  const [seatSelectorClass, setSeatSelectorClass] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isSidebarOpen])

  // ── Datos del usuario ────────────────────────────────────────────────────
  const userName        = usuario?.nombre ?? 'Cliente'
  const userInitial     = userName.charAt(0).toUpperCase()
  const planNombre      = usuario?.paquete ?? 'Sin plan'
  const clasesTotal     = usuario?.clasesPaqueteTotal ?? 0

  // Perfil completo desde el store (incluye campos que authStore no persiste)
  const perfilCompleto  = useMemo(
    () => usuarios.find((u) => u.id === usuario?.id) ?? usuario,
    [usuarios, usuario?.id]
  )

  // Estado del formulario de perfil
  const [perfilForm, setPerfilForm] = useState(null)   // se inicializa al abrir la sección
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)

  function initPerfilForm() {
    if (perfilForm) return
    const partes = (perfilCompleto?.nombre ?? '').split(' ')
    setPerfilForm({
      nombre:         partes[0] ?? '',
      apellido:       partes.slice(1).join(' '),
      email:          perfilCompleto?.email ?? '',
      telefono:       perfilCompleto?.telefono ?? '',
      genero:         perfilCompleto?.genero ?? 'Prefiero no decir',
      fechaNacimiento: perfilCompleto?.fechaNacimiento ?? '',
    })
  }

  async function handleGuardarPerfil(e) {
    e.preventDefault()
    if (!perfilForm || !usuario?.id) return
    setGuardandoPerfil(true)
    const nombre = [perfilForm.nombre, perfilForm.apellido].filter(Boolean).join(' ')
    const resultado = await editarPerfilService(usuario.id, {
      nombre,
      telefono:        perfilForm.telefono,
      genero:          perfilForm.genero,
      fechaNacimiento: perfilForm.fechaNacimiento,
    })
    if (resultado.ok) toast.success(resultado.mensaje)
    else toast.error(resultado.mensaje)
    setGuardandoPerfil(false)
  }
  const clasesRestantes = usuario?.clasesPaquete === 999 ? '∞' : (usuario?.clasesPaquete ?? 0)
  const clasesUsadas    = usuario?.clasesPaquete === 999 ? 0 : (clasesTotal - (usuario?.clasesPaquete ?? 0))
  const weekDays    = buildWeek(weekOff)
  const resWeekDays = buildWeek(resWeekOff)

  const meta = SECTION_META[activeSection]

  function goTo(section) { setActiveSection(section) }
  function goToAndClose(section) {
    setActiveSection(section)
    setIsSidebarOpen(false)
  }

  // ── Reservas del usuario ─────────────────────────────────────────────────
  const reservasUsuario = usuario?.id
    ? reservas.filter((r) => r.userId === usuario.id)
    : []

  const now   = new Date()
  const today = hoyLocal()

  // Dynamic date string for header/hero (e.g. "Miércoles, 13 de mayo")
  const fechaHoyStr = `${DAYS_ES[now.getDay()]}, ${now.getDate()} de ${MONTHS_ES[now.getMonth()].toLowerCase()}`

  // Returns the real ISO date of a recurring class based on its day-of-week,
  // so corrupted r.fecha (UTC offset bug) doesn't make a past class look future.
  function realClassDate(r) {
    const clase = clases.find(c => c.id === r.claseId)
    if (clase?.fecha) return clase.fecha          // specific-date class → trust it
    if (!clase?.dia)  return r.fecha ?? today      // no weekday info → fallback
    const targetIdx = DAYS_ES.indexOf(clase.dia)
    if (targetIdx < 0) return r.fecha ?? today
    const diff = targetIdx - now.getDay()
    const d = new Date(now)
    d.setDate(now.getDate() + diff)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  const upcomingReservas = [...reservasUsuario]
    .filter((r) => {
      if (r.estado !== 'confirmada') return false
      const hora = r.claseHora ?? clases.find(c => c.id === r.claseId)?.hora
      if (!hora) return (r.fecha ?? '') >= today
      const fechaReal = realClassDate(r)
      return new Date(fechaReal + 'T' + hora + ':00') > now
    })
    .sort((a, b) => {
      const fa = realClassDate(a), fb = realClassDate(b)
      if (fa !== fb) return fa.localeCompare(fb)
      return (a.claseHora ?? '').localeCompare(b.claseHora ?? '')
    })
    .slice(0, 2)

  const upcoming = upcomingReservas.map(r => {
    const cls = toClsShape(r)
    cls.claseFecha = realClassDate(r)   // ensure ClassCard gets the correct date
    return cls
  })
  const nextClass = upcoming[0] ?? null

  // Métricas reales para el dashboard
  const confirmadas   = reservasUsuario.filter((r) => r.estado === 'confirmada').length
  const canceladas    = reservasUsuario.filter((r) => r.estado === 'cancelada').length
  const noAsistio     = reservasUsuario.filter((r) => r.estado === 'no_asistio').length
  const clamasTomadas = reservasUsuario.filter(
    (r) => r.estado === 'completada' || r.estado === 'no_asistio'
  ).length

  // ── Métricas de progreso mensual ─────────────────────────────────────
  // [BACKEND] → GET /api/usuarios/:id/progreso?mes=YYYY-MM
  // Cuando haya backend: reemplazar este bloque por una llamada HTTP
  // y mostrar los datos del servidor directamente.

  const mesActual = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`

  const clasesTomadasEsteMes = reservasUsuario.filter(r => {
    if (r.estado !== 'completada' && r.estado !== 'confirmada') return false
    const fechaR = r.fecha ?? ''
    return fechaR.startsWith(mesActual)
  }).length

  const strideEsteMes = reservasUsuario.filter(r => {
    if (r.estado !== 'completada' && r.estado !== 'confirmada') return false
    const fechaR = r.fecha ?? ''
    return fechaR.startsWith(mesActual) && !r.tipo?.toLowerCase().includes('slow')
  }).length

  const slowEsteMes = reservasUsuario.filter(r => {
    if (r.estado !== 'completada' && r.estado !== 'confirmada') return false
    const fechaR = r.fecha ?? ''
    return fechaR.startsWith(mesActual) && r.tipo?.toLowerCase().includes('slow')
  }).length

  // [BACKEND] → Este valor debería venir del perfil del usuario
  // como usuario.metaMensual o del paquete activo.
  const metaMensual = clasesTotal > 0 && usuario?.clasesPaquete !== 999
    ? clasesTotal
    : 20

  const pctProgreso = metaMensual > 0
    ? Math.min(100, Math.round((clasesTomadasEsteMes / metaMensual) * 100))
    : 0

  const pctPaquete = clasesTotal > 0 && usuario?.clasesPaquete !== 999
    ? Math.min(100, Math.round((clasesUsadas / clasesTotal) * 100))
    : 0

  // ── Clases disponibles para reservar (solo las ya publicadas) ───────────
  const availableClases = clases.filter(isPublished).map((c) => ({
    _raw:       c,                 // referencia directa al objeto original
    id:         c.id,
    title:      c.nombre,
    coach:      c.coachNombre,
    date:       c.dia,
    fecha:      c.fecha ?? null,   // YYYY-MM-DD si clase de fecha específica, null si recurrente
    time:       c.hora,
    discipline: !c.tipo?.toLowerCase().includes('slow') ? 'STRYDE' : 'SLOW',
    spots:      Math.max(0, c.cupoMax - c.cupoActual),
    capacity:   c.cupoMax,
  }))

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleCancelReserva(reservaId) {
    const resultado = cancelarReserva(reservaId, usuario.id)
    if (resultado.ok) toast.success('Reserva cancelada')
    else toast.error(resultado.error)
  }

  function handleReserveClass(av) {
    if (!usuario?.id) return
    const resultado = reservarClase(usuario.id, av.id)
    if (!resultado.ok) {
      toast.error(resultado.error)
      return
    }
    toast.success('¡Reserva confirmada!')
    goTo('clases')
  }

  function handleUnirseListaEspera(av) {
    if (!usuario?.id) return
    const resultado = listaEsperaStore.unirse({
      claseId: av.id,
      userId:  usuario.id,
      nombre:  userName,
    })
    if (!resultado.ok) {
      toast.error(resultado.error)
      return
    }
    const posicion = listaEsperaStore.getPosicion(av.id, usuario.id)
    toast.success(
      `¡Estás en la lista de espera! Posición: ${posicion}. ` +
      `Te avisaremos si se libera un lugar.`
    )
    logListaEsperaUnirse({
      usuarioNombre: userName,
      usuarioId:     usuario.id,
      claseNombre:   av.title,
      posicion,
    })
  }

  function handleSalirListaEspera(av) {
    listaEsperaStore.salir({ claseId: av.id, userId: usuario.id })
    toast('Saliste de la lista de espera', { icon: '↩️' })
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
      {/* ── SIDEBAR ── */}
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

      {/* ── MAIN ── */}
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

          {/* ═══ INICIO ═══ */}
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
                      <div className={s.heroNextTime}>{nextClass.time}</div>
                      <div className={s.heroNextDay}>{nextClass.date}</div>
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
                  {upcoming.length > 0 ? upcoming.map(c => (
                    <ClassCard key={c.id} cls={c} showCancel={false} coachFoto={coachFotoByName[c.coach] || null} />
                  )) : (
                    <div className={s.empty}>
                      <div className={s.emptyIcon}>📅</div>
                      <div className={s.emptyText}>No tienes clases próximas</div>
                    </div>
                  )}
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

          {/* ═══ MIS CLASES ═══ */}
          <div className={`${s.section} ${activeSection === 'clases' ? s.active : ''}`}>
            <div className={s.clasesTopRow}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontStyle: 'italic', fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>Mis Clases</h1>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {reservasUsuario.filter(r => r.estado !== 'cancelada').length} clases reservadas en total
                </p>
              </div>
              <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => goTo('reservar')}>
                + Reservar clase
              </button>
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
                  const hasCls = reservasUsuario.some(r =>
                    (r.fecha ? r.fecha === day.isoDate : r.claseDia === day.fullName) && r.estado !== 'cancelada'
                  )
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
              const dayClasses = reservasUsuario
                .filter(r => r.fecha ? r.fecha === day.isoDate : r.claseDia === day.fullName)
                .map(toClsShape)
              return dayClasses.length > 0 ? (
                <div>
                  {dayClasses.map(c => (
                    <MisClasesCard key={c.id} cls={c} dayIsoDate={day.isoDate} onCancel={() => handleCancelReserva(c.id)} coachFoto={coachFotoByName[c.coach] || null} />
                  ))}
                </div>
              ) : (
                <div className={s.emptyDay}>
                  <div className={s.emptyDayIcon}>📅</div>
                  <div className={s.emptyDayTitle}>Sin clases el {day.fullName.toLowerCase()}</div>
                  <p className={s.emptyDaySub}>No tienes ninguna clase reservada este día</p>
                  <button className={`${s.btn} ${s.btnPrimary}`} style={{ marginTop: 16 }} onClick={() => goTo('reservar')}>
                    Reservar clase
                  </button>
                </div>
              )
            })()}
          </div>

          {/* ═══ RESERVAR ═══ */}
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
                  const hasCls = availableClases.some(av =>
                    av.fecha ? av.fecha === day.isoDate : av.date === day.fullName
                  )
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
              const dayAvail = availableClases.filter(av =>
                av.fecha ? av.fecha === day.isoDate : av.date === day.fullName
              )
              return dayAvail.length > 0 ? (
                <div className={s.pubList}>
                  {dayAvail.map(av => {
                    const alreadyBooked = reservasUsuario.find(r => r.claseId === av.id && r.estado === 'confirmada')
                    const isFull  = av.spots === 0
                    const isLow   = av.spots > 0 && av.spots <= 3
                    const initials  = av.coach.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    const { bg, text } = avatarStyle(av.coach)
                    const coachFoto = coachFotoByName[av.coach] || null
                    return (
                      <div key={av.id} className={`${s.pubCard} ${isFull ? s.pubCardFull : ''}`}>
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
                          <span className={s.pubTimeHour}>{formatHour(av.time)}</span>
                          <span className={s.pubTimeDur}>50 min</span>
                        </div>
                        <div className={s.pubDivider} />
                        <div className={s.pubBody}>
                          <div className={s.pubTitleRow}>
                            <span className={s.pubClassName}>{av.title}</span>
                            <span className={`${s.pubTypeBadge} ${av.discipline === 'STRYDE' ? s.pubBadgeStride : s.pubBadgeSlow}`}>
                              {av.discipline}
                            </span>
                          </div>
                          <div className={s.pubMeta}>
                            <span className={s.pubMetaItem}>{av.coach}</span>
                          </div>
                        </div>
                        <div className={s.pubActions}>
                          {(() => {
                            const classTime = new Date(day.isoDate + 'T' + av.time + ':00')
                            const isPast = classTime <= new Date()
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
                              const estaEnEspera = listaEsperaStore.estaEnLista(av.id, usuario?.id)
                              const posicion     = estaEnEspera
                                ? listaEsperaStore.getPosicion(av.id, usuario?.id)
                                : null
                              return estaEnEspera ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                  <span style={{
                                    fontSize: 11, color: '#F59E0B', fontWeight: 600,
                                    fontFamily: 'var(--font-body)',
                                  }}>
                                    ⏳ Lista de espera #{posicion}
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
                                      ⏳ Unirse a lista de espera
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
                  <p className={s.emptyDaySub}>No hay clases disponibles este día</p>
                </div>
              )
            })()}
          </div>

          {/* ═══ PERFIL ═══ */}
          <div
            className={`${s.section} ${activeSection === 'perfil' ? s.active : ''}`}
            onFocus={initPerfilForm}
            onClick={initPerfilForm}
          >
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontStyle: 'italic', fontWeight: 400, color: 'var(--ink)' }}>Mi Perfil</h1>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Gestiona tu información personal</p>
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
                          onChange={(e) => setPerfilForm((p) => ({ ...p, nombre: e.target.value }))}
                        />
                      </div>
                      <div className={s.formGroup}>
                        <label className={s.formLabel}>Apellido</label>
                        <input
                          className={s.formInput}
                          type="text"
                          value={perfilForm?.apellido ?? ''}
                          onChange={(e) => setPerfilForm((p) => ({ ...p, apellido: e.target.value }))}
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
                          onChange={(e) => setPerfilForm((p) => ({ ...p, telefono: e.target.value }))}
                        />
                      </div>
                      <div className={s.formGroup}>
                        <label className={s.formLabel}>Género</label>
                        <select
                          className={s.formInput}
                          value={perfilForm?.genero ?? 'Prefiero no decir'}
                          onChange={(e) => setPerfilForm((p) => ({ ...p, genero: e.target.value }))}
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

          {/* ═══ PAGOS ═══ */}
          <div className={`${s.section} ${activeSection === 'pagos' ? s.active : ''}`}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontStyle: 'italic', fontWeight: 400, color: 'var(--ink)' }}>Paquetes & Pagos</h1>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Administra tu plan y revisa tus pagos</p>
            </div>

            <div className={s.planCurrent}>
              <div className={s.planNameTag}>Plan activo</div>
              <div className={s.planName}>{planNombre}</div>
              <div className={s.planClassesRow}>
                <div className={s.planClassesNum}>{clasesRestantes}</div>
                <div className={s.planClassesSub}>clases restantes</div>
              </div>
              {clasesRestantes !== '∞' && clasesTotal > 0 && (
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
              {planNombre === 'Sin plan' && (
                <div className={s.planProgressLabel} style={{ color: 'var(--muted)' }}>
                  No tienes un paquete activo
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic', color: 'var(--ink)', marginBottom: 4 }}>Nuestros planes</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Elige el que mejor se adapte a tu ritmo</div>
            </div>

            <div className={`${s.grid3}`} style={{ marginBottom: 28 }}>
              {paquetes.map(p => {
                const esPlanActual = usuario?.paquete === p.nombre
                return (
                  <div key={p.id} className={`${s.pricingCard} ${p.destacado ? s.featured : ''}`}>
                    {p.destacado && <span className={s.pricingTag}>Popular</span>}
                    <div className={s.pricingName}>{p.nombre}</div>
                    <div className={s.pricingClasses}>
                      {p.clases === 0 ? 'Clases ilimitadas' : `${p.clases} clases al mes`}
                    </div>
                    <div className={s.pricingPrice}>${p.precio.toLocaleString()}</div>
                    <div className={s.pricingPeriod}>pago mensual</div>
                    <div className={s.pricingFeatures}>
                      {(p.beneficios || []).map((b, i) => (
                        <div key={i} className={s.pricingFeature}>{b}</div>
                      ))}
                    </div>
                    <button
                      className={`${s.btnPricing} ${esPlanActual ? s.btnPricingPrimary : s.btnPricingOutline}`}
                      onClick={() => !esPlanActual && setPagoModal(p)}
                      disabled={esPlanActual}
                     >
                      {esPlanActual ? 'Plan actual' : 'Seleccionar'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className={s.card}>
              <div className={s.cardHeader}>
                <div className={s.cardTitle}>Historial de pagos</div>
                <div className={s.cardSubtitle}>Últimas transacciones</div>
              </div>
              <div className={s.cardBody}>
                {historialPagos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>
                    No hay transacciones registradas.
                  </div>
                ) : (
                  [...historialPagos]
                    .sort((a, b) => b.fecha.localeCompare(a.fecha))
                    .map(tx => (
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
        <SeatSelector
          cls={seatSelectorClass}
          onClose={() => setSeatSelectorClass(null)}
        />
      )}
    </div>
  )
}

