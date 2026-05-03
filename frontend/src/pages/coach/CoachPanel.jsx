import { useState, useEffect } from 'react'
import { useClasesStore } from '@/stores/clasesStore'
import { useCoachesStore } from '@/stores/coachesStore'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, CalendarDays,
  LogOut, ArrowLeft, X
} from 'lucide-react'
import s from './CoachPanel.module.css'

// ── Data ──────────────────────────────────────────────────────────────────────
const DAY_KEY_TO_NAME = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
  jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo',
}

const PERF_BARS = [
  { label: 'Stride Power',   pct: 90 },
  { label: 'Stride HIIT',    pct: 75 },
  { label: 'Stride Fuerza',  pct: 55 },
  { label: 'Stride Weekend', pct: 30 },
]

const hoyFecha = new Date()
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DIAS_SEMANA = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

// Calcular inicio y fin de semana actual (lunes a domingo)
const inicioSemana = new Date(hoyFecha)
inicioSemana.setDate(hoyFecha.getDate() - (hoyFecha.getDay() === 0 ? 6 : hoyFecha.getDay() - 1))
const finSemana = new Date(inicioSemana)
finSemana.setDate(inicioSemana.getDate() + 6)

const SECTION_META = {
  dashboard:    { 
    title: 'Dashboard',  
    sub: `${DIAS_SEMANA[hoyFecha.getDay()]}, ${hoyFecha.getDate()} de ${MESES[hoyFecha.getMonth()]} · Casa Scarlatta` 
  },
  'mis-clases': { 
    title: 'Mis Clases', 
    sub: `Semana del ${inicioSemana.getDate()} al ${finSemana.getDate()} de ${MESES[finSemana.getMonth()]}` 
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function availColor(booked, cap) {
  const ratio = booked / cap
  if (ratio >= 0.9) return 'red'
  if (ratio >= 0.6) return 'orange'
  return 'green'
}

function classStatusLabel(booked, cap) {
  const ratio = booked / cap
  if (ratio >= 1)   return { label: 'Clase llena',  cls: 'danger'  }
  if (ratio >= 0.8) return { label: 'Casi llena',   cls: 'warning' }
  return              { label: 'Con espacio',   cls: 'success' }
}

function statusColor(cls) {
  if (cls === 'danger')  return { background:'rgba(232,90,90,0.12)',  color:'#E85A5A', border:'1px solid rgba(232,90,90,0.2)' }
  if (cls === 'warning') return { background:'rgba(232,146,74,0.12)', color:'#E8924A', border:'1px solid rgba(232,146,74,0.2)' }
  return                        { background:'rgba(92,185,122,0.12)', color:'#5CB97A', border:'1px solid rgba(92,185,122,0.2)' }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CoachPanel() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('dashboard')
  const KEYS = ['dom','lun','mar','mie','jue','vie','sab']
  const [selectedDay, setSelectedDay] = useState(KEYS[new Date().getDay()])
  const [modalClass, setModalClass]       = useState(null)  // class object | null
  const { usuario } = useAuth()
  const { clases } = useClasesStore()
  const { coaches } = useCoachesStore()
  // Buscar el coach por email para obtener su id real
  const coachData = coaches.find(c => c.email === usuario?.email)
  const misClases = clases.filter(c => c.coachNombre === coachData?.nombre)
  const hoy = new Date()
  const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const diaHoy = DIAS[hoy.getDay()]
  const clasesHoy = misClases.filter(c => c.dia === diaHoy)
  const WEEK_DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(inicioSemana)
  d.setDate(inicioSemana.getDate() + i)
  const keys = ['lun','mar','mie','jue','vie','sab','dom']
  const names = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
  const clasesDelDia = misClases.filter(c => c.dia === DIAS_SEMANA[d.getDay()])
  return {
    key:   keys[i],
    name:  names[i],
    num:   d.getDate(),
    count: clasesDelDia.length > 0 ? `${clasesDelDia.length} clase${clasesDelDia.length > 1 ? 's' : ''}` : '—',
  }
})
  // ESC closes modal
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setModalClass(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const meta = SECTION_META[activeSection]

  function openModal(cls) { setModalClass(cls) }
  function closeModal()   { setModalClass(null) }

  const navLinks = [
    { key: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard',  badge: null },
    { key: 'mis-clases', icon: CalendarDays, label: 'Mis Clases', badge: misClases.length > 0 ? String(misClases.length) : null },
  ]

  return (
    <div className={s.root}>
      {/* ── SIDEBAR ── */}
      <aside className={s.sidebar}>
        <div className={s.sidebarLogo}>
          <span className={s.logoBrand}>casa</span>
          <span className={s.logoStudio}>Scarlatta</span>
          <span className={s.logoBadge}>Coach</span>
        </div>

        <nav className={s.navSection}>
          <div className={s.navLabel}>Principal</div>
          {navLinks.map(({ key, icon: Icon, label, badge }) => (
            <button
              key={key}
              className={`${s.navItem} ${activeSection === key ? s.active : ''}`}
              onClick={() => setActiveSection(key)}
            >
              <span className={s.navIcon}><Icon size={16} strokeWidth={1.8} /></span>
              {label}
              {badge && <span className={s.badgeCount}>{badge}</span>}
            </button>
          ))}
        </nav>

        <div className={s.sidebarFooter}>
          <button className={s.logoutBtn} onClick={() => navigate('/login')}>
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
          <div className={s.topbarLeft}>
            <h1>{meta.title}</h1>
            <p>{meta.sub}</p>
          </div>
          <div className={s.topbarRight}>
            <div className={s.topbarProfile}>
              <div>
                <div className={s.coachName}>Coach · {usuario?.nombre ?? 'Coach'}</div>
                <div className={s.coachRole}>{usuario?.especialidad ?? ''}</div>
              </div>
              <div className={s.coachAvatar} style={{ width:36, height:36, fontSize:15, overflow:'hidden', padding:0 }}> 
                {usuario?.foto
                 ? <img src={usuario.foto} alt={usuario.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                 : usuario?.nombre?.charAt(0).toUpperCase() ?? 'C'}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className={s.content}>

          {/* ═══ DASHBOARD ═══ */}
          <div className={`${s.section} ${activeSection === 'dashboard' ? s.active : ''}`}>
            {/* Greeting */}
            <div className={s.greeting}>
              <h1 className={s.greetingTitle}>Hola, {usuario?.nombre?.split(' ')[0] ?? 'Coach'} 👋</h1>
              <p className={s.greetingSub}>
                Tienes <strong style={{ color:'var(--blush)' }}>{clasesHoy.length} {clasesHoy.length === 1 ? 'clase' : 'clases'}</strong> hoy · {diaHoy}, {hoy.getDate()} de {['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][hoy.getMonth()]}
              </p>
            </div>

            {/* Today + Quick perf */}
            <div className={s.grid3}>
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <div>
                    <div className={s.cardTitle}>Clases de hoy</div>
                    <div className={s.cardSubtitle}>{diaHoy}, {hoy.getDate()} de {['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][hoy.getMonth()]}</div>
                  </div>
                  <span className={`${s.pill} ${s.pillStride}`}>{clasesHoy.length} {clasesHoy.length === 1 ? 'clase' : 'clases'}</span>
                </div>
                <div className={s.cardBody}>
                  {clasesHoy.map(cls => {
                    const booked = cls.cupoActual
                    const cap = cls.cupoMax
                    const color = availColor(booked, cap)
                    return (
                      <div key={cls.id} className={s.classCardToday} onClick={() => openModal(cls)}>
                        <div className={s.classTimeBlock}>
                          <div className={s.classTime}>{cls.hora}</div>
                          <div className={s.classDuration}>60 min</div>
                        </div>
                        <div className={s.classDivider} />
                        <div className={s.classInfo}>
                          <div className={s.className}>{cls.nombre}</div>
                          <div className={s.classMeta}>
                            <span className={`${s.pill} ${s.pillStride}`}>Stride</span>
                            <span className={s.classLocation}>Sala Principal</span>
                          </div>
                        </div>
                        <div className={s.classAvailability}>
                          <div className={`${s.availCount} ${s[color]}`}>{cls.cupoActual} / {cls.cupoMax}</div>
                          <div className={s.availBar}>
                            <div className={`${s.availFill} ${s[color]}`} style={{ width: `${cls.cupoActual / cls.cupoMax * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick performance */}
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <div>
                    <div className={s.cardTitle}>Esta semana</div>
                    <div className={s.cardSubtitle}>Ocupación por clase</div>
                  </div>
                </div>
                <div className={s.cardBody}>
                  {PERF_BARS.map(({ label, pct }) => (
                    <div key={label} className={s.perfRow}>
                      <div className={s.perfLabel}>{label}</div>
                      <div className={s.perfBar}><div className={s.perfFill} style={{ width: `${pct}%` }} /></div>
                      <div className={s.perfPct}>{pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full week table */}
            <div className={s.card}>
              <div className={s.cardHeader}>
                <div>
                  <div className={s.cardTitle}>Todas mis clases esta semana</div>
                  <div className={s.cardSubtitle}>Semana del 21 al 27 de abril</div>
                </div>
              </div>
              <WeekTable classes={misClases} onOpen={openModal} />
            </div>
          </div>

          {/* ═══ MIS CLASES ═══ */}
          <div className={`${s.section} ${activeSection === 'mis-clases' ? s.active : ''}`}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:30, fontStyle:'italic', fontWeight:400 }}>Mis Clases</h1>
              <p style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>Alumnos inscritos en tus clases</p>
            </div>

            {/* Week nav */}
            <div className={s.weekNav}>
              {WEEK_DAYS.map(d => (
                <button
                  key={d.key}
                  className={`${s.weekDayBtn} ${selectedDay === d.key ? s.active : ''}`}
                  onClick={() => setSelectedDay(d.key)}
                >
                  <div className={s.wdbName}>{d.name}</div>
                  <div className={s.wdbNum}>{d.num}</div>
                  <div className={s.wdbCount}>{d.count}</div>
                </button>
              ))}
            </div>

            {/* All classes table */}
            {(() => {
              const dayName = DAY_KEY_TO_NAME[selectedDay]
              const filtered = misClases.filter(c => c.dia === dayName)
              return filtered.length > 0 ? (
                <div className={s.card}>
                  <MisClasesTable classes={filtered} onOpen={openModal} />
                </div>
              ) : (
                <div className={s.card}>
                  <div style={{ textAlign:'center', padding:'48px 24px' }}>
                    <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>📅</div>
                    <p style={{ fontFamily:'var(--font-display)', fontSize:18, fontStyle:'italic', color:'rgba(255,255,255,0.5)', marginBottom:6 }}>Sin clases este día</p>
                    <p style={{ fontSize:12, color:'var(--muted)' }}>No tienes clases programadas para el {dayName.toLowerCase()}</p>
                  </div>
                </div>
              )
            })()}
          </div>

        </div>{/* /content */}
      </main>

      {/* ── MODAL ── */}
      <div
        className={`${s.modalOverlay} ${modalClass ? s.open : ''}`}
        onClick={e => { if (e.target === e.currentTarget) closeModal() }}
      >
        {modalClass && <ClassModal cls={modalClass} onClose={closeModal} />}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function WeekTable({ classes, onOpen }) {
  const s2 = s
  const hoy = new Date()
  const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const diaHoy = DIAS[hoy.getDay()]
  return (
    <table className={s2.weekTable}>
      <thead>
        <tr>
          <th>Día</th>
          <th>Hora</th>
          <th>Clase</th>
          <th>Tipo</th>
          <th>Alumnos</th>
          <th>Ocupación</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {classes.map(cls => {
          const color = availColor(cls.cupoActual, cls.cupoMax)
          const esHoy = cls.dia === diaHoy          
          return (
            <tr
              key={cls.id}
              className={esHoy ? s2.todayRow : ''}
              style={{ cursor:'pointer' }}
              onClick={() => onOpen(cls)}
            >
              <td>
                {esHoy
                   ? <strong style={{ color:'var(--blush)' }}>{cls.dia} · hoy</strong>
                  : (() => {
                    const idx = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].indexOf(cls.dia)
                    const d = new Date()
                    const hoyIdx = d.getDay()
                    const diff = idx - hoyIdx
                    const fecha = new Date(d)
                    fecha.setDate(d.getDate() + (diff >= 0 ? diff : diff + 7))
                    const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
                    return `${cls.dia} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`
                  })()
                }
              </td>
              <td><span className={s2.mono} style={{ color:'var(--blush)' }}>{cls.hora}</span></td>
              <td style={{ fontWeight:500, color:'#fff' }}>{cls.nombre}</td>
              <td><span className={`${s2.pill} ${cls.tipo === 'Stride' ? s2.pillStride : s2.pillSlow}`}>{cls.tipo}</span></td>
              <td><span className={`${s2.mono} ${s2[color]}`} style={{ fontSize:13 }}>{cls.cupoActual} / {cls.cupoMax}</span></td>
              <td>
                <div className={s2.availBar} style={{ width:60 }}>
                  <div className={`${s2.availFill} ${s2[color]}`} style={{ width:`${cls.cupoActual/cls.cupoMax*100}%` }} />
                </div>
              </td>
              <td>
                <button
                  className={s2.btnSm}
                  onClick={e => { e.stopPropagation(); onOpen(cls) }}
                >
                  Ver alumnos
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function MisClasesTable({ classes, onOpen }) {
  const s2 = s
  const hoy = new Date()
  const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const diaHoy = DIAS[hoy.getDay()]
  return (
    <table className={s2.weekTable}>
      <thead>
        <tr>
          <th>Día</th>
          <th>Hora</th>
          <th>Clase</th>
          <th>Tipo</th>
          <th>Inscritos</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {classes.map(cls => {
          const color = availColor(cls.cupoActual, cls.cupoMax)
          const { label, cls: stCls } = classStatusLabel(cls.cupoActual, cls.cupoMax)
          const stStyle = statusColor(stCls)
          const esHoy = cls.dia === diaHoy
          return (
            <tr
              key={cls.id}
              className={esHoy ? s2.todayRow : ''}
              style={{ cursor:'pointer' }}
              onClick={() => onOpen(cls)}
            >
              <td>
                {esHoy
                  ? <strong style={{ color: 'var(--blush)' }}>{cls.dia} · hoy</strong>
                  : (() => {
                  const idx = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].indexOf(cls.dia)
                  const d = new Date()
                  const hoyIdx = d.getDay()
                  const diff = idx - hoyIdx
                  const fecha = new Date(d)
                  fecha.setDate(d.getDate() + (diff >= 0 ? diff : diff + 7))
                  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
                  return `${cls.dia} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`
                })()
                }
              </td>
              <td><span className={s2.mono} style={{ color: 'var(--blush)' }}>{cls.hora}</span></td>
              <td style={{ fontWeight:500, color:'#fff' }}>{cls.nombre}</td>
              <td><span className={`${s2.pill} ${cls.tipo === 'Stride' ? s2.pillStride : s2.pillSlow}`}>{cls.tipo}</span></td>
              <td><span className={s2.mono} style={{ color: color === 'red' ? '#E85A5A' : color === 'orange' ? '#E8924A' : '#5CB97A', fontSize:13 }}>{cls.cupoActual} / {cls.cupoMax}</span></td>
              <td><span className={s2.pill} style={stStyle}>{label}</span></td>
              <td>
                <button
                  className={s2.btnSm}
                  onClick={e => { e.stopPropagation(); onOpen(cls) }}
                >
                  Ver alumnos
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function ClassModal({ cls, onClose }) {
  const s2 = s
  const { reservas } = useClasesStore()
  const alumnos = reservas.filter(r => r.claseId === cls.id && r.estado === 'confirmada')
  const avail = cls.cupoMax - cls.cupoActual
  const availColor2 = avail === 0 ? 'var(--danger)' : avail <= cls.cupoMax * 0.5 ? 'var(--warning)' : 'var(--success)'
  const { label: statusLabel, cls: stCls } = classStatusLabel(cls.cupoActual, cls.cupoMax)
  const statusClr = stCls === 'danger' ? 'var(--danger)' : stCls === 'warning' ? 'var(--warning)' : 'var(--success)'
  const dayInfo = `${cls.dia} · ${cls.hora} · ${cls.cupoActual}/${cls.cupoMax} inscritos`

  return (
    <div className={s2.modal}>
      <div className={s2.modalHeader}>
        <div>
          <div className={s2.modalTitle}>{cls.nombre}</div>
          <div className={s2.modalSub}>{dayInfo}</div>
        </div>
        <button className={s2.modalClose} onClick={onClose}><X size={14} strokeWidth={2} /></button>
      </div>
      <div className={s2.modalStats}>
        <div className={s2.modalStat}>Capacidad: <strong>{cls.cupoMax}</strong></div>
        <div className={s2.modalStat}>Inscritos: <strong>{cls.cupoActual}</strong></div>
        <div className={s2.modalStat}>Disponibles: <strong style={{ color: availColor2 }}>{avail}</strong></div>
        <div className={s2.modalStat}>Estado: <strong style={{ color: statusClr }}>{statusLabel}</strong></div>
      </div>
      <div className={s2.modalBody}>
        {alumnos.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--muted)', fontSize:13, padding:'20px 0' }}>
            No hay alumnos inscritos aún
          </p>
        ) : alumnos.map(r => (
          <div key={r.id} className={s2.studentRow}>
            <div className={s2.studentAvatar}>{r.nombreUsuario?.charAt(0) ?? '?'}</div>
            <div className={s2.studentName}>{r.nombreUsuario ?? `Usuario #${r.userId}`}</div>
            <span className={`${s2.statusBadge} ${s2.statusConfirmed}`}>Confirmado</span>
          </div>
        ))}
      </div>
      <div className={s2.modalFooter}>
        <span style={{ fontSize:12, color:'var(--muted)' }}>{cls.cupoActual} alumnos inscritos</span>
        <button className={`${s2.btn} ${s2.btnGhost}`} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}