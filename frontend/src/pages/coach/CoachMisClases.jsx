import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, LayoutDashboard, BookOpen } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { useClasesStore } from '@/stores/clasesStore'
import { useReservasStore } from '@/stores/reservasStore'
import { useUsuariosStore } from '@/stores/usuariosStore'
import {
  getWeekDays, isSameDay, formatHour, getMonthLabel,
  DAYS_ABBR, DAYS_ES,
} from '@/utils/formatters'
import styles from '@/styles/dashboard.module.css'
import s from './CoachMisClases.module.css'

const coachLinks = [
  { to: '/coach/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/coach/mis-clases', icon: BookOpen, label: 'Mis Clases' },
]

function isClasePasada(c) {
  if (c.fecha) {
    const [h, m] = (c.hora || '00:00').split(':').map(Number)
    const fin = new Date(c.fecha + 'T00:00:00')
    fin.setHours(h, m, 0, 0)
    return fin <= new Date()
  }
  const today = new Date()
  const targetDow = DAYS_ES.indexOf(c.dia)
  if (targetDow === -1) return false
  const diff = targetDow - today.getDay()
  const occurrence = new Date(today)
  occurrence.setDate(today.getDate() + diff)
  const [h, m] = (c.hora || '00:00').split(':').map(Number)
  occurrence.setHours(h, m, 0, 0)
  return occurrence <= today
}

export default function CoachMisClases() {
  const { usuario } = useAuth()
  const { getClasesByCoach } = useClasesStore()
  const { getReservasByClase } = useReservasStore()
  const { usuarios } = useUsuariosStore()

  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [claseSeleccionada, setClaseSeleccionada] = useState(null)

  const misClases = getClasesByCoach(usuario?.id)
  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset])
  const monthLabel = getMonthLabel(days)

  const dayHasClases = days.map((day) => {
    const diaNombre = DAYS_ES[day.getDay()]
    return misClases.some((c) => c.dia === diaNombre)
  })

  const clasesDelDia = useMemo(() => {
    const diaNombre = DAYS_ES[selectedDate.getDay()]
    return misClases
      .filter((c) => c.dia === diaNombre)
      .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''))
  }, [misClases, selectedDate])

  function handlePrevWeek() {
    const newOffset = weekOffset - 1
    const newDays = getWeekDays(newOffset)
    const idx = days.findIndex((d) => isSameDay(d, selectedDate))
    setWeekOffset(newOffset)
    setSelectedDate(newDays[idx >= 0 ? idx : 0])
  }

  function handleNextWeek() {
    const newOffset = weekOffset + 1
    const newDays = getWeekDays(newOffset)
    const idx = days.findIndex((d) => isSameDay(d, selectedDate))
    setWeekOffset(newOffset)
    setSelectedDate(newDays[idx >= 0 ? idx : 0])
  }

  return (
    <DashboardLayout links={coachLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Mis Clases</h1>
          <p className={styles.subtitle}>Clases asignadas y alumnos inscritos</p>
        </div>

        {/* Week navigator */}
        <div className={styles.panel} style={{ padding: '16px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button onClick={handlePrevWeek} style={NAV_BTN}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {monthLabel}
            </span>
            <button onClick={handleNextWeek} style={NAV_BTN}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {days.map((day, i) => {
              const isSelected = isSameDay(day, selectedDate)
              const isToday    = isSameDay(day, new Date())
              const hasDot     = dayHasClases[i]
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 4px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--brand-wine)' : '2px solid transparent',
                    background: isSelected ? 'var(--brand-wine-13)' : isToday ? 'var(--bg-surface)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: isSelected ? 'var(--brand-wine)' : 'var(--text-muted)',
                  }}>
                    {DAYS_ABBR[day.getDay()]}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700,
                    color: isSelected ? 'var(--brand-wine)' : isToday ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}>
                    {day.getDate()}
                  </span>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: hasDot
                      ? (isSelected ? 'var(--brand-wine)' : 'var(--text-muted)')
                      : 'transparent',
                  }} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Class cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {clasesDelDia.length === 0 ? (
            <div className={styles.panel} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
              No tienes clases este día.
            </div>
          ) : (
            clasesDelDia.map((c) => {
              const pasada  = isClasePasada(c)
              const ocupPct = Math.round((c.cupoActual / c.cupoMax) * 100)
              const barColor = ocupPct >= 75 ? '#2E7D32' : ocupPct >= 40 ? '#1565C0' : ocupPct > 0 ? '#C62828' : '#555'

              return (
                <div key={c.id} className={styles.panel} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {c.nombre}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {formatHour(c.hora)} · {c.tipo}
                      </div>
                    </div>
                    <div>
                      {pasada ? (
                        <span className={`${styles.badge} ${styles.badgeCompletada}`}>Finalizada</span>
                      ) : c.cupoActual >= c.cupoMax ? (
                        <span className={`${styles.badge} ${styles.badgeCancelada}`}>Llena</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeConfirmada}`}>Con espacio</span>
                      )}
                    </div>
                  </div>

                  {/* Occupancy bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
                        Ocupación
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {c.cupoActual} / {c.cupoMax} ({ocupPct}%)
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${ocupPct}%`, background: barColor, borderRadius: 99, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>

                  <button
                    className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                    onClick={() => setClaseSeleccionada(c)}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    Ver alumnos
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Student modal */}
        {claseSeleccionada && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: 520 }}>
              <h2 className={styles.modalTitle}>{claseSeleccionada.nombre}</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                {claseSeleccionada.dia} · {formatHour(claseSeleccionada.hora)} · {claseSeleccionada.cupoActual} / {claseSeleccionada.cupoMax} inscritos
              </p>
              {(() => {
                const alumnos = getReservasByClase(claseSeleccionada.id).map((r) => {
                  const u = usuarios.find((u) => u.id === r.userId)
                  return { id: r.id, nombre: u?.nombre ?? `Usuario #${r.userId}` }
                })
                return alumnos.length > 0 ? (
                  <ul className={s.alumnosList}>
                    {alumnos.map((alumno) => (
                      <li key={alumno.id} className={s.alumnoItem}>
                        <div className={s.alumnoAvatar}>
                          {alumno.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className={s.alumnoNombre}>{alumno.nombre}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', padding: '12px 0' }}>
                    No hay alumnos inscritos en esta clase.
                  </p>
                )
              })()}
              <div className={styles.modalActions}>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setClaseSeleccionada(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

const NAV_BTN = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32,
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--neutral-border)',
  background: 'var(--bg-base)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
}
