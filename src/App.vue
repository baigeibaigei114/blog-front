<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from './stores/app'
import { mockEnabled } from './api'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import CommandPalette from './components/search/CommandPalette.vue'
const app = useAppStore()
function keyboard(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    app.commandOpen = !app.commandOpen
  }
}
onMounted(() => window.addEventListener('keydown', keyboard))
onUnmounted(() => window.removeEventListener('keydown', keyboard))
</script>
<template>
  <a class="skip-link" href="#main">跳到主内容</a>
  <div class="edition-strip">
    <span>DEVBLOG / 技术手记</span
    ><span>{{
      mockEnabled
        ? '开发 MOCK · 演示内容与操作不连接真实服务'
        : 'A DEVELOPER’S FIELD NOTES'
    }}</span>
  </div>
  <AppHeader />
  <main id="main" class="wrap" tabindex="-1"><RouterView /></main>
  <AppFooter />
  <CommandPalette />
</template>
