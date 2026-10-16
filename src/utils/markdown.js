import MarkdownIt from 'markdown-it'
import { safeUrl } from './content'
const parser = new MarkdownIt({ html: false, linkify: true, typographer: true })
parser.validateLink = (value) => !!safeUrl(value)

// Parse to an explicit Vue node allowlist. Imported HTML never enters an HTML sink.
export function parseMarkdown(content) {
  const tokens = parser.parse(content || '', {})
  const headings = [],
    counts = new Map()
  tokens.forEach((token, index) => {
    if (token.type === 'heading_open' && ['h2', 'h3'].includes(token.tag)) {
      const title =
        tokens[index + 1]?.children?.map((t) => t.content).join('') || '章节'
      const slug =
        title
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, '-')
          .replace(/^-|-$/g, '') || 'section'
      const count = (counts.get(slug) || 0) + 1
      counts.set(slug, count)
      const id = `section-${slug}${count > 1 ? '-' + count : ''}`
      token.attrSet('id', id)
      headings.push({ id, title, level: Number(token.tag.slice(1)) })
    }
  })
  return { tokens, headings }
}
