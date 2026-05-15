import styles from '../AdminPanel.module.css'

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

function categoryEmoji(categoria) {
  return { Accesorios: '🎽', Nutrición: '🧴', Equipo: '🏋️', Ropa: '👕' }[categoria] || '📦'
}

export default function PuntoDeVentaSection({
  paquetes,
  productos,
  agregarProducto,
  editarProducto,
  eliminarProducto,
  cart,
  posFilter,
  setPosFilter,
  prodModal,
  setProdModal,
  prodForm,
  setProdForm,
  confirmarEliminarProd,
  setConfirmarEliminarProd,
  pendingAsignacion,
  cartSubtotal,
  cartIva,
  cartTotal,
  addToCart,
  removeFromCart,
  clearCart,
  handleCobrar,
  handleSaveProducto,
  handleEliminarProducto,
}) {
  return (
    <div className={styles.posGrid}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <FilterChips
            options={['Todos', '📦 Paquetes', 'Accesorios', 'Nutrición', 'Equipo', 'Ropa']}
            active={posFilter}
            onChange={setPosFilter}
          />
          {posFilter !== '📦 Paquetes' && (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ fontSize: 13, padding: '6px 14px' }}
              onClick={() => { setProdModal('nuevo'); setProdForm({ nombre: '', categoria: posFilter === 'Todos' ? 'Accesorios' : posFilter, precio: '', stock: '', emoji: '' }) }}
            >
              + Agregar producto
            </button>
          )}
        </div>
        <div className={styles.productGrid}>
          {(posFilter === '📦 Paquetes'
              ? paquetes.map(p => ({ ...p, emoji: p.clases === 0 ? '⭐' : '📦', name: `${p.nombre} — ${p.clases === 0 ? 'Ilimitadas' : p.clases + ' clases'}`, price: p.precio }))
              : productos.filter((p) => p.activo && (posFilter === 'Todos' || p.categoria === posFilter))
            ).map((p) => {
            const isPaquete = posFilter === '📦 Paquetes'
            const emoji  = p.emoji || categoryEmoji(p.categoria)
            const nombre = p.nombre ?? p.name
            const precio = p.precio ?? p.price
            return (
              <div key={p.id ?? p.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  className={styles.productCard}
                  onClick={() => addToCart({ name: nombre, price: precio, emoji })}
                >
                  <div className={styles.productEmoji}>{emoji}</div>
                  <div className={styles.productName}>{nombre}</div>
                  <div className={styles.productPrice}>${precio.toLocaleString()}</div>
                </button>
                {!isPaquete && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      style={{ flex: 1, fontSize: 11, padding: '3px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-muted)' }}
                      onClick={() => { setProdForm({ nombre: p.nombre, categoria: p.categoria, precio: String(p.precio), stock: String(p.stock), emoji: p.emoji || '' }); setProdModal({ producto: p }) }}
                    >✏️</button>
                    <button
                      style={{ flex: 1, fontSize: 11, padding: '3px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, cursor: 'pointer', color: '#ef4444' }}
                      onClick={() => setConfirmarEliminarProd(p)}
                    >🗑</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.cartSection}>
        <div className={styles.cartTitle}>🛒 Orden actual</div>
        {pendingAsignacion && (
          <div style={{ margin: '0 0 10px', padding: '10px 12px', background: 'rgba(234,179,8,0.1)', borderRadius: 8, border: '1px solid rgba(234,179,8,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>🔒</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', fontFamily: 'var(--font-body)' }}>
                Paquete pendiente de cobro
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
              👤 <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{pendingAsignacion.userName}</strong> recibirá el paquete <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{pendingAsignacion.paqSel.nombre}</strong> al confirmar el cobro.
            </div>
          </div>
        )}
        <div className={styles.cartItems}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 13 }}>
              Selecciona productos para agregar
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className={styles.cartItem}>
                <span>{item.emoji} {item.name}</span>
                <span className={styles.cartItemPrice}>${item.price.toLocaleString()}</span>
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
          onClick={handleCobrar}
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
  )
}
