<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function goToPost() {
  router.push({ name: 'PostDetail', params: { id: props.post.id } })
}
</script>

<template>
  <article class="post-item" @click="goToPost">
    <div class="post-item-header">
      <h2 class="post-item-title">{{ post.title }}</h2>
      <span class="post-item-date">{{ formatDate(post.createdAt) }}</span>
    </div>
    <p v-if="!compact" class="post-item-excerpt">{{ post.excerpt || post.summary }}</p>
    <div class="post-item-footer">
      <div class="post-item-tags">
        <span v-for="tag in (post.tags || [])" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <div class="post-item-meta">
        <span v-if="post.category">{{ post.category }}</span>
        <span>阅读 {{ post.views || 0 }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.post-item {
  padding: var(--spacing-lg);
  background-color: rgba(22, 27, 34, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  cursor: pointer;
}

.post-item:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-md);
}

.post-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.post-item-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  transition: color var(--transition-fast);
}

.post-item:hover .post-item-title {
  color: var(--color-accent);
}

.post-item-date {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.post-item-excerpt {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--spacing-md);
}

.post-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.post-item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.post-item-tags .tag {
  padding: 2px 8px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.post-item-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

@media (max-width: 600px) {
  .post-item-header {
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .post-item-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}
</style>