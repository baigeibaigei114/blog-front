<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
const props = defineProps({ error: Object, message: String })
const emit = defineEmits(['authenticated'])
const admin = useAdminStore(),
  password = ref(''),
  pending = ref(false),
  loginError = ref(''),
  now = ref(Date.now())
let timer
watch(
  () => props.error,
  (error) => {
    clearInterval(timer)
    now.value = Date.now()
    if (error?.retryAt > Date.now())
      timer = setInterval(() => {
        now.value = Date.now()
        if (now.value >= error.retryAt) clearInterval(timer)
      }, 1000)
  },
  { immediate: true },
)
const remaining = computed(() =>
  Math.max(0, Math.ceil(((props.error?.retryAt || 0) - now.value) / 1000)),
)
async function login() {
  if (pending.value) return
  pending.value = true
  loginError.value = ''
  try {
    await admin.login(password.value)
    password.value = ''
    emit('authenticated')
  } catch (failure) {
    loginError.value = failure.message
  } finally {
    pending.value = false
  }
}
onUnmounted(() => clearInterval(timer))
</script>
<template>
  <p v-if="message" class="notice" role="status">{{ message }}</p>
  <div v-if="error" class="error-message" role="alert">
    <p>{{ error.message }}</p>
    <p v-if="error.errorCode" class="mini">{{ error.errorCode }}</p>
    <p v-if="error.status === 409">
      操作冲突。输入仍保留，请核对最新服务端版本；不会自动覆盖修改。
    </p>
    <p v-if="remaining">请在 {{ remaining }} 秒后重试。</p>
    <p v-if="error.requestId" class="mini">请求编号：{{ error.requestId }}</p>
    <form
      v-if="error.status === 401"
      class="filter-shelf"
      @submit.prevent="login"
    >
      <label
        >重新登录以保留输入<input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
      /></label>
      <button class="secondary" :disabled="pending">
        {{ pending ? '正在验证…' : '恢复会话' }}
      </button>
      <p v-if="loginError">{{ loginError }}</p>
    </form>
  </div>
</template>
