<script setup lang="ts">
/**
 * Unified loading / empty / error placeholder used across data views.
 * Keeps the three required states consistent and in one place.
 */
withDefaults(
  defineProps<{
    type: 'loading' | 'empty' | 'error'
    title?: string
    message?: string
  }>(),
  { title: '', message: '' },
)

const defaults = {
  loading: { icon: '⏳', title: 'Loading…', message: 'Fetching the latest data.' },
  empty: { icon: '📭', title: 'Nothing here yet', message: 'There is no data to display.' },
  error: { icon: '⚠️', title: 'Something went wrong', message: 'Unable to load this data.' },
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-brand-200 bg-white/60 px-6 py-14 text-center"
  >
    <span v-if="type === 'loading'" class="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    <span v-else class="text-4xl">{{ defaults[type].icon }}</span>
    <p class="text-base font-bold text-slate-700">{{ title || defaults[type].title }}</p>
    <p class="max-w-sm text-sm text-slate-500">{{ message || defaults[type].message }}</p>
    <slot />
  </div>
</template>
