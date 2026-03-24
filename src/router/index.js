import { createRouter, createWebHistory } from 'vue-router'
import { useAdminStore } from '../stores/admin'

const routes = [
  // 前台路由
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/posts',
    name: 'Posts',
    component: () => import('../views/Posts.vue'),
    meta: { title: '文章' }
  },
  {
    path: '/posts/:id',
    name: 'PostDetail',
    component: () => import('../views/PostDetail.vue'),
    meta: { title: '文章详情' }
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('../views/Categories.vue'),
    meta: { title: '分类' }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('../views/Tags.vue'),
    meta: { title: '标签' }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../views/Projects.vue'),
    meta: { title: '项目展示' }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: { title: '关于' }
  },

  // 后台管理路由
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/AdminLogin.vue'),
    meta: { title: '管理员登录', guest: true }
  },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/admin/posts'
      },
      {
        path: 'posts',
        name: 'AdminPosts',
        component: () => import('../views/admin/AdminPosts.vue'),
        meta: { title: '文章管理' }
      },
      {
        path: 'new',
        name: 'AdminNewPost',
        component: () => import('../views/admin/AdminPostEdit.vue'),
        meta: { title: '新建文章' }
      },
      {
        path: 'edit/:id',
        name: 'AdminEditPost',
        component: () => import('../views/admin/AdminPostEdit.vue'),
        meta: { title: '编辑文章' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_PATH || '/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 更新页面标题
  document.title = to.meta.title ? `${to.meta.title} - DevBlog` : 'DevBlog'

  // 需要认证的路由
  if (to.meta.requiresAuth) {
    const adminStore = useAdminStore()

    // 检查登录状态
    if (!adminStore.isLoggedIn) {
      await adminStore.checkAuth()
    }

    if (!adminStore.isLoggedIn) {
      next({ name: 'AdminLogin', query: { redirect: to.fullPath } })
      return
    }
  }

  // 已登录用户访问登录页，重定向到管理后台
  if (to.meta.guest) {
    const adminStore = useAdminStore()
    if (adminStore.isLoggedIn) {
      next({ name: 'AdminPosts' })
      return
    }
  }

  next()
})

export default router