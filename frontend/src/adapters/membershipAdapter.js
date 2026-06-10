function normalizeText(value, fallback = null) {
  const raw = String(value ?? '').trim()
  return raw || fallback
}

function mapBeneficiary(item = {}) {
  return {
    beneficiaryId: item.beneficiary_id ?? item.beneficiaryId ?? item.id ?? null,
    clientId: item.client_id ?? item.clientId ?? null,
    name: normalizeText(item.name ?? item.full_name ?? item.fullName ?? item.client_name ?? item.clientName, ''),
    email: normalizeText(item.email ?? item.client_email ?? item.clientEmail, ''),
    status: item.status ?? item.estado ?? null,
    raw: item,
  }
}

export function mapBackendMembershipToFrontend(item = {}) {
  const packageName = normalizeText(item.package_name ?? item.packageName ?? item.display_name ?? item.displayName, null)
  const name = normalizeText(item.name, null)
  const displayName = normalizeText(item.display_name ?? item.displayName ?? packageName ?? name, packageName ?? name ?? 'Paquete')
  const beneficiaries = Array.isArray(item.beneficiaries)
    ? item.beneficiaries.map(mapBeneficiary)
    : Array.isArray(item.shared_beneficiaries)
      ? item.shared_beneficiaries.map(mapBeneficiary)
      : []

  return {
    membershipId: item.membership_id ?? item.membershipId ?? item.id ?? null,
    packageId: item.package_id ?? item.packageId ?? null,
    name: name ?? displayName,
    displayName,
    packageName: packageName ?? displayName,
    creditsTotal: Number(item.credits_total ?? item.creditsTotal ?? item.credits ?? 0),
    creditsAvailable: Number(item.credits_available ?? item.creditsAvailable ?? item.allocated_credits ?? 0),
    allocatedCredits: Number(item.allocated_credits ?? item.allocatedCredits ?? item.credits_allocated ?? 0),
    expiresAt: item.expires_at ?? item.expiresAt ?? null,
    status: item.status ?? item.estado ?? null,
    isShareable: Boolean(item.is_shareable ?? item.isShareable ?? false),
    maxBeneficiaries: Number(item.max_beneficiaries ?? item.maxBeneficiaries ?? 0),
    beneficiaries,
    beneficiariesCount: beneficiaries.length,
    ownerName: item.owner_name ?? item.ownerName ?? null,
    ownerEmail: item.owner_email ?? item.ownerEmail ?? null,
    raw: item,
  }
}

export function mapBackendMembershipsToFrontend(items = []) {
  return (Array.isArray(items) ? items : []).map(mapBackendMembershipToFrontend)
}

export function mapBackendClientSharedMembershipsToFrontend(items = []) {
  return mapBackendMembershipsToFrontend(items)
}
