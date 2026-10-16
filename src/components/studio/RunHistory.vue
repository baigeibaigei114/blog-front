<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { studioApi } from '../../api/studio'
import { mockEnabled, ApiError } from '../../api'
import { useResource } from '../../composables/useResource'
import {
  businessDate,
  runStates,
  activeRun,
  terminalRun,
} from '../../utils/studio'
import { pageNumber } from '../../utils/content'
import StudioState from './StudioState.vue'
import StatusBadge from './StatusBadge.vue'
import ActionFeedback from './ActionFeedback.vue'
import RunDetail from './RunDetail.vue'
import Pagination from '../common/Pagination.vue'
import ModalDialog from '../common/ModalDialog.vue'
const route = useRoute(),
  router = useRouter()
const selected = ref(null),
  pending = ref(false),
  actionError = ref(null),
  message = ref(''),
  confirmStart = ref(false),
  date = ref(''),
  clockZone = ref('')
const knownActive = ref(false)
const params = computed(() => ({
  page: pageNumber(route.query.page),
  size: 10,
  status: route.query.status || undefined,
  from: route.query.from || undefined,
  to: route.query.to || undefined,
}))
const list = useResource(
  (signal) =>
    params.value.from && params.value.to && params.value.from > params.value.to
      ? Promise.reject(new Error('开始日期不能晚于结束日期'))
      : studioApi.runs(params.value, signal),
  () => route.query,
)
const settings = useResource(studioApi.settings)
const running = computed(
  () =>
    knownActive.value ||
    list.data.value?.data.some((run) => activeRun(run.status)),
)
function update(values) {
  const query = {
    ...route.query,
    ...values,
    tab: 'runs',
    page: values.page || 1,
  }
  delete query.action
  for (const key of Object.keys(query))
    if (query[key] === '' || query[key] == null) delete query[key]
  router.push({ path: '/admin/studio', query })
}
function askStart() {
  if (pending.value || running.value || !settings.data.value?.enabled) return
  try {
    clockZone.value = settings.data.value.timezone
    date.value = businessDate(clockZone.value)
    confirmStart.value = true
  } catch {
    actionError.value = new Error('服务端设置中的时区无效，请先核对发布设置')
  }
}
watch(
  [() => route.query.action, settings.data],
  () => {
    if (route.query.action === 'start' && settings.data.value) askStart()
  },
  { immediate: true },
)
async function start() {
  if (pending.value || actionError.value?.retryAt > Date.now()) return
  pending.value = true
  actionError.value = null
  message.value = ''
  try {
    const result = await studioApi.startRun(date.value)
    if (!/^[1-9]\d*$/.test(result?.id || ''))
      throw new ApiError(
        502,
        '服务端回执缺少批次 ID，请刷新运行记录核对，避免重复提交',
      )
    selected.value = String(result.id)
    knownActive.value = !terminalRun(result.status)
    confirmStart.value = false
    message.value =
      (mockEnabled ? '开发 mock：' : '') +
      '已取得服务端批次 ' +
      result.id +
      '。请以运行详情的状态与输出为准。'
    list.reload()
  } catch (failure) {
    actionError.value = failure
  } finally {
    pending.value = false
  }
}
function authenticated() {
  actionError.value = null
  settings.reload()
  list.reload()
}
function onRunChanged(value) {
  knownActive.value = activeRun(value.status)
  if (terminalRun(value.status)) list.reload()
}
</script>
<template>
  <div class="studio-banner">
    <div>
      <h2>每日发布记录</h2>
      <p>结果以服务端批次为准，同日重复请求返回原批次。</p>
    </div>
    <button
      class="primary"
      :disabled="pending || running || !settings.data.value?.enabled"
      @click="askStart"
    >
      立即整理
    </button>
  </div>
  <p v-if="settings.data.value && !settings.data.value.enabled" class="notice">
    自动整理已关闭。需要启用时，请在发布设置中核对并保存；文章仍可手动编辑发布。
  </p>
  <StudioState :error="settings.error.value" @retry="settings.reload" />
  <ActionFeedback
    :error="actionError"
    :message="message"
    @authenticated="authenticated"
  />
  <form class="filter-shelf" @submit.prevent="list.reload">
    <label
      >运行状态<select
        :value="params.status || ''"
        @change="update({ status: $event.target.value })"
      >
        <option value="">全部状态</option>
        <option v-for="(label, value) in runStates" :key="value" :value="value">
          {{ label }}
        </option>
      </select></label
    >
    <label
      >开始日期<input
        type="date"
        :value="params.from"
        @change="update({ from: $event.target.value })" /></label
    ><label
      >结束日期<input
        type="date"
        :value="params.to"
        @change="update({ to: $event.target.value })"
    /></label>
    <button
      type="button"
      class="secondary"
      @click="update({ status: undefined, from: undefined, to: undefined })"
    >
      清除筛选</button
    ><button class="secondary" type="submit">刷新记录</button>
  </form>
  <StudioState
    :loading="list.loading.value"
    :error="list.error.value"
    :empty="list.data.value?.data.length === 0"
    empty-text="当前日期和状态下没有运行记录。"
    @retry="list.reload"
  />
  <article
    v-for="run in list.data.value?.data"
    :key="run.id"
    class="capture-row"
  >
    <div>
      <div class="tags">
        <StatusBadge :status="run.status" run /><span class="mini"
          >{{ run.businessDate }} / attempt {{ run.attempt }}</span
        >
      </div>
      <h3>批次 {{ run.id }}</h3>
      <p class="mini">
        候选 {{ run.counts?.candidate ?? '—' }} · 暂缓
        {{ run.counts?.held ?? '—' }} · 输出 {{ run.counts?.output ?? '—' }}
      </p>
    </div>
    <button
      class="secondary"
      :aria-label="'查看批次 ' + run.id"
      @click="selected = String(run.id)"
    >
      查看运行详情
    </button>
  </article>
  <Pagination
    :page="params.page"
    :pages="list.data.value?.pages || 0"
    @change="update({ page: $event })"
  />
  <RunDetail
    v-if="selected"
    :key="selected"
    :id="selected"
    @changed="onRunChanged"
  />
  <ModalDialog
    :open="confirmStart"
    title="立即整理当天片段"
    @close="!pending && (confirmStart = false)"
  >
    <p>
      提交业务日期 {{ date }}（{{
        clockZone
      }}）的整理请求。服务端可能返回已有批次；浏览器不会创建定时发布任务。
    </p>
    <ActionFeedback :error="actionError" />
    <div class="actions">
      <button class="primary" :disabled="pending" @click="start">
        {{ pending ? '正在取得批次…' : '确认提交整理' }}</button
      ><button
        class="secondary"
        :disabled="pending"
        @click="confirmStart = false"
      >
        取消
      </button>
    </div>
  </ModalDialog>
</template>
