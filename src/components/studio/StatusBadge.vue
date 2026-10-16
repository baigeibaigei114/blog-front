<script setup>
import { captureStates, runStates } from '../../utils/studio'
defineProps({ status: String, run: Boolean })
</script>
<template>
  <span
    class="badge"
    :class="{
      warn: ['FAILED', 'HELD'].includes(status),
      amber: ['PENDING', 'RUNNING', 'RECEIVED', 'PARTIAL'].includes(status),
    }"
    >{{
      (run ? runStates : captureStates)[status] || status || '状态未提供'
    }}</span
  >
</template>
