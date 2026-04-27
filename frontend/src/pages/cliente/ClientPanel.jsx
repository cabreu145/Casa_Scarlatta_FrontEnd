import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Home, CalendarDays, PlusCircle, User, CreditCard, LogOut, ArrowLeft,
  MapPin, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import s from './ClientPanel.module.css'

// ── Week helpers ───────────────────────────────────────────────────────────────
const DAYS_ES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const DAYS_ABBR = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function buildWeek(off) {
  const base = new Date()
  base.setDate(base.getDate() + off * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base); d.setDate(base.getDate() + i)
    return {
      fullName: DAYS_ES[d.getDay()],
      abbr:     DAYS_ABBR[d.getDay()],
      num:      d.getDate(),
      month:    d.getMonth(),
      year:     d.getFullYear(),
    }
  })
}

function weekRangeLabel(days) {
  const f = days[0], l = days[6]
  return f.month === l.month
    ? `${MONTHS_ES[f.month]} ${f.year}`
    : `${MONTHS_ES[f.month]} – ${MONTHS_ES[l.month]} ${l.year}`
}

function formatHour(time) {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'p.m.' : 'a.m.'
  const hr     = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hr}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

const AVATAR_COLORS = [
  { bg: 'rgba(123,30,43,0.13)',  text: '#7B1E2B' },
  { bg: 'rgba(194,107,122,0.18)', text: '#b05060' },
  { bg: 'rgba(154,123,107,0.18)', text: '#7A6560' },
  { bg: 'rgba(92,16,24,0.13)',   text: '#5C1018'  },
]

function avatarStyle(name) {
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

// ── Data ──────────────────────────────────────────────────────────────────────
const INITIAL_CLASSES = [
  { id: 1, title: 'Stride Power',  coach: 'Carlos Méndez', date: 'Lunes',     time: '07:00', discipline: 'STRYDE', status: 'confirmada', location: 'Sala Principal' },
  { id: 2, title: 'Slow Weekend',  coach: 'Sofía Reyes',   date: 'Sábado',    time: '10:00', discipline: 'SLOW',   status: 'cancelada',  location: 'Estudio B' },
  { id: 3, title: 'Stride HIIT',   coach: 'Carlos Méndez', date: 'Martes',    time: '19:00', discipline: 'STRYDE', status: 'pendiente',  location: 'Sala Principal' },
  { id: 4, title: 'Slow Flow',     coach: 'Sofía Reyes',   date: 'Miércoles', time: '08:00', discipline: 'SLOW',   status: 'confirmada', location: 'Estudio B' },
]

const INITIAL_AVAILABLE = [
  { id: 5,  title: 'Stride Power',  coach: 'Carlos Méndez', date: 'Lunes',     time: '07:00', discipline: 'STRYDE', spots: 4,  capacity: 20 },
  { id: 6,  title: 'Stride HIIT',   coach: 'Carlos Méndez', date: 'Martes',    time: '19:00', discipline: 'STRYDE', spots: 11, capacity: 20 },
  { id: 7,  title: 'Slow Flow',     coach: 'Sofía Reyes',   date: 'Miércoles', time: '08:00', discipline: 'SLOW',   spots: 7,  capacity: 15 },
  { id: 8,  title: 'Stride Fuerza', coach: 'Carlos Méndez', date: 'Jueves',    time: '07:00', discipline: 'STRYDE', spots: 9,  capacity: 20 },
  { id: 9,  title: 'Slow Weekend',  coach: 'Sofía Reyes',   date: 'Sábado',    time: '10:00', discipline: 'SLOW',   spots: 14, capacity: 15 },
]

const PAYMENTS = [
  { id: 1, desc: 'Paquete Esencial', date: '1 abril 2025',    amount: '$1,250' },
  { id: 2, desc: 'Paquete Esencial', date: '1 marzo 2025',    amount: '$1,250' },
  { id: 3, desc: 'Paquete Básico',   date: '1 febrero 2025',  amount: '$650'   },
  { id: 4, desc: 'Paquete Básico',   date: '1 enero 2025',    amount: '$650'   },
]

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
    ? <span className={`${s.pill} ${s.pillStride}`}>Stride</span>
    : <span className={`${s.pill} ${s.pillSlow}`}>Slow</span>
}

function StatusPill({ status }) {
  const map = {
    confirmada: s.statusConfirmada,
    cancelada:  s.statusCancelada,
    pendiente:  s.statusPendiente,
  }
  const labels = { confirmada: 'Confirmada', cancelada: 'Cancelada', pendiente: 'Pendiente' }
  return <span className={`${s.statusPill} ${map[status]}`}>{labels[status]}</span>
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ClientPanel() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [activeSection, setActiveSection] = useState('inicio')
  const [myClasses, setMyClasses]         = useState(INITIAL_CLASSES)
  const [available, setAvailable]         = useState(INITIAL_AVAILABLE)
  const [weekOff, setWeekOff]             = useState(0)
  const [dayIdx, setDayIdx]               = useState(0)
  const [resWeekOff, setResWeekOff]       = useState(0)
  const [resDayIdx, setResDayIdx]         = useState(0)

  const userName       = usuario?.nombre ?? 'Eduardo'
  const userInitial    = userName.charAt(0).toUpperCase()
  const planNombre     = usuario?.paquete ?? 'Esencial'
  const clasesTotal    = usuario?.clasesPaqueteTotal ?? 10
  const clasesRestantes = usuario?.clasesPaquete === 999 ? '∞' : (usuario?.clasesPaquete ?? 8)
  const clasesUsadas   = usuario?.clasesPaquete === 999 ? 0 : (clasesTotal - (usuario?.clasesPaquete ?? 8))
  const weekDays    = buildWeek(weekOff)
  const resWeekDays = buildWeek(resWeekOff)

  const meta = SECTION_META[activeSection]

  function goTo(section) { setActiveSection(section) }

  function cancelClass(id) {
    setMyClasses(prev => prev.map(c => c.id === id ? { ...c, status: 'cancelada' } : c))
  }

  function reserveClass(av) {
    const alreadyBooked = myClasses.find(c => c.title === av.title && c.status !== 'cancelada')
    if (alreadyBooked || av.spots === 0) return
    setAvailable(prev => prev.map(c => c.id === av.id ? { ...c, spots: c.spots - 1 } : c))
    setMyClasses(prev => [{
      id: Date.now(), title: av.title, coach: av.coach,
      date: av.date, time: av.time, discipline: av.discipline,
      status: 'confirmada', location: '',
    }, ...prev])
    goTo('clases')
  }

  const upcoming = myClasses.filter(c => c.status !== 'cancelada').slice(0, 2)
  const nextClass = upcoming[0]

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
      {/* ── SIDEBAR ── */}
      <aside className={s.sidebar}>
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
                onClick={() => goTo(key)}
              >
                <span className={s.navIcon}><Icon size={16} strokeWidth={1.8} /></span>
                {label}
                {badge > 0 && <span className={s.navBadge}>{badge}</span>}
              </button>
            ))}
          </nav>
        ))}

        <div className={s.sidebarFooter}>
          <button className={s.logoutLink} onClick={() => navigate('/login')}>
            <LogOut size={14} strokeWidth={2} />
            Cerrar sesión
          </button>
          <button className={s.backBtn} onClick={() => navigate('/')}>
            <ArrowLeft size={13} /> Volver al sitio
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={s.main}>
        {/* TOPBAR */}
        <div className={s.topbar}>
          <div>
            <div className={s.topbarTitle}>{meta.title}</div>
            <div className={s.topbarSub}>{meta.sub}</div>
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
                <div className={s.heroSub}>Bienvenido de vuelta a tu espacio · Jueves, 24 de abril</div>
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
                <div className={s.statLabel}>Clases tomadas</div>
                <div className={s.statValue}>12</div>
                <div className={s.statSub}>Este mes</div>
              </div>
              <div className={`${s.statCard} ${s.amber}`}>
                <div className={`${s.statIcon} ${s.amber}`}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div className={s.statLabel}>Canceladas</div>
                <div className={s.statValue}>{myClasses.filter(c => c.status === 'cancelada').length}</div>
                <div className={s.statSub}>Este mes</div>
              </div>
              <div className={`${s.statCard} ${s.muted}`}>
                <div className={`${s.statIcon} ${s.muted}`}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                </div>
                <div className={s.statLabel}>Paquete</div>
                <div className={s.statValue} style={{ fontSize: 22, marginTop: 4 }}>Esencial</div>
                <div className={s.statSub}>Vence 15 mayo</div>
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
                    <ClassCard key={c.id} cls={c} showCancel={false} />
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
                  <div className={s.cardSubtitle}>Abril 2025</div>
                </div>
                <div className={s.cardBody}>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Clases completadas</div>
                    <div className={s.progressWrap}>
                      <div className={s.progressLabel}><span>12 de 20 <strong>meta mensual</strong></span><strong>60%</strong></div>
                      <div className={s.progressBar}><div className={s.progressFill} style={{ width: '60%' }} /></div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Paquete utilizado</div>
                    <div className={s.progressWrap}>
                      <div className={s.progressLabel}><span>2 de 10 <strong>clases usadas</strong></span><strong>20%</strong></div>
                      <div className={s.progressBar}><div className={s.progressFill} style={{ width: '20%' }} /></div>
                    </div>
                  </div>
                  <div className={s.miniGrid}>
                    <div className={s.miniGridItem}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--wine)' }}>5</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>STRYDE</div>
                    </div>
                    <div className={s.miniGridItem}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: '#2464B4' }}>7</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>SLOW</div>
                    </div>
                    <div className={s.miniGridItem}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--ink)' }}>12</div>
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
                  {myClasses.filter(c => c.status !== 'cancelada').length} clases reservadas en total
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
                  const hasCls = myClasses.some(c => c.date === day.fullName && c.status !== 'cancelada')
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
              const dayClasses = myClasses.filter(c => c.date === day.fullName)
              return dayClasses.length > 0 ? (
                <div>
                  {dayClasses.map(c => (
                    <MisClasesCard key={c.id} cls={c} onCancel={() => cancelClass(c.id)} />
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
                  const hasCls = available.some(av => av.date === day.fullName)
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
              const dayAvail = available.filter(av => av.date === day.fullName)
              return dayAvail.length > 0 ? (
                <div className={s.pubList}>
                  {dayAvail.map(av => {
                    const alreadyBooked = myClasses.find(c => c.title === av.title && c.status !== 'cancelada')
                    const isFull  = av.spots === 0
                    const isLow   = av.spots > 0 && av.spots <= 3
                    const initials = av.coach.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    const { bg, text } = avatarStyle(av.coach)
                    return (
                      <div key={av.id} className={`${s.pubCard} ${isFull ? s.pubCardFull : ''}`}>
                        <div className={s.pubAvatarWrap}>
                          <div className={s.pubAvatar} style={{ background: bg }}>
                            <span className={s.pubAvatarInitials} style={{ color: text }}>{initials}</span>
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
                          {alreadyBooked ? (
                            <span className={`${s.statusPill} ${s.statusConfirmada}`}>Reservada</span>
                          ) : isFull ? (
                            <span className={s.pubFullTag}>LLENO</span>
                          ) : (
                            <>
                              <span className={`${s.pubAvailTag} ${isLow ? s.pubAvailLow : s.pubAvailOk}`}>
                                <span className={s.pubAvailDot} />
                                {av.spots} {av.spots === 1 ? 'lugar' : 'lugares'}
                              </span>
                              <button className={s.pubReservarBtn} onClick={() => reserveClass(av)}>
                                RESERVAR
                              </button>
                            </>
                          )}
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
          <div className={`${s.section} ${activeSection === 'perfil' ? s.active : ''}`}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontStyle: 'italic', fontWeight: 400, color: 'var(--ink)' }}>Mi Perfil</h1>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Gestiona tu información personal</p>
            </div>
            <div className={s.grid2} style={{ alignItems: 'start' }}>
              <div className={s.card}>
                <div className={s.profileAvatarWrap}>
                  <div className={s.profileAvatarLg}>E</div>
                  <div className={s.profileNameDisplay}>Eduardo Santini</div>
                  <span className={s.profilePlanTag}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0L6.12 3.45H9.76L6.82 5.57L7.94 9.02L5 6.9L2.06 9.02L3.18 5.57L0.24 3.45H3.88L5 0Z"/></svg>
                    Paquete Esencial
                  </span>
                  <div className={s.miniStats}>
                    <div>
                      <div className={s.miniStatNum}>12</div>
                      <div className={s.miniStatLabel}>Clases tomadas</div>
                    </div>
                    <div className={s.miniStatDivider} />
                    <div>
                      <div className={s.miniStatNum}>8</div>
                      <div className={s.miniStatLabel}>Disponibles</div>
                    </div>
                    <div className={s.miniStatDivider} />
                    <div>
                      <div className={s.miniStatNum}>3</div>
                      <div className={s.miniStatLabel}>Meses activo</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={s.card}>
                <div className={s.cardHeader}>
                  <div className={s.cardTitle}>Información personal</div>
                </div>
                <div className={s.cardBody}>
                  <div className={s.formRow}>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>Nombre</label>
                      <input className={s.formInput} type="text" defaultValue="Eduardo" />
                    </div>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>Apellido</label>
                      <input className={s.formInput} type="text" defaultValue="Santini" />
                    </div>
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>Correo electrónico</label>
                    <input className={s.formInput} type="email" defaultValue="eduardo.santini@mail.com" />
                  </div>
                  <div className={s.formRow}>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>Teléfono</label>
                      <input className={s.formInput} type="tel" defaultValue="+52 555 123 4567" />
                    </div>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>Género</label>
                      <select className={s.formInput}>
                        <option>Masculino</option>
                        <option>Femenino</option>
                        <option>Prefiero no decir</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                    <button className={`${s.btn} ${s.btnOutline}`} style={{ fontSize: 12, padding: '9px 20px' }}>Cancelar</button>
                    <button className={`${s.btn} ${s.btnPrimary}`} style={{ fontSize: 12, padding: '9px 20px' }}>Guardar cambios</button>
                  </div>
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
              <div className={s.planName}>Paquete Esencial</div>
              <div className={s.planClassesRow}>
                <div className={s.planClassesNum}>8</div>
                <div className={s.planClassesSub}>clases restantes</div>
              </div>
              <div className={s.planProgressBar}>
                <div className={s.planProgressFill} style={{ width: '20%' }} />
              </div>
              <div className={s.planProgressLabel}>2 de 10 clases usadas · Vence 15 de mayo 2025</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic', color: 'var(--ink)', marginBottom: 4 }}>Nuestros planes</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Elige el que mejor se adapte a tu ritmo</div>
            </div>

            <div className={`${s.grid3}`} style={{ marginBottom: 28 }}>
              <div className={s.pricingCard}>
                <div className={s.pricingName}>Básico</div>
                <div className={s.pricingClasses}>4 clases al mes</div>
                <div className={s.pricingPrice}>$650</div>
                <div className={s.pricingPeriod}>pago mensual</div>
                <div className={s.pricingFeatures}>
                  <div className={s.pricingFeature}>4 clases por mes</div>
                  <div className={s.pricingFeature}>Acceso a STRYDE y SLOW</div>
                  <div className={s.pricingFeature}>Reservación con 48h</div>
                </div>
                <button className={`${s.btnPricing} ${s.btnPricingOutline}`}>Seleccionar</button>
              </div>

              <div className={`${s.pricingCard} ${s.featured}`}>
                <span className={s.pricingTag}>Popular</span>
                <div className={s.pricingName}>Esencial</div>
                <div className={s.pricingClasses}>10 clases al mes</div>
                <div className={s.pricingPrice}>$1,250</div>
                <div className={s.pricingPeriod}>pago mensual</div>
                <div className={s.pricingFeatures}>
                  <div className={s.pricingFeature}>10 clases por mes</div>
                  <div className={s.pricingFeature}>Acceso a STRYDE y SLOW</div>
                  <div className={s.pricingFeature}>Reservación con 24h</div>
                  <div className={s.pricingFeature}>Cancelación flexible</div>
                </div>
                <button className={`${s.btnPricing} ${s.btnPricingPrimary}`}>Plan actual</button>
              </div>

              <div className={s.pricingCard}>
                <div className={s.pricingName}>Premium</div>
                <div className={s.pricingClasses}>Clases ilimitadas</div>
                <div className={s.pricingPrice}>$2,100</div>
                <div className={s.pricingPeriod}>pago mensual</div>
                <div className={s.pricingFeatures}>
                  <div className={s.pricingFeature}>Clases ilimitadas</div>
                  <div className={s.pricingFeature}>Acceso a todas las modalidades</div>
                  <div className={s.pricingFeature}>Reservación prioritaria</div>
                  <div className={s.pricingFeature}>Clase de bienvenida 1:1</div>
                </div>
                <button className={`${s.btnPricing} ${s.btnPricingOutline}`}>Seleccionar</button>
              </div>
            </div>

            <div className={s.card}>
              <div className={s.cardHeader}>
                <div className={s.cardTitle}>Historial de pagos</div>
                <div className={s.cardSubtitle}>Últimas transacciones</div>
              </div>
              <div className={s.cardBody}>
                {PAYMENTS.map(p => (
                  <div key={p.id} className={s.historyRow}>
                    <div className={s.historyIcon}>💳</div>
                    <div style={{ flex: 1 }}>
                      <div className={s.historyDesc}>{p.desc}</div>
                      <div className={s.historyDate}>{p.date}</div>
                    </div>
                    <div className={s.historyAmount}>{p.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>{/* /content */}
      </main>
    </div>
  )
}

// ── MisClasesCard sub-component ───────────────────────────────────────────────
function MisClasesCard({ cls, onCancel }) {
  const initials = cls.coach.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={s.mcCard}>
      <div className={s.mcAvatarCol}>
        <div className={s.mcAvatar}>{initials}</div>
      </div>
      <div className={s.mcTimeCol}>
        <div className={s.mcTimeVal}>{formatHour(cls.time)}</div>
        <div className={s.mcTimeSub}>50 min</div>
      </div>
      <div className={s.mcBody}>
        <div className={s.mcTitle}>{cls.title}</div>
        <div className={s.mcMeta}>{cls.coach} · {cls.location || 'Sala Principal'}</div>
        <div style={{ marginTop: 6 }}><DisciplinePill d={cls.discipline} /></div>
      </div>
      <div className={s.mcActions}>
        <StatusPill status={cls.status} />
        {cls.status === 'confirmada' && (
          <button className={s.btnCancelSm} onClick={onCancel}>Cancelar</button>
        )}
      </div>
    </div>
  )
}

// ── ClassCard sub-component ───────────────────────────────────────────────────
function ClassCard({ cls, showCancel, onCancel }) {
  return (
    <div className={s.classCard}>
      <div className={s.classDateBlock}>
        <div className={s.classDateDay}>{cls.date.slice(0, 3)}</div>
        <div className={s.classDateTime}>{cls.time}</div>
      </div>
      <div className={s.classInfo}>
        <div className={s.classTitle}>{cls.title}</div>
        <div className={s.classCoach}>{cls.coach}{cls.location ? ` · ${cls.location}` : ''}</div>
        <div style={{ marginTop: 5 }}><DisciplinePill d={cls.discipline} /></div>
      </div>
      <div className={s.classRight}>
        <StatusPill status={cls.status} />
        {showCancel && cls.status === 'confirmada' && (
          <button className={s.btnCancelSm} onClick={onCancel}>Cancelar</button>
        )}
      </div>
    </div>
  )
}
