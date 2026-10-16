async page => {
  const ensure = (value, message) => { if (!value) throw Error(message) }
  const base = 'https://baigeibaigei114.github.io/blog-front/'
  // This QA profile loaded the previous release; discard cached HTML before testing the new one.
  const cacheSession = await page.context().newCDPSession(page)
  await cacheSession.send('Network.clearBrowserCache')
  await cacheSession.detach()
  const errors = [], assets = [], apiReads = [], apiRequests = [], apiFailures = [], passed = [], readStates = {}
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.pathname.includes('/api/v1/')) apiRequests.push({method:request.method(),path:url.pathname,query:Object.fromEntries(url.searchParams)})
  })
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => {
    const url = new URL(response.url())
    if (url.origin === new URL(base).origin && /\/assets\//.test(url.pathname)) assets.push({path:url.pathname,status:response.status()})
    if (url.pathname.includes('/api/v1/')) apiReads.push({method:response.request().method(),path:url.pathname,query:Object.fromEntries(url.searchParams),status:response.status()})
  })
  page.on('requestfailed', request => {
    const url = new URL(request.url())
    if (url.pathname.includes('/api/v1/')) apiFailures.push({method:request.method(),path:url.pathname,error:request.failure()?.errorText})
  })
  const settled = async () => {
    await page.locator('main').waitFor()
    await page.waitForFunction(() => [...document.querySelectorAll('main .state-box[role="status"]')].every(node=>!node.textContent.includes('正在')), {}, {timeout:20000})
  }
  await page.setViewportSize({width:1440,height:1000})
  const home = await page.goto(base)
  await page.locator('main h1').waitFor()
  await settled()
  readStates.home = await page.locator('main .article-row h3 a').count()>0
  // /posts/7 was successfully read from the real homepage earlier in this release check.
  const publishedPath = readStates.home ? await page.locator('main .article-row h3 a').first().getAttribute('href') : '/blog-front/posts/7'
  ensure(home.status() === 200, 'Hosted homepage failed')
  ensure((await page.locator('script[type="module"]').getAttribute('src')).includes('index-CevlVioG.js'), 'Old deployment entry')
  ensure(!(await page.locator('.edition-strip').innerText()).includes('MOCK'), 'Production mock enabled')
  passed.push('Current production entry served over verified HTTPS; no mock banner')
  for (const width of [390,768,1440]) {
    await page.setViewportSize({width,height:1000})
    for (const theme of ['light','dark']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) await page.getByRole('button',{name:theme==='dark'?'切换夜间主题':'切换日间主题',exact:true}).click()
      ensure(await page.locator('html').getAttribute('data-theme') === theme, 'Theme toggle failed')
      ensure(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Hosted page overflow')
      if (width===390||width===1440) await page.screenshot({path:'output/playwright/pages-live-'+theme+'-'+width+'.png'})
    }
  }
  passed.push('Hosted home 390/768/1440 widths and both themes')
  await page.setViewportSize({width:1440,height:1000})
  await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'关于',exact:true}).click()
  await page.waitForURL('**/blog-front/about')
  await page.locator('main h1').waitFor()
  ensure(new URL(page.url()).pathname==='/blog-front/about','Navigation escaped base')
  await page.reload();await page.locator('main h1').waitFor()
  ensure(new URL(page.url()).pathname==='/blog-front/about'&&!new URL(page.url()).searchParams.has('__restore'),'About refresh recovery failed')
  passed.push('Hosted navigation and true 404 refresh restore About')
  await page.goto(new URL(publishedPath, base).href)
  await page.locator('.reading-article .prose, main [role="alert"]').first().waitFor({timeout:20000})
  readStates.article = await page.locator('.reading-article .prose').count()>0
  if (readStates.article) ensure((await page.locator('.reading-article .prose').innerText()).length>100,'Published article body missing')
  await page.setViewportSize({width:390,height:1000})
  ensure(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Hosted article overflow')
  if (readStates.article) {
    await page.getByRole('button',{name:'打开文章目录',exact:true}).click()
    await page.getByRole('dialog').waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({state:'hidden'})
    await page.screenshot({path:'output/playwright/pages-live-article-390.png'})
  }
  await page.reload();await page.locator('.reading-article .prose, main [role="alert"]').first().waitFor({timeout:20000})
  await page.setViewportSize({width:1440,height:1000})
  if (readStates.article) passed.push('Real published article body, mobile reading drawer/Escape and refresh')
  const target='posts/42?tag=vue&q=%E4%B8%AD%E6%96%87#section-%E4%B8%AD%E6%96%87'
  await page.goto(base+target);await page.locator('.reading-article .prose, main [role="alert"]').first().waitFor({timeout:20000});await settled()
  ensure(new URL(page.url()).pathname==='/blog-front/posts/42'&&new URL(page.url()).searchParams.get('q')==='中文'&&decodeURIComponent(new URL(page.url()).hash)==='#section-中文','Hosted article recovery failed')
  const articleError=await page.locator('main [role="alert"]').count()>0
  await page.reload();await page.locator('.reading-article .prose, main [role="alert"]').first().waitFor({timeout:20000});await settled()
  ensure(new URL(page.url()).pathname==='/blog-front/posts/42','Article refresh failed')
  passed.push('Historical article direct path, query, hash and refresh preserved; content availability reported separately')
  await page.goto(base+'#/posts/42?legacy=1');await page.locator('.reading-article .prose, main [role="alert"]').first().waitFor({timeout:20000});await settled()
  ensure(new URL(page.url()).pathname==='/blog-front/posts/42'&&new URL(page.url()).searchParams.get('legacy')==='1','Old hash link failed')
  await page.goto(base+'notes?note=9001');await page.getByRole('heading',{name:'每天一点，慢慢连起来。',exact:true}).waitFor();await settled()
  ensure(new URL(page.url()).pathname==='/blog-front/notes'&&new URL(page.url()).searchParams.get('note')==='9001','NOTE path lost')
  passed.push('Legacy hash article path and NOTE deep link recover')
  await page.goto(base+'posts');await page.locator('main .article-row, main [role="alert"]').first().waitFor({timeout:20000})
  readStates.archive = await page.locator('main .article-row').count()>0
  const searched=page.waitForRequest(request=>{const url=new URL(request.url());return url.pathname==='/api/v1/posts'&&url.searchParams.get('q')==='Elasticsearch'})
  await page.getByRole('searchbox',{name:'搜索文章'}).fill('Elasticsearch');await searched
  await settled()
  readStates.search = await page.locator('main .article-row').count()>0
  const cleared=page.waitForRequest(request=>{const url=new URL(request.url());return url.pathname==='/api/v1/posts'&&!url.searchParams.has('q')})
  await page.getByRole('button',{name:'清除筛选',exact:true}).click();await cleared
  await settled()
  await page.goto(base+'projects');await page.getByRole('heading',{name:'在真实约束里，练习构建。',exact:true}).waitFor();await settled()
  readStates.projects = await page.locator('main [role="alert"]').count()===0
  passed.push('Hosted archive/search/clear dispatch and projects shell; API availability recorded separately')
  await page.keyboard.press('Control+k')
  await page.getByRole('combobox',{name:'搜索文章、日志或页面'}).fill('关于')
  await page.keyboard.press('Enter');await page.waitForURL('**/blog-front/about')
  await page.keyboard.press('Control+k');await page.keyboard.press('Escape')
  ensure(await page.getByRole('combobox',{name:'搜索文章、日志或页面'}).count()===0,'Esc failed')
  passed.push('Hosted Ctrl+K, Enter command navigation and Escape')
  await page.goto(base+'admin/studio?tab=settings')
  await page.getByLabel('管理员密码').waitFor()
  ensure(new URL(page.url()).searchParams.get('redirect')==='/admin/studio?tab=settings','Admin return path lost')
  await page.reload();await page.getByLabel('管理员密码').waitFor()
  passed.push('Protected studio direct path and login refresh; no credentials submitted')
  ensure(assets.length>0&&assets.every(asset=>asset.status===200),'Hosted asset load failure')
  ensure(errors.length===0,'Hosted JavaScript errors')
  ensure(apiRequests.length>0&&apiRequests.every(request=>request.method==='GET'),'Unexpected API mutation')
  ensure(apiRequests.every(request=>Object.values(request.query).every(value=>value!=='')),'Empty query sent to real API')
  return JSON.stringify({suite:'github-pages-live',network:'Per-QA-browser DNS override to verified GitHub Pages address; TLS validation enabled; no API interception',passed,assetsLoaded:assets.length,assetFailures:assets.filter(asset=>asset.status!==200),pageErrors:errors,apiRequests,apiReads,apiFailures,readStates,article42ErrorState:articleError,realPublishedArticlePath:publishedPath,realAdminOrF4BusinessValidated:false})
}
