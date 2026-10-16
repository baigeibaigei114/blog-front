<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin'
import { safeRedirect } from '../../utils/content'
import { mockEnabled } from '../../api'
const route = useRoute(),
  router = useRouter(),
  admin = useAdminStore()
const password = ref(''),
  error = ref(''),
  pending = ref(false)
async function submit() {
  if (pending.value) return
  pending.value = true
  error.value = ''
  try {
    await admin.login(password.value)
    password.value = ''
    await router.replace(safeRedirect(route.query.redirect))
  } catch (failure) {
    error.value = failure.message
  } finally {
    pending.value = false
  }
}
onMounted(async () => {
  try {
    if (await admin.checkAuth())
      router.replace(safeRedirect(route.query.redirect))
  } catch (failure) {
    error.value = failure.message
  }
})
</script>
<template>
  <section class="login-panel">
    <div class="eyebrow">PRIVATE DESK / 管理员</div>
    <h1>回到写作台。</h1>
    <p class="muted">使用管理员密码建立服务端会话。</p>
    <p v-if="mockEnabled" class="notice">
      开发 mock：使用 devblog-mock 登录。操作仅写入本机模拟数据。
    </p>
    <form @submit.prevent="submit">
      <label
        >管理员密码<input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          autofocus
      /></label>
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <button class="primary" :disabled="pending">
        {{ pending ? '正在验证会话…' : '登录工作台 ↗' }}
      </button>
    </form>
  </section>
</template>
