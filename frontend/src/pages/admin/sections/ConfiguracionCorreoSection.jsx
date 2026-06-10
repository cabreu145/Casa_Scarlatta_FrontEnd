import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import PaginationControls from '@/components/ui/PaginationControls'
import {
  useEmailConfigQuery,
  useEmailOutboxQuery,
  useRetryEmailOutboxMutation,
  useSendTestEmailMutation,
  useUpdateEmailConfigMutation,
} from '@/hooks/useApiQueries'
import styles from '../AdminPanel.module.css'

const useApiMode = import.meta.env.VITE_USE_API_AUTH === 'true'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'pending' },
  { value: 'sent', label: 'sent' },
  { value: 'failed', label: 'failed' },
  { value: 'skipped', label: 'skipped' },
]

const PRESETS = {
  smtp: {
    label: 'SMTP',
    smtpHost: '',
    smtpPort: 465,
    smtpUseSsl: true,
    smtpUseTls: false,
    note: 'SMTP genérico. Usa tu servidor propio o proveedor actual.',
  },
  gmail: {
    label: 'Gmail',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUseSsl: true,
    smtpUseTls: false,
    note: 'Para Gmail normalmente se requiere contraseña de aplicación.',
  },
  outlook: {
    label: 'Outlook',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpUseSsl: false,
    smtpUseTls: true,
    note: 'Outlook normalmente usa STARTTLS en puerto 587.',
  },
  server: {
    label: 'Servidor propio',
    smtpHost: 'casascarlatta.mx',
    smtpPort: 465,
    smtpUseSsl: true,
    smtpUseTls: false,
    smtpUsername: 'contacto@casascarlatta.mx',
    fromAddress: 'contacto@casascarlatta.mx',
    fromName: 'Casa Scarlatta',
    note: 'Configuración sugerida para Casa Scarlatta.',
  },
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim())
}

function isPositivePort(value) {
  const port = Number(value)
  return Number.isInteger(port) && port > 0 && port <= 65535
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function getStatusLabel(status) {
  const key = String(status ?? '').trim().toLowerCase()
  return {
    pending: 'pending',
    sent: 'sent',
    failed: 'failed',
    skipped: 'skipped',
  }[key] ?? (status ? String(status) : '—')
}

function normalizeConfig(data = {}) {
  return {
    emailEnabled: Boolean(data.emailEnabled),
    provider: data.provider ?? 'smtp',
    fromName: data.fromName ?? '',
    fromAddress: data.fromAddress ?? '',
    smtpHost: data.smtpHost ?? '',
    smtpPort: data.smtpPort ?? 465,
    smtpUsername: data.smtpUsername ?? '',
    smtpPassword: '',
    smtpUseSsl: data.smtpUseSsl ?? true,
    smtpUseTls: data.smtpUseTls ?? false,
    smtpPasswordSet: Boolean(data.smtpPasswordSet),
    imapHost: data.imapHost ?? '',
    imapPort: data.imapPort ?? 993,
    imapUsername: data.imapUsername ?? '',
    imapPassword: '',
    imapUseSsl: data.imapUseSsl ?? true,
    imapPasswordSet: Boolean(data.imapPasswordSet),
    pop3Host: data.pop3Host ?? '',
    pop3Port: data.pop3Port ?? 995,
    pop3Username: data.pop3Username ?? '',
    pop3Password: '',
    pop3UseSsl: data.pop3UseSsl ?? true,
    pop3PasswordSet: Boolean(data.pop3PasswordSet),
  }
}

function applyPresetToForm(current, presetName) {
  const preset = PRESETS[presetName]
  if (!preset) return current
  return {
    ...current,
    provider: 'smtp',
    smtpHost: preset.smtpHost ?? current.smtpHost,
    smtpPort: preset.smtpPort ?? current.smtpPort,
    smtpUseSsl: preset.smtpUseSsl ?? current.smtpUseSsl,
    smtpUseTls: preset.smtpUseTls ?? current.smtpUseTls,
    smtpUsername: preset.smtpUsername ?? current.smtpUsername,
    fromAddress: preset.fromAddress ?? current.fromAddress,
    fromName: preset.fromName ?? current.fromName,
  }
}

function getSecurityMode(form) {
  if (form.smtpUseSsl) return 'ssl'
  if (form.smtpUseTls) return 'starttls'
  return 'none'
}

function applySecurityMode(form, mode) {
  if (mode === 'ssl') {
    return { ...form, smtpUseSsl: true, smtpUseTls: false }
  }
  if (mode === 'starttls') {
    return { ...form, smtpUseSsl: false, smtpUseTls: true }
  }
  return { ...form, smtpUseSsl: false, smtpUseTls: false }
}

function buildSavePayload(form) {
  return {
    emailEnabled: Boolean(form.emailEnabled),
    provider: form.provider.trim() || 'smtp',
    fromName: form.fromName.trim(),
    fromAddress: form.fromAddress.trim(),
    smtpHost: form.smtpHost.trim(),
    smtpPort: Number(form.smtpPort),
    smtpUsername: form.smtpUsername.trim(),
    smtpPassword: form.smtpPassword.trim(),
    smtpUseSsl: Boolean(form.smtpUseSsl),
    smtpUseTls: Boolean(form.smtpUseTls),
    imapHost: form.imapHost.trim(),
    imapPort: Number(form.imapPort),
    imapUsername: form.imapUsername.trim(),
    imapPassword: form.imapPassword.trim(),
    imapUseSsl: Boolean(form.imapUseSsl),
    pop3Host: form.pop3Host.trim(),
    pop3Port: Number(form.pop3Port),
    pop3Username: form.pop3Username.trim(),
    pop3Password: form.pop3Password.trim(),
    pop3UseSsl: Boolean(form.pop3UseSsl),
  }
}

function getFriendlyTestEmailFailure(message = '') {
  const text = String(message)
  if (/Connection unexpectedly closed: timed out/i.test(text) || /timed out/i.test(text)) {
    return 'No se pudo conectar al servidor SMTP. Revisa servidor, puerto, seguridad SSL/TLS, usuario, contraseña o firewall.'
  }
  return text || 'No se pudo enviar correo de prueba'
}

export default function ConfiguracionCorreoSection() {
  const enabled = useApiMode
  const configQuery = useEmailConfigQuery({ enabled })
  const updateMutation = useUpdateEmailConfigMutation()
  const testMutation = useSendTestEmailMutation()
  const retryMutation = useRetryEmailOutboxMutation()

  const [form, setForm] = useState(() => normalizeConfig())
  const [testEmail, setTestEmail] = useState('contacto@casascarlatta.mx')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const outboxPageSize = 10
  const outboxQuery = useEmailOutboxQuery({ page, pageSize: outboxPageSize, status, enabled })

  useEffect(() => {
    if (!configQuery.data) return
    setForm((current) => ({
      ...normalizeConfig(configQuery.data),
      smtpPassword: current.smtpPassword,
      imapPassword: current.imapPassword,
      pop3Password: current.pop3Password,
    }))
    setTestEmail(configQuery.data.fromAddress || 'contacto@casascarlatta.mx')
  }, [configQuery.data])

  const outboxData = outboxQuery.data
  const items = outboxData?.items ?? []
  const total = outboxData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / outboxPageSize))
  const securityMode = getSecurityMode(form)

  const validationError = useMemo(() => {
    if (!form.fromAddress || !isValidEmail(form.fromAddress)) return 'Correo remitente inválido.'
    if (!isPositivePort(form.smtpPort)) return 'Puerto SMTP inválido.'
    if (form.smtpUseSsl && form.smtpUseTls) return 'SSL y TLS no pueden estar activos al mismo tiempo.'
    return ''
  }, [form.fromAddress, form.smtpPort, form.smtpUseSsl, form.smtpUseTls])

  const saveConfig = async () => {
    const payload = buildSavePayload(form)
    if (validationError) {
      toast.error(validationError)
      return
    }
    try {
      await updateMutation.mutateAsync(payload)
      toast.success('Configuración de correo guardada')
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo guardar configuración de correo')
    }
  }

  const sendTest = async () => {
    if (!isValidEmail(testEmail)) {
      toast.error('Destino de prueba inválido')
      return
    }
    try {
      const response = await testMutation.mutateAsync({ toEmail: testEmail.trim() })
      const statusValue = String(response?.status ?? response?.result ?? response?.state ?? '').toLowerCase()
      if (statusValue === 'skipped') {
        toast('El envío real está desactivado. El correo se registró en el outbox como skipped.')
      } else if (statusValue === 'failed') {
        toast.error(getFriendlyTestEmailFailure(response?.error_message ?? response?.message ?? ''))
      } else if (statusValue === 'pending') {
        toast('Correo de prueba en cola')
      } else {
        toast.success('Correo enviado correctamente.')
      }
    } catch (error) {
      const statusValue = String(error?.response?.data?.status ?? error?.code ?? '').toLowerCase()
      if (statusValue === 'skipped') {
        toast('El envío real está desactivado. El correo se registró en el outbox como skipped.')
        return
      }
      const backendMessage = error?.response?.data?.error_message ?? error?.response?.data?.message ?? error?.message ?? ''
      toast.error(getFriendlyTestEmailFailure(backendMessage))
    }
  }

  const retryOutbox = async (id) => {
    try {
      await retryMutation.mutateAsync(id)
      toast.success('Reintento enviado')
    } catch (error) {
      toast.error(error?.message ?? 'No se pudo reintentar correo')
    }
  }

  if (!enabled) {
    return (
      <div className={styles.card}>
        <div className={styles.cardTitle} style={{ marginBottom: 8 }}>Correo</div>
        <div style={{ color: 'var(--text-muted)' }}>
          Configuración de correo disponible solo en modo API.
        </div>
      </div>
    )
  }

  const smtpPasswordLabel = form.smtpPassword ? 'Contraseña actual reemplazada' : 'Contraseña configurada'

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Configuración de correo</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Solo SMTP en esta pantalla. IMAP y POP3 quedan fuera del flujo MVP.
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {configQuery.isFetching ? 'Sincronizando...' : 'API real'}
          </span>
        </div>

        {configQuery.error && (
          <div style={{ color: '#f87171', marginBottom: 12 }}>
            {configQuery.error.message}
          </div>
        )}

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Activar envío de correos</label>
            <input
              type="checkbox"
              checked={form.emailEnabled}
              onChange={(event) => setForm((current) => ({ ...current, emailEnabled: event.target.checked }))}
            />
          </div>

          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label className={styles.formLabel}>Proveedor de Email</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['smtp', 'gmail', 'outlook', 'server'].map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => setForm((current) => applyPresetToForm(current, key))}
                >
                  {PRESETS[key].label}
                </button>
              ))}
            </div>
            <small style={{ color: 'var(--text-muted)' }}>
              SMTP {securityMode === 'ssl' ? '(SSL directo, puerto 465)' : securityMode === 'starttls' ? '(STARTTLS, puerto 587)' : '(sin seguridad)'}
            </small>
            {form.smtpHost === PRESETS.gmail.smtpHost && (
              <small style={{ color: 'var(--text-muted)' }}>
                Para Gmail normalmente se requiere contraseña de aplicación.
              </small>
            )}
          </div>

          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label className={styles.formLabel}>Configuración SMTP</label>
            <small style={{ color: 'var(--text-muted)' }}>
              Servidor, puerto, usuario, seguridad y contraseña.
            </small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Servidor</label>
            <input
              className={styles.formInput}
              value={form.smtpHost}
              onChange={(event) => setForm((current) => ({ ...current, smtpHost: event.target.value }))}
              placeholder="smtp.gmail.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Puerto</label>
            <input
              className={styles.formInput}
              type="number"
              min="1"
              value={form.smtpPort}
              onChange={(event) => setForm((current) => ({ ...current, smtpPort: event.target.value }))}
            />
          </div>

          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label className={styles.formLabel}>Usar SSL/TLS</label>
            <select
              className={styles.formSelect}
              value={securityMode}
              onChange={(event) => setForm((current) => applySecurityMode(current, event.target.value))}
            >
              <option value="ssl">SSL/TLS directo, recomendado para puerto 465</option>
              <option value="starttls">STARTTLS, recomendado para puerto 587</option>
              <option value="none">Ninguna</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Usuario</label>
            <input
              className={styles.formInput}
              value={form.smtpUsername}
              onChange={(event) => setForm((current) => ({ ...current, smtpUsername: event.target.value }))}
              placeholder="contacto@casascarlatta.mx"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contraseña</label>
            <input
              className={styles.formInput}
              type="password"
              value={form.smtpPassword}
              onChange={(event) => setForm((current) => ({ ...current, smtpPassword: event.target.value }))}
              placeholder="••••••••••••••"
            />
            {configQuery.data?.smtpPasswordSet && <small style={{ color: 'var(--text-muted)' }}>{smtpPasswordLabel}</small>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Correo remitente</label>
            <input
              className={styles.formInput}
              value={form.fromAddress}
              onChange={(event) => setForm((current) => ({ ...current, fromAddress: event.target.value }))}
              placeholder="contacto@casascarlatta.mx"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nombre remitente</label>
            <input
              className={styles.formInput}
              value={form.fromName}
              onChange={(event) => setForm((current) => ({ ...current, fromName: event.target.value }))}
              placeholder="Casa Scarlatta"
            />
          </div>
        </div>

        {validationError && <div style={{ color: '#f87171', marginTop: 12 }}>{validationError}</div>}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={saveConfig}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar configuración'}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => {
              setForm(normalizeConfig(configQuery.data ?? {}))
              toast('Formulario restaurado')
            }}
          >
            Restaurar
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Correo de prueba</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Usa `POST /api/v1/email/test`.
            </div>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={sendTest}
            disabled={testMutation.isPending}
          >
            {testMutation.isPending ? 'Enviando...' : 'Enviar correo de prueba'}
          </button>
        </div>

        <div className={styles.formGrid}>
          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label className={styles.formLabel}>Correo de prueba</label>
            <input
              className={styles.formInput}
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              placeholder="cabreu145@gmail.com"
            />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Historial de correos</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Correo real, skipped o fallido.
            </div>
          </div>
          <select
            className={styles.formSelect}
            value={status}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value)
            }}
            style={{ maxWidth: 200 }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {outboxQuery.isLoading && <div style={{ color: 'var(--muted)', marginBottom: 12 }}>Cargando outbox...</div>}
        {outboxQuery.error && <div style={{ color: '#f87171', marginBottom: 12 }}>{outboxQuery.error.message}</div>}

        <div className={styles.tableWrap}>
          {items.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)' }}>
              No hay correos para mostrar.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Destino</th>
                  <th>Asunto</th>
                  <th>Plantilla</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Error</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id ?? `${item.toEmail}-${item.createdAt}`}>
                    <td>{item.toName ? `${item.toName} · ${item.toEmail}` : item.toEmail}</td>
                    <td>{item.subject || '—'}</td>
                    <td>{item.templateKey || '—'}</td>
                    <td>{getStatusLabel(item.status)}</td>
                    <td>{item.attempts}</td>
                    <td>{item.errorMessage || '—'}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        disabled={item.status !== 'failed' || retryMutation.isPending}
                        onClick={() => retryOutbox(item.id)}
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            label="Outbox"
            compact
            onPrev={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          />
        )}
      </div>
    </div>
  )
}
