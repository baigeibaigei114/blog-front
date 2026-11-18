<script setup>
import { computed, ref } from 'vue'
import { publicApi } from '../api'
import { useResource } from '../composables/useResource'
import { rstore } from '../config/projects'
import { safeUrl } from '../utils/content'
import ResourceState from '../components/common/ResourceState.vue'
const { data, loading, error, reload } = useResource(publicApi.projects)
const filter = ref('')
const projects = computed(() =>
  (data.value || []).filter(
    ({ demo, github }) =>
      demo?.replace(/\/+$/, '') !== rstore.demo.slice(0, -1) &&
      github?.replace(/\/+$/, '') !== rstore.github,
  ),
)
const visible = computed(() =>
  projects.value.filter((item) => !filter.value || item.category === filter.value),
)
const filters = [
  ['', '全部'],
  ['web', 'Web 应用'],
  ['tool', '工具'],
  ['lib', '库 / 框架'],
  ['other', '其他'],
]
const projectUrl = (url) => safeUrl(url, true)
const workflow = [
  {
    title: '整理影像',
    description: '登记 GeoTIFF，管理采集时间、传感器和影像范围，再按时间或空间条件寻找可用数据。',
  },
  {
    title: '提交区域分析',
    description: '在地图上绘制监测区，选定影像并确认提交。Spring Boot 校验输入，Python Worker 异步计算 NDVI（归一化植被指数）。',
  },
  {
    title: '查看地图与统计',
    description: '叠加结果图层，查看区域内的有效像素比例与指数均值，并下载 GeoTIFF 供后续分析。',
  },
]
const stack = ['Vue 3', 'OpenLayers', 'Spring Boot', 'PostGIS', 'Python / GDAL']
</script>
<template>
  <article class="project-feature">
    <header class="project-intro">
      <div class="eyebrow">项目实践 / RStore</div>
      <h1>{{ rstore.title }}</h1>
      <p>
        在地图上管理遥感影像、划定监测区域并运行植被分析。分析完成后，可以在同一张地图上查看结果图层与区域统计。
      </p>
      <div class="actions">
        <a
          class="primary"
          :href="rstore.demo"
          target="_blank"
          rel="noopener noreferrer"
          >打开在线演示 <span aria-hidden="true">↗</span></a
        >
        <a
          class="secondary"
          :href="rstore.github"
          target="_blank"
          rel="noopener noreferrer"
          >查看源码 <span aria-hidden="true">↗</span></a
        >
      </div>
      <ul class="project-stack" aria-label="技术栈">
        <li v-for="tech in stack" :key="tech" class="tag">{{ tech }}</li>
      </ul>
    </header>
    <figure class="project-figure">
      <img :src="rstore.cover" :alt="rstore.coverAlt" width="500" height="500" />
      <figcaption>
        <span>鄱阳湖 · 2024-11-29</span>
        <a :href="rstore.source" target="_blank" rel="noopener noreferrer"
          >Copernicus Sentinel-2 <span aria-hidden="true">↗</span></a
        >
      </figcaption>
    </figure>
    <section class="project-workflow" aria-labelledby="workflow-title">
      <h2 id="workflow-title">一次区域植被分析</h2>
      <ol>
        <li v-for="step in workflow" :key="step.title">
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </li>
      </ol>
    </section>
  </article>
  <section
    v-if="projects.length || loading || error"
    aria-labelledby="project-catalog-title"
  >
    <h2 id="project-catalog-title">更多项目</h2>
    <div v-if="projects.length" class="filter-shelf" role="group" aria-label="项目类型">
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
      :empty="projects.length > 0 && !visible.length"
      empty-text="暂时没有此类公开项目。"
      @retry="reload"
    />
    <div v-if="visible.length" class="project-grid">
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
  </section>
</template>

<style scoped>
.project-feature {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.92fr);
  align-items: center;
  gap: clamp(28px, 5vw, 68px);
  padding: clamp(32px, 6vw, 72px) 0 44px;
}

.project-intro h1 {
  margin: 12px 0 16px;
  font-size: clamp(32px, 4.8vw, 60px);
  line-height: 1.2;
}

.project-intro p {
  max-width: 34em;
  margin: 0 0 24px;
  color: var(--ink-soft);
}

.project-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.project-figure {
  min-width: 0;
  overflow: hidden;
  margin: 0;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.project-figure img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.project-figure figcaption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0 12px;
  padding: 0 14px;
  color: var(--ink-soft);
  font: 12px/1.6 var(--mono);
}

.project-figure a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  color: var(--green-text);
}

.project-figure a:hover {
  text-decoration: underline;
}

.project-workflow {
  grid-column: 1 / -1;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.project-workflow h2 {
  margin: 0 0 24px;
  font-size: clamp(24px, 3vw, 32px);
}

.project-workflow ol {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style-position: inside;
}

.project-workflow li {
  padding-top: 14px;
  border-top: 2px solid var(--green-text);
}

.project-workflow li::marker {
  color: var(--green-text);
  font: 13px/1.5 var(--mono);
}

.project-workflow h3 {
  display: inline;
  margin: 0;
  font-size: 20px;
}

.project-workflow p {
  margin: 8px 0 0;
  color: var(--ink-soft);
}

@media (max-width: 760px) {
  .project-feature,
  .project-workflow ol {
    grid-template-columns: 1fr;
  }
}
</style>
