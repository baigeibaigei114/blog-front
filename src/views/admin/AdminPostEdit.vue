<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { adminApi, publicApi, mockEnabled } from '../../api'
import { useAdminStore } from '../../stores/admin'
import { useResource } from '../../composables/useResource'
import { dateLabel } from '../../utils/content'
import MarkdownRenderer from '../../components/content/MarkdownRenderer.vue'
import ResourceState from '../../components/common/ResourceState.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import Pagination from '../../components/common/Pagination.vue'
const route = useRoute(),
  router = useRouter(),
  admin = useAdminStore()
const blank = () => ({
  title: '',
  content: '',
  excerpt: '',
  kind: 'ARTICLE',
  categoryId: null,
  tagIds: [],
  pinned: false,
  sourceTools: [],
  journalDate: null,
  topics: [],
})
const form = ref(blank()),
  baseline = ref(JSON.stringify(blank())),
  id = ref(route.params.id || null),
  version = ref(null),
  revisionId = ref(null),
  publishedId = ref(null)
const loading = ref(false),
  error = ref(null),
  pending = ref(false),
  message = ref(''),
  mode = ref('write'),
  confirmAction = ref(null)
const history = ref(null),
  historyError = ref(null),
  revisionPreview = ref(null),
  historyLoading = ref(false),
  selectedRevision = ref(null)
const reauthPassword = ref(''),
  topicInput = ref('')
const initialized = ref(!id.value)
const dirty = computed(() => JSON.stringify(form.value) !== baseline.value)
const taxonomy = useResource((signal) =>
  Promise.all([publicApi.categories(signal), publicApi.tags(signal)]),
)
const sourceOptions = ['CODEX', 'CLAUDE', 'GEMINI', 'MANUAL', 'OTHER']
watch(
  () => form.value.kind,
  (kind) => {
    if (kind === 'ARTICLE') {
      form.value.journalDate = null
      form.value.topics = []
      topicInput.value = ''
    }
  },
)
function apply(result) {
  form.value = Object.fromEntries(
    Object.keys(blank()).map((key) => [key, result.draft[key] ?? blank()[key]]),
  )
  form.value.kind = result.kind
  version.value = result.version
  revisionId.value = result.draftRevisionId
  publishedId.value = result.publishedRevisionId
  baseline.value = JSON.stringify(form.value)
  topicInput.value = form.value.topics.join(', ')
}
async function load() {
  if (!id.value) return
  loading.value = true
  error.value = null
  try {
    apply(await adminApi.post(id.value))
    initialized.value = true
  } catch (failure) {
    error.value = failure
  } finally {
    loading.value = false
  }
}
function validate() {
  if (!form.value.title.trim() || form.value.title.length > 200)
    return '标题需为 1–200 字'
  const bytes = new TextEncoder().encode(form.value.content).length
  if (!form.value.content.trim() || bytes > 128 * 1024)
    return '正文需为 1–128 KiB UTF-8'
  if (form.value.excerpt.length > 500) return '摘要最多 500 字'
  if (form.value.tagIds.length > 20) return '标签最多 20 个'
  if (
    form.value.kind === 'NOTE' &&
    !/^\d{4}-\d{2}-\d{2}$/.test(form.value.journalDate || '')
  )
    return '日志必须选择业务日期'
  if (
    form.value.topics.length > 20 ||
    form.value.topics.some((t) => !t || t.length > 64)
  )
    return '主题最多 20 个，每个 1–64 字'
  return null
}
function syncTopics() {
  form.value.topics = [
    ...new Set(
      topicInput.value
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ]
}
watch(topicInput, syncTopics)
async function save() {
  if (pending.value) return
  syncTopics()
  const problem = validate()
  if (problem) {
    error.value = new Error(problem)
    return
  }
  pending.value = true
  error.value = null
  message.value = ''
  const snapshot = JSON.parse(JSON.stringify(form.value)),
    sent = JSON.stringify(snapshot)
  try {
    const result = id.value
      ? await adminApi.save(id.value, {
          ...snapshot,
          expectedVersion: version.value,
        })
      : await adminApi.create(snapshot)
    id.value = result.id
    version.value = result.version
    revisionId.value = result.revisionId
    baseline.value = sent
    message.value =
      (mockEnabled ? '开发 mock：' : '') +
      '草稿已保存。访客仍读取上次公开版本。'
    if (!route.params.id) {
      pending.value = false
      await router.replace('/admin/edit/' + id.value)
    }
  } catch (failure) {
    error.value = failure
  } finally {
    pending.value = false
  }
}
async function perform() {
  if (pending.value) return
  const action = confirmAction.value
  if (action === 'reload') {
    confirmAction.value = null
    await load()
    return
  }
  pending.value = true
  error.value = null
  message.value = ''
  try {
    if (action === 'publish') {
      const result = await adminApi.publish(id.value, {
        revisionId: revisionId.value,
        expectedVersion: version.value,
      })
      publishedId.value = result.publishedRevisionId
      version.value = result.version
      message.value =
        (mockEnabled ? '开发 mock：' : '') + '当前已保存版本已发布。'
    } else if (action === 'withdraw') {
      const result = await adminApi.withdraw(id.value, version.value)
      publishedId.value = null
      version.value = result.version
      message.value =
        (mockEnabled ? '开发 mock：' : '') + '公开版本已撤回，草稿保留。'
    }
    confirmAction.value = null
  } catch (failure) {
    error.value = failure
    confirmAction.value = null
  } finally {
    pending.value = false
  }
}
async function versions(page = 1) {
  historyLoading.value = true
  historyError.value = null
  try {
    history.value = await adminApi.revisions(id.value, { page, size: 10 })
  } catch (failure) {
    historyError.value = failure
  } finally {
    historyLoading.value = false
  }
}
async function inspect(revision) {
  selectedRevision.value = revision
  historyLoading.value = true
  historyError.value = null
  revisionPreview.value = null
  try {
    revisionPreview.value = await adminApi.revision(
      id.value,
      revision.revisionId,
    )
  } catch (failure) {
    historyError.value = failure
  } finally {
    historyLoading.value = false
  }
}
async function reauthenticate() {
  pending.value = true
  try {
    await admin.login(reauthPassword.value)
    reauthPassword.value = ''
    error.value = null
    message.value = '会话已恢复，编辑内容保留。请重新执行操作。'
  } catch (failure) {
    error.value = failure
  } finally {
    pending.value = false
  }
}
function beforeUnload(event) {
  if (dirty.value || pending.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onBeforeRouteLeave(() => {
  if (pending.value) return false
  if (dirty.value)
    return window.confirm('有未保存内容，确认离开并放弃这些修改？')
})
onMounted(() => {
  load()
  window.addEventListener('beforeunload', beforeUnload)
})
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
</script>
<template>
  <div class="section-head">
    <div>
      <span class="eyebrow"
        >WRITING DESK / {{ id ? '修订草稿' : '新建草稿' }}</span
      >
      <h1 style="font-size: 30px">把理解，慢慢写清楚。</h1>
    </div>
    <span class="badge" :class="{ warn: dirty }">{{
      dirty ? '有未保存修改' : '无未保存修改'
    }}</span>
  </div>
  <ResourceState
    :loading="loading"
    :error="initialized ? null : error"
    @retry="load"
  />
  <template v-if="!loading && initialized">
    <p v-if="message" class="notice" role="status">{{ message }}</p>
    <div v-if="error" class="error-message" role="alert">
      <p>{{ error.message }}</p>
      <p v-if="error.status === 409">
        版本冲突：输入已保留。请先复制需保留的内容，再重新加载服务端版本；不会覆盖另一页的修改。
      </p>
      <span v-if="error.requestId" class="mini"
        >请求编号 {{ error.requestId }}</span
      ><button
        v-if="error.status === 409"
        class="secondary"
        @click="confirmAction = 'reload'"
      >
        重新加载服务端版本
      </button>
      <form
        v-if="error.status === 401"
        class="filter-shelf"
        @submit.prevent="reauthenticate"
      >
        <label
          >重新登录以保留当前输入<input
            v-model="reauthPassword"
            type="password"
            autocomplete="current-password"
            required /></label
        ><button class="secondary" :disabled="pending">恢复会话</button>
      </form>
    </div>
    <p v-if="publishedId" class="mini">
      公开修订 {{ publishedId }} · 当前草稿修订 {{ revisionId }} · 聚合版本 v{{
        version
      }}<br />保存草稿不会改变访客看到的公开内容。修改正文后的新草稿默认未验证。
    </p>
    <form class="editor-form" @submit.prevent="save">
      <label
        >标题<input
          v-model="form.title"
          class="editor-title"
          maxlength="200"
          required
          :disabled="pending"
      /></label>
      <div class="form-grid">
        <label
          >内容类型<select v-model="form.kind" :disabled="!!id || pending">
            <option value="ARTICLE">文章</option>
            <option value="NOTE">学习日志</option>
          </select></label
        >
        <label
          >分类<select
            v-model="form.categoryId"
            :disabled="pending || taxonomy.loading.value"
          >
            <option :value="null">未分类</option>
            <option
              v-for="cat in taxonomy.data.value?.[0]"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select></label
        >
        <label v-if="form.kind === 'NOTE'"
          >日志日期（Asia/Shanghai）<input
            v-model="form.journalDate"
            type="date"
            required
            :disabled="pending"
        /></label>
        <label v-if="form.kind === 'NOTE'"
          >主题（逗号分隔）<input v-model="topicInput" :disabled="pending"
        /></label>
      </div>
      <p v-if="taxonomy.error.value" class="error-message">
        分类与标签加载失败，已有选择仍保留。<button
          type="button"
          class="text-btn"
          @click="taxonomy.reload"
        >
          重试
        </button>
      </p>
      <fieldset>
        <legend>标签（最多 20 个）</legend>
        <div class="tags">
          <label
            v-for="tag in taxonomy.data.value?.[1]"
            :key="tag.id"
            class="check"
            ><input
              v-model="form.tagIds"
              type="checkbox"
              :value="tag.id"
              :disabled="pending"
            />{{ tag.name }}</label
          ><span v-if="!taxonomy.data.value?.[1]?.length" class="mini"
            >暂无可选标签</span
          >
        </div>
      </fieldset>
      <fieldset>
        <legend>来源工具</legend>
        <div class="tags">
          <label v-for="source in sourceOptions" :key="source" class="check"
            ><input
              v-model="form.sourceTools"
              type="checkbox"
              :value="source"
              :disabled="pending"
            />{{ source }}</label
          >
        </div>
      </fieldset>
      <label class="check"
        ><input
          v-model="form.pinned"
          type="checkbox"
          :disabled="pending"
        />精选置顶</label
      >
      <label
        >摘要<textarea
          v-model="form.excerpt"
          maxlength="500"
          rows="3"
          :disabled="pending"
        ></textarea>
      </label>
      <div class="actions" aria-label="编辑模式">
        <button
          type="button"
          class="chip"
          :class="{ active: mode === 'write' }"
          :aria-pressed="mode === 'write'"
          @click="mode = 'write'"
        >
          Markdown 编写</button
        ><button
          type="button"
          class="chip"
          :class="{ active: mode === 'preview' }"
          :aria-pressed="mode === 'preview'"
          @click="mode = 'preview'"
        >
          安全预览
        </button>
      </div>
      <label v-show="mode === 'write'"
        >Markdown 正文<textarea
          v-model="form.content"
          class="markdown-input"
          spellcheck="false"
          :disabled="pending"
        ></textarea>
      </label>
      <div v-if="mode === 'preview'" class="editor-preview">
        <MarkdownRenderer :content="form.content" />
        <p v-if="!form.content" class="muted">输入正文后在这里预览。</p>
      </div>
      <div class="actions">
        <button class="primary" :disabled="pending || error?.status === 409">
          {{ pending ? '正在处理…' : '保存草稿' }}</button
        ><button
          type="button"
          class="secondary"
          :disabled="!id || dirty || pending || error?.status === 409"
          @click="confirmAction = 'publish'"
        >
          发布当前已保存版本</button
        ><button
          v-if="publishedId"
          type="button"
          class="secondary"
          :disabled="pending"
          @click="confirmAction = 'withdraw'"
        >
          撤回公开版</button
        ><button
          v-if="id"
          type="button"
          class="text-btn"
          :disabled="pending"
          @click="versions()"
        >
          查看版本记录
        </button>
      </div>
      <p v-if="dirty" class="mini">
        发布前请先保存草稿，核对安全预览与验证边界。
      </p>
    </form>
    <ResourceState
      :loading="historyLoading"
      :error="historyError"
      @retry="selectedRevision ? inspect(selectedRevision) : versions()"
    />
    <section v-if="history" style="margin-top: 36px">
      <div class="section-head">
        <h2>版本记录</h2>
        <span class="mini">仅预览历史修订</span>
      </div>
      <div class="actions">
        <button
          v-for="revision in history.data"
          :key="revision.revisionId"
          class="secondary"
          @click="inspect(revision)"
        >
          {{ revision.title }} / {{ dateLabel(revision.createdAt) }}
        </button>
      </div>
      <Pagination
        :page="history.page"
        :pages="history.pages"
        @change="versions($event)"
      /><MarkdownRenderer
        v-if="revisionPreview"
        :content="revisionPreview.content"
      />
    </section>
  </template>
  <ModalDialog
    :open="!!confirmAction"
    :title="
      confirmAction === 'publish'
        ? '发布当前版本'
        : confirmAction === 'withdraw'
          ? '撤回公开版'
          : '重新加载草稿'
    "
    @close="!pending && (confirmAction = null)"
  >
    <p v-if="confirmAction === 'publish'">
      将「{{ form.title }}」的已保存修订
      {{ revisionId }} 公开给所有读者。来源工具不代表已经验证。
    </p>
    <p v-else-if="confirmAction === 'withdraw'">
      撤回「{{ form.title }}」的公开版本，保留当前草稿与输入。
    </p>
    <p v-else>
      将丢弃本页输入，重新读取服务端最新草稿。请先复制需要保留的内容。
    </p>
    <div class="actions">
      <button class="primary" :disabled="pending" @click="perform">
        {{ pending ? '正在处理…' : '确认' }}</button
      ><button
        class="secondary"
        :disabled="pending"
        @click="confirmAction = null"
      >
        取消
      </button>
    </div>
  </ModalDialog>
</template>
