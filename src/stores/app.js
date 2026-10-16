import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useAppStore = defineStore('app', () => {
  const theme = ref(
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )
  const commandOpen = ref(false)
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme.value
    try {
      localStorage.setItem('devblog_theme', theme.value)
    } catch {
      /* Keep the in-memory preference. */
    }
  }
  return { theme, commandOpen, toggleTheme }
})
