<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const appStore = useAppStore()

// 分类图标
const categoryIcons = {
  framework: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>`,
  project: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  language: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  ai: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>`,
  interview: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`,
  misc: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`
}

function goToCategory(slug) {
  router.push({ name: 'Posts', query: { category: slug } })
}

function formatDate(dateStr) {
  if (!dateStr) return '暂无'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  appStore.fetchCategories()
})
</script>

<template>
  <div class="categories-page">
    <!-- 返回首页按钮 -->
    <router-link to="/" class="back-home-btn" title="返回首页">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </router-link>

    <main class="main">
      <div class="content">
        <div class="container-wide">
          <div class="page-header">
            <h1 class="page-title">分类</h1>
            <p class="page-description">
              共 {{ appStore.categories.length }} 个分类，按主题组织文章
            </p>
          </div>

          <!-- 加载状态 -->
          <div v-if="appStore.categoriesLoading" class="loading">
            加载中...
          </div>

          <!-- 分类网格 -->
          <div v-else class="categories-grid">
            <a
              v-for="category in appStore.categories"
              :key="category.id"
              class="category-card"
              @click.prevent="goToCategory(category.slug)"
            >
              <div class="category-card-header">
                <div class="category-icon" v-html="categoryIcons[category.slug] || categoryIcons.misc"></div>
                <div class="category-info">
                  <h2 class="category-name">{{ category.name }}</h2>
                  <span class="category-count">{{ category.postCount || 0 }} 篇文章</span>
                </div>
              </div>
              <p class="category-description">{{ category.description }}</p>
              <p class="category-recent">最近更新: {{ formatDate(category.updatedAt) }}</p>
            </a>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.categories-page {
  min-height: 100vh;
}

.back-home-btn {
  position: fixed;
  top: var(--spacing-lg);
  left: var(--spacing-lg);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(22, 27, 34, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-default);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all var(--transition-fast);
}

.back-home-btn:hover {
  background-color: var(--color-accent);
  color: white;
  transform: translateX(-3px);
  text-decoration: none;
}

.page-header {
  padding: var(--spacing-2xl) 0;
  border-bottom: 1px solid var(--border-muted);
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--text-3xl);
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.page-description {
  color: var(--color-text-secondary);
}

.loading {
  text-align: center;
  padding: 60px;
  color: var(--color-text-muted);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.category-card {
  background-color: rgba(22, 27, 34, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all var(--transition-normal);
  cursor: pointer;
}

.category-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  text-decoration: none;
}

.category-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-accent-subtle), var(--color-bg-tertiary));
  color: var(--color-accent);
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.category-count {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.category-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--spacing-md);
}

.category-recent {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>