<script setup>
defineProps({
  loading: Boolean,
  error: Object,
  empty: Boolean,
  emptyText: { type: String, default: '这里还没有公开内容。' },
})
defineEmits(['retry'])
</script>
<template>
  <div v-if="loading" class="state-box" role="status" aria-live="polite">
    正在翻开手记…
  </div>
  <section v-else-if="error" class="state-box" role="alert">
    <h2>
      {{
        error.status === 404
          ? '找不到内容'
          : error.status === 401
            ? '需要重新登录'
            : error.status === 403
              ? '没有访问权限'
              : '暂时无法加载'
      }}
    </h2>
    <p>{{ error.message }}</p>
    <p v-if="error.requestId" class="mini">请求编号：{{ error.requestId }}</p>
    <RouterLink v-if="error.status === 401" to="/admin/login" class="primary"
      >前往登录</RouterLink
    >
    <button v-else class="secondary" @click="$emit('retry')">重试</button>
  </section>
  <div v-else-if="empty" class="state-box" role="status">{{ emptyText }}</div>
</template>
