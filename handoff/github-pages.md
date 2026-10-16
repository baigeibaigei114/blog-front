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

真实站点检查已发现并修复空可选查询参数问题：默认归档请求原来发送 q=，后端返回 400“q 需要 1–100 字符”；统一 API 层改为省略空字符串/null/undefined 查询参数，保留非空筛选、0 与 false。pages-query.js 在生产构建 HTTP 拦截夹具上通过 3 组检查：默认省略、非空组合保留、清除后省略；这与真实网络检查分开记录。

修复源码提交：1020309；最终静态发布提交：f95eccf669103ffa4c909f5272f3c35eb4c6dec0，入口 index-CevlVioG.js。[最终 GitHub Pages 运行](https://github.com/baigeibaigei114/blog-front/actions/runs/38922907393)的 build/deploy/report-build-status 全部 success。

Edge 的 pages-live.js 完成 9 组线上检查，没有拦截 API：

- 新生产入口、无 mock 标识，144 次静态资源响应全部 200，pageErrors 为空。
- 首页 390/768/1440px 与日夜主题通过，无页面横向溢出；代表性截图已查看。
- 导航、关于页直达/刷新、旧文章路由、query/hash 与 /#/posts/id 恢复通过。
- 真实公开文章 /posts/7 正文加载、刷新、390px 阅读目录抽屉及 Esc 通过。
- 真实首页、文章归档、Elasticsearch 搜索、清除筛选、日志列表、分类/标签及项目接口 GET 返回 200；默认归档和清除后的请求不再包含 q= 或其他空条件。日志查询的 verifiedOnly=false 正常保留。
- /posts/42 与 /notes/9001 在真实库返回 404，界面显示找不到内容；它们只用于检查缺失 ID 的路径恢复，未声称该内容存在。
- Ctrl+K、Enter 导航、Esc，以及工作台受保护路径/登录页刷新通过。没有填写真实口令或提交真实管理操作。

复测中公开 API 曾返回 Cloudflare 502 且缺少 CORS 头；应用显示真实错误，没有假数据。最终检查时服务已恢复，以上公开 GET 验证通过。机器结果完整保存在 github-pages-validation.json；其中一次 ERR_ABORTED 是切换查询/页面时取消的 GET。没有修改后端来处理此临时故障。

测试浏览器曾缓存前一版 HTML，出现页面间切换加载旧入口的现象；清理独立 QA profile 的浏览器缓存后复测新入口通过。用户若看到旧页面可先 Ctrl+F5 硬刷新。保留旧哈希静态资源可减少旧缓存页面的资源 404；不将浏览器缓存中的旧版本算作新版本验收结果。

上述公开只读接口已在本次线上复测连接成功；真实管理员登录、写入、收件箱和自动发布仍未验收。未做移动真机、Safari/Firefox、macOS、负载或服务端权限验收。接口失败仍显示真实错误，不提供生产 mock。

## 下次发布与停止

以后修改源码后需先 npm run build，通过 pages-build.mjs，再将生成的 docs 同步并提交到 frontend 分支后推送；只推 master 不会更新当前 Pages。保留 public/.nojekyll，不能手改 docs 里的 HTML/JS。发布提交通过临时、无脏改动的 Git worktree 操作，保留远程历史，没有强推。

本次结束已关闭 pages-local、pages-live 和 pages-live-mapped 测试浏览器，已停止本次启动的 4174 静态模拟服务，临时发布 worktree 已移除，没有保留新的本地预览服务。若自行运行上面的模拟服务，在启动终端 Ctrl+C 停止；若原终端不可用，先核对 4174 的 PID/CommandLine 确实是本仓库 preview-pages.mjs，再停止对应进程。

线上复查需先解决本机 DNS 拦截，或只对独立 QA 浏览器使用经过公共 DNS 核对的临时解析。该配置在被忽略的 output/pages-browser-config.json，未加入源码或生产资源；TLS 校验保持开启。pages-live.js 中的入口哈希针对本次发布，下一次构建后需按新产物更新断言。截图位于忽略目录 output/playwright/pages-live-*.png。

GitHub Pages 发布目录及 .nojekyll 行为依据：[GitHub 官方发布源文档](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。
