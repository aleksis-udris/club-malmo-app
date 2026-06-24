<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon?: string
  hint?: string
}>()
</script>

<template>
  <div class="rounded-2xl border border-primary-container bg-surface-container-lowest p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <p class="text-xs font-semibold uppercase tracking-wider text-outline">{{ label }}</p>
      <span v-if="icon" class="text-xl" v-html="icon" />
    </div>
    <p class="mt-2 text-3xl font-extrabold text-primary">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-outline">{{ hint }}</p>
  </div>
</template>
