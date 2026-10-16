async (page) => {
  const passed = [],
    ensure = (value, message) => {
      if (!value) throw Error(message)
    }
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('http://127.0.0.1:5173/blog-front/')
  await page.evaluate(() => sessionStorage.removeItem('devblog_mock_session'))
  await page.goto('http://127.0.0.1:5173/blog-front/admin/studio?tab=settings')
  await page.getByLabel('管理员密码').waitFor()
  ensure(
    new URL(page.url()).searchParams.get('redirect') ===
      '/admin/studio?tab=settings',
    'Missing redirect',
  )
  await page.getByLabel('管理员密码').fill('wrong')
  await page.getByRole('button', { name: '登录工作台 ↗' }).click()
  await page.getByRole('alert').waitFor()
  await page.getByLabel('管理员密码').fill('devblog-mock')
  await page.getByRole('button', { name: '登录工作台 ↗' }).click()
  await page.waitForURL('**/admin/studio?tab=settings')
  await page.getByRole('heading', { name: '发布设置', level: 1 }).waitFor()
  passed.push(
    'Protected route, wrong password, verified session and safe return',
  )
  for (const tab of ['inbox', 'runs', 'settings']) {
    await page.goto('http://127.0.0.1:5173/blog-front/admin/studio?tab=' + tab)
    await page.getByRole('heading', { name: { inbox:'学习收件箱',runs:'发布记录',settings:'发布设置' }[tab], level:1 }).waitFor()
    ensure(
      !(await page.locator('main').innerText()).includes('发布成功'),
      'Fake studio success',
    )
  }
  passed.push('Studio tabs render F4 UI without fake publish feedback')
  await page.goto('http://127.0.0.1:5173/blog-front/admin/new')
  await page.getByLabel('标题', { exact: true }).fill('浏览器检查：草稿隔离')
  await page
    .getByLabel('Markdown 正文', { exact: true })
    .fill('## 初始正文\n\n这是一条本机 mock 验证草稿。')
  await page.getByRole('button', { name: '安全预览', exact: true }).click()
  await page.locator('.editor-preview h2').waitFor()
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await page.waitForURL('**/admin/edit/*')
  const id = new URL(page.url()).pathname.split('/').pop()
  await page.getByLabel('标题', { exact: true }).waitFor()
  const reader = await page.context().newPage()
  await reader.goto('http://127.0.0.1:5173/blog-front/posts/' + id)
  await reader.getByRole('heading', { name: '找不到内容' }).waitFor()
  passed.push('Create draft, safe preview and public draft 404')
  await page
    .getByRole('button', { name: '发布当前已保存版本', exact: true })
    .click()
  await page
    .getByRole('dialog', { name: '发布当前版本' })
    .getByRole('button', { name: '确认', exact: true })
    .click()
  await page
    .getByText('开发 mock：当前已保存版本已发布。', { exact: true })
    .waitFor()
  await reader.reload()
  await reader.locator('.prose h2').waitFor()
  ensure(
    (await reader.locator('.prose').innerText()).includes('初始正文'),
    'Publish not visible',
  )
  await page
    .getByLabel('Markdown 正文', { exact: true })
    .fill('## 新草稿正文\n\n仅保存，不公开。')
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await page
    .getByText('开发 mock：草稿已保存。访客仍读取上次公开版本。', {
      exact: true,
    })
    .waitFor()
  await reader.reload()
  await reader.locator('.prose h2').waitFor()
  ensure(
    !(await reader.locator('.prose').innerText()).includes('新草稿正文'),
    'Saved draft leaked',
  )
  passed.push('Publish and save new draft preserves public snapshot')
  const second = await page.context().newPage()
  // sessionStorage is tab scoped; only this mock QA tab receives its synthetic session.
  await second.goto('http://127.0.0.1:5173/blog-front/')
  await second.evaluate(() =>
    sessionStorage.setItem('devblog_mock_session', 'devblog-local-mock'),
  )
  await second.goto(page.url())
  await second.getByLabel('标题', { exact: true }).waitFor()
  await page.getByLabel('标题', { exact: true }).fill('浏览器检查：新版本')
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await page
    .getByText('开发 mock：草稿已保存。访客仍读取上次公开版本。', {
      exact: true,
    })
    .waitFor()
  await second.getByLabel('标题', { exact: true }).fill('第二页待保留输入')
  await second.getByRole('button', { name: '保存草稿', exact: true }).click()
  await second.getByText('内容已被其他页面修改', { exact: true }).waitFor()
  ensure(
    (await second.getByLabel('标题', { exact: true }).inputValue()) ===
      '第二页待保留输入',
    'Conflict lost input',
  )
  passed.push('Two-tab 409 retains unsaved input')
  await second
    .getByRole('button', { name: '重新加载服务端版本', exact: true })
    .click()
  await second
    .getByRole('dialog')
    .getByRole('button', { name: '确认', exact: true })
    .click()
  await second.getByLabel('标题', { exact: true }).waitFor()
  ensure(
    (await second.getByLabel('标题', { exact: true }).inputValue()) ===
      '浏览器检查：新版本',
    'Conflict reload failed',
  )
  await second.close()
  await page.getByRole('button', { name: '撤回公开版', exact: true }).click()
  await page
    .getByRole('dialog', { name: '撤回公开版' })
    .getByRole('button', { name: '确认', exact: true })
    .click()
  await page
    .getByText('开发 mock：公开版本已撤回，草稿保留。', { exact: true })
    .waitFor()
  await reader.reload()
  await reader.getByRole('heading', { name: '找不到内容' }).waitFor()
  await reader.close()
  passed.push('Withdraw removes public access')
  await page.getByRole('button', { name: '查看版本记录' }).click()
  await page.getByRole('heading', { name: '版本记录' }).waitFor()
  for (const theme of ['light', 'dark'])
    for (const width of [360, 375, 390, 414, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme
      }, theme)
      ensure(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        'Admin edit overflow ' + width + ' ' + theme,
      )
    }
  await page.screenshot({ path: 'output/playwright/admin-editor-desktop.png' })
  return JSON.stringify({
    suite: 'admin-mock',
    passed,
    pageErrors: errors,
    createdMockId: id,
  })
}
