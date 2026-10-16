import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminApi, auth, ApiError } from '../api'

export const useAdminStore = defineStore('admin', () => {
  const isLoggedIn = ref(false)
  const expiresAt = ref(null)
  let checking
  function clear() {
    isLoggedIn.value = false
    expiresAt.value = null
    auth.removeToken()
  }
  window.addEventListener('devblog:unauthorized', clear)
  async function checkAuth() {
    if (!auth.getToken()) {
      clear()
      return false
    }
    if (checking) return checking
    checking = (async () => {
      try {
        const session = await adminApi.me()
        if (
          session.role !== 'ADMIN' ||
          !Number.isFinite(Date.parse(session.expiresAt)) ||
          Date.parse(session.expiresAt) <= Date.now()
        )
          throw new ApiError(401, '会话已过期')
        isLoggedIn.value = true
        expiresAt.value = session.expiresAt
        return true
      } catch (error) {
        isLoggedIn.value = false
        if (error.status === 401 || error.status === 403) clear()
        throw error
      } finally {
        checking = undefined
      }
    })()
    return checking
  }
  async function login(password) {
    const session = await adminApi.login(password)
    if (!session.accessToken || session.tokenType !== 'Bearer')
      throw new Error('登录响应不符合 v1 契约')
    auth.setToken(session.accessToken)
    await checkAuth()
  }
  async function logout() {
    await adminApi.logout()
    clear()
  }
  return { isLoggedIn, expiresAt, checkAuth, login, logout, clear }
})
