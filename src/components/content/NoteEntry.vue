<script setup>
import { ref, watch } from 'vue'
import { publicApi } from '../../api'
import { useResource } from '../../composables/useResource'
import MarkdownRenderer from './MarkdownRenderer.vue'
import VerificationBadge from './VerificationBadge.vue'
import ResourceState from '../common/ResourceState.vue'
const props = defineProps({ note: Object, expanded: Boolean })
const open = ref(props.expanded)
watch(
  () => props.expanded,
  (value) => {
    if (value) open.value = true
  },
)
const detail = useResource(
  (signal) =>
    open.value
      ? props.note.content != null
        ? Promise.resolve(props.note)
        : publicApi.note(props.note.id, signal)
      : Promise.resolve(null),
  () => [open.value, props.note.id],
)
</script>
<template>
  <article :id="'note-' + note.id" class="note-card">
    <h3>{{ note.title }}</h3>
    <div class="tags">
      <span v-for="tool in note.sourceTools" :key="tool" class="badge"
        >来源 {{ tool }}</span
      ><VerificationBadge :verification="note.verification" /><span
        v-for="topic in note.topics"
        :key="topic"
        class="tag"
        >{{ topic }}</span
      >
    </div>
    <p>{{ note.excerpt }}</p>
    <button
      class="text-btn"
      :aria-expanded="open"
      :aria-controls="'note-body-' + note.id"
      @click="open = !open"
    >
      {{ open ? '收起手记 ↑' : '展开完整手记 ↓' }}
    </button>
    <div v-if="open" :id="'note-body-' + note.id" class="note-expand-content">
      <ResourceState
        :loading="detail.loading.value"
        :error="detail.error.value"
        @retry="detail.reload"
      /><MarkdownRenderer
        v-if="detail.data.value"
        :content="detail.data.value.content"
      />
      <p class="mini">
        {{ note.verification?.summary || '尚未提供公开验证说明。' }}
      </p>
    </div>
  </article>
</template>
