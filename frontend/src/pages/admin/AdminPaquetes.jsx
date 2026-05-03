import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2, Edit3, Pencil, Star, X } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { adminLinks } from './AdminDashboard'
import { usePaquetesStore } from '@/stores/paquetesStore'
import {
  crearPaqueteService,
  editarPaqueteService,
  eliminarPaqueteService,
} from '@/services/paquetesService'
import styles from '@/styles/dashboard.module.css'
import localStyles from './AdminPaquetes.module.css'

// ── Modal crear / editar paquete ──────────────────────────────────────────────

function PaqueteModal({ paquete, onClose }) {
  const [form, setForm] = useState(
    paquete
      ? {
          nombre:     paquete.nombre,
          precio:     String(paquete.precio),
          clases:     String(paquete.clases),
          vigencia:   paquete.vigencia,
          categoria:  paquete.categoria,
          beneficios: paquete.beneficios.join('\n'),
          destacado:  paquete.destacado,
        }
      : {
          nombre: '', precio: '', clases: '', vigencia: 'Mensual',
          categoria: 'mensual', beneficios: '', destacado: false,
        }
  )
  const [guardando, setGuardando] = useState(false)
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    const payload = {
      ...form,
      precio:    Number(form.precio),
      clases:    Number(form.clases),
      beneficios: form.beneficios,
    }
    const resultado = paquete
      ? await editarPaqueteService(paquete.id, {
          ...payload,
          beneficios: form.beneficios.split('\n').filter(Boolean),
        })
      : await crearPaqueteService(payload)

    if (resultado.ok) {
      toast.success(resultado.mensaje)
      onClose()
    } else {
      toast.error(resultado.mensaje)
    }
    setGuardando(false)
  }

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 className={styles.modalTitle} style={{ margin: 0 }}>
            {paquete ? 'Editar paquete' : 'Nuevo paquete'}
          </h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid} style={{ marginBottom: 'var(--space-lg)' }}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Nombre <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="text" value={form.nombre} onChange={set('nombre')}
                placeholder="Ej: Pack 30 clases" />
            </div>
            <div className={styles.field}>
              <label>Precio (MXN) <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="number" min="0" value={form.precio} onChange={set('precio')}
                placeholder="Ej: 1200" />
            </div>
            <div className={styles.field}>
              <label>Clases (0 = ilimitadas)</label>
              <input type="number" min="0" value={form.clases} onChange={set('clases')}
                placeholder="Ej: 10" />
            </div>
            <div className={styles.field}>
              <label>Vigencia</label>
              <input type="text" value={form.vigencia} onChange={set('vigencia')}
                placeholder="Ej: Mensual, 30 días" />
            </div>
            <div className={styles.field}>
              <label>Categoría</label>
              <select value={form.categoria} onChange={set('categoria')}>
                <option value="mensual">Mensual</option>
                <option value="pack">Pack de clases</option>
              </select>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Beneficios (uno por línea)</label>
              <textarea
                className={styles.formInput}
                rows={3}
                value={form.beneficios}
                onChange={set('beneficios')}
                placeholder={'8 clases al mes\nAcceso a Stride y Slow\nSin permanencia'}
                style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div className={styles.field} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
              <input type="checkbox" id="dest-modal" checked={form.destacado}
                onChange={(e) => setForm((p) => ({ ...p, destacado: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="dest-modal" style={{ cursor: 'pointer', margin: 0 }}>Marcar como "Más popular"</label>
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cancelar</button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={guardando}>
              {guardando ? 'Guardando…' : paquete ? 'Guardar cambios' : 'Crear paquete'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

function ConfirmModal({ mensaje, onConfirm, onClose }) {
  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Confirmar acción</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)' }}>{mensaje}</p>
        <div className={styles.modalActions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Cancelar</button>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

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

  const [editandoBeneficio,  setEditandoBeneficio]  = useState(null)
  const [modalAbierto,       setModalAbierto]       = useState(false)
  const [paqueteEditando,    setPaqueteEditando]    = useState(null)
  const [confirmarEliminar,  setConfirmarEliminar]  = useState(null)

  const handleAbrirCrear   = ()       => { setPaqueteEditando(null);    setModalAbierto(true)  }
  const handleAbrirEditar  = (paquete) => { setPaqueteEditando(paquete); setModalAbierto(true)  }
  const handleCerrar       = ()       => { setModalAbierto(false);      setPaqueteEditando(null) }

  const handleCampo = (paqueteId, campo, valor) => {
    actualizarPaquete(paqueteId, { [campo]: campo === 'precio' || campo === 'clases' ? Number(valor) : valor })
  }

  const handleEliminar = async () => {
    const resultado = await eliminarPaqueteService(confirmarEliminar.id)
    if (resultado.ok) toast.success(resultado.mensaje)
    else toast.error(resultado.mensaje)
    setConfirmarEliminar(null)
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
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAbrirCrear}>
              + Nuevo paquete
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
                  {paquete.destacado ? 'Destacado' : 'Destacar'}
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className={localStyles.iconBtn}
                    onClick={() => handleAbrirEditar(paquete)}
                    title="Editar paquete"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className={`${localStyles.iconBtn} ${localStyles.iconBtnDanger}`}
                    onClick={() => setConfirmarEliminar(paquete)}
                    title="Eliminar paquete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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

      {modalAbierto && (
        <PaqueteModal paquete={paqueteEditando} onClose={handleCerrar} />
      )}

      {confirmarEliminar && (
        <ConfirmModal
          mensaje={`¿Eliminar el paquete "${confirmarEliminar.nombre}"? Esta acción no se puede deshacer.`}
          onConfirm={handleEliminar}
          onClose={() => setConfirmarEliminar(null)}
        />
      )}
    </DashboardLayout>
  )
}
