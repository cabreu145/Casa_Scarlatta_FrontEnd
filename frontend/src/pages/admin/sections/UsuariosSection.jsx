import { useState } from 'react'
import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'

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

export default function UsuariosSection({
  usuarios,
  paquetes,
  usersFilter,
  setUsersFilter,
  usersSearch,
  setUsersSearch,
  userSelectMode,
  setUserSelectMode,
  userSelectedIds,
  setUserSelectedIds,
  eliminarUsuario,
  openModal,
  setModalVerUsuario,
  setAsignarPaqueteForm,
  setEditNotas,
  setCederClaseUserId,
}) {
  const [usersExpandido, setUsersExpandido] = useState(false)
  const PAGE_SIZE = 10

  const usuariosFiltrados = usuarios.filter((u) => {
    if (u.rol === 'coach' || u.rol === 'admin') return false
    if (usersSearch.trim()) {
      const q = usersSearch.toLowerCase()
      const coincide = u.nombre?.toLowerCase().includes(q)
        || u.email?.toLowerCase().includes(q)
        || u.paquete?.toLowerCase().includes(q)
        || u.telefono?.toLowerCase().includes(q)
      if (!coincide) return false
    }
    if (usersFilter === 'Activos')     return u.activo && u.paquete
    if (usersFilter === 'Sin paquete') return !u.paquete
    if (usersFilter === 'Por vencer')  return u.clasesPaquete !== 999 && u.clasesPaquete > 0 && u.clasesPaquete <= 2
    return true
  })
  const usuariosVisibles = usersExpandido ? usuariosFiltrados : usuariosFiltrados.slice(0, PAGE_SIZE)
  const hayMasUsuarios   = usuariosFiltrados.length > PAGE_SIZE

  return (
    <>
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
            <input
              className={styles.searchInput}
              placeholder="🔍 Buscar usuario..."
              type="text"
              value={usersSearch}
              onChange={e => setUsersSearch(e.target.value)}
            />
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
          <div style={{ display: 'flex', gap: 8 }}>
            {userSelectMode && userSelectedIds.size > 0 && (
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={() => {
                  if (!window.confirm(`¿Eliminar ${userSelectedIds.size} usuario${userSelectedIds.size > 1 ? 's' : ''}?`)) return
                  userSelectedIds.forEach(id => eliminarUsuario(id))
                  toast.success(`${userSelectedIds.size} usuario${userSelectedIds.size > 1 ? 's eliminados' : ' eliminado'}`)
                  setUserSelectedIds(new Set())
                  setUserSelectMode(false)
                }}
              >
                🗑 Eliminar ({userSelectedIds.size})
              </button>
            )}
            <button
              className={`${styles.btn} ${userSelectMode ? styles.btnSecondary : styles.btnGhost}`}
              onClick={() => { setUserSelectMode(v => !v); setUserSelectedIds(new Set()) }}
            >
              {userSelectMode ? '✕ Cancelar' : '☑ Seleccionar'}
            </button>
            {!userSelectMode && (
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('usuario')}>
                + Nuevo usuario
              </button>
            )}
          </div>
        </div>

        {/* Toolbar de selección */}
        {userSelectMode && (() => {
          const listaVisible = usuarios.filter((u) => {
            if (usersSearch.trim()) {
              const q = usersSearch.toLowerCase()
              if (!u.nombre?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false
            }
            if (usersFilter === 'Activos')     return u.activo && u.paquete
            if (usersFilter === 'Sin paquete') return !u.paquete
            if (usersFilter === 'Por vencer')  return u.clasesPaquete !== 999 && u.clasesPaquete > 0 && u.clasesPaquete <= 2
            return true
          })
          const todosSeleccionados = listaVisible.length > 0 && listaVisible.every(u => userSelectedIds.has(u.id))
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 8, fontFamily: 'var(--font-body)', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={todosSeleccionados}
                onChange={() => {
                  if (todosSeleccionados) setUserSelectedIds(new Set())
                  else setUserSelectedIds(new Set(listaVisible.map(u => u.id)))
                }}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#ef4444' }}
              />
              <span style={{ color: 'var(--muted)' }}>
                {userSelectedIds.size === 0
                  ? 'Selecciona los usuarios que deseas eliminar'
                  : `${userSelectedIds.size} de ${listaVisible.length} seleccionado${userSelectedIds.size > 1 ? 's' : ''}`}
              </span>
              {userSelectedIds.size > 0 && (
                <button
                  style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  onClick={() => setUserSelectedIds(new Set())}
                >
                  Deseleccionar todo
                </button>
              )}
            </div>
          )
        })()}

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                {userSelectMode && <th style={{ width: 36 }}></th>}
                <th>Usuario</th><th>Paquete</th><th>Clases restantes</th>
                <th>Vencimiento</th><th>Última clase</th><th>Total gastado</th>
                <th>Estado</th><th></th>
              </tr>
            </thead>
            <tbody>
              {usuariosVisibles.map((u) => {
                  const restantes  = u.clasesPaquete === 999 ? 'Ilimitadas' : (u.clasesPaquete ?? 0)
                  const tag        = u.activo && u.paquete ? 'green' : !u.paquete ? 'red' : 'yellow'
                  const label      = u.activo && u.paquete ? 'Activo' : !u.paquete ? 'Sin paquete' : 'Inactivo'
                  const isSelected = userSelectedIds.has(u.id)
                  return (
                    <tr
                      key={u.id}
                      style={{ cursor: userSelectMode ? 'pointer' : undefined, background: isSelected ? 'rgba(239,68,68,0.08)' : undefined }}
                      onClick={userSelectMode ? () => {
                        setUserSelectedIds(prev => {
                          const next = new Set(prev)
                          next.has(u.id) ? next.delete(u.id) : next.add(u.id)
                          return next
                        })
                      } : undefined}
                    >
                      {userSelectMode && (
                        <td onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setUserSelectedIds(prev => {
                                const next = new Set(prev)
                                next.has(u.id) ? next.delete(u.id) : next.add(u.id)
                                return next
                              })
                            }}
                            style={{ width: 15, height: 15, accentColor: '#ef4444', cursor: 'pointer' }}
                          />
                        </td>
                      )}
                      <td style={{ whiteSpace: 'normal', minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className={styles.miniAvatar} style={{ width: 28, height: 28, fontSize: 12, flexShrink: 0 }}>{u.nombre[0]}</div>
                          {u.nombre}
                        </div>
                      </td>
                      <td>{u.paquete || '—'}</td>
                      <td>{restantes}</td>
                      <td>{(() => {
                        if (u.paqueteInfo?.fechaVencimiento) return u.paqueteInfo.fechaVencimiento
                        if (!u.paqueteInfo?.fechaCompra || !u.paquete) return '—'
                        const paq = paquetes.find(p => p.nombre === u.paquete)
                        if (!paq?.vigencia) return '—'
                        const dias = parseInt(paq.vigencia) || 30
                        const d = new Date(u.paqueteInfo.fechaCompra + 'T00:00:00')
                        d.setDate(d.getDate() + dias)
                        return d.toISOString().split('T')[0]
                      })()}</td>
                      <td>—</td>
                      <td className={styles.mono}>—</td>
                      <td><Tag color={tag}>{label}</Tag></td>
                      <td>{!userSelectMode && <button className={styles.coachBtn} style={{ width: 60 }} onClick={() => { setModalVerUsuario(u); setAsignarPaqueteForm({ paqueteNombre: u.paquete || '', metodoPago: 'efectivo' }); setEditNotas(u.notas || ''); setCederClaseUserId('') }}>Ver</button>}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
        {hayMasUsuarios && (
          <button
            onClick={() => setUsersExpandido(v => !v)}
            style={{
              width: '100%', marginTop: 12, padding: '9px 0',
              borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = 'rgba(123,31,46,0.15)'
              e.currentTarget.style.color       = '#E8A4AD'
              e.currentTarget.style.borderColor = 'rgba(123,31,46,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.color       = 'rgba(255,255,255,0.5)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          >
            {usersExpandido ? '▲ Ver menos' : `▼ Ver ${usuariosFiltrados.length - PAGE_SIZE} más`}
          </button>
        )}
      </div>
    </>
  )
}
