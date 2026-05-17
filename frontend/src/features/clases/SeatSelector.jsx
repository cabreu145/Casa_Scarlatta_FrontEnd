import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, CheckCircle, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/constants/routes'
import { reservarClase } from '@/services/reservasService'
import { useReservasStore } from '@/stores/reservasStore'
import { useClasesStore }   from '@/stores/clasesStore'
import styles from './SeatSelector.module.css'

// ── Stryde X room layout (dynamic) ────────────────────────────────────────────
// Treadmills are always 6 (fixed). Benches = cupoMax - 6, arranged in rows of 4.
const TREAD_COUNT = 6

function buildStrydeLayout(cupoMax) {
  const benchCount   = Math.max(0, (cupoMax || 14) - TREAD_COUNT)
  const benchRowCount = Math.ceil(benchCount / 4)
  const layout = []
  let num = 1

  for (let r = 0; r < benchRowCount; r++) {
    const seatsInRow = Math.min(4, benchCount - r * 4)
    const equipment  = []
    for (let s = 0; s < seatsInRow; s++) {
      const globalIdx = r * 4 + s
      // Last 2 benches are static-only when there are more than 4 total
      const mode = (benchCount > 4 && globalIdx >= benchCount - 2) ? 'static' : 'rotation'
      equipment.push({
        id: `R${r + 1}-S${s + 1}`,
        row: r + 1, col: s + 1,
        type: 'bench', label: 'Bench',
        num: String(num).padStart(2, '0'),
        mode,
      })
      num++
    }
    layout.push({ rowType: 'bench', ariaLabel: `Bancos fila ${r + 1}`, equipment })
  }

  // Treadmill row always last (row index = benchRowCount + 1)
  const treadRow = benchRowCount + 1
  layout.push({
    rowType: 'treadmill', ariaLabel: 'Caminadoras',
    equipment: Array.from({ length: TREAD_COUNT }, (_, i) => ({
      id: `R${treadRow}-S${i + 1}`,
      row: treadRow, col: i + 1,
      type: 'treadmill', label: 'Caminadora',
      num: String(num + i).padStart(2, '0'),
      mode: 'rotation',
    })),
  })

  return layout
}

function getEquipmentInfo(layout, id) {
  for (const row of layout) {
    const eq = row.equipment.find(e => e.id === id)
    if (eq) return eq
  }
  return null
}

// Returns the 4-block rotation sequence given the starting equipment type
function getRotationBlocks(startType) {
  return startType === 'bench'
    ? ['bench', 'treadmill', 'bench', 'treadmill']
    : ['treadmill', 'bench', 'treadmill', 'bench']
}

// ── Mini icons for rotation timeline ──────────────────────────────────────────
function BenchMini({ active }) {
  const c = active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.28)'
  return (
    <svg viewBox="0 0 22 16" fill="none" style={{ width: 20, height: 14, display: 'block', flexShrink: 0 }}>
      <rect x="1" y="1" width="20" height="7" rx="3" fill={c}/>
      <rect x="2" y="9" width="5.5" height="6" rx="2" fill={c} opacity="0.65"/>
      <rect x="14.5" y="9" width="5.5" height="6" rx="2" fill={c} opacity="0.65"/>
    </svg>
  )
}

function TreadMini({ active }) {
  const c = active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.28)'
  return (
    <svg viewBox="0 0 16 22" fill="none" style={{ width: 12, height: 18, display: 'block', flexShrink: 0 }}>
      <rect x="1" y="1"  width="14" height="7"  rx="3" fill={c}/>
      <rect x="1" y="10" width="14" height="6"  rx="2" fill={c} opacity="0.55"/>
      <rect x="1" y="17" width="14" height="4"  rx="2" fill={c} opacity="0.32"/>
    </svg>
  )
}

// ── Date formatter ────────────────────────────────────────────────────────────
const MONTHS_LONG = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DAYS_LONG   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']

function formatFecha(fecha, hora) {
  if (!fecha) return ''
  const d   = fecha instanceof Date ? fecha : new Date(fecha)
  const dow = DAYS_LONG[d.getDay()]
  const day = d.getDate()
  const month = MONTHS_LONG[d.getMonth()]
  const year  = d.getFullYear()
  const [h, m] = hora.split(':').map(Number)
  const suffix = h >= 12 ? 'p.m.' : 'a.m.'
  const hr     = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${dow.charAt(0).toUpperCase() + dow.slice(1)} ${day} de ${month} ${year} · ${hr}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

// ── Helpers (shared) ──────────────────────────────────────────────────────────
function seatLabel(row, col) { return `Fila ${row}, Asiento ${col}` }

function parseSeat(id) {
  return {
    row: Number(id.split('-')[0].slice(1)),
    col: Number(id.split('-')[1].slice(1)),
  }
}

function seatIdFromLabel(label) {
  const match = label?.match(/Fila (\d+), Asiento (\d+)/)
  return match ? `R${match[1]}-S${match[2]}` : null
}

// ── Yoga mat SVG (Slow) ───────────────────────────────────────────────────────
function YogaMatIcon({ state }) {
  const isOcc = state === 'occupied'
  const isSel = state === 'selected'

  const svgStyle = {
    width: '100%', height: '100%', display: 'block',
    opacity: isOcc ? 0.38 : 1,
    filter: isOcc
      ? 'grayscale(0.8) brightness(0.55)'
      : isSel
        ? 'drop-shadow(0 0 7px rgba(255,60,120,0.9)) drop-shadow(0 0 2px rgba(255,60,120,0.7))'
        : 'none',
  }

  return (
    <svg viewBox="0 0 219.9 161.6" xmlns="http://www.w3.org/2000/svg" style={svgStyle}>
      {/* Mat body shadow */}
      <path fill="#CC3399" d="M192.7,28.2c-26.3,9.1-57,14.9-89.1,14.3c-17.7-0.3-33.9-5.5-50-8.3L27.5,154.1c18.2,4.6,48.7,7.6,67.1,7.5c48.3-0.3,90.2-6.4,125.4-17.3L192.7,28.2z"/>
      {/* Mat body surface */}
      <path fill="#FF66CC" d="M192.4,26.1c-25.5,8.9-55.5,14.5-86.6,14c-17.2-0.3-33-5.2-48.6-7.9L45.5,150.3c16.5,2.1,33.8,3.4,51.7,3.7c45.6,0.7,87.8-5.3,122-15.9L192.4,26.1z"/>
      {/* Roll cylinder */}
      <path fill="#9966CC" d="M66.3,128.5c-3.1,0.2-6.2,0.3-9.3,0.4c-12.3,0.3-24.8,0.3-37-1.1c-5.2-0.6-10.7-1.3-15.5-3.4c-7.9-3.5-3.2-15.1-1.6-21.7c1.7-7.2,3.4-14.5,5-21.7c4.4-19,8.8-38,13.3-57C25,7.8,35.7,0,48.7,0c13,0,23.6,11.2,23.6,24.8C72.3,24.8,79.3,128.5,66.3,128.5z"/>
      {/* Roll highlight */}
      <path fill="#A479E2" d="M16.9,59c-3,13.1-6,26.2-8.8,39.3c3.1,0.8,6.3,1.2,9.5,1.3c5.7,0.1,5.2,0.9,6.1-4.2c1-5.2,1.8-10.5,2.7-15.8c2.1-12.7,4.1-25.5,5.9-38.3c0.7-5.4,1.5-10.9,1.9-16.3c0.2-1.8,0.3-3.6,0.3-5.5c0-1.7,0.2-4.4-2.4-3.4c-0.9,0.3-1.5,1.1-2.1,1.9c-4.2,5.4-6.5,13-8.3,19.5C19.8,44.7,18.6,51.9,16.9,59z"/>
      {/* Roll face */}
      <path fill="#CC3399" d="M73,119.1c0,7.8-3.4,15.5-8.7,21.2c-2.7,2.9-5.9,5.4-9.6,6.9c-4,1.7-8.4,2-12.6,2.9c-2.1,0.4-1.2,0.6-2.1,2.2c-1,1.8-4,1.8-5.8,2.1c-2.5,0.4-5,0.3-7.3-0.6c-4.7-1.7-11.4-5.8-14.9-9.3c-6.7-6.8-11.9-17.3-11.9-27c0-19.6,16-33.9,36.3-33.9S73,99.5,73,119.1z"/>
      {/* Roll center ellipse */}
      <ellipse fill="#990066" transform="matrix(0.1517 -0.9884 0.9884 0.1517 -88.2469 138.5737)" cx="36.6" cy="120.7" rx="13.1" ry="12"/>
      {/* Roll outline detail */}
      <path fill="#990066" d="M27.7,129.1c3.8,4.7,9.6,7.3,15.6,5.3c5.3-1.7,9.5-6.1,11.5-11.2c5.3-13.3-8.1-26.6-21.5-23.1c-6.6,1.7-12,6.8-14.6,13c-2.8,6.7-1.8,14.3,2.4,20.2c8,10.9,23.9,10.8,34.1,3.1c11.9-8.9,13.5-27.2,2.7-37.6C47.2,88.5,28.2,87.5,17,97.7c-11,9.9-13,27.6-4.1,39.5c5.2,6.9,13,10.3,21,12.9c9.9,3.1,20.3,4.5,30.6,5.4c10.7,1,21.3,1.1,32,1c11.6-0.1,23.2-0.5,34.8-1.5c23.3-2,46.3-5.8,69.1-11c5.7-1.3,11.4-2.6,17.1-3.8c1.8-0.4,1-3.1-0.7-2.7c-20.4,4.4-40.6,9.2-61.4,12c-20.4,2.8-40.9,4-61.5,4.2c-9.5,0.1-18.9-0.1-28.3-0.9c-9.3-0.8-18.7-1.9-27.7-4.5c-7.5-2.1-15.5-4.8-21-10.7c-4.8-5.2-7.2-12.2-6.8-19.2c0.8-13.9,11.9-25,26-25c14.3,0,28,10.3,26.1,25.7c-1.5,12.5-13.2,21.3-25.6,20.1c-13.3-1.2-21.1-16-14.1-27.5c3.2-5.2,8.9-9.2,15.1-9.3c6.3-0.1,12.9,4.2,14.9,10.3c3.1,9.2-6,22.1-16.3,19.3c-2.8-0.8-4.9-2.6-6.7-4.8C28.5,125.8,26.5,127.7,27.7,129.1L27.7,129.1z"/>
    </svg>
  )
}

// ── Treadmill SVG (Stryde X) ──────────────────────────────────────────────────
function TreadmillIcon({ state }) {
  const isOcc = state === 'occupied'
  const isSel = state === 'selected'
  const led  = isOcc ? '#4b5563' : '#FF1744'
  const ledO = isOcc ? 0.28 : isSel ? 1 : 0.88
  const fr   = isOcc ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.18)'
  const po   = isOcc ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)'
  const dl   = isOcc ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)'
  return (
    <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg"
         style={{ width:'100%', height:'100%', display:'block' }}>
      {/* Base */}
      <rect x="3"  y="60" width="54" height="14" rx="5" fill={fr}/>
      <rect x="5"  y="61" width="50" height="6"  rx="3" fill={po} opacity="0.55"/>
      {/* Running deck */}
      <rect x="3"  y="43" width="54" height="20" rx="3" fill="rgba(0,0,0,0.35)"/>
      <line x1="5" y1="47" x2="55" y2="47" stroke={dl} strokeWidth="0.9"/>
      <line x1="5" y1="51" x2="55" y2="51" stroke={dl} strokeWidth="0.9"/>
      <line x1="5" y1="55" x2="55" y2="55" stroke={dl} strokeWidth="0.9"/>
      <line x1="5" y1="59" x2="55" y2="59" stroke={dl} strokeWidth="0.9"/>
      {/* LED strip */}
      <rect x="3"  y="62" width="54" height="2.5" rx="1.2" fill={led} opacity={ledO}/>
      {isSel && <rect x="3" y="60" width="54" height="6" rx="3" fill={led} opacity="0.08"/>}
      {/* Left post */}
      <rect x="3"  y="12" width="9"  height="33" rx="3" fill={po}/>
      <rect x="4.5" y="14" width="2" height="29" rx="1" fill="rgba(255,255,255,0.08)" opacity="0.5"/>
      {/* Right post */}
      <rect x="48" y="12" width="9"  height="33" rx="3" fill={po}/>
      <rect x="53.5" y="14" width="2" height="29" rx="1" fill="rgba(255,255,255,0.08)" opacity="0.5"/>
      {/* Console */}
      <rect x="10" y="4"  width="40" height="22" rx="6" fill={fr}/>
      <rect x="11" y="5"  width="38" height="10" rx="5" fill={po} opacity="0.45"/>
      {/* Screen */}
      <rect x="14" y="7"  width="32" height="16" rx="4" fill="rgba(0,0,0,0.55)"/>
      <rect x="15" y="8"  width="30" height="14" rx="3" fill="rgba(0,0,8,0.75)"/>
      {/* Screen display */}
      <rect x="17" y="10" width="11" height="5"  rx="1.5" fill={led} opacity={ledO}/>
      <rect x="30" y="10" width="7"  height="1.8" rx="0.9" fill={led} opacity={ledO * 0.7}/>
      <rect x="30" y="13" width="10" height="1.8" rx="0.9" fill={led} opacity={ledO * 0.55}/>
      <rect x="30" y="16" width="6"  height="1.8" rx="0.9" fill={led} opacity={ledO * 0.4}/>
      {/* Handlebars */}
      <rect x="3"  y="33" width="9"  height="13" rx="3" fill="rgba(255,255,255,0.09)"/>
      <rect x="48" y="33" width="9"  height="13" rx="3" fill="rgba(255,255,255,0.09)"/>
      <rect x="8"  y="33" width="44" height="3"  rx="1.5" fill="rgba(255,255,255,0.06)" opacity="0.6"/>
    </svg>
  )
}

// ── Bench SVG (Stryde X) ──────────────────────────────────────────────────────
function BenchIcon({ state }) {
  const isOcc = state === 'occupied'
  const isSel = state === 'selected'
  const led  = isOcc ? '#4b5563' : '#FF1744'
  const ledO = isOcc ? 0.28 : isSel ? 1 : 0.88
  const fr   = isOcc ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.18)'
  const po   = isOcc ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)'
  return (
    <svg viewBox="0 0 64 54" fill="none" xmlns="http://www.w3.org/2000/svg"
         style={{ width:'100%', height:'100%', display:'block' }}>
      {/* Pad */}
      <rect x="4"  y="5"  width="56" height="18" rx="8" fill={fr}/>
      <rect x="6"  y="6"  width="52" height="9"  rx="6" fill={po} opacity="0.55"/>
      <line x1="32" y1="6" x2="32" y2="22" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" opacity="0.45"/>
      {/* LED strip */}
      <rect x="4"  y="22" width="56" height="2.5" rx="1" fill={led} opacity={ledO}/>
      {isSel && <rect x="4" y="21" width="56" height="5" rx="2" fill={led} opacity="0.07"/>}
      {/* Left leg */}
      <rect x="7"  y="27" width="13" height="22" rx="4" fill={po}/>
      <rect x="8.5" y="29" width="2.5" height="18" rx="1" fill="rgba(255,255,255,0.08)" opacity="0.5"/>
      {/* Right leg */}
      <rect x="44" y="27" width="13" height="22" rx="4" fill={po}/>
      <rect x="53" y="29" width="2.5" height="18" rx="1" fill="rgba(255,255,255,0.08)" opacity="0.5"/>
      {/* Bottom bar */}
      <rect x="7"  y="45" width="50" height="4"  rx="2" fill={fr}/>
      {/* Adjustment risers */}
      <rect x="22" y="27" width="20" height="2"  rx="1" fill="rgba(255,255,255,0.10)" opacity="0.5"/>
      <rect x="22" y="31" width="20" height="2"  rx="1" fill="rgba(255,255,255,0.08)" opacity="0.35"/>
      <rect x="22" y="35" width="20" height="2"  rx="1" fill="rgba(255,255,255,0.06)" opacity="0.22"/>
    </svg>
  )
}

/**
 * Props:
 *  cls           – raw class object from clasesStore
 *  onClose       – called when the modal should be dismissed
 *  targetUserId  – (optional) reserve for this user instead of the logged-in user
 *  onSuccess     – (optional) called after a successful reservation
 *  adminForce    – (optional) bypass credit check
 */
export default function SeatSelector({ cls, onClose, targetUserId, onSuccess, adminForce = false, fecha }) {
  const navigate = useNavigate()
  const { isAuthenticated, usuario } = useAuth()
  const { reservas } = useReservasStore()

  const isSlow = cls.tipo?.toLowerCase().includes('slow')

  const COLS = 5
  const totalSeats = cls.cupoMax > 0 ? cls.cupoMax : (isSlow ? 15 : 14)
  const rows = Math.ceil(totalSeats / COLS)
  const cols = COLS
  const userId = targetUserId ?? usuario?.id

  // Dynamic Stryde X layout derived from cupoMax
  const strydeLayout = useMemo(() => buildStrydeLayout(cls.cupoMax), [cls.cupoMax])

  const occupied = useMemo(() => new Set(
    reservas
      .filter(r => r.claseId === cls.id && r.estado === 'confirmada')
      .map(r => seatIdFromLabel(r.asiento))
      .filter(Boolean)
  ), [reservas, cls.id])

  const [selected, setSelected] = useState(() => {
    const myReserva = reservas.find(
      r => r.claseId === cls.id && r.userId === userId && r.estado === 'confirmada'
    )
    return myReserva ? seatIdFromLabel(myReserva.asiento) : null
  })

  const [confirmado, setConfirmado] = useState(false)
  const [sinClases,  setSinClases]  = useState(false)

  function toggle(id) { setSelected(prev => (prev === id ? null : id)) }

  function confirm() {
    if (!adminForce && !isAuthenticated) {
      navigate(ROUTES.login, { state: { selectedClass: cls, selectedSeat: selected } })
      return
    }
    const { row, col } = parseSeat(selected)
    const resultado = reservarClase(userId, cls.id, seatLabel(row, col))
    if (!resultado.ok) {
      if (resultado.error === 'Sin créditos disponibles') {
        if (adminForce) {
          useReservasStore.getState().agregarReserva({
            id: Date.now(), userId, claseId: cls.id,
            asiento: seatLabel(row, col), estado: 'confirmada',
            fecha: new Date().toISOString().split('T')[0],
          })
          useClasesStore.getState().actualizarCupo(cls.id, 1)
          setConfirmado(true)
        } else { setSinClases(true) }
      } else { toast.error(resultado.error) }
      return
    }
    setConfirmado(true)
  }

  function handleCerrar() {
    setConfirmado(false); setSelected(null)
    if (onSuccess) { onSuccess() }
    else { onClose(); navigate(ROUTES.cliente.dashboard) }
  }

  // ── Sin créditos ─────────────────────────────────────────────────────────────
  if (sinClases) {
    return (
      <div className={styles.backdrop}>
        <div className={styles.noClasesModal}>
          <div className={styles.noClasesIcon}><ShoppingBag size={48} strokeWidth={1.2}/></div>
          <h2 className={styles.noClasesTitle}>Sin clases disponibles</h2>
          <p className={styles.noClasesSub}>
            Necesitas un paquete activo para reservar. Elige el plan que mejor se adapte a tu ritmo.
          </p>
          <div className={styles.noClasesPaquetes}>
            {[
              { nombre:'Básico',   clases:'8 clases',   precio:'$999'   },
              { nombre:'Esencial', clases:'16 clases',  precio:'$1,499', popular:true },
              { nombre:'Premium',  clases:'Ilimitadas', precio:'$1,999' },
            ].map(p => (
              <div key={p.nombre}
                className={`${styles.noClasesPaqueteCard} ${p.popular ? styles.noClasesPaquetePopular : ''}`}>
                {p.popular && <span className={styles.noClasesPopularTag}>MÁS POPULAR</span>}
                <span className={styles.noClasesPaqueteNombre}>{p.nombre}</span>
                <span className={styles.noClasesPaqueteClases}>{p.clases}</span>
                <span className={styles.noClasesPaquetePrecio}>{p.precio}/mes</span>
              </div>
            ))}
          </div>
          <div className={styles.noClasesActions}>
            <button className={styles.noClasesBtnSecondary} onClick={() => { setSinClases(false); onClose() }}>
              Volver
            </button>
            <button className={styles.confirmBtn} onClick={() => {
              setSinClases(false); onClose()
              navigate(isAuthenticated ? ROUTES.cliente.pagos : ROUTES.login)
            }}>Ver paquetes →</button>
          </div>
        </div>
      </div>
    )
  }

  // ── SLOW: Premium yoga layout ─────────────────────────────────────────────────
  if (isSlow) {
    return (
      <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && !confirmado && onClose()}>
        <div className={styles.slowModal} role="dialog" aria-modal="true" aria-label="Seleccionar lugar">
          {confirmado ? (
            <div className={styles.successView}>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar"
                style={{ position:'absolute', top:14, right:14 }}><X size={20}/></button>
              <CheckCircle size={52} strokeWidth={1.5} className={styles.successIcon}/>
              <h2 className={styles.successTitle}>¡Reserva confirmada!</h2>
              <p className={styles.successSub}><strong>{cls.nombre}</strong><br/>{cls.dia} · {cls.hora} · Coach: {cls.coachNombre}</p>
              {selected && (
                <p className={styles.successSeat}>
                  Mat {String((parseSeat(selected).row-1)*cols+parseSeat(selected).col).padStart(2,'0')} ·{' '}
                  {seatLabel(parseSeat(selected).row, parseSeat(selected).col)}
                </p>
              )}
              {usuario?.clasesPaquete !== undefined && usuario.clasesPaquete !== 999 && (
                <p className={styles.successCredits}>
                  Te quedan <strong>{Math.max(0,usuario.clasesPaquete)}</strong> créditos en tu paquete
                </p>
              )}
              <button className={styles.slowConfirmBtn} onClick={handleCerrar}>Ver mis clases →</button>
            </div>
          ) : (
            <div className={styles.fitnessLayout}>
              {/* LEFT */}
              <div className={styles.machineSection}>
                <div className={styles.frenteBanner}>
                  <div className={styles.frenteLine}/><span className={styles.frenteLabel}>FRENTE · INSTRUCTOR</span><div className={styles.frenteLine}/>
                </div>
                <div className={styles.machineGrid} style={{'--cols':cols}} role="group" aria-label="Selección de lugar">
                  {Array.from({length:rows},(_, r)=>r+1).map(row =>
                    Array.from({length:cols},(_,c)=>c+1).map(col => {
                      const seatNum = (row-1)*cols + col
                      if (seatNum > totalSeats) return null  // no generar celdas extra en la última fila
                      const id = `R${row}-S${col}`
                      const isOccupied = occupied.has(id)
                      const isSelected = selected === id
                      const state = isOccupied?'occupied':isSelected?'selected':'available'
                      return (
                        <button key={id}
                          className={[styles.machineCard, isOccupied?styles.cardOccupied:styles.cardAvailable, isSelected?styles.cardSelected:''].join(' ')}
                          onClick={() => !isOccupied && toggle(id)} disabled={isOccupied}
                          aria-label={`${seatLabel(row,col)}${isOccupied?' — ocupado':isSelected?' — seleccionado':' — disponible'}`}
                          aria-pressed={isSelected}>
                          <span className={[styles.statusIndicator, isOccupied?styles.indGray:isSelected?styles.indWine:styles.indGreen].join(' ')}/>
                          <div className={styles.matIconWrap}><YogaMatIcon state={state}/></div>
                          <span className={styles.machineNumber}>{String(seatNum).padStart(2,'0')}</span>
                        </button>
                      )
                    })
                  )}
                </div>
                <div className={styles.fitnessLegend}>
                  {[{ind:styles.indGreen,label:'Disponible'},{ind:styles.indGray,label:'Ocupado'},{ind:styles.indWine,label:'Tu lugar'}].map(({ind,label})=>(
                    <span key={label} className={styles.legendItem}>
                      <span className={`${styles.statusIndicator} ${ind}`} style={{position:'static',width:8,height:8}}/>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              {/* RIGHT */}
              <aside className={styles.reservationSidebar}>
                <div className={styles.sbBlock}>
                  <div className={styles.sbTopRow}>
                    <span className={styles.sbSlowBadge}>SLOW</span>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><X size={18}/></button>
                  </div>
                  <div className={styles.sbTitle}>{cls.nombre}</div>
                  <div className={styles.sbCoach}>Coach {cls.coachNombre}</div>
                  {cls.descripcion && <div className={styles.sbDesc}>{cls.descripcion}</div>}
                  <div className={styles.sbTime}>
                    {fecha ? formatFecha(fecha, cls.hora) : `${cls.dia} · ${cls.hora}`}
                  </div>
                </div>
                <div className={styles.sbDivider}/>
                <div className={styles.sbSelectionBlock}>
                  {selected ? (
                    <>
                      <div className={styles.sbSelLabel}>Tu lugar elegido</div>
                      <div className={styles.sbSelMat}>Mat {String((parseSeat(selected).row-1)*cols+parseSeat(selected).col).padStart(2,'0')}</div>
                      <div className={styles.sbSelDetail}>Fila {parseSeat(selected).row}</div>
                    </>
                  ) : <div className={styles.sbSelHint}>Elige tu lugar<br/>en el mapa</div>}
                </div>
                {usuario?.clasesPaquete !== undefined && usuario.clasesPaquete !== 999 && (
                  <><div className={styles.sbDivider}/>
                    <div className={styles.sbCreditsBlock}>
                      <span className={styles.sbCreditsNum}>{usuario.clasesPaquete}</span>
                      <span className={styles.sbCreditsLabel}>créditos restantes</span>
                    </div>
                  </>
                )}
                <div className={styles.sbPolicy}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:2}}>
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                  </svg>
                  <span><strong>Política de cancelación:</strong> puedes cancelar hasta <strong>6 horas antes</strong> del inicio de la clase. Después de ese plazo tu crédito no será reembolsado aunque no asistas.</span>
                </div>
                <button className={styles.slowConfirmBtn} onClick={confirm} disabled={!selected}>
                  {selected ? 'Confirmar reserva →' : 'Selecciona un lugar'}
                </button>
              </aside>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── STRYDE X: Premium boutique fitness layout ─────────────────────────────────
  const renderEquipRow = (rowData) => rowData.equipment.map(eq => {
    const isOccupied = occupied.has(eq.id)
    const isSelected = selected === eq.id
    const state      = isOccupied ? 'occupied' : isSelected ? 'selected' : 'available'
    const isRot      = eq.mode === 'rotation'
    return (
      <button
        key={eq.id}
        className={[
          styles.strydeCard,
          eq.type === 'bench' ? styles.strydeCardBench : styles.strydeCardTread,
          isOccupied ? styles.strydeOccupied : styles.strydeAvail,
          isSelected ? styles.strydeSelected : '',
          isRot ? styles.strydeCardRot : styles.strydeCardStatic,
        ].join(' ')}
        onClick={() => !isOccupied && toggle(eq.id)}
        disabled={isOccupied}
        aria-label={`${eq.label} ${eq.num}${isRot ? ' — rotación' : ' — solo banco'}${isOccupied?' — ocupado':isSelected?' — seleccionado':' — disponible'}`}
        aria-pressed={isSelected}
      >
        <span className={[styles.strydeStatusDot, isOccupied?styles.strydeGray:isSelected?styles.strydeWine:styles.strydeGreen].join(' ')}/>
        <div className={eq.type==='bench' ? styles.benchIconWrap : styles.treadIconWrap}>
          {eq.type === 'bench' ? <BenchIcon state={state}/> : <TreadmillIcon state={state}/>}
        </div>
        <span className={styles.strydeEquipNum}>{eq.num}</span>
        {/* Mode badge — icon-only, no text */}
        {isRot ? (
          <div className={styles.modeTagRot}>
            <BenchMini active={false}/><span className={styles.modeTagArrow}>⇆</span><TreadMini active={false}/>
          </div>
        ) : (
          <div className={styles.modeTagStatic}>
            <BenchMini active={false}/>
          </div>
        )}
        {/* Glassmorphism hover tooltip */}
        <span className={styles.cardTooltip}>
          {isRot ? 'Bench & Treadmill' : 'Bench Only'}
        </span>
      </button>
    )
  })

  const instructorInitials = cls.coachNombre?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?'
  const selEq = selected ? getEquipmentInfo(strydeLayout, selected) : null

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && !confirmado && onClose()}>
      <div className={styles.strydeModal} role="dialog" aria-modal="true" aria-label="Seleccionar equipo">

        {confirmado ? (
          <div className={styles.successView}>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar"
              style={{position:'absolute',top:14,right:14}}><X size={20}/></button>
            <CheckCircle size={52} strokeWidth={1.5} className={styles.successIcon}/>
            <h2 className={styles.successTitle}>¡Reserva confirmada!</h2>
            <p className={styles.successSub}><strong>{cls.nombre}</strong><br/>{cls.dia} · {cls.hora} · Coach: {cls.coachNombre}</p>
            {selected && selEq && (
              <p className={styles.successSeat}>
                {selEq.label} {selEq.num} · {seatLabel(parseSeat(selected).row, parseSeat(selected).col)}
              </p>
            )}
            {usuario?.clasesPaquete !== undefined && usuario.clasesPaquete !== 999 && (
              <p className={styles.successCredits}>
                Te quedan <strong>{Math.max(0,usuario.clasesPaquete)}</strong> créditos en tu paquete
              </p>
            )}
            <button className={styles.strydeConfirmBtn} onClick={handleCerrar}>Ver mis clases →</button>
          </div>
        ) : (
          <div className={styles.strydeLayout}>

            {/* LEFT — room grid */}
            <div className={styles.strydeSection}>
              <div className={styles.strydeRoom}>
                <div className={styles.strydeWall}>
                  <div className={styles.strydeWallLine}/>
                  <span className={styles.strydeWallLabel}>FRENTE</span>
                  <div className={styles.strydeWallLine}/>
                </div>
                {strydeLayout.filter(r => r.rowType === 'bench').map((row, i) => (
                  <div key={i} className={styles.strydeBenchRow} role="group" aria-label={row.ariaLabel}>
                    {renderEquipRow(row)}
                  </div>
                ))}
                <div className={styles.strydeInstructorZone}>
                  <div className={styles.strydeZoneLine}/>
                  <div className={styles.instructorBadge}>
                    <div className={styles.instructorAvatar}>{instructorInitials}</div>
                    <span className={styles.instructorName}>{cls.coachNombre}</span>
                    <span className={styles.instructorTitle}>Instructor</span>
                  </div>
                  <div className={styles.strydeZoneLine}/>
                </div>
                {strydeLayout.filter(r => r.rowType === 'treadmill').map((row, i) => (
                  <div key={i} className={styles.strydeTreadRow} role="group" aria-label={row.ariaLabel}>
                    {renderEquipRow(row)}
                  </div>
                ))}
              </div>

              <div className={styles.strydeLegend}>
                {[{dot:styles.strydeGreen,label:'Disponible'},{dot:styles.strydeGray,label:'Ocupado'},{dot:styles.strydeWine,label:'Tu equipo'}].map(({dot,label})=>(
                  <span key={label} className={styles.legendItem}>
                    <span className={`${styles.strydeStatusDot} ${dot}`} style={{position:'static',width:8,height:8}}/>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT — sidebar */}
            <aside className={styles.strydeSidebar}>
              <div className={styles.sbBlock}>
                <div className={styles.sbTopRow}>
                  <span className={styles.strydeXBadge}>STRYDE X</span>
                  <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><X size={18}/></button>
                </div>
                <div className={styles.sbTitle}>{cls.nombre}</div>
                <div className={styles.sbCoach}>Coach {cls.coachNombre}</div>
                {cls.descripcion && <div className={styles.sbDesc}>{cls.descripcion}</div>}
                <div className={styles.sbTime}>
                  {fecha ? formatFecha(fecha, cls.hora) : `${cls.dia} · ${cls.hora}`}
                </div>
              </div>
              <div className={styles.sbDivider}/>
              <div className={styles.sbSelectionBlock}>
                {selected && selEq ? (
                  <>
                    <div className={styles.sbSelLabel}>Tu equipo</div>
                    <div className={styles.sbSelMat} style={{fontSize:18}}>{selEq.label} {selEq.num}</div>
                    {selEq.mode === 'rotation' ? (
                      <div className={styles.rotationFlow}>
                        <p className={styles.rfTitle}>ROTATION FLOW</p>
                        <div className={styles.rfTimeline}>
                          {getRotationBlocks(selEq.type).map((type, i) => (
                            <div key={i} className={styles.rfStep}>
                              <div className={styles.rfIconBlock}>
                                <div className={styles.rfIcon}>
                                  {type === 'bench' ? <BenchMini active /> : <TreadMini active />}
                                </div>
                                <span className={styles.rfBlock}>B{i + 1}</span>
                              </div>
                              {i < 3 && <span className={styles.rfArrow}>›</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.benchOnlyFlow}>
                        <BenchMini active />
                        <div>
                          <p className={styles.bofTitle}>Bench Only</p>
                          <p className={styles.bofSub}>No rota · Toda la clase</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : <div className={styles.sbSelHint}>Elige tu equipo<br/>en el mapa</div>}
              </div>
              {usuario?.clasesPaquete !== undefined && usuario.clasesPaquete !== 999 && (
                <><div className={styles.sbDivider}/>
                  <div className={styles.sbCreditsBlock}>
                    <span className={styles.sbCreditsNum}>{usuario.clasesPaquete}</span>
                    <span className={styles.sbCreditsLabel}>créditos restantes</span>
                  </div>
                </>
              )}
              <div className={styles.sbPolicy}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:2}}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                </svg>
                <span><strong>Política de cancelación:</strong> puedes cancelar hasta <strong>6 horas antes</strong> del inicio de la clase. Después de ese plazo tu crédito no será reembolsado aunque no asistas.</span>
              </div>
              <button className={styles.strydeConfirmBtn} onClick={confirm} disabled={!selected}>
                {selected ? 'Confirmar reserva →' : 'Selecciona un equipo'}
              </button>
            </aside>

          </div>
        )}
      </div>
    </div>
  )
}
