import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'

export default function PaquetesSection({
  paquetes,
  transacciones,
  usuarios,
  openModal,
  setModalEditPaquete,
  setEditPaqueteForm,
  eliminarPaquete,
  marcarDestacado,
}) {
  return (
    <>
      <div className={styles.sectionTopRow}>
        <div />
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal('paquete')}>
          + Nuevo Paquete
        </button>
      </div>
      <div className={styles.paquetesGrid}>
        {paquetes.map((p) => (
          <div key={p.id} className={`${styles.paqueteCard} ${p.destacado ? styles.featured : ''}`}>
            {p.destacado && <div className={styles.paqueteBadge}>⭐ Más popular</div>}
            <div className={styles.paqueteName}>{p.nombre}</div>
            <div className={styles.paqueteClases}>
              {p.clases === 0 ? 'Clases ilimitadas' : `${p.clases} clases`}
              {p.vigencia ? ` · ${p.vigencia}` : ''}
            </div>
            <div className={styles.paquetePrice}>
              ${p.precio.toLocaleString()}<span>/{p.categoria === 'mensual' ? 'mes' : 'paquete'}</span>
            </div>
            <div className={styles.paqueteStats}>
              <div className={styles.paqueteStat}><strong>{p.beneficios.length}</strong>beneficios</div>
              <div className={styles.paqueteStat}><strong>{p.categoria}</strong></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ fontSize: 11, padding: '6px' }}
                onClick={() => {
                  setModalEditPaquete(p)
                  setEditPaqueteForm({
                    nombre:    p.nombre,
                    precio:    String(p.precio),
                    clases:    String(p.clases),
                    vigencia:  p.vigencia || '',
                    categoria: p.categoria,
                    destacado: p.destacado || false,
                    beneficios: [...(p.beneficios || [])],
                  })
                }}
              >✏️ Editar</button>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ fontSize: 11, padding: '6px', color: '#ef4444' }}
                onClick={() => {
                  if (!window.confirm(`¿Eliminar el paquete "${p.nombre}"?`)) return
                  eliminarPaquete(p.id)
                  toast.success(`Paquete "${p.nombre}" eliminado`)
                }}
              >🗑 Eliminar</button>
              {!p.destacado && (
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: 11, padding: '6px', gridColumn: '1/-1', color: '#d97706' }}
                  onClick={() => { marcarDestacado(p.id); toast.success(`"${p.nombre}" marcado como popular`) }}
                >⭐ Marcar popular</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Historial de ventas de paquetes</div>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Descarga disponible en Reportes</span>
        </div>
        <div className={styles.tableWrap}>
          {(() => {
            const ventasPaq = transacciones
              .filter(tx => tx.tipo === 'paquete')
              .slice().reverse()
            if (ventasPaq.length === 0) return (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                No hay ventas de paquetes registradas.
              </div>
            )
            return (
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th><th>Paquete</th><th>Fecha compra</th>
                    <th>Vencimiento</th><th>Clases rest.</th><th>Monto</th><th>Método</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasPaq.map((tx, i) => {
                    const usuario = usuarios.find(u => u.id === tx.userId)
                    const paqInfo = paquetes.find(p => tx.concepto?.includes(p.nombre))
                    const vencimiento = (() => {
                      if (!tx.fecha || !paqInfo?.vigencia) return '—'
                      const dias = parseInt(paqInfo.vigencia) || 30
                      const d = new Date(tx.fecha + 'T00:00:00')
                      d.setDate(d.getDate() + dias)
                      return d.toISOString().split('T')[0]
                    })()
                    const clasesRest = usuario?.clasesPaquete ?? '—'
                    return (
                      <tr key={i}>
                        <td>{usuario?.nombre ?? tx.userId ?? '—'}</td>
                        <td>{tx.concepto ?? '—'}</td>
                        <td>{tx.fecha ?? '—'}</td>
                        <td>{vencimiento}</td>
                        <td>{clasesRest}</td>
                        <td className={styles.mono}>{tx.monto}</td>
                        <td>{tx.metodoPago ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          })()}
        </div>
      </div>
    </>
  )
}
