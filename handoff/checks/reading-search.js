async (page) => {
  const passed = [],
    ensure = (value, message) => {
      if (!value) throw Error(message)
    }
  await page.goto('http://127.0.0.1:5173/blog-front/posts/42')
  await page.locator('.prose table').waitFor()
  const security = await page.evaluate(() => ({
    injected: !!window.__unsafe,
    unsafeElements: document.querySelectorAll(
      '.prose script,.prose [onerror],.prose a[href^="javascript:"],.prose iframe',
    ).length,
    ids: [...document.querySelectorAll('.prose h2[id],.prose h3[id]')].map(
      (n) => n.id,
    ),
    external: [...document.querySelectorAll('.prose a[target="_blank"]')].every(
      (n) => n.rel.includes('noopener') && n.rel.includes('noreferrer'),
    ),
  }))
  ensure(
    !security.injected && security.unsafeElements === 0 && security.external,
    'Unsafe Markdown',
  )
  ensure(
    security.ids.length === new Set(security.ids).size &&
      security.ids.includes('section-从问题出发-2'),
    'Duplicate headings',
  )
  passed.push('Markdown HTML/URL safety and stable duplicate anchors')
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: '复制原始代码' }).nth(1).click()
  ensure(
    (await page.evaluate(() => navigator.clipboard.readText())).replace(
      /\r\n/g,
      '\n',
    ) === '没有语言的代码应原样复制。\nfirst line\nsecond line\n',
    'Code copy contains line numbers or lost line endings',
  )
  passed.push('Copy original code without line numbers')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '打开文章目录' }).click()
  const drawer = page.getByRole('dialog', { name: '文章目录' })
  await drawer.waitFor()
  ensure(
    await page.evaluate(() => document.body.style.overflow === 'hidden'),
    'Drawer scroll lock',
  )
  await drawer.getByRole('link', { name: '最小代码', exact: true }).click()
  await drawer.waitFor({ state: 'hidden' })
  ensure(
    decodeURIComponent(new URL(page.url()).hash).includes('最小代码'),
    'TOC hash not stored',
  )
  await page.reload()
  await page.locator('.prose table').waitFor()
  await page.waitForFunction(
    () =>
      Math.abs(
        document.getElementById('section-最小代码').getBoundingClientRect()
          .top - 32,
      ) < 5,
  )
  passed.push('Mobile TOC select, hash refresh')
  await page.getByRole('button', { name: '打开文章目录' }).click()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Escape')
  ensure(
    await page.evaluate(
      () =>
        document.activeElement?.getAttribute('aria-label') === '打开文章目录' &&
        document.body.style.overflow !== 'hidden',
    ),
    'Drawer focus return',
  )
  await page.evaluate(() => {
    const root = document.querySelector('.reading-article>.prose')
    window.scrollTo(0, root.offsetTop + root.offsetHeight - innerHeight + 40)
  })
  await page.waitForFunction(
    () => document.querySelector('.read-pct-badge').textContent === '100%',
  )
  passed.push('Drawer Esc/focus return and progress excludes footer')
  await page.getByRole('button', { name: '回到文章顶部' }).click()
  await page.keyboard.press('Control+k')
  const palette = page.getByRole('dialog', { name: '搜索与命令' })
  await palette.waitFor()
  await page
    .getByRole('combobox', { name: '搜索文章、日志或页面' })
    .fill('开发样本')
  await page.waitForFunction(
    () => document.querySelectorAll('#command-results mark').length >= 4,
  )
  ensure(
    (await palette.innerText()).includes('文章') &&
      (await palette.innerText()).includes('日志'),
    'Mixed search types',
  )
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowUp')
  await page.screenshot({ path: 'output/playwright/search-mobile.png' })
  await page.keyboard.press('Escape')
  await page
    .getByRole('button', { name: '搜索与命令面板' })
    .filter({ visible: true })
    .click()
  await page
    .getByRole('combobox', { name: '搜索文章、日志或页面' })
    .fill('关于')
  await page.keyboard.press('Enter')
  await page.waitForURL('**/about')
  passed.push('Ctrl K, mixed search highlight, arrows, Enter, Esc')
  await page.goto(
    'http://127.0.0.1:5173/blog-front/notes?verifiedOnly=true&topic=' +
      encodeURIComponent('工程实践'),
  )
  await page.locator('.note-card').waitFor()
  ensure(
    (await page.locator('.note-card').count()) === 1 &&
      (await page.locator('.note-card').innerText()).includes('有实测依据'),
    'Verified combined filtering',
  )
  await page.goto('http://127.0.0.1:5173/blog-front/notes?page=2&note=9001')
  await page.locator('#note-body-9001 .prose').waitFor()
  passed.push('NOTE combined filters and off-page note deep link')
  await page.goto(
    'http://127.0.0.1:5173/blog-front/notes?q=' + encodeURIComponent('今天'),
  )
  await page.locator('.note-card').waitFor()
  ensure((await page.locator('.note-card').count()) === 1, 'NOTE search')
  await page.goto(
    'http://127.0.0.1:5173/blog-front/posts?q=' +
      encodeURIComponent('安全') +
      '&categorySlug=engineering&tag=vue&sort=oldest',
  )
  await page.locator('.article-row').waitFor()
  ensure(
    (await page.locator('.article-row').count()) === 1,
    'ARTICLE combined filtering',
  )
  await page
    .getByRole('link', {
      name: '开发样本：安全 Markdown 与长正文阅读检查',
      exact: true,
    })
    .click()
  await page.locator('.prose table').waitFor()
  await page.getByRole('button', { name: '← 返回文章归档' }).click()
  await page.locator('.article-row').waitFor()
  ensure(
    new URL(page.url()).searchParams.get('tag') === 'vue',
    'List query lost on back',
  )
  await page.goto('http://127.0.0.1:5173/blog-front/posts?q=no-match-xyz')
  await page.getByText('没有符合筛选条件的公开文章。').waitFor()
  await page.goto('http://127.0.0.1:5173/blog-front/posts/9999999')
  await page.getByRole('heading', { name: '找不到内容' }).waitFor()
  await page.goto('http://127.0.0.1:5173/blog-front/does-not-exist')
  await page.getByRole('heading', { name: '这一页，还没有写下。' }).waitFor()
  passed.push('ARTICLE query/back, empty search, content 404 and route 404')
  return JSON.stringify({ suite: 'reading-search-mock', passed })
}
