async page=>{
  const ensure=(value,message)=>{if(!value)throw Error(message)},failures=[],results=[],errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  const base='http://127.0.0.1:5173/blog-front'
  await page.goto(base+'/admin/studio?tab=inbox')
  if(await page.getByLabel('管理员密码').isVisible()){await page.getByLabel('管理员密码').fill('devblog-mock');await page.getByRole('button',{name:'登录工作台 ↗'}).click()}
  await page.getByRole('button',{name:'＋ 录入片段'}).waitFor()
  const original=await page.evaluate(()=>localStorage.getItem('devblog_mock_studio_v1'))
  const longTitle='很长的中文收件箱片段标题'.repeat(20).slice(0,200)
  await page.evaluate(title=>{
    const state=JSON.parse(localStorage.getItem('devblog_mock_studio_v1'))
    const item=state.captures.find(c=>c.id==='102')
    item.title=title
    item.body='## 目录标题\n\n<script>window.__studioInjected=1</script>\n\n'+('长中文内容与边界说明。'.repeat(100))+'\n\n~~~javascript\nconst example = "'+'long-code-'.repeat(80)+'";\n~~~\n\n|列一|列二|列三|列四|列五|列六|\n|---|---|---|---|---|---|\n|A|B|C|D|E|F|'
    item.verificationClaim='TESTED'
    const value=state.runs.find(r=>r.id==='501')
    value.status='FAILED';value.canRetry=false
    value.items=[{captureId:'999999999999999999',revisionId:'123456789012345678',status:'HELD',reasonCode:'VALIDATION_FAILED_'+'long_reason_'.repeat(30)}]
    localStorage.setItem('devblog_mock_studio_v1',JSON.stringify(state))
  },longTitle)
  for(const theme of ['light','dark']){
    await page.addInitScript(theme=>localStorage.setItem('devblog_theme',theme),theme)
    for(const width of [360,375,390,414,768,1024,1440]){
      await page.setViewportSize({width,height:900})
      for(const tab of ['inbox','runs','settings']){
        try{
          await page.goto(base+'/admin/studio?tab='+tab)
          await page.locator(tab==='settings'?'.settings-form':'.capture-row').first().waitFor()
          ensure(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflow')
          results.push({theme,width,view:tab})
          if(width===390||width===1440)await page.screenshot({path:'output/playwright/phase2-'+theme+'-'+width+'-'+tab+'.png'})
          if(tab==='inbox'){
            await page.getByRole('button',{name:'查看片段：'+longTitle}).click()
            const modal=page.getByRole('dialog',{name:'私有片段详情'})
            await modal.getByRole('button',{name:'安全预览',exact:true}).click()
            await modal.locator('.prose table').waitFor()
            ensure(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&!window.__studioInjected),'Editor overflow or unsafe HTML')
            ensure(await modal.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Dialog overflow')
            results.push({theme,width,view:'capture-preview'})
            if(width===390)await page.screenshot({path:'output/playwright/phase2-'+theme+'-'+width+'-capture-preview.png'})
            await modal.getByRole('button',{name:'关闭弹窗'}).click()
          }
          if(tab==='runs'){
            await page.getByRole('button',{name:'查看批次 501',exact:true}).click()
            await page.locator('.run-detail .studio-table').waitFor()
            ensure(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Run detail overflow')
            results.push({theme,width,view:'run-detail'})
          }
        }catch(error){failures.push({theme,width,tab,error:error.message.slice(0,250)})}
      }
    }
  }
  await page.evaluate(value=>localStorage.setItem('devblog_mock_studio_v1',value),original)
  return JSON.stringify({suite:'phase2-layout-mock',passed:results.length,failures,pageErrors:errors})
}