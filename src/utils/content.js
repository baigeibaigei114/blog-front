export function dateLabel(value) {
  if (!value) return '暂无公开日期'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '日期不可用'
    : new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
        .format(date)
        .replaceAll('/', '.')
}
export function contentPath(item) {
  return item.kind === 'NOTE'
    ? { path: '/notes', query: { note: item.id } }
    : `/posts/${item.id}`
}
export function safeUrl(value, image = false) {
  if (
    typeof value !== 'string' ||
    !value ||
    /[\u0000-\u0020\u007f\\]/.test(value) ||
    value.startsWith('//')
  )
    return null
  try {
    const url = new URL(value, 'https://devblog.invalid/blog-front/')
    if (url.username || url.password) return null
    if (
      ['http:', 'https:'].includes(url.protocol) ||
      (!image && url.protocol === 'mailto:')
    )
      return value
  } catch {
    return null
  }
  return null
}
export function pageNumber(value) {
  return /^\d+$/.test(String(value))
    ? Math.max(1, Math.min(Number(value), 1000000))
    : 1
}
export function safeRedirect(value) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return '/admin/posts'
  if (
    /^\/admin\/login(?:[/?#]|$)/.test(value) ||
    value.startsWith('/blog-front/')
  )
    return '/admin/posts'
  return value
}
