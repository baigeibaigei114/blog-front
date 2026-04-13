# DevBlog 前端

基于 Vue 3 + Vite 的博客前端项目。
所有内容均为ai生成
## 技术栈

- Vue 3.5 + Composition API
- Vue Router 4
- Pinia 3 (状态管理)
- Axios (HTTP 请求)
- markdown-it + highlight.js (Markdown 渲染)
- md-editor-v3 (Markdown 编辑器)

## 项目结构

```
src/
├── api/              # API 接口封装
│   └── index.js
├── components/       # 公共组件
│   ├── PhysicsCanvas.vue
│   └── PostCard.vue
├── router/           # 路由配置
│   └── index.js
├── stores/           # Pinia 状态管理
│   ├── admin.js
│   ├── app.js
│   └── posts.js
├── styles/           # 全局样式
│   └── base.css
├── views/            # 页面组件
│   ├── admin/        # 管理后台
│   │   ├── AdminLayout.vue
│   │   ├── AdminLogin.vue
│   │   ├── AdminPosts.vue
│   │   └── AdminPostEdit.vue
│   ├── Home.vue
│   ├── Posts.vue
│   ├── PostDetail.vue
│   ├── Categories.vue
│   ├── Tags.vue
│   ├── Projects.vue
│   └── About.vue
├── App.vue
└── main.js
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 环境配置

### 开发环境 (`.env`)

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 生产环境 (`.env.production`)

```env
# API 基础地址
VITE_API_BASE_URL=https://your-api-domain.com/api

# 部署路径
# GitHub Pages 根域名: /
# GitHub Pages 子路径: /blog/
VITE_BASE_PATH=/
```

## 部署到 GitHub Pages

### 1. 修改环境变量

编辑 `.env.production`：

```env
VITE_API_BASE_URL=https://your-server-ip:8080/api
VITE_BASE_PATH=/
```

如果是子路径部署（如 `https://username.github.io/blog/`）：

```env
VITE_API_BASE_URL=https://your-server-ip:8080/api
VITE_BASE_PATH=/blog/
```

### 2. 构建

```bash
npm run build
```

### 3. 部署

**方式一：手动部署**

将 `dist` 目录内容推送到 GitHub 仓库的 `gh-pages` 分支。

**方式二：GitHub Actions 自动部署**

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: blog-frontend/package-lock.json

      - name: Install dependencies
        working-directory: blog-frontend
        run: npm ci

      - name: Build
        working-directory: blog-frontend
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: blog-frontend/dist

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

## 功能特性

### 前台功能

- 首页：时钟显示、快捷导航、物理球交互
- 文章列表：分页、分类筛选、标签筛选、排序
- 文章详情：Markdown 渲染、代码高亮、上下篇导航
- 分类/标签：文章归档
- 搜索：ElasticSearch 全文搜索

### 管理后台

- JWT Token 认证
- 文章管理：创建、编辑、删除
- Markdown 编辑器：实时预览、图片上传、代码高亮
- 搜索索引：ES 状态检查、重建索引

## 注意事项

1. **API 跨域**：后端需要配置 CORS 允许前端域名
2. **路由模式**：使用 HTML5 History 模式，服务器需要配置 fallback
3. **Token 存储**：JWT Token 存储在 localStorage，刷新页面不会丢失
