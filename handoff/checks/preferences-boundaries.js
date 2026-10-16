async page => {
  const ensure=(value,message)=>{if(!value)throw Error(message)},passed=[];
  await page.goto('http://127.0.0.1:4173/blog-front/about');
  await page.locator('.about-copy').waitFor();
  await page.evaluate(()=>localStorage.setItem('devblog_theme','unexpected'));
  await page.reload();await page.locator('.about-copy').waitFor();
  ensure(await page.evaluate(()=>document.documentElement.dataset.theme)==='light','Unknown theme fallback');
  await page.getByRole('button',{name:'切换夜间主题'}).click();
  await page.reload();await page.locator('.about-copy').waitFor();
  ensure(await page.evaluate(()=>document.documentElement.dataset.theme==='dark'&&localStorage.getItem('devblog_theme')==='dark'),'Theme persistence');
  await page.emulateMedia({reducedMotion:'reduce'});
  ensure(await page.evaluate(()=>getComputedStyle(document.body).transitionDuration)==='0s','Reduced motion ignored');
  passed.push('Unknown theme fallback, toggle persistence and reduced motion');
  await page.goto('http://127.0.0.1:5173/blog-front/posts/42');
  await page.locator('.prose table').waitFor();
  const original=await page.evaluate(()=>localStorage.getItem('devblog_mock_content_v1'));
  await page.evaluate(()=>{
    const rows=JSON.parse(localStorage.getItem('devblog_mock_content_v1'));
    const post=rows.find(p=>p.id==='42');
    post.revisions.find(r=>r.revisionId===post.publishedRevisionId).title='很长的中文文章标题'.repeat(23).slice(0,200);
    localStorage.setItem('devblog_mock_content_v1',JSON.stringify(rows));
  });
  await page.reload();await page.locator('.prose table').waitFor();
  for(const width of [360,390,768,1440]){
    await page.setViewportSize({width,height:900});
    ensure(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Long title overflow '+width);
  }
  passed.push('200-character Chinese title and long URL/code/table containment');
  await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{value:()=>Promise.reject(new Error('fixture denied')),configurable:true}));
  await page.getByRole('button',{name:'复制原始代码'}).first().click();
  await page.getByText('复制失败，请选中代码手动复制',{exact:true}).first().waitFor();
  await page.keyboard.press('Control+k');const dialog=page.getByRole('dialog',{name:'搜索与命令'});
  await dialog.waitFor();
  const focusables=dialog.locator('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]');
  await focusables.last().focus();await page.keyboard.press('Tab');
  ensure(await page.evaluate(()=>document.activeElement.getAttribute('aria-label'))==='关闭弹窗','Focus did not wrap');
  await page.keyboard.press('Shift+Tab');
  ensure(await page.evaluate(()=>document.activeElement.closest('dialog')!==null),'Focus escaped');
  await page.keyboard.press('Escape');
  passed.push('Clipboard denial feedback and modal Tab/Shift-Tab loop');
  await page.evaluate(value=>{ if(value===null)localStorage.removeItem('devblog_mock_content_v1');else localStorage.setItem('devblog_mock_content_v1',value)},original);
  return JSON.stringify({suite:'preferences-and-boundaries',passed});
}