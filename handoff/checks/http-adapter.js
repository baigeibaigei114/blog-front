async (page) => {
  const passed = [],
    ensure = (value, message) => {
      if (!value) throw Error(message)
    }
  const envelope = (data) => ({
    code: 200,
    message: 'HTTP FIXTURE',
    data,
    timestamp: Date.now(),
  })
  const paging = (data, params) => ({
    data,
    total: data.length,
    page: Number(params.get('page') || 1),
    size: 10,
    pages: data.length ? 1 : 0,
  })
  let homeFailure = true,
    expire = false,
    failCreate = true,
    version = 1,
    session = false
  const createKeys = []
  const draft = {
    title: 'HTTP 夹具',
    content: '## HTTP fixture\n\n用于检查请求适配层。',
    excerpt: 'HTTP fixture excerpt',
    kind: 'ARTICLE',
    categoryId: null,
    tagIds: [],
    pinned: false,
    sourceTools: ['MANUAL'],
    journalDate: null,
    topics: [],
  }
  const summary = {
    id: '42',
    kind: 'ARTICLE',
    title: draft.title,
    excerpt: draft.excerpt,
    category: null,
    tags: [],
    publishedAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z',
    estimatedReadMinutes: 1,
    sourceTools: ['MANUAL'],
    verification: { status: 'UNVERIFIED', summary: 'HTTP测试夹具' },
    journalDate: null,
  }
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname.replace(/^.*\/api\/v1/, '')
    const method = request.method(),
      body = request.postDataJSON()
    const headers = {
      'access-control-allow-origin': 'http://127.0.0.1:4173',
      'access-control-allow-headers':
        'authorization,content-type,idempotency-key',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'content-type': 'application/json',
    }
    const reply = async (status, data) => {
      try {
        await route.fulfill({ status, headers, body: JSON.stringify(data) })
      } catch {}
    }
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (path === '/auth/login') {
      session = true
      return reply(
        200,
        envelope({
          accessToken: 'http-fixture-session',
          tokenType: 'Bearer',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      )
    }
    if (path.startsWith('/admin/') || path === '/auth/me') {
      if (!session || expire)
        return reply(401, {
          code: 401,
          message: 'HTTP fixture session expired',
          errorCode: 'TOKEN_EXPIRED',
          requestId: 'fixture-401',
        })
    }
    if (path === '/auth/me')
      return reply(
        200,
        envelope({
          role: 'ADMIN',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      )
    if (path === '/categories' || path === '/tags')
      return reply(200, envelope([]))
    if (path === '/public/home') {
      if (homeFailure)
        return reply(500, {
          code: 500,
          message: 'HTTP fixture unavailable',
          errorCode: 'INTERNAL_ERROR',
          requestId: 'fixture-500',
        })
      return reply(
        200,
        envelope({
          featured: [],
          recentArticles: [],
          recentNotes: [],
          topics: [],
          publicStats: {
            publishedArticleCount: 0,
            publishedNoteCount: 0,
            latestPublishedAt: null,
          },
        }),
      )
    }
    if (path === '/search') {
      const q = url.searchParams.get('q')
      await new Promise((resolve) =>
        setTimeout(resolve, q === 'old' ? 800 : 10),
      )
      return reply(
        200,
        envelope(
          paging([{ ...summary, title: q + ' result' }], url.searchParams),
        ),
      )
    }
    if (path === '/admin/posts' && method === 'POST') {
      createKeys.push(request.headers()['idempotency-key'])
      ensure(
        !('expectedVersion' in body) &&
          body.kind === 'ARTICLE' &&
          !('verification' in body),
        'Invalid create payload',
      )
      if (failCreate) {
        failCreate = false
        return reply(503, {
          code: 503,
          message: 'HTTP fixture retry',
          errorCode: 'DEPENDENCY_UNAVAILABLE',
        })
      }
      return reply(
        200,
        envelope({ id: '55', revisionId: '551', version: 1, status: 'DRAFT' }),
      )
    }
    if (path === '/admin/posts/55' && method === 'GET')
      return reply(
        200,
        envelope({
          id: '55',
          kind: 'ARTICLE',
          status: 'DRAFT',
          version,
          draftRevisionId: '551',
          publishedRevisionId: null,
          draft,
          published: null,
        }),
      )
    if (path === '/admin/posts/55/draft' && method === 'PUT') {
      ensure(body.expectedVersion === 1, 'Missing expectedVersion')
      return reply(409, {
        code: 409,
        message: 'HTTP fixture conflict',
        errorCode: 'VERSION_CONFLICT',
        data: { currentVersion: 2 },
      })
    }
    return reply(404, {
      code: 404,
      message: 'HTTP fixture missing',
      errorCode: 'CONTENT_NOT_FOUND',
    })
  })
  await page.goto('http://127.0.0.1:4173/blog-front/')
  await page.getByRole('heading', { name: '暂时无法加载' }).waitFor()
  ensure(
    (await page.locator('main').innerText()).includes('fixture-500'),
    'Request ID not visible',
  )
  homeFailure = false
  await page.getByRole('button', { name: '重试', exact: true }).click()
  await page.getByText('这里还没有公开内容。', { exact: true }).waitFor()
  ensure(
    !(await page.locator('main').innerText()).includes('开发样本'),
    'Silent fallback',
  )
  passed.push(
    'Production adapter: HTTP500, requestId, retry, honest empty response',
  )
  await page.keyboard.press('Control+k')
  const input = page.getByRole('combobox', { name: '搜索文章、日志或页面' })
  await input.fill('old')
  await page.waitForTimeout(300)
  await input.fill('new')
  await page.getByRole('option').filter({ hasText: 'new result' }).waitFor()
  await page.waitForTimeout(1000)
  ensure(
    !(await page.locator('#command-results').innerText()).includes(
      'old result',
    ),
    'Stale search overwrote newer query',
  )
  await page.keyboard.press('Escape')
  passed.push(
    'Debounce/cancel and late-search-response isolation over HTTP fixture',
  )
  await page.goto(
    'http://127.0.0.1:4173/blog-front/admin/login?redirect=https%3A%2F%2Fexample.com',
  )
  await page.getByLabel('管理员密码').fill('http-fixture-password')
  await page.getByRole('button', { name: '登录工作台 ↗' }).click()
  await page.waitForURL('**/admin/posts')
  passed.push('Login accessToken/me contract and external redirect rejection')
  await page.goto('http://127.0.0.1:4173/blog-front/admin/new')
  await page.getByLabel('标题', { exact: true }).fill('HTTP 夹具')
  await page.getByLabel('Markdown 正文', { exact: true }).fill(draft.content)
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await page.getByText('HTTP fixture retry', { exact: true }).waitFor()
  ensure(
    (await page.getByLabel('标题', { exact: true }).inputValue()) ===
      'HTTP 夹具',
    '503 lost input',
  )
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await page.waitForURL('**/admin/edit/55')
  await page.getByLabel('标题', { exact: true }).waitFor()
  ensure(
    createKeys.length === 2 && createKeys[0] && createKeys[0] === createKeys[1],
    'Idempotency key changed on retry',
  )
  passed.push(
    '503 retains input and explicit create retry reuses Idempotency-Key',
  )
  await page.getByLabel('标题', { exact: true }).fill('409保留输入')
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await page.getByText('HTTP fixture conflict', { exact: true }).waitFor()
  ensure(
    (await page.getByLabel('标题', { exact: true }).inputValue()) ===
      '409保留输入',
    '409 lost input',
  )
  await page
    .getByRole('button', { name: '重新加载服务端版本', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '确认', exact: true })
    .click()
  await page.getByLabel('标题', { exact: true }).waitFor()
  expire = true
  await page.getByLabel('标题', { exact: true }).fill('401保留输入')
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await page
    .getByText('HTTP fixture session expired', { exact: true })
    .waitFor()
  ensure(
    (await page.getByLabel('标题', { exact: true }).inputValue()) ===
      '401保留输入',
    '401 lost input',
  )
  passed.push('409 expectedVersion, 401 expired session retain editor content')
  await page.screenshot({ path: 'output/playwright/http-401-editor.png' })
  // Remove the dirty test field before navigation; no live server received a write.
  await page.getByLabel('标题', { exact: true }).fill('HTTP 夹具')
  await page.unroute('**/api/v1/**')
  return JSON.stringify({
    suite: 'production-http-fixtures',
    passed,
    realBackendValidated: false,
  })
}
