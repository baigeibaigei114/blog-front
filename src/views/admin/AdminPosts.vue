<template>
  <div class="admin-posts">
    <div class="page-header">
      <h1>文章管理</h1>
      <router-link to="/admin/new" class="new-post-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        新建文章
      </router-link>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filters">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索文章..."
          @input="handleSearch"
        />
      </div>

      <select v-model="filterCategory" @change="loadPosts" class="filter-select">
        <option value="">全部分类</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.slug">
          {{ cat.name }}
        </option>
      </select>
    </div>

    <!-- 文章列表 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="posts.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p>暂无文章</p>
      <router-link to="/admin/new" class="create-link">创建第一篇文章</router-link>
    </div>

    <div v-else class="posts-table">
      <table>
        <thead>
          <tr>
            <th class="title-col">标题</th>
            <th>分类</th>
            <th>标签</th>
            <th>阅读量</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id" :class="{ pinned: post.pinned }">
            <td class="title-col">
              <div class="post-title">
                <span v-if="post.pinned" class="pinned-badge">置顶</span>
                {{ post.title }}
              </div>
            </td>
            <td>{{ post.category || '-' }}</td>
            <td>
              <div class="tags">
                <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </td>
            <td>{{ post.views }}</td>
            <td>{{ formatDate(post.createdAt) }}</td>
            <td>
              <div class="actions">
                <button @click="editPost(post.id)" class="action-btn edit" title="编辑">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button @click="deletePost(post)" class="action-btn delete" title="删除">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page <= 1" @click="changePage(page - 1)" class="page-btn">
        上一页
      </button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="changePage(page + 1)" class="page-btn">
        下一页
      </button>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal" @click.stop>
        <h3>确认删除</h3>
        <p>确定要删除文章「{{ postToDelete?.title }}」吗？此操作不可恢复。</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="cancel-btn">取消</button>
          <button @click="confirmDelete" class="confirm-btn">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { postApi, categoryApi } from '../../api'

const router = useRouter()

const posts = ref([])
const categories = ref([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const pageSize = 10
const searchKeyword = ref('')
const filterCategory = ref('')
const showDeleteModal = ref(false)
const postToDelete = ref(null)

let searchTimeout = null

onMounted(async () => {
  await Promise.all([loadPosts(), loadCategories()])
})

async function loadPosts() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: pageSize
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (filterCategory.value) {
      params.category = filterCategory.value
    }

    const res = await postApi.getList(params)
    // 响应结构: { code, data: { data: [...], total, page, size, pages } }
    posts.value = res.data.data || []
    totalPages.value = res.data.pages || 1
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const res = await categoryApi.getList()
    categories.value = res.data || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    loadPosts()
  }, 300)
}

function changePage(newPage) {
  page.value = newPage
  loadPosts()
}

function editPost(id) {
  router.push(`/admin/edit/${id}`)
}

function deletePost(post) {
  postToDelete.value = post
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!postToDelete.value) return

  try {
    await postApi.delete(postToDelete.value.id)
    posts.value = posts.value.filter(p => p.id !== postToDelete.value.id)
    showDeleteModal.value = false
    postToDelete.value = null
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style scoped>
.admin-posts {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.new-post-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}

.new-post-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.search-box {
  flex: 1;
  position: relative;
  max-width: 400px;
}

.search-box svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.search-box input {
  width: 100%;
  padding: 10px 10px 10px 40px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 14px;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
}

.filter-select {
  padding: 10px 16px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 14px;
  cursor: pointer;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: #94a3b8;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 16px 0;
}

.create-link {
  color: #3b82f6;
  text-decoration: none;
}

.create-link:hover {
  text-decoration: underline;
}

.posts-table {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

th {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  font-size: 14px;
  color: #e2e8f0;
}

tr:last-child td {
  border-bottom: none;
}

tr.pinned {
  background: rgba(59, 130, 246, 0.05);
}

.title-col {
  max-width: 300px;
}

.post-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.pinned-badge {
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  font-size: 10px;
  border-radius: 4px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  padding: 2px 8px;
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  font-size: 12px;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px;
  background: none;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(148, 163, 184, 0.1);
}

.action-btn.edit:hover {
  color: #3b82f6;
  border-color: #3b82f6;
}

.action-btn.delete:hover {
  color: #ef4444;
  border-color: #ef4444;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  padding: 8px 16px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #94a3b8;
  font-size: 14px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1e293b;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
}

.modal h3 {
  margin: 0 0 12px 0;
  color: #f1f5f9;
  font-size: 18px;
}

.modal p {
  margin: 0 0 24px 0;
  color: #94a3b8;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn, .confirm-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
}

.cancel-btn:hover {
  background: rgba(148, 163, 184, 0.2);
}

.confirm-btn {
  background: #ef4444;
  border: none;
  color: white;
}

.confirm-btn:hover {
  background: #dc2626;
}
</style>