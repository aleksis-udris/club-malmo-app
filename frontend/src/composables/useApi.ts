import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import { apiGet } from '@/api/client'

/**
 * Fetches data from the backend API with loading / error states. Accepts either
 * a fixed path or a getter `() => path`; when the getter's result changes (e.g.
 * the selected season changes) it automatically re-fetches.
 */
export function useApi<T>(pathInput: string | (() => string)) {
  const pathRef = computed(() => (typeof pathInput === 'function' ? pathInput() : pathInput))
  const data = shallowRef<T | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  let controller: AbortController | null = null

  async function run() {
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    error.value = null
    data.value = null
    try {
      data.value = await apiGet<T>(pathRef.value, controller.signal)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  watch(pathRef, run)
  run()
  onUnmounted(() => controller?.abort())

  return { data, loading, error, retry: run }
}
