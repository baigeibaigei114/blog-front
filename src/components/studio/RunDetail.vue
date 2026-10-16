<script setup>
import { computed, ref, watch } from 'vue'
import { studioApi } from '../../api/studio'
import { mockEnabled } from '../../api'
import { useRunDetail } from '../../composables/useRunDetail'
import { privateTime, terminalRun } from '../../utils/studio'
import ModalDialog from '../common/ModalDialog.vue'
import ResourceState from '../common/ResourceState.vue'
import StatusBadge from './StatusBadge.vue'
import ActionFeedback from './ActionFeedback.vue'
const emit = defineEmits(['changed'])
const props = defineProps({ id: String })
const id = computed(() => props.id)
const { data, error, loading, polling, reload } = useRunDetail(id)
const pending = ref(false),
  actionError = ref(null),
  message = ref(''),
  confirmRetry = ref(false)
watch(data, (value) => {
  if (value) emit('changed', value)
})
async function retry() {
  if (
    pending.value ||
    actionError.value?.retryAt > Date.now() ||
    data.value?.status !== 'FAILED' ||
    !data.value?.canRetry
  )
    return
  pending.value = true
  actionError.value = null
  message.value = ''
  try {
    await studioApi.retryRun(props.id, data.value.attempt)
    confirmRetry.value = false
    message.value =
      (mockEnabled ? '开发 mock：' : '') +
      '重试请求已响应，正在读取服务端批次状态。'
    await reload()
  } catch (failure) {
    actionError.value = failure
    confirmRetry.value = false
  } finally {
    pending.value = false
  }
}
function authenticated() {
  actionError.value = null
  reload()
}
function refresh() {
  actionError.value = null
  reload()
}
watch(id, () => {
  actionError.value = null
  message.value = ''
  confirmRetry.value = false
})
const outputPath = (output) => {
  if (
    !/^[1-9]\d*$/.test(output.postId || '') ||
    !['ARTICLE', 'NOTE'].includes(output.kind)
  )
    return null
  // Navigate with the canonical content contract; never execute an arbitrary output URL.
  return output.kind === 'NOTE'
    ? { path: '/notes', query: { note: output.postId } }
    : '/posts/' + output.postId
}
</script>
<template>
  <section class="run-detail studio-section" aria-label="运行详情">
    <div class="section-head">
      <h2>批次 {{ id }}</h2>
      <button class="secondary" :disabled="loading || pending" @click="refresh">
        刷新运行状态
      </button>
    </div>
    <ResourceState
      :loading="loading && !data"
      :error="!data ? error : null"
      @retry="refresh"
    />
    <ActionFeedback
      :error="actionError || (data ? error : null)"
      :message="message"
      @authenticated="authenticated"
    />
    <p v-if="data && error" class="notice">
      更新失败，已停止轮询。以下保留上次读取的记录，请手动刷新核对。
    </p>
    <template v-if="data">
      <div class="actions">
        <StatusBadge :status="data.status" run /><span class="mini"
          >业务日期 {{ data.businessDate }} / attempt {{ data.attempt }}</span
        >
      </div>
      <p class="mini" aria-live="polite">
        {{
          polling
            ? '每 3 秒读取服务端状态，离开页面停止。'
            : terminalRun(data.status)
              ? '已到终态，轮询已停止。'
              : '当前未轮询。'
        }}
      </p>
      <dl class="run-times">
        <div
          v-for="(label, key) in {
            scheduledFor: '计划时间',
            cutoffAt: '收集截止',
            startedAt: '开始时间',
            finishedAt: '结束时间',
          }"
          :key="key"
        >
          <dt>{{ label }}</dt>
          <dd>{{ privateTime(data[key]) }}</dd>
        </div>
      </dl>
      <div class="studio-stats">
        <div
          v-for="(label, key) in {
            candidate: '候选片段',
            publishedCapture: '已消费',
            held: '暂缓',
            output: '公开输出',
          }"
          :key="key"
          class="stat-box"
        >
          <strong>{{ data.counts?.[key] ?? '—' }}</strong
          ><small>{{ label }}</small>
        </div>
      </div>
      <p v-if="data.errorCode" class="error-message">
        运行错误：{{ data.errorCode }}
      </p>
      <div v-if="data.outputs?.length" class="studio-section">
        <h3>公开结果</h3>
        <div class="actions">
          <template v-for="(output, index) in data.outputs" :key="index"
            ><RouterLink
              v-if="outputPath(output)"
              class="secondary"
              :to="outputPath(output)"
              >查看{{ output.kind === 'NOTE' ? '日志' : '文章' }}
              {{ output.postId }} ↗</RouterLink
            ><span v-else class="error-message"
              >结果链接字段不完整，未生成跳转。</span
            ></template
          >
        </div>
      </div>
      <div
        class="studio-table-scroll"
        tabindex="0"
        aria-label="片段运行结果，可横向滚动"
      >
        <table v-if="data.items?.length" class="studio-table">
          <thead>
            <tr>
              <th>片段</th>
              <th>修订</th>
              <th>状态</th>
              <th>原因</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in data.items"
              :key="item.captureId + '-' + index"
            >
              <td>{{ item.captureId }}</td>
              <td>{{ item.revisionId }}</td>
              <td>{{ item.status }}</td>
              <td>{{ item.reasonCode || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!data.items?.length" class="mini">服务端没有返回片段明细。</p>
      <button
        v-if="data.status === 'FAILED' && data.canRetry"
        class="primary"
        :disabled="pending || loading || actionError?.status === 409"
        @click="confirmRetry = true"
      >
        重试失败批次
      </button>
      <p v-else-if="data.status === 'FAILED'" class="mini">
        服务端标记该批次当前不可重试。
      </p>
    </template>
    <ModalDialog
      :open="confirmRetry"
      title="重试失败批次"
      @close="!pending && (confirmRetry = false)"
    >
      <p>
        重试批次 {{ id }} 的 attempt
        {{
          data?.attempt
        }}。服务端会校验当前状态并重新入队，不新建第二个业务日期批次。
      </p>
      <div class="actions">
        <button class="primary" :disabled="pending" @click="retry">
          {{ pending ? '正在提交…' : '确认重试' }}</button
        ><button
          class="secondary"
          :disabled="pending"
          @click="confirmRetry = false"
        >
          取消
        </button>
      </div>
    </ModalDialog>
  </section>
</template>
