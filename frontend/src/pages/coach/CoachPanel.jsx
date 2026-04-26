import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays,
  LogOut, ArrowLeft, X
} from 'lucide-react'
import s from './CoachPanel.module.css'

// ── Data ──────────────────────────────────────────────────────────────────────
const ALL_STUDENTS = [
  { id: 1,  name: 'Eduardo Santini',  status: 'confirmed' },
  { id: 2,  name: 'Laura Jiménez',    status: 'confirmed' },
  { id: 3,  name: 'Marcos Delgado',   status: 'confirmed' },
  { id: 4,  name: 'Gabriela Vega',    status: 'confirmed' },
  { id: 5,  name: 'Roberto Flores',   status: 'pending'   },
  { id: 6,  name: 'Diana Morales',    status: 'confirmed' },
  { id: 7,  name: 'Héctor Ruiz',      status: 'confirmed' },
  { id: 8,  name: 'Ana Torres',       status: 'confirmed' },
  { id: 9,  name: 'Luis Ramírez',     status: 'confirmed' },
  { id: 10, name: 'Sofía Hernández',  status: 'confirmed' },
  { id: 11, name: 'Miguel Castillo',  status: 'pending'   },
  { id: 12, name: 'Valentina Cruz',   status: 'confirmed' },
  { id: 13, name: 'Andrés Medina',    status: 'confirmed' },
  { id: 14, name: 'Camila Ortega',    status: 'confirmed' },
  { id: 15, name: 'Fernando Soto',    status: 'confirmed' },
  { id: 16, name: 'Patricia Lima',    status: 'confirmed' },
  { id: 17, name: 'Jesús Guerrero',   status: 'pending'   },
  { id: 18, name: 'Natalia Rios',     status: 'confirmed' },
]

const CLASSES = [
  { id: 'power',   name: 'Stride Power',   day: 'Lunes',   hora: '07:00', booked: 18, cap: 20, today: false },
  { id: 'hiit',    name: 'Stride HIIT',    day: 'Martes',  hora: '19:00', booked: 15, cap: 20, today: false },
  { id: 'fuerza',  name: 'Stride Fuerza',  day: 'Jueves',  hora: '07:00', booked: 11, cap: 20, today: true  },
  { id: 'weekend', name: 'Stride Weekend', day: 'Sábado',  hora: '09:00', booked:  6, cap: 20, today: false },
]

const WEEK_DAYS = [
  { key: 'lun', name: 'Lun', num: 21, count: '1 clase' },
  { key: 'mar', name: 'Mar', num: 22, count: '1 clase' },
  { key: 'mie', name: 'Mié', num: 23, count: '—'       },
  { key: 'jue', name: 'Jue', num: 24, count: '1 clase' },
  { key: 'vie', name: 'Vie', num: 25, count: '—'       },
  { key: 'sab', name: 'Sáb', num: 26, count: '1 clase' },
  { key: 'dom', name: 'Dom', num: 27, count: '—'       },
]

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

const SECTION_META = {
  dashboard:    { title: 'Dashboard',  sub: 'Jueves, 24 de abril · Casa Scarlatta' },
  'mis-clases': { title: 'Mis Clases', sub: 'Semana del 21 al 27 de abril'         },
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
  const [selectedDay, setSelectedDay]     = useState('jue')
  const [modalClass, setModalClass]       = useState(null)  // class object | null
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
    { key: 'mis-clases', icon: CalendarDays,    label: 'Mis Clases', badge: '9'  },
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
                <div className={s.coachName}>Carlos Méndez</div>
                <div className={s.coachRole}>Coach · STRYDE</div>
              </div>
              <div className={s.coachAvatar} style={{ width:36, height:36, fontSize:15 }}>C</div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className={s.content}>

          {/* ═══ DASHBOARD ═══ */}
          <div className={`${s.section} ${activeSection === 'dashboard' ? s.active : ''}`}>
            {/* Greeting */}
            <div className={s.greeting}>
              <h1 className={s.greetingTitle}>Hola, Carlos 👋</h1>
              <p className={s.greetingSub}>
                Tienes <strong style={{ color:'var(--blush)' }}>1 clase</strong> hoy · Jueves, 24 de abril
              </p>
            </div>

            {/* Today + Quick perf */}
            <div className={s.grid3}>
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <div>
                    <div className={s.cardTitle}>Clases de hoy</div>
                    <div className={s.cardSubtitle}>Jueves, 24 de abril</div>
                  </div>
                  <span className={`${s.pill} ${s.pillStride}`}>1 clase</span>
                </div>
                <div className={s.cardBody}>
                  {CLASSES.filter(c => c.today).map(cls => {
                    const color = availColor(cls.booked, cls.cap)
                    return (
                      <div key={cls.id} className={s.classCardToday} onClick={() => openModal(cls)}>
                        <div className={s.classTimeBlock}>
                          <div className={s.classTime}>{cls.hora}</div>
                          <div className={s.classDuration}>60 min</div>
                        </div>
                        <div className={s.classDivider} />
                        <div className={s.classInfo}>
                          <div className={s.className}>{cls.name}</div>
                          <div className={s.classMeta}>
                            <span className={`${s.pill} ${s.pillStride}`}>Stride</span>
                            <span className={s.classLocation}>Sala Principal</span>
                          </div>
                        </div>
                        <div className={s.classAvailability}>
                          <div className={`${s.availCount} ${s[color]}`}>{cls.booked} / {cls.cap}</div>
                          <div className={s.availBar}>
                            <div className={`${s.availFill} ${s[color]}`} style={{ width: `${cls.booked / cls.cap * 100}%` }} />
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
              <WeekTable classes={CLASSES} onOpen={openModal} />
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
              const filtered = CLASSES.filter(c => c.day === dayName)
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
          const color = availColor(cls.booked, cls.cap)
          return (
            <tr
              key={cls.id}
              className={cls.today ? s2.todayRow : ''}
              style={{ cursor:'pointer' }}
              onClick={() => onOpen(cls)}
            >
              <td>
                {cls.today
                  ? <strong style={{ color:'var(--blush)' }}>Jueves · hoy</strong>
                  : cls.day
                }
              </td>
              <td><span className={s2.mono} style={{ color:'var(--blush)' }}>{cls.hora}</span></td>
              <td style={{ fontWeight:500, color:'#fff' }}>{cls.name}</td>
              <td><span className={`${s2.pill} ${s2.pillStride}`}>Stride</span></td>
              <td><span className={`${s2.mono} ${s2[color]}`} style={{ fontSize:13 }}>{cls.booked} / {cls.cap}</span></td>
              <td>
                <div className={s2.availBar} style={{ width:60 }}>
                  <div className={`${s2.availFill} ${s2[color]}`} style={{ width:`${cls.booked/cls.cap*100}%` }} />
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
          const color = availColor(cls.booked, cls.cap)
          const { label, cls: stCls } = classStatusLabel(cls.booked, cls.cap)
          const stStyle = statusColor(stCls)
          return (
            <tr
              key={cls.id}
              className={cls.today ? s2.todayRow : ''}
              style={{ cursor:'pointer' }}
              onClick={() => onOpen(cls)}
            >
              <td>
                {cls.today
                  ? <strong style={{ color:'var(--blush)' }}>Jueves · hoy</strong>
                  : cls.day
                }
              </td>
              <td><span className={s2.mono} style={{ color:'var(--blush)' }}>{cls.hora}</span></td>
              <td style={{ fontWeight:500, color:'#fff' }}>{cls.name}</td>
              <td><span className={`${s2.pill} ${s2.pillStride}`}>Stride</span></td>
              <td><span className={s2.mono} style={{ color: color === 'red' ? '#E85A5A' : color === 'orange' ? '#E8924A' : '#5CB97A', fontSize:13 }}>{cls.booked} / {cls.cap}</span></td>
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
  const avail = cls.cap - cls.booked
  const availColor2 = avail === 0 ? 'var(--danger)' : avail <= cls.cap * 0.5 ? 'var(--warning)' : 'var(--success)'
  const { label: statusLabel, cls: stCls } = classStatusLabel(cls.booked, cls.cap)
  const statusClr = stCls === 'danger' ? 'var(--danger)' : stCls === 'warning' ? 'var(--warning)' : 'var(--success)'
  const dayInfo = `${cls.day} · ${cls.hora} · ${cls.booked}/${cls.cap} inscritos`
  const subset = ALL_STUDENTS.slice(0, cls.booked)

  return (
    <div className={s2.modal}>
      <div className={s2.modalHeader}>
        <div>
          <div className={s2.modalTitle}>{cls.name}</div>
          <div className={s2.modalSub}>{dayInfo}</div>
        </div>
        <button className={s2.modalClose} onClick={onClose}><X size={14} strokeWidth={2} /></button>
      </div>
      <div className={s2.modalStats}>
        <div className={s2.modalStat}>Capacidad: <strong>{cls.cap}</strong></div>
        <div className={s2.modalStat}>Inscritos: <strong>{cls.booked}</strong></div>
        <div className={s2.modalStat}>Disponibles: <strong style={{ color: availColor2 }}>{avail}</strong></div>
        <div className={s2.modalStat}>Estado: <strong style={{ color: statusClr }}>{statusLabel}</strong></div>
      </div>
      <div className={s2.modalBody}>
        {subset.map(st => (
          <div key={st.id} className={s2.studentRow} style={{ borderRadius: 'var(--radius-sm)', marginBottom: 0 }}>
            <div className={s2.studentAvatar}>{st.name.charAt(0)}</div>
            <div className={s2.studentName}>{st.name}</div>
            <span className={`${s2.statusBadge} ${st.status === 'confirmed' ? s2.statusConfirmed : s2.statusPending}`}>
              {st.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
            </span>
          </div>
        ))}
      </div>
      <div className={s2.modalFooter}>
        <span style={{ fontSize:12, color:'var(--muted)' }}>{cls.booked} alumnos inscritos</span>
        <button className={`${s2.btn} ${s2.btnGhost}`} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}
