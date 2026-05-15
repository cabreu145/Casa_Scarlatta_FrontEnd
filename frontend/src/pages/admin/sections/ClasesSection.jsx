import toast from 'react-hot-toast'
import { eliminarClaseConReservas } from '@/services/reservasService'
import styles from '../AdminPanel.module.css'

const ABBR_DIA = { Lunes: 'LUN', Martes: 'MAR', Miércoles: 'MIÉ', Jueves: 'JUE', Viernes: 'VIE', Sábado: 'SÁB', Domingo: 'DOM' }

function Tag({ color, children }) {
  const cls = {
    green:  styles.tagGreen,
    red:    styles.tagRed,
    yellow: styles.tagYellow,
    blue:   styles.tagBlue,
    pink:   styles.tagPink,
    gray:   styles.tagGray,
  }[color] || styles.tagGreen
  return <span className={`${styles.miniTag} ${cls}`}>{children}</span>
}

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

export default function ClasesSection({
  clases,
  clasesFilter,
  setClasesFilter,
  selectMode,
  setSelectMode,
  selectedIds,
  setSelectedIds,
  coaches,
  disciplinas,
  openModal,
  setModalAlumnosClase,
  setAlumnoAgregarId,
  setModalEditClase,
  setEditClaseForm,
  claseForm,
  setClaseForm,
}) {
  return (
    <>
      <div className={styles.sectionTopRow}>
        <FilterChips
          options={['Todas', 'Stryde X', 'Slow', 'Esta semana']}
          active={clasesFilter}
          onChange={setClasesFilter}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {selectMode && selectedIds.size > 0 && (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ background: '#ef4444', borderColor: '#ef4444' }}
              onClick={() => {
                if (!window.confirm(`¿Eliminar ${selectedIds.size} clase${selectedIds.size > 1 ? 's' : ''}?`)) return
                selectedIds.forEach(id => eliminarClaseConReservas(id))
                toast.success(`${selectedIds.size} clase${selectedIds.size > 1 ? 's eliminadas' : ' eliminada'}`)
                setSelectedIds(new Set())
                setSelectMode(false)
              }}
            >
              🗑 Eliminar ({selectedIds.size})
            </button>
          )}
          <button
            className={`${styles.btn} ${selectMode ? styles.btnSecondary : styles.btnGhost}`}
            onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()) }}
          >
            {selectMode ? '✕ Cancelar' : '☑ Seleccionar'}
          </button>
          {!selectMode && (
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('clase')}>
              + Nueva Clase
            </button>
          )}
        </div>
      </div>

      {/* Toolbar de selección */}
      {selectMode && (() => {
        const listaVisible = clasesFilter === 'Todas' || clasesFilter === 'Esta semana'
          ? clases
          : clases.filter(c => clasesFilter === 'Stryde X'
              ? !c.tipo?.toLowerCase().includes('slow')
              : c.tipo?.toLowerCase().includes('slow'))
        const todosSeleccionados = listaVisible.length > 0 && listaVisible.every(c => selectedIds.has(c.id))
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 8, fontFamily: 'var(--font-body)', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={todosSeleccionados}
              onChange={() => {
                if (todosSeleccionados) {
                  setSelectedIds(new Set())
                } else {
                  setSelectedIds(new Set(listaVisible.map(c => c.id)))
                }
              }}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#ef4444' }}
            />
            <span style={{ color: 'var(--muted)' }}>
              {selectedIds.size === 0
                ? 'Selecciona las clases que deseas eliminar'
                : `${selectedIds.size} de ${listaVisible.length} seleccionada${selectedIds.size > 1 ? 's' : ''}`}
            </span>
            {selectedIds.size > 0 && (
              <button
                style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                onClick={() => setSelectedIds(new Set())}
              >
                Deseleccionar todo
              </button>
            )}
          </div>
        )
      })()}

      <div className={styles.card}>
        <div className={styles.clasesList}>
          {(clasesFilter === 'Todas' || clasesFilter === 'Esta semana'
            ? clases
            : clases.filter((c) =>
                clasesFilter === 'Stryde X'
                  ? !c.tipo?.toLowerCase().includes('slow')
                  : c.tipo?.toLowerCase().includes('slow')
              )
          ).map((c) => {
            const pct          = c.cupoMax > 0 ? Math.round((c.cupoActual / c.cupoMax) * 100) : 0
            const isPasada = (() => {
              if (!c.fecha) return false
              const [h, m] = (c.hora || '00:00').split(':').map(Number)
              const fin = new Date(c.fecha + 'T00:00:00')
              fin.setHours(h + Math.floor((c.duracion || 50) / 60), m + (c.duracion || 50) % 60)
              return fin < new Date()
            })()
            const statusTag    = isPasada ? 'gray' : pct >= 100 ? 'red' : pct >= 80 ? 'yellow' : 'green'
            const statusLabel  = isPasada ? 'Finalizada' : pct >= 100 ? 'Llena' : pct >= 80 ? 'Casi llena' : 'Abierta'
            const isProgramada = c.publicarEn && new Date(c.publicarEn) > new Date()
            const isSelected  = selectedIds.has(c.id)
            return (
              <div
                key={c.id}
                className={styles.claseItem}
                style={{
                  opacity: isProgramada ? 0.75 : 1,
                  background: isSelected ? 'rgba(239,68,68,0.08)' : undefined,
                  outline: isSelected ? '1px solid rgba(239,68,68,0.3)' : undefined,
                  borderRadius: isSelected ? 'var(--radius-md)' : undefined,
                  cursor: selectMode ? 'pointer' : undefined,
                }}
                onClick={selectMode ? () => {
                  setSelectedIds(prev => {
                    const next = new Set(prev)
                    next.has(c.id) ? next.delete(c.id) : next.add(c.id)
                    return next
                  })
                } : undefined}
              >
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    onClick={e => e.stopPropagation()}
                    style={{ width: 16, height: 16, flexShrink: 0, accentColor: '#ef4444', cursor: 'pointer' }}
                  />
                )}
                <div className={styles.claseDay}>
                  <span style={{ fontSize: 9 }}>{ABBR_DIA[c.dia] || c.dia}</span>
                  <span className={styles.dayNum}>
                    {(() => {
                      if (c.fecha) return new Date(c.fecha + 'T12:00:00').getDate()
                      const idx = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].indexOf(c.dia)
                      const hoy = new Date()
                      const diff = idx - hoy.getDay()
                      const fecha = new Date(hoy)
                      fecha.setDate(hoy.getDate() + (diff >= 0 ? diff : diff + 7))
                      return fecha.getDate()
                    })()}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className={styles.claseName}>
                    {c.nombre}
                    {isProgramada && (
                      <span style={{ marginLeft: 8, fontSize: 10, background: 'rgba(217,119,6,0.18)', color: '#d97706', padding: '2px 8px', borderRadius: 10, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                        🕐 Prog. {new Date(c.publicarEn).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className={styles.claseMeta}>{c.hora} · {c.duracion} min · {c.coachNombre}</div>
                </div>
                <Tag color={!c.tipo?.toLowerCase().includes('slow') ? 'pink' : 'blue'}>{c.tipo}</Tag>
                <div className={styles.claseSpots}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.cupoActual}/{c.cupoMax} lugares</div>
                  <div className={styles.spotsBar}>
                    <div className={styles.spotsFill} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {!isProgramada && <Tag color={statusTag}>{statusLabel}</Tag>}
                {!selectMode && <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => { setModalAlumnosClase(c); setAlumnoAgregarId('') }}
                  >
                    👥 {c.cupoActual}
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnGhost}`}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => {
                      setModalEditClase(c)
                      const coachNombre = c.coachNombre === 'Sin asignar' ? '' : c.coachNombre
                      setEditClaseForm({
                        nombre:      c.nombre,
                        tipo:        c.tipo,
                        coach:       coachNombre,
                        dia:         c.dia,
                        hora:        c.hora,
                        duracion:    String(c.duracion || 50),
                        cupoMax:     String(c.cupoMax || 15),
                        descripcion: c.descripcion || '',
                        publicarEn:  c.publicarEn
                          ? new Date(c.publicarEn).toISOString().slice(0, 16)
                          : '',
                        fecha:       c.fecha ?? '',
                      })
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnGhost}`}
                    style={{ padding: '6px 8px', fontSize: 12, color: '#ef4444' }}
                    onClick={() => {
                      if (!window.confirm(`¿Eliminar la clase "${c.nombre}"?`)) return
                      eliminarClaseConReservas(c.id)
                      toast.success('Clase eliminada')
                    }}
                  >
                    🗑
                  </button>
                </div>}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
