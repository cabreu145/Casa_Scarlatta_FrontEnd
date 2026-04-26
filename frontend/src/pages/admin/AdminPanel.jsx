import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './AdminPanel.module.css'

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

// ── Main component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [modalType, setModalType]         = useState(null) // null | 'coach' | 'clase' | 'paquete' | 'usuario'
  const [cart, setCart]                   = useState([])
  const [posFilter, setPosFilter]         = useState('Todo')
  const [clasesFilter, setClasesFilter]   = useState('Todas')
  const [usersFilter, setUsersFilter]     = useState('Todos')

  // Coach form
  const [coachForm, setCoachForm] = useState({ nombre: '', especialidad: '', disciplina: '', email: '', telefono: '', bio: '', estado: 'activo' })
  // Clase form
  const [claseForm, setClaseForm] = useState({ nombre: '', tipo: 'Stride', coach: '', dia: 'Lunes', hora: '07:00', duracion: '50', cupoMax: '15', descripcion: '' })
  // Paquete form
  const [paqueteForm, setPaqueteForm] = useState({ nombre: '', tipo: 'mensual', numClases: '', precio: '', vigencia: '', descripcion: '', destacado: false })
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

  function procesarVenta() {
    if (cart.length === 0) { alert('Agrega productos a la orden primero'); return }
    alert('✅ Venta procesada exitosamente')
    clearCart()
  }

  function showSection(name) {
    setActiveSection(name)
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
            { id: 'coaches',   icon: '👤', label: 'Coaches',  badge: '5' },
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
            { id: 'usuarios',  icon: '👥', label: 'Usuarios', badge: '142' },
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
              {[
                { i: 'M',  name: 'Mafer García', spec: 'Stride · Funcional',  clases: 24, rating: 4.9, asist: '98%'  },
                { i: 'Mj', name: 'Majo Reyes',   spec: 'Slow · Pilates',      clases: 19, rating: 4.8, asist: '95%'  },
                { i: 'Ml', name: 'Mali Torres',  spec: 'Slow · Meditación',   clases: 16, rating: 4.7, asist: '100%' },
                { i: 'D',  name: 'Daya López',   spec: 'Flow · Yoga',         clases: 21, rating: 5.0, asist: '100%' },
              ].map(({ i, name, spec, clases, rating, asist }) => (
                <div key={name} className={styles.coachCard}>
                  <div className={styles.coachPhoto}>{i}</div>
                  <div className={styles.coachInfo}>
                    <div className={styles.coachName}>{name}</div>
                    <div className={styles.coachSpec}>{spec}</div>
                    <div className={styles.coachStats}>
                      <div className={styles.coachStat}>
                        <div className={styles.coachStatVal}>{clases}</div>
                        <div className={styles.coachStatLabel}>Clases</div>
                      </div>
                      <div className={styles.coachStat}>
                        <div className={styles.coachStatVal}>{rating}</div>
                        <div className={styles.coachStatLabel}>Rating</div>
                      </div>
                      <div className={styles.coachStat}>
                        <div className={styles.coachStatVal}>{asist}</div>
                        <div className={styles.coachStatLabel}>Asistencia</div>
                      </div>
                    </div>
                    <div className={styles.coachActions}>
                      <button className={styles.coachBtn}>✏️ Editar</button>
                      <button className={styles.coachBtn}>📅 Horario</button>
                    </div>
                  </div>
                </div>
              ))}
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
                {[
                  { day: 'LUN', num: 28, name: 'Stride Power',    meta: '7:00 AM · 50 min · Mafer García',  tipo: 'pink',  tipoLabel: 'Stride', spots: '8/15',  pct: 53,  statusTag: 'green',  statusLabel: 'Abierta'    },
                  { day: 'LUN', num: 28, name: 'Slow Meditación',  meta: '9:00 AM · 60 min · Majo Reyes',    tipo: 'blue',  tipoLabel: 'Slow',   spots: '15/15', pct: 100, statusTag: 'red',    statusLabel: 'Llena'      },
                  { day: 'MAR', num: 29, name: 'Stride HIIT',      meta: '7:00 PM · 50 min · Coste Méndez',  tipo: 'pink',  tipoLabel: 'Stride', spots: '5/15',  pct: 33,  statusTag: 'green',  statusLabel: 'Abierta'    },
                  { day: 'MIÉ', num: 30, name: 'Slow Pilates',     meta: '8:00 AM · 55 min · Mali Torres',   tipo: 'blue',  tipoLabel: 'Slow',   spots: '12/15', pct: 80,  statusTag: 'yellow', statusLabel: 'Casi llena' },
                ].map(({ day, num, name, meta, tipo, tipoLabel, spots, pct, statusTag, statusLabel }) => (
                  <div key={name} className={styles.claseItem}>
                    <div className={styles.claseDay}>
                      <span style={{ fontSize: 9 }}>{day}</span>
                      <span className={styles.dayNum}>{num}</span>
                    </div>
                    <div>
                      <div className={styles.claseName}>{name}</div>
                      <div className={styles.claseMeta}>{meta}</div>
                    </div>
                    <Tag color={tipo}>{tipoLabel}</Tag>
                    <div className={styles.claseSpots}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{spots} lugares</div>
                      <div className={styles.spotsBar}>
                        <div className={styles.spotsFill} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <Tag color={statusTag}>{statusLabel}</Tag>
                    <button className={`${styles.btn} ${styles.btnGhost}`} style={{ padding: '6px 12px', fontSize: 12 }}>
                      Editar
                    </button>
                  </div>
                ))}
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
              <div className={styles.paqueteCard}>
                <div className={styles.paqueteName}>Por clase</div>
                <div className={styles.paqueteClases}>1 clase individual</div>
                <div className={styles.paquetePrice}>$120<span>/clase</span></div>
                <div className={styles.paqueteStats}>
                  <div className={styles.paqueteStat}><strong>18</strong>vendidos este mes</div>
                  <div className={styles.paqueteStat}><strong>$2,160</strong>generados</div>
                </div>
              </div>
              <div className={`${styles.paqueteCard} ${styles.featured}`}>
                <div className={styles.paqueteBadge}>⭐ Más popular</div>
                <div className={styles.paqueteName}>Mensual</div>
                <div className={styles.paqueteClases}>Clases ilimitadas por mes</div>
                <div className={styles.paquetePrice}>$1,200<span>/mes</span></div>
                <div className={styles.paqueteStats}>
                  <div className={styles.paqueteStat}><strong>42</strong>activos</div>
                  <div className={styles.paqueteStat}><strong>$50,400</strong>MRR</div>
                </div>
              </div>
              <div className={styles.paqueteCard}>
                <div className={styles.paqueteName}>10 clases</div>
                <div className={styles.paqueteClases}>Válido por 60 días</div>
                <div className={styles.paquetePrice}>$850<span>/paquete</span></div>
                <div className={styles.paqueteStats}>
                  <div className={styles.paqueteStat}><strong>26</strong>activos</div>
                  <div className={styles.paqueteStat}><strong>$22,100</strong>generados</div>
                </div>
              </div>
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
                <FilterChips
                  options={['Todo', '💧 Bebidas', '🥤 Smoothies', '👕 Ropa', '🧴 Suplementos']}
                  active={posFilter}
                  onChange={setPosFilter}
                />
                <div className={styles.productGrid} style={{ marginTop: 20 }}>
                  {PRODUCTS.map((p) => (
                    <button key={p.name} className={styles.productCard} onClick={() => addToCart(p)}>
                      <div className={styles.productEmoji}>{p.emoji}</div>
                      <div className={styles.productName}>{p.name}</div>
                      <div className={styles.productPrice}>${p.price}</div>
                    </button>
                  ))}
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
                    {[
                      { i: 'S', name: 'Sofía Reyes',     pkg: 'Mensual',   clases: 'Ilimitadas', venc: '30 Abr 2026', ult: 'Hoy 7:00 AM',  total: '$4,800', tag: 'green',  label: 'Activa'       },
                      { i: 'A', name: 'Ana Torres',      pkg: '10 clases', clases: '3 clases',   venc: '14 May 2026', ult: 'Ayer 9:00 AM', total: '$2,550', tag: 'yellow', label: 'Casi agotado' },
                      { i: 'L', name: 'Lucía Mendoza',   pkg: 'Mensual',   clases: 'Ilimitadas', venc: '02 May 2026', ult: 'Hoy 9:00 AM',  total: '$6,000', tag: 'red',    label: 'Por vencer'   },
                      { i: 'V', name: 'Valentina Cruz',  pkg: 'Por clase', clases: '0 clases',   venc: '—',           ult: 'Hace 3 días',  total: '$360',   tag: 'red',    label: 'Sin paquete'  },
                    ].map(({ i, name, pkg, clases, venc, ult, total, tag, label }) => (
                      <tr key={name}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className={styles.miniAvatar} style={{ width: 28, height: 28, fontSize: 12 }}>{i}</div>
                            {name}
                          </div>
                        </td>
                        <td>{pkg}</td>
                        <td>{clases}</td>
                        <td>{venc}</td>
                        <td>{ult}</td>
                        <td className={styles.mono}>{total}</td>
                        <td><Tag color={tag}>{label}</Tag></td>
                        <td><button className={styles.coachBtn} style={{ width: 60 }}>Ver</button></td>
                      </tr>
                    ))}
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
                <label className={styles.formLabel}>Disciplina principal</label>
                <select className={styles.formSelect} value={coachForm.disciplina}
                  onChange={e => setCoachForm(f => ({ ...f, disciplina: e.target.value }))}>
                  <option value="">Seleccionar…</option>
                  <option>Stride</option>
                  <option>Slow</option>
                  <option>Flow</option>
                  <option>Pilates</option>
                  <option>Yoga</option>
                  <option>Funcional</option>
                  <option>Meditación</option>
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
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={closeModal}>Guardar Coach</button>
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
                <label className={styles.formLabel}>Tipo</label>
                <select className={styles.formSelect} value={claseForm.tipo}
                  onChange={e => setClaseForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option>Stride</option>
                  <option>Slow</option>
                  <option>Flow</option>
                  <option>Pilates</option>
                  <option>Funcional</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Coach</label>
                <select className={styles.formSelect} value={claseForm.coach}
                  onChange={e => setClaseForm(f => ({ ...f, coach: e.target.value }))}>
                  <option value="">Seleccionar coach…</option>
                  <option>Mafer García</option>
                  <option>Majo Reyes</option>
                  <option>Mali Torres</option>
                  <option>Daya López</option>
                  <option>Coste Méndez</option>
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
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={closeModal}>Cancelar</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={closeModal}>Agregar al Calendario</button>
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
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={closeModal}>Guardar Paquete</button>
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
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={closeModal}>Dar de alta</button>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}
