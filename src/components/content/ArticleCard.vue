<script setup>
import { dateLabel, contentPath } from '../../utils/content'
import VerificationBadge from './VerificationBadge.vue'
defineProps({ item: Object, featured: Boolean })
</script>
<template>
  <article v-if="featured" class="feature-card">
    <span class="eyebrow">精选长文 / SELECTED</span>
    <h3>
      <RouterLink :to="contentPath(item)">{{ item.title }}</RouterLink>
    </h3>
    <p>{{ item.excerpt }}</p>
    <div class="actions">
      <RouterLink class="primary" :to="contentPath(item)"
        >阅读完整手记 ↗</RouterLink
      ><VerificationBadge :verification="item.verification" />
    </div>
  </article>
  <article v-else class="article-row">
    <time class="article-date" :datetime="item.publishedAt"
      >{{ dateLabel(item.publishedAt).slice(0, 7)
      }}<strong>{{ dateLabel(item.publishedAt).slice(-2) }}</strong></time
    >
    <div>
      <h3>
        <RouterLink :to="contentPath(item)">{{ item.title }}</RouterLink>
      </h3>
      <p>{{ item.excerpt }}</p>
      <div class="tags">
        <span v-if="item.category" class="mini">{{ item.category.name }}</span
        ><span v-for="tag in item.tags" :key="tag.id" class="tag">{{
          tag.name
        }}</span
        ><VerificationBadge :verification="item.verification" />
      </div>
    </div>
    <RouterLink
      class="article-arrow"
      :to="contentPath(item)"
      :aria-label="'阅读：' + item.title"
      >↗</RouterLink
    >
  </article>
</template>
