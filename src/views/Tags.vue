<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const appStore = useAppStore()

function goToTag(tag) {
  router.push({ name: 'Posts', query: { tag: tag.name } })
}

function getTagSize(tag) {
  const count = tag.postCount || 0
  const max = Math.max(...(appStore.tags.map(t => t.postCount || 0)))
  const min = Math.min(...(appStore.tags.map(t => t.postCount || 0)))

  if (max === min) return 'size-md'

  const ratio = (count - min) / (max - min)
  if (ratio > 0.7) return 'size-lg'
  if (ratio > 0.4) return 'size-md'
  if (ratio < 0.2) return 'size-xs'
  return 'size-sm'
}

onMounted(() => {
  appStore.fetchTags()
})
</script>

<template>
  <div class="tags-page">
    <header class="header">
      <div class="header-inner">
        <router-link to="/" class="logo">
          <div class="logo-icon">D</div>
          <span>DevBlog</span>
        </router-link>
        <nav class="nav">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/posts" class="nav-link">文章</router-link>
          <router-link to="/categories" class="nav-link">分类</router-link>
          <router-link to="/tags" class="nav-link active">标签</router-link>
          <router-link to="/about" class="nav-link">关于</router-link>
        </nav>
      </div>
    </header>

    <main class="main">
      <div class="content">
        <div class="container-wide">
          <div class="page-header">
            <h1 class="page-title">标签</h1>
            <p class="page-description">
              共 {{ appStore.tags.length }} 个标签，标签越大表示相关文章越多
            </p>
          </div>

          <!-- 标签云 -->
          <div class="tags-cloud-container">
            <div v-if="appStore.tagsLoading" class="loading">加载中...</div>
            <div v-else class="tags-cloud-main">
              <a
                v-for="tag in appStore.tags"
                :key="tag.id"
                class="tag-item"
                :class="getTagSize(tag)"
                @click.prevent="goToTag(tag)"
              >
                {{ tag.name }}
                <span class="tag-count">{{ tag.postCount || 0 }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="container-wide">
        <div class="footer-content">
          <div class="footer-links">
            <a href="https://github.com/q1724588603-hue/myblog" class="footer-link" target="_blank">GitHub</a>
            <a href="https://space.bilibili.com/426868443" class="footer-link" target="_blank">Bilibili</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.tags-page {
  min-height: 100vh;
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

.tags-cloud-container {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}

.tags-cloud-main {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  justify-content: center;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.tag-item:hover {
  background-color: var(--color-accent-subtle);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.tag-item.size-xs { font-size: var(--text-xs); padding: var(--spacing-xs) var(--spacing-sm); }
.tag-item.size-sm { font-size: var(--text-sm); }
.tag-item.size-md { font-size: var(--text-base); padding: var(--spacing-sm) var(--spacing-lg); }
.tag-item.size-lg { font-size: var(--text-lg); padding: var(--spacing-md) var(--spacing-lg); font-weight: 500; }

.tag-count {
  margin-left: var(--spacing-xs);
  font-size: 0.85em;
  opacity: 0.7;
}
</style>