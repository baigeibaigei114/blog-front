<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { studioApi } from '../../api/studio'
import { useResource } from '../../composables/useResource'
import { pageNumber } from '../../utils/content'
import { captureStates, sourceOptions } from '../../utils/studio'
import StudioState from './StudioState.vue'
import StatusBadge from './StatusBadge.vue'
import CaptureEditor from './CaptureEditor.vue'
import Pagination from '../common/Pagination.vue'
const route = useRoute(),
  router = useRouter()
const selected = ref(null),
  importing = ref(false),
  closing = ref(false),
  message = ref('')
const params = computed(() => ({
  page: pageNumber(route.query.page),
  size: 10,
  status: route.query.status || undefined,
  source: route.query.source || undefined,
  from: route.query.from || undefined,
  to: route.query.to || undefined,
}))
const invalidDates = computed(
  () =>
    params.value.from && params.value.to && params.value.from > params.value.to,
)
const list = useResource(
  (signal) =>
    invalidDates.value
      ? Promise.reject(new Error('开始日期不能晚于结束日期'))
      : studioApi.captures(params.value, signal),
  () => route.query,
)
const stats = useResource(
  (signal) =>
    invalidDates.value
      ? Promise.reject(new Error('日期区间无效'))
      : studioApi.stats(
          { from: params.value.from, to: params.value.to },
          signal,
        ),
  () => [params.value.from, params.value.to],
)
const statLabels = {
  total: '收集总数',
  received: '校验中',
  ready: '可整理',
  held: '暂缓',
  included: '已消费',
}
function update(values) {
  const query = {
    ...route.query,
    ...values,
    tab: 'inbox',
    page: values.page || 1,
  }
  delete query.action
  for (const key of Object.keys(query))
    if (query[key] === '' || query[key] == null) delete query[key]
  router.push({ path: '/admin/studio', query })
}
watch(
  () => route.fullPath,
  () => {
    selected.value = null
    importing.value = route.query.action === 'import'
  },
  { immediate: true },
)
function openImport() {
  if (closing.value) return
  selected.value = null
  importing.value = true
}
async function closeEditor() {
  closing.value = true
  selected.value = null
  importing.value = false
  try {
    if (route.query.action) {
      const query = { ...route.query }
      delete query.action
      await router.replace({ path: route.path, query })
    }
  } finally {
    closing.value = false
  }
}
function saved(result) {
  message.value = result
    ? '私有收件箱已更新；以服务端状态为准。'
    : '片段已删除。'
  list.reload()
  stats.reload()
}
</script>
<template>
  <div class="studio-banner">
    <div>
      <h2>学习收件箱</h2>
      <p>把片段收进来，保留来源，先核对再整理。</p>
    </div>
    <button class="primary" :disabled="closing" @click="openImport">
      ＋ 录入片段
    </button>
  </div>
  <div class="studio-stats" aria-label="收件箱统计">
    <div v-for="(label, key) in statLabels" :key="key" class="stat-box">
      <strong>{{ stats.data.value?.[key] ?? '—' }}</strong
      ><small>{{ label }}</small>
    </div>
  </div>
  <p class="mini">
    统计使用相同日期区间，覆盖所有来源与状态；“可整理”不代表已经实测。
  </p>
  <StudioState :error="stats.error.value" @retry="stats.reload" />
  <form class="filter-shelf" @submit.prevent="list.reload">
    <label
      >片段状态<select
        :value="params.status || ''"
        @change="update({ status: $event.target.value })"
      >
        <option value="">全部状态</option>
        <option
          v-for="(label, value) in captureStates"
          :key="value"
          :value="value"
        >
          {{ label }}
        </option>
      </select></label
    >
    <label
      >来源工具<select
        :value="params.source || ''"
        @change="update({ source: $event.target.value })"
      >
        <option value="">全部来源</option>
        <option v-for="source in sourceOptions" :key="source" :value="source">
          {{ source }}
        </option>
      </select></label
    >
    <label
      >开始日期<input
        type="date"
        :value="params.from"
        @change="update({ from: $event.target.value })" /></label
    ><label
      >结束日期<input
        type="date"
        :value="params.to"
        @change="update({ to: $event.target.value })"
    /></label>
    <button
      type="button"
      class="secondary"
      @click="
        update({
          status: undefined,
          source: undefined,
          from: undefined,
          to: undefined,
        })
      "
    >
      清除筛选
    </button>
  </form>
  <p v-if="message" class="notice" role="status">{{ message }}</p>
  <StudioState
    :loading="list.loading.value"
    :error="list.error.value"
    :empty="list.data.value?.data.length === 0"
    empty-text="当前筛选下没有私有片段。"
    @retry="list.reload"
  />
  <article
    v-for="capture in list.data.value?.data"
    :key="capture.id"
    class="capture-row"
  >
    <div>
      <div class="tags">
        <StatusBadge :status="capture.status" /><span class="mini"
          >{{ capture.source }} / v{{ capture.version }}</span
        >
      </div>
      <h3>{{ capture.title }}</h3>
      <p>{{ capture.summary }}</p>
    </div>
    <button
      class="secondary"
      :aria-label="'查看片段：' + capture.title"
      :disabled="closing"
      @click="selected = String(capture.id)"
    >
      查看详情
    </button>
  </article>
  <Pagination
    :page="params.page"
    :pages="list.data.value?.pages || 0"
    @change="update({ page: $event })"
  />
  <CaptureEditor
    v-if="selected || importing"
    :key="selected || 'new'"
    :id="selected || undefined"
    @close="closeEditor"
    @saved="saved"
  />
</template>
