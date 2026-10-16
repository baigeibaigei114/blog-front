async page=>{
  const ensure=(value,message)=>{if(!value)throw Error(message)};
  await page.goto('http://127.0.0.1:5173/blog-front/');await page.locator('.hero-pulse').waitFor();
  const original=await page.evaluate(()=>localStorage.getItem('devblog_mock_content_v1'));
  await page.evaluate(()=>{
    let rows=JSON.parse(localStorage.getItem('devblog_mock_content_v1'));
    if(!rows)throw Error('Run a mock admin operation first to initialize QA storage');
    const source=rows.find(p=>p.id==='42');
    for(let index=0;index<24;index++){
      const copy=JSON.parse(JSON.stringify(source));copy.id=String(20000+index);
      copy.revisions.forEach(r=>r.title='分页检查 '+index);
      rows.push(copy);
    }
    localStorage.setItem('devblog_mock_content_v1',JSON.stringify(rows));
  });
  await page.goto('http://127.0.0.1:5173/blog-front/posts?categorySlug=engineering&tag=vue&sort=oldest');
  await page.locator('.article-row').first().waitFor();
  ensure(await page.locator('.article-row').count()===10,'Pagination size wrong');
  await page.getByRole('button',{name:'下一页 →'}).click();
  await page.waitForURL('**/posts?**page=2');await page.locator('.article-row').first().waitFor();
  await page.locator('.article-row h3 a').nth(4).scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>scrollY);
  await page.locator('.article-row h3 a').nth(4).click();
  await page.locator('.prose table').waitFor();
  await page.getByRole('button',{name:'← 返回文章归档'}).click();
  await page.locator('.article-row').first().waitFor();
  await page.waitForFunction(y=>Math.abs(scrollY-y)<5,before);
  ensure(new URL(page.url()).searchParams.get('page')==='2','Page query lost');
  await page.evaluate(value=>localStorage.setItem('devblog_mock_content_v1',value),original);
  return JSON.stringify({suite:'list-pagination-scroll-mock',passed:['Combined filtering pagination, query and scroll restoration after detail back']});
}