<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { studioApi } from '../../api/studio'
import { mockEnabled, ApiError } from '../../api'
import { useUnsavedChanges } from '../../composables/useUnsavedChanges'
import { privateTime } from '../../utils/studio'
import StudioState from './StudioState.vue'
import ActionFeedback from './ActionFeedback.vue'
import ModalDialog from '../common/ModalDialog.vue'
const form = ref(null),
  baseline = ref(''),
  version = ref(null),
  nextDueAt = ref(null),
  loading = ref(true),
  pending = ref(false),
  error = ref(null),
  loadError = ref(null),
  message = ref(''),
  confirmEnable = ref(false)
const dirty = computed(
  () => !!form.value && JSON.stringify(form.value) !== baseline.value,
)
const { canLeave } = useUnsavedChanges(dirty, pending)
let controller,
  disposed = false
function settingsForm(result) {
  if (
    !Number.isInteger(result?.version) ||
    result.version < 1 ||
    typeof result.enabled !== 'boolean' ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(result.localTime || '') ||
    typeof result.timezone !== 'string' ||
    !result.timezone ||
    !['SKIP_ITEM', 'HOLD_BATCH'].includes(result.failurePolicy) ||
    !Number.isInteger(result.maxPostsPerDay) ||
    result.maxPostsPerDay < 1 ||
    result.maxPostsPerDay > 3 ||
    !('nextDueAt' in result)
  )
    throw new ApiError(
      502,
      '设置响应缺少完整契约字段，请重新读取服务端版本核对',
    )
  return {
    enabled: result.enabled,
    localTime: result.localTime,
    timezone: result.timezone,
    failurePolicy: result.failurePolicy,
    maxPostsPerDay: result.maxPostsPerDay,
  }
}
async function load() {
  controller?.abort()
  controller = new AbortController()
  const requestController = controller
  loading.value = true
  loadError.value = null
  try {
    const result = await studioApi.settings(requestController.signal)
    const snapshot = settingsForm(result)
    if (
      disposed ||
      requestController !== controller ||
      requestController.signal.aborted
    )
      return
    form.value = snapshot
    version.value = result.version
    nextDueAt.value = result.nextDueAt
    baseline.value = JSON.stringify(form.value)
    error.value = null
  } catch (failure) {
    if (
      !disposed &&
      requestController === controller &&
      !requestController.signal.aborted
    )
      loadError.value = failure
  } finally {
    if (!disposed && requestController === controller) loading.value = false
  }
}
function validate() {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.value.localTime || ''))
    return '请选择有效的 HH:mm 时间'
  try {
    new Intl.DateTimeFormat('zh-CN', { timeZone: form.value.timezone }).format()
  } catch {
    return '请输入有效 IANA 时区；最终支持范围由服务端校验'
  }
  if (
    !Number.isInteger(form.value.maxPostsPerDay) ||
    form.value.maxPostsPerDay < 1 ||
    form.value.maxPostsPerDay > 3
  )
    return '每日上限必须为 1–3 的整数'
}
function submit() {
  if (pending.value || error.value?.retryAt > Date.now()) return
  const problem = validate()
  if (problem) {
    error.value = new Error(problem)
    return
  }
  if (form.value.enabled && !JSON.parse(baseline.value).enabled) {
    confirmEnable.value = true
    return
  }
  save()
}
async function save() {
  if (pending.value) return
  confirmEnable.value = false
  pending.value = true
  error.value = null
  message.value = ''
  const snapshot = JSON.parse(JSON.stringify(form.value))
  try {
    const result = await studioApi.saveSettings({
      ...snapshot,
      expectedVersion: version.value,
    })
    form.value = settingsForm(result)
    version.value = result.version
    nextDueAt.value = result.nextDueAt
    baseline.value = JSON.stringify(form.value)
    message.value =
      (mockEnabled ? '开发 mock：' : '') + '发布设置已由接口保存。'
  } catch (failure) {
    error.value = failure
  } finally {
    pending.value = false
  }
}
async function refresh() {
  if (canLeave()) await load()
}
function authenticated() {
  error.value = null
  message.value = '会话已恢复，输入保留。请重新保存。'
  if (!form.value) load()
}
onMounted(load)
onUnmounted(() => {
  disposed = true
  controller?.abort()
})
</script>
<template>
  <div class="section-head">
    <h2>自动发布规则</h2>
    <span class="mini"
      >服务端设置 / {{ version ? 'v' + version : '未加载' }}</span
    >
  </div>
  <p class="muted">
    设置只在服务端成功保存后生效。停止自动整理后，仍可手动编辑和发布文章。
  </p>
  <StudioState :loading="loading" :error="loadError" @retry="load" />
  <ActionFeedback
    :error="error"
    :message="message"
    @authenticated="authenticated"
  />
  <form
    v-if="form && !loading"
    class="editor-form settings-form"
    @submit.prevent="submit"
  >
    <label class="check"
      ><input
        v-model="form.enabled"
        type="checkbox"
        :disabled="pending"
      />启用每日自动整理与发布</label
    >
    <div class="form-grid">
      <label
        >每日整理时间<input
          v-model="form.localTime"
          type="time"
          required
          :disabled="pending"
      /></label>
      <label
        >运行时区<input
          v-model="form.timezone"
          placeholder="Asia/Shanghai"
          required
          :disabled="pending"
      /></label>
      <label
        >异常策略<select v-model="form.failurePolicy" :disabled="pending">
          <option value="SKIP_ITEM">跳过异常条目，继续合格内容</option>
          <option value="HOLD_BATCH">异常时暂缓整批，零发布</option>
        </select></label
      >
      <label
        >每日最多生成篇数<input
          v-model.number="form.maxPostsPerDay"
          type="number"
          min="1"
          max="3"
          step="1"
          required
          :disabled="pending"
      /></label>
    </div>
    <p class="mini">
      下一次计划（已保存设置）：{{ privateTime(nextDueAt) }} · 展示时区
      Asia/Shanghai
    </p>
    <div class="actions">
      <button
        class="primary"
        :disabled="pending || !dirty || error?.status === 409"
      >
        {{ pending ? '正在保存…' : '保存发布设置' }}</button
      ><button
        type="button"
        class="secondary"
        :disabled="pending"
        @click="refresh"
      >
        重新读取服务端版本</button
      ><span class="badge" :class="{ warn: dirty }">{{
        dirty ? '有未保存修改' : '与已保存设置一致'
      }}</span>
    </div>
  </form>
  <ModalDialog
    :open="confirmEnable"
    title="启用自动整理与发布"
    @close="confirmEnable = false"
  >
    <p>
      将保存启用开关。服务端会按 {{ form?.timezone }} 的
      {{ form?.localTime }} 对合格片段自动整理发布，单日最多
      {{ form?.maxPostsPerDay }} 篇。
    </p>
    <p>
      请核对时间、异常策略与可公开内容。该确认只保存设置，不在浏览器创建定时任务。
    </p>
    <div class="actions">
      <button class="primary" :disabled="pending" @click="save">
        确认保存并启用</button
      ><button class="secondary" @click="confirmEnable = false">取消</button>
    </div>
  </ModalDialog>
</template>
