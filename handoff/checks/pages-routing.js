async (page) => {
  const ensure = (value, message) => {
      if (!value) throw Error(message)
    },
    passed = []
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': 'http://127.0.0.1:4174' },
      body: JSON.stringify({
        code: 404,
        message: 'Pages fixture: no backend',
        errorCode: 'CONTENT_NOT_FOUND',
      }),
    }),
  )
  const target =
    '/blog-front/posts/42?tag=vue&q=%E4%B8%AD%E6%96%87#section-%E4%B8%AD%E6%96%87'
  await page.goto('http://127.0.0.1:4174' + target)
  await page.getByRole('heading', { name: '找不到内容' }).waitFor()
  ensure(
    new URL(page.url()).pathname === '/blog-front/posts/42',
    'Path recovery',
  )
  ensure(
    new URL(page.url()).search === '?tag=vue&q=%E4%B8%AD%E6%96%87',
    'Query recovery',
  )
  ensure(
    decodeURIComponent(new URL(page.url()).hash) === '#section-中文',
    'Hash recovery',
  )
  await page.reload()
  await page.getByRole('heading', { name: '找不到内容' }).waitFor()
  ensure(
    !new URL(page.url()).searchParams.has('__restore'),
    'Restore query left behind',
  )
  passed.push('Pages 404 direct link and refresh preserve base/path/query/hash')
  await page.goto(
    'http://127.0.0.1:4174/blog-front/?__restore=' +
      encodeURIComponent('https://example.com/outside'),
  )
  await page.locator('main h1').waitFor()
  ensure(
    new URL(page.url()).origin === 'http://127.0.0.1:4174',
    'External restore allowed',
  )
  await page.goto(
    'http://127.0.0.1:4174/blog-front/?__restore=' +
      encodeURIComponent('/outside/about'),
  )
  await page.locator('main h1').waitFor()
  ensure(
    new URL(page.url()).pathname === '/blog-front/',
    'Restore escaped base',
  )
  passed.push('Recovery rejects external origin and outside-base paths')
  await page.goto(
    'http://127.0.0.1:4174/blog-front/#/posts/42?legacy=1#section-test',
  )
  await page.getByRole('heading', { name: '找不到内容' }).waitFor()
  ensure(
    new URL(page.url()).pathname === '/blog-front/posts/42' &&
      new URL(page.url()).searchParams.get('legacy') === '1',
    'Legacy hash path lost',
  )
  passed.push('Old /#/posts/id fallback compatibility')
  await page.goto('http://127.0.0.1:4174/blog-front/notes?note=9001')
  await page.getByRole('heading', { name: '每天一点，慢慢连起来。' }).waitFor()
  ensure(
    new URL(page.url()).searchParams.get('note') === '9001',
    'NOTE deep link lost',
  )
  await page.goto('http://127.0.0.1:4174/blog-front/admin/studio?tab=settings')
  await page.getByLabel('管理员密码').waitFor()
  ensure(
    new URL(page.url()).searchParams.get('redirect') ===
      '/admin/studio?tab=settings',
    'Admin return path lost',
  )
  passed.push('NOTE and protected studio direct-link recovery')
  await page.unroute('**/api/v1/**')
  return JSON.stringify({
    suite: 'local-static-pages-emulator',
    passed,
    githubHostedValidated: false,
  })
}
