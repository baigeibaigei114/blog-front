<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { publicApi } from '../api'
import { useResource } from '../composables/useResource'
import { useAppStore } from '../stores/app'
import { dateLabel } from '../utils/content'
import MarkdownRenderer from '../components/content/MarkdownRenderer.vue'
import VerificationBadge from '../components/content/VerificationBadge.vue'
import ArticleCard from '../components/content/ArticleCard.vue'
import ArticleToc from '../components/reading/ArticleToc.vue'
import ModalDialog from '../components/common/ModalDialog.vue'
import ResourceState from '../components/common/ResourceState.vue'
const route = useRoute(),
  router = useRouter(),
  app = useAppStore()
const { data, error, loading, reload } = useResource(
  (signal) => publicApi.post(route.params.id, signal),
  () => route.params.id,
)
const related = useResource(
  async (signal) => {
    const article = data.value
    if (!article?.category) return []
    return (
      await publicApi.posts(
        { categorySlug: article.category.slug, size: 4, page: 1 },
        signal,
      )
    ).data
      .filter((p) => p.id !== article.id)
      .slice(0, 3)
  },
  () => data.value,
)
const markdown = ref(null),
  headings = ref([]),
  active = ref(''),
  progress = ref(0),
  drawer = ref(false)
let frame, resizeObserver
function calculate() {
  const root = markdown.value?.root
  if (!root) return
  const rect = root.getBoundingClientRect(),
    distance = rect.height - innerHeight + 32
  progress.value = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        distance > 0
          ? ((32 - rect.top) / distance) * 100
          : rect.bottom <= innerHeight
            ? 100
            : 0,
      ),
    ),
  )
  const visible = [...root.querySelectorAll('h2[id],h3[id]')].filter(
    (node) => node.getBoundingClientRect().top <= innerHeight * 0.28,
  )
  active.value = visible.at(-1)?.id || headings.value[0]?.id || ''
}
function schedule() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(calculate)
}
function headingNode(id) {
  return [...(markdown.value?.root?.querySelectorAll('[id]') || [])].find(
    (node) => node.id === id,
  )
}
async function select(id) {
  drawer.value = false
  await router.push({ hash: '#' + id })
  headingNode(id)?.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
    block: 'start',
  })
}
async function restoreAnchor() {
  await nextTick()
  if (route.hash) {
    let id
    try {
      id = decodeURIComponent(route.hash.slice(1))
    } catch {
      return
    }
    headingNode(id)?.scrollIntoView({ block: 'start' })
  }
  schedule()
}
function ready() {
  resizeObserver?.disconnect()
  if (markdown.value?.root) {
    resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(markdown.value.root)
  }
  restoreAnchor()
}
watch(() => route.hash, restoreAnchor)
watch(
  () => route.params.id,
  () => {
    progress.value = 0
    headings.value = []
    drawer.value = false
  },
)
onMounted(() => {
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
})
onUnmounted(() => {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
})
function back() {
  if (history.state?.back?.includes('/posts')) router.back()
  else router.push('/posts')
}
function scrollTop() {
  window.scrollTo({
    top: 0,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
  })
}
</script>
<template>
  <div
    class="read-progress"
    :style="{ width: progress + '%' }"
    aria-hidden="true"
  ></div>
  <div style="padding: 24px 0 16px">
    <button class="text-btn" @click="back">← 返回文章归档</button>
  </div>
  <ResourceState :loading="loading" :error="error" @retry="reload" />
  <div v-if="data" class="reading-layout">
    <article class="reading-article">
      <div class="eyebrow">
        {{ data.category?.name || 'FIELD NOTES' }} / 技术手记
      </div>
      <h1>{{ data.title }}</h1>
      <div class="reading-meta-bar">
        <time :datetime="data.publishedAt"
          >发布 {{ dateLabel(data.publishedAt) }}</time
        ><span>内容更新 {{ dateLabel(data.updatedAt) }}</span
        ><span v-if="data.estimatedReadMinutes"
          >预计 {{ data.estimatedReadMinutes }} 分钟</span
        ><span v-for="tool in data.sourceTools" :key="tool" class="badge"
          >来源 {{ tool }}</span
        ><VerificationBadge :verification="data.verification" />
      </div>
      <div v-if="data.excerpt" class="reading-lead">{{ data.excerpt }}</div>
      <MarkdownRenderer
        ref="markdown"
        :content="data.content"
        @headings="headings = $event"
        @ready="ready"
      />
      <div class="tags">
        <RouterLink
          v-for="tag in data.tags"
          :key="tag.id"
          :to="{ path: '/posts', query: { tag: tag.slug } }"
          class="tag"
          >{{ tag.name }}</RouterLink
        >
      </div>
      <section class="verification-box">
        <b>VERIFICATION BOUNDARY / 验证与边界声明</b
        ><VerificationBadge :verification="data.verification" />
        <p>
          {{
            data.verification?.summary ||
            '作者尚未提供公开验证说明。请结合实际环境核对本文结论。'
          }}
        </p>
        <span v-if="data.verification?.verifiedAt" class="mini"
          >验证记录时间 {{ dateLabel(data.verification.verifiedAt) }}</span
        >
      </section>
      <section v-if="related.data.value?.length" style="margin-top: 40px">
        <div class="section-head"><h2>继续翻阅</h2></div>
        <ArticleCard
          v-for="item in related.data.value"
          :key="item.id"
          :item="item"
        />
      </section>
      <p v-if="related.error.value" class="mini">
        关联文章暂不可用。<button class="text-btn" @click="related.reload">
          重试
        </button>
      </p>
    </article>
    <aside class="reading-toc">
      <div class="eyebrow">ON THIS PAGE / 目录</div>
      <ArticleToc :headings="headings" :active="active" @select="select" />
    </aside>
  </div>
  <div v-if="data" class="mobile-action-bar" aria-label="阅读工具">
    <span class="read-pct-badge" aria-label="阅读进度">{{ progress }}%</span
    ><button aria-label="打开文章目录" @click="drawer = true">☷</button
    ><button
      :aria-label="app.theme === 'light' ? '切换夜间主题' : '切换日间主题'"
      @click="app.toggleTheme"
    >
      {{ app.theme === 'light' ? '☾' : '☀' }}</button
    ><button aria-label="回到文章顶部" @click="scrollTop">↑</button>
  </div>
  <ModalDialog :open="drawer" title="文章目录" drawer @close="drawer = false"
    ><ArticleToc :headings="headings" :active="active" @select="select"
  /></ModalDialog>
</template>
