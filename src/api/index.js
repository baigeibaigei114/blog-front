import axios from 'axios'

// API 基础配置
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Token 管理
const TOKEN_KEY = 'admin_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// 请求拦截器：自动携带 JWT Token
api.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    // 401 错误：Token 无效或过期，清除本地 Token
    if (error.response?.status === 401) {
      removeToken()
    }
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// ============================================
// 文章相关 API
// ============================================
export const postApi = {
  // 获取文章列表
  getList(params = {}) {
    return api.get('/posts', { params })
  },

  // 获取文章详情
  getDetail(id) {
    return api.get(`/posts/${id}`)
  },

  // 创建文章
  create(data) {
    return api.post('/posts', data)
  },

  // 更新文章
  update(id, data) {
    return api.put(`/posts/${id}`, data)
  },

  // 删除文章
  delete(id) {
    return api.delete(`/posts/${id}`)
  }
}

// ============================================
// 分类相关 API
// ============================================
export const categoryApi = {
  getList() {
    return api.get('/categories')
  },

  getDetail(id) {
    return api.get(`/categories/${id}`)
  }
}

// ============================================
// 标签相关 API
// ============================================
export const tagApi = {
  getList() {
    return api.get('/tags')
  }
}

// ============================================
// 搜索相关 API (ElasticSearch)
// ============================================
export const searchApi = {
  search(query) {
    return api.get('/posts/search', { params: { q: query } })
  }
}

// ============================================
// 项目相关 API
// ============================================
export const projectApi = {
  getList(params = {}) {
    return api.get('/projects', { params })
  }
}

// ============================================
// 管理员相关 API
// ============================================
export const adminApi = {
  // 登录
  login(password) {
    return api.post('/admin/login', { password })
  },

  // 退出登录
  logout() {
    return api.post('/admin/logout')
  },

  // 检查登录状态
  checkLogin() {
    return api.get('/admin/check')
  },

  // 重建搜索索引
  rebuildIndex() {
    return api.post('/admin/rebuild-index')
  },

  // 检查 ES 状态
  getSearchStatus() {
    return api.get('/admin/search-status')
  }
}

// ============================================
// 文件上传 API
// ============================================
export const uploadApi = {
  // 上传图片
  uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

// 导出 Token 管理函数
export const auth = {
  getToken,
  setToken,
  removeToken
}

export default api