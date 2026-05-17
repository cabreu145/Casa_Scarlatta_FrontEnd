import { useState } from 'react'
import { useConfiguracionStore, CONFIG_DEFAULTS }
  from '@/stores/configuracionStore'
import toast from 'react-hot-toast'
import styles from '../AdminPanel.module.css'

export default function ConfiguracionSection() {
  const { config, actualizar, restaurar } = useConfiguracionStore()
  const [form, setForm] = useState({ ...config })
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar(e) {
    e.preventDefault()

    const horas = Number(form.horasCancelacion)
    if (isNaN(horas) || horas < 1 || horas > 72) {
      toast.error('El límite de cancelación debe estar entre 1 y 72 horas')
      return
    }
    const maxEspera = Number(form.maxListaEspera)
    if (isNaN(maxEspera) || maxEspera < 0 || maxEspera > 50) {
      toast.error('El máximo de lista de espera debe estar entre 0 y 50')
      return
    }
    const minutos = Number(form.minutosConfirmarEspera)
    if (isNaN(minutos) || minutos < 5 || minutos > 1440) {
      toast.error('Los minutos para confirmar deben estar entre 5 y 1440')
      return
    }

    setGuardando(true)

    // [BACKEND] → PUT /api/configuracion
    // Cuando haya backend: hacer fetch aquí antes de actualizar
    // el store local. Si falla la API, no actualizar el store.
    // const res = await fetch('/api/configuracion', {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json',
    //              'Authorization': `Bearer ${getToken()}` },
    //   body: JSON.stringify(form),
    // })
    // if (!res.ok) { toast.error('Error al guardar'); return }

    actualizar({
      horasCancelacion:       horas,
      nombreEstudio:          form.nombreEstudio.trim(),
      ciudad:                 form.ciudad.trim(),
      maxListaEspera:         maxEspera,
      minutosConfirmarEspera: minutos,
    })

    await new Promise(r => setTimeout(r, 400))
    setGuardando(false)
    toast.success('Configuración guardada correctamente')
  }

  function handleRestaurar() {
    if (!window.confirm('¿Restaurar todos los valores a los predeterminados?')) return
    restaurar()
    setForm({ ...CONFIG_DEFAULTS })
    toast('Configuración restaurada', { icon: '↩️' })
  }

  const panel = {
    background:   'var(--neutral-card)',
    border:       '1px solid var(--neutral-border)',
    borderRadius: 12,
    padding:      '24px 28px',
    marginBottom: 16,
  }

  const label = {
    display:      'block',
    fontFamily:   'var(--font-body)',
    fontSize:     13,
    color:        'var(--text-secondary)',
    marginBottom: 6,
    fontWeight:   500,
  }

  const hint = {
    fontFamily: 'var(--font-body)',
    fontSize:   11,
    color:      'var(--text-muted)',
    marginTop:  4,
    lineHeight: 1.5,
  }

  return (
    <form onSubmit={handleGuardar}>

      {/* ── Reservas y cancelaciones ── */}
      <div style={panel}>
        <div style={{
          fontFamily:    'var(--font-heading)',
          fontSize:      15,
          color:         'var(--text-primary)',
          marginBottom:  20,
          paddingBottom: 12,
          borderBottom:  '1px solid var(--neutral-border)',
        }}>
          🗓 Reservas y cancelaciones
        </div>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap:                 20,
        }}>

          {/* Horas de cancelación */}
          <div>
            <label style={label}>Límite de cancelación (horas)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number"
                min={1}
                max={72}
                value={form.horasCancelacion}
                onChange={e => setForm(f => ({ ...f, horasCancelacion: e.target.value }))}
                className={styles.formInput}
                style={{ width: 100 }}
              />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                horas antes de la clase
              </span>
            </div>
            <p style={hint}>
              El cliente NO podrá cancelar si faltan menos de estas horas.
              Valor actual: <strong>{config.horasCancelacion}h</strong>.
              Default: {CONFIG_DEFAULTS.horasCancelacion}h.
            </p>
          </div>

          {/* Máximo lista de espera */}
          <div>
            <label style={label}>Máximo en lista de espera por clase</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number"
                min={0}
                max={50}
                value={form.maxListaEspera}
                onChange={e => setForm(f => ({ ...f, maxListaEspera: e.target.value }))}
                className={styles.formInput}
                style={{ width: 100 }}
              />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                personas (0 = sin límite)
              </span>
            </div>
            <p style={hint}>
              Cuántas personas pueden estar en lista de espera por clase.
              Default: {CONFIG_DEFAULTS.maxListaEspera}.
            </p>
          </div>

          {/* Minutos para confirmar */}
          <div>
            <label style={label}>Tiempo para confirmar lugar en espera (minutos)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number"
                min={5}
                max={1440}
                value={form.minutosConfirmarEspera}
                onChange={e => setForm(f => ({ ...f, minutosConfirmarEspera: e.target.value }))}
                className={styles.formInput}
                style={{ width: 100 }}
              />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                minutos para aceptar
              </span>
            </div>
            <p style={hint}>
              {/* [BACKEND] → Este temporizador lo gestiona el backend.
                  Al liberar un lugar, el backend notifica al primero en la lista
                  y le da este tiempo para confirmar. Si no confirma, pasa al siguiente. */}
              Tiempo que tiene el notificado para confirmar su lugar antes de pasar al siguiente.
              Default: {CONFIG_DEFAULTS.minutosConfirmarEspera} min.
            </p>
          </div>
        </div>
      </div>

      {/* ── Información del estudio ── */}
      <div style={panel}>
        <div style={{
          fontFamily:    'var(--font-heading)',
          fontSize:      15,
          color:         'var(--text-primary)',
          marginBottom:  20,
          paddingBottom: 12,
          borderBottom:  '1px solid var(--neutral-border)',
        }}>
          🏢 Información del estudio
        </div>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap:                 20,
        }}>
          <div>
            <label style={label}>Nombre del estudio</label>
            <input
              type="text"
              value={form.nombreEstudio}
              onChange={e => setForm(f => ({ ...f, nombreEstudio: e.target.value }))}
              className={styles.formInput}
              placeholder="Casa Scarlatta"
            />
            <p style={hint}>
              Aparece en encabezados de PDFs y reportes exportados.
              {/* [BACKEND] → configuracion.nombreEstudio */}
            </p>
          </div>

          <div>
            <label style={label}>Ciudad / Ubicación</label>
            <input
              type="text"
              value={form.ciudad}
              onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
              className={styles.formInput}
              placeholder="Ciudad de México, México"
            />
            <p style={hint}>
              Aparece en el pie de página de los reportes PDF.
              {/* [BACKEND] → configuracion.ciudad */}
            </p>
          </div>
        </div>
      </div>

      {/* ── Botones ── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        gap:            12,
        flexWrap:       'wrap',
      }}>
        <button
          type="button"
          onClick={handleRestaurar}
          style={{
            padding:      '9px 20px',
            borderRadius: 8,
            border:       '1px solid var(--neutral-border)',
            background:   'transparent',
            color:        'var(--text-muted)',
            fontFamily:   'var(--font-body)',
            fontSize:     13,
            cursor:       'pointer',
          }}
        >
          ↩️ Restaurar defaults
        </button>

        <button
          type="submit"
          disabled={guardando}
          style={{
            padding:      '10px 28px',
            borderRadius: 8,
            border:       'none',
            background:   '#7B1E22',
            color:        '#fff',
            fontFamily:   'var(--font-body)',
            fontSize:     14,
            fontWeight:   600,
            cursor:       guardando ? 'not-allowed' : 'pointer',
            opacity:      guardando ? 0.7 : 1,
          }}
        >
          {guardando ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </form>
  )
}
