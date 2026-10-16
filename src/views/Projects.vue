<script setup>
import { computed, ref } from 'vue'
import { publicApi } from '../api'
import { useResource } from '../composables/useResource'
import { safeUrl } from '../utils/content'
import ResourceState from '../components/common/ResourceState.vue'
const { data, loading, error, reload } = useResource(publicApi.projects)
const filter = ref('')
const visible = computed(
  () =>
    data.value?.filter(
      (item) => !filter.value || item.category === filter.value,
    ) || [],
)
const filters = [
  ['', '全部'],
  ['web', 'Web 应用'],
  ['tool', '工具'],
  ['lib', '库 / 框架'],
  ['other', '其他'],
]
const projectUrl = (url) => safeUrl(url, true)
</script>
<template>
  <header class="page-heading">
    <div class="eyebrow">WORK IN PROGRESS / 项目实践</div>
    <h1>在真实约束里，练习构建。</h1>
    <p>记录项目的目标、技术取舍和限制条件。</p>
  </header>
  <div class="filter-shelf" aria-label="项目类型">
    <button
      v-for="[value, label] in filters"
      :key="value"
      class="chip"
      :class="{ active: filter === value }"
      :aria-pressed="filter === value"
      @click="filter = value"
    >
      {{ label }}
    </button>
  </div>
  <ResourceState
    :loading="loading"
    :error="error"
    :empty="data && !visible.length"
    empty-text="暂时没有此类公开项目。"
    @retry="reload"
  />
  <div class="project-grid">
    <article v-for="project in visible" :key="project.id" class="feature-card">
      <span class="eyebrow">{{ project.icon }} / PROJECT</span>
      <h3>{{ project.name }}</h3>
      <p>{{ project.description }}</p>
      <div class="tags">
        <span v-for="tech in project.techs" :key="tech" class="tag">{{
          tech
        }}</span
        ><span v-if="project.stars != null" class="mini"
          >已记录 Stars / {{ project.stars }}</span
        >
      </div>
      <div class="actions" style="margin-top: 20px">
        <a
          v-if="projectUrl(project.github)"
          :href="projectUrl(project.github)"
          target="_blank"
          rel="noopener noreferrer"
          class="primary"
          >代码仓库 ↗</a
        ><a
          v-if="projectUrl(project.demo)"
          :href="projectUrl(project.demo)"
          target="_blank"
          rel="noopener noreferrer"
          class="secondary"
          >查看演示 ↗</a
        >
      </div>
    </article>
  </div>
</template>
