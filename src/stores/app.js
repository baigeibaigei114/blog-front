import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categoryApi, tagApi } from '../api'

export const useAppStore = defineStore('app', () => {
  // 分类和标签
  const categories = ref([])
  const tags = ref([])

  // 加载状态
  const categoriesLoading = ref(false)
  const tagsLoading = ref(false)

  // 管理员登录状态
  const isLoggedIn = ref(!!localStorage.getItem('token'))
  const token = ref(localStorage.getItem('token') || '')

  // 是否已加载
  const isCategoriesLoaded = computed(() => categories.value.length > 0)
  const isTagsLoaded = computed(() => tags.value.length > 0)

  // 获取分类列表
  async function fetchCategories() {
    if (isCategoriesLoaded.value) return categories.value

    categoriesLoading.value = true
    try {
      const response = await categoryApi.getList()
      categories.value = response.data || response || []
      return categories.value
    } catch (err) {
      console.error('获取分类失败:', err)
      return []
    } finally {
      categoriesLoading.value = false
    }
  }

  // 获取标签列表
  async function fetchTags() {
    if (isTagsLoaded.value) return tags.value

    tagsLoading.value = true
    try {
      const response = await tagApi.getList()
      tags.value = response.data || response || []
      return tags.value
    } catch (err) {
      console.error('获取标签失败:', err)
      return []
    } finally {
      tagsLoading.value = false
    }
  }

  // 设置登录状态
  function setLogin(newToken) {
    token.value = newToken
    isLoggedIn.value = true
    localStorage.setItem('token', newToken)
  }

  // 登出
  function logout() {
    token.value = ''
    isLoggedIn.value = false
    localStorage.removeItem('token')
  }

  // 根据名称获取分类
  function getCategoryBySlug(slug) {
    return categories.value.find(c => c.slug === slug)
  }

  // 根据名称获取标签
  function getTagByName(name) {
    return tags.value.find(t => t.name === name)
  }

  return {
    // 状态
    categories,
    tags,
    categoriesLoading,
    tagsLoading,
    isLoggedIn,
    token,
    // 计算属性
    isCategoriesLoaded,
    isTagsLoaded,
    // 方法
    fetchCategories,
    fetchTags,
    setLogin,
    logout,
    getCategoryBySlug,
    getTagByName
  }
})