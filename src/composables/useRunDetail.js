import { ref, shallowRef, watch, onMounted, onScopeDispose } from 'vue'
import { studioApi } from '../api/studio'
import { activeRun } from '../utils/studio'
export function useRunDetail(id) {
  const data = shallowRef(null),
    error = shallowRef(null),
    loading = ref(false),
    polling = ref(false)
  let timer,
    controller,
    sequence = 0,
    disposed = false
  function stop() {
    clearTimeout(timer)
    controller?.abort()
    sequence++
    polling.value = false
    loading.value = false
  }
  async function reload(quiet = false) {
    stop()
    if (!id.value || disposed) return
    const current = sequence,
      requestedId = id.value
    controller = new AbortController()
    const signal = controller.signal
    if (!quiet) loading.value = true
    error.value = null
    try {
      const result = await studioApi.run(requestedId, signal)
      if (current !== sequence || disposed) return
      data.value = result
      if (activeRun(result.status) && !document.hidden) {
        polling.value = true
        timer = setTimeout(() => reload(true), 3000)
      }
    } catch (failure) {
      if (current === sequence && !signal.aborted) error.value = failure
    } finally {
      if (current === sequence) loading.value = false
    }
  }
  watch(
    id,
    () => {
      data.value = null
      reload()
    },
    { immediate: true },
  )
  function visibility() {
    if (document.hidden) stop()
    else if (
      id.value &&
      (!data.value || activeRun(data.value.status)) &&
      !error.value
    )
      reload(true)
  }
  onMounted(() => document.addEventListener('visibilitychange', visibility))
  onScopeDispose(() => {
    disposed = true
    stop()
    document.removeEventListener('visibilitychange', visibility)
  })
  return { data, error, loading, polling, reload }
}
