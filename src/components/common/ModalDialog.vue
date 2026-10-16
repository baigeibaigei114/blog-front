<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
const props = defineProps({ open: Boolean, title: String, drawer: Boolean })
const emit = defineEmits(['close'])
const dialog = ref(null)
let previousFocus, previousOverflow
function release() {
  if (previousOverflow !== undefined) {
    document.body.style.overflow = previousOverflow
    previousOverflow = undefined
  }
  if (previousFocus) {
    if (previousFocus.isConnected) previousFocus.focus()
    else document.getElementById('main')?.focus({ preventScroll: true })
    previousFocus = null
  }
}
watch(
  () => props.open,
  async (open) => {
    await nextTick()
    if (!dialog.value || open !== props.open) return
    if (open) {
      previousFocus = document.activeElement
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      dialog.value.showModal()
      const initial =
        dialog.value.querySelector('[autofocus]') ||
        dialog.value.querySelector('input,button,a')
      initial?.focus()
    } else if (dialog.value?.open) {
      dialog.value.close()
      release()
    }
  },
  { immediate: true },
)
function trap(event) {
  if (event.key !== 'Tab') return
  const nodes = [
    ...dialog.value.querySelectorAll(
      'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
    ),
  ].filter((el) => el.getClientRects().length)
  const first = nodes[0],
    last = nodes.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
onUnmounted(release)
</script>
<template>
  <dialog
    ref="dialog"
    :class="{ 'drawer-dialog': drawer }"
    aria-modal="true"
    :aria-label="title"
    @cancel.prevent="emit('close')"
    @keydown="trap"
    @click="
      (event) => {
        if (event.target === dialog) emit('close')
      }
    "
  >
    <div class="modal-header">
      <h2>{{ title }}</h2>
      <button class="icon-btn" aria-label="关闭弹窗" @click="emit('close')">
        ×
      </button>
    </div>
    <div class="modal-body"><slot /></div>
  </dialog>
</template>
