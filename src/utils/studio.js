export const captureStates = {
  RECEIVED: '校验中',
  READY: '可整理',
  HELD: '已暂缓',
  INCLUDED: '已消费',
}
export const runStates = {
  PENDING: '等待运行',
  RUNNING: '运行中',
  SUCCEEDED: '成功',
  PARTIAL: '部分成功',
  FAILED: '失败',
  SKIPPED: '已跳过',
}
export const sourceOptions = ['CODEX', 'CLAUDE', 'GEMINI', 'MANUAL', 'OTHER']
export const verificationClaims = {
  UNVERIFIED: '未验证声明',
  CONCEPT_ONLY: '概念整理声明',
  TESTED: '工具声称实测（仍需核验）',
}
export const terminalRun = (status) =>
  ['SUCCEEDED', 'PARTIAL', 'FAILED', 'SKIPPED'].includes(status)
export const activeRun = (status) => ['PENDING', 'RUNNING'].includes(status)
export function businessDate(timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type).value)
    .join('-')
}
export function privateTime(value) {
  if (!value) return '未提供'
  const date = new Date(value)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        dateStyle: 'short',
        timeStyle: 'medium',
        hour12: false,
      }).format(date)
    : '日期不可用'
}
export function httpUrl(value) {
  if (!value) return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !/[\u0000-\u0020\\]/.test(value)
      ? url.href
      : null
  } catch {
    return null
  }
}
export function captureProblem(form) {
  if (!form.title.trim() || form.title.length > 200) return '标题需为 1–200 字'
  if (form.summary.length > 500) return '摘要最多 500 字'
  if (
    !form.body.trim() ||
    new TextEncoder().encode(form.body).length > 128 * 1024
  )
    return '正文需为 1–128 KiB UTF-8'
  if (form.topic.length > 64) return '主题最多 64 字'
  if (form.sourceUrl && !httpUrl(form.sourceUrl))
    return '来源链接仅接受不含用户名、密码的 HTTP(S) URL'
  return null
}
export const mutableCapture = (form) => ({
  title: form.title,
  summary: form.summary,
  body: form.body,
  topic: form.topic,
  sourceUrl: form.sourceUrl || null,
  verificationClaim: form.verificationClaim,
  evidenceRefs: [...form.evidenceRefs],
})
