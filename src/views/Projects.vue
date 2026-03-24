<script setup>
import { ref, onMounted } from 'vue'
import { projectApi } from '../api'

const projects = ref([])
const loading = ref(true)
const activeFilter = ref('all')

const filters = [
  { key: 'all', label: '全部' },
  { key: 'web', label: 'Web 应用' },
  { key: 'tool', label: '工具' },
  { key: 'lib', label: '库/框架' },
  { key: 'other', label: '其他' }
]

async function loadProjects() {
  loading.value = true
  try {
    const response = await projectApi.getList()
    projects.value = response.data || response || []
  } catch (err) {
    console.error('加载项目失败:', err)
  } finally {
    loading.value = false
  }
}

function setFilter(key) {
  activeFilter.value = key
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const filteredProjects = computed(() => {
  if (activeFilter.value === 'all') return projects.value
  return projects.value.filter(p => p.category === activeFilter.value)
})

import { computed } from 'vue'

onMounted(loadProjects)
</script>

<template>
  <div class="projects-page">
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
            <h1 class="page-title">项目展示</h1>
            <p class="page-description">我的开源项目与实战作品，持续更新中</p>
          </div>

          <!-- 筛选栏 -->
          <div class="filter-bar">
            <button
              v-for="filter in filters"
              :key="filter.key"
              class="filter-btn"
              :class="{ active: activeFilter === filter.key }"
              @click="setFilter(filter.key)"
            >
              {{ filter.label }}
            </button>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading">加载中...</div>

          <!-- 空状态 -->
          <div v-else-if="projects.length === 0" class="empty-state">
            <p>暂无项目</p>
          </div>

          <!-- 项目网格 -->
          <div v-else class="projects-grid">
            <div
              v-for="(project, index) in filteredProjects"
              :key="project.id"
              class="project-card"
              :style="{ '--project-color': colors[index % 6], '--project-color-dark': colorsDark[index % 6] }"
            >
              <div class="project-cover">
                <span class="project-icon">{{ project.icon || '📦' }}</span>
              </div>
              <div class="project-content">
                <div class="project-header">
                  <h3 class="project-title">
                    <a :href="project.url" target="_blank">{{ project.name }}</a>
                  </h3>
                  <span class="project-stars">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {{ project.stars || 0 }}
                  </span>
                </div>
                <p class="project-description">{{ project.description }}</p>
                <div class="project-techs">
                  <span v-for="tech in (project.techs || [])" :key="tech" class="project-tech">{{ tech }}</span>
                </div>
                <div class="project-footer">
                  <div class="project-links">
                    <a v-if="project.github" :href="project.github" class="project-link" target="_blank">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub
                    </a>
                    <a v-if="project.demo" :href="project.demo" class="project-link" target="_blank">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Demo
                    </a>
                  </div>
                  <span class="project-date">{{ formatDate(project.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'],
      colorsDark: ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0891B2']
    }
  }
}
</script>

<style scoped>
.projects-page {
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

.filter-bar {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.filter-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: rgba(22, 27, 34, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover,
.filter-btn.active {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px;
  color: var(--color-text-muted);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.project-card {
  background-color: rgba(22, 27, 34, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.project-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -10px rgba(59, 130, 246, 0.2);
}

.project-cover {
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, var(--project-color, #3B82F6) 0%, var(--project-color-dark, #2563EB) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-icon {
  font-size: 48px;
}

.project-content {
  padding: var(--spacing-lg);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.project-title {
  font-size: var(--text-lg);
  font-weight: 600;
}

.project-title a {
  color: var(--color-text-primary);
  text-decoration: none;
}

.project-title a:hover {
  color: var(--color-accent);
}

.project-stars {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.project-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--spacing-md);
}

.project-techs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.project-tech {
  padding: 2px 8px;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-muted);
}

.project-links {
  display: flex;
  gap: var(--spacing-sm);
}

.project-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.project-link:hover {
  background-color: var(--color-accent);
  color: white;
}

.project-date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}
</style>