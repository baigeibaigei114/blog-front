<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { studioApi } from '../../api/studio'
import { mockEnabled, ApiError } from '../../api'
import { useUnsavedChanges } from '../../composables/useUnsavedChanges'
import {
  mutableCapture,
  captureProblem,
  captureStates,
  sourceOptions,
  verificationClaims,
} from '../../utils/studio'
import ModalDialog from '../common/ModalDialog.vue'
import ResourceState from '../common/ResourceState.vue'
import MarkdownRenderer from '../content/MarkdownRenderer.vue'
import StatusBadge from './StatusBadge.vue'
import ActionFeedback from './ActionFeedback.vue'
const props = defineProps({ id: String })
const emit = defineEmits(['close', 'saved'])
const empty = () => ({
  externalId: 'manual-' + crypto.randomUUID(),
  source: 'MANUAL',
  title: '',
  summary: '',
  body: '',
  topic: '',
  sourceUrl: '',
  verificationClaim: 'UNVERIFIED',
  evidenceRefs: [],
})
const form = ref(empty()),
  record = ref(null),
  loading = ref(!!props.id),
  pending = ref(false),
  error = ref(null),
  message = ref(''),
  preview = ref(false),
  confirmation = ref(''),
  reason = ref(''),
  evidence = ref('')
const baseline = ref(JSON.stringify(form.value)),
  initialized = ref(!props.id)
const dirty = computed(() => JSON.stringify(form.value) !== baseline.value)
const { canLeave } = useUnsavedChanges(dirty, pending)
const readOnly = computed(
  () =>
    (record.value && !props.id) ||
    (props.id &&
      (!record.value || !['READY', 'HELD'].includes(record.value.status))),
)
let controller = new AbortController(),
  disposed = false
function apply(result) {
  if (
    !result ||
    !Number.isInteger(result.version) ||
    result.version < 1 ||
    typeof result.title !== 'string' ||
    typeof result.body !== 'string' ||
    !result.externalId ||
    !sourceOptions.includes(result.source) ||
    !Object.hasOwn(captureStates, result.status)
  )
    throw new ApiError(502, '片段详情响应缺少契约字段，未开放编辑')
  record.value = result
  form.value = {
    externalId: result.externalId,
    source: result.source,
    title: result.title,
    summary: result.summary || '',
    body: result.body,
    topic: result.topic || '',
    sourceUrl: result.sourceUrl || '',
    verificationClaim: result.verificationClaim || 'UNVERIFIED',
    evidenceRefs: result.evidenceRefs || [],
  }
  evidence.value = form.value.evidenceRefs.join('\n')
  baseline.value = JSON.stringify(form.value)
  initialized.value = true
}
async function load() {
  if (!props.id) return
  controller.abort()
  controller = new AbortController()
  const requestController = controller
  loading.value = true
  error.value = null
  try {
    const value = await studioApi.capture(props.id, requestController.signal)
    if (
      !disposed &&
      requestController === controller &&
      !requestController.signal.aborted
    )
      apply(value)
  } catch (failure) {
    if (
      !disposed &&
      requestController === controller &&
      !requestController.signal.aborted
    )
      error.value = failure
  } finally {
    if (!disposed && requestController === controller) loading.value = false
  }
}
async function refresh() {
  if (canLeave()) {
    baseline.value = JSON.stringify(form.value)
    await load()
  }
}
function close() {
  if (!canLeave()) return
  baseline.value = JSON.stringify(form.value)
  emit('close')
}
function syncEvidence() {
  form.value.evidenceRefs = [
    ...new Set(
      evidence.value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ]
}
function retryAllowed() {
  return !pending.value && !(error.value?.retryAt > Date.now())
}
async function save() {
  if (!retryAllowed() || readOnly.value) return
  syncEvidence()
  const problem = captureProblem(form.value)
  if (problem) {
    error.value = new Error(problem)
    return
  }
  const body = props.id
    ? { ...mutableCapture(form.value), expectedVersion: record.value.version }
    : {
        externalId: form.value.externalId,
        source: form.value.source,
        ...mutableCapture(form.value),
      }
  pending.value = true
  error.value = null
  message.value = ''
  try {
    const result = props.id
      ? await studioApi.saveCapture(props.id, body)
      : await studioApi.importCapture(body)
    if (
      !Object.hasOwn(captureStates, result?.status) ||
      !Number.isInteger(result.version) ||
      (!props.id && !/^[1-9]\d*$/.test(result.id || ''))
    )
      throw new ApiError(502, '服务端回执不完整，请刷新收件箱核对结果')
    if (props.id)
      record.value = {
        ...record.value,
        ...mutableCapture(form.value),
        version: result.version,
        status: result.status,
        validationErrors: result.validationErrors || [],
      }
    else record.value = { ...form.value, ...result }
    baseline.value = JSON.stringify(form.value)
    const prefix = mockEnabled ? '开发 mock：' : ''
    message.value =
      prefix +
      (result.duplicate
        ? '已接收过相同 externalId，返回原条目。'
        : '片段已保存到私有收件箱。') +
      ' 当前状态：' +
      result.status +
      '。这不代表已经公开发布。'
    emit('saved', result)
    if (!props.id) initialized.value = true
  } catch (failure) {
    error.value = failure
  } finally {
    pending.value = false
  }
}
async function perform() {
  if (!retryAllowed() || !props.id || dirty.value) return
  const action = confirmation.value
  if (action === 'hold' && !reason.value.trim()) {
    error.value = new Error('请填写暂缓原因')
    return
  }
  pending.value = true
  error.value = null
  message.value = ''
  try {
    const version = record.value.version
    if (action === 'delete') {
      await studioApi.remove(props.id, version)
      baseline.value = JSON.stringify(form.value)
      emit('saved', null)
      pending.value = false
      emit('close')
      return
    }
    const result =
      action === 'hold'
        ? await studioApi.hold(props.id, {
            reason: reason.value.trim(),
            expectedVersion: version,
          })
        : await studioApi.release(props.id, version)
    if (
      !Object.hasOwn(captureStates, result?.status) ||
      !Number.isInteger(result.version)
    )
      throw new ApiError(502, '服务端状态回执不完整，请刷新核对')
    record.value = {
      ...record.value,
      ...result,
      validationErrors: result.validationErrors || [],
    }
    message.value =
      (mockEnabled ? '开发 mock：' : '') +
      (action === 'release'
        ? '重新校验已响应，当前状态：'
        : '暂缓已保存，当前状态：') +
      result.status +
      '。片段仍为私有。'
    confirmation.value = ''
    emit('saved', result)
  } catch (failure) {
    error.value = failure
  } finally {
    pending.value = false
  }
}
function authenticated() {
  error.value = null
  message.value = '会话已恢复。输入保留，请重新执行操作。'
  if (!initialized.value) load()
}
onMounted(load)
onUnmounted(() => {
  disposed = true
  controller.abort()
})
</script>
<template>
  <ModalDialog
    class="studio-editor-dialog"
    :open="true"
    :title="id ? '私有片段详情' : '录入学习片段'"
    @close="close"
  >
    <p class="mini">PRIVATE CAPTURE / 仅管理员可见</p>
    <ActionFeedback
      :error="error"
      :message="message"
      @authenticated="authenticated"
    />
    <ResourceState
      :loading="loading"
      :error="!initialized ? error : null"
      @retry="load"
    />
    <template v-if="initialized && !loading">
      <div v-if="record" class="actions">
        <StatusBadge :status="record.status" /><span class="mini"
          >版本 {{ record.version }}</span
        >
      </div>
      <p v-if="readOnly" class="notice">
        {{
          record?.status === 'INCLUDED'
            ? '该片段已消费，请在内容管理中修订已发布内容。'
            : '该状态暂不允许编辑，可手动刷新校验结果。'
        }}
      </p>
      <p v-if="record?.validationErrors?.length" class="error-message">
        服务端校验信息：<span
          v-for="(item, index) in record.validationErrors"
          :key="index"
          class="studio-error-line"
          >{{ typeof item === 'string' ? item : JSON.stringify(item) }}</span
        >
      </p>
      <form class="editor-form" @submit.prevent="save">
        <div class="form-grid">
          <label
            >来源工具<select
              v-model="form.source"
              :disabled="!!id || !!record || pending"
            >
              <option
                v-for="source in sourceOptions"
                :key="source"
                :value="source"
              >
                {{ source }}
              </option>
            </select></label
          >
          <label
            >主题<input
              v-model="form.topic"
              maxlength="64"
              :disabled="readOnly || pending"
          /></label>
        </div>
        <p class="mini">
          稳定投递编号：{{ form.externalId
          }}<br />创建后来源和投递编号不变；超时后重试复用同一编号。
        </p>
        <label
          >片段标题<input
            v-model="form.title"
            maxlength="200"
            required
            :disabled="readOnly || pending"
        /></label>
        <label
          >片段摘要<textarea
            v-model="form.summary"
            maxlength="500"
            rows="2"
            :disabled="readOnly || pending"
          ></textarea>
        </label>
        <label
          >私有来源链接<input
            v-model="form.sourceUrl"
            type="url"
            placeholder="https://…"
            :disabled="readOnly || pending"
        /></label>
        <label
          >工具验证声明<select
            v-model="form.verificationClaim"
            :disabled="readOnly || pending"
          >
            <option
              v-for="(label, value) in verificationClaims"
              :key="value"
              :value="value"
            >
              {{ label }}
            </option>
          </select></label
        >
        <p class="mini">
          声明与发布验证记录不同。“工具声称实测”不会自动获得公开 TESTED 徽章。
        </p>
        <label
          >私有证据引用（每行一个）<textarea
            v-model="evidence"
            rows="2"
            :disabled="readOnly || pending"
            @input="syncEvidence"
          ></textarea>
        </label>
        <div class="actions">
          <button
            type="button"
            class="chip"
            :class="{ active: !preview }"
            :aria-pressed="!preview"
            @click="preview = false"
          >
            编写片段</button
          ><button
            type="button"
            class="chip"
            :class="{ active: preview }"
            :aria-pressed="preview"
            @click="preview = true"
          >
            安全预览
          </button>
        </div>
        <label v-show="!preview"
          >片段正文<textarea
            v-model="form.body"
            rows="14"
            class="studio-body-input"
            :disabled="readOnly || pending"
          ></textarea>
        </label>
        <div v-if="preview" class="editor-preview">
          <MarkdownRenderer :content="form.body" />
        </div>
        <div class="actions">
          <button
            v-if="!readOnly && !(record && !id)"
            class="primary"
            :disabled="pending || error?.status === 409"
          >
            {{
              pending ? '正在保存…' : id ? '保存私有片段' : '投递到私有收件箱'
            }}</button
          ><button
            v-if="record && !id"
            type="button"
            class="secondary"
            :disabled="pending"
            @click="close"
          >
            完成</button
          ><button
            v-if="id"
            type="button"
            class="secondary"
            :disabled="pending"
            @click="refresh"
          >
            重新读取服务端版本
          </button>
        </div>
      </form>
      <div v-if="id && !readOnly" class="actions studio-section">
        <button
          v-if="record.status === 'READY'"
          class="secondary"
          :disabled="pending || dirty"
          @click="confirmation = 'hold'"
        >
          暂缓整理
        </button>
        <button
          v-if="record.status === 'HELD'"
          class="secondary"
          :disabled="pending || dirty"
          @click="confirmation = 'release'"
        >
          恢复并重新校验
        </button>
        <button
          class="text-btn"
          :disabled="pending || dirty"
          @click="confirmation = 'delete'"
        >
          删除片段
        </button>
      </div>
      <p v-if="dirty" class="mini">
        有未保存修改。状态操作前请先保存或重新读取。
      </p>
      <section v-if="confirmation" class="studio-confirm">
        <h3>
          {{
            confirmation === 'hold'
              ? '暂缓此片段'
              : confirmation === 'release'
                ? '恢复并重新校验'
                : '删除私有片段'
          }}
        </h3>
        <label v-if="confirmation === 'hold'"
          >暂缓原因<textarea
            v-model="reason"
            rows="2"
            :disabled="pending"
          ></textarea>
        </label>
        <p v-else>
          {{
            confirmation === 'release'
              ? '恢复会重新校验，可能仍为 HELD；成功响应不等于公开发布。'
              : '删除后片段不再参与整理。正在使用或已消费的片段由服务端拒绝删除。'
          }}
        </p>
        <div class="actions">
          <button
            class="primary"
            :disabled="pending || error?.status === 409"
            @click="perform"
          >
            确认{{ confirmation === 'delete' ? '删除' : '操作' }}</button
          ><button
            class="secondary"
            :disabled="pending"
            @click="confirmation = ''"
          >
            取消
          </button>
        </div>
      </section>
    </template>
  </ModalDialog>
</template>
