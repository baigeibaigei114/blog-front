<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>管理后台</h2>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/admin/posts" class="nav-item" :class="{ active: $route.path === '/admin/posts' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
          <span>文章管理</span>
        </router-link>

        <router-link to="/admin/new" class="nav-item" :class="{ active: $route.path === '/admin/new' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>新建文章</span>
        </router-link>

        <!-- 系统工具 -->
        <div class="nav-section">
          <span class="nav-section-title">系统工具</span>

          <div class="es-status">
            <span class="status-dot" :class="esAvailable ? 'available' : 'unavailable'"></span>
            <span>ES 搜索: {{ esAvailable ? '可用' : '不可用' }}</span>
          </div>

          <button @click="handleRebuildIndex" class="nav-item rebuild-btn" :disabled="rebuilding">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
            <span>{{ rebuilding ? '重建中...' : '重建搜索索引' }}</span>
          </button>
        </div>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/" class="nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>返回前台</span>
        </router-link>

        <button @click="handleLogout" class="nav-item logout-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin'
import { adminApi } from '../../api'

const router = useRouter()
const adminStore = useAdminStore()

const esAvailable = ref(false)
const rebuilding = ref(false)

// 检查 ES 状态
async function checkEsStatus() {
  try {
    const res = await adminApi.getSearchStatus()
    esAvailable.value = res.data?.available || false
  } catch (error) {
    esAvailable.value = false
  }
}

// 重建索引
async function handleRebuildIndex() {
  if (rebuilding.value) return

  rebuilding.value = true
  try {
    await adminApi.rebuildIndex()
    alert('索引重建成功！')
    await checkEsStatus()
  } catch (error) {
    alert('索引重建失败: ' + (error.response?.data?.message || error.message))
  } finally {
    rebuilding.value = false
  }
}

async function handleLogout() {
  await adminStore.logout()
  router.push('/admin/login')
}

onMounted(() => {
  checkEsStatus()
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #0f172a;
}

.sidebar {
  width: 260px;
  background: rgba(30, 41, 59, 0.8);
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 100;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
}

.sidebar-nav {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #cbd5e1;
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.nav-item svg {
  flex-shrink: 0;
}

.nav-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.nav-section-title {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 16px;
  margin-bottom: 8px;
  display: block;
}

.es-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: #94a3b8;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.available {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.status-dot.unavailable {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.rebuild-btn {
  margin-top: 8px;
}

.rebuild-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rebuild-btn:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 24px;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }

  .main-content {
    margin-left: 0;
  }

  .admin-layout {
    flex-direction: column;
  }

  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .sidebar-footer {
    flex-direction: row;
  }
}
</style>