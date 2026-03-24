<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostStore } from '../stores/posts'
import { tagApi } from '../api'
import PostCard from '../components/PostCard.vue'

const route = useRoute()
const router = useRouter()
const postStore = usePostStore()

const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedTag = ref('')
const sortOrder = ref('newest')

// 视图模式
const viewMode = ref(localStorage.getItem('postsView') || 'list')

// 标签列表（从 API 获取）
const tags = ref([])
const activeTag = ref('全部标签')

// 加载数据
async function loadPosts() {
  await postStore.fetchPosts({
    category: selectedCategory.value,
    tag: activeTag.value === '全部标签' ? '' : activeTag.value,
    keyword: searchKeyword.value,
    sort: sortOrder.value
  })
}

// 搜索
function handleSearch() {
  loadPosts()
}

// 标签筛选
function selectTag(tag) {
  activeTag.value = tag
  loadPosts()
}

// 加载标签列表
async function loadTags() {
  try {
    const res = await tagApi.getList()
    tags.value = (res.data || []).map(tag => tag.name)
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

// 切换视图
function setViewMode(mode) {
  viewMode.value = mode
  localStorage.setItem('postsView', mode)
}

// 监听路由参数
watch(() => route.query, (params) => {
  if (params.category) selectedCategory.value = params.category
  if (params.tag) {
    activeTag.value = params.tag
    selectedTag.value = params.tag
  }
  if (params.search) searchKeyword.value = params.search
  loadPosts()
}, { immediate: true })

onMounted(() => {
  // 加载标签列表
  loadTags()
  // 从 URL 获取参数
  if (route.query.category) selectedCategory.value = route.query.category
  if (route.query.tag) {
    activeTag.value = route.query.tag
  }
  if (route.query.search) searchKeyword.value = route.query.search
})
</script>

<template>
  <div class="posts-page">
    <!-- 返回首页按钮 -->
    <router-link to="/" class="back-home-btn" title="返回首页">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </router-link>

    <!-- 主内容 -->
    <main class="main">
      <div class="content">
        <div class="container-wide">
          <!-- 页面头部 -->
          <div class="page-header">
            <h1 class="page-title">文章</h1>
            <p class="page-description">
              {{ postStore.total > 0 ? `共 ${postStore.total} 篇文章` : '探索技术的无限可能' }}
            </p>
          </div>

          <!-- 筛选器 -->
          <div class="filters-section">
            <div class="filters-bar">
              <!-- 搜索框 -->
              <div class="search-box">
                <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  v-model="searchKeyword"
                  type="text"
                  class="search-input"
                  placeholder="搜索文章..."
                  @keypress.enter="handleSearch"
                >
              </div>

              <!-- 分类筛选 -->
              <div class="filter-group">
                <label class="filter-label">分类:</label>
                <select v-model="selectedCategory" class="filter-select" @change="loadPosts">
                  <option value="">全部</option>
                  <option value="framework">框架学习</option>
                  <option value="project">项目阅读</option>
                  <option value="language">编程语言</option>
                  <option value="ai">AI</option>
                  <option value="interview">八股</option>
                  <option value="misc">杂谈</option>
                </select>
              </div>

              <!-- 排序 -->
              <div class="filter-group">
                <label class="filter-label">排序:</label>
                <select v-model="sortOrder" class="filter-select" @change="loadPosts">
                  <option value="newest">最新发布</option>
                  <option value="oldest">最早发布</option>
                </select>
              </div>

              <!-- 视图切换 -->
              <div class="view-toggle">
                <button
                  class="view-btn"
                  :class="{ active: viewMode === 'list' }"
                  @click="setViewMode('list')"
                  title="列表视图"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
                <button
                  class="view-btn"
                  :class="{ active: viewMode === 'grid' }"
                  @click="setViewMode('grid')"
                  title="卡片视图"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 标签筛选 -->
            <div class="filter-tags">
              <span
                v-for="tag in ['全部标签', ...tags]"
                :key="tag"
                class="filter-tag"
                :class="{ active: activeTag === tag }"
                @click="selectTag(tag)"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 文章列表 -->
          <div class="posts-main">
            <!-- 加载状态 -->
            <div v-if="postStore.loading" class="loading">
              加载中...
            </div>

            <!-- 空状态 -->
            <div v-else-if="postStore.posts.length === 0" class="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 16px; opacity: 0.5;">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <p>暂无文章</p>
            </div>

            <!-- 文章列表 -->
            <div v-else :class="['posts-list', viewMode === 'grid' ? 'posts-grid' : '']">
              <PostCard
                v-for="post in postStore.posts"
                :key="post.id"
                :post="post"
                :compact="viewMode === 'grid'"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.posts-page {
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

.filters-section {
  margin-bottom: var(--spacing-xl);
}

.filters-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: rgba(22, 27, 34, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 320px;
}

.search-box .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-box .search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  padding-left: 40px;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
}

.search-box .search-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.filter-select {
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-md);
  padding-right: var(--spacing-xl);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.view-toggle {
  display: flex;
  gap: var(--spacing-xs);
  margin-left: auto;
}

.view-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.view-btn:hover {
  color: var(--color-text-primary);
}

.view-btn.active {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-md);
}

.filter-tag {
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-tag:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.filter-tag.active {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.posts-main {
  max-width: 900px;
  margin: 0 auto;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .filters-bar {
    flex-wrap: wrap;
  }

  .search-box {
    max-width: 100%;
    order: -1;
    margin-bottom: var(--spacing-sm);
  }

  .view-toggle {
    margin-left: 0;
    margin-top: var(--spacing-sm);
  }
}
</style>