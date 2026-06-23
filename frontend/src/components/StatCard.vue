<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon?: string
  hint?: string
}>()
</script>

<template>
  <div class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">{{ label }}</p>
      <span v-if="icon" class="text-xl">{{ icon }}</span>
    </div>
    <p class="mt-2 text-3xl font-extrabold text-brand-700">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-slate-400">{{ hint }}</p>
  </div>
</template>
