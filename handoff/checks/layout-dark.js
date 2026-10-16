async (page) => {
  const failures = [],
    errors = [],
    results = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => localStorage.setItem('devblog_theme', 'dark'))
  const pages = [
    ['/', '.hero-pulse'],
    ['/posts', '.article-row'],
    ['/posts/42', '.prose table'],
    ['/notes', '.note-card'],
    ['/projects', '.project-grid article'],
    ['/about', '.about-copy'],
    ['/categories', '.filter-shelf a'],
    ['/tags', '.filter-shelf a'],
  ]
  for (const width of [360, 375, 390, 414, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [route, ready] of pages) {
      try {
        await page.goto('http://127.0.0.1:5173/blog-front' + route)
        await page
          .locator('main ' + ready)
          .first()
          .waitFor()
        const metrics = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - innerWidth,
          theme: document.documentElement.dataset.theme,
          bodyOverflow: getComputedStyle(document.body).overflowX,
        }))
        if (
          metrics.overflow > 1 ||
          metrics.theme !== 'dark' ||
          metrics.bodyOverflow === 'hidden'
        )
          throw Error(JSON.stringify(metrics))
        results.push({ width, route, passed: true })
        if (
          (width === 390 && ['/posts/42', '/notes'].includes(route)) ||
          (width === 1440 && ['/', '/posts/42'].includes(route))
        )
          await page.screenshot({
            path:
              'output/playwright/dark-' +
              width +
              '-' +
              (route.replaceAll('/', '_') || 'home') +
              '.png',
          })
      } catch (error) {
        failures.push({ width, route, error: error.message.slice(0, 300) })
      }
    }
  }
  return JSON.stringify({
    suite: 'public-layout-dark',
    passed: results.length,
    failures,
    pageErrors: errors,
  })
}
