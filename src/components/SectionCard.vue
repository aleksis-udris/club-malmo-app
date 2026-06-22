<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
    <header
      v-if="title || $slots.actions"
      class="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 px-5 py-4"
    >
      <div>
        <h2 v-if="title" class="text-base font-bold text-slate-800">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-slate-400">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </header>
    <div class="p-1 sm:p-2">
      <slot />
    </div>
  </section>
</template>
