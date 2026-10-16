<script setup>
import { computed, h, ref } from 'vue'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import json from 'highlight.js/lib/languages/json'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
for (const [name, language] of Object.entries({
  javascript,
  typescript,
  java,
  python,
  json,
  sql,
  bash,
}))
  hljs.registerLanguage(name, language)
const props = defineProps({ code: String, language: String })
const feedback = ref('')
const language = computed(
  () => props.language?.split(/\s/)[0].slice(0, 40) || 'text',
)
const lines = computed(() => props.code.replace(/\n$/, '').split('\n'))
function decode(text) {
  return text.replace(
    /&(amp|lt|gt|quot|#x27|#x2F|#39);/g,
    (_, key) =>
      ({
        amp: '&',
        lt: '<',
        gt: '>',
        quot: '"',
        '#x27': "'",
        '#39': "'",
        '#x2F': '/',
      })[key],
  )
}
function syntax(line) {
  if (!hljs.getLanguage(language.value)) return line
  const html = hljs.highlight(line, {
    language: language.value,
    ignoreIllegals: true,
  }).value
  // Only highlight.js span classes and text are accepted; never insert generated HTML.
  const root = [],
    stack = [root]
  for (const part of html.split(/(<span class="[^"]*">|<\/span>)/g)) {
    const match = part.match(/^<span class="([a-z0-9_ -]+)">$/i)
    if (match) {
      const children = []
      stack
        .at(-1)
        .push(
          h(
            'span',
            {
              class: match[1]
                .split(' ')
                .filter((v) => /^hljs-[a-z0-9_-]+$/.test(v)),
            },
            children,
          ),
        )
      stack.push(children)
    } else if (part === '</span>') {
      if (stack.length > 1) stack.pop()
    } else if (part) stack.at(-1).push(decode(part))
  }
  return root
}
const SyntaxLine = (_, { attrs }) => h('code', syntax(attrs.line))
async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    feedback.value = '已复制原始代码'
  } catch {
    feedback.value = '复制失败，请选中代码手动复制'
  }
}
</script>
<template>
  <div class="code-container">
    <div class="code-header">
      <span class="code-lang">{{ language.toUpperCase() }}</span
      ><button class="code-copy-btn" @click="copy" aria-label="复制原始代码">
        {{ feedback || '复制代码' }}
      </button>
    </div>
    <pre
      class="code-body"
      tabindex="0"
      aria-label="代码，可横向滚动"
    ><span v-for="(line,index) in lines" :key="index" class="code-line"><span class="code-line-num" aria-hidden="true">{{ index + 1 }}</span><SyntaxLine :line="line" /></span></pre>
    <span class="sr-only" role="status" aria-live="polite">{{ feedback }}</span>
  </div>
</template>
