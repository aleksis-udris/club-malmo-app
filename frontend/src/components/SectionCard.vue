<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-primary-container bg-surface-container-lowest shadow-sm">
    <header
      v-if="title || $slots.actions"
      class="flex flex-wrap items-center justify-between gap-3 border-b border-primary-container px-5 py-4"
    >
      <div>
        <h2 v-if="title" class="text-base font-bold text-on-surface">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-outline">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </header>
    <div class="p-1 sm:p-2">
      <slot />
    </div>
  </section>
</template>
