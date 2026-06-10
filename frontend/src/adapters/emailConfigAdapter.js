function isDefined(value) {
  return value !== undefined && value !== null
}

export function mapBackendEmailConfigToFrontend(item = {}) {
  return {
    emailEnabled: Boolean(item.email_enabled ?? item.emailEnabled ?? false),
    provider: item.provider ?? item.provider_name ?? item.providerName ?? '',
    fromName: item.from_name ?? item.fromName ?? '',
    fromAddress: item.from_address ?? item.fromAddress ?? '',
    smtpHost: item.smtp_host ?? item.smtpHost ?? '',
    smtpPort: item.smtp_port ?? item.smtpPort ?? '',
    smtpUsername: item.smtp_username ?? item.smtpUsername ?? '',
    smtpUseSsl: Boolean(item.smtp_use_ssl ?? item.smtpUseSsl ?? false),
    smtpUseTls: Boolean(item.smtp_use_tls ?? item.smtpUseTls ?? false),
    smtpPasswordSet: Boolean(item.smtp_password_set ?? item.smtpPasswordSet ?? false),
    imapHost: item.imap_host ?? item.imapHost ?? '',
    imapPort: item.imap_port ?? item.imapPort ?? '',
    imapUsername: item.imap_username ?? item.imapUsername ?? '',
    imapUseSsl: Boolean(item.imap_use_ssl ?? item.imapUseSsl ?? false),
    imapPasswordSet: Boolean(item.imap_password_set ?? item.imapPasswordSet ?? false),
    pop3Host: item.pop3_host ?? item.pop3Host ?? '',
    pop3Port: item.pop3_port ?? item.pop3Port ?? '',
    pop3Username: item.pop3_username ?? item.pop3Username ?? '',
    pop3UseSsl: Boolean(item.pop3_use_ssl ?? item.pop3UseSsl ?? false),
    pop3PasswordSet: Boolean(item.pop3_password_set ?? item.pop3PasswordSet ?? false),
    updatedAt: item.updated_at ?? item.updatedAt ?? null,
  }
}

export function mapFrontendEmailConfigPayloadToBackend(payload = {}) {
  const mapped = {
    email_enabled: Boolean(payload.emailEnabled),
    provider: payload.provider ?? '',
    from_name: payload.fromName ?? '',
    from_address: payload.fromAddress ?? '',
    smtp_host: payload.smtpHost ?? '',
    smtp_port: Number(payload.smtpPort ?? 0) || 0,
    smtp_username: payload.smtpUsername ?? '',
    smtp_use_ssl: Boolean(payload.smtpUseSsl),
    smtp_use_tls: Boolean(payload.smtpUseTls),
    imap_host: payload.imapHost ?? '',
    imap_port: Number(payload.imapPort ?? 0) || 0,
    imap_username: payload.imapUsername ?? '',
    imap_use_ssl: Boolean(payload.imapUseSsl),
    pop3_host: payload.pop3Host ?? '',
    pop3_port: Number(payload.pop3Port ?? 0) || 0,
    pop3_username: payload.pop3Username ?? '',
    pop3_use_ssl: Boolean(payload.pop3UseSsl),
  }

  if (isDefined(payload.smtpPassword) && String(payload.smtpPassword).trim()) {
    mapped.smtp_password = String(payload.smtpPassword)
  }
  if (isDefined(payload.imapPassword) && String(payload.imapPassword).trim()) {
    mapped.imap_password = String(payload.imapPassword)
  }
  if (isDefined(payload.pop3Password) && String(payload.pop3Password).trim()) {
    mapped.pop3_password = String(payload.pop3Password)
  }

  return mapped
}
