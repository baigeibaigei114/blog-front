async (page) => {
  const reads = [],
    failed = []
  const onResponse = (response) => {
    const path = new URL(response.url()).pathname
    if (path.includes('/api/v1/'))
      reads.push({ path, status: response.status() })
  }
  const onFailure = (request) => {
    const path = new URL(request.url()).pathname
    if (path.includes('/api/v1/'))
      failed.push({ path, error: 'NETWORK_OR_CORS_FAILURE' })
  }
  page.on('response', onResponse)
  page.on('requestfailed', onFailure)
  await page.goto('http://127.0.0.1:4173/blog-front/')
  await page.locator('main h1').waitFor()
  await page.waitForFunction(
    () =>
      !document
        .querySelector('main [role="status"]')
        ?.textContent.includes('正在'),
    {},
    { timeout: 20000 },
  )
  const state = await page.locator('main').innerText()
  const result = {
    suite: 'production-real-read',
    mockBanner: (await page.locator('.edition-strip').innerText()).includes(
      'MOCK',
    ),
    reads,
    failed,
    errorVisible: state.includes('暂时无法加载'),
    fixtureVisible: state.includes('开发样本'),
    title: await page.title(),
  }
  page.removeListener('response', onResponse)
  page.removeListener('requestfailed', onFailure)
  return JSON.stringify(result)
}
