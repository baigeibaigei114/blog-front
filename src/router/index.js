import { createRouter, createWebHistory } from 'vue-router'
import { useAdminStore } from '../stores/admin'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../views/Home.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/posts',
      component: () => import('../views/Posts.vue'),
      meta: { title: '文章' },
    },
    {
      path: '/posts/:id',
      component: () => import('../views/PostDetail.vue'),
      meta: { title: '文章详情' },
    },
    {
      path: '/notes',
      component: () => import('../views/Notes.vue'),
      meta: { title: '学习日志' },
    },
    {
      path: '/projects',
      component: () => import('../views/Projects.vue'),
      meta: { title: '项目' },
    },
    {
      path: '/about',
      component: () => import('../views/About.vue'),
      meta: { title: '关于' },
    },
    {
      path: '/categories',
      component: () => import('../views/Taxonomy.vue'),
      meta: { title: '分类' },
    },
    {
      path: '/tags',
      component: () => import('../views/Taxonomy.vue'),
      meta: { title: '标签' },
    },
    {
      path: '/admin/login',
      component: () => import('../views/admin/AdminLogin.vue'),
      meta: { title: '管理员登录' },
    },
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/admin/posts' },
        {
          path: 'posts',
          component: () => import('../views/admin/AdminPosts.vue'),
          meta: { title: '内容管理' },
        },
        {
          path: 'new',
          component: () => import('../views/admin/AdminPostEdit.vue'),
          meta: { title: '新建草稿' },
        },
        {
          path: 'edit/:id',
          component: () => import('../views/admin/AdminPostEdit.vue'),
          meta: { title: '编辑草稿' },
        },
        {
          path: 'studio',
          component: () => import('../views/admin/Studio.vue'),
          meta: { title: '工作台' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('../views/NotFound.vue'),
      meta: { title: '找不到页面' },
    },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return false
    return { top: 0 }
  },
})
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    try {
      if (await useAdminStore().checkAuth()) return true
    } catch {
      /* Login permits session retry. */
    }
    return { path: '/admin/login', query: { redirect: to.fullPath } }
  }
})
router.afterEach((to, from, failure) => {
  if (!failure) document.title = `${to.meta.title || '技术手记'} · DevBlog`
})
export default router
