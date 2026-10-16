// Explicit development-only adapter. Vite removes this import from production builds.
// Fixtures are authored for boundary testing and are not copied from the visual prototype.
import { ApiError } from './index'
const storageKey = 'devblog_mock_content_v1'
const category = {
  id: '2',
  name: '工程实践',
  slug: 'engineering',
  publishedCount: 2,
}
const tag = { id: '7', name: 'Vue', slug: 'vue', publishedCount: 2 }
const now = '2026-10-15T10:00:00Z'
const sources = ['CODEX', 'CLAUDE', 'GEMINI', 'MANUAL', 'OTHER']
const initialContent = [
  '# 开发夹具 / 非真实文章',
  '',
  '这篇内容只用于本机浏览器检查。文中的日期、代码、表格与验证标记都是测试输入，不能作为实际技术结论。',
  '',
  '## 从问题出发',
  '',
  '原始 HTML 应显示为文本：<img src=x onerror="window.__unsafe=1"><script>window.__unsafe=1</script>',
  '',
  '[危险链接](javascript:alert(1)) 与 [安全外链](https://example.com/docs)。',
  '',
  '### 先保留问题',
  '',
  '一段超长链接：https://example.com/' + 'long-path-'.repeat(36),
  '',
  '## 最小代码',
  '',
  '```javascript',
  'const message = "<script>this is text</script>";',
  'console.log(message);',
  'const longLine = "' + 'safe-code-'.repeat(40) + '";',
  '```',
  '',
  '```',
  '没有语言的代码应原样复制。',
  'first line',
  'second line',
  '```',
  '',
  '| 列一 | 列二 | 列三 | 列四 | 列五 | 列六 |',
  '| --- | --- | --- | --- | --- | --- |',
  '| 安全渲染 | 日期语义 | 版本指针 | 移动阅读 | 超宽表格 | 独立滚动 |',
  '',
  ...Array.from({ length: 8 }, (_, index) =>
    [
      '## ' + (index === 0 ? '从问题出发' : '持续检查 ' + (index + 1)),
      '',
      ...Array(5).fill(
        '这是长正文阅读夹具。逐条理解输入条件，记录推导路径，关注实际验证的边界。代码区域与表格区域应独立横向滚动，正文保持自然换行。',
      ),
      '',
      '> 保留来源不意味着获得验证；该段落仅用于排版检查。',
      '',
    ].join('\n'),
  ),
].join('\n')
function fixture(id, kind, title, content, verification = 'UNVERIFIED') {
  const draft = {
    title,
    content,
    excerpt: '开发样本：仅用于验证阅读、搜索与草稿隔离，不代表真实站点内容。',
    kind,
    categoryId: '2',
    tagIds: ['7'],
    pinned: id === '42',
    sourceTools: ['MANUAL'],
    journalDate: kind === 'NOTE' ? '2026-10-15' : null,
    topics: kind === 'NOTE' ? ['工程实践'] : [],
    createdAt: now,
  }
  return {
    id,
    kind,
    status: 'PUBLISHED',
    version: 1,
    draftRevisionId: id + '01',
    publishedRevisionId: id + '01',
    publishedAt: now,
    revisions: [
      {
        ...draft,
        revisionId: id + '01',
        verification: {
          status: verification,
          summary:
            verification === 'TESTED'
              ? 'MOCK 验证记录：只用于验证徽章过滤，并非真实实测。'
              : '本条为开发夹具，未提供实际技术证据。',
          verifiedAt: verification === 'TESTED' ? now : null,
        },
      },
    ],
  }
}
function seed() {
  return [
    fixture(
      '42',
      'ARTICLE',
      '开发样本：安全 Markdown 与长正文阅读检查',
      initialContent,
    ),
    fixture(
      '43',
      'ARTICLE',
      '开发样本：发布与草稿隔离',
      '## 公开版本\n\n此内容只用于测试草稿保存不改变公开快照。',
      'CONCEPT_ONLY',
    ),
    fixture(
      '9001',
      'NOTE',
      '开发样本：今天的阅读界面检查',
      '## 学习片段\n\n只验证日志展开和定位，不代表真实学习记录。',
    ),
    fixture(
      '9002',
      'NOTE',
      '开发样本：验证过滤检查',
      '## 检查范围\n\n此 TESTED 是 mock 测试字段，不能作为真实验证依据。',
      'TESTED',
    ),
  ]
}
function read() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey))
    if (stored) return stored
    const initial = seed()
    localStorage.setItem(storageKey, JSON.stringify(initial))
    return initial
  } catch {
    return seed()
  }
}
let records = read()
const clone = (value) => JSON.parse(JSON.stringify(value))
function persist() {
  localStorage.setItem(storageKey, JSON.stringify(records))
}
const visible = () =>
  records.filter(
    (p) => !p.deleted && p.status === 'PUBLISHED' && p.publishedRevisionId,
  )
function revision(post, id) {
  const value = post.revisions.find((r) => r.revisionId === id)
  if (!value) throw new ApiError(404, '找不到修订', 'CONTENT_NOT_FOUND')
  return value
}
function summary(post, body = false) {
  const r = revision(post, post.publishedRevisionId)
  return {
    id: post.id,
    kind: post.kind,
    title: r.title,
    excerpt: r.excerpt,
    ...(body ? { content: r.content } : {}),
    category: r.categoryId ? category : null,
    tags: r.tagIds.includes('7') ? [tag] : [],
    publishedAt: post.publishedAt,
    updatedAt: r.createdAt,
    estimatedReadMinutes: 5,
    sourceTools: r.sourceTools,
    verification: r.verification,
    journalDate: r.journalDate,
    ...(post.kind === 'NOTE' ? { topics: r.topics } : {}),
  }
}
function page(rows, p = {}) {
  const current = Math.max(1, Number(p.page) || 1),
    size = Math.min(50, Number(p.size) || 10)
  return {
    data: rows.slice((current - 1) * size, current * size),
    total: rows.length,
    page: current,
    size,
    pages: Math.ceil(rows.length / size),
  }
}
function post(id) {
  const found = records.find((p) => p.id === id && !p.deleted)
  if (!found) throw new ApiError(404, '找不到内容', 'CONTENT_NOT_FOUND')
  return found
}
function lock(record, expectedVersion) {
  if (expectedVersion !== record.version)
    throw new ApiError(409, '内容已被其他页面修改', 'VERSION_CONFLICT')
}
function detail(record) {
  return {
    id: record.id,
    kind: record.kind,
    status: record.status,
    version: record.version,
    draftRevisionId: record.draftRevisionId,
    publishedRevisionId: record.publishedRevisionId,
    draft: revision(record, record.draftRevisionId),
    published: record.publishedRevisionId
      ? {
          title: revision(record, record.publishedRevisionId).title,
          revisionId: record.publishedRevisionId,
        }
      : null,
  }
}
function validate(body) {
  if (
    !body.title?.trim() ||
    body.title.length > 200 ||
    !body.content ||
    new TextEncoder().encode(body.content).length > 131072 ||
    body.excerpt.length > 500 ||
    body.tagIds.length > 20 ||
    body.sourceTools.some((s) => !sources.includes(s)) ||
    !['ARTICLE', 'NOTE'].includes(body.kind) ||
    (body.kind === 'NOTE' && !body.journalDate)
  )
    throw new ApiError(400, '字段校验失败', 'INVALID_ARGUMENT')
}
function append(record, body) {
  const r = {
    ...clone(body),
    revisionId: record.id + String(record.version + 1).padStart(4, '0'),
    createdAt: new Date().toISOString(),
    verification: {
      status: 'UNVERIFIED',
      summary: '新草稿尚未验证',
      verifiedAt: null,
    },
  }
  record.revisions.push(r)
  record.draftRevisionId = r.revisionId
  return r.revisionId
}
async function delay(signal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await new Promise((resolve, reject) => {
    const aborted = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', aborted)
      resolve()
    }, 180)
    signal?.addEventListener('abort', aborted, { once: true })
  })
}
export async function mockRequest(
  method,
  path,
  { params = {}, body, headers, signal } = {},
) {
  await delay(signal)
  // Re-read so a second browser tab can cause a real version conflict in the mock.
  records = read()
  const ok = (data) => ({
    code: 200,
    message: 'DEVELOPMENT MOCK',
    data: clone(data),
    timestamp: Date.now(),
  })
  const restricted =
    path.startsWith('/admin/') ||
    path === '/captures' ||
    ['/auth/me', '/auth/logout'].includes(path)
  if (restricted && headers.Authorization !== 'Bearer devblog-local-mock')
    throw new ApiError(401, '开发 mock 会话已失效', 'AUTH_REQUIRED')
  if (path === '/auth/login' && method === 'POST') {
    if (body.password !== 'devblog-mock')
      throw new ApiError(401, '开发 mock 密码错误', 'AUTH_REQUIRED')
    return ok({
      accessToken: 'devblog-local-mock',
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    })
  }
  if (path === '/auth/me')
    return ok({
      role: 'ADMIN',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    })
  if (path === '/auth/logout') return ok(null)
  if (
    path === '/captures' ||
    /^\/admin\/(captures|runs|publishing-settings)(?:\/|$)/.test(path)
  ) {
    const { studioMockRequest } = await import('./mock-studio.js')
    return studioMockRequest(
      method,
      path,
      { params, body, headers },
      (captures, journalDate) => {
        records = read()
        const id = String(
          Math.max(10000, ...records.map((item) => Number(item.id))) + 1,
        )
        const value = fixture(
          id,
          'NOTE',
          '开发样本：模拟整理 ' + journalDate,
          captures
            .map((item) => '## ' + item.title + '\n\n' + item.body)
            .join('\n\n'),
        )
        value.revisions[0].journalDate = journalDate
        value.publishedAt = new Date().toISOString()
        records.push(value)
        persist()
        return { id }
      },
    )
  }
  const summaries = visible()
    .map((p) => summary(p))
    .sort(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) ||
        (BigInt(a.id) > BigInt(b.id) ? -1 : 1),
    )
  if (path === '/public/home')
    return ok({
      featured: visible()
        .filter(
          (p) =>
            p.kind === 'ARTICLE' && revision(p, p.publishedRevisionId).pinned,
        )
        .map((p) => summary(p)),
      recentArticles: summaries.filter((p) => p.kind === 'ARTICLE'),
      recentNotes: summaries.filter((p) => p.kind === 'NOTE'),
      topics: [
        {
          topic: '工程实践',
          publishedCount: summaries.filter((p) => p.kind === 'NOTE').length,
        },
      ],
      publicStats: {
        publishedArticleCount: summaries.filter((p) => p.kind === 'ARTICLE')
          .length,
        publishedNoteCount: summaries.filter((p) => p.kind === 'NOTE').length,
        latestPublishedAt: visible().length ? summaries[0].publishedAt : null,
      },
    })
  if (path === '/categories') return ok([category])
  if (path === '/tags') return ok([tag])
  if (path === '/projects')
    return ok([
      {
        id: '1',
        name: '开发样本：DevBlog 页面夹具',
        description: '仅用于检查项目卡片布局，不代表已上线项目或个人履历。',
        icon: '⌘',
        github: null,
        demo: null,
        category: 'web',
        techs: ['Vue 3', '开发夹具'],
        stars: null,
        sort: 1,
      },
    ])
  if (['/posts', '/notes', '/search'].includes(path)) {
    let rows = summaries.filter((p) =>
      path === '/search'
        ? !params.kind || params.kind === 'ALL' || p.kind === params.kind
        : p.kind === (path === '/posts' ? 'ARTICLE' : 'NOTE'),
    )
    if (params.q)
      rows = rows.filter((p) =>
        [
          p.title,
          p.excerpt,
          revision(post(p.id), post(p.id).publishedRevisionId).content,
        ]
          .join(' ')
          .toLowerCase()
          .includes(params.q.toLowerCase()),
      )
    if (params.categorySlug)
      rows = rows.filter((p) => p.category?.slug === params.categorySlug)
    if (params.tag)
      rows = rows.filter((p) => p.tags.some((t) => t.slug === params.tag))
    if (params.topic)
      rows = rows.filter((p) => p.topics?.includes(params.topic))
    if (String(params.verifiedOnly) === 'true')
      rows = rows.filter((p) => p.verification.status === 'TESTED')
    if (params.from) rows = rows.filter((p) => p.journalDate >= params.from)
    if (params.to) rows = rows.filter((p) => p.journalDate <= params.to)
    if (params.sort === 'oldest') rows.reverse()
    return ok(page(rows, params))
  }
  const publicMatch = path.match(/^\/(posts|notes)\/(\d+)$/)
  if (publicMatch) {
    const record = visible().find(
      (p) =>
        p.id === publicMatch[2] &&
        p.kind === (publicMatch[1] === 'posts' ? 'ARTICLE' : 'NOTE'),
    )
    if (!record)
      throw new ApiError(404, '内容不存在或尚未公开', 'CONTENT_NOT_FOUND')
    return ok(summary(record, true))
  }
  if (path === '/admin/posts' && method === 'GET') {
    let rows = records.filter(
      (p) =>
        !p.deleted &&
        (!params.kind || params.kind === 'ALL' || p.kind === params.kind) &&
        (!params.status || p.status === params.status),
    )
    if (params.q)
      rows = rows.filter((p) =>
        revision(p, p.draftRevisionId).title.includes(params.q),
      )
    return ok(
      page(
        rows
          .map((p) => ({
            ...detail(p),
            title: revision(p, p.draftRevisionId).title,
            excerpt: revision(p, p.draftRevisionId).excerpt,
            draft: undefined,
            published: undefined,
          }))
          .reverse(),
        params,
      ),
    )
  }
  if (path === '/admin/posts' && method === 'POST') {
    validate(body)
    const id = String(Math.max(10000, ...records.map((p) => Number(p.id))) + 1)
    const record = {
      id,
      kind: body.kind,
      status: 'DRAFT',
      version: 1,
      publishedRevisionId: null,
      publishedAt: null,
      revisions: [],
    }
    const revisionId = append(record, body)
    records.push(record)
    persist()
    return ok({ id, revisionId, version: 1, status: 'DRAFT' })
  }
  const match = path.match(
    /^\/admin\/posts\/(\d+)(?:\/(draft|publish|withdraw|revisions)(?:\/(\d+))?)?$/,
  )
  if (match) {
    const record = post(match[1]),
      action = match[2]
    if (method === 'GET') {
      if (action === 'revisions')
        return ok(
          match[3]
            ? revision(record, match[3])
            : page(
                [...record.revisions].reverse().map((r) => ({
                  revisionId: r.revisionId,
                  title: r.title,
                  createdAt: r.createdAt,
                })),
                params,
              ),
        )
      return ok(detail(record))
    }
    lock(
      record,
      method === 'DELETE' ? params.expectedVersion : body.expectedVersion,
    )
    if (method === 'DELETE') {
      record.deleted = true
      persist()
      return ok(null)
    }
    let result
    if (action === 'draft' && method === 'PUT') {
      validate(body)
      if (body.kind !== record.kind)
        throw new ApiError(400, 'kind 创建后不可改', 'INVALID_ARGUMENT')
      const revisionId = append(record, body)
      record.version++
      result = {
        id: record.id,
        revisionId,
        version: record.version,
        status: record.status,
      }
    } else if (action === 'publish' && method === 'POST') {
      if (body.revisionId !== record.draftRevisionId)
        throw new ApiError(409, '只允许发布当前草稿', 'VERSION_CONFLICT')
      record.publishedRevisionId = body.revisionId
      record.status = 'PUBLISHED'
      record.version++
      record.publishedAt = new Date().toISOString()
      result = {
        id: record.id,
        publishedRevisionId: record.publishedRevisionId,
        publishedAt: record.publishedAt,
        version: record.version,
      }
    } else if (action === 'withdraw' && method === 'POST') {
      record.publishedRevisionId = null
      record.status = 'ARCHIVED'
      record.version++
      result = { status: record.status, version: record.version }
    } else
      throw new ApiError(404, '开发 mock 未实现该接口', 'CONTENT_NOT_FOUND')
    persist()
    return ok(result)
  }
  throw new ApiError(404, '开发 mock 未实现该接口', 'CONTENT_NOT_FOUND')
}
