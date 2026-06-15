import { ENDPOINTS } from '@/constants/api'
import { httpPost } from '@/lib/http'

const DEFAULT_CLOUD_NAME = String(
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? 'dtj8woibw'
).trim()

function appendDefined(formData, key, value) {
  if (value === undefined || value === null || value === '') return
  formData.append(key, String(value))
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function normalizeCloudinaryUploadResponse(payload = {}) {
  const data = payload?.data ?? payload?.result ?? payload

  return {
    type: data?.resource_type ?? data?.type ?? '',
    url: data?.secure_url ?? data?.url ?? '',
    secureUrl: data?.secure_url ?? data?.url ?? '',
    publicId: data?.public_id ?? data?.publicId ?? '',
    resourceType: data?.resource_type ?? data?.resourceType ?? '',
    alt: data?.alt ?? '',
    width: data?.width ?? null,
    height: data?.height ?? null,
    duration: data?.duration ?? null,
    format: data?.format ?? '',
  }
}

export async function requestCloudinarySignatureApi(payload = {}) {
  return httpPost(ENDPOINTS.cloudinarySignature, payload)
}

export async function uploadCloudinaryMediaApi({
  file,
  folder = 'site',
  resourceType = 'image',
  context = 'site_configuration',
  publicIdPrefix = 'site',
  alt = '',
} = {}) {
  if (!file) {
    const error = new Error('CLOUDINARY_FILE_REQUIRED')
    error.code = 'CLOUDINARY_FILE_REQUIRED'
    throw error
  }

  const signatureResponse = await requestCloudinarySignatureApi({
    folder,
    resource_type: resourceType,
    context,
    public_id_prefix: publicIdPrefix,
  })

  const signatureData =
    signatureResponse?.data ??
    signatureResponse?.result ??
    signatureResponse ??
    {}

  const fields =
    signatureData?.fields ??
    signatureData?.params ??
    signatureData ??
    {}

  const cloudName = pickFirst(
    signatureData?.cloudName,
    signatureData?.cloud_name,
    signatureData?.cloud,
    DEFAULT_CLOUD_NAME
  )

  const apiKey = pickFirst(
    fields?.api_key,
    fields?.apiKey,
    signatureData?.api_key,
    signatureData?.apiKey
  )

  const timestamp = pickFirst(
    fields?.timestamp,
    signatureData?.timestamp
  )

  const signature = pickFirst(
    fields?.signature,
    signatureData?.signature
  )

  if (!cloudName || !apiKey || !timestamp || !signature) {
    const error = new Error('Cloudinary signature response incompleta.')
    error.code = 'CLOUDINARY_SIGNATURE_INCOMPLETE'
    error.payload = signatureResponse
    throw error
  }

  const uploadResourceType = pickFirst(
    fields?.resource_type,
    fields?.resourceType,
    signatureData?.resource_type,
    signatureData?.resourceType,
    resourceType
  )

  const uploadUrl = pickFirst(
    signatureData?.uploadUrl,
    signatureData?.upload_url,
    `https://api.cloudinary.com/v1_1/${cloudName}/${uploadResourceType}/upload`
  )

  const formData = new FormData()

  formData.append('file', file)
  formData.append('api_key', String(apiKey))
  formData.append('timestamp', String(timestamp))
  formData.append('signature', String(signature))

  // Solo mandar a Cloudinary parámetros firmados.
  // Ojo: backend puede responder camelCase, pero Cloudinary espera snake_case.
  const signedParamAliases = {
    folder: ['folder'],
    public_id: ['public_id', 'publicId'],
    upload_preset: ['upload_preset', 'uploadPreset'],
    tags: ['tags'],
    overwrite: ['overwrite'],
    use_filename: ['use_filename', 'useFilename'],
    unique_filename: ['unique_filename', 'uniqueFilename'],
    invalidate: ['invalidate'],
    transformation: ['transformation'],
    eager: ['eager'],
    eager_async: ['eager_async', 'eagerAsync'],
    type: ['type'],
  }

  Object.entries(signedParamAliases).forEach(([cloudinaryKey, aliases]) => {
    const value = pickFirst(
      ...aliases.map((alias) => fields?.[alias]),
      ...aliases.map((alias) => signatureData?.[alias])
    )

    appendDefined(formData, cloudinaryKey, value)
  })

  // Debug temporal si vuelve a fallar firma:
  // console.log(
  //   'Cloudinary upload FormData',
  //   Array.from(formData.entries()).map(([key, value]) => [
  //     key,
  //     value instanceof File ? `FILE:${value.name}` : value,
  //   ])
  // )

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok) {
    const cloudinaryError = payload?.error ?? payload?.detail ?? null

    const error = new Error(
      cloudinaryError?.message ??
      payload?.message ??
      'No se pudo subir media a Cloudinary.'
    )

    error.code =
      cloudinaryError?.code ??
      cloudinaryError?.error ??
      'CLOUDINARY_UPLOAD_FAILED'

    error.status = response.status
    error.payload = payload
    throw error
  }

  return {
    ...normalizeCloudinaryUploadResponse(payload),
    alt,
  }
}

export { normalizeCloudinaryUploadResponse }