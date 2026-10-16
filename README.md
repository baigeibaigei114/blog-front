# DevBlog 前端

记录开发实践与学习过程的个人技术博客，使用 Vue 3 构建，部署在 GitHub Pages。

**在线访问：[DevBlog](https://baigeibaigei114.github.io/blog-front/)**

## 功能

- 首页、文章归档与详情、学习日志、分类、标签、项目和关于页面。
- 日夜主题、响应式布局、移动阅读工具条与目录抽屉。
- 安全 Markdown 渲染、代码高亮与复制、文章目录和阅读进度。
- 文章与日志搜索、命令面板及键盘操作。
- 管理员登录、草稿编辑、发布、撤回与版本冲突提示。
- 工作台收件箱、发布运行记录与发布设置界面，需对应后端接口支持。

内容由 AI 辅助生成和整理，验证状态以文章中的公开验证记录为准。前端界面的实现不代表后端业务已经完成验收。

## 技术栈

- Vue 3、Vue Router、Pinia
- Vite、npm
- Axios
- markdown-it、highlight.js

## 本地开发

使用 Node.js 22 与 npm，依赖版本以 `package-lock.json` 为准。

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

访问 http://127.0.0.1:5173/blog-front/ 。在启动终端按 `Ctrl+C` 停止服务。

### API 配置

开发环境可在本地创建 `.env.development.local`，填写实际后端地址，例如：

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:18080/api/v1
```

生产构建读取本地 `.env.production`，例如：

```dotenv
VITE_API_BASE_URL=https://your-api.example.com/api/v1
```

以上地址需要替换为可用的后端服务。接口遵循 `/api/v1` 契约，后端需允许前端 Origin 的跨域请求。环境配置文件不纳入版本管理；`VITE_` 变量会进入浏览器资源，不能存放密钥或管理员口令。

### 开发 mock

需要本地模拟数据时，在当前 PowerShell 中显式开启：

```powershell
$env:VITE_DEV_MOCK = 'true'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
# 停止服务后清理当前终端的开关
Remove-Item Env:VITE_DEV_MOCK -ErrorAction SilentlyContinue
```

mock 仅在开发模式生效，页面会显示提示；生产构建排除 mock，请求失败时也不会自动切换到模拟数据。

## 构建与预览

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

构建产物位于 `docs/`，预览地址为 http://127.0.0.1:4173/blog-front/ 。在启动终端按 `Ctrl+C` 停止预览。

## GitHub Pages 部署

现有部署使用以下结构：

| 项目 | 配置 |
| --- | --- |
| 源码分支 | `master` |
| 发布分支 | `frontend` |
| Pages 发布目录 | `/docs` |
| Vite 部署前缀 | `/blog-front/` |

发布步骤：

1. 配置本地生产 API 地址，执行 `npm ci` 与 `npm run build`。
2. 检查生成的 `docs/index.html`、`docs/404.html` 和 `docs/.nojekyll`。
3. 将构建后的 `docs/` 更新到 `frontend` 分支并提交、推送。
4. 在仓库 Actions 中确认 Pages 发布成功，再检查首页、文章直达和刷新。

`public/.nojekyll` 会在构建时复制到发布目录，用于保留静态站点发布方式。`404.html` 负责恢复 History 路由及历史文章路径；资源和路由均使用 `/blog-front/` 前缀。

`master` 忽略构建产物，**只推送源码分支不会更新当前线上站点**。应修改源码并重新构建，避免直接编辑 `docs/` 中的文件。

## 目录结构

```text
public/           静态资源、.nojekyll 与 404 回退页
src/
  api/            API 适配与开发 mock
  components/     页面、阅读和工作台组件
  composables/    请求、轮询和未保存内容保护
  config/         站点展示配置
  router/         页面路由与登录保护
  stores/         Pinia 状态
  styles/         主题、排版与响应式样式
  utils/          内容、Markdown 与字段处理
  views/          公开页面与管理员页面
vite.config.js    构建及部署前缀配置
```
