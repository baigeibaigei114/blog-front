<script setup>
import { computed, defineAsyncComponent, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '../../styles/studio.css'
const route = useRoute(),
  router = useRouter()
const panels = {
  inbox: defineAsyncComponent(
    () => import('../../components/studio/CaptureInbox.vue'),
  ),
  runs: defineAsyncComponent(
    () => import('../../components/studio/RunHistory.vue'),
  ),
  settings: defineAsyncComponent(
    () => import('../../components/studio/PublishingSettings.vue'),
  ),
}
const titles = {
  inbox: ['学习收件箱', '保留来源、整理线索，明确公开边界。'],
  runs: ['发布记录', '查看批次、输出与暂缓原因。'],
  settings: ['发布设置', '时间、时区与异常策略，由服务端持久保存。'],
}
const tab = computed(() =>
  Object.hasOwn(panels, route.query.tab) ? route.query.tab : 'inbox',
)
watch(
  () => route.query.tab,
  (value) => {
    if (value && !Object.hasOwn(panels, value))
      router.replace({ path: '/admin/studio', query: { tab: 'inbox' } })
  },
  { immediate: true },
)
</script>
<template>
  <header class="page-heading studio-heading">
    <div class="eyebrow">PRIVATE STUDIO / 工作台</div>
    <h1>{{ titles[tab][0] }}</h1>
    <p>{{ titles[tab][1] }}</p>
  </header>
  <component :is="panels[tab]" :key="tab" />
</template>
