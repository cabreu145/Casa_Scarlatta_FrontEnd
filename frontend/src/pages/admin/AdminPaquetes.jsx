import { useState } from 'react'
import { Plus, Trash2, Edit3, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { usePaquetesStore } from '@/stores/paquetesStore'
import styles from '@/styles/dashboard.module.css'
import localStyles from './AdminPaquetes.module.css'

export default function AdminPaquetes() {
  const {
    paquetes,
    actualizarPaquete,
    agregarBeneficio,
    editarBeneficio,
    eliminarBeneficio,
    marcarDestacado,
    resetearPaquetes,
  } = usePaquetesStore()

  const [editandoBeneficio, setEditandoBeneficio] = useState(null)
  const [nuevoBeneficio, setNuevoBeneficio] = useState({})

  const handleCampo = (paqueteId, campo, valor) => {
    actualizarPaquete(paqueteId, { [campo]: campo === 'precio' || campo === 'clases' ? Number(valor) : valor })
  }

  const handleGuardar = () => {
    toast.success('Cambios guardados. La landing ya refleja los nuevos precios.')
  }

  return (
    <DashboardLayout links={adminLinks}>
      <div className={styles.page}>
        <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.greeting}>Gestión de Paquetes</h1>
            <p className={styles.subtitle}>Los cambios se reflejan automáticamente en la landing</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={resetearPaquetes}>
              Restablecer
            </button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleGuardar}>
              Guardar cambios
            </button>
          </div>
        </div>

        <div className={localStyles.paquetesGrid}>
          {paquetes.map((paquete) => (
            <div
              key={paquete.id}
              className={`${localStyles.paqueteCard} ${paquete.destacado ? localStyles.paqueteDestacado : ''}`}
            >
              <div className={localStyles.cardHeader}>
                <button
                  className={`${localStyles.destacadoBtn} ${paquete.destacado ? localStyles.destacadoBtnActive : ''}`}
                  onClick={() => marcarDestacado(paquete.id)}
                  title="Marcar como destacado"
                >
                  <Star size={16} />
                  {paquete.destacado ? 'Destacado' : 'Marcar destacado'}
                </button>
              </div>

              <div className={localStyles.field}>
                <label className={localStyles.fieldLabel}>Nombre</label>
                <input
                  className={localStyles.fieldInput}
                  value={paquete.nombre}
                  onChange={(e) => handleCampo(paquete.id, 'nombre', e.target.value)}
                />
              </div>

              <div className={localStyles.fieldRow}>
                <div className={localStyles.field}>
                  <label className={localStyles.fieldLabel}>Precio (MXN)</label>
                  <input
                    className={localStyles.fieldInput}
                    type="number"
                    value={paquete.precio}
                    onChange={(e) => handleCampo(paquete.id, 'precio', e.target.value)}
                  />
                </div>
                <div className={localStyles.field}>
                  <label className={localStyles.fieldLabel}>Clases (0 = ilimitadas)</label>
                  <input
                    className={localStyles.fieldInput}
                    type="number"
                    value={paquete.clases}
                    onChange={(e) => handleCampo(paquete.id, 'clases', e.target.value)}
                  />
                </div>
              </div>

              <div className={localStyles.beneficiosSection}>
                <div className={localStyles.beneficiosHeader}>
                  <span className={localStyles.fieldLabel}>Beneficios</span>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                    onClick={() => agregarBeneficio(paquete.id, 'Nuevo beneficio')}
                  >
                    <Plus size={13} /> Agregar
                  </button>
                </div>
                <ul className={localStyles.beneficiosList}>
                  {paquete.beneficios.map((b, i) => (
                    <li key={i} className={localStyles.beneficioItem}>
                      {editandoBeneficio?.paqueteId === paquete.id && editandoBeneficio?.index === i ? (
                        <input
                          className={localStyles.beneficioInput}
                          autoFocus
                          value={b}
                          onChange={(e) => editarBeneficio(paquete.id, i, e.target.value)}
                          onBlur={() => setEditandoBeneficio(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditandoBeneficio(null)}
                        />
                      ) : (
                        <>
                          <span className={localStyles.beneficioTexto}>● {b}</span>
                          <div className={localStyles.beneficioAcciones}>
                            <button
                              className={localStyles.iconBtn}
                              onClick={() => setEditandoBeneficio({ paqueteId: paquete.id, index: i })}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              className={`${localStyles.iconBtn} ${localStyles.iconBtnDanger}`}
                              onClick={() => eliminarBeneficio(paquete.id, i)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
