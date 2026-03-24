<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePostStore } from '../stores/posts'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

const router = useRouter()
const postStore = usePostStore()

// 配置 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch (e) {
        console.error(e)
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

// 渲染后的 HTML
const renderedContent = computed(() => {
  if (!postStore.currentPost?.content) return ''
  return md.render(postStore.currentPost.content)
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  const id = router.currentRoute.value.params.id
  if (id) {
    postStore.fetchPost(id)
  }
})
</script>

<template>
  <div class="post-detail-page">
    <!-- 阅读进度条 -->
    <div class="reading-progress" :style="{ width: '0%' }"></div>

    <!-- 返回首页按钮 -->
    <router-link to="/" class="back-home-btn" title="返回首页">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </router-link>

    <main class="main">
      <article class="content">
        <div class="post-layout">
          <!-- 主内容区 -->
          <div class="post-main">
            <!-- 面包屑导航 -->
            <nav class="breadcrumb">
              <router-link to="/" class="breadcrumb-item">首页</router-link>
              <span class="breadcrumb-separator">/</span>
              <router-link to="/posts" class="breadcrumb-item">文章</router-link>
              <span class="breadcrumb-separator">/</span>
              <span class="breadcrumb-current">{{ postStore.currentPost?.title || '文章详情' }}</span>
            </nav>

            <!-- 加载状态 -->
            <div v-if="postStore.loading" class="loading">
              加载中...
            </div>

            <!-- 文章不存在 -->
            <div v-else-if="!postStore.currentPost" class="not-found">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 20px; opacity: 0.3;">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
              <h2>文章不存在</h2>
              <p>该文章可能已被删除或移动</p>
              <router-link to="/posts">返回文章列表</router-link>
            </div>

            <!-- 文章内容 -->
            <template v-else>
              <header class="post-header">
                <span class="post-category">{{ postStore.currentPost.category || '未分类' }}</span>
                <h1 class="post-title">{{ postStore.currentPost.title }}</h1>
                <div class="post-meta">
                  <span class="post-meta-item">
                    <svg class="post-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {{ formatDate(postStore.currentPost.createdAt) }}
                  </span>
                  <span class="post-meta-item">
                    <svg class="post-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    阅读 {{ postStore.currentPost.views || 0 }}
                  </span>
                </div>
              </header>

              <div class="post-content" v-html="renderedContent"></div>

              <footer class="post-footer">
                <div class="post-tags">
                  <router-link
                    v-for="tag in (postStore.currentPost.tags || [])"
                    :key="tag"
                    :to="{ name: 'Posts', query: { tag } }"
                    class="tag"
                  >
                    {{ tag }}
                  </router-link>
                </div>
              </footer>
            </template>
          </div>
        </div>
      </article>
    </main>
  </div>
</template>

<style scoped>
.post-detail-page {
  min-height: 100vh;
  padding: 24px;
}

.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent), #a855f7);
  z-index: 1000;
  transition: width 0.1s;
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

.post-layout {
  display: flex;
  gap: var(--spacing-xl);
  max-width: 900px;
  margin: 0 auto;
}

.post-main {
  flex: 1;
  min-width: 0;
  padding: 24px;
  background: rgba(22, 27, 34, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-lg);
}

.breadcrumb-item {
  color: var(--color-text-secondary);
}

.breadcrumb-item:hover {
  color: var(--color-accent);
}

.breadcrumb-current {
  color: var(--color-text-primary);
}

.loading, .not-found {
  text-align: center;
  padding: 80px 20px;
  color: var(--color-text-muted);
}

.not-found h2 {
  margin-bottom: 10px;
  color: var(--color-text-primary);
}

.not-found p {
  margin-bottom: 20px;
}

.post-header {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.post-category {
  display: inline-block;
  padding: 4px 12px;
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
  margin-bottom: var(--spacing-md);
}

.post-title {
  font-size: var(--text-4xl);
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  line-height: var(--leading-tight);
}

.post-meta {
  display: flex;
  gap: var(--spacing-lg);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.post-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-meta-icon {
  width: 16px;
  height: 16px;
}

.post-content {
  color: var(--color-text-primary);
  line-height: 1.8;
}

/* Markdown 内容样式 */
.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3),
.post-content :deep(h4),
.post-content :deep(h5),
.post-content :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  color: var(--color-text-primary);
}

.post-content :deep(h1) { font-size: 2em; }
.post-content :deep(h2) { font-size: 1.5em; }
.post-content :deep(h3) { font-size: 1.25em; }

.post-content :deep(p) {
  margin-bottom: 1em;
}

.post-content :deep(a) {
  color: var(--color-accent);
  text-decoration: none;
}

.post-content :deep(a:hover) {
  text-decoration: underline;
}

.post-content :deep(ul),
.post-content :deep(ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.post-content :deep(li) {
  margin-bottom: 0.5em;
}

.post-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 1em 0;
}

/* 代码高亮样式 */
.post-content :deep(pre.hljs) {
  background: rgba(15, 23, 42, 0.8);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.post-content :deep(pre.hljs code) {
  background: transparent;
  font-size: 14px;
  line-height: 1.6;
}

.post-content :deep(code:not(pre code)) {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
}

/* 引用块 */
.post-content :deep(blockquote) {
  border-left: 4px solid var(--color-accent);
  padding-left: 16px;
  margin: 1em 0;
  color: var(--color-text-secondary);
  background: rgba(59, 130, 246, 0.05);
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
}

/* 表格 */
.post-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.post-content :deep(th),
.post-content :deep(td) {
  border: 1px solid var(--border-default);
  padding: 10px 14px;
  text-align: left;
}

.post-content :deep(th) {
  background: rgba(30, 41, 59, 0.8);
  font-weight: 600;
}

.post-footer {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-muted);
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.post-tags .tag {
  padding: 4px 12px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.post-tags .tag:hover {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}
</style>