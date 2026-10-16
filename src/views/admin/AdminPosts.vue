<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminApi, mockEnabled } from '../../api'
import { useResource } from '../../composables/useResource'
import { pageNumber } from '../../utils/content'
import ResourceState from '../../components/common/ResourceState.vue'
import Pagination from '../../components/common/Pagination.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
const route = useRoute(),
  router = useRouter()
const params = computed(() => ({
  page: pageNumber(route.query.page),
  size: 10,
  kind: route.query.kind || 'ALL',
  status: route.query.status || undefined,
  q: route.query.q || undefined,
}))
const { data, loading, error, reload } = useResource(
  () => adminApi.posts(params.value),
  () => route.query,
)
const keyword = ref(String(route.query.q || '')),
  deleting = ref(null),
  pending = ref(false),
  actionError = ref(null),
  message = ref('')
function update(values) {
  router.push({ path: '/admin/posts', query: { ...route.query, ...values } })
}
function askDelete(post) {
  deleting.value = post
  actionError.value = null
}
async function remove() {
  if (pending.value) return
  pending.value = true
  actionError.value = null
  try {
    await adminApi.delete(deleting.value.id, deleting.value.version)
    deleting.value = null
    message.value = (mockEnabled ? '开发 mock：' : '') + '内容已删除'
    await reload()
  } catch (failure) {
    actionError.value = failure
  } finally {
    pending.value = false
  }
}
const labels = { DRAFT: '草稿', PUBLISHED: '有公开版本', ARCHIVED: '已撤回' }
</script>
<template>
  <div class="section-head">
    <div>
      <span class="eyebrow">CONTENT / 内容管理</span>
      <h1 style="font-size: 32px">每一个版本，都有边界。</h1>
    </div>
    <RouterLink class="primary" to="/admin/new">＋ 新建草稿</RouterLink>
  </div>
  <form class="filter-shelf" @submit.prevent="update({ q: keyword, page: 1 })">
    <label class="search-field"
      >查找内容<input
        v-model="keyword"
        maxlength="100"
        type="search"
        placeholder="输入关键词后回车" /></label
    ><label
      >类型<select
        :value="params.kind"
        @change="update({ kind: $event.target.value, page: 1 })"
      >
        <option value="ALL">文章与日志</option>
        <option value="ARTICLE">文章</option>
        <option value="NOTE">日志</option>
      </select></label
    ><label
      >状态<select
        :value="params.status || ''"
        @change="update({ status: $event.target.value || undefined, page: 1 })"
      >
        <option value="">全部状态</option>
        <option value="DRAFT">草稿</option>
        <option value="PUBLISHED">有公开版本</option>
        <option value="ARCHIVED">已撤回</option>
      </select></label
    ><button class="secondary">查找</button>
  </form>
  <p v-if="message" class="notice" role="status">{{ message }}</p>
  <ResourceState
    :loading="loading"
    :error="error"
    :empty="data?.data.length === 0"
    @retry="reload"
  />
  <article v-for="post in data?.data" :key="post.id" class="admin-row">
    <span class="mini"
      >{{ post.kind === 'NOTE' ? '日志' : '文章' }} /
      {{ labels[post.status] || post.status }} / v{{ post.version }}</span
    >
    <h2>
      <RouterLink :to="'/admin/edit/' + post.id">{{
        post.title || '未命名'
      }}</RouterLink>
    </h2>
    <p class="muted">{{ post.excerpt }}</p>
    <div class="actions">
      <RouterLink class="secondary" :to="'/admin/edit/' + post.id"
        >编辑草稿</RouterLink
      ><span v-if="post.publishedRevisionId" class="mini"
        >公开修订 {{ post.publishedRevisionId }} ·
        {{
          post.draftRevisionId === post.publishedRevisionId
            ? '与草稿一致'
            : '草稿含未发布修改'
        }}</span
      ><button
        class="text-btn"
        @click="askDelete(post)"
      >
        删除
      </button>
    </div>
  </article>
  <Pagination
    :page="params.page"
    :pages="data?.pages || 0"
    @change="update({ page: $event })"
  />
  <ModalDialog
    :open="!!deleting"
    title="删除内容"
    @close="!pending && (deleting = null)"
    ><p>删除「{{ deleting?.title }}」后，所有公开入口将不再可见。</p>
    <p v-if="actionError" class="error-message" role="alert">
      {{ actionError.message
      }}{{
        actionError.status === 409 ? '；请关闭此窗口并刷新列表后核对。' : ''
      }}
    </p>
    <div class="actions">
      <button
        class="primary"
        :disabled="pending || actionError?.status === 409"
        @click="remove"
      >
        {{ pending ? '正在删除…' : '确认删除' }}</button
      ><button class="secondary" :disabled="pending" @click="deleting = null">
        取消
      </button>
    </div></ModalDialog
  >
</template>
