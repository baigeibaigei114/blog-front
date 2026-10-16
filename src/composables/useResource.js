import { ref, shallowRef, watch, onScopeDispose } from 'vue'
export function useResource(loader, source = () => true) {
  const data = shallowRef(null),
    error = shallowRef(null),
    loading = ref(false)
  let controller,
    sequence = 0
  async function reload() {
    controller?.abort()
    controller = new AbortController()
    const active = controller
    const current = ++sequence
    loading.value = true
    error.value = null
    data.value = null
    try {
      const result = await loader(active.signal)
      if (current === sequence) data.value = result
    } catch (failure) {
      if (current === sequence && !active.signal.aborted) error.value = failure
    } finally {
      if (current === sequence) loading.value = false
    }
  }
  watch(source, reload, { immediate: true, deep: true })
  onScopeDispose(() => {
    sequence++
    controller?.abort()
  })
  return { data, error, loading, reload }
}
