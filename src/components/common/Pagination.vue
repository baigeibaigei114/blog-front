<script setup>
defineProps({ page: Number, pages: Number })
defineEmits(['change'])
</script>
<template>
  <nav v-if="pages > 1" class="pagination" aria-label="分页">
    <button
      class="secondary"
      :disabled="page <= 1"
      @click="$emit('change', page - 1)"
    >
      ← 上一页</button
    ><span class="mini">{{ page }} / {{ pages }}</span
    ><button
      class="secondary"
      :disabled="page >= pages"
      @click="$emit('change', page + 1)"
    >
      下一页 →
    </button>
  </nav>
</template>
