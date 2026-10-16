<script setup>
import { computed, ref, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { publicApi } from '../api'
import { useResource } from '../composables/useResource'
import { pageNumber } from '../utils/content'
import NoteEntry from '../components/content/NoteEntry.vue'
import ResourceState from '../components/common/ResourceState.vue'
import Pagination from '../components/common/Pagination.vue'
const route = useRoute(),
  router = useRouter()
const keyword = ref(String(route.query.q || '')),
  searching = computed(() => !!String(route.query.q || '').trim())
const params = computed(() => ({
  page: pageNumber(route.query.page),
  size: 10,
  topic: String(route.query.topic || ''),
  verifiedOnly: route.query.verifiedOnly === 'true',
  from: route.query.from || undefined,
  to: route.query.to || undefined,
}))
const { data, error, loading, reload } = useResource(
  (signal) =>
    searching.value
      ? publicApi.search(
          {
            q: String(route.query.q).slice(0, 100),
            kind: 'NOTE',
            page: params.value.page,
            size: 10,
          },
          signal,
        )
      : publicApi.notes(params.value, signal),
  () => route.query,
)
const topics = useResource(publicApi.home)
const located = useResource(
  (signal) =>
    route.query.note
      ? publicApi.note(String(route.query.note), signal)
      : Promise.resolve(null),
  () => route.query.note,
)
const groups = computed(() => {
  const notes = [...(data.value?.data || [])].sort(
    (a, b) =>
      (b.journalDate || '').localeCompare(a.journalDate || '') ||
      (BigInt(a.id) > BigInt(b.id) ? -1 : 1),
  )
  const map = new Map()
  for (const note of notes) {
    const date = note.journalDate || '未提供日志日期'
    if (!map.has(date)) map.set(date, [])
    map.get(date).push(note)
  }
  return [...map.entries()]
})
const offPageNote = computed(() =>
  located.data.value &&
  !data.value?.data.some((note) => note.id === located.data.value.id)
    ? located.data.value
    : null,
)
function update(values) {
  const query = { ...route.query, ...values }
  for (const key of Object.keys(query))
    if (query[key] === '' || query[key] == null || query[key] === false)
      delete query[key]
  router.push({ path: '/notes', query })
}
function clearFilters() {
  keyword.value = ''
  router.push('/notes')
}
let timer
watch(keyword, (value) => {
  clearTimeout(timer)
  if (value === String(route.query.q || '')) return
  timer = setTimeout(() => update({ q: value.trim(), page: 1 }), 250)
})
watch(
  () => route.query.q,
  (value) => {
    keyword.value = String(value || '')
  },
)
watch([data, located.data], async () => {
  if (!route.query.note || !located.data.value) return
  await nextTick()
  document
    .getElementById('note-' + located.data.value.id)
    ?.scrollIntoView({ block: 'start' })
})
onUnmounted(() => clearTimeout(timer))
</script>
<template>
  <header class="page-heading">
    <div class="eyebrow">LEARNING JOURNAL / 学习日志</div>
    <h1>每天一点，慢慢连起来。</h1>
    <p>按日期归纳的公开学习切片，记录理解过程和验证边界。</p>
  </header>
  <form
    class="filter-shelf"
    @submit.prevent="update({ q: keyword.trim(), page: 1 })"
  >
    <label class="search-field"
      >搜索日志<input
        v-model="keyword"
        type="search"
        maxlength="100"
        placeholder="搜索公开日志…"
    /></label>
    <template v-if="!searching"
      ><label
        >主题透镜<select
          :value="params.topic"
          @change="update({ topic: $event.target.value, page: 1 })"
        >
          <option value="">全部主题</option>
          <option
            v-for="topic in topics.data.value?.topics"
            :key="topic.topic"
            :value="topic.topic"
          >
            {{ topic.topic }}
          </option>
          <option
            v-if="
              params.topic &&
              !topics.data.value?.topics.some((t) => t.topic === params.topic)
            "
            :value="params.topic"
          >
            {{ params.topic }}
          </option>
        </select></label
      ><label class="check"
        ><input
          type="checkbox"
          :checked="params.verifiedOnly"
          @change="
            update({
              verifiedOnly: $event.target.checked ? 'true' : undefined,
              page: 1,
            })
          "
        />仅看有实测依据</label
      ></template
    >
    <button
      type="button"
      class="secondary"
      @click="clearFilters"
    >
      清除筛选
    </button>
  </form>
  <p v-if="searching" class="notice">
    搜索公开日志：{{
      route.query.q
    }}。搜索接口按关键词匹配；清除关键词后恢复主题与验证筛选。
  </p>
  <p v-else-if="params.topic || params.verifiedOnly" class="mini">
    当前筛选：{{ params.topic || '全部主题' }} ·
    {{ params.verifiedOnly ? '仅 TESTED' : '全部验证状态' }}
  </p>
  <p v-if="!searching && topics.error.value" class="error-message">
    主题索引暂不可用。<button class="text-btn" @click="topics.reload">
      重试
    </button>
  </p>
  <ResourceState
    v-if="route.query.note"
    :loading="located.loading.value"
    :error="located.error.value"
    @retry="located.reload"
  />
  <section v-if="offPageNote" class="notes-timeline">
    <p class="notice">链接定位的日志不在当前结果页。当前筛选保持不变。</p>
    <NoteEntry :note="offPageNote" expanded />
  </section>
  <ResourceState
    :loading="loading"
    :error="error"
    :empty="data?.data.length === 0"
    empty-text="没有符合条件的公开日志。"
    @retry="reload"
  />
  <div class="notes-timeline">
    <section v-for="[date, notes] in groups" :key="date" class="timeline-day">
      <time class="timeline-date">{{ date }}</time>
      <div>
        <NoteEntry
          v-for="note in notes"
          :key="note.id"
          :note="note"
          :expanded="route.query.note === note.id"
        />
      </div>
    </section>
  </div>
  <Pagination
    :page="params.page"
    :pages="data?.pages || 0"
    @change="update({ page: $event })"
  />
</template>
