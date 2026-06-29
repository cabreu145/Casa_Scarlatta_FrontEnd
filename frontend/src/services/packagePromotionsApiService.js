import { ENDPOINTS } from '@/constants/api'
import { httpDelete, httpGet, httpPatch, httpPost, httpPut } from '@/lib/http'
import { normalizePaginatedResponse } from '@/adapters/paginationAdapter'

function mapPromotion(raw = {}) {
  return {
    id: raw.id ?? null,
    name: raw.name ?? '',
    description: raw.description ?? '',
    promotionType: raw.promotion_type ?? raw.promotionType ?? '',
    packageId: raw.package_id ?? raw.packageId ?? null,
    bonusPackageId: raw.bonus_package_id ?? raw.bonusPackageId ?? null,
    discountPercent: raw.discount_percent ?? raw.discountPercent ?? null,
    minimumFinalPriceMxn: raw.minimum_final_price_mxn ?? raw.minimumFinalPriceMxn ?? null,
    usageLimit: raw.usage_limit ?? raw.usageLimit ?? null,
    usedCount: raw.used_count ?? raw.usedCount ?? 0,
    reservedCount: raw.reserved_count ?? raw.reservedCount ?? 0,
    remainingCount: raw.remaining_count ?? raw.remainingCount ?? null,
    startsAt: raw.starts_at ?? raw.startsAt ?? null,
    endsAt: raw.ends_at ?? raw.endsAt ?? null,
    isActive: raw.is_active ?? raw.isActive ?? false,
    appliesOnline: raw.applies_online ?? raw.appliesOnline ?? false,
    appliesAdmin: raw.applies_admin ?? raw.appliesAdmin ?? false,
    appliesPos: raw.applies_pos ?? raw.appliesPos ?? false,
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
    raw,
  }
}

function mapRedemption(raw = {}) {
  return {
    id: raw.id ?? null,
    promotionId: raw.promotion_id ?? raw.promotionId ?? null,
    buyerUserId: raw.buyer_user_id ?? raw.buyerUserId ?? null,
    beneficiaryUserId: raw.beneficiary_user_id ?? raw.beneficiaryUserId ?? null,
    channel: raw.channel ?? '',
    status: raw.status ?? '',
    promotionTypeSnapshot: raw.promotion_type_snapshot ?? raw.promotionTypeSnapshot ?? '',
    originalPriceMxn: raw.original_price_mxn ?? raw.originalPriceMxn ?? null,
    discountPercent: raw.discount_percent_snapshot ?? raw.discountPercent ?? null,
    discountMxn: raw.discount_mxn ?? raw.discountMxn ?? null,
    finalPriceMxn: raw.final_price_mxn ?? raw.finalPriceMxn ?? null,
    promotionNameSnapshot: raw.promotion_name_snapshot ?? raw.promotionNameSnapshot ?? '',
    appliedAt: raw.applied_at ?? raw.appliedAt ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    raw,
  }
}

export async function getPackagePromotionsApi({ page = 1, pageSize = 20, search, packageId, status } = {}) {
  const payload = await httpGet(
    ENDPOINTS.packagePromotionsPaginated({ page, pageSize, search, packageId, status })
  )
  return normalizePaginatedResponse(payload, mapPromotion)
}

export async function getPackagePromotionByIdApi(id) {
  const payload = await httpGet(ENDPOINTS.packagePromotionById(id))
  return mapPromotion(payload ?? {})
}

export async function createPackagePromotionApi(form = {}) {
  const payload = await httpPost(ENDPOINTS.packagePromotions, buildPromotionPayload(form))
  return mapPromotion(payload ?? {})
}

export async function updatePackagePromotionApi(id, form = {}) {
  const payload = await httpPut(ENDPOINTS.packagePromotionById(id), buildPromotionPayload(form))
  return mapPromotion(payload ?? {})
}

export async function updatePackagePromotionStatusApi(id, isActive) {
  const payload = await httpPatch(ENDPOINTS.packagePromotionStatusById(id), { is_active: Boolean(isActive) })
  return mapPromotion(payload ?? {})
}

export async function deletePackagePromotionApi(id) {
  return (await httpDelete(ENDPOINTS.packagePromotionById(id))) ?? { success: true, id }
}

export async function getPackagePromotionRedemptionsApi(id, { page = 1, pageSize = 20 } = {}) {
  const payload = await httpGet(`${ENDPOINTS.packagePromotionRedemptions(id)}?page=${page}&page_size=${pageSize}`)
  return normalizePaginatedResponse(payload, mapRedemption)
}

export async function releaseExpiredPromotionRedemptionsApi() {
  return httpPost(ENDPOINTS.packagePromotionsReleaseExpired, {})
}

function buildPromotionPayload(form = {}) {
  const type = String(form.promotion_type ?? form.promotionType ?? '').trim()
  const body = {
    name: String(form.name ?? '').trim(),
    description: String(form.description ?? '').trim() || null,
    promotion_type: type,
    package_id: Number(form.package_id ?? form.packageId),
    usage_limit: form.usage_limit != null ? Number(form.usage_limit ?? form.usageLimit) : null,
    starts_at: form.starts_at ?? form.startsAt ?? null,
    ends_at: form.ends_at ?? form.endsAt ?? null,
    is_active: Boolean(form.is_active ?? form.isActive ?? true),
    applies_online: Boolean(form.applies_online ?? form.appliesOnline ?? false),
    applies_admin: Boolean(form.applies_admin ?? form.appliesAdmin ?? false),
    applies_pos: Boolean(form.applies_pos ?? form.appliesPos ?? false),
  }

  if (type === 'percentage_discount') {
    body.discount_percent = Number(form.discount_percent ?? form.discountPercent)
    const minPrice = form.minimum_final_price_mxn ?? form.minimumFinalPriceMxn
    if (minPrice != null) body.minimum_final_price_mxn = Number(minPrice)
  }

  if (type === 'buy_one_get_one') {
    const bonusId = form.bonus_package_id ?? form.bonusPackageId
    if (bonusId != null) body.bonus_package_id = Number(bonusId)
  }

  return body
}
