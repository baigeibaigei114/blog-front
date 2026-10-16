<script setup>
import { publicApi } from '../api'
import { useResource } from '../composables/useResource'
import { dateLabel } from '../utils/content'
import { site } from '../config/site'
import ResourceState from '../components/common/ResourceState.vue'
import ArticleCard from '../components/content/ArticleCard.vue'
import VerificationBadge from '../components/content/VerificationBadge.vue'
import ContourVisual from '../components/visual/ContourVisual.vue'
const { data, loading, error, reload } = useResource(publicApi.home)
</script>
<template>
  <section class="hero">
    <div>
      <div class="eyebrow">A DEVELOPER'S FIELD NOTES / VOL. 01</div>
      <h1>把学到的，<br />写成<em>自己的。</em></h1>
      <div v-if="data" class="hero-pulse">
        <span class="pulse-dot"></span
        ><span
          >已公开 {{ data.publicStats.publishedArticleCount }} 篇文章 ·
          {{ data.publicStats.publishedNoteCount }} 条日志<br /><small
            >最近公开更新
            {{ dateLabel(data.publicStats.latestPublishedAt) }}</small
          ></span
        >
      </div>
      <div class="actions">
        <RouterLink class="primary" to="/posts">翻开技术手记 ↗</RouterLink
        ><RouterLink class="secondary" to="/notes">浏览学习日志</RouterLink
        ><RouterLink class="text-btn" to="/about">关于刊物 →</RouterLink>
      </div>
    </div>
    <ContourVisual />
  </section>
  <div class="topic-strip">
    <span>正在探索 / TOPICS</span
    ><template v-if="data?.topics.length"
      ><RouterLink
        v-for="topic in data.topics"
        :key="topic.topic"
        :to="{ path: '/notes', query: { topic: topic.topic } }"
        >{{ topic.topic }} / {{ topic.publishedCount }}</RouterLink
      ></template
    ><span v-else>保持思考，持续记录 ↗</span>
  </div>
  <ResourceState :loading="loading" :error="error" @retry="reload" />
  <div v-if="data" class="body-grid">
    <div>
      <template v-if="data.featured.length"
        ><div class="section-head">
          <h2>值得慢慢读</h2>
          <span class="mini">SELECTED</span>
        </div>
        <ArticleCard
          v-for="item in data.featured"
          :key="item.id"
          :item="item"
          featured
      /></template>
      <div class="section-head">
        <h2>最近写下的</h2>
        <RouterLink class="text-btn" to="/posts">查看全部归档 →</RouterLink>
      </div>
      <ResourceState :empty="!data.recentArticles.length" /><ArticleCard
        v-for="item in data.recentArticles"
        :key="item.id"
        :item="item"
      />
    </div>
    <aside>
      <div class="side-box">
        <span class="eyebrow">ABOUT THE NOTEBOOK</span>
        <h3>你好，我是{{ site.author }}。</h3>
        <p>{{ site.about }}</p>
        <RouterLink class="text-btn" to="/about">了解更多 ↗</RouterLink>
      </div>
      <div class="side-box">
        <div class="section-head">
          <h2>学习切片</h2>
          <span class="mini">JOURNAL</span>
        </div>
        <p v-if="!data.recentNotes.length">还没有公开日志。</p>
        <div
          v-for="note in data.recentNotes.slice(0, 3)"
          :key="note.id"
          class="small-note-item"
        >
          <time>{{ note.journalDate }}</time
          ><RouterLink :to="{ path: '/notes', query: { note: note.id } }">{{
            note.title
          }}</RouterLink
          ><VerificationBadge :verification="note.verification" />
        </div>
        <RouterLink class="text-btn" to="/notes"
          >进入学习日志时间轴 →</RouterLink
        >
      </div>
    </aside>
  </div>
</template>
