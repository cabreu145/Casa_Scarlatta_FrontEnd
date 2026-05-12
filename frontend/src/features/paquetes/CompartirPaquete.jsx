/**
 * CompartirPaquete.jsx
 * Permite dividir un paquete equitativamente entre varios usuarios registrados.
 * Usado en: PagoModal (cliente), AdminPanel sección asignar paquete (admin).
 * Props:
 *   paquete          – { nombre, clases }
 *   usuarioActualId  – ID del comprador (excluido de la búsqueda)
 *   variant          – 'light' | 'dark'  (tema del contenedor padre)
 *   onChange         – ({ activo, participantes: User[] }) => void
 */
import { useState } from 'react'
import { useUsuariosStore } from '@/stores/usuariosStore'
import s from './CompartirPaquete.module.css'

export default function CompartirPaquete({
  paquete,
  usuarioActualId,
  variant = 'light',
  onChange,
}) {
  const { usuarios } = useUsuariosStore()
  const [activo, setActivo]           = useState(false)
  const [query, setQuery]             = useState('')
  const [participantes, setParticipantes] = useState([])
  const [error, setError]             = useState('')

  const esIlimitado = !paquete?.clases || paquete.clases === 0
  const totalPersonas    = participantes.length + 1
  const clasesPorPersona = esIlimitado ? null : Math.floor(paquete.clases / totalPersonas)
  const clasesBase       = paquete?.clases ?? 0

  function toggleActivo() {
    if (esIlimitado) return
    const next = !activo
    setActivo(next)
    setParticipantes([])
    setQuery('')
    setError('')
    onChange({ activo: next, participantes: [] })
  }

  function buscar() {
    setError('')
    const q = query.trim().toLowerCase()
    if (!q) return
    const encontrado = usuarios.find(
      (u) =>
        u.email?.toLowerCase() === q &&
        u.rol === 'cliente' &&
        u.id !== usuarioActualId &&
        !participantes.some((p) => p.id === u.id)
    )
    if (!encontrado) {
      setError('No se encontró un cliente activo con ese correo.')
      return
    }
    const nueva = [...participantes, encontrado]
    setParticipantes(nueva)
    setQuery('')
    onChange({ activo: true, participantes: nueva })
  }

  function quitar(id) {
    const nueva = participantes.filter((p) => p.id !== id)
    setParticipantes(nueva)
    onChange({ activo: activo && nueva.length > 0, participantes: nueva })
  }

  const dark = variant === 'dark'

  return (
    <div className={`${s.wrap} ${dark ? s.dark : s.light}`}>

      {/* Toggle principal */}
      <button
        type="button"
        className={`${s.toggle} ${activo ? s.toggleOn : ''} ${esIlimitado ? s.toggleDisabled : ''}`}
        onClick={toggleActivo}
        title={esIlimitado ? 'Los paquetes ilimitados no se pueden compartir' : undefined}
      >
        <span className={s.toggleIcon}>{activo ? '👥' : '🔗'}</span>
        <span className={s.toggleText}>
          {activo ? 'Compartiendo paquete' : 'Compartir paquete con alguien'}
        </span>
        {esIlimitado && <span className={s.badge}>Solo paquetes con clases fijas</span>}
        {!esIlimitado && (
          <span className={`${s.dot} ${activo ? s.dotOn : ''}`} />
        )}
      </button>

      {/* Panel expandible */}
      {activo && !esIlimitado && (
        <div className={s.panel}>

          {/* Búsqueda por correo */}
          <div className={s.searchRow}>
            <input
              className={s.input}
              type="email"
              placeholder="correo@ejemplo.com"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
            />
            <button type="button" className={s.btnBuscar} onClick={buscar}>
              Agregar
            </button>
          </div>
          {error && <p className={s.error}>{error}</p>}
          <p className={s.hint}>
            El correo debe pertenecer a un cliente registrado en el sistema.
          </p>

          {/* Chips de participantes */}
          {participantes.length > 0 && (
            <div className={s.chips}>
              {participantes.map((p) => (
                <span key={p.id} className={s.chip}>
                  <span className={s.chipAvatar}>
                    {(p.nombre ?? p.name ?? '?')[0].toUpperCase()}
                  </span>
                  <span className={s.chipName}>{p.nombre ?? p.name}</span>
                  <button
                    type="button"
                    className={s.chipRemove}
                    onClick={() => quitar(p.id)}
                    aria-label={`Quitar a ${p.nombre ?? p.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Cálculo de división */}
          <div className={s.divisionCard}>
            <div className={s.divisionFormula}>
              <span className={s.divNum}>{clasesBase}</span>
              <span className={s.divOp}>÷</span>
              <span className={s.divNum}>{totalPersonas}</span>
              <span className={s.divOp}>=</span>
              <span className={`${s.divNum} ${s.divResult}`}>{clasesPorPersona}</span>
            </div>
            <div className={s.divisionDesc}>
              <strong>{clasesBase} clases</strong> del paquete <em>{paquete.nombre}</em>
              {' '}divididas entre <strong>{totalPersonas} persona{totalPersonas !== 1 ? 's' : ''}</strong>
              {' '}= <strong>{clasesPorPersona} clases por persona</strong>
            </div>
            {clasesBase % totalPersonas !== 0 && (
              <p className={s.divisionWarning}>
                ⚠ La división no es exacta — se asignan {clasesPorPersona} clases por persona
                ({clasesBase % totalPersonas} clase{clasesBase % totalPersonas !== 1 ? 's' : ''} se descarta{clasesBase % totalPersonas !== 1 ? 'n' : ''}).
              </p>
            )}
          </div>

          {/* Lista: tú + participantes */}
          <div className={s.memberList}>
            <div className={s.memberRow}>
              <span className={s.memberDot} />
              <span className={s.memberName}>Tú (titular)</span>
              <span className={s.memberClases}>{clasesPorPersona} clases</span>
            </div>
            {participantes.map((p) => (
              <div key={p.id} className={s.memberRow}>
                <span className={s.memberDot} />
                <span className={s.memberName}>{p.nombre ?? p.name}</span>
                <span className={s.memberClases}>{clasesPorPersona} clases</span>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}
