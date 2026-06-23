import { onUnmounted, ref, shallowRef } from 'vue'
import { apiGet } from '@/api/client'

/**
 * Fetches data from the backend API with loading / error / empty states.
 * Drop-in replacement for the former useMockFetch (same return shape).
 */
export function useApi<T>(path: string) {
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
      data.value = await apiGet<T>(path, controller.signal)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  run()
  onUnmounted(() => controller?.abort())

  return { data, loading, error, retry: run }
}
