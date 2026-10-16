// Explicit DEV adapter only. These records exercise UI states; they do not prove
// database transactions, privacy checks, server scheduling or real publication.
import { ApiError } from './index'
import {
  businessDate,
  sourceOptions,
  mutableCapture,
  captureProblem,
} from '../utils/studio'
const key = 'devblog_mock_studio_v1'
const clone = (value) => JSON.parse(JSON.stringify(value))
const envelope = (data, code = 200) => ({
  code,
  message: 'DEVELOPMENT STUDIO MOCK',
  data: clone(data),
  timestamp: Date.now(),
})
const today = () => businessDate('Asia/Shanghai')
function initial() {
  const base = {
    summary: '开发夹具：仅用于工作台交互检查。',
    topic: '工程实践',
    sourceUrl: null,
    verificationClaim: 'UNVERIFIED',
    evidenceRefs: [],
    version: 1,
    _receivedOn: today(),
  }
  return {
    captures: [
      {
        ...base,
        id: '101',
        externalId: 'mock-studio-ready',
        source: 'MANUAL',
        title: '开发片段：阅读流程检查',
        body: '## 开发片段\n\n只用于验证收件箱、编辑和整理交互。',
        status: 'READY',
        validationErrors: [],
      },
      {
        ...base,
        id: '102',
        externalId: 'mock-studio-held',
        source: 'CODEX',
        title: '开发片段：需要补充的线索',
        body: '## 待补充\n\n这是一条暂缓开发夹具。',
        status: 'HELD',
        validationErrors: ['开发夹具：需要补充说明'],
      },
      {
        ...base,
        id: '103',
        externalId: 'mock-studio-included',
        source: 'GEMINI',
        title: '开发片段：已经消费的记录',
        body: '## 历史片段\n\n只读开发样本。',
        status: 'INCLUDED',
        validationErrors: [],
      },
    ],
    runs: [
      {
        id: '501',
        businessDate: businessDateAtYesterday(),
        status: 'FAILED',
        attempt: 1,
        scheduledFor: null,
        cutoffAt: null,
        startedAt: null,
        finishedAt: new Date().toISOString(),
        counts: { candidate: 1, publishedCapture: 0, held: 1, output: 0 },
        outputs: [],
        items: [
          {
            captureId: '101',
            revisionId: '1',
            status: 'HELD',
            reasonCode: 'VALIDATION_FAILED',
          },
        ],
        errorCode: 'VALIDATION_FAILED',
        canRetry: true,
        _candidateIds: ['101'],
      },
    ],
    settings: {
      enabled: false,
      localTime: '22:30',
      timezone: 'Asia/Shanghai',
      failurePolicy: 'SKIP_ITEM',
      maxPostsPerDay: 1,
      nextDueAt: null,
      version: 1,
    },
    idempotency: {},
  }
}
function businessDateAtYesterday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(Date.now() - 86400000))
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type).value)
    .join('-')
}
function read() {
  try {
    return JSON.parse(localStorage.getItem(key)) || initial()
  } catch {
    return initial()
  }
}
function store(state) {
  localStorage.setItem(key, JSON.stringify(state))
}
function page(rows, params) {
  const current = Math.max(1, Number(params.page) || 1),
    size = Math.min(50, Number(params.size) || 10)
  return {
    data: rows.slice((current - 1) * size, current * size),
    total: rows.length,
    page: current,
    size,
    pages: Math.ceil(rows.length / size),
  }
}
function withoutInternal(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([name]) => !name.startsWith('_')),
  )
}
function capture(state, id) {
  const value = state.captures.find((item) => item.id === id && !item._deleted)
  if (!value) throw new ApiError(404, '找不到私有片段', 'CONTENT_NOT_FOUND')
  return value
}
function run(state, id) {
  const value = state.runs.find((item) => item.id === id)
  if (!value) throw new ApiError(404, '找不到运行记录', 'CONTENT_NOT_FOUND')
  return value
}
function lock(value, version) {
  if (value.version !== Number(version))
    throw new ApiError(
      409,
      '对象版本已变化，请重新读取',
      'VERSION_CONFLICT',
      undefined,
      { currentVersion: value.version },
    )
}
function editable(value) {
  if (value._activeRunId)
    throw new ApiError(409, '片段已被运行批次占用', 'CAPTURE_IN_USE')
  if (value.status === 'INCLUDED')
    throw new ApiError(409, '已消费片段不能编辑、恢复或删除', 'CAPTURE_IN_USE')
}
function validate(body) {
  const problem = captureProblem(body)
  if (problem) throw new ApiError(400, problem, 'INVALID_ARGUMENT')
  if (
    !['UNVERIFIED', 'CONCEPT_ONLY', 'TESTED'].includes(
      body.verificationClaim,
    ) ||
    !Array.isArray(body.evidenceRefs)
  )
    throw new ApiError(400, '验证声明字段无效', 'INVALID_ARGUMENT')
}
function classify(state, value) {
  const errors = []
  if (/<\/?(?:script|iframe)\b/i.test(value.body))
    errors.push('开发校验夹具：正文含待核对的原始 HTML')
  if (
    state.captures.some(
      (item) =>
        !item._deleted &&
        item.id !== value.id &&
        item.body.trim() === value.body.trim(),
    )
  )
    errors.push('开发校验夹具：疑似重复正文')
  value.validationErrors = errors
  value.status = errors.length ? 'HELD' : 'READY'
}
function complete(state, value, publish) {
  if (!['PENDING', 'RUNNING'].includes(value.status)) return
  const elapsed = Date.now() - value._mockStartedAt
  if (elapsed < 1500) return
  value.status = 'RUNNING'
  if (elapsed < 3400) return
  const candidates = (value._candidateIds || [])
    .map((id) => state.captures.find((item) => item.id === id))
    .filter(Boolean)
  const valid = candidates.filter(
      (item) => item.status === 'READY' && !item._deleted,
    ),
    held = candidates.filter((item) => !valid.includes(item))
  if (
    !state.settings.enabled ||
    (state.settings.failurePolicy === 'HOLD_BATCH' && held.length) ||
    (candidates.length && !valid.length)
  ) {
    value.status = 'FAILED'
    value.errorCode = state.settings.enabled
      ? 'VALIDATION_FAILED'
      : 'AUTOPUBLISH_DISABLED'
    value.canRetry = true
  } else if (!candidates.length) {
    value.status = 'SKIPPED'
    value.canRetry = false
  } else {
    const output = publish(valid, value.businessDate)
    valid.forEach((item) => {
      item.status = 'INCLUDED'
      item.version++
    })
    value.outputs = [
      {
        postId: output.id,
        kind: 'NOTE',
        url: '/blog-front/notes?note=' + output.id,
      },
    ]
    value.status = held.length ? 'PARTIAL' : 'SUCCEEDED'
    value.canRetry = false
  }
  value.counts = {
    candidate: candidates.length,
    publishedCapture: value.outputs.length ? valid.length : 0,
    held: held.length,
    output: value.outputs.length,
  }
  value.items = candidates.map((item) => ({
    captureId: item.id,
    revisionId: String(item.version),
    status: value.outputs.length && valid.includes(item) ? 'PUBLISHED' : 'HELD',
    reasonCode:
      value.outputs.length && valid.includes(item) ? null : 'VALIDATION_FAILED',
  }))
  value.finishedAt = new Date().toISOString()
  candidates.forEach((item) => delete item._activeRunId)
}
function start(state, value) {
  value.status = 'PENDING'
  value.startedAt = new Date().toISOString()
  value.finishedAt = null
  value.errorCode = null
  value.canRetry = false
  value.outputs = []
  value._mockStartedAt = Date.now()
  value._candidateIds.forEach((id) => {
    const item = state.captures.find((item) => item.id === id)
    if (item) item._activeRunId = value.id
  })
}
export function studioMockRequest(
  method,
  path,
  { params = {}, body, headers },
  publish,
) {
  const state = read()
  for (const value of state.runs) complete(state, value, publish)
  store(state)
  const operation =
    ['POST /captures', 'POST /admin/runs'].includes(method + ' ' + path) ||
    /\/retry$/.test(path)
  let replayKey
  if (operation) {
    if (!headers['Idempotency-Key'])
      throw new ApiError(400, '缺少 Idempotency-Key', 'INVALID_ARGUMENT')
    replayKey = method + ' ' + path + ' ' + headers['Idempotency-Key']
    const cached = state.idempotency[replayKey]
    if (cached) {
      if (cached.fingerprint !== JSON.stringify(body))
        throw new ApiError(409, '相同幂等键的正文不同', 'IDEMPOTENCY_CONFLICT')
      return clone(cached.response)
    }
  }
  function respond(data, code = 200) {
    const result = envelope(data, code)
    if (replayKey)
      state.idempotency[replayKey] = {
        fingerprint: JSON.stringify(body),
        response: result,
      }
    store(state)
    return result
  }
  const inDates = (item) =>
    (!params.from || item._receivedOn >= params.from) &&
    (!params.to || item._receivedOn <= params.to)
  if (path === '/admin/captures/stats') {
    const rows = state.captures.filter(
      (item) => !item._deleted && inDates(item),
    )
    return respond({
      total: rows.length,
      received: rows.filter((item) => item.status === 'RECEIVED').length,
      ready: rows.filter((item) => item.status === 'READY').length,
      held: rows.filter((item) => item.status === 'HELD').length,
      included: rows.filter((item) => item.status === 'INCLUDED').length,
    })
  }
  if (path === '/admin/captures' && method === 'GET') {
    const rows = state.captures
      .filter(
        (item) =>
          !item._deleted &&
          inDates(item) &&
          (!params.source || item.source === params.source) &&
          (!params.status || item.status === params.status),
      )
      .reverse()
    return respond(
      page(
        rows.map(({ id, title, summary, source, status, version }) => ({
          id,
          title,
          summary,
          source,
          status,
          version,
        })),
        params,
      ),
    )
  }
  if (path === '/captures' && method === 'POST') {
    validate(body)
    if (
      !body.externalId ||
      body.externalId.length > 128 ||
      !sourceOptions.includes(body.source)
    )
      throw new ApiError(400, '来源或 externalId 不合法', 'INVALID_ARGUMENT')
    const original = state.captures.find(
      (item) =>
        item.source === body.source &&
        item.externalId === body.externalId &&
        !item._deleted,
    )
    if (original) {
      if (original._initialFingerprint !== JSON.stringify(body))
        throw new ApiError(
          409,
          '相同 externalId 的正文不同',
          'IDEMPOTENCY_CONFLICT',
        )
      return respond({
        id: original.id,
        status: original.status,
        version: original.version,
        duplicate: true,
        validationErrors: original.validationErrors,
      })
    }
    const value = {
      ...clone(body),
      id: String(
        Math.max(100, ...state.captures.map((item) => Number(item.id))) + 1,
      ),
      status: 'RECEIVED',
      version: 1,
      validationErrors: [],
      _receivedOn: today(),
      _initialFingerprint: JSON.stringify(body),
    }
    classify(state, value)
    state.captures.push(value)
    return respond({
      id: value.id,
      status: value.status,
      version: value.version,
      duplicate: false,
      validationErrors: value.validationErrors,
    })
  }
  const captureMatch = path.match(
    /^\/admin\/captures\/(\d+)(?:\/(hold|release))?$/,
  )
  if (captureMatch) {
    const value = capture(state, captureMatch[1]),
      action = captureMatch[2]
    if (method === 'GET') return respond(withoutInternal(value))
    lock(
      value,
      method === 'DELETE' ? params.expectedVersion : body.expectedVersion,
    )
    editable(value)
    if (method === 'DELETE') {
      value._deleted = true
      return respond(null)
    }
    if (action === 'hold') {
      if (value.status !== 'READY' || !body.reason?.trim())
        throw new ApiError(400, '暂缓需要 READY 状态与原因', 'INVALID_ARGUMENT')
      value.status = 'HELD'
      value.validationErrors = [body.reason]
    } else if (action === 'release') {
      if (value.status !== 'HELD')
        throw new ApiError(409, '仅暂缓片段可重新校验', 'VERSION_CONFLICT')
      classify(state, value)
    } else if (method === 'PUT') {
      validate(body)
      if ('externalId' in body || 'source' in body)
        throw new ApiError(400, '更新只能包含可编辑字段', 'INVALID_ARGUMENT')
      Object.assign(value, mutableCapture(body))
      classify(state, value)
    } else throw new ApiError(404, '未实现的开发接口', 'CONTENT_NOT_FOUND')
    value.version++
    return respond({
      id: value.id,
      status: value.status,
      version: value.version,
      validationErrors: value.validationErrors,
    })
  }
  if (path === '/admin/publishing-settings') {
    if (method === 'GET') return respond(state.settings)
    lock(state.settings, body.expectedVersion)
    if (
      typeof body.enabled !== 'boolean' ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.localTime) ||
      !['SKIP_ITEM', 'HOLD_BATCH'].includes(body.failurePolicy) ||
      !Number.isInteger(body.maxPostsPerDay) ||
      body.maxPostsPerDay < 1 ||
      body.maxPostsPerDay > 3
    )
      throw new ApiError(400, '发布设置字段不合法', 'INVALID_ARGUMENT')
    try {
      new Intl.DateTimeFormat('zh-CN', { timeZone: body.timezone }).format()
    } catch {
      throw new ApiError(400, '时区不可用', 'INVALID_ARGUMENT')
    }
    state.settings = {
      enabled: body.enabled,
      localTime: body.localTime,
      timezone: body.timezone,
      failurePolicy: body.failurePolicy,
      maxPostsPerDay: body.maxPostsPerDay,
      nextDueAt: body.enabled
        ? new Date(Date.now() + 86400000).toISOString()
        : null,
      version: state.settings.version + 1,
    }
    return respond(state.settings)
  }
  if (path === '/admin/runs') {
    if (method === 'GET') {
      const rows = state.runs
        .filter(
          (item) =>
            (!params.status || item.status === params.status) &&
            (!params.from || item.businessDate >= params.from) &&
            (!params.to || item.businessDate <= params.to),
        )
        .slice()
        .reverse()
      return respond(
        page(
          rows.map(({ id, businessDate, status, attempt, counts }) => ({
            id,
            businessDate,
            status,
            attempt,
            counts,
          })),
          params,
        ),
      )
    }
    if (!state.settings.enabled)
      throw new ApiError(409, '自动整理开关已停用', 'AUTOPUBLISH_DISABLED')
    if (body.businessDate !== businessDate(state.settings.timezone))
      throw new ApiError(400, '只能触发站点当日批次', 'INVALID_ARGUMENT')
    const existing = state.runs.find(
      (item) => item.businessDate === body.businessDate,
    )
    if (existing) return respond(withoutInternal(existing))
    const value = {
      id: String(
        Math.max(500, ...state.runs.map((item) => Number(item.id))) + 1,
      ),
      businessDate: body.businessDate,
      status: 'PENDING',
      attempt: 1,
      scheduledFor: new Date().toISOString(),
      cutoffAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      counts: { candidate: 0, publishedCapture: 0, held: 0, output: 0 },
      outputs: [],
      items: [],
      errorCode: null,
      canRetry: false,
      _candidateIds: state.captures
        .filter(
          (item) => !item._deleted && ['READY', 'HELD'].includes(item.status),
        )
        .map((item) => item.id),
    }
    value.counts.candidate = value._candidateIds.length
    state.runs.push(value)
    start(state, value)
    return respond(withoutInternal(value), 202)
  }
  const runMatch = path.match(/^\/admin\/runs\/(\d+)(?:\/(retry))?$/)
  if (runMatch) {
    const value = run(state, runMatch[1])
    if (method === 'GET') return respond(withoutInternal(value))
    if (!state.settings.enabled)
      throw new ApiError(409, '自动整理开关已停用', 'AUTOPUBLISH_DISABLED')
    if (
      value.status !== 'FAILED' ||
      !value.canRetry ||
      value.attempt !== body.expectedAttempt
    )
      throw new ApiError(409, '当前状态或 attempt 已变化', 'VERSION_CONFLICT')
    value.attempt++
    start(state, value)
    return respond(withoutInternal(value), 202)
  }
  throw new ApiError(404, '开发 mock 未实现该工作台接口', 'CONTENT_NOT_FOUND')
}
