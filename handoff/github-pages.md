# GitHub Pages 发布与验证

日期：2026-10-16。用户本次已授权提交、推送及检查 Pages 部署；前两轮交接中“未提交/未部署”描述仍是各轮当时的历史状态。

## 发布结构

- 远程仓库：baigeibaigei114/blog-front；源码 master，静态发布分支 frontend，发布目录 /docs。保持既有分支方式，不切换 GitHub Actions 源码构建流程。
- Vite base 固定 /blog-front/；公开地址 https://baigeibaigei114.github.io/blog-front/ 。
- public/.nojekyll 在构建时复制到 docs/.nojekyll；根目录的 .nojekyll 不能替代发布目录里的标记。
- docs 是生成产物，仅构建后同步到 frontend 分支；master 忽略 docs。不能把含 /src/main.js 的源码 index.html 当作静态站点发布。
- .env.production 的本地内容/哈希保持不变，不提交。远程 master 已删除此文件；同步远程历史时保留删除，并用 .gitignore 防止重新跟踪。浏览器需要的 VITE 配置会编译到公共 JavaScript，不能在其中放秘密。
- 未修改后端、共享开发文档或原型。没有在真实服务写入或启用发布设置。

## 构建与本地检查

```powershell
Set-Location 'D:\MyProject\DevBlog\blog-frontend'
npm run build
node handoff/checks/pages-build.mjs
node handoff/preview-pages.mjs
# 另一个终端运行检查，结束后关闭该浏览器
npx --yes --package @playwright/cli playwright-cli -s=pages-local open http://127.0.0.1:4174/blog-front/ --browser msedge
npx --yes --package @playwright/cli playwright-cli -s=pages-local run-code --filename handoff/checks/pages-routing.js
npx --yes --package @playwright/cli playwright-cli -s=pages-local close
```

已执行 npm run build，成功；Pages 产物检查通过：docs/.nojekyll、404.html、/blog-front/ 资源前缀与入口引用存在，32 个生产 JS 文件不含开发 mock 特征标识。

本地静态服务器对深链接返回真正 HTTP 404，再使用生成的 404.html 恢复路径。Edge 检查 4 组通过：直达与刷新保留 path/query/hash、安全拒绝外部恢复目标、旧 /#/posts/id 兼容、日志与受保护工作台恢复。此脚本明确拦截 API 返回 404，不证明真实后端连通或文章存在。

## 发布与线上结果

首次发布提交 259af09，源于 master dd32d36；GitHub 运行 38921859818 的 build/deploy/report-build-status 全部 success。发布时保留旧哈希资源供缓存中的旧页面加载，新入口只引用本轮生产资源。

初次线上检查：Windows curl/Powershell TLS 验证失败，Edge 返回 ERR_CERT_AUTHORITY_INVALID。仅读取握手证书诊断后确认其 subject 为 blockpage.nextdns.io、issuer 为 NextDNS Blockpage Edge CA，实际到达本机 DNS 的拦截页，并非 GitHub 的证书。Google 公共 DNS 返回 185.199.108.153 等 GitHub Pages 地址；单次 curl --resolve 及独立 QA 浏览器的 host-resolver-rules 指定该地址后，保持 TLS 验证即可读取真实站点。未更改系统 DNS、代理或证书，默认 DNS 访问仍可能受 NextDNS 规则影响。

真实站点检查已发现并修复空可选查询参数问题：默认归档请求原来发送 q=，后端返回 400“q 需要 1–100 字符”；统一 API 层改为省略空字符串/null/undefined 查询参数，保留非空筛选、0 与 false。pages-query.js 在生产构建 HTTP 拦截夹具上通过 3 组检查：默认省略、非空组合保留、清除后省略；这与真实网络检查分开记录。修复后的发布与完整线上结果在本次执行结束前补充。

后端真实 v1 仍需单独联调；静态部署成功不能证明文章、登录、收件箱或自动发布业务可用。接口失败仍显示真实错误，不提供生产 mock。

GitHub Pages 发布目录及 .nojekyll 行为依据：[GitHub 官方发布源文档](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。
