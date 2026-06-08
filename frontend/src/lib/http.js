function getToken() {
  return localStorage.getItem('token') ?? null
}

function shouldUseSameOriginProxy() {
  if (typeof window === 'undefined') return false
  if (!import.meta.env.DEV) return false
  const hostname = window.location.hostname
  return hostname === '127.0.0.1' || hostname === 'localhost' || /ngrok-free\.app$/i.test(hostname)
}

function normalizeUrl(endpoint) {
  if (typeof endpoint !== 'string' || !endpoint) {
    throw new Error('HTTP_REQUEST_PATH_REQUIRED')
  }
  if (shouldUseSameOriginProxy()) {
    if (/^https?:\/\//i.test(endpoint)) {
      const parsed = new URL(endpoint)
      return `${parsed.pathname}${parsed.search}`
    }
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  }
  if (/^https?:\/\//i.test(endpoint)) return endpoint
  const baseUrl = String(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').trim()
  const prefix = String(import.meta.env.VITE_API_PREFIX ?? '/api/v1').trim()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${prefix}${cleanEndpoint}`
}

async function parseResponse(res) {
  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await res.json() : null

  if (!res.ok) {
    const backendError = payload?.error ?? payload?.detail
    const message = backendError?.message ?? payload?.message ?? `Error HTTP ${res.status}`
    const error = new Error(message)
    error.status = res.status
    error.code = backendError?.code ?? backendError?.error ?? null
    error.details = backendError?.details ?? payload?.detail ?? null
    error.payload = payload
    throw error
  }

  return payload
}

async function request(method, endpoint, body, options = {}) {
  const token = getToken()
  const headers = {}
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const url = normalizeUrl(endpoint)

  if (import.meta.env.DEV) {
    console.debug('[http]', method, url, {
      hasToken: !!token,
      tokenLength: token?.length ?? 0,
      proxyMode: shouldUseSameOriginProxy(),
    })
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : (isFormData ? body : JSON.stringify(body)),
    signal: options.signal,
  })
  return parseResponse(res)
}

export function httpGet(endpoint, options) {
  return request('GET', endpoint, undefined, options)
}

export function httpPost(endpoint, body, options) {
  return request('POST', endpoint, body, options)
}

export function httpPut(endpoint, body, options) {
  return request('PUT', endpoint, body, options)
}

export function httpPatch(endpoint, body, options) {
  return request('PATCH', endpoint, body, options)
}

export function httpDelete(endpoint, options) {
  return request('DELETE', endpoint, undefined, options)
}
