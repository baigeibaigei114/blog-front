import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { postApi, searchApi } from '../api'

export const usePostStore = defineStore('posts', () => {
  // 状态
  const posts = ref([])
  const currentPost = ref(null)
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)

  // 分页和筛选状态
  const page = ref(1)
  const size = ref(10)
  const category = ref('')
  const tag = ref('')
  const sort = ref('newest')
  const keyword = ref('')

  // 计算属性
  const hasMore = computed(() => posts.value.length < total.value)

  // 获取文章列表
  async function fetchPosts(params = {}) {
    loading.value = true
    error.value = null

    const searchKeyword = params.keyword ?? keyword.value

    // 有关键词搜索时使用 ES 搜索接口
    if (searchKeyword) {
      try {
        const response = await searchApi.search(searchKeyword)
        // 搜索结果
        posts.value = response.data || []
        total.value = posts.value.length

        // 更新状态
        if (params.keyword !== undefined) keyword.value = params.keyword
      } catch (err) {
        error.value = err.message || '搜索失败'
        console.error('搜索文章失败:', err)
        posts.value = []
        total.value = 0
      } finally {
        loading.value = false
      }
      return
    }

    // 无关键词时使用分页查询
    try {
      const response = await postApi.getList({
        page: params.page || page.value,
        size: params.size || size.value,
        sort: params.sort || sort.value,
        category: params.category ?? category.value,
        tag: params.tag ?? tag.value
      })

      // 响应结构: { code, data: { data: [...], total, page, size, pages } }
      posts.value = response.data?.data || response.data || []
      total.value = response.data?.total || response.total || 0

      // 更新状态
      if (params.page) page.value = params.page
      if (params.category !== undefined) category.value = params.category
      if (params.tag !== undefined) tag.value = params.tag
      if (params.sort) sort.value = params.sort
      if (params.keyword !== undefined) keyword.value = params.keyword

    } catch (err) {
      error.value = err.message || '加载失败'
      console.error('获取文章列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取文章详情
  async function fetchPost(id) {
    loading.value = true
    error.value = null

    try {
      const response = await postApi.getDetail(id)
      // 响应结构: { code, data: Post }
      currentPost.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message || '加载失败'
      console.error('获取文章详情失败:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // 重置筛选条件
  function resetFilters() {
    category.value = ''
    tag.value = ''
    keyword.value = ''
    sort.value = 'newest'
    page.value = 1
  }

  return {
    // 状态
    posts,
    currentPost,
    total,
    loading,
    error,
    page,
    size,
    category,
    tag,
    sort,
    keyword,
    // 计算属性
    hasMore,
    // 方法
    fetchPosts,
    fetchPost,
    resetFilters
  }
})