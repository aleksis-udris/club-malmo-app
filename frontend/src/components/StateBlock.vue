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
  loading: { icon: '<span class="icon" aria-hidden="true">hourglass_empty</span>', title: 'Loading…', message: 'Fetching the latest data.' },
  empty: { icon: '<span class="icon" aria-hidden="true">inbox</span>', title: 'Nothing here yet', message: 'There is no data to display.' },
  error: { icon: '<span class="icon" aria-hidden="true">warning</span>', title: 'Something went wrong', message: 'Unable to load this data.' },
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary-container bg-surface-container-lowest/60 px-6 py-14 text-center"
  >
    <span
      v-if="type === 'loading'"
      class="h-10 w-10 animate-spin rounded-full border-4 border-primary-container border-t-primary"
    />
    <span v-else class="text-4xl" v-html="defaults[type].icon" />
    <p class="text-base font-bold text-on-surface">{{ title || defaults[type].title }}</p>
    <p class="max-w-sm text-sm text-on-surface-variant">{{ message || defaults[type].message }}</p>
    <slot />
  </div>
</template>
