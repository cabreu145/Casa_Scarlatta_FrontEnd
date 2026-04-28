import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, CheckCircle, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/constants/routes'
import { reservarClase } from '@/services/reservasService'
import styles from './SeatSelector.module.css'

const LAYOUT = {
  Stride: { rows: 4, cols: 5 },
  Slow: { rows: 3, cols: 5 },
}

function generateOccupied(rows, cols, totalSpots) {
  const total = rows * cols
  const taken = total - totalSpots
  const ids = new Set()
  while (ids.size < taken) {
    const r = Math.floor(Math.random() * rows) + 1
    const c = Math.floor(Math.random() * cols) + 1
    ids.add(`R${r}-S${c}`)
  }
  return ids
}

function seatLabel(row, col) {
  return `Fila ${row}, Asiento ${col}`
}

function parseSeat(id) {
  return {
    row: Number(id.split('-')[0].slice(1)),
    col: Number(id.split('-')[1].slice(1)),
  }
}

export default function SeatSelector({ cls, onClose }) {
  const navigate = useNavigate()
  const { isAuthenticated, usuario } = useAuth()

  const spotsDisponibles = cls.cupoMax - cls.cupoActual
  const { rows, cols } = LAYOUT[cls.tipo] ?? { rows: 4, cols: 5 }

  const occupied = useMemo(
    () => generateOccupied(rows, cols, spotsDisponibles),
    [rows, cols, spotsDisponibles]
  )

  const [selected, setSelected] = useState(null)
  const [confirmado, setConfirmado] = useState(false)
  const [sinClases, setSinClases] = useState(false)

  const rowLabels = Array.from({ length: rows }, (_, i) => i + 1)
  const colLabels = Array.from({ length: cols }, (_, i) => i + 1)

  function toggle(id) {
    setSelected(prev => (prev === id ? null : id))
  }

  function confirm() {
    if (!isAuthenticated) {
      navigate(ROUTES.login, {
        state: { selectedClass: cls, selectedSeat: selected },
      })
      return
    }

    const { row, col } = parseSeat(selected)
    const resultado = reservarClase(usuario.id, cls.id, seatLabel(row, col))

    if (!resultado.ok) {
      if (resultado.error === 'Sin créditos disponibles') {
        setSinClases(true)
      } else {
        toast.error(resultado.error)
      }
      return
    }

    setConfirmado(true)
  }

  function handleCerrar() {
    setConfirmado(false)
    setSelected(null)
    onClose()
    navigate(ROUTES.cliente.dashboard)
  }

  if (sinClases) {
    return (
      <div className={styles.backdrop}>
        <div className={styles.noClasesModal}>
          <div className={styles.noClasesIcon}>
            <ShoppingBag size={48} strokeWidth={1.2} />
          </div>
          <h2 className={styles.noClasesTitle}>Sin clases disponibles</h2>
          <p className={styles.noClasesSub}>
            Necesitas un paquete activo para reservar. Elige el plan que
            mejor se adapte a tu ritmo.
          </p>

          {/* Mini paquetes */}
          <div className={styles.noClasesPaquetes}>
            {[
              { nombre: 'Básico', clases: '8 clases', precio: '$999' },
              { nombre: 'Esencial', clases: '16 clases', precio: '$1,499', popular: true },
              { nombre: 'Premium', clases: 'Ilimitadas', precio: '$1,999' },
            ].map((p) => (
              <div
                key={p.nombre}
                className={`${styles.noClasesPaqueteCard} ${p.popular ? styles.noClasesPaquetePopular : ''}`}
              >
                {p.popular && <span className={styles.noClasesPopularTag}>MÁS POPULAR</span>}
                <span className={styles.noClasesPaqueteNombre}>{p.nombre}</span>
                <span className={styles.noClasesPaqueteClases}>{p.clases}</span>
                <span className={styles.noClasesPaquetePrecio}>{p.precio}/mes</span>
              </div>
            ))}
          </div>

          <div className={styles.noClasesActions}>
            <button
              className={styles.noClasesBtnSecondary}
              onClick={() => { setSinClases(false); onClose() }}
            >
              Volver
            </button>
            <button
              className={styles.confirmBtn}
              onClick={() => {
                setSinClases(false)
                onClose()
                navigate(isAuthenticated ? ROUTES.cliente.pagos : ROUTES.login)
              }}
            >
              Ver paquetes →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={styles.backdrop}
      onClick={e => e.target === e.currentTarget && !confirmado && onClose()}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Seleccionar asiento">

        {/* ── Vista de éxito ── */}
        {confirmado ? (
          <div className={styles.successView}>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', top: 14, right: 14 }}>
              <X size={20} />
            </button>
            <CheckCircle size={52} strokeWidth={1.5} className={styles.successIcon} />
            <h2 className={styles.successTitle}>¡Reserva confirmada!</h2>
            <p className={styles.successSub}>
              <strong>{cls.nombre}</strong><br />
              {cls.dia} · {cls.hora} · Coach: {cls.coachNombre}
            </p>
            {selected && (
              <p className={styles.successSeat}>
                {seatLabel(parseSeat(selected).row, parseSeat(selected).col)}
              </p>
            )}
            {usuario?.clasesPaquete !== undefined && usuario.clasesPaquete !== 999 && (
              <p className={styles.successCredits}>
                Te quedan <strong>{Math.max(0, (usuario.clasesPaquete))}</strong> créditos en tu paquete
              </p>
            )}
            <button className={styles.confirmBtn} onClick={handleCerrar}>
              Ver mis clases →
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div>
                <p className={styles.headerLabel}>{cls.tipo} · {cls.dia} · {cls.hora}</p>
                <h2 className={styles.headerTitle}>{cls.nombre}</h2>
                <p className={styles.headerInstructor}>Coach: {cls.coachNombre}</p>
              </div>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            {/* Tarima */}
            <div className={styles.stage} aria-hidden="true">
              <span>TARIMA DEL COACH</span>
            </div>

            {/* Seat grid */}
            <div
              className={styles.grid}
              style={{ '--cols': cols }}
              role="group"
              aria-label="Selección de asiento"
            >
              {rowLabels.map(row =>
                colLabels.map(col => {
                  const id = `R${row}-S${col}`
                  const isOccupied = occupied.has(id)
                  const isSelected = selected === id
                  return (
                    <button
                      key={id}
                      className={[
                        styles.seat,
                        isOccupied ? styles.seatOccupied : '',
                        isSelected ? styles.seatSelected : '',
                      ].join(' ')}
                      onClick={() => !isOccupied && toggle(id)}
                      disabled={isOccupied}
                      aria-label={`${seatLabel(row, col)}${isOccupied ? ' — ocupado' : isSelected ? ' — seleccionado' : ' — disponible'}`}
                      aria-pressed={isSelected}
                    />
                  )
                })
              )}
            </div>

            {/* Legend */}
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotAvail}`} />
                Disponible
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotOccupied}`} />
                Ocupado
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotSelected}`} />
                Tu selección
              </span>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              {selected ? (
                <>
                  <p className={styles.summaryText}>
                    Asiento seleccionado:{' '}
                    <strong>{seatLabel(parseSeat(selected).row, parseSeat(selected).col)}</strong>
                  </p>
                  <button className={styles.confirmBtn} onClick={confirm}>
                    Confirmar reserva →
                  </button>
                </>
              ) : (
                <p className={styles.hintText}>Selecciona un asiento para continuar</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
