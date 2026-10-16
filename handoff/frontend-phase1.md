# DevBlog 前端 Phase 1 交接

日期：2026-10-15（Asia/Shanghai）。范围仅为 F1、F2、F3；本轮到此停止。只修改 blog-frontend，没有部署、提交、推送或创建 PR。共享开发资料、原型、后端及 Obsidian 由协调方维护，本轮未改动。

## 工作包状态

| 工作包 | 已实现 | 未完成的验收条件 |
| --- | --- | --- |
| F1 | 最新原型的纸墨配色、衬线标题、等高线视觉、Header/Footer、主题、导航、900/650px 响应式布局 | 已通过本机 Edge 双主题多宽度检查；未验证其他浏览器或真实部署 |
| F2 | 首页、文章列表/详情、日志、项目、关于、分类/标签历史入口；目录、进度、复制、过滤、分页与空错态 | 真实 v1 读取尚未接通，不能标记 F2 整体验收通过 |
| F3 | 文章与日志搜索、命令面板、会话验证、编辑/预览、草稿/发布/撤回/删除、版本预览、工作台外壳 | 真实管理员会话、草稿隔离、发布/撤回及持久化仍需 B3 联调，不能标记 F3 整体验收通过 |
| F4、C、A、R | 未实施；收件箱、运行记录、设置页面显示“尚未接入” | 不提供导入、保存设置、立即整理、自动发布或虚假的成功提示 |

### 页面与组件

- `src/styles/{tokens,layout,typography}.css`：按最新原型拆出色值、字体、页面与阅读样式。保留原型 token；增加夜间文字色 `--green-text`，改善小字号文字对比度。手机导航分为品牌工具行和导航行，确保 360px 可操作。没有使用全局横向隐藏掩盖溢出。
- `src/components/layout`、`visual/ContourVisual.vue`：全站 Header/Footer、主题入口、SVG 等高线。
- `content/{ArticleCard,VerificationBadge,MarkdownRenderer,CodeBlock,NoteEntry}.vue`：文章、来源与验证标识、统一安全正文、代码和日志展开。
- `reading/ArticleToc.vue` 与 `views/PostDetail.vue`：h2/h3 目录、稳定重复锚点、正文位置进度、平板/手机阅读条、移动目录抽屉。进度不计关联文章和页脚。
- `search/{CommandPalette,HighlightText}.vue`：Ctrl/Cmd+K、250ms 防抖、取消旧请求、请求序号隔离、↑↓/Enter/Esc、文章/日志类型、文本片段高亮。普通访客只见公开命令，管理员提供内容管理入口。未接入的工作台操作没有执行命令。
- `common`：统一加载/空/错/权限/404、分页、原生 dialog 焦点圈定、焦点归还、Esc 与滚动锁。
- `views/{Home,Posts,PostDetail,Notes,Projects,About,Taxonomy,NotFound}.vue`：公开页面；文章联合筛选写入 query；列表分页、返回 query 和滚动恢复；日志按 journalDate 分组，组合主题/TESTED 过滤，单条链接可跨页定位。
- 日志关键词搜索使用正式 `/search?kind=NOTE`。该接口没有 topic/verifiedOnly 参数，因此搜索时明确说明只按关键词匹配；清除关键词恢复日志筛选，不伪造联合搜索参数。
- `views/admin`：真实请求适配下的登录、管理列表、ARTICLE/NOTE 编辑、独立保存草稿与发布/撤回、软删除、版本分页/安全预览、409 输入保留、401 原地重新登录、未保存离开与刷新提示。发布只允许已保存版本；普通写入不设置 TESTED。
- 编辑器采用 Markdown textarea + 同一个安全预览组件。没有启用 md-editor-v3 的独立 HTML 预览或外部图片上传；依赖清单保留原状，编辑页按路由懒加载。附件上传、验证记录写入、分类/标签/项目写管理没有新增 UI。
- `api/index.js`、`composables/useResource.js`、Pinia stores：v1 请求、嵌套分页、错误、取消与会话；移除旧 ES 搜索/重建入口和“有 token 即登录”的逻辑。
- `config/site.js`：关于/作者的本地说明，不复制原型中未经核对的履历、链接或技术结论。
- 删除已由新组件替代的旧 PostCard、PhysicsCanvas、Categories/Tags 页面实现及 base/components 样式；旧 URL 仍由 Taxonomy 接管。
- `index.html`、`public/404.html`：主题首屏初始化、Pages 恢复、兼容旧 `/#/posts/:id` 回退链接；保留 pathname/query/hash，限制同源 `/blog-front/`。构建目录只由 Vite 生成。

## API 接入状态

**已成功连接并验证的真实接口：无。** 已编写下列真实 v1 请求；生产预览实际尝试 GET `/api/v1/public/home`，浏览器发生网络/CORS 层失败，页面显示错误、没有样例回退。没有在真实服务上执行管理员登录或内容写入。其他真实端点未验证，不能据 mock 结果认定已经可用。

`VITE_API_BASE_URL` 只读取不修改：尾部 `/api` 自动补 `/v1`，已有 `/api/v1` 保留，未配置则同源 `/api/v1`。管理请求才附管理员 Bearer；公开读取不携带管理员凭据。受管公开附件 `/api/v1/assets/{id}` 解析到同一 API 配置的公开资源路径。

| 接口 | 前端实现与开发验证 |
| --- | --- |
| GET /public/home | 首页/公开统计；开发 mock 已检查，真实请求失败 |
| GET /posts、/posts/{id} | 联合筛选、排序、分页、正文、404、关联文章；开发 mock 已检查，真实未验证 |
| GET /notes、/notes/{id} | 日期分组、topic/verifiedOnly、展开、跨页 note 定位；开发 mock 已检查，真实未验证 |
| GET /search | ALL/ARTICLE/NOTE、分页摘要、晚响应隔离；开发 mock 与 HTTP 夹具已检查，真实未验证 |
| GET /categories、/tags、/projects | 筛选与公开项目；开发 mock 已检查，真实未验证 |
| POST /auth/login、GET /auth/me、POST /auth/logout | accessToken/tokenType/expiresAt；服务端 me 校验、过期处理、安全站内返回。登录/me 已用开发 mock 与 HTTP 夹具检查；真实未验证，注销撤销需要服务端联调 |
| GET /admin/posts、/admin/posts/{id} | 管理列表、双版本指针、draft/published 聚合；开发 mock 已检查，真实未验证 |
| POST /admin/posts | 新建 DRAFT，Idempotency-Key；开发 mock 与 HTTP 503 重试夹具已检查 |
| PUT /admin/posts/{id}/draft | ContentWrite + expectedVersion；保存不发布；开发 mock、HTTP 409/401 已检查 |
| POST /admin/posts/{id}/publish | revisionId + expectedVersion + Idempotency-Key；开发 mock 已检查 |
| POST /admin/posts/{id}/withdraw | expectedVersion；开发 mock 已检查 |
| DELETE /admin/posts/{id} | query expectedVersion；开发 mock 已检查 |
| GET /admin/posts/{id}/revisions、/{revisionId} | 版本分页及安全正文预览；开发 mock 已检查，真实未验证 |

以上路径均相对 `/api/v1`。没有调用 captures、runs、publishing-settings 或旧写接口。管理聚合字段曾对照只读后端 `ContentCommandService.detail` 的 `draft/draftRevisionId/publishedRevisionId/version`，没有自行发明状态。

管理员会话保存在当前标签页的 sessionStorage，真实与 mock 使用不同键；旧 token 不复用。401 清理登录状态但保留当前编辑输入，允许原地重新登录。创建/发布同一正文失败后显式重试复用幂等 key；不自动重试写请求。跨刷新后的请求不承诺复用内存中的 key。

### 显式开发 mock

仅 `import.meta.env.DEV && VITE_DEV_MOCK === 'true'` 时动态载入 `src/api/mock.js`。页面顶栏始终显示 MOCK 提示；内容带“开发样本”说明，成功反馈带“开发 mock”前缀。没有在请求失败时切换到 mock。

夹具用于长正文、HTML/危险 URL、重复标题、代码、表格、过滤和管理版本测试；不是原型业务样例。仅写浏览器 localStorage 的 `devblog_mock_content_v1`。开发登录密码 `devblog-mock` 是公开的本机测试输入，与真实凭据无关。

生产构建即使传入 `VITE_DEV_MOCK=true` 也不启用 mock。本轮构建与产物扫描确认无 mock 模块/夹具标识。

## 安全与状态边界

Markdown-it 关闭原始 HTML。正文解析为明确允许的 Vue 节点；代码高亮仅接受高亮器的 span 类与文本，未使用 v-html/innerHTML。链接限制协议，拒绝带凭据/危险协议 URL；外链加 noopener/noreferrer。搜索高亮按文本片段渲染。公开徽章只读取 verification.status/summary，不推断 TESTED 或“人工核校”。

前端无法代替后端证明公开版本/附件权限、事务、会话撤销、幂等和数据库一致性。mock 的本地版本隔离只是交互夹具。重新发布、撤回、删除的实际可见性需要在真实 B1/B3 环境复核。

## 实际验证结果

环境：Node 22.19.0、npm 10.9.3、锁文件安装的 Vite 8.0.1；Microsoft Edge（Playwright CLI，无真实手机）。`npm ci --no-audit --no-fund` 成功，package.json/package-lock.json 没有变更。没有进行依赖安全审计。

| 验证 | 结果与证据边界 |
| --- | --- |
| 生产构建 | `npm run build` 成功；额外显式设置 VITE_DEV_MOCK=true 的生产构建也成功，产物扫描 mock 标识为 0。输出 docs；不是部署 |
| 公开页面矩阵 | 360/375/390/414/768/1024/1440px × 日/夜 × 首页、文章列表、详情、日志、项目、关于、分类、标签，共 112 组。均检查内容加载、主题与横向溢出；不使用 body overflow-x:hidden |
| 阅读与安全 | 长正文、超长 URL、超宽代码、无语言代码、大表格、重复标题、HTML/危险链接不执行、外链安全属性、原始代码复制检查通过。Windows 剪贴板 CRLF 归一化后内容一致且无行号；复制拒绝有明确反馈 |
| 阅读工具 | 目录点击与中文 hash 刷新、移动抽屉 Esc/焦点返回/背景锁、进度 100% 不包含页脚通过 |
| 搜索与键盘 | Ctrl+K、↑↓、Enter、Esc，文章/日志类型与标题摘要高亮，Tab/Shift+Tab 圈定通过。Cmd+K 使用同一分支，未在 macOS 实机检查 |
| 列表与日志 | 联合筛选、分页、后退 query/滚动恢复、无结果、404、主题+TESTED、NOTE 搜索、跨页单条展开通过（开发 mock） |
| 管理 | 登录错误/会话验证/站内返回、草稿 404、发布、再存草稿不改公开版、双页 409、撤回、NOTE 日期/主题、版本预览、软删除、未保存离开单次提示通过（开发 mock） |
| HTTP 适配夹具 | 在生产构建上拦截 API，检查 500+requestId/重试、真实空态、晚搜索响应、外部 redirect 拒绝、503 保留输入/创建重试同 key、409 expectedVersion、401 保留输入。不是后端验收 |
| 静态 Pages 模拟 | 本地静态服务器用真正 HTTP404 返回生成的 404.html；文章/日志/工作台直达、刷新、query/hash、旧回退链接、安全恢复检查通过。未部署 GitHub Pages，线上状态码/SEO 未验证 |
| 主题与边界 | 未知值回退 light、主题切换刷新持久化、减少动画偏好、长中文标题、管理员编辑页双主题七宽度检查通过 |
| 真实 API | 首页请求网络/CORS 失败，其他真实接口未验证；没有真实写入，没有联调验收通过 |

格式化后曾出现三处多语句模板事件编译错误，已改成具名函数并重新构建；中文目录曾出现重复 URL 编码，已修复并复测。最终检查以修复后的结果为准。

可重跑脚本在 `handoff/checks/`；概要机器记录在 `validation-results.json`。浏览器截图在忽略目录 `output/playwright/`，包含日夜首页、桌面/手机文章、日志、命令面板、编辑页和 401 输入保留。检查中已查看代表性截图，不将所有断点的机器断言等同于人工逐像素验收。没有运行 Safari/Firefox、移动真机、真实后端、附件访问控制、负载或线上部署检查。

## 后端联调阻塞

1. 提供可从前端 Origin 访问的真实 v1 基址，确认 TLS、CORS（含 Authorization、Content-Type、Idempotency-Key 和 OPTIONS）及本地开发 Origin。当前只能确认浏览器网络/CORS 失败，不能据此认定后端代码未完成。
2. 在隔离环境用真实会话完成 B3 登录/me/注销、草稿隔离、版本冲突、发布/撤回/删除、幂等超时重放和历史公开 ID 回归。
3. 用已核对公开内容验证首页统计、分类/标签 slug、NOTE topics/journalDate、项目字段、公开验证说明及受管附件路径，确认没有私有数据泄漏。
4. 真实 GitHub Pages 发布后由协调方检查直达、刷新、缓存和资产路径。404 恢复不承诺所有深链接正常 SEO 状态码。
5. 本轮没有验证记录维护和附件上传 UI；已有公开内容的验证/附件依赖服务端 DTO 与受管资源路径。

## 本地运行与停止

在前端目录中使用现有 npm：

```powershell
Set-Location 'D:\MyProject\DevBlog\blog-frontend'
npm ci
# 默认真实接口；按需仅在 .env.development.local 配置非秘密的 VITE_API_BASE_URL
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

显式 mock 预览（不要修改 .env.production）：

```powershell
$env:VITE_DEV_MOCK = 'true'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
# 退出服务后清理当前 PowerShell 的开关
Remove-Item Env:VITE_DEV_MOCK -ErrorAction SilentlyContinue
```

访问 `http://127.0.0.1:5173/blog-front/`；文章夹具 `posts/42`，日志 `notes`，后台 `admin/login`。mock 内容只属于该浏览器 Origin；清空该键可重置测试内容。

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
# 需要模拟 Pages 的 404 恢复时，另一个终端运行：
node handoff/preview-pages.mjs
```

生产预览 `http://127.0.0.1:4173/blog-front/`；静态 Pages 模拟端口 4174。它们默认走真实 API；本轮使用浏览器路由夹具时会明确记录，不能用于证明后端可用。

本轮最终保留的服务状态见下方“交付时服务状态”。在启动终端按 Ctrl+C 停止服务；如果原终端不可用，先核对端口 PID/命令来源，再停止该任务启动的进程，不能终止未知进程。无需全局安装 Playwright，复查示例：

```powershell
npx --yes --package @playwright/cli playwright-cli -s=devblog open http://127.0.0.1:5173/blog-front/ --browser msedge
npx --yes --package @playwright/cli playwright-cli -s=devblog run-code --filename handoff/checks/reading-search.js
```

`layout-light.js/layout-dark.js` 分别检查七宽度；`admin-mock.js` 检查写流程；`admin-note-delete.js` 要求当前 QA 标签页先通过 mock 登录；`http-adapter.js` 和 `production-read.js` 使用生产预览；`pages-routing.js` 使用 4174。HTTP 夹具与真实读取应分开运行、分开记录。`list-scroll.js` 临时增加分页夹具并恢复；浏览器脚本中断时，可清除 mock 内容键重新开始。

## 保留与交付

- 起始唯一已有 tracked 改动是 .env.production；交付前 SHA-256 与开始一致，未输出其中配置值。
- 保留 Vue 3、Router、Pinia、Vite、npm 与现有依赖/锁文件。新增 .gitignore 忽略依赖、生成目录、临时浏览器输出与本地环境覆盖。
- 没有修改后端、原型、共享开发文档或 Obsidian。没有手工修改 docs 产物。
- 没有扩展 F4/收件箱/自动发布，没有部署、提交、推送或 PR。

### 交付时服务状态

5173 显式 mock 开发服务仍在运行，本次核对的 node PID 为 111256，访问 http://127.0.0.1:5173/blog-front/。在原启动终端 Ctrl+C 可停止；若使用其他终端，先通过 Get-NetTCPConnection -State Listen -LocalPort 5173 核对 OwningProcess，并确认 node 的 CommandLine 是本仓库的 Vite 开发命令，再 Stop-Process -Id 111256。PID 仅表示交付时快照，进程重启后需重新核对。4173 生产预览及 4174 Pages 模拟服务均已停止；本轮 Playwright QA 浏览器也已关闭。
