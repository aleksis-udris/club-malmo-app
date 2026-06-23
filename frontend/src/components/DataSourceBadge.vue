<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { apiGet } from '@/api/client'

interface Meta {
  source: 'sportradar' | 'empty'
  sportradarEnabled: boolean
}

// Self-correcting status: re-checks /content/meta every 10s so the badge recovers
// when the backend restarts (e.g. during `nest start --watch`) instead of getting
// stuck on a stale "offline".
const meta = ref<Meta | null>(null)
const checked = ref(false)
const online = ref(true)

async function check() {
  try {
    meta.value = await apiGet<Meta>('/content/meta')
    online.value = true
  } catch {
    online.value = false
  } finally {
    checked.value = true
  }
}

let timer: number | undefined
onMounted(() => {
  check()
  timer = window.setInterval(check, 10000)
})
onBeforeUnmount(() => window.clearInterval(timer))

const state = computed(() => {
  if (!checked.value) return { label: 'Connecting…', cls: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' }
  if (!online.value)
    return { label: 'API offline', cls: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' }
  if (meta.value?.source === 'sportradar')
    return { label: 'Live · Sportradar v2', cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' }
  return { label: 'API · no data (add key)', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' }
})
</script>

<template>
  <div
    class="pointer-events-none fixed bottom-3 right-3 z-20 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
    :class="state.cls"
  >
    <span class="h-2 w-2 rounded-full" :class="state.dot" />
    {{ state.label }}
  </div>
</template>
