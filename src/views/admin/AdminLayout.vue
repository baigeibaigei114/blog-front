<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin'
const route = useRoute(),
  router = useRouter(),
  admin = useAdminStore(),
  error = ref('')
const links = [
  ['/admin/posts', '内容管理'],
  ['/admin/new', '新建草稿'],
  ['/admin/studio?tab=inbox', '学习收件箱'],
  ['/admin/studio?tab=runs', '发布记录'],
  ['/admin/studio?tab=settings', '发布设置'],
]
const current = computed(() =>
  route.path === '/admin/studio'
    ? '/admin/studio?tab=' + (route.query.tab || 'inbox')
    : route.path,
)
async function logout() {
  error.value = ''
  if (!confirm('退出管理员会话？未保存内容请先保存。')) return
  try {
    await admin.logout()
    router.push('/admin/login')
  } catch (failure) {
    error.value = failure.message
  }
}
</script>
<template>
  <div class="studio-layout">
    <aside class="studio-aside">
      <div class="eyebrow">STUDIO DESK</div>
      <RouterLink
        v-for="[to, label] in links"
        :key="to"
        :to="to"
        class="studio-tab-btn"
        :class="{ active: current === to }"
        >{{ label }}</RouterLink
      ><RouterLink to="/" class="studio-tab-btn">← 读者前台</RouterLink
      ><button class="text-btn" @click="logout">退出登录</button>
    </aside>
    <div class="admin-content">
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <RouterView :key="route.path" />
    </div>
  </div>
</template>
