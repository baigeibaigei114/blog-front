<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { publicApi } from '../api'
import { useResource } from '../composables/useResource'
import ResourceState from '../components/common/ResourceState.vue'
const route = useRoute(),
  category = computed(() => route.path === '/categories')
const { data, loading, error, reload } = useResource(
  (signal) =>
    category.value ? publicApi.categories(signal) : publicApi.tags(signal),
  () => route.path,
)
</script>
<template>
  <header class="page-heading">
    <div class="eyebrow">INDEX / 归档索引</div>
    <h1>{{ category ? '按分类翻阅' : '按标签翻阅' }}</h1>
  </header>
  <ResourceState
    :loading="loading"
    :error="error"
    :empty="data?.length === 0"
    @retry="reload"
  />
  <div class="filter-shelf">
    <RouterLink
      v-for="item in data"
      :key="item.id"
      class="chip"
      :to="{
        path: '/posts',
        query: category ? { categorySlug: item.slug } : { tag: item.slug },
      }"
      >{{ item.name }} / {{ item.publishedCount }}</RouterLink
    >
  </div>
</template>
