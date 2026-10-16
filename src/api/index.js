import axios from 'axios'

export const mockEnabled =
  import.meta.env.DEV && import.meta.env.VITE_DEV_MOCK === 'true'
export function v1Base(value = '/api/v1') {
  const base = value.trim().replace(/\/+$/, '')
  if (/\/api\/v1$/.test(base)) return base
  if (/\/api$/.test(base)) return `${base}/v1`
  return `${base}/api/v1`
}
export const apiBase = v1Base(import.meta.env.VITE_API_BASE_URL)
export function contentAssetUrl(url) {
  return /^\/api\/v1\/assets\/[1-9][0-9]*$/.test(url || '')
    ? `${apiBase}/assets/${url.split('/').at(-1)}`
    : url
}
const tokenKey = mockEnabled ? 'devblog_mock_session' : 'devblog_admin_v1'
export const auth = {
  getToken: () => sessionStorage.getItem(tokenKey),
  setToken: (token) => sessionStorage.setItem(tokenKey, token),
  removeToken: () => sessionStorage.removeItem(tokenKey),
}
export class ApiError extends Error {
  constructor(status, message, errorCode, requestId, details) {
    super(message)
    this.status = status
    this.errorCode = errorCode
    this.requestId = requestId
    this.details = details
  }
}
const client = axios.create({ baseURL: apiBase, timeout: 15000 })
const pendingKeys = new Map()
// Keep the same key after a timeout so an explicit retry cannot duplicate a write.
export function idempotencyKey(method, path, body) {
  const fingerprint = JSON.stringify([method, path, body])
  if (!pendingKeys.has(fingerprint))
    pendingKeys.set(fingerprint, crypto.randomUUID())
  return { fingerprint, key: pendingKeys.get(fingerprint) }
}
export async function request(
  method,
  path,
  {
    params,
    body,
    signal,
    private: restricted = false,
    idempotent = false,
  } = {},
) {
  const operation = idempotent ? idempotencyKey(method, path, body) : null
  const headers = {}
  if (restricted && auth.getToken())
    headers.Authorization = `Bearer ${auth.getToken()}`
  if (operation) headers['Idempotency-Key'] = operation.key
  try {
    let envelope
    if (mockEnabled) {
      const { mockRequest } = await import('./mock.js')
      envelope = await mockRequest(method, path, {
        params,
        body,
        signal,
        headers,
      })
    } else {
      const response = await client.request({
        method,
        url: path,
        params,
        data: body,
        signal,
        headers,
      })
      envelope = response.data
    }
    if (![200, 202].includes(envelope?.code))
      throw new ApiError(
        envelope?.code || 502,
        '接口响应不符合 v1 契约',
        envelope?.errorCode,
      )
    if (operation) pendingKeys.delete(operation.fingerprint)
    return envelope.data
  } catch (error) {
    if (axios.isCancel(error) || signal?.aborted || error.name === 'AbortError')
      throw error
    const status = error.status || error.response?.status || 0
    const data = error.response?.data
    if (restricted && status === 401) {
      auth.removeToken()
      window.dispatchEvent(new Event('devblog:unauthorized'))
    }
    if (error instanceof ApiError) throw error
    // Do not log Axios objects: they can contain passwords and bearer tokens.
    const message =
      status === 0
        ? '无法连接 API，请检查服务与网络后重试'
        : data?.message || `请求失败（${status}）`
    const failure = new ApiError(
      status,
      message,
      data?.errorCode,
      data?.requestId,
      data?.data,
    )
    const retryAfter = error.response?.headers?.['retry-after']
    if (retryAfter) {
      const seconds = Number(retryAfter)
      const until = Number.isFinite(seconds)
        ? Date.now() + seconds * 1000
        : Date.parse(retryAfter)
      if (Number.isFinite(until)) failure.retryAt = until
    }
    throw failure
  }
}
const get = (path, params, signal) => request('GET', path, { params, signal })
const admin = (method, path, body, idempotent = false) =>
  request(method, path, { body, private: true, idempotent })
export const publicApi = {
  home: (signal) => get('/public/home', undefined, signal),
  posts: (params, signal) => get('/posts', params, signal),
  post: (id, signal) =>
    get(`/posts/${encodeURIComponent(id)}`, undefined, signal),
  notes: (params, signal) => get('/notes', params, signal),
  note: (id, signal) =>
    get(`/notes/${encodeURIComponent(id)}`, undefined, signal),
  search: (params, signal) => get('/search', params, signal),
  categories: (signal) => get('/categories', undefined, signal),
  tags: (signal) => get('/tags', undefined, signal),
  projects: (signal) => get('/projects', undefined, signal),
}
export const adminApi = {
  login: (password) => request('POST', '/auth/login', { body: { password } }),
  me: () => admin('GET', '/auth/me'),
  logout: () => admin('POST', '/auth/logout'),
  posts: (params) => request('GET', '/admin/posts', { params, private: true }),
  post: (id) => admin('GET', `/admin/posts/${id}`),
  create: (body) => admin('POST', '/admin/posts', body, true),
  save: (id, body) => admin('PUT', `/admin/posts/${id}/draft`, body),
  publish: (id, body) =>
    admin('POST', `/admin/posts/${id}/publish`, body, true),
  withdraw: (id, expectedVersion) =>
    admin('POST', `/admin/posts/${id}/withdraw`, { expectedVersion }),
  delete: (id, expectedVersion) =>
    request('DELETE', `/admin/posts/${id}`, {
      params: { expectedVersion },
      private: true,
    }),
  revisions: (id, params) =>
    request('GET', `/admin/posts/${id}/revisions`, { params, private: true }),
  revision: (id, revisionId) =>
    admin('GET', `/admin/posts/${id}/revisions/${revisionId}`),
}
