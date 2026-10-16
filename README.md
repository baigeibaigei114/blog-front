# DevBlog 前端

Vue 3 / Vue Router / Pinia / Vite，保留 npm 与 `/blog-front/` 部署前缀。

项目原有说明：所有内容均为 AI 生成。公开验证状态仍以服务端返回的 verification 为准。

公开页面与编辑基础见 [Phase 1 交接](handoff/frontend-phase1.md)；工作台收件箱、运行详情和发布设置见 [Phase 2 交接](handoff/frontend-phase2.md)。启动命令、mock、接口联调状态和验证边界均记录在 handoff。跨仓库正式行为与接口以父目录 `docs/development` 为准。

`npm run build` 生成仓库内 `docs/`；该目录是构建产物，不存放开发说明。GitHub Pages 沿用 `frontend` 分支的 `/docs`，构建会从 `public/.nojekyll` 复制发布标记。源码在 `master`，部署方法与实测结果见 [Pages 交接](handoff/github-pages.md)。本地 `.env.production` 不提交。
