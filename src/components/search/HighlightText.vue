<script setup>
import { computed } from 'vue'
const props = defineProps({ text: String, query: String })
const parts = computed(() => {
  const text = props.text || '',
    q = props.query?.trim()
  if (!q) return [{ text, match: false }]
  const pieces = [],
    lower = text.toLocaleLowerCase(),
    needle = q.toLocaleLowerCase()
  let cursor = 0,
    index
  while ((index = lower.indexOf(needle, cursor)) !== -1) {
    if (index > cursor)
      pieces.push({ text: text.slice(cursor, index), match: false })
    pieces.push({ text: text.slice(index, index + q.length), match: true })
    cursor = index + q.length
  }
  pieces.push({ text: text.slice(cursor), match: false })
  return pieces
})
</script>
<template>
  <template v-for="(part, index) in parts" :key="index"
    ><mark v-if="part.match">{{ part.text }}</mark
    ><template v-else>{{ part.text }}</template></template
  >
</template>
