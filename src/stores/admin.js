import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminApi, auth } from '../api'

export const useAdminStore = defineStore('admin', () => {
  const isLoggedIn = ref(false)
  const loading = ref(false)

  // 检查登录状态
  async function checkAuth() {
    // JWT 无状态，直接检查本地是否有 token
    const token = auth.getToken()
    isLoggedIn.value = !!token
  }

  // 登录
  async function login(password) {
    loading.value = true
    try {
      const res = await adminApi.login(password)
      if (res.data?.token) {
        auth.setToken(res.data.token)
        isLoggedIn.value = true
        return { success: true }
      }
      return { success: false, message: '登录失败' }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '登录失败' }
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  async function logout() {
    try {
      await adminApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      auth.removeToken()
      isLoggedIn.value = false
    }
  }

  return {
    isLoggedIn,
    loading,
    checkAuth,
    login,
    logout
  }
})