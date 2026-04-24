import { useState } from 'react'
import { CalendarDays, BookOpen, CreditCard, User } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { useClasesStore } from '@/stores/clasesStore'
import styles from '@/styles/dashboard.module.css'
import localStyles from './ClienteCalendario.module.css'

const clienteLinks = [
  { to: '/cliente/dashboard', icon: CalendarDays, label: 'Dashboard' },
  { to: '/cliente/calendario', icon: CalendarDays, label: 'Calendario' },
  { to: '/cliente/mis-clases', icon: BookOpen, label: 'Mis Clases' },
  { to: '/cliente/pagos', icon: CreditCard, label: 'Pagos' },
  { to: '/cliente/perfil', icon: User, label: 'Perfil' },
]

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function ClienteCalendario() {
  const { usuario, actualizarClasesPaquete } = useAuth()
  const { clases, reservas, reservarClase, getReservasByUsuario } = useClasesStore()
  const [filtro, setFiltro] = useState('Todas')
  const [confirmando, setConfirmando] = useState(null)

  const misReservas = getReservasByUsuario(usuario?.id)
  const clasesReservadasIds = new Set(
    misReservas.filter(r => r.estado === 'confirmada').map(r => r.claseId)
  )

  const claseFiltradas = filtro === 'Todas'
    ? clases
    : clases.filter(c => c.tipo === filtro)

  const confirmarReserva = () => {
    if (!confirmando) return
    if (!usuario?.clasesPaquete || usuario.clasesPaquete <= 0) {
      toast.error('Sin clases disponibles. Renueva tu paquete.')
      setConfirmando(null)
      return
    }
    const ok = reservarClase(usuario.id, confirmando.id)
    if (ok) {
      actualizarClasesPaquete(-1)
      toast.success(`Clase "${confirmando.nombre}" reservada`)
      if (confirmando.cupoMax - confirmando.cupoActual <= 3) {
        toast('Últimos lugares disponibles', { icon: '⚠️' })
      }
    } else {
      toast.error('No se pudo reservar la clase')
    }
    setConfirmando(null)
  }

  return (
    <DashboardLayout links={clienteLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Calendario</h1>
          <p className={styles.subtitle}>
            Clases disponibles — {usuario?.clasesPaquete ?? 0} créditos restantes
          </p>
        </div>

        <div className={localStyles.filtros}>
          {['Todas', 'Stride', 'Slow'].map(f => (
            <button
              key={f}
              className={`${localStyles.filtroBtn} ${filtro === f ? localStyles.filtroBtnActive : ''}`}
              onClick={() => setFiltro(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {DIAS.map(dia => {
          const clasesDia = claseFiltradas.filter(c => c.dia === dia)
          if (!clasesDia.length) return null
          return (
            <div key={dia} className={localStyles.diaSection}>
              <h3 className={localStyles.diaTitulo}>{dia}</h3>
              <div className={localStyles.clasesGrid}>
                {clasesDia.map(clase => {
                  const yaReservada = clasesReservadasIds.has(clase.id)
                  const llena = clase.cupoActual >= clase.cupoMax
                  const pocosLugares = clase.cupoMax - clase.cupoActual <= 3 && !llena
                  return (
                    <div
                      key={clase.id}
                      className={`${localStyles.claseCard} ${yaReservada ? localStyles.claseCardReservada : ''}`}
                    >
                      <div className={localStyles.claseHeader}>
                        <span className={`${styles.badge} ${clase.tipo === 'Stride' ? styles.badgeStride : styles.badgeSlow}`}>
                          {clase.tipo}
                        </span>
                        <span className={localStyles.claseHora}>{clase.hora}</span>
                      </div>
                      <div className={localStyles.claseNombre}>{clase.nombre}</div>
                      <div className={localStyles.claseInfo}>
                        {clase.coachNombre} · {clase.duracion} min
                      </div>
                      <div className={localStyles.claseCupo}>
                        {llena
                          ? 'Sin lugares'
                          : pocosLugares
                          ? `⚠ ${clase.cupoMax - clase.cupoActual} lugares`
                          : `${clase.cupoMax - clase.cupoActual} lugares`
                        }
                      </div>
                      {!yaReservada && !llena ? (
                        <button
                          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                          onClick={() => setConfirmando(clase)}
                        >
                          Reservar
                        </button>
                      ) : yaReservada ? (
                        <span className={localStyles.reservadaTag}>Reservada ✓</span>
                      ) : (
                        <span className={localStyles.llenaTag}>Clase llena</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {confirmando && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2 className={styles.modalTitle}>Confirmar reserva</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                ¿Reservar <strong>{confirmando.nombre}</strong>?
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                {confirmando.dia} · {confirmando.hora} · {confirmando.duracion} min<br />
                Coach: {confirmando.coachNombre}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--brand-wine)', marginTop: 8 }}>
                Se descontará 1 crédito de tu paquete ({usuario?.clasesPaquete} restantes)
              </p>
              <div className={styles.modalActions}>
                <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setConfirmando(null)}>
                  Cancelar
                </button>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={confirmarReserva}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
