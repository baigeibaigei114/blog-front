import { onMounted, onUnmounted } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
export function useUnsavedChanges(dirty, pending) {
  function canLeave() {
    if (pending.value) return false
    return !dirty.value || window.confirm('有未保存内容，确认放弃这些修改？')
  }
  onBeforeRouteLeave(canLeave)
  onBeforeRouteUpdate((to, from) => to.fullPath === from.fullPath || canLeave())
  function beforeUnload(event) {
    if (dirty.value || pending.value) {
      event.preventDefault()
      event.returnValue = ''
    }
  }
  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
  return { canLeave }
}
