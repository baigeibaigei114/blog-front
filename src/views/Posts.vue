<script setup>
import { computed, ref, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { publicApi } from '../api'
import { usePostStore } from '../stores/posts'
import { useResource } from '../composables/useResource'
import { pageNumber } from '../utils/content'
import ArticleCard from '../components/content/ArticleCard.vue'
import ResourceState from '../components/common/ResourceState.vue'
import Pagination from '../components/common/Pagination.vue'
const route = useRoute(),
  router = useRouter(),
  store = usePostStore()
const params = computed(() => ({
  page: pageNumber(route.query.page),
  size: 10,
  q: String(route.query.q || '').slice(0, 100),
  categorySlug: String(route.query.categorySlug || ''),
  tag: String(route.query.tag || ''),
  sort: route.query.sort === 'oldest' ? 'oldest' : 'newest',
}))
const keyword = ref(params.value.q)
watch(
  () => params.value.q,
  (q) => {
    keyword.value = q
  },
)
const { data, loading, error, reload } = useResource(
  (signal) => store.fetchPosts(params.value, signal),
  () => route.query,
)
const taxonomy = useResource((signal) =>
  Promise.all([publicApi.categories(signal), publicApi.tags(signal)]),
)
function update(values) {
  const query = { ...route.query, ...values }
  for (const key of Object.keys(query))
    if (query[key] === '' || query[key] == null) delete query[key]
  router.push({ path: '/posts', query })
}
function clearFilters() {
  keyword.value = ''
  router.push('/posts')
}
let timer
watch(keyword, (value) => {
  clearTimeout(timer)
  if (value === params.value.q) return
  timer = setTimeout(() => update({ q: value.trim(), page: 1 }), 250)
})
onUnmounted(() => clearTimeout(timer))
const scrollKey = () => 'devblog:list:' + route.fullPath
let leaving = false
onBeforeRouteLeave(() => {
  sessionStorage.setItem(scrollKey(), String(window.scrollY))
  leaving = true
})
watch(data, async (value) => {
  if (!value || leaving) return
  await nextTick()
  const saved = sessionStorage.getItem(scrollKey())
  if (saved && window.history.state?.forward) window.scrollTo(0, Number(saved))
})
</script>
<template>
  <header class="page-heading">
    <div class="eyebrow">THE ARCHIVE / 文章</div>
    <h1>问题留下来，理解长出来。</h1>
    <p>按专题沉淀的技术手记，保留思考过程与验证边界。</p>
  </header>
  <form
    class="filter-shelf"
    @submit.prevent="update({ q: keyword.trim(), page: 1 })"
  >
    <label class="search-field"
      >搜索文章<input
        v-model="keyword"
        maxlength="100"
        type="search"
        placeholder="标题、摘要与正文…"
    /></label>
    <label
      >分类<select
        :value="params.categorySlug"
        @change="update({ categorySlug: $event.target.value, page: 1 })"
      >
        <option value="">全部分类</option>
        <option
          v-for="cat in taxonomy.data.value?.[0]"
          :key="cat.id"
          :value="cat.slug"
        >
          {{ cat.name }} ({{ cat.publishedCount }})
        </option>
      </select></label
    >
    <label
      >标签<select
        :value="params.tag"
        @change="update({ tag: $event.target.value, page: 1 })"
      >
        <option value="">全部标签</option>
        <option
          v-for="tag in taxonomy.data.value?.[1]"
          :key="tag.id"
          :value="tag.slug"
        >
          {{ tag.name }}
        </option>
      </select></label
    >
    <label
      >排序<select
        :value="params.sort"
        @change="update({ sort: $event.target.value, page: 1 })"
      >
        <option value="newest">最近发布</option>
        <option value="oldest">最早发布</option>
      </select></label
    >
    <button
      class="secondary"
      type="button"
      @click="clearFilters"
    >
      清除筛选
    </button>
  </form>
  <p v-if="taxonomy.error.value" class="error-message">
    分类与标签未能加载。<button class="text-btn" @click="taxonomy.reload">
      重试筛选项
    </button>
  </p>
  <p class="mini" aria-live="polite">
    {{ data ? data.total + ' 篇公开文章' : '公开文章归档'
    }}<span v-if="params.categorySlug || params.tag || params.q">
      · 已应用筛选</span
    >
  </p>
  <ResourceState
    :loading="loading"
    :error="error"
    :empty="data?.data.length === 0"
    empty-text="没有符合筛选条件的公开文章。"
    @retry="reload"
  />
  <section style="max-width: 880px" aria-label="公开文章">
    <ArticleCard v-for="item in data?.data" :key="item.id" :item="item" />
  </section>
  <Pagination
    :page="params.page"
    :pages="data?.pages || 0"
    @change="update({ page: $event })"
  />
</template>
