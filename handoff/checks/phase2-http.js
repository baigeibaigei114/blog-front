async page=>{
  const ensure=(value,message)=>{if(!value)throw Error(message)},passed=[],calls=[]
  const base='http://127.0.0.1:4173/blog-front'
  const ok=data=>({code:200,message:'HTTP STUDIO FIXTURE',data,timestamp:Date.now()})
  const paging=data=>({data,total:data.length,page:1,size:10,pages:data.length?1:0})
  let captureVersion=1,captureFailure=0,importFailure=true,settingsFailure=0,settingsVersion=1,runFailure=false,runReads=0,runMode='RUNNING',startFailure=true,runAttempt=1,retryConflict=true
  let captureBody={externalId:'http-private-101',source:'MANUAL',title:'HTTP 私有片段',summary:'私有摘要',body:'## HTTP 正文\n\n安全正文。',topic:'backend',sourceUrl:null,verificationClaim:'UNVERIFIED',evidenceRefs:[]}
  let setting={enabled:true,localTime:'22:30',timezone:'Asia/Shanghai',failurePolicy:'SKIP_ITEM',maxPostsPerDay:1,nextDueAt:null,version:1}
  const importKeys=[],importIds=[],startKeys=[]
  const run=()=>({id:'601',businessDate:'2026-10-16',status:runMode,attempt:runAttempt,scheduledFor:null,cutoffAt:null,startedAt:null,finishedAt:null,counts:{candidate:1,publishedCapture:0,held:0,output:0},outputs:[],items:[],errorCode:null,canRetry:runMode==='FAILED'})
  await page.route('**/api/v1/**',async route=>{
    const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/^.*\/api\/v1/,'')
    const method=request.method(),body=request.postDataJSON()
    const headers={'access-control-allow-origin':'http://127.0.0.1:4173','access-control-allow-headers':'authorization,content-type,idempotency-key','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','access-control-expose-headers':'Retry-After','content-type':'application/json'}
    const reply=async(status,data,extra={})=>{try{await route.fulfill({status,headers:{...headers,...extra},body:JSON.stringify(data)})}catch{}}
    if(method==='OPTIONS')return route.fulfill({status:204,headers})
    calls.push({method,path})
    if(path==='/auth/login')return reply(200,ok({accessToken:'http-studio-session',tokenType:'Bearer',expiresAt:new Date(Date.now()+3600000).toISOString()}))
    if(path==='/auth/me')return reply(200,ok({role:'ADMIN',expiresAt:new Date(Date.now()+3600000).toISOString()}))
    if(path==='/admin/captures/stats')return reply(200,ok({total:2,received:0,ready:2,held:0,included:0}))
    if(path==='/admin/captures')return reply(200,ok(paging([{id:'101',title:captureBody.title,summary:'私有摘要',source:'MANUAL',status:'READY',version:captureVersion},{id:'102',title:'HTTP 晚返回片段',summary:'用于取消旧详情',source:'CODEX',status:'READY',version:1}])))
    if(path==='/admin/captures/102'){await new Promise(resolve=>setTimeout(resolve,1000));return reply(200,ok({...captureBody,id:'102',externalId:'http-private-102',source:'CODEX',title:'HTTP 晚返回片段',status:'READY',version:1,validationErrors:[]}))}
    if(path==='/admin/captures/101'&&method==='GET')return reply(200,ok({...captureBody,id:'101',status:'READY',version:captureVersion,validationErrors:[]}))
    if(path==='/admin/captures/101'&&method==='PUT'){
      ensure(!('source'in body)&&!('externalId'in body)&&body.expectedVersion===captureVersion,'Mutable capture payload violated')
      if(captureFailure===409)return reply(409,{code:409,message:'HTTP capture conflict',errorCode:'VERSION_CONFLICT',data:{currentVersion:captureVersion+1}})
      if(captureFailure===401){captureFailure=0;return reply(401,{code:401,message:'HTTP capture expired',errorCode:'TOKEN_EXPIRED'})}
      if(captureFailure===429){captureFailure=0;return reply(429,{code:429,message:'HTTP capture rate limit',errorCode:'RATE_LIMITED'},{'retry-after':'1'})}
      captureBody={...captureBody,...body};captureVersion++
      return reply(200,ok({id:'101',status:'READY',version:captureVersion,validationErrors:[]}))
    }
    if(path==='/captures'){
      ensure(method==='POST'&&request.headers()['idempotency-key'],'Import missing key')
      importKeys.push(request.headers()['idempotency-key']);importIds.push(body.externalId)
      if(importFailure){importFailure=false;return reply(503,{code:503,message:'HTTP import retry',errorCode:'DEPENDENCY_UNAVAILABLE'})}
      return reply(200,ok({id:'109',status:'HELD',version:1,duplicate:false,validationErrors:['HTTP fixture remains private']}))
    }
    if(path==='/admin/publishing-settings'&&method==='GET')return reply(200,ok(setting))
    if(path==='/admin/publishing-settings'&&method==='PUT'){
      ensure(body.expectedVersion===settingsVersion&&!('nextDueAt'in body),'Invalid settings payload')
      if(settingsFailure===409)return reply(409,{code:409,message:'HTTP settings conflict',errorCode:'VERSION_CONFLICT',data:{currentVersion:settingsVersion+1}})
      if(settingsFailure===502)return reply(200,ok({version:settingsVersion+1,enabled:true}))
      setting={enabled:body.enabled,localTime:body.localTime,timezone:body.timezone,failurePolicy:body.failurePolicy,maxPostsPerDay:body.maxPostsPerDay,nextDueAt:null,version:++settingsVersion}
      return reply(200,ok(setting))
    }
    if(path==='/admin/runs'&&method==='GET')return reply(200,ok(paging([run()])))
    if(path==='/admin/runs'&&method==='POST'){
      startKeys.push(request.headers()['idempotency-key'])
      ensure(/^\d{4}-\d{2}-\d{2}$/.test(body.businessDate),'Invalid businessDate')
      if(startFailure){startFailure=false;return reply(503,{code:503,message:'HTTP start retry',errorCode:'DEPENDENCY_UNAVAILABLE'})}
      return reply(202,{...ok(run()),code:202})
    }
    if(path==='/admin/runs/601/retry'){
      ensure(body.expectedAttempt===runAttempt&&request.headers()['idempotency-key'],'Retry attempt or key missing')
      if(retryConflict){retryConflict=false;runAttempt++;return reply(409,{code:409,message:'HTTP retry conflict',errorCode:'VERSION_CONFLICT'})}
      runAttempt++;runMode='RUNNING';return reply(202,{...ok(run()),code:202})
    }
    if(path==='/admin/runs/601'){
      runReads++
      if(runFailure&&runReads>=2)return reply(500,{code:500,message:'HTTP poll failed',errorCode:'INTERNAL_ERROR',requestId:'studio-poll-500'})
      return reply(200,ok(run()))
    }
    return reply(404,{code:404,message:'HTTP unconnected fixture',errorCode:'CONTENT_NOT_FOUND'})
  })
  await page.goto(base+'/about')
  await page.evaluate(()=>sessionStorage.removeItem('devblog_admin_v1'))
  await page.goto(base+'/admin/login')
  await page.getByLabel('管理员密码').fill('http-studio-fixture')
  await page.getByRole('button',{name:'登录工作台 ↗'}).click()
  await page.waitForURL('**/admin/posts')
  await page.goto(base+'/admin/studio?tab=inbox')
  await page.getByRole('button',{name:'＋ 录入片段'}).click()
  let editor=page.getByRole('dialog',{name:'录入学习片段'})
  await editor.getByLabel('片段标题').fill('HTTP 重试片段')
  await editor.getByLabel('片段正文').fill('## 重试正文\n\n保留输入和投递编号。')
  await editor.getByRole('button',{name:'投递到私有收件箱'}).click()
  await editor.getByText('HTTP import retry',{exact:true}).waitFor()
  ensure(await editor.getByLabel('片段标题').inputValue()==='HTTP 重试片段','Import failure lost input')
  await editor.getByRole('button',{name:'投递到私有收件箱'}).click()
  await editor.getByText(/片段已保存到私有收件箱/).waitFor()
  ensure(importKeys.length===2&&importKeys[0]===importKeys[1]&&importIds[0]===importIds[1],'Import retries lost idempotency/externalId')
  ensure((await editor.innerText()).includes('HELD')&&!(await editor.innerText()).includes('发布成功'),'HELD reported as published')
  await editor.getByRole('button',{name:'完成',exact:true}).click()
  passed.push('HTTP503 import retains input, Idempotency-Key and externalId; HELD is private')
  await page.getByRole('button',{name:'查看片段：HTTP 私有片段'}).click()
  editor=page.getByRole('dialog',{name:'私有片段详情'})
  await editor.getByLabel('片段摘要').fill('冲突待保留摘要')
  captureFailure=409
  await editor.getByRole('button',{name:'保存私有片段'}).click()
  await editor.getByText('HTTP capture conflict',{exact:true}).waitFor()
  ensure(await editor.getByLabel('片段摘要').inputValue()==='冲突待保留摘要','409 input lost')
  captureFailure=0
  await page.evaluate(()=>window.confirm=()=>true)
  await editor.getByRole('button',{name:'重新读取服务端版本'}).click()
  await editor.getByLabel('片段摘要').fill('401 待保留摘要')
  captureFailure=401
  await editor.getByRole('button',{name:'保存私有片段'}).click()
  await editor.getByText('HTTP capture expired',{exact:true}).waitFor()
  ensure(await editor.getByLabel('片段摘要').inputValue()==='401 待保留摘要','401 input lost')
  await editor.getByLabel('重新登录以保留输入').fill('http-studio-fixture')
  await editor.getByRole('button',{name:'恢复会话'}).click()
  await editor.getByText('会话已恢复。输入保留，请重新执行操作。',{exact:true}).waitFor()
  captureFailure=429
  await editor.getByRole('button',{name:'保存私有片段'}).click()
  await editor.getByText('HTTP capture rate limit',{exact:true}).waitFor()
  const puts=calls.filter(c=>c.path==='/admin/captures/101'&&c.method==='PUT').length
  await editor.getByRole('button',{name:'保存私有片段'}).click()
  ensure(calls.filter(c=>c.path==='/admin/captures/101'&&c.method==='PUT').length===puts,'Ignored Retry-After')
  await page.waitForTimeout(1100)
  await editor.getByRole('button',{name:'保存私有片段'}).click()
  await editor.getByText(/当前状态：READY/).waitFor()
  await editor.getByRole('button',{name:'关闭弹窗'}).click()
  passed.push('PUT only editable fields + expectedVersion; 409/401 retain input, inline reauth, Retry-After')
  await page.getByRole('button',{name:'查看片段：HTTP 晚返回片段'}).click()
  await page.getByRole('dialog',{name:'私有片段详情'}).getByRole('button',{name:'关闭弹窗'}).click()
  await page.getByRole('button',{name:'查看片段：HTTP 私有片段'}).click()
  editor=page.getByRole('dialog',{name:'私有片段详情'})
  await editor.getByLabel('片段标题').waitFor()
  await page.waitForTimeout(1100)
  ensure(await editor.getByLabel('片段标题').inputValue()==='HTTP 私有片段','Late capture response replaced newer selection')
  await editor.getByRole('button',{name:'关闭弹窗'}).click()
  passed.push('Closed detail request cancels and cannot overwrite newer capture')
  await page.getByRole('link',{name:'发布设置',exact:true}).click()
  await page.getByLabel('每日整理时间').waitFor()
  await page.getByLabel('每日整理时间').fill('23:10')
  settingsFailure=409
  await page.getByRole('button',{name:'保存发布设置'}).click()
  await page.getByText('HTTP settings conflict',{exact:true}).waitFor()
  ensure(await page.getByLabel('每日整理时间').inputValue()==='23:10','Settings409 lost input')
  settingsFailure=0
  await page.getByRole('button',{name:'重新读取服务端版本'}).click()
  await page.getByLabel('每日整理时间').fill('23:20')
  settingsFailure=502
  await page.getByRole('button',{name:'保存发布设置'}).click()
  await page.getByText('设置响应缺少完整契约字段，请重新读取服务端版本核对',{exact:true}).waitFor()
  ensure(await page.getByLabel('每日整理时间').inputValue()==='23:20'&&!(await page.locator('main').innerText()).includes('发布设置已由接口保存'),'Incomplete settings reported success')
  settingsFailure=0
  await page.getByRole('button',{name:'保存发布设置'}).click()
  await page.getByText('发布设置已由接口保存。',{exact:true}).waitFor()
  passed.push('Settings expectedVersion and no nextDueAt writes; conflict/incomplete reply retain input without success')
  await page.getByRole('link',{name:'发布记录',exact:true}).click()
  runMode='SUCCEEDED'
  await page.getByRole('button',{name:'刷新记录',exact:true}).click()
  await page.getByRole('button',{name:'立即整理',exact:true}).click()
  const confirmation=page.getByRole('dialog',{name:'立即整理当天片段'})
  await confirmation.getByRole('button',{name:'确认提交整理'}).click()
  await confirmation.getByText('HTTP start retry',{exact:true}).waitFor()
  runMode='RUNNING';runFailure=true;runReads=0
  await confirmation.getByRole('button',{name:'确认提交整理'}).click()
  await page.locator('.run-detail').waitFor()
  ensure(startKeys.length===2&&startKeys[0]===startKeys[1],'Start retry key changed')
  await page.locator('.run-detail').getByText('HTTP poll failed',{exact:true}).waitFor({timeout:10000})
  const stopped=runReads
  await page.waitForTimeout(3500)
  ensure(runReads===stopped,'Failed polling kept retrying')
  runFailure=false;runMode='SUCCEEDED'
  await page.getByRole('button',{name:'刷新运行状态',exact:true}).click()
  await page.locator('.run-detail').getByText('已到终态，轮询已停止。',{exact:true}).waitFor()
  const terminalCount=runReads;await page.waitForTimeout(3300)
  ensure(runReads===terminalCount,'Terminal kept polling')
  runMode='RUNNING'
  await page.getByRole('button',{name:'刷新运行状态',exact:true}).click()
  await page.locator('.run-detail').getByText('每 3 秒读取服务端状态，离开页面停止。',{exact:true}).waitFor()
  await page.getByRole('link',{name:'学习收件箱',exact:true}).click()
  const left=runReads;await page.waitForTimeout(3300)
  ensure(runReads===left,'Leaving studio did not cancel polling')
  passed.push('Run503 key reuse, 202 detail, poll500 stops, terminal stops and tab leave cancels')
  runMode='FAILED'
  await page.getByRole('link',{name:'发布记录',exact:true}).click()
  await page.getByRole('button',{name:'查看批次 601',exact:true}).click()
  await page.getByRole('button',{name:'重试失败批次',exact:true}).click()
  await page.getByRole('dialog',{name:'重试失败批次'}).getByRole('button',{name:'确认重试'}).click()
  await page.getByText('HTTP retry conflict',{exact:true}).waitFor()
  ensure(await page.getByRole('button',{name:'重试失败批次',exact:true}).isDisabled(),'Conflict did not block stale retry')
  await page.getByRole('button',{name:'刷新运行状态',exact:true}).click()
  await page.getByRole('button',{name:'重试失败批次',exact:true}).click()
  await page.getByRole('dialog',{name:'重试失败批次'}).getByRole('button',{name:'确认重试'}).click()
  await page.locator('.run-detail span.mini').filter({hasText:'attempt 3'}).waitFor()
  await page.getByRole('link',{name:'学习收件箱',exact:true}).click()
  passed.push('Retry409 visible outside confirmation; refresh updates expectedAttempt and reenables retry')
  await page.unroute('**/api/v1/**')
  return JSON.stringify({suite:'phase2-production-http-fixtures',passed,realBackendValidated:false})
}
