async page => {
  const ensure=(value,message)=>{if(!value)throw Error(message)},queries=[]
  const ok=data=>({code:200,message:'Query fixture',data,timestamp:Date.now()})
  await page.route('**/api/v1/**',async route=>{
    const request=route.request(),url=new URL(request.url())
    const headers={'access-control-allow-origin':'http://127.0.0.1:4174','access-control-allow-methods':'GET,OPTIONS','content-type':'application/json'}
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers})
    if(url.pathname.endsWith('/posts')){
      const query=Object.fromEntries(url.searchParams);queries.push(query)
      if(Object.values(query).some(value=>value===''))return route.fulfill({status:400,headers,body:JSON.stringify({code:400,message:'Empty optional query rejected'})})
      return route.fulfill({status:200,headers,body:JSON.stringify(ok({data:[],total:0,page:1,size:10,pages:0}))})
    }
    const data=url.pathname.endsWith('/categories')?[{id:'1',slug:'framework',name:'框架',publishedCount:1}]:url.pathname.endsWith('/tags')?[{id:'1',slug:'vue',name:'Vue',publishedCount:1}]:[]
    return route.fulfill({status:200,headers,body:JSON.stringify(ok(data))})
  })
  await page.goto('http://127.0.0.1:4174/blog-front/posts')
  await page.getByText('没有符合筛选条件的公开文章。',{exact:true}).waitFor()
  ensure(!('q' in queries.at(-1))&&!('categorySlug' in queries.at(-1))&&!('tag' in queries.at(-1)),'Default empty filters serialized')
  await page.getByRole('searchbox',{name:'搜索文章'}).fill('vue')
  await page.waitForURL('**q=vue**')
  await page.getByRole('combobox',{name:'分类',exact:true}).selectOption('framework')
  await page.waitForURL('**categorySlug=framework**')
  await page.getByRole('combobox',{name:'标签',exact:true}).selectOption('vue')
  await page.waitForURL('**tag=vue**')
  await page.waitForFunction(()=>!document.querySelector('main [role="status"]')?.textContent.includes('正在'))
  ensure(queries.some(query=>query.q==='vue'&&query.categorySlug==='framework'&&query.tag==='vue'),'Nonempty filters lost')
  await page.getByRole('button',{name:'清除筛选',exact:true}).click()
  await page.waitForURL('**/blog-front/posts')
  await page.getByText('没有符合筛选条件的公开文章。',{exact:true}).waitFor()
  ensure(!('q' in queries.at(-1))&&!('categorySlug' in queries.at(-1))&&!('tag' in queries.at(-1)),'Clear filters sent empty params')
  await page.unroute('**/api/v1/**')
  return JSON.stringify({suite:'production-query-fixture',passed:['Default optional filters omitted','Nonempty combined filters preserved','Clear filters omits optional keys'],queries,realBackendValidated:false})
}
