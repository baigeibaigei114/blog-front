<script setup>
import { computed } from 'vue'
const props = defineProps({ verification: Object })
const state = computed(() => props.verification?.status || 'UNVERIFIED')
const labels = {
  UNVERIFIED: '未验证',
  CONCEPT_ONLY: '概念整理',
  TESTED: '有实测依据',
}
</script>
<template>
  <span
    class="badge"
    :class="{ warn: state === 'UNVERIFIED', amber: state === 'CONCEPT_ONLY' }"
    >{{ labels[state] || '未验证' }}</span
  >
</template>
