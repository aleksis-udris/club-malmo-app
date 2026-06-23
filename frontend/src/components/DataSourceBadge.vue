<script setup lang="ts">
import { computed } from 'vue'
import { useApi } from '@/composables/useApi'

interface Meta {
  source: 'sportradar' | 'empty'
  sportradarEnabled: boolean
}

const { data, loading, error } = useApi<Meta>('/content/meta')

const state = computed(() => {
  if (loading.value) return { label: 'Connecting…', cls: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' }
  if (error.value) return { label: 'API offline', cls: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' }
  if (data.value?.source === 'sportradar')
    return { label: 'Live · Sportradar v2', cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' }
  return { label: 'API · no data (add key)', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' }
})
</script>

<template>
  <div
    class="pointer-events-none fixed bottom-3 right-3 z-20 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
    :class="state.cls"
    :title="error || ''"
  >
    <span class="h-2 w-2 rounded-full" :class="state.dot" />
    {{ state.label }}
  </div>
</template>
