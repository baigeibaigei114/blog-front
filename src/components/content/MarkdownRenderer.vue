<script>
import { h, computed, ref, watch, nextTick } from 'vue'
import { parseMarkdown } from '../../utils/markdown'
import { safeUrl } from '../../utils/content'
import { contentAssetUrl } from '../../api'
import CodeBlock from './CodeBlock.vue'

const blockTags = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'strong',
  'em',
  's',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
])
function renderTokens(tokens) {
  const root = [],
    stack = [{ children: root }]
  for (const token of tokens) {
    const children = stack.at(-1).children
    if (token.type === 'inline') {
      children.push(...renderTokens(token.children || []))
      continue
    }
    if (['fence', 'code_block'].includes(token.type)) {
      children.push(h(CodeBlock, { code: token.content, language: token.info }))
      continue
    }
    if (token.type === 'text' || token.type.startsWith('html_')) {
      children.push(token.content)
      continue
    }
    if (token.type === 'code_inline') {
      children.push(h('code', token.content))
      continue
    }
    if (token.type === 'softbreak') {
      children.push('\n')
      continue
    }
    if (token.type === 'hardbreak') {
      children.push(h('br'))
      continue
    }
    if (token.type === 'hr') {
      children.push(h('hr'))
      continue
    }
    if (token.type === 'image') {
      const src = safeUrl(contentAssetUrl(token.attrGet('src')), true)
      children.push(
        src
          ? h('img', {
              src,
              alt: token.content,
              loading: 'lazy',
              referrerpolicy: 'no-referrer',
            })
          : token.content,
      )
      continue
    }
    if (token.nesting === 1) {
      let tag = blockTags.has(token.tag) ? token.tag : 'span'
      const attrs = {},
        nested = []
      if (token.type === 'link_open') {
        const href = safeUrl(contentAssetUrl(token.attrGet('href')))
        tag = href ? 'a' : 'span'
        if (href) {
          attrs.href = href
          if (/^https?:/i.test(href)) {
            attrs.target = '_blank'
            attrs.rel = 'noopener noreferrer'
          }
        }
      }
      if (token.type === 'heading_open') {
        attrs.id = token.attrGet('id')
        attrs.tabindex = '-1'
      }
      if (token.tag === 'ol' && token.attrGet('start'))
        attrs.start = Number(token.attrGet('start'))
      let vnode = h(tag, attrs, nested)
      if (tag === 'table')
        vnode = h(
          'div',
          {
            class: 'table-scroll',
            tabindex: 0,
            role: 'region',
            'aria-label': '表格，可横向滚动',
          },
          [vnode],
        )
      children.push(vnode)
      stack.push({ children: nested })
    } else if (token.nesting === -1 && stack.length > 1) stack.pop()
  }
  return root
}
export default {
  props: { content: { type: String, default: '' } },
  emits: ['headings', 'ready'],
  setup(props, { emit, expose }) {
    const root = ref(null)
    const parsed = computed(() => parseMarkdown(props.content))
    watch(
      parsed,
      async (value) => {
        emit('headings', value.headings)
        await nextTick()
        emit('ready')
      },
      { immediate: true },
    )
    expose({ root })
    return () =>
      h('div', { ref: root, class: 'prose' }, renderTokens(parsed.value.tokens))
  },
}
</script>
