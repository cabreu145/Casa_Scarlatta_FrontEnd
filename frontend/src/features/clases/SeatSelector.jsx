import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
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

export default function SeatSelector({ cls, onClose }) {
  const navigate = useNavigate()
  const { rows, cols } = LAYOUT[cls.type] ?? { rows: 4, cols: 5 }

  const occupied = useMemo(
    () => generateOccupied(rows, cols, cls.spots),
    [rows, cols, cls.spots]
  )

  const [selected, setSelected] = useState(null)

  function toggle(id) {
    setSelected(prev => (prev === id ? null : id))
  }

  function confirm() {
    navigate('/login', {
      state: { selectedClass: cls, selectedSeat: selected },
    })
  }

  const rowLabels = Array.from({ length: rows }, (_, i) => i + 1)
  const colLabels = Array.from({ length: cols }, (_, i) => i + 1)

  return (
    <div
      className={styles.backdrop}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Seleccionar asiento">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <p className={styles.headerLabel}>{cls.type} · {cls.day} · {cls.time}</p>
            <h2 className={styles.headerTitle}>{cls.name}</h2>
            <p className={styles.headerInstructor}>Coach: {cls.instructor}</p>
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

        {/* Summary / CTA */}
        <div className={styles.footer}>
          {selected ? (
            <>
              <p className={styles.summaryText}>
                Asiento seleccionado:{' '}
                <strong>{seatLabel(
                  Number(selected.split('-')[0].slice(1)),
                  Number(selected.split('-')[1].slice(1))
                )}</strong>
              </p>
              <button className={styles.confirmBtn} onClick={confirm}>
                Confirmar reserva →
              </button>
            </>
          ) : (
            <p className={styles.hintText}>Selecciona un asiento para continuar</p>
          )}
        </div>
      </div>
    </div>
  )
}
