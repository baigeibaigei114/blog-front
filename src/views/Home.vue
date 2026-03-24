<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import PhysicsCanvas from '../components/PhysicsCanvas.vue'

const router = useRouter()
const currentTime = ref('00:00')
const currentDate = ref('')
const searchInput = ref(null)
const searchKeyword = ref('')

// 更新时间
function updateTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  currentDate.value = now.toLocaleDateString('zh-CN', options)
}

// 搜索
function handleSearch(e) {
  if (e.key === 'Enter' && searchKeyword.value.trim()) {
    router.push({ name: 'Posts', query: { search: searchKeyword.value.trim() } })
  }
}

// 拖拽设置搜索关键词
function setSearchKeyword(keyword) {
  searchKeyword.value = keyword
  if (searchInput.value) {
    searchInput.value.focus()
  }
}

// 暴露给物理组件
defineExpose({ setSearchKeyword })

let timer = null
onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  window.setSearchKeyword = setSearchKeyword
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  delete window.setSearchKeyword
})
</script>

<template>
  <div class="home-page">
    <!-- 物理画布 -->
    <PhysicsCanvas />

    <!-- 主容器 -->
    <div class="startpage-container">
      <!-- 时间显示 -->
      <div class="time-display">
        <div class="current-time">{{ currentTime }}</div>
        <div class="current-date">{{ currentDate }}</div>
      </div>

      <!-- 标题 -->
      <h1 class="startpage-title">DevBlog</h1>

      <!-- 搜索卡片 -->
      <div class="search-card" id="searchCard">
        <div class="search-hint">拖动技术球到这里搜索相关文章</div>

        <div class="search-container">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            ref="searchInput"
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="搜索文章..."
            autocomplete="off"
            @keypress="handleSearch"
          >
        </div>

        <!-- 导航卡片网格 -->
        <div class="cards-grid">
          <router-link to="/about" class="nav-card home">
            <div class="nav-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <span class="nav-card-label">首页</span>
          </router-link>

          <router-link to="/posts" class="nav-card posts">
            <div class="nav-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <span class="nav-card-label">最新文章</span>
          </router-link>

          <router-link to="/categories" class="nav-card categories">
            <div class="nav-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <span class="nav-card-label">分类</span>
          </router-link>

          <router-link to="/projects" class="nav-card tech">
            <div class="nav-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
            </div>
            <span class="nav-card-label">项目展示</span>
          </router-link>

          <a href="https://space.bilibili.com/426868443" class="nav-card bilibili" target="_blank">
            <div class="nav-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" fill="white"/>
              </svg>
            </div>
            <span class="nav-card-label">Bilibili</span>
          </a>

          <a href="https://github.com/q1724588603-hue/myblog" class="nav-card github" target="_blank">
            <div class="nav-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="white"/>
              </svg>
            </div>
            <span class="nav-card-label">GitHub</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.startpage-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 560px;
  padding: var(--spacing-xl);
  margin: auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  pointer-events: none;
}

.startpage-container > * {
  pointer-events: auto;
}

.time-display {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.current-time {
  font-size: var(--text-5xl);
  font-weight: 200;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 2px;
  text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
}

.current-date {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

.startpage-title {
  text-align: center;
  font-size: var(--text-4xl);
  font-weight: 700;
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.search-card {
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.search-hint {
  text-align: center;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
  opacity: 0.7;
}

.search-container {
  position: relative;
  margin-bottom: var(--spacing-lg);
}

.search-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  padding-left: 48px;
  font-size: var(--text-base);
  background: rgba(15, 23, 42, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  outline: none;
  box-sizing: border-box;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  border-color: var(--color-accent);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.nav-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all var(--transition-normal);
  cursor: pointer;
  min-height: 90px;
}

.nav-card:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: var(--color-accent);
  transform: translateY(-4px);
  box-shadow: 0 10px 40px -10px rgba(59, 130, 246, 0.3);
}

.nav-card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-sm);
  background: linear-gradient(135deg, var(--card-color, var(--color-accent)) 0%, var(--card-color-dark, #3B82F6) 100%);
  border-radius: var(--radius-md);
  color: white;
  box-shadow: 0 4px 15px -3px var(--card-color, rgba(59, 130, 246, 0.4));
}

.nav-card-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  text-align: center;
}

.nav-card:hover .nav-card-label {
  color: var(--color-accent);
}

.nav-card.home { --card-color: #3B82F6; --card-color-dark: #2563EB; }
.nav-card.posts { --card-color: #8B5CF6; --card-color-dark: #7C3AED; }
.nav-card.categories { --card-color: #EC4899; --card-color-dark: #DB2777; }
.nav-card.tech { --card-color: #10B981; --card-color-dark: #059669; }
.nav-card.bilibili { --card-color: #FB7299; --card-color-dark: #E85A7F; }
.nav-card.github { --card-color: #6366F1; --card-color-dark: #4F46E5; }

@media (max-width: 600px) {
  .startpage-container {
    padding: var(--spacing-md);
  }

  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-sm);
  }

  .nav-card {
    padding: var(--spacing-md);
    min-height: 70px;
  }

  .nav-card-icon {
    width: 32px;
    height: 32px;
  }

  .nav-card-label {
    font-size: var(--text-xs);
  }

  .current-time {
    font-size: var(--text-4xl);
  }
}
</style>