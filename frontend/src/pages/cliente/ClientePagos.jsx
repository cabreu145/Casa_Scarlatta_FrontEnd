import { useState } from 'react'
import { LayoutDashboard, BookOpen, CreditCard, User } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CompraModal from '@/components/ui/CompraModal'
import { useAuth } from '@/context/AuthContext'
import { usePaquetesStore } from '@/stores/paquetesStore'
import { mockUsers } from '@/data/mockUsers'
import { mockTransacciones } from '@/data/mockTransacciones'
import styles from '@/styles/dashboard.module.css'
import localStyles from './ClientePagos.module.css'

const clienteLinks = [
  { to: '/cliente/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cliente/mis-clases', icon: BookOpen, label: 'Mis Clases' },
  { to: '/cliente/perfil', icon: User, label: 'Mi Perfil' },
  { to: '/cliente/pagos', icon: CreditCard, label: 'Pagos y Paquetes' },
]

function PaqueteCard({ p, activo, modoCompartido, emailCompartido, emailError, onToggleModo, onEmailChange, onComprar }) {
  const puedeCompartir = p.categoria === 'mensual' && (p.nombre === 'Esencial' || p.nombre === 'Premium')
  const compartido = modoCompartido && puedeCompartir
  const clasesDisplay = p.clases === 0 ? '∞' : p.clases
  const clasesLabel = p.clases === 0 ? 'Ilimitadas' : p.clases === 1 ? 'Clase' : 'Clases'
  const esMensual = p.categoria === 'mensual'

  return (
    <div className={`${localStyles.card} ${p.destacado ? localStyles.cardFeatured : ''} ${activo ? localStyles.cardActivo : ''}`}>
      {p.destacado && <div className={localStyles.badge}>MÁS POPULAR</div>}
      {activo && <div className={localStyles.activoBadge}>ACTIVO</div>}

      {/* Big count */}
      <div className={localStyles.countBlock}>
        <span className={localStyles.countNum}>{clasesDisplay}</span>
        <span className={localStyles.countLabel}>{clasesLabel}</span>
      </div>

      <div className={localStyles.cardDivider} />

      <div className={localStyles.cardBody}>
        <div className={localStyles.planName}>{p.nombre}</div>

        <div className={localStyles.priceRow}>
          <span className={localStyles.price}>${p.precio.toLocaleString()}</span>
          <span className={localStyles.priceSuffix}>
            {' '}MX {esMensual ? '/mes' : `/ ${p.vigencia}`}
          </span>
        </div>

        <ul className={localStyles.beneficios}>
          {p.beneficios.map((b) => (
            <li key={b} className={localStyles.beneficio}>
              <span className={localStyles.check}>✓</span>
              {b}
            </li>
          ))}
        </ul>

        {/* Shared mode toggle — only for Esencial & Premium mensual */}
        {puedeCompartir && (
          <div className={localStyles.modoToggle}>
            <button
              type="button"
              className={`${localStyles.modoBtn} ${!modoCompartido ? localStyles.modoBtnActive : ''}`}
              onClick={() => onToggleModo(false)}
            >
              Individual
            </button>
            <button
              type="button"
              className={`${localStyles.modoBtn} ${modoCompartido ? localStyles.modoBtnActive : ''}`}
              onClick={() => onToggleModo(true)}
            >
              Compartida 👥
            </button>
          </div>
        )}

        {compartido && (
          <div className={localStyles.emailGroup}>
            <input
              type="email"
              placeholder="Email del compañero/a"
              value={emailCompartido}
              onChange={onEmailChange}
              className={localStyles.emailInput}
              style={emailError ? { borderColor: '#EF4444' } : {}}
            />
            {emailError && <span className={localStyles.emailError}>{emailError}</span>}
            {p.clases > 0 && (
              <span className={localStyles.splitNote}>
                Cada uno recibe {Math.floor(p.clases / 2)} clases
              </span>
            )}
          </div>
        )}

        <button
          className={`${localStyles.cta} ${p.destacado ? localStyles.ctaFeatured : ''}`}
          onClick={onComprar}
        >
          {activo ? 'Renovar' : 'Comprar'}
        </button>
      </div>
    </div>
  )
}

export default function ClientePagos() {
  const { usuario } = useAuth()
  const { paquetes } = usePaquetesStore()

  const mensuales = paquetes.filter((p) => p.categoria === 'mensual')
  const packs = paquetes.filter((p) => p.categoria === 'pack')

  const [confirmando, setConfirmando] = useState(null)
  const [modoCompartido, setModoCompartido] = useState({})
  const [emailCompartido, setEmailCompartido] = useState({})
  const [emailError, setEmailError] = useState({})

  const misTransacciones = mockTransacciones.filter(
    (t) => t.clienteNombre === usuario?.nombre
  )

  const paqueteActivo = paquetes.find((p) => p.nombre === usuario?.paquete)
  const paqueteInfo = usuario?.paqueteInfo
  const esIlimitado = usuario?.paquete === 'Premium' || usuario?.clasesPaquete === 999
  const clasesUsadas =
    !esIlimitado && usuario?.clasesPaqueteTotal && usuario.clasesPaqueteTotal !== 999
      ? usuario.clasesPaqueteTotal - (usuario.clasesPaquete || 0)
      : null

  const handleComprarClick = (p) => {
    const compartido = modoCompartido[p.id]
    const puedeCompartir = p.categoria === 'mensual' && (p.nombre === 'Esencial' || p.nombre === 'Premium')
    const email = emailCompartido[p.id] || ''

    if (compartido && puedeCompartir) {
      const partner = mockUsers.find((u) => u.email === email && u.rol === 'cliente')
      if (!partner) {
        setEmailError((prev) => ({ ...prev, [p.id]: 'El usuario con ese email no existe' }))
        return
      }
      if (partner.email === usuario?.email) {
        setEmailError((prev) => ({ ...prev, [p.id]: 'No puedes compartir contigo mismo' }))
        return
      }
      setConfirmando({ paquete: p, compartido: true, partnerNombre: partner.nombre })
    } else {
      setConfirmando({ paquete: p, compartido: false, partnerNombre: null })
    }
  }

  const toggleModo = (pId, val) => {
    setModoCompartido((prev) => ({ ...prev, [pId]: val }))
    setEmailError((prev) => ({ ...prev, [pId]: '' }))
  }

  return (
    <DashboardLayout links={clienteLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.greeting}>Pagos y Paquetes</h1>
          <p className={styles.subtitle}>Paquete actual: {usuario?.paquete || 'Ninguno'}</p>
        </div>

        {/* Tracking del paquete activo */}
        {paqueteActivo && paqueteInfo && (
          <div className={localStyles.trackingCard}>
            <div className={localStyles.trackingHeader}>
              <div>
                <span className={localStyles.trackingLabel}>Paquete activo</span>
                <h3 className={localStyles.trackingNombre}>{usuario.paquete}</h3>
              </div>
              <span className={`${styles.badge} ${styles.badgeConfirmada}`}>{paqueteInfo.estado}</span>
            </div>
            <div className={localStyles.trackingGrid}>
              <div className={localStyles.trackingItem}>
                <span className={localStyles.trackingKey}>Fecha de compra</span>
                <span className={localStyles.trackingVal}>{paqueteInfo.fechaCompra}</span>
              </div>
              <div className={localStyles.trackingItem}>
                <span className={localStyles.trackingKey}>Tipo</span>
                <span className={localStyles.trackingVal}>{paqueteInfo.tipo}</span>
              </div>
              {!esIlimitado && (
                <>
                  <div className={localStyles.trackingItem}>
                    <span className={localStyles.trackingKey}>Clases restantes</span>
                    <span className={localStyles.trackingVal} style={{ color: 'var(--brand-wine)', fontWeight: 600 }}>
                      {usuario.clasesPaquete}
                    </span>
                  </div>
                  <div className={localStyles.trackingItem}>
                    <span className={localStyles.trackingKey}>Clases usadas</span>
                    <span className={localStyles.trackingVal}>{clasesUsadas}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Suscripciones mensuales ── */}
        <div className={localStyles.sectionHeader}>
          <h2 className={localStyles.sectionTitle}>Suscripciones mensuales</h2>
          <p className={localStyles.sectionSub}>Sin permanencia · Cancela cuando quieras</p>
        </div>
        <div className={localStyles.paquetesGrid}>
          {mensuales.map((p) => (
            <PaqueteCard
              key={p.id}
              p={p}
              activo={usuario?.paquete === p.nombre}
              modoCompartido={modoCompartido[p.id] || false}
              emailCompartido={emailCompartido[p.id] || ''}
              emailError={emailError[p.id] || ''}
              onToggleModo={(val) => toggleModo(p.id, val)}
              onEmailChange={(e) => {
                setEmailCompartido((prev) => ({ ...prev, [p.id]: e.target.value }))
                setEmailError((prev) => ({ ...prev, [p.id]: '' }))
              }}
              onComprar={() => handleComprarClick(p)}
            />
          ))}
        </div>

        {/* ── Packs de clases ── */}
        <div className={localStyles.sectionHeader} style={{ marginTop: 'var(--space-2xl)' }}>
          <h2 className={localStyles.sectionTitle}>Packs de clases</h2>
          <p className={localStyles.sectionSub}>Clases sueltas sin mensualidad · Úsalas a tu ritmo</p>
        </div>
        <div className={localStyles.packsGrid}>
          {packs.map((p) => (
            <PaqueteCard
              key={p.id}
              p={p}
              activo={usuario?.paquete === p.nombre}
              modoCompartido={false}
              emailCompartido=""
              emailError=""
              onToggleModo={() => {}}
              onEmailChange={() => {}}
              onComprar={() => handleComprarClick(p)}
            />
          ))}
        </div>

        {/* Historial */}
        {misTransacciones.length > 0 && (
          <div className={styles.panel} style={{ marginTop: 'var(--space-2xl)' }}>
            <div className={styles.panelTitle}>Historial de pagos</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Paquete</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {misTransacciones.map((t) => (
                  <tr key={t.id}>
                    <td>{t.fecha}</td>
                    <td>{t.paquete}</td>
                    <td>${t.monto.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeConfirmada}`}>{t.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de compra */}
        {confirmando && (
          <CompraModal
            paquete={confirmando.paquete}
            compartido={confirmando.compartido}
            partnerNombre={confirmando.partnerNombre}
            onClose={() => setConfirmando(null)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
