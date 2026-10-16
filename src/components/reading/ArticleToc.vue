<script setup>
defineProps({ headings: Array, active: String })
defineEmits(['select'])
</script>
<template>
  <nav aria-label="文章章节">
    <a
      v-for="heading in headings"
      :key="heading.id"
      :href="'#' + heading.id"
      class="toc-link"
      :class="{ active: active === heading.id, sub: heading.level === 3 }"
      :aria-current="active === heading.id ? 'location' : undefined"
      @click.prevent="$emit('select', heading.id)"
      >{{ heading.title }}</a
    >
    <p v-if="!headings.length" class="mini">本文没有二级或三级标题。</p>
  </nav>
</template>
