# DevBlog 前端 Phase 2 交接

日期：2026-10-16。范围：下一轮 F4 前端（学习收件箱、发布运行记录/详情/重试、发布设置）。延续最新 prototype.html 的视觉基线与正式 v1 契约，没有重新设计。F1–F3 的历史交付见 frontend-phase1.md。

## 完成与未完成

完成前端实现与夹具验证：

- 收件箱：状态/来源/日期筛选、URL query 与分页、同日期范围统计、手工录入、详情编辑与安全 Markdown 预览、暂缓/恢复/删除、只读 INCLUDED 条目。
- 录入使用外部 ID 和 Idempotency-Key；不确定失败时保留输入与重试键。source/externalId 创建后只读；更新提交 expectedVersion；409 保留编辑内容，明确刷新才丢弃。401 可在原位重新登录，429 在浏览器可读取 Retry-After 时等待。片段保存回执明确是私有入箱，不代表公开发布。
- 工具验证声明与公开 verification 分开呈现；TESTED 声明显示“工具声称实测（仍需核验）”，不会自动赋予公开 TESTED 徽章。证据引用仅作为私有文本展示，不作为可信 HTML 或任意跳转。
- 发布记录：状态/日期筛选、分页、运行详情、条目结果/原因/输出链接、手动触发确认与 FAILED 批次重试确认。按服务端时区计算 businessDate；接受 200/202 后展示返回的运行。只有 PENDING/RUNNING 轮询，串行间隔 3 秒，终态/失败/离开/隐藏页面停止；错误后手动刷新，不自动重试发布。
- 发布设置：先读取真实设置再允许操作，编辑 enabled/localTime/timezone/failurePolicy/maxPostsPerDay；服务端 version 用作 expectedVersion，nextDueAt 只读。启用需要确认；接口失败或响应不完整保留输入，不能显示保存成功。
- 未保存保护覆盖片段关闭、Esc、路由切换、设置页签及 beforeunload；提交中阻止重复操作；取消旧详情请求，防止晚响应覆盖当前条目。
- 管理员命令面板入口、键盘导航与弹窗焦点管理；登出后移除管理员命令。未知工作台 tab 回到 inbox。日夜主题及手机/平板/桌面布局延续上一轮。

未完成/不可验收：真实 C1/A1 接口、服务端收集验证与隐私检查、数据库锁/事务/幂等、真实调度及自动发布、真实权限隔离和公开结果一致性。本轮没有实现 C2 工具采集端、集成令牌管理、后端调度器，未做 R1/R2 部署及线上验收。接口 404 时显示“尚未接入”，不以 mock 静默兜底，也不展示虚假的保存/发布成功。

## 页面与文件

工作台地址：`/blog-front/admin/studio?tab=inbox|runs|settings`；命令入口录入使用 `tab=inbox&action=import`，关闭后清除此 action。

| 文件 | 职责 |
| --- | --- |
| src/views/admin/Studio.vue | 工作台 tab 与异步面板入口 |
| src/components/studio/CaptureInbox.vue、CaptureEditor.vue | 收件箱与私有片段录入/编辑 |
| src/components/studio/RunHistory.vue、RunDetail.vue | 运行列表、详情、触发及重试 |
| src/components/studio/PublishingSettings.vue | 读取与版本化保存设置 |
| src/components/studio/StudioState.vue、StatusBadge.vue、ActionFeedback.vue | 未接入/状态/错误、冲突与原位重新认证 |
| src/api/studio.js、src/api/index.js | v1 适配与错误详情、Retry-After 解析 |
| src/api/mock-studio.js、src/api/mock.js | 显式 DEV mock 与既有 mock 路由衔接 |
| src/composables/useRunDetail.js、useUnsavedChanges.js | 轮询取消及未保存保护 |
| src/utils/studio.js、src/styles/studio.css | 字段校验、枚举/日期、安全 URL、响应式样式 |
| src/components/common/ModalDialog.vue | 初始打开时的焦点圈定、卸载保护与焦点返回 |
| src/components/search/CommandPalette.vue | 管理员工作台命令 |
| README.md、handoff/checks/phase2-*.js | 交接入口与可重跑浏览器检查 |

复用上一轮的安全 Markdown Vue 节点渲染器；没有整段 innerHTML、原型全局 DOM 脚本或生产样例数组。mock 模块不进入生产产物。未新增依赖，package.json、package-lock.json 与 .env.production 相对于本轮基线均保持不变。完整起始脏状态及哈希见 frontend-phase2-baseline.json；Git 当前差异包含上一轮未提交改动，不能全部算作本轮变更。

## 接口接线与验证边界

以下均通过统一适配层连接 `/api/v1`，没有替代路径。**已接线不等于已连通真实后端；本轮真实 C1/A1 成功调用为 0。**

| 方法与路径（相对于 /api/v1） | 提交约束 | 本轮验证来源 |
| --- | --- | --- |
| GET /admin/captures、/admin/captures/stats、/admin/captures/{id} | 查询/分页、管理员认证、可取消 GET | DEV mock、生产构建上的 HTTP 拦截夹具 |
| POST /captures | CaptureInput、Idempotency-Key；管理员手工录入 | 同上 |
| PUT /admin/captures/{id} | 仅可修改字段及 expectedVersion，不重写 source/externalId | 同上 |
| POST /admin/captures/{id}/hold、/release | hold: reason + expectedVersion；release: expectedVersion | DEV mock |
| DELETE /admin/captures/{id} | query expectedVersion | DEV mock |
| GET /admin/runs、/admin/runs/{id} | 查询/分页、可取消轮询 | DEV mock、HTTP 拦截夹具 |
| POST /admin/runs | businessDate + Idempotency-Key | 同上 |
| POST /admin/runs/{id}/retry | expectedAttempt + Idempotency-Key | 同上 |
| GET/PUT /admin/publishing-settings | PUT 仅可编辑字段 + expectedVersion | 同上 |

捕获详情按文档的 CaptureInput 字段及 id/status/version/validationErrors 消费；更新遵守字段不可变要求。C1 尚未提供完整实现，最终 DTO/分页筛选形态需用其 OpenAPI 核对。设置时区使用 IANA 标识，后端仍需确认可接受范围。现有管理员登录/session 存储策略沿用上一轮，未声称本轮新增服务端会话能力。

开发 mock 仅在 `import.meta.env.DEV && VITE_DEV_MOCK === 'true'` 时开启，页面显示 mock 标识。测试口令 `devblog-mock` 仅用于本地模拟；工作台状态键为 `devblog_mock_studio_v1`（还有上一轮的内容/会话键）。mock 的运行状态在读取时按经过时间模拟，没有后台调度器；模拟输出 NOTE 保持 UNVERIFIED。它只能证明 UI 交互，不能证明后端检查、调度、隐私或真实公开发布。请求失败不会切换为 mock。

## 实际构建与浏览器检查

环境：Windows、Node 22.19.0、npm 10.9.3、Vite 8.0.1；Playwright CLI + Microsoft Edge。未增加项目测试依赖或更换包管理器。机器概要见 frontend-phase2-validation.json，截图在被忽略的 output/playwright/phase2-*.png。

| 类别 | 实际结果 |
| --- | --- |
| 生产构建 | 成功；显式设置 VITE_DEV_MOCK=true 执行生产 build，仍排除 mock。产物中 3 个工作台 mock 特征标识扫描均为 0。docs 仅由构建生成，没有手改 |
| 日夜与断点 | 360/375/390/414/768/1024/1440px × light/dark × 收件箱、记录、设置、片段预览、运行详情，共 70 组通过；页面/弹窗无全局横向溢出 |
| 长内容与安全 | 200 字中文标题、长正文、长原因码/ID、超宽代码和表格、导入 HTML 不执行；滚动限制在内容容器；代表性桌面和手机截图已查看 |
| phase2-mock.js | 7 组通过：录入/预览/私有回执、编辑/暂缓恢复、双页 409、删除/只读/空态、设置确认持久化/冲突、触发轮询/输出、重试及未保存关闭保护（部分组合在同组中） |
| phase2-http.js | 6 组通过：生产构建 HTTP 拦截；503 重试相同 key/输入、PUT 字段与版本、401 保留输入、429、晚响应取消、设置错误/不完整响应、触发/轮询停止、retry 409 后刷新 attempt。不是实际后端调用 |
| phase2-boundaries.js | 3 组通过：404“尚未接入”、403/500/requestId/加载/空态、设置页签单次未保存提示与 beforeunload 阻止 |
| phase2-command.js | 2 组通过：管理员命令导航与关闭清理、未知 tab 规范化/登出隐藏命令 |
| F1–F3 回归 | reading-search.js 7 组、admin-mock.js 6 组通过；后者已更新工作台标题断言，保留草稿/发布回归。没有把上一轮全部 112 组重新执行 |
| 真实 API | production-read.js 对现有生产配置 GET /public/home：NETWORK_OR_CORS_FAILURE，界面显示错误且没有 mock 内容。无真实登录/写入，无真实 F4 验收通过 |
| 静态检查与保留 | git diff --check、Phase 2 检查脚本语法通过；生产环境文件与包文件哈希对比一致，未输出环境值 |

HTTP 测试使用 Playwright 路由拦截与合成会话，未向真实服务执行写入。预期的 4xx/5xx 网络日志不算页面 JavaScript 异常；布局和 mock 套件的 pageErrors 为空。实际手动/自动检查在 Edge 模拟视口完成，不能代替真机、Safari/Firefox、macOS Cmd+K、线上 GitHub Pages、负载/定时运行或服务端安全验收。未保存刷新检查验证事件被阻止，浏览器原生提示文案不由应用控制。

## 后端联调阻塞

1. 后端最新交接 blog-api/docs/handoff/backend-upgrade-phase1.md 仍将 C1/A1 列为未实现；本机约定的 127.0.0.1:18080 无监听。8080 是其他 httpd 服务，不能当作本项目 API。没有启动/修改后端、Docker 或数据库。
2. 现有生产配置在浏览器读取首页仍是网络/CORS 失败；需要协调方提供可从本地 Origin 访问的隔离 v1 服务与测试管理员。不要在真实生产库验证导入、启用设置或重试。
3. CORS 需允许 Authorization、Content-Type、Idempotency-Key/OPTIONS；跨 Origin 的 429 还必须通过 Access-Control-Expose-Headers 暴露 Retry-After。当前只读后端代码允许请求头但未暴露此响应头。HTTP 夹具显式暴露后，等待与恢复验证通过；真实 CORS 未验收。
4. C1 完成后核对捕获详情、统计、分页/筛选、验证状态和暂缓原因 DTO，确认 expectedVersion 冲突、进行中只读与 INCLUDED 不可改；导入的脱敏/验证/重复检测必须由服务端保障。
5. A1 完成后验证触发幂等、expectedAttempt、唯一业务日、并发执行、重试限制、时区与 nextDueAt、事务/锁、部分失败、实际 NOTE 输出与公开 verification。浏览器轮询不承担调度，不会证明服务端已发布。

## 本地预览与复查

先在前端目录检查端口再启动；不要修改 .env.production。

```powershell
Set-Location 'D:\MyProject\DevBlog\blog-frontend'
# 显式 DEV mock，仅当前 PowerShell 进程环境生效
$env:VITE_DEV_MOCK = 'true'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
# 停止服务后清理当前进程开关
Remove-Item Env:VITE_DEV_MOCK -ErrorAction SilentlyContinue
```

访问 http://127.0.0.1:5173/blog-front/admin/login ，模拟口令 devblog-mock。工作台入口 admin/studio?tab=inbox、tab=runs、tab=settings。浏览器 localStorage 中的 mock 内容只属于此 Origin；清理键只影响测试数据。phase2-mock.js 会重置工作台测试夹具，勿在该 Origin 保存希望保留的 mock 编辑。

真实联调需先移除 VITE_DEV_MOCK；后端就绪时可仅在当前终端设置非秘密的 `$env:VITE_API_BASE_URL = 'http://127.0.0.1:18080/api/v1'` 后启动 dev，结束后 Remove-Item Env:VITE_API_BASE_URL。该端口目前没有 API，不应据此认为联调可用。

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
# 另一个终端：无需全局安装 Playwright
npx --yes --package @playwright/cli playwright-cli -s=studio-mock open http://127.0.0.1:5173/blog-front/ --browser msedge
npx --yes --package @playwright/cli playwright-cli -s=studio-mock run-code --filename handoff/checks/phase2-mock.js
npx --yes --package @playwright/cli playwright-cli -s=studio-mock run-code --filename handoff/checks/phase2-layout.js
npx --yes --package @playwright/cli playwright-cli -s=studio-mock run-code --filename handoff/checks/phase2-command.js
npx --yes --package @playwright/cli playwright-cli -s=studio-http open http://127.0.0.1:4173/blog-front/ --browser msedge
npx --yes --package @playwright/cli playwright-cli -s=studio-http run-code --filename handoff/checks/phase2-http.js
npx --yes --package @playwright/cli playwright-cli -s=studio-http run-code --filename handoff/checks/phase2-boundaries.js
```

HTTP 夹具与 production-read.js 的实际网络检查必须分开运行/记录。布局脚本临时修改并恢复长内容夹具；脚本中断可重置 mock 后重跑。关闭测试浏览器：`npx --yes --package @playwright/cli playwright-cli -s=studio-mock close`，studio-http 同理。

交付时仅保留 5173 显式 mock 开发服务（node PID 快照 4908）；访问 http://127.0.0.1:5173/blog-front/ 。4173 生产预览已停止，本轮 QA 浏览器已关闭。在启动终端 Ctrl+C 停止开发服务；若原终端不可用，先用 Get-NetTCPConnection 核对 5173 的 OwningProcess，再用 Get-CimInstance Win32_Process 核对它的 CommandLine 确实是本仓库 Vite，最后 Stop-Process -Id 对应 PID。进程重启后 PID 会改变，不可直接复用快照或终止其他进程。

没有部署、提交、推送或创建 PR。后端、原型、共享开发文档与 Obsidian 均未修改。本轮到此停止，正式文档/笔记和真实后端验收由协调方接续。
