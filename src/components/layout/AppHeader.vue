<script setup>
import { useAppStore } from '../../stores/app'
import { useRoute } from 'vue-router'
const app = useAppStore()
const route = useRoute()
const links = [
  ['/', '首页'],
  ['/posts', '文章'],
  ['/notes', '学习日志'],
  ['/projects', '项目'],
  ['/about', '关于'],
]
</script>
<template>
  <header class="header wrap">
    <RouterLink to="/" class="brand" aria-label="DevBlog 首页"
      ><span class="brand-mark">d.</span><span class="brand-title">DevBlog</span
      ><span class="brand-tag">FIELD NOTES</span></RouterLink
    >
    <nav class="nav" aria-label="主导航">
      <RouterLink
        v-for="[to, label] in links"
        :key="to"
        :to="to"
        class="nav-link"
        :class="{ active: to === '/' ? route.path === '/' : route.path.startsWith(to) }"
        >{{ label }}</RouterLink
      >
    </nav>
    <div class="tools">
      <button
        class="cmd-shortcut"
        @click="app.commandOpen = true"
        aria-label="搜索与命令面板"
      >
        ⌕ <kbd>Ctrl K</kbd>
      </button>
      <button
        class="icon-btn mobile-search"
        @click="app.commandOpen = true"
        aria-label="搜索与命令面板"
      >
        ⌕
      </button>
      <button
        class="icon-btn"
        @click="app.toggleTheme"
        :aria-label="app.theme === 'light' ? '切换夜间主题' : '切换日间主题'"
      >
        {{ app.theme === 'light' ? '☾' : '☀' }}
      </button>
      <RouterLink to="/admin/studio" class="studio-pill">写作台 ↗</RouterLink>
    </div>
  </header>
</template>
