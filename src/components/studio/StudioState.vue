<script setup>
import ResourceState from '../common/ResourceState.vue'
defineProps({
  loading: Boolean,
  error: Object,
  empty: Boolean,
  emptyText: String,
})
defineEmits(['retry'])
</script>
<template>
  <section v-if="error?.status === 404" class="state-box" role="alert">
    <span class="badge warn">尚未接入</span>
    <h2>当前接口尚不可用</h2>
    <p>
      服务端返回 404。工作台业务接口需要后端接入，当前没有可展示的真实数据。
    </p>
    <button class="secondary" @click="$emit('retry')">重新检查接口</button>
  </section>
  <ResourceState
    v-else
    :loading="loading"
    :error="error"
    :empty="empty"
    :empty-text="emptyText"
    @retry="$emit('retry')"
  />
</template>
