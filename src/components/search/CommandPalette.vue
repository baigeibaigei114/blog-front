<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { useAdminStore } from '../../stores/admin'
import { publicApi } from '../../api'
import { contentPath } from '../../utils/content'
import ModalDialog from '../common/ModalDialog.vue'
import HighlightText from './HighlightText.vue'
const app = useAppStore(),
  admin = useAdminStore(),
  router = useRouter()
const query = ref(''),
  kind = ref('ALL'),
  results = ref([]),
  selected = ref(0),
  loading = ref(false),
  error = ref(null)
let timer,
  controller,
  sequence = 0
const commands = computed(() =>
  [
    ...[
      ['/', '首页'],
      ['/posts', '文章归档'],
      ['/notes', '学习日志'],
      ['/projects', '项目实践'],
      ['/about', '关于刊物'],
    ].map(([path, title]) => ({
      title,
      type: '页面',
      action: () => router.push(path),
    })),
    {
      title: app.theme === 'light' ? '切换夜间主题' : '切换日间主题',
      type: '外观',
      action: app.toggleTheme,
    },
    ...(admin.isLoggedIn
      ? [
          {
            title: '内容管理',
            type: '管理员',
            action: () => router.push('/admin/posts'),
          },
          {
            title: '新建草稿',
            type: '管理员',
            action: () => router.push('/admin/new'),
          },
          {
            title: '学习收件箱',
            type: '管理员',
            action: () => router.push('/admin/studio'),
          },
          {
            title: '录入学习片段',
            type: '管理员',
            action: () => router.push('/admin/studio?tab=inbox&action=import'),
          },
          {
            title: '查看发布记录',
            type: '管理员',
            action: () => router.push('/admin/studio?tab=runs'),
          },
          {
            title: '立即整理当天片段',
            type: '管理员',
            action: () => router.push('/admin/studio?tab=runs&action=start'),
          },
          {
            title: '发布设置',
            type: '管理员',
            action: () => router.push('/admin/studio?tab=settings'),
          },
        ]
      : []),
  ].filter(
    (item) =>
      !query.value ||
      item.title.toLowerCase().includes(query.value.toLowerCase()),
  ),
)
const items = computed(() => [
  ...commands.value,
  ...results.value.map((item) => ({
    title: item.title,
    excerpt: item.excerpt,
    type: item.kind === 'NOTE' ? '日志' : '文章',
    action: () => router.push(contentPath(item)),
  })),
])
function cancel() {
  clearTimeout(timer)
  controller?.abort()
  sequence++
}
watch([query, kind, () => app.commandOpen], () => {
  cancel()
  selected.value = 0
  results.value = []
  error.value = null
  loading.value = false
  if (!app.commandOpen || !query.value.trim()) return
  const requestSequence = sequence
  loading.value = true
  timer = setTimeout(async () => {
    controller = new AbortController()
    try {
      const page = await publicApi.search(
        {
          q: query.value.trim().slice(0, 100),
          kind: kind.value,
          page: 1,
          size: 20,
        },
        controller.signal,
      )
      if (requestSequence === sequence) results.value = page.data
    } catch (failure) {
      if (requestSequence === sequence && !controller.signal.aborted)
        error.value = failure
    } finally {
      if (requestSequence === sequence) loading.value = false
    }
  }, 250)
})
watch(
  () => app.commandOpen,
  (open) => {
    if (open) {
      query.value = ''
      kind.value = 'ALL'
    }
  },
)
function run(item) {
  if (!item) return
  app.commandOpen = false
  item.action()
}
function keyboard(event) {
  if (
    !['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key) ||
    event.target.tagName === 'SELECT' ||
    event.isComposing
  )
    return
  if (event.key === 'Enter') {
    event.preventDefault()
    run(items.value[selected.value])
    return
  }
  event.preventDefault()
  const count = items.value.length
  selected.value = count
    ? (selected.value + (event.key === 'ArrowDown' ? 1 : -1) + count) % count
    : 0
}
watch(selected, () =>
  requestAnimationFrame(() =>
    document
      .getElementById('command-option-' + selected.value)
      ?.scrollIntoView({ block: 'nearest' }),
  ),
)
onUnmounted(cancel)
</script>
<template>
  <ModalDialog
    :open="app.commandOpen"
    title="搜索与命令"
    @close="app.commandOpen = false"
  >
    <div @keydown="keyboard">
      <label for="command-query" class="sr-only">搜索文章、日志或页面</label>
      <input
        id="command-query"
        v-model="query"
        class="cmd-input"
        maxlength="100"
        placeholder="搜索文章、日志或页面…"
        autofocus
        role="combobox"
        aria-controls="command-results"
        :aria-expanded="true"
        :aria-activedescendant="
          items.length ? 'command-option-' + selected : undefined
        "
        autocomplete="off"
      />
      <div class="filter-shelf">
        <label
          >内容类型<select v-model="kind">
            <option value="ALL">文章与日志</option>
            <option value="ARTICLE">文章</option>
            <option value="NOTE">日志</option>
          </select></label
        ><span class="mini">↑↓ 选择 · Enter 打开 · Esc 关闭</span>
      </div>
      <p v-if="loading" role="status">正在搜索…</p>
      <p v-if="error" class="error-message" role="alert">
        {{ error.message
        }}<button class="text-btn" @click="query = query + ' '">重试</button>
      </p>
      <div
        id="command-results"
        role="listbox"
        class="cmd-results"
        aria-label="命令与公开搜索结果"
      >
        <button
          v-for="(item, index) in items"
          :id="'command-option-' + index"
          :key="index"
          class="cmd-item"
          :class="{ focused: index === selected }"
          role="option"
          :aria-selected="index === selected"
          @click="run(item)"
          @mousemove="selected = index"
        >
          <span
            ><HighlightText :text="item.title" :query="query" /><small
              v-if="item.excerpt"
              ><HighlightText
                :text="item.excerpt"
                :query="query" /></small></span
          ><span class="badge">{{ item.type }}</span>
        </button>
      </div>
      <p v-if="!loading && !error && !items.length" role="status">
        没有匹配的公开内容。
      </p>
    </div>
  </ModalDialog>
</template>
